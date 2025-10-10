import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface TeacherExam {
  id: string;
  title: string;
  description?: string;
  grade_level: string; // Legacy field
  grade_levels: string[]; // New field for multiple grades
  target_class_ids: string[];
  total_questions: number;
  duration_minutes: number;
  pass_percentage: number;
  max_attempts: number;
  difficulty_distribution: any;
  question_sources: any;
  randomize_questions: boolean;
  randomize_answers: boolean;
  starts_at?: string;
  ends_at?: string;
  show_results_immediately: boolean;
  show_correct_answers: boolean;
  status: 'draft' | 'published' | 'closed' | 'archived';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  school_id?: string;
}

export const useTeacherExams = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [exams, setExams] = useState<TeacherExam[]>([]);

  // جلب اختبارات المعلم
  const fetchExams = useCallback(async (gradeLevel?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('teacher_exams')
        .select('*')
        .eq('created_by', userProfile?.user_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // لا نحتاج فلترة بالـ gradeLevel بعد الآن - نعرض كل الاختبارات
      // لأن كل اختبار الآن يمكن أن يستهدف صفوف متعددة

      const { data, error } = await query;
      if (error) throw error;

      setExams((data as any) || []);
    } catch (error: any) {
      logger.error('فشل في تحميل الاختبارات', error);
      toast.error('فشل في تحميل الاختبارات', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  // إنشاء اختبار جديد
  const createExam = useCallback(async (examData: Partial<TeacherExam>) => {
    try {
      setLoading(true);
      
      const insertData: any = {
        title: examData.title,
        description: examData.description,
        grade_level: examData.grade_levels?.[0] || examData.grade_level || '11', // للتوافق مع الإصدارات القديمة
        grade_levels: examData.grade_levels || [examData.grade_level || '11'], // الحقل الجديد
        target_class_ids: examData.target_class_ids || [],
        total_questions: examData.total_questions || 10,
        duration_minutes: examData.duration_minutes || 60,
        pass_percentage: examData.pass_percentage || 60,
        max_attempts: examData.max_attempts || 1,
        difficulty_distribution: examData.difficulty_distribution || { easy: 30, medium: 50, hard: 20 },
        question_sources: examData.question_sources || { type: 'random', sections: [] },
        randomize_questions: examData.randomize_questions ?? true,
        randomize_answers: examData.randomize_answers ?? true,
        starts_at: examData.starts_at,
        ends_at: examData.ends_at,
        show_results_immediately: examData.show_results_immediately ?? false,
        show_correct_answers: examData.show_correct_answers ?? false,
        status: examData.status || 'draft',
        created_by: userProfile?.user_id,
        school_id: userProfile?.school_id
      };
      
      const { data, error } = await supabase
        .from('teacher_exams')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      toast.success('تم إنشاء الاختبار بنجاح');
      await fetchExams(); // لم نعد بحاجة لتمرير gradeLevel
      return data;
    } catch (error: any) {
      logger.error('فشل في إنشاء الاختبار', error);
      toast.error('فشل في إنشاء الاختبار', {
        description: error.message
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [userProfile, fetchExams]);

  // تحديث اختبار
  const updateExam = useCallback(async (examId: string, updates: Partial<TeacherExam>) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('teacher_exams')
        .update(updates)
        .eq('id', examId);

      if (error) throw error;

      toast.success('تم تحديث الاختبار بنجاح');
      await fetchExams();
    } catch (error: any) {
      logger.error('فشل في تحديث الاختبار', error);
      toast.error('فشل في تحديث الاختبار', {
        description: error.message
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchExams]);

  // حذف اختبار
  const deleteExam = useCallback(async (examId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('teacher_exams')
        .update({ is_active: false })
        .eq('id', examId);

      if (error) throw error;

      toast.success('تم حذف الاختبار بنجاح');
      await fetchExams();
    } catch (error: any) {
      logger.error('فشل في حذف الاختبار', error);
      toast.error('فشل في حذف الاختبار');
    } finally {
      setLoading(false);
    }
  }, [fetchExams]);

  // نشر اختبار
  const publishExam = useCallback(async (examId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('teacher_exams')
        .update({ status: 'published' })
        .eq('id', examId);

      if (error) throw error;

      toast.success('تم نشر الاختبار بنجاح');
      await fetchExams();
    } catch (error: any) {
      logger.error('فشل في نشر الاختبار', error);
      toast.error('فشل في نشر الاختبار');
    } finally {
      setLoading(false);
    }
  }, [fetchExams]);

  return {
    loading,
    exams,
    fetchExams,
    createExam,
    updateExam,
    deleteExam,
    publishExam
  };
};
