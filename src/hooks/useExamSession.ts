import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ExamQuestion {
  id: string;
  question_text: string;
  choices: { text: string; value: string }[];
  question_type: 'multiple_choice' | 'true_false' | 'essay';
  points: number;
  correct_answer?: string;
}

interface ExamAttempt {
  id: string;
  template_id: string;
  student_id: string;
  started_at: string;
  finished_at: string | null;
  total_score: number;
  max_score: number;
  status: 'in_progress' | 'completed' | 'expired';
}

interface AttemptQuestion {
  id: string;
  attempt_id: string;
  question_id: string;
  display_order: number;
  student_answer: string | null;
  score: number;
  answered_at: string | null;
}

export const useExamSession = () => {
  const [loading, setLoading] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState<ExamAttempt | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [attemptQuestions, setAttemptQuestions] = useState<AttemptQuestion[]>([]);

  // بدء محاولة امتحان جديدة
  const startExamAttempt = useCallback(async (templateId: string, instanceId: string) => {
    try {
      setLoading(true);

      // التحقق من عدد المحاولات المتبقية
      const { data: instance } = await supabase
        .from('teacher_exam_instances')
        .select('max_attempts, starts_at, ends_at, last_attempt_start_time')
        .eq('id', instanceId)
        .single();

      if (!instance) {
        toast.error('الامتحان غير موجود');
        return null;
      }

      // التحقق من الوقت
      const now = new Date();
      const startsAt = new Date(instance.starts_at);
      const endsAt = instance.ends_at ? new Date(instance.ends_at) : null;

      if (now < startsAt) {
        toast.error('لم يبدأ الامتحان بعد');
        return null;
      }

      if (endsAt && now > endsAt) {
        toast.error('انتهى وقت الامتحان');
        return null;
      }

      // عد المحاولات السابقة
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { count: previousAttempts } = await supabase
        .from('exam_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('template_id', templateId)
        .eq('student_id', user.id);

      if (previousAttempts && previousAttempts >= instance.max_attempts) {
        toast.error(`لقد استنفذت جميع المحاولات المتاحة (${instance.max_attempts})`);
        return null;
      }

      // جلب template الامتحان
      const { data: template } = await supabase
        .from('exam_templates')
        .select('*, question_sources')
        .eq('id', templateId)
        .single();

      if (!template) {
        toast.error('قالب الامتحان غير موجود');
        return null;
      }

      // جلب الأسئلة باستخدام نفس منطق المعلم (generateTemplatePreview)
      const questionSources = (template.question_sources || { type: "random", sections: [] }) as {
        type: string;
        sections?: string[];
      };
      const difficultyDist = (template.difficulty_distribution || { easy: 30, medium: 50, hard: 20 }) as {
        easy: number;
        medium: number;
        hard: number;
      };
      
      // حساب عدد الأسئلة لكل مستوى صعوبة
      const totalQuestions = template.total_questions;
      const easyCount = Math.round((totalQuestions * difficultyDist.easy) / 100);
      const mediumCount = Math.round((totalQuestions * difficultyDist.medium) / 100);
      const hardCount = totalQuestions - easyCount - mediumCount;

      const selectedQuestions: any[] = [];

      // جلب أسئلة لكل مستوى صعوبة
      for (const [difficulty, count] of [
        ['easy', easyCount],
        ['medium', mediumCount], 
        ['hard', hardCount]
      ] as Array<[string, number]>) {
        if (count <= 0) continue;

        // بناء query الأساسي
        const baseQuery = (supabase as any)
          .from('question_bank')
          .select('id, question_text, choices, question_type, points, correct_answer, difficulty_level, section_id')
          .eq('is_active', true)
          .eq('difficulty_level', difficulty as 'easy' | 'medium' | 'hard');

        let questions: any[] | null = null;
        let error: any = null;

        // تطبيق فلتر الأقسام إذا كان محدداً
        if (questionSources.type === 'sections' && questionSources.sections?.length > 0) {
          const validSections = questionSources.sections.filter((s: string) => s !== 'general');
          if (validSections.length > 0) {
            const result = await baseQuery.in('section_id', validSections);
            questions = result.data;
            error = result.error;
          } else {
            const result = await baseQuery.is('section_id', null);
            questions = result.data;
            error = result.error;
          }
        } else {
          const result = await baseQuery;
          questions = result.data;
          error = result.error;
        }
        
        if (error) {
          console.error(`Error fetching ${difficulty} questions:`, error);
          toast.error(`فشل تحميل الأسئلة (${difficulty})`);
          return null;
        }

        if (!questions || questions.length < count) {
          toast.error(`لا توجد أسئلة ${difficulty} كافية (مطلوب ${count}، متوفر ${questions?.length || 0})`);
          return null;
        }

        // اختيار عشوائي للأسئلة
        const shuffled = questions.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, count);
        selectedQuestions.push(...selected);
      }

      if (selectedQuestions.length === 0) {
        toast.error('لا توجد أسئلة متاحة لهذا الامتحان');
        return null;
      }

      // خلط الأسئلة إذا كان مفعلاً
      if (template.randomize_questions) {
        selectedQuestions.sort(() => 0.5 - Math.random());
      }

      // خلط الإجابات إذا كان مفعلاً
      const finalQuestions = selectedQuestions.map(q => {
        if (template.randomize_answers && q.choices && Array.isArray(q.choices)) {
          const shuffledChoices = [...q.choices].sort(() => 0.5 - Math.random());
          return { ...q, choices: shuffledChoices };
        }
        return q;
      });

      // حساب max_score
      const maxScore = selectedQuestions.reduce((sum, q) => sum + (q.points || 1), 0);

      // إنشاء exam_attempt جديد
      const { data: newAttempt, error: attemptError } = await supabase
        .from('exam_attempts')
        .insert({
          template_id: templateId,
          instance_id: instanceId, // ✅ ربط مع teacher_exam_instances
          exam_id: null as any, // أصبح اختياري بعد التعديل
          student_id: user.id,
          max_score: maxScore,
          status: 'in_progress' as const
        })
        .select()
        .single() as { data: ExamAttempt | null; error: any };

      if (attemptError || !newAttempt) {
        console.error('Error creating attempt:', attemptError);
        toast.error('فشل بدء الامتحان');
        return null;
      }

      // إنشاء exam_attempt_questions
      const attemptQuestionsData = selectedQuestions.map((q, index) => ({
        attempt_id: newAttempt.id,
        question_id: q.id,
        display_order: index + 1,
        student_answer: null,
        score: 0
      }));

      const { error: insertError } = await supabase
        .from('exam_attempt_questions')
        .insert(attemptQuestionsData);

      if (insertError) {
        console.error('Error creating attempt questions:', insertError);
        toast.error('فشل في إنشاء أسئلة الامتحان');
        return null;
      }

      // تحديث last_attempt_start_time في instance
      await supabase
        .from('teacher_exam_instances')
        .update({ last_attempt_start_time: new Date().toISOString() })
        .eq('id', instanceId);

      setCurrentAttempt(newAttempt);
      setQuestions(selectedQuestions as any);
      
      toast.success('بدأ الامتحان بنجاح!');
      return newAttempt;

    } catch (error) {
      console.error('Error in startExamAttempt:', error);
      toast.error('حدث خطأ أثناء بدء الامتحان');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // حفظ إجابة سؤال
  const submitAnswer = useCallback(async (
    attemptId: string,
    questionId: string,
    answer: string
  ) => {
    try {
      const { error } = await supabase
        .from('exam_attempt_questions')
        .update({
          student_answer: answer,
          answered_at: new Date().toISOString()
        })
        .eq('attempt_id', attemptId)
        .eq('question_id', questionId);

      if (error) {
        console.error('Error saving answer:', error);
        toast.error('فشل حفظ الإجابة');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in submitAnswer:', error);
      return false;
    }
  }, []);

  // إنهاء الامتحان وحساب الدرجة
  const finishExam = useCallback(async (attemptId: string) => {
    try {
      setLoading(true);

      // جلب جميع الأسئلة والإجابات
      const { data: attemptQuestions } = await supabase
        .from('exam_attempt_questions')
        .select(`
          *,
          question_bank (
            correct_answer,
            points
          )
        `)
        .eq('attempt_id', attemptId);

      if (!attemptQuestions) {
        toast.error('فشل تحميل الإجابات');
        return null;
      }

      // حساب الدرجة
      let totalScore = 0;
      const updates = attemptQuestions.map((aq: any) => {
        const isCorrect = aq.student_answer === aq.question_bank.correct_answer;
        const questionScore = isCorrect ? (aq.question_bank.points || 1) : 0;
        totalScore += questionScore;

        return supabase
          .from('exam_attempt_questions')
          .update({ score: questionScore })
          .eq('id', aq.id);
      });

      await Promise.all(updates);

      // تحديث exam_attempt
      const { data: updatedAttempt, error: updateError } = await supabase
        .from('exam_attempts')
        .update({
          total_score: totalScore,
          finished_at: new Date().toISOString(),
          status: 'completed' as const
        })
        .eq('id', attemptId)
        .select()
        .single() as { data: ExamAttempt | null; error: any };

      if (updateError || !updatedAttempt) {
        toast.error('فشل إنهاء الامتحان');
        return null;
      }

      toast.success('تم إنهاء الامتحان بنجاح!');
      return updatedAttempt;

    } catch (error) {
      console.error('Error in finishExam:', error);
      toast.error('حدث خطأ أثناء إنهاء الامتحان');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // جلب تفاصيل محاولة معينة
  const getAttemptDetails = useCallback(async (attemptId: string) => {
    try {
      const { data: attempt } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('id', attemptId)
        .single();

      const { data: questions } = await supabase
        .from('exam_attempt_questions')
        .select(`
          *,
          question_bank (*)
        `)
        .eq('attempt_id', attemptId)
        .order('display_order');

      return { attempt, questions };
    } catch (error) {
      console.error('Error getting attempt details:', error);
      return null;
    }
  }, []);

  return {
    loading,
    currentAttempt,
    questions,
    attemptQuestions,
    startExamAttempt,
    submitAnswer,
    finishExam,
    getAttemptDetails
  };
};
