import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateQuestionPoints } from '@/lib/exam-utils';

export const useExamPreview = (examId: string | null) => {
  return useQuery({
    queryKey: ['exam-preview', examId],
    queryFn: async () => {
      if (!examId) throw new Error('لا يوجد معرف امتحان');

      console.log('📖 جلب بيانات الامتحان للمعاينة', { examId });

      // استخدام نفس دالة الطالب لتوليد الأسئلة
      const { data: generatedData, error: generateError } = await supabase
        .rpc('generate_exam_questions', {
          p_exam_id: examId,
          p_student_id: (await supabase.auth.getUser()).data.user?.id || ''
        });

      if (generateError) {
        console.error('Error generating exam:', generateError);
        throw generateError;
      }

      const examResponse = generatedData as any;
      
      if (!examResponse?.exam || !examResponse?.questions) {
        throw new Error('فشل في توليد بيانات الامتحان');
      }

      const exam = examResponse.exam;
      const questionsData = examResponse.questions;

      // حساب النقاط لكل سؤال
      const totalQuestions = questionsData?.length || 1;
      const pointsPerQuestion = calculateQuestionPoints(totalQuestions);

      // تحويل الأسئلة للصيغة المطلوبة
      const questions = questionsData.map((q: any) => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type as 'multiple_choice' | 'true_false' | 'short_answer',
        choices: q.choices,
        correct_answer: q.correct_answer,
        points: q.points || pointsPerQuestion,
        difficulty_level: (q.difficulty_level || q.difficulty || 'medium') as 'easy' | 'medium' | 'hard',
      }));

      return {
        exam: {
          title: exam.title,
          description: exam.description || '',
          duration_minutes: exam.duration_minutes,
          pass_percentage: exam.passing_percentage,
          show_results_immediately: exam.show_results_immediately,
        },
        questions,
      };
    },
    enabled: !!examId,
  });
};
