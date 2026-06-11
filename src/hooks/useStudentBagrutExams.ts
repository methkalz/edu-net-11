// Hook لجلب امتحانات البجروت المتاحة للطالب
// النموذج الجديد: المصدر هو bagrut_exam_publications (نشر المعلم لصف الطالب).
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logging';

export interface AvailableBagrutExam {
  id: string; // معرّف الامتحان
  publication_id: string;
  title: string;
  exam_year: number;
  exam_season: string;
  subject: string;
  duration_minutes: number;
  total_points: number;
  instructions: string | null;
  is_published: boolean;
  available_from: string | null;
  available_until: string | null;
  max_attempts: number;
  show_answers_to_students: boolean;
  allow_review_after_submit: boolean;
  // إحصائيات المحاولات
  attempts_used: number;
  attempts_remaining: number;
  can_start: boolean;
  last_attempt_status: string | null;
  best_score: number | null;
  best_percentage: number | null;
}

export const useStudentBagrutExams = (studentId?: string, _gradeLevel?: string) => {
  const queryClient = useQueryClient();

  // Realtime — نشر المعلم ومحاولات الطالب
  useEffect(() => {
    if (!studentId) return;
    const pubChannel = supabase
      .channel('student-bagrut-pub-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bagrut_exam_publications' }, () => {
        queryClient.invalidateQueries({ queryKey: ['student-bagrut-exams', studentId] });
      })
      .subscribe();
    const attemptsChannel = supabase
      .channel('student-bagrut-attempts-changes')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'bagrut_attempts', filter: `student_id=eq.${studentId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['student-bagrut-exams', studentId] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(pubChannel);
      supabase.removeChannel(attemptsChannel);
    };
  }, [studentId, queryClient]);

  return useQuery({
    queryKey: ['student-bagrut-exams', studentId],
    queryFn: async (): Promise<AvailableBagrutExam[]> => {
      if (!studentId) return [];

      logger.debug(`جلب نشرات البجروت للطالب ${studentId}`);

      // 1) النشرات المتاحة لصفوف الطالب (RLS يفلتر تلقائياً)
      const { data: pubs, error: pubsErr } = await supabase
        .from('bagrut_exam_publications')
        .select(`
          id, exam_id, class_id, available_from, available_until,
          max_attempts, show_answers_to_students, allow_review_after_submit, is_active,
          bagrut_exams!inner(
            id, title, exam_year, exam_season, subject,
            duration_minutes, total_points, instructions, is_published
          )
        `)
        .eq('is_active', true);
      if (pubsErr) { logger.error('خطأ في جلب النشرات', pubsErr); throw pubsErr; }

      // فلترة: الامتحان لا زال متاحاً للمعلمين (is_published على مستوى الامتحان)
      const activePubs = (pubs || []).filter((p: any) => p.bagrut_exams?.is_published);

      if (activePubs.length === 0) return [];

      // 2) محاولات الطالب
      const examIds = Array.from(new Set(activePubs.map((p: any) => p.exam_id)));
      const { data: attempts } = await supabase
        .from('bagrut_attempts')
        .select('*')
        .eq('student_id', studentId)
        .in('exam_id', examIds);

      const now = new Date();
      const results: AvailableBagrutExam[] = activePubs.map((p: any) => {
        const exam = p.bagrut_exams;
        const examAttempts = (attempts || []).filter(a =>
          a.exam_id === exam.id && (a.publication_id === p.id || a.publication_id === null)
        );
        const submitted = examAttempts.filter(a => a.status === 'submitted' || a.status === 'graded');
        const inProgress = examAttempts.find(a => a.status === 'in_progress');

        const attemptsUsed = submitted.length;
        const maxAttempts = p.max_attempts || 1;
        const attemptsRemaining = Math.max(0, maxAttempts - attemptsUsed);

        const from = p.available_from ? new Date(p.available_from) : null;
        const until = p.available_until ? new Date(p.available_until) : null;
        const withinWindow = (!from || from <= now) && (!until || until >= now);
        const canStart = withinWindow && (attemptsRemaining > 0 || !!inProgress);

        const best = submitted.reduce((acc: any, cur: any) => {
          if (!acc) return cur;
          return (cur.percentage || 0) > (acc.percentage || 0) ? cur : acc;
        }, null);

        const last = examAttempts.sort((a, b) =>
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        )[0];

        return {
          id: exam.id,
          publication_id: p.id,
          title: exam.title,
          exam_year: exam.exam_year,
          exam_season: exam.exam_season,
          subject: exam.subject,
          duration_minutes: exam.duration_minutes || 180,
          total_points: exam.total_points || 100,
          instructions: exam.instructions,
          is_published: !!exam.is_published,
          available_from: p.available_from,
          available_until: p.available_until,
          max_attempts: maxAttempts,
          show_answers_to_students: !!p.show_answers_to_students,
          allow_review_after_submit: p.allow_review_after_submit !== false,
          attempts_used: attemptsUsed,
          attempts_remaining: attemptsRemaining,
          can_start: canStart,
          last_attempt_status: last?.status || null,
          best_score: best?.score ?? null,
          best_percentage: best?.percentage ?? null,
        };
      });

      // إذا للطالب أكثر من نشر لنفس الامتحان (لا يحدث عادة) — نعتمد أحدث نافذة فعالة
      const byExam = new Map<string, AvailableBagrutExam>();
      for (const r of results) {
        const existing = byExam.get(r.id);
        if (!existing) { byExam.set(r.id, r); continue; }
        // أولوية للنشر القابل للبدء
        if (r.can_start && !existing.can_start) byExam.set(r.id, r);
      }

      // اعرض حتى المنتهية إذا كان للطالب محاولات (للنتائج)
      return Array.from(byExam.values()).filter(r =>
        r.can_start || r.attempts_used > 0 || (r.available_from && new Date(r.available_from) > new Date())
      );
    },
    enabled: !!studentId,
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
  });
};
