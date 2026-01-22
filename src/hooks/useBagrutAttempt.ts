// Hook لإدارة محاولة امتحان البجروت
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useRef } from 'react';
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

export function useBagrutAttempt(examId: string | undefined, studentId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [attemptStartedAt, setAttemptStartedAt] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, BagrutAnswer>>({});
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([]);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedAnswersRef = useRef<string>('');

  // جلب بيانات الامتحان والأقسام
  const examQuery = useQuery({
    queryKey: ['bagrut-exam-attempt', examId, studentId],
    queryFn: async (): Promise<BagrutExamData> => {
      if (!examId || !studentId) throw new Error('معرف الامتحان أو الطالب مفقود');

      logger.debug('جلب بيانات امتحان البجروت للحل', { examId, studentId });

      // جلب الامتحان
      const { data: exam, error: examError } = await supabase
        .from('bagrut_exams')
        .select('*')
        .eq('id', examId)
        .eq('is_published', true)
        .single();

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

      // جلب محاولات الطالب
      const { data: attempts } = await supabase
        .from('bagrut_attempts')
        .select('*')
        .eq('exam_id', examId)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      const submittedCount = (attempts || []).filter(
        a => a.status === 'submitted' || a.status === 'graded'
      ).length;

      const inProgressAttempt = (attempts || []).find(a => a.status === 'in_progress');
      const maxAttempts = exam.max_attempts || 1;

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
        can_start: submittedCount < maxAttempts || !!inProgressAttempt,
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
      queryClient.invalidateQueries({ queryKey: ['bagrut-exam-attempt', examId] });
      queryClient.invalidateQueries({ queryKey: ['student-bagrut-exams'] });
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

  // الحفظ التلقائي
  useEffect(() => {
    if (!attemptId) return;

    autoSaveTimerRef.current = setInterval(() => {
      const currentAnswersStr = JSON.stringify(answers);
      if (currentAnswersStr !== lastSavedAnswersRef.current) {
        saveAnswersMutation.mutate(answers);
      }
    }, 30000); // كل 30 ثانية

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [attemptId, answers]);

  // تحديث إجابة
  const updateAnswer = useCallback((questionId: string, answer: BagrutAnswer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));
  }, []);

  // بدء الامتحان
  const startExam = useCallback((sectionIds: string[]) => {
    setSelectedSectionIds(sectionIds);
    createAttemptMutation.mutate(sectionIds);
  }, [createAttemptMutation]);

  // تقديم الامتحان
  const submitExam = useCallback(() => {
    submitExamMutation.mutate();
  }, [submitExamMutation]);

  // حفظ يدوي
  const saveAnswers = useCallback(() => {
    saveAnswersMutation.mutate(answers);
  }, [answers, saveAnswersMutation]);

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
    difficulty_level: dbQ.difficulty_level || undefined,
    is_bonus: dbQ.is_bonus || false,
    sub_questions: subQuestions.length > 0 ? subQuestions : undefined,
    question_db_id: dbQ.id,
  };
}
