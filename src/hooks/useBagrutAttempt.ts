// Hook لإدارة محاولة امتحان البجروت
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logging';
import { useToast } from '@/hooks/use-toast';
import type { ParsedQuestion, ParsedSection } from '@/lib/bagrut/buildBagrutPreview';

export interface BagrutExamData {
  exam: {
    id: string;
    title: string;
    subject: string;
    exam_year: number;
    exam_season: string;
    duration_minutes: number;
    total_points: number;
    instructions: string | null;
    max_attempts: number;
    show_answers_to_students: boolean;
    allow_review_after_submit: boolean;
    // نوع هيكل الامتحان: standard = إلزامي + اختياري، all_mandatory = جميع الأقسام إلزامية
    exam_structure_type: 'standard' | 'all_mandatory';
  };
  sections: ParsedSection[];
  attempt: {
    id: string;
    status: string;
    started_at: string;
    attempt_number: number;
    selected_section_ids: string[] | null;
    answers: Record<string, any>;
    time_spent_seconds: number;
  } | null;
  can_start: boolean;
  attempts_used: number;
  attempts_remaining: number;
}

export interface BagrutAnswer {
  answer: string | string[] | Record<string, string>;
  time_spent_seconds?: number;
}

export function useBagrutAttempt(examId: string | undefined, studentId: string | undefined, previewMode = false) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [attemptStartedAt, setAttemptStartedAt] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, BagrutAnswer>>({});
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([]);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedSaveRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedAnswersRef = useRef<string>('');
  const hasAutoSubmittedRef = useRef<boolean>(false);
  const answersRef = useRef<Record<string, BagrutAnswer>>({});

  // جلب بيانات الامتحان والأقسام
  const examQuery = useQuery({
    queryKey: ['bagrut-exam-attempt', examId, studentId],
    queryFn: async (): Promise<BagrutExamData> => {
      if (!examId || !studentId) throw new Error('معرف الامتحان أو الطالب مفقود');

      logger.debug('جلب بيانات امتحان البجروت للحل', { examId, studentId });

      // جلب الامتحان
      let examQuery = supabase
        .from('bagrut_exams')
        .select('*')
        .eq('id', examId);
      if (!previewMode) {
        examQuery = examQuery.eq('is_published', true);
      }
      const { data: exam, error: examError } = await examQuery.single();

      if (examError) throw examError;
      if (!exam) throw new Error('الامتحان غير موجود أو غير منشور');

      // جلب الأقسام
      const { data: sections, error: sectionsError } = await supabase
        .from('bagrut_exam_sections')
        .select('*')
        .eq('exam_id', examId)
        .order('order_index', { ascending: true });

      if (sectionsError) throw sectionsError;

      // جلب الأسئلة لكل قسم
      const { data: questions, error: questionsError } = await supabase
        .from('bagrut_questions')
        .select('*')
        .eq('exam_id', examId)
        .order('order_index', { ascending: true });

      if (questionsError) throw questionsError;

      // تنظيم الأسئلة حسب الأقسام
      const sectionsWithQuestions: ParsedSection[] = (sections || []).map(section => {
        const sectionQuestions = (questions || [])
          .filter(q => q.section_id === section.id && !q.parent_question_id)
          .map(q => mapDbQuestionToParsed(q, questions || []));

        return {
          section_number: section.section_number,
          section_title: section.section_title,
          section_type: section.section_type as 'mandatory' | 'elective',
          total_points: section.total_points,
          specialization: section.specialization || undefined,
          specialization_label: section.specialization_label || undefined,
          instructions: section.instructions || undefined,
          min_questions_to_answer: section.min_questions_to_answer || undefined,
          max_questions_to_answer: section.max_questions_to_answer || undefined,
          questions: sectionQuestions,
          section_db_id: section.id,
        };
      });

      // جلب محاولات الطالب (يتجاهل في وضع المعاينة)
      let submittedCount = 0;
      let inProgressAttempt: any = null;
      const maxAttempts = exam.max_attempts || 1;

      if (!previewMode) {
        const { data: attempts } = await supabase
          .from('bagrut_attempts')
          .select('*')
          .eq('exam_id', examId)
          .eq('student_id', studentId)
          .order('created_at', { ascending: false });

        submittedCount = (attempts || []).filter(
          a => a.status === 'submitted' || a.status === 'graded'
        ).length;

        inProgressAttempt = (attempts || []).find(a => a.status === 'in_progress');
      }
      
      // تحديد نوع هيكل الامتحان
      const examStructureType = (exam as any).exam_structure_type || 'standard';

      return {
        exam: {
          id: exam.id,
          title: exam.title,
          subject: exam.subject,
          exam_year: exam.exam_year,
          exam_season: exam.exam_season,
          duration_minutes: exam.duration_minutes || 180,
          total_points: exam.total_points || 100,
          instructions: exam.instructions,
          max_attempts: maxAttempts,
          show_answers_to_students: exam.show_answers_to_students || false,
          allow_review_after_submit: exam.allow_review_after_submit ?? true,
          exam_structure_type: examStructureType as 'standard' | 'all_mandatory',
        },
        sections: sectionsWithQuestions,
        attempt: inProgressAttempt ? {
          id: inProgressAttempt.id,
          status: inProgressAttempt.status || 'in_progress',
          started_at: inProgressAttempt.started_at || inProgressAttempt.created_at || new Date().toISOString(),
          attempt_number: inProgressAttempt.attempt_number || 1,
          selected_section_ids: inProgressAttempt.selected_section_ids,
          answers: (inProgressAttempt.answers as Record<string, any>) || {},
          time_spent_seconds: inProgressAttempt.time_spent_seconds || 0,
        } : null,
        can_start: previewMode || submittedCount < maxAttempts || !!inProgressAttempt,
        attempts_used: submittedCount,
        attempts_remaining: Math.max(0, maxAttempts - submittedCount),
      };
    },
    enabled: !!examId && !!studentId,
    staleTime: 30000,
  });

  // تحميل البيانات من المحاولة الموجودة
  useEffect(() => {
    if (examQuery.data?.attempt) {
      const attempt = examQuery.data.attempt;
      setAttemptId(attempt.id);
      setAttemptStartedAt(attempt.started_at);
      setAnswers(attempt.answers || {});
      setSelectedSectionIds(attempt.selected_section_ids || []);
      lastSavedAnswersRef.current = JSON.stringify(attempt.answers || {});
    }
  }, [examQuery.data?.attempt]);

  // إنشاء محاولة جديدة
  const createAttemptMutation = useMutation({
    mutationFn: async (sectionIds: string[]) => {
      if (!examId || !studentId) throw new Error('بيانات مفقودة');

      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('user_id', studentId)
        .single();

      const attemptNumber = (examQuery.data?.attempts_used || 0) + 1;

      const { data, error } = await supabase
        .from('bagrut_attempts')
        .insert({
          exam_id: examId,
          student_id: studentId,
          school_id: profile?.school_id,
          status: 'in_progress',
          attempt_number: attemptNumber,
          selected_section_ids: sectionIds,
          answers: {},
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setAttemptId(data.id);
      setAttemptStartedAt(data.started_at || data.created_at);
      setSelectedSectionIds(data.selected_section_ids || []);
      queryClient.invalidateQueries({ queryKey: ['bagrut-exam-attempt', examId] });
      toast({
        title: 'بدأ الامتحان',
        description: 'حظاً موفقاً!',
      });
    },
    onError: (error: any) => {
      logger.error('فشل إنشاء المحاولة', error);
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في بدء الامتحان',
        variant: 'destructive',
      });
    },
  });

  // حفظ الإجابات
  const saveAnswersMutation = useMutation({
    mutationFn: async (currentAnswers: Record<string, BagrutAnswer>) => {
      if (!attemptId) throw new Error('لا توجد محاولة نشطة');

      const { error } = await supabase
        .from('bagrut_attempts')
        .update({
          answers: currentAnswers as any,
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', attemptId);

      if (error) throw error;
      return currentAnswers;
    },
    onSuccess: (savedAnswers) => {
      lastSavedAnswersRef.current = JSON.stringify(savedAnswers);
      logger.debug('تم حفظ الإجابات');
    },
  });

  // تقديم الامتحان
  const submitExamMutation = useMutation({
    mutationFn: async () => {
      if (!attemptId) throw new Error('لا توجد محاولة نشطة');

      // حفظ الإجابات أولاً
      await saveAnswersMutation.mutateAsync(answers);

      // تحديث الحالة إلى submitted
      const { error } = await supabase
        .from('bagrut_attempts')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          answers: answers as any,
        })
        .eq('id', attemptId);

      if (error) throw error;

      return { attemptId, answersCount: Object.keys(answers).length };
    },
    onSuccess: () => {
      // لا نقوم بـ invalidate هنا لتجنب race condition مع التوجيه
      // سيتم invalidate في صفحة التأكيد
      toast({
        title: 'تم تقديم الامتحان',
        description: 'سيتم مراجعة إجاباتك قريباً',
      });
    },
    onError: (error: any) => {
      logger.error('فشل تقديم الامتحان', error);
      toast({
        title: 'خطأ في التقديم',
        description: error.message || 'حدث خطأ أثناء تقديم الامتحان',
        variant: 'destructive',
      });
    },
  });

  // تحديث ref الإجابات عند كل تغيير
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // الحفظ التلقائي الدوري - كل 30 ثانية (مستقل عن تغييرات الإجابات)
  useEffect(() => {
    if (!attemptId || previewMode) return;

    autoSaveTimerRef.current = setInterval(() => {
      const currentAnswers = answersRef.current;
      const currentAnswersStr = JSON.stringify(currentAnswers);
      if (currentAnswersStr !== lastSavedAnswersRef.current && Object.keys(currentAnswers).length > 0) {
        logger.debug('حفظ تلقائي دوري للإجابات');
        saveAnswersMutation.mutate(currentAnswers);
      }
    }, 30000); // كل 30 ثانية

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [attemptId]); // فقط attemptId - لا يعتمد على answers

  // حفظ ذكي بعد 5 ثواني من آخر تغيير (debounced)
  useEffect(() => {
    if (!attemptId || previewMode || Object.keys(answers).length === 0) return;

    // إلغاء أي حفظ مؤجل سابق
    if (debouncedSaveRef.current) {
      clearTimeout(debouncedSaveRef.current);
    }

    // حفظ بعد 5 ثواني من آخر تغيير
    debouncedSaveRef.current = setTimeout(() => {
      const currentAnswersStr = JSON.stringify(answers);
      if (currentAnswersStr !== lastSavedAnswersRef.current) {
        logger.debug('حفظ ذكي للإجابات بعد تغيير');
        saveAnswersMutation.mutate(answers);
      }
    }, 5000);

    return () => {
      if (debouncedSaveRef.current) {
        clearTimeout(debouncedSaveRef.current);
      }
    };
  }, [attemptId, answers]);

  // حماية عند إغلاق الصفحة أو المتصفح
  useEffect(() => {
    if (!attemptId) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const currentAnswersStr = JSON.stringify(answersRef.current);
      if (currentAnswersStr !== lastSavedAnswersRef.current && Object.keys(answersRef.current).length > 0) {
        // محاولة حفظ سريعة باستخدام sendBeacon
        const supabaseUrl = 'https://swlwhjnwycvjdhgclwlx.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3bHdoam53eWN2amRoZ2Nsd2x4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMDU4MzgsImV4cCI6MjA3MDg4MTgzOH0.whMWEn_UIrxBa2QbK1leY9QTr1jeTnkUUn3g50fAKus';
        
        const payload = JSON.stringify({
          answers: answersRef.current,
          last_activity_at: new Date().toISOString()
        });

        navigator.sendBeacon?.(
          `${supabaseUrl}/rest/v1/bagrut_attempts?id=eq.${attemptId}`,
          new Blob([payload], { type: 'application/json' })
        );

        logger.info('محاولة حفظ طوارئ عند إغلاق الصفحة');
        e.preventDefault();
        e.returnValue = 'لديك إجابات غير محفوظة. هل أنت متأكد من المغادرة؟';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [attemptId]);

  // دالة مساعدة: إيجاد القسم الذي ينتمي له سؤال (بحث عودي يشمل الأسئلة الفرعية)
  const findSectionForQuestion = useCallback((questionId: string): ParsedSection | null => {
    if (!examQuery.data) return null;
    const findInQuestions = (questions: ParsedQuestion[]): boolean => {
      for (const q of questions) {
        if ((q.question_db_id || q.question_number) === questionId) return true;
        if (q.sub_questions && findInQuestions(q.sub_questions)) return true;
      }
      return false;
    };
    for (const section of examQuery.data.sections) {
      if (selectedSectionIds.includes(section.section_db_id!) && findInQuestions(section.questions)) {
        return section;
      }
    }
    return null;
  }, [examQuery.data, selectedSectionIds]);

  // دالة مساعدة: إيجاد السؤال الجذر لسؤال فرعي
  const findRootQuestionId = useCallback((questionId: string, section: ParsedSection): string | null => {
    const findRoot = (questions: ParsedQuestion[], rootId: string | null): string | null => {
      for (const q of questions) {
        const qId = q.question_db_id || q.question_number;
        const currentRoot = rootId || qId;
        if (qId === questionId) return currentRoot;
        if (q.sub_questions) {
          const found = findRoot(q.sub_questions, currentRoot);
          if (found) return found;
        }
      }
      return null;
    };
    return findRoot(section.questions, null);
  }, []);

  // دالة مساعدة: جمع كل IDs الأسئلة الفرعية لسؤال جذر
  const collectAllSubIds = useCallback((question: ParsedQuestion): string[] => {
    const ids: string[] = [];
    const collect = (q: ParsedQuestion) => {
      ids.push(q.question_db_id || q.question_number);
      q.sub_questions?.forEach(collect);
    };
    collect(question);
    return ids;
  }, []);

  // دالة مساعدة: حساب عدد الأسئلة الجذر المجابة في قسم معين
  const getAnsweredRootCountInSection = useCallback((section: ParsedSection, currentAnswers: Record<string, BagrutAnswer>): number => {
    let count = 0;
    for (const rootQ of section.questions) {
      const allIds = collectAllSubIds(rootQ);
      // السؤال الجذر محسوب إذا تمت الإجابة على أي من أسئلته (هو أو فرعياته)
      const hasAnyAnswer = allIds.some(id => currentAnswers[id]?.answer);
      if (hasAnyAnswer) count++;
    }
    return count;
  }, [collectAllSubIds]);

  // تحديث إجابة مع فرض حد N-of-M
  const updateAnswer = useCallback((questionId: string, answer: BagrutAnswer) => {
    setAnswers(prev => {
      const section = findSectionForQuestion(questionId);
      const maxQ = section?.max_questions_to_answer;

      // إذا لا يوجد حد، أو الإجابة فارغة (حذف)، نسمح دائماً
      if (!section || !maxQ || !answer.answer) {
        return { ...prev, [questionId]: answer };
      }

      // إيجاد السؤال الجذر لهذا السؤال
      const rootId = findRootQuestionId(questionId, section);

      // التحقق إذا السؤال الجذر مجاب مسبقاً (تعديل وليس إضافة جديدة)
      if (rootId) {
        const rootQ = section.questions.find(q => (q.question_db_id || q.question_number) === rootId);
        if (rootQ) {
          const allIds = collectAllSubIds(rootQ);
          const alreadyAnswered = allIds.some(id => prev[id]?.answer);
          if (alreadyAnswered) {
            // تعديل إجابة موجودة — مسموح
            return { ...prev, [questionId]: answer };
          }
        }
      }

      // حساب عدد الأسئلة الجذر المجابة حالياً
      const answeredCount = getAnsweredRootCountInSection(section, prev);
      if (answeredCount >= maxQ) {
        // وصلنا للحد — نرفض
        toast({
          title: `⚠️ وصلت للحد الأقصى (${maxQ} أسئلة)`,
          description: 'لإضافة إجابة جديدة، احذف إجابة سؤال آخر في هذا القسم أولاً',
          variant: 'destructive',
        });
        return prev; // لا تغيير
      }

      return { ...prev, [questionId]: answer };
    });
  }, [findSectionForQuestion, findRootQuestionId, collectAllSubIds, getAnsweredRootCountInSection, toast]);

  // بدء الامتحان
  const startExam = useCallback((sectionIds: string[]) => {
    setSelectedSectionIds(sectionIds);
    if (previewMode) {
      setAttemptId('preview');
      setAttemptStartedAt(new Date().toISOString());
    } else {
      createAttemptMutation.mutate(sectionIds);
    }
  }, [createAttemptMutation, previewMode]);

  // تقديم الامتحان
  const submitExam = useCallback(() => {
    if (previewMode) return;
    submitExamMutation.mutate();
  }, [submitExamMutation, previewMode]);

  // حفظ يدوي
  const saveAnswers = useCallback(() => {
    if (previewMode) return;
    saveAnswersMutation.mutate(answers);
  }, [answers, saveAnswersMutation, previewMode]);

  // حساب إذا انتهى وقت المحاولة (يستمر حتى لو خرج الطالب من الصفحة)
  const isTimeExpired = useMemo(() => {
    if (!attemptStartedAt || !examQuery.data?.exam.duration_minutes) return false;
    const startTime = new Date(attemptStartedAt).getTime();
    const durationMs = examQuery.data.exam.duration_minutes * 60 * 1000;
    const endTime = startTime + durationMs;
    return Date.now() > endTime;
  }, [attemptStartedAt, examQuery.data?.exam.duration_minutes]);

  // حساب الوقت المتبقي بالثواني
  const remainingSeconds = useMemo(() => {
    if (!attemptStartedAt || !examQuery.data?.exam.duration_minutes) return 0;
    const startTime = new Date(attemptStartedAt).getTime();
    const durationMs = examQuery.data.exam.duration_minutes * 60 * 1000;
    const endTime = startTime + durationMs;
    const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
    return remaining;
  }, [attemptStartedAt, examQuery.data?.exam.duration_minutes]);

  // تقديم تلقائي عند انتهاء الوقت
  const autoSubmitOnTimeExpired = useCallback(() => {
    if (previewMode) return;
    if (isTimeExpired && attemptId && !hasAutoSubmittedRef.current && !submitExamMutation.isPending) {
      hasAutoSubmittedRef.current = true;
      logger.info('تقديم تلقائي - انتهى وقت الامتحان');
      toast({
        title: 'انتهى وقت الامتحان',
        description: 'تم تقديم إجاباتك تلقائياً',
        variant: 'destructive',
      });
      submitExamMutation.mutate();
    }
  }, [isTimeExpired, attemptId, submitExamMutation, toast]);

  // تنفيذ التقديم التلقائي عند انتهاء الوقت
  useEffect(() => {
    autoSubmitOnTimeExpired();
  }, [autoSubmitOnTimeExpired]);

  return {
    examData: examQuery.data,
    isLoading: examQuery.isLoading,
    isError: examQuery.isError,
    error: examQuery.error,
    attemptId,
    attemptStartedAt,
    answers,
    selectedSectionIds,
    updateAnswer,
    startExam,
    submitExam,
    saveAnswers,
    isCreatingAttempt: createAttemptMutation.isPending,
    isSaving: saveAnswersMutation.isPending,
    isSubmitting: submitExamMutation.isPending,
    isSubmitted: submitExamMutation.isSuccess,
    isTimeExpired,
    remainingSeconds,
    previewMode,
    // دوال مساعدة لحد N-of-M (تُستخدم في واجهة الطالب)
    findSectionForQuestion,
    getAnsweredRootCountInSection,
    collectAllSubIds,
  };
}

// Helper: تحويل سؤال من قاعدة البيانات إلى الشكل المطلوب
function mapDbQuestionToParsed(dbQ: any, allQuestions: any[]): ParsedQuestion {
  const subQuestions = allQuestions
    .filter(q => q.parent_question_id === dbQ.id)
    .map(sq => mapDbQuestionToParsed(sq, allQuestions));

  return {
    question_number: dbQ.question_number,
    question_text: dbQ.question_text,
    question_type: dbQ.question_type,
    points: dbQ.points,
    has_image: dbQ.has_image || false,
    image_url: dbQ.image_url || undefined,
    image_description: dbQ.image_alt_text || undefined,
    has_table: dbQ.has_table || false,
    table_data: dbQ.table_data || undefined,
    has_code: dbQ.has_code || false,
    code_content: dbQ.code_content || undefined,
    choices: dbQ.choices || undefined,
    correct_answer: dbQ.correct_answer || undefined,
    correct_answer_data: dbQ.correct_answer_data || undefined,
    answer_explanation: dbQ.answer_explanation || undefined,
    blanks: dbQ.correct_answer_data?.blanks || undefined,
    word_bank: dbQ.correct_answer_data?.word_bank || undefined,
    topic_tags: dbQ.topic_tags || undefined,
    sub_questions: subQuestions.length > 0 ? subQuestions : undefined,
    question_db_id: dbQ.id,
  };
}
