import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';

export interface TeacherExamStats {
  totalQuestions: number;
  totalTemplates: number;
  totalExams: number;
  studentsAttempted: number;
  averageScore: number;
  recentActivity: Array<{
    id: string;
    type: 'question' | 'template' | 'exam' | 'attempt';
    title: string;
    timestamp: string;
    details?: string;
  }>;
}

export function useTeacherExamStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<TeacherExamStats>({
    totalQuestions: 0,
    totalTemplates: 0,
    totalExams: 0,
    studentsAttempted: 0,
    averageScore: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchExamStats();
    }
  }, [user]);

  const fetchExamStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // جلب جميع الأسئلة المتاحة (الخاصة بالمعلم + العامة)
      const { data: questionsData, error: questionsError } = await supabase
        .from('question_bank')
        .select('id')
        .eq('is_active', true);

      if (questionsError) throw questionsError;

      // جلب جميع القوالب المتاحة (الخاصة بالمعلم + العامة)
      const { data: templatesData, error: templatesError } = await supabase
        .from('exam_templates')
        .select('id')
        .eq('is_active', true);

      if (templatesError) throw templatesError;

      // جلب الامتحانات التي أنشأها المعلم
      const { data: examsData, error: examsError } = await supabase
        .from('exams')
        .select('id')
        .eq('created_by', user?.id)
        .eq('is_active', true);

      if (examsError) throw examsError;

      const examIds = (examsData || []).map(e => e.id);

      // جلب إحصائيات المحاولات
      let attemptsData = [];
      if (examIds.length > 0) {
        const { data, error: attemptsError } = await supabase
          .from('exam_attempts')
          .select('total_score, max_score, student_id')
          .in('exam_id', examIds);

        if (attemptsError) throw attemptsError;
        attemptsData = data || [];
      }

      // حساب المتوسط وعدد الطلاب
      const uniqueStudents = new Set(attemptsData.map(a => a.student_id));
      const totalScore = attemptsData.reduce((sum, a) => sum + (a.total_score || 0), 0);
      const totalMaxScore = attemptsData.reduce((sum, a) => sum + (a.max_score || 0), 0);
      const averageScore = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;

      // جلب آخر الأنشطة
      const recentActivity = await fetchRecentActivity();

      setStats({
        totalQuestions: questionsData?.length || 0,
        totalTemplates: templatesData?.length || 0,
        totalExams: examsData?.length || 0,
        studentsAttempted: uniqueStudents.size,
        averageScore,
        recentActivity
      });

    } catch (err) {
      logger.error('Error fetching teacher exam stats', err as Error);
      setError('حدث خطأ في جلب الإحصائيات');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    const activities: TeacherExamStats['recentActivity'] = [];

    try {
      // آخر الأسئلة المتاحة
      const { data: recentQuestions } = await supabase
        .from('question_bank')
        .select('id, question_text, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3);

      (recentQuestions || []).forEach(q => {
        activities.push({
          id: q.id,
          type: 'question',
          title: 'إضافة سؤال جديد',
          timestamp: q.created_at,
          details: q.question_text.substring(0, 50) + '...'
        });
      });

      // آخر القوالب المتاحة
      const { data: recentTemplates } = await supabase
        .from('exam_templates')
        .select('id, title, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(2);

      (recentTemplates || []).forEach(t => {
        activities.push({
          id: t.id,
          type: 'template',
          title: 'إنشاء قالب امتحان',
          timestamp: t.created_at,
          details: t.title
        });
      });

      // ترتيب حسب التاريخ
      activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      return activities.slice(0, 5);
    } catch (err) {
      logger.error('Error fetching recent activity', err as Error);
      return [];
    }
  };

  return { stats, loading, error, refetch: fetchExamStats };
}
