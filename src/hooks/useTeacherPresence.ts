import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TeacherPresenceData {
  id: string;
  user_id: string;
  school_id: string;
  school_name: string;
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

      // جلب بيانات المدارس
      const schoolIds = [...new Set(presenceData.map(p => p.school_id))];
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('schools')
        .select('id, name')
        .in('id', schoolIds);

      if (schoolsError) {
        console.error('❌ Error fetching schools:', schoolsError);
        setError(schoolsError.message);
        return;
      }

      // دمج البيانات
      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      const schoolsMap = new Map(schoolsData?.map(s => [s.id, s.name]) || []);
      
      const formattedData: TeacherPresenceData[] = presenceData.map((item: any) => {
        const profile = profilesMap.get(item.user_id);
        
        // حساب الثواني منذ آخر تواجد
        const lastSeenDate = new Date(item.last_seen_at);
        const now = new Date();
        const secondsSinceLastSeen = (now.getTime() - lastSeenDate.getTime()) / 1000;
        
        // نعتبره متواجد إذا: is_online === true أو last_seen_at خلال آخر 120 ثانية
        const isActuallyOnline = item.is_online || secondsSinceLastSeen < 120;
        
        return {
          id: item.id,
          user_id: item.user_id,
          school_id: item.school_id,
          school_name: schoolsMap.get(item.school_id) || 'Unknown',
          role: item.role,
          full_name: profile?.full_name || 'Unknown',
          email: profile?.email || 'Unknown',
          is_online: isActuallyOnline,
          last_seen_at: item.last_seen_at,
          current_page: item.current_page,
          total_time_minutes: item.total_time_minutes || 0,
          login_count: profile?.login_count || 0,
          last_login_at: profile?.last_login_at || null,
        };
      });

      setTeachers(formattedData);
      const onlineCount = formattedData.filter(t => t.is_online).length;
      console.log(`✅ Fetched ${formattedData.length} teacher presence records (${onlineCount} online)`);
      formattedData.forEach(t => {
        if (t.is_online) {
          console.log(`🟢 ${t.full_name} (${t.role}) - Online (last seen: ${t.last_seen_at})`);
        }
      });

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
