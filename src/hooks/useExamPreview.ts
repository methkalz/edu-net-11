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

      // جلب تفاصيل الأسئلة بنفس طريقة الطالب
      const questionsPromises = examQuestions?.map(async (eq: any) => {
        try {
          if (eq.question_source === 'bank' && eq.question_bank_id) {
            const { data: bankQ, error } = await supabase
              .from('question_bank')
              .select('*')
              .eq('id', eq.question_bank_id)
              .maybeSingle();
            
            if (error) {
              console.error('Error fetching bank question:', error);
              return null;
            }
            
            if (!bankQ) return null;
            
            return {
              id: bankQ.id,
              question_text: bankQ.question_text,
              question_type: bankQ.question_type as 'multiple_choice' | 'true_false' | 'short_answer',
              choices: bankQ.choices as any,
              correct_answer: bankQ.correct_answer,
              points: pointsPerQuestion,
              difficulty_level: (bankQ.difficulty || 'medium') as 'easy' | 'medium' | 'hard',
            };
          } else if (eq.question_source === 'custom' && eq.custom_question_id) {
            const { data: customQ, error } = await supabase
              .from('teacher_custom_questions')
              .select('*')
              .eq('id', eq.custom_question_id)
              .maybeSingle();
            
            if (error) {
              console.error('Error fetching custom question:', error);
              return null;
            }
            
            if (!customQ) return null;
            
            return {
              id: customQ.id,
              question_text: customQ.question_text,
              question_type: customQ.question_type as 'multiple_choice' | 'true_false' | 'short_answer',
              choices: customQ.choices as any,
              correct_answer: customQ.correct_answer,
              points: pointsPerQuestion,
              difficulty_level: ((customQ as any).difficulty_level || (customQ as any).difficulty || 'medium') as 'easy' | 'medium' | 'hard',
            };
          }
          
          return null;
        } catch (error) {
          console.error('Error processing question:', error);
          return null;
        }
      }) || [];

      const questions = (await Promise.all(questionsPromises)).filter(q => q !== null);

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
