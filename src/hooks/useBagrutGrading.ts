// Hook لجلب محاولات البجروت للتصحيح (للمعلم)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logging';
import { useToast } from '@/hooks/use-toast';

export interface BagrutAttemptForGrading {
  id: string;
  exam_id: string;
  student_id: string;
  student_name: string;
  student_class?: string;
  status: string;
  started_at: string | null;
  submitted_at: string | null;
  score: number | null;
  max_score: number | null;
  percentage: number | null;
  attempt_number: number;
  is_result_published: boolean;
  answers: Record<string, any>;
  section_scores: Record<string, any> | null;
  graded_at: string | null;
  graded_by: string | null;
  teacher_feedback: string | null;
}

export interface QuestionGrade {
  id?: string;
  attempt_id: string;
  question_id: string;
  auto_score: number | null;
  manual_score: number | null;
  final_score: number | null;
  max_score: number;
  teacher_feedback: string | null;
}

export function useBagrutGrading(examId: string | undefined, schoolId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // جلب محاولات الامتحان للتصحيح
  const attemptsQuery = useQuery({
    queryKey: ['bagrut-attempts-grading', examId, schoolId],
    queryFn: async (): Promise<BagrutAttemptForGrading[]> => {
      if (!examId) return [];

      logger.debug('جلب محاولات البجروت للتصحيح', { examId, schoolId });

      // جلب المحاولات
      let query = supabase
        .from('bagrut_attempts')
        .select('*')
        .eq('exam_id', examId)
        .in('status', ['submitted', 'graded'])
        .order('submitted_at', { ascending: false });

      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }

      const { data: attempts, error } = await query;

      if (error) throw error;
      if (!attempts || attempts.length === 0) return [];

      // جلب معلومات الطلاب
      const studentIds = [...new Set(attempts.map(a => a.student_id))];
      const { data: students } = await supabase
        .from('students')
        .select('id, full_name, user_id')
        .in('user_id', studentIds);

      const studentsMap = new Map((students || []).map(s => [s.user_id, s]));

      return attempts.map(attempt => {
        const student = studentsMap.get(attempt.student_id);
        return {
          id: attempt.id,
          exam_id: attempt.exam_id,
          student_id: attempt.student_id,
          student_name: student?.full_name || 'طالب غير معروف',
          status: attempt.status || 'submitted',
          started_at: attempt.started_at,
          submitted_at: attempt.submitted_at,
          score: attempt.score,
          max_score: attempt.max_score,
          percentage: attempt.percentage,
          attempt_number: attempt.attempt_number || 1,
          is_result_published: attempt.is_result_published || false,
          answers: (attempt.answers as Record<string, any>) || {},
          section_scores: attempt.section_scores as Record<string, any> | null,
          graded_at: attempt.graded_at,
          graded_by: attempt.graded_by,
          teacher_feedback: attempt.teacher_feedback,
        };
      });
    },
    enabled: !!examId,
  });

  // جلب علامات الأسئلة لمحاولة معينة
  const fetchQuestionGrades = async (attemptId: string): Promise<QuestionGrade[]> => {
    const { data, error } = await supabase
      .from('bagrut_question_grades')
      .select('*')
      .eq('attempt_id', attemptId);

    if (error) throw error;
    return (data || []).map(g => ({
      id: g.id,
      attempt_id: g.attempt_id,
      question_id: g.question_id,
      auto_score: g.auto_score,
      manual_score: g.manual_score,
      final_score: g.final_score,
      max_score: g.max_score,
      teacher_feedback: g.teacher_feedback,
    }));
  };

  // حفظ علامة سؤال
  const saveQuestionGradeMutation = useMutation({
    mutationFn: async (grade: QuestionGrade & { graded_by: string }) => {
      const { id, ...gradeData } = grade;

      if (id) {
        // تحديث علامة موجودة
        const { error } = await supabase
          .from('bagrut_question_grades')
          .update({
            manual_score: gradeData.manual_score,
            final_score: gradeData.final_score,
            teacher_feedback: gradeData.teacher_feedback,
            graded_by: gradeData.graded_by,
            graded_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (error) throw error;
      } else {
        // إنشاء علامة جديدة
        const { error } = await supabase
          .from('bagrut_question_grades')
          .insert({
            attempt_id: gradeData.attempt_id,
            question_id: gradeData.question_id,
            auto_score: gradeData.auto_score,
            manual_score: gradeData.manual_score,
            final_score: gradeData.final_score,
            max_score: gradeData.max_score,
            teacher_feedback: gradeData.teacher_feedback,
            graded_by: gradeData.graded_by,
            graded_at: new Date().toISOString(),
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: 'تم حفظ العلامة' });
    },
    onError: (error: any) => {
      logger.error('فشل حفظ العلامة', error);
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // تحديث المحاولة (العلامة النهائية والتعليقات)
  const updateAttemptMutation = useMutation({
    mutationFn: async (data: {
      attemptId: string;
      score: number;
      maxScore: number;
      percentage: number;
      teacherFeedback: string | null;
      gradedBy: string;
      markAsGraded: boolean;
      publishResult: boolean;
    }) => {
      const { error } = await supabase
        .from('bagrut_attempts')
        .update({
          score: data.score,
          max_score: data.maxScore,
          percentage: data.percentage,
          teacher_feedback: data.teacherFeedback,
          graded_by: data.gradedBy,
          graded_at: data.markAsGraded ? new Date().toISOString() : null,
          status: data.markAsGraded ? 'graded' : 'submitted',
          is_result_published: data.publishResult,
        })
        .eq('id', data.attemptId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bagrut-attempts-grading', examId] });
      toast({ title: 'تم حفظ التصحيح' });
    },
    onError: (error: any) => {
      logger.error('فشل تحديث المحاولة', error);
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // نشر النتائج
  const publishResultsMutation = useMutation({
    mutationFn: async (attemptIds: string[]) => {
      const { error } = await supabase
        .from('bagrut_attempts')
        .update({ is_result_published: true })
        .in('id', attemptIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bagrut-attempts-grading', examId] });
      toast({ title: 'تم نشر النتائج' });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في نشر النتائج',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    attempts: attemptsQuery.data || [],
    isLoading: attemptsQuery.isLoading,
    isError: attemptsQuery.isError,
    fetchQuestionGrades,
    saveQuestionGrade: saveQuestionGradeMutation.mutate,
    updateAttempt: updateAttemptMutation.mutate,
    publishResults: publishResultsMutation.mutate,
    isSaving: saveQuestionGradeMutation.isPending || updateAttemptMutation.isPending,
    isPublishing: publishResultsMutation.isPending,
  };
}
