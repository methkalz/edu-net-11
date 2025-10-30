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

      // جلب بيانات teacher_presence
      const { data: presenceData, error: presenceError } = await supabase
        .from('teacher_presence')
        .select('*')
        .order('last_seen_at', { ascending: false });

      if (presenceError) {
        console.error('❌ Error fetching teacher presence:', presenceError);
        setError(presenceError.message);
        return;
      }

      if (!presenceData || presenceData.length === 0) {
        setTeachers([]);
        console.log('ℹ️ No teacher presence records found');
        return;
      }

      // جلب بيانات المستخدمين من profiles
      const userIds = presenceData.map(p => p.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, login_count, last_login_at')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('❌ Error fetching profiles:', profilesError);
        setError(profilesError.message);
        return;
      }

      // دمج البيانات
      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      
      const formattedData: TeacherPresenceData[] = presenceData.map((item: any) => {
        const profile = profilesMap.get(item.user_id);
        return {
          id: item.id,
          user_id: item.user_id,
          school_id: item.school_id,
          role: item.role,
          full_name: profile?.full_name || 'Unknown',
          email: profile?.email || 'Unknown',
          is_online: item.is_online,
          last_seen_at: item.last_seen_at,
          current_page: item.current_page,
          total_time_minutes: item.total_time_minutes || 0,
          login_count: profile?.login_count || 0,
          last_login_at: profile?.last_login_at || null,
        };
      });

      setTeachers(formattedData);
      console.log(`✅ Fetched ${formattedData.length} teacher presence records (${formattedData.filter(t => t.is_online).length} online)`);

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
