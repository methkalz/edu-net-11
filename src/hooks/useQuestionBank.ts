// Hook لإدارة بنك الأسئلة (للسوبر آدمن)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Question, QuestionType, QuestionDifficulty } from '@/types/exam';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logging';

export const useQuestionBank = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // جلب جميع الأسئلة
  const { data: questions, isLoading } = useQuery({
    queryKey: ['question-bank'],
    queryFn: async () => {
      logger.debug('جلب أسئلة بنك الأسئلة');
      const { data, error } = await supabase
        .from('question_bank')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('خطأ في جلب أسئلة بنك الأسئلة', error);
        throw error;
      }

      return data as any as Question[];
    },
  });

  // إضافة سؤال جديد
  const addQuestion = useMutation({
    mutationFn: async (question: Omit<Question, 'id' | 'created_at' | 'updated_at'>) => {
      logger.debug('إضافة سؤال جديد إلى بنك الأسئلة');
      const { data, error } = await supabase
        .from('question_bank')
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
      queryClient.invalidateQueries({ queryKey: ['question-bank'] });
      toast({
        title: 'تم بنجاح',
        description: 'تم إضافة السؤال إلى بنك الأسئلة',
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ',
        description: 'فشل في إضافة السؤال',
        variant: 'destructive',
      });
    },
  });

  // تحديث سؤال
  const updateQuestion = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Question> & { id: string }) => {
      logger.debug(`تحديث السؤال ${id}`);
      const { data, error } = await supabase
        .from('question_bank')
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
      queryClient.invalidateQueries({ queryKey: ['question-bank'] });
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

  // حذف سؤال (إلغاء تفعيله)
  const deleteQuestion = useMutation({
    mutationFn: async (id: string) => {
      logger.debug(`حذف السؤال ${id}`);
      const { error } = await supabase
        .from('question_bank')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        logger.error('خطأ في حذف السؤال', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-bank'] });
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
