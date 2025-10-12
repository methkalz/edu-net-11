import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateQuestionPoints } from '@/lib/exam-utils';

export const useExamPreview = (examId: string | null) => {
  return useQuery({
    queryKey: ['exam-preview', examId],
    queryFn: async () => {
      if (!examId) throw new Error('لا يوجد معرف امتحان');

      console.log('📖 جلب بيانات الامتحان للمعاينة', { examId });

      // جلب بيانات الامتحان
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();

      if (examError) throw examError;

      // جلب أسئلة الامتحان
      const { data: examQuestions, error: questionsError } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_id', examId)
        .order('question_order', { ascending: true });

      if (questionsError) throw questionsError;

      // حساب النقاط لكل سؤال
      const totalQuestions = examQuestions?.length || 1;
      const pointsPerQuestion = calculateQuestionPoints(totalQuestions);

      // جلب تفاصيل الأسئلة
      const questions = await Promise.all(
        examQuestions?.map(async (eq: any) => {
          if (eq.question_source === 'bank' && eq.question_bank_id) {
            const { data: bankQ } = await supabase
              .from('question_bank')
              .select('*')
              .eq('id', eq.question_bank_id)
              .single();
            
            return {
              id: bankQ.id,
              question_text: bankQ.question_text,
              question_type: bankQ.question_type as 'multiple_choice' | 'true_false' | 'short_answer',
              choices: bankQ.choices as any,
              correct_answer: bankQ.correct_answer,
              points: pointsPerQuestion,
              difficulty_level: (bankQ.difficulty || 'medium') as 'easy' | 'medium' | 'hard',
            };
          } else if (eq.custom_question_id) {
             const { data: customQ } = await supabase
              .from('teacher_custom_questions')
              .select('*')
              .eq('id', eq.custom_question_id)
              .single();
            
            return {
              id: customQ?.id || '',
              question_text: customQ?.question_text || '',
              question_type: (customQ?.question_type as 'multiple_choice' | 'true_false' | 'short_answer') || 'multiple_choice',
              choices: (customQ?.choices as any) || [],
              correct_answer: customQ?.correct_answer || '',
              points: pointsPerQuestion,
              difficulty_level: ((customQ as any)?.difficulty_level || 'medium') as 'easy' | 'medium' | 'hard',
            };
          }
        }) || []
      );

      return {
        exam: {
          title: examData.title,
          description: examData.description || '',
          duration_minutes: examData.duration_minutes,
          pass_percentage: examData.passing_percentage,
          show_results_immediately: examData.show_results_immediately,
        },
        questions,
      };
    },
    enabled: !!examId,
  });
};
