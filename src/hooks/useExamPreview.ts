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
        .select(`
          id,
          question_order,
          points_override,
          question_source,
          question_bank:question_bank_id (
            id,
            question_text,
            question_type,
            choices,
            correct_answer,
            points,
            difficulty
          ),
          custom_question:custom_question_id (
            id,
            question_text,
            question_type,
            choices,
            correct_answer,
            points,
            difficulty_level
          )
        `)
        .eq('exam_id', examId)
        .order('question_order', { ascending: true });

      if (questionsError) throw questionsError;

      // حساب النقاط لكل سؤال
      const totalQuestions = examQuestions?.length || 1;
      const pointsPerQuestion = calculateQuestionPoints(totalQuestions);

      // تحويل البيانات لصيغة ExamPreview
      const questions = examQuestions?.map((eq: any) => {
        const question = eq.question_source === 'bank' 
          ? eq.question_bank 
          : eq.custom_question;

        return {
          id: question.id,
          question_text: question.question_text,
          question_type: question.question_type,
          choices: question.choices,
          correct_answer: question.correct_answer,
          points: pointsPerQuestion,
          difficulty_level: question.difficulty || question.difficulty_level || 'medium',
        };
      }) || [];

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
