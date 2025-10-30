import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TeacherPresenceData {
  id: string;
  user_id: string;
  school_id: string;
  role: 'teacher' | 'school_admin';
  full_name: string;
  email: string;
  is_online: boolean;
  last_seen_at: string;
  current_page: string | null;
  total_time_minutes: number;
  login_count: number;
  last_login_at: string | null;
}

/**
 * Hook لجلب بيانات حضور المعلمين ومدراء المدارس
 * مخصص للسوبر أدمن
 */
export const useTeacherPresence = () => {
  const [teachers, setTeachers] = useState<TeacherPresenceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeacherPresence = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('teacher_presence')
        .select(`
          id,
          user_id,
          school_id,
          role,
          is_online,
          last_seen_at,
          current_page,
          total_time_minutes,
          profiles!inner (
            full_name,
            email,
            login_count,
            last_login_at
          )
        `)
        .order('last_seen_at', { ascending: false });

      if (fetchError) {
        console.error('❌ Error fetching teacher presence:', fetchError);
        setError(fetchError.message);
        return;
      }

      // تحويل البيانات للشكل المطلوب
      const formattedData: TeacherPresenceData[] = (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        school_id: item.school_id,
        role: item.role,
        full_name: item.profiles?.full_name || 'Unknown',
        email: item.profiles?.email || 'Unknown',
        is_online: item.is_online,
        last_seen_at: item.last_seen_at,
        current_page: item.current_page,
        total_time_minutes: item.total_time_minutes,
        login_count: item.profiles?.login_count || 0,
        last_login_at: item.profiles?.last_login_at || null,
      }));

      setTeachers(formattedData);
      console.log(`✅ Fetched ${formattedData.length} teacher presence records`);

    } catch (err) {
      console.error('❌ Unexpected error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherPresence();

    // تحديث دوري كل دقيقة
    const interval = setInterval(fetchTeacherPresence, 60 * 1000);

    // الاستماع للتحديثات الفورية
    const channel = supabase
      .channel('teacher-presence-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teacher_presence'
        },
        () => {
          console.log('🔄 Teacher presence changed, refreshing...');
          fetchTeacherPresence();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    teachers,
    loading,
    error,
    refetch: fetchTeacherPresence,
    onlineTeachers: teachers.filter(t => t.is_online),
    offlineTeachers: teachers.filter(t => !t.is_online),
  };
};
