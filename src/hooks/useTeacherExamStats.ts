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

      // جلب الأسئلة مع التفاصيل
      const { data: questionsData, error: questionsError } = await supabase
        .from('question_bank')
        .select('id, difficulty_level, is_active')
        .eq('created_by', user?.id)
        .eq('is_active', true);

      if (questionsError) throw questionsError;

      // جلب القوالب مع التفاصيل
      const { data: templatesData, error: templatesError } = await supabase
        .from('exam_templates')
        .select('id, is_active, grade_level')
        .eq('created_by', user?.id)
        .eq('is_active', true);

      if (templatesError) throw templatesError;

      // جلب الامتحانات المنشأة
      const { data: examsData, error: examsError } = await supabase
        .from('exams')
        .select('id, is_active')
        .eq('created_by', user?.id)
        .eq('is_active', true);

      if (examsError) throw examsError;

      const examIds = (examsData || []).map(e => e.id);

      // جلب إحصائيات المحاولات بشكل دقيق
      let attemptsData: Array<{
        total_score: number;
        max_score: number;
        student_id: string;
        status: string;
      }> = [];
      
      if (examIds.length > 0) {
        const { data, error: attemptsError } = await supabase
          .from('exam_attempts')
          .select('total_score, max_score, student_id, status')
          .in('exam_id', examIds)
          .eq('status', 'completed');

        if (attemptsError) throw attemptsError;
        attemptsData = data || [];
      }

      // حساب الإحصائيات بدقة
      const uniqueStudents = new Set(attemptsData.map(a => a.student_id));
      
      // حساب المتوسط فقط من المحاولات المكتملة
      const completedAttempts = attemptsData.filter(a => a.max_score > 0);
      const totalScore = completedAttempts.reduce((sum, a) => sum + (a.total_score || 0), 0);
      const totalMaxScore = completedAttempts.reduce((sum, a) => sum + a.max_score, 0);
      const averageScore = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;

      // جلب آخر الأنشطة
      const recentActivity = await fetchRecentActivity();

      setStats({
        totalQuestions: (questionsData || []).length,
        totalTemplates: (templatesData || []).length,
        totalExams: (examsData || []).length,
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
      // آخر الأسئلة
      const { data: recentQuestions } = await supabase
        .from('question_bank')
        .select('id, question_text, created_at')
        .eq('created_by', user?.id)
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

      // آخر القوالب
      const { data: recentTemplates } = await supabase
        .from('exam_templates')
        .select('id, title, created_at')
        .eq('created_by', user?.id)
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
