// Hook لإدارة أسئلة المعلم الخاصة
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TeacherCustomQuestion } from '@/types/exam';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logging';

export const useTeacherQuestions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // جلب أسئلة المعلم
  const { data: questions, isLoading } = useQuery({
    queryKey: ['teacher-questions'],
    queryFn: async () => {
      logger.debug('جلب أسئلة المعلم الخاصة');
      const { data, error } = await supabase
        .from('teacher_custom_questions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('خطأ في جلب أسئلة المعلم', error);
        throw error;
      }

      return data as any as TeacherCustomQuestion[];
    },
  });

  // إضافة سؤال جديد
  const addQuestion = useMutation({
    mutationFn: async (question: Omit<TeacherCustomQuestion, 'id' | 'created_at' | 'updated_at'>) => {
      logger.debug('إضافة سؤال جديد للمعلم');
      const { data, error } = await supabase
        .from('teacher_custom_questions')
        .insert([question as any])
        .select()
        .single();

      if (error) {
        logger.error('خطأ في إضافة السؤال', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-questions'] });
      toast({
        title: 'تم بنجاح',
        description: 'تم إضافة السؤال',
      });
    },
    onError: () => {
      toast({
        title: 'خطأ',
        description: 'فشل في إضافة السؤال',
        variant: 'destructive',
      });
    },
  });

  // تحديث سؤال
  const updateQuestion = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TeacherCustomQuestion> & { id: string }) => {
      logger.debug(`تحديث السؤال ${id}`);
      const { data, error } = await supabase
        .from('teacher_custom_questions')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('خطأ في تحديث السؤال', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-questions'] });
      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث السؤال',
      });
    },
    onError: () => {
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث السؤال',
        variant: 'destructive',
      });
    },
  });

  // حذف سؤال
  const deleteQuestion = useMutation({
    mutationFn: async (id: string) => {
      logger.debug(`حذف السؤال ${id}`);
      const { error } = await supabase
        .from('teacher_custom_questions')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        logger.error('خطأ في حذف السؤال', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-questions'] });
      toast({
        title: 'تم بنجاح',
        description: 'تم حذف السؤال',
      });
    },
    onError: () => {
      toast({
        title: 'خطأ',
        description: 'فشل في حذف السؤال',
        variant: 'destructive',
      });
    },
  });

  return {
    questions: questions || [],
    isLoading,
    addQuestion: addQuestion.mutate,
    updateQuestion: updateQuestion.mutate,
    deleteQuestion: deleteQuestion.mutate,
    isAdding: addQuestion.isPending,
    isUpdating: updateQuestion.isPending,
    isDeleting: deleteQuestion.isPending,
  };
};
