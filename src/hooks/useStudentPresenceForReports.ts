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

      // جلب بيانات student_presence مع معلومات الطالب
      const { data: presenceData, error: presenceError } = await supabase
        .from('student_presence')
        .select(`
          *,
          student:students!inner(
            id,
            full_name,
            username,
            email
          )
        `)
        .order('last_seen_at', { ascending: false });

      if (presenceError) {
        console.error('❌ Error fetching student presence:', presenceError);
        setError(presenceError.message);
        return;
      }

      if (!presenceData || presenceData.length === 0) {
        setStudents([]);
        console.log('ℹ️ No student presence records found');
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

      // جلب معلومات الصفوف
      const studentIds = presenceData.map(p => p.student_id);
      const { data: classData, error: classError } = await supabase
        .from('class_students')
        .select(`
          student_id,
          class:classes!inner(
            id,
            class_name:class_names!inner(name),
            grade_level:grade_levels!inner(label)
          )
        `)
        .in('student_id', studentIds);

      if (classError) {
        console.error('❌ Error fetching class info:', classError);
      }

      // دمج البيانات
      const schoolsMap = new Map(schoolsData?.map(s => [s.id, s.name]) || []);
      const classMap = new Map(classData?.map(c => [c.student_id, c.class]) || []);
      
      const formattedData: StudentPresenceReportData[] = presenceData.map((item: any) => {
        const classInfo = classMap.get(item.student_id);
        
        // حساب الثواني منذ آخر تواجد
        const lastSeenDate = new Date(item.last_seen_at);
        const now = new Date();
        const secondsSinceLastSeen = (now.getTime() - lastSeenDate.getTime()) / 1000;
        
        // نعتبره متواجد إذا: is_online === true أو last_seen_at خلال آخر 120 ثانية
        const isActuallyOnline = item.is_online || secondsSinceLastSeen < 120;
        
        return {
          id: item.id,
          user_id: item.user_id,
          student_id: item.student_id,
          school_id: item.school_id,
          school_name: schoolsMap.get(item.school_id) || 'Unknown',
          full_name: item.student?.full_name || 'Unknown',
          email: item.student?.email || '',
          username: item.student?.username || '',
          is_online: isActuallyOnline,
          last_seen_at: item.last_seen_at,
          current_page: item.current_page,
          class_name: classInfo?.class_name?.name,
          grade_level: classInfo?.grade_level?.label,
        };
      });

      setStudents(formattedData);
      const onlineCount = formattedData.filter(s => s.is_online).length;
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
    onlineStudents: students.filter(s => s.is_online),
    offlineStudents: students.filter(s => !s.is_online),
  };
};
