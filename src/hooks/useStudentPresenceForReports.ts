import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StudentPresenceReportData {
  id: string;
  user_id: string;
  student_id: string;
  school_id: string;
  school_name: string;
  full_name: string;
  email: string;
  username: string;
  is_online: boolean;
  last_seen_at: string;
  current_page: string | null;
  class_name?: string;
  grade_level?: string;
  is_online_now: boolean;
  is_active_last_24h: boolean;
  is_active_last_30d: boolean;
}

/**
 * Hook لجلب بيانات حضور الطلاب للسوبر أدمن في صفحة التقارير
 */
export const useStudentPresenceForReports = () => {
  const [students, setStudents] = useState<StudentPresenceReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudentPresence = async () => {
    try {
      setLoading(true);
      setError(null);

      // استدعاء الدالة الجديدة التي تحسب كل شيء على الخادم
      const { data, error: rpcError } = await supabase
        .rpc('get_active_students_for_reports');

      if (rpcError) {
        console.error('❌ Error fetching student presence:', rpcError);
        setError(rpcError.message);
        return;
      }

      if (!data || data.length === 0) {
        setStudents([]);
        console.log('ℹ️ No student presence records found');
        return;
      }

      // تحويل البيانات إلى الصيغة المطلوبة
      const formattedData: StudentPresenceReportData[] = data.map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        student_id: item.student_id,
        school_id: item.school_id,
        school_name: item.school_name,
        full_name: item.full_name,
        email: item.email,
        username: item.username,
        is_online: item.is_online,
        last_seen_at: item.last_seen_at,
        current_page: item.current_page,
        class_name: item.class_name,
        grade_level: item.grade_level,
        is_online_now: item.is_online_now,
        is_active_last_24h: item.is_active_last_24h,
        is_active_last_30d: item.is_active_last_30d,
      }));

      setStudents(formattedData);
      const onlineCount = formattedData.filter(s => s.is_online_now).length;
      console.log(`✅ Fetched ${formattedData.length} student presence records (${onlineCount} online)`);

    } catch (err) {
      console.error('❌ Unexpected error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentPresence();

    // تحديث دوري كل دقيقة
    const interval = setInterval(fetchStudentPresence, 60 * 1000);

    // الاستماع للتحديثات الفورية
    const channel = supabase
      .channel('student-presence-changes-reports')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_presence'
        },
        () => {
          console.log('🔄 Student presence changed, refreshing...');
          fetchStudentPresence();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    students,
    loading,
    error,
    refetch: fetchStudentPresence,
    onlineStudents: students.filter(s => s.is_online_now),
    offlineStudents: students.filter(s => !s.is_online_now),
  };
};
