import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Question, QuestionChoice } from '@/types/exam';
import { toast } from 'sonner';
import { logger } from '@/lib/logging';

interface UseExamBankManagerFilters {
  gradeLevel: string;
  sectionName: string;
  difficulty: string;
  questionType: string;
  searchTerm: string;
}

interface ExamBankStats {
  totalQuestions: number;
  grade10Count: number;
  grade11Count: number;
  grade12Count: number;
  difficultyDistribution: Record<string, number>;
  typeDistribution: Record<string, number>;
}

export const useExamBankManager = (filters: UseExamBankManagerFilters) => {
  const queryClient = useQueryClient();

  // جلب جميع الأسئلة مع الفلاتر
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['exam-bank-questions', filters],
    queryFn: async () => {
      let query = supabase
        .from('question_bank')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // تطبيق الفلاتر
      if (filters.gradeLevel && filters.gradeLevel !== 'all') {
        query = query.eq('grade_level', filters.gradeLevel);
      }

      if (filters.sectionName && filters.sectionName !== 'all') {
        query = query.eq('section_name', filters.sectionName);
      }

      if (filters.difficulty && filters.difficulty !== 'all') {
        query = query.eq('difficulty', filters.difficulty as any);
      }

      if (filters.questionType && filters.questionType !== 'all') {
        query = query.eq('question_type', filters.questionType as any);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('خطأ في جلب الأسئلة', error);
        throw error;
      }

      // تحويل Json إلى QuestionChoice[]
      const transformedData = (data || []).map(q => ({
        ...q,
        choices: (q.choices as any as QuestionChoice[]) || []
      })) as Question[];

      // فلترة البحث النصي
      let filteredData = transformedData;
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        filteredData = filteredData.filter(q =>
          q.question_text.toLowerCase().includes(searchLower) ||
          q.correct_answer.toLowerCase().includes(searchLower)
        );
      }

      return filteredData;
    }
  });

  // جلب الأقسام الفريدة حسب الصف
  const { data: sections = [] } = useQuery({
    queryKey: ['exam-bank-sections', filters.gradeLevel],
    queryFn: async () => {
      if (!filters.gradeLevel || filters.gradeLevel === 'all') {
        return [];
      }

      // جلب الأقسام المستخدمة في بنك الأسئلة للصف المحدد
      const { data, error } = await supabase
        .from('question_bank')
        .select('section_name')
        .eq('grade_level', filters.gradeLevel)
        .eq('is_active', true)
        .not('section_name', 'is', null);

      if (error) {
        logger.error('خطأ في جلب الأقسام', error);
        return [];
      }

      // استخراج أسماء الأقسام الفريدة
      const uniqueSections = [...new Set(data.map(item => item.section_name).filter(Boolean))];
      return uniqueSections as string[];
    },
    enabled: filters.gradeLevel !== 'all'
  });

  // حساب الإحصائيات
  const stats: ExamBankStats = {
    totalQuestions: questions.length,
    grade10Count: questions.filter(q => q.grade_level === '10').length,
    grade11Count: questions.filter(q => q.grade_level === '11').length,
    grade12Count: questions.filter(q => q.grade_level === '12').length,
    difficultyDistribution: {
      easy: questions.filter(q => q.difficulty === 'easy').length,
      medium: questions.filter(q => q.difficulty === 'medium').length,
      hard: questions.filter(q => q.difficulty === 'hard').length
    },
    typeDistribution: {
      multiple_choice: questions.filter(q => q.question_type === 'multiple_choice').length,
      true_false: questions.filter(q => q.question_type === 'true_false').length
    }
  };

  // إضافة سؤال جديد
  const addQuestion = useMutation({
    mutationFn: async (question: Omit<Question, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('question_bank')
        .insert([{
          ...question,
          choices: question.choices as any // تحويل إلى Json
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-bank-questions'] });
      toast.success('تم إضافة السؤال بنجاح');
    },
    onError: (error: any) => {
      logger.error('خطأ في إضافة السؤال', error);
      toast.error('فشل في إضافة السؤال');
    }
  });

  // تعديل سؤال
  const updateQuestion = useMutation({
    mutationFn: async ({ id, ...question }: Partial<Question> & { id: string }) => {
      const updateData: any = { ...question };
      if (question.choices) {
        updateData.choices = question.choices as any; // تحويل إلى Json
      }

      const { data, error } = await supabase
        .from('question_bank')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-bank-questions'] });
      toast.success('تم تحديث السؤال بنجاح');
    },
    onError: (error: any) => {
      logger.error('خطأ في تحديث السؤال', error);
      toast.error('فشل في تحديث السؤال');
    }
  });

  // حذف سؤال (soft delete)
  const deleteQuestion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('question_bank')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-bank-questions'] });
      toast.success('تم حذف السؤال بنجاح');
    },
    onError: (error: any) => {
      logger.error('خطأ في حذف السؤال', error);
      toast.error('فشل في حذف السؤال');
    }
  });

  return {
    questions,
    sections,
    stats,
    isLoading,
    addQuestion: addQuestion.mutate,
    updateQuestion: updateQuestion.mutate,
    deleteQuestion: deleteQuestion.mutate,
    isAdding: addQuestion.isPending,
    isUpdating: updateQuestion.isPending,
    isDeleting: deleteQuestion.isPending
  };
};
