import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface StudentPresence {
  id: string;
  full_name: string;
  username: string;
  class_name?: string;
  grade_level?: string;
  is_online: boolean;
  last_active_at?: string;
  status: 'online' | 'away' | 'offline';
}

interface StudentWithClass {
  id: string;
  full_name: string;
  username: string;
  school_id: string;
  created_at_utc: string;
  class_name?: string;
  grade_level?: string;
}

export const useTeacherStudentsPresence = () => {
  const { user } = useAuth();
  const [onlineStudents, setOnlineStudents] = useState<StudentPresence[]>([]);
  const [presenceChannel, setPresenceChannel] = useState<any>(null);

  const {
    data: allStudents = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['teacher-students', user?.id],
    queryFn: async (): Promise<StudentPresence[]> => {
      if (!user?.id) return [];

      // استخدام دالة get_students_for_teacher الموجودة
      const { data: studentsData, error: studentsError } = await supabase
        .rpc('get_students_for_teacher');

      if (studentsError) throw studentsError;

      // جلب آخر نشاط لكل طالب
      const studentIds = studentsData?.map(s => s.id) || [];
      const { data: activitiesData } = await supabase
        .from('student_activity_log')
        .select('student_id, created_at')
        .in('student_id', studentIds)
        .order('created_at', { ascending: false });

      // تنسيق البيانات
      const studentsWithPresence: StudentPresence[] = (studentsData || []).map(student => {
        const lastActivity = activitiesData?.find(a => a.student_id === student.id);
        const lastActiveAt = lastActivity?.created_at;
        const isRecent = lastActiveAt && 
          new Date().getTime() - new Date(lastActiveAt).getTime() < 5 * 60 * 1000; // آخر 5 دقائق

        return {
          id: student.id,
          full_name: student.full_name,
          username: student.username,
          class_name: undefined, // سيتم إضافة معلومات الصف لاحقاً
          grade_level: undefined,
          is_online: !!isRecent,
          last_active_at: lastActiveAt,
          status: isRecent ? 'online' : 'offline'
        };
      });

      return studentsWithPresence;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // تحديث كل 30 ثانية
  });

  // إعداد Realtime presence tracking
  useEffect(() => {
    if (!user?.id || !allStudents.length) return;

    const channel = supabase.channel('teacher-students-presence', {
      config: {
        presence: {
          key: `teacher-${user.id}`,
        },
      },
    });

    // تتبع انضمام/مغادرة الطلاب
    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const onlineUserIds = Object.keys(presenceState).map(key => 
          key.replace('student-', '')
        );

        // تحديث حالة الطلاب بناءً على presence
        setOnlineStudents(current => 
          allStudents.map(student => ({
            ...student,
            is_online: onlineUserIds.includes(student.id),
            status: onlineUserIds.includes(student.id) ? 'online' : 
                    student.last_active_at && 
                    new Date().getTime() - new Date(student.last_active_at).getTime() < 15 * 60 * 1000 
                    ? 'away' : 'offline'
          }))
        );
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('Student joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('Student left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // تتبع وجود المعلم
          await channel.track({
            user_id: user.id,
            role: 'teacher',
            online_at: new Date().toISOString(),
          });
        }
      });

    setPresenceChannel(channel);

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, allStudents]);

  // تحديث البيانات الأولية عند تغيير allStudents
  useEffect(() => {
    setOnlineStudents(allStudents);
  }, [allStudents]);

  // إحصائيات مفيدة
  const onlineCount = onlineStudents.filter(s => s.status === 'online').length;
  const awayCount = onlineStudents.filter(s => s.status === 'away').length;
  const totalCount = onlineStudents.length;

  // تجميع حسب الصف
  const studentsByClass = onlineStudents.reduce((acc, student) => {
    const classKey = student.class_name || 'غير محدد';
    if (!acc[classKey]) {
      acc[classKey] = [];
    }
    acc[classKey].push(student);
    return acc;
  }, {} as Record<string, StudentPresence[]>);

  return {
    students: onlineStudents,
    studentsByClass,
    onlineCount,
    awayCount,
    totalCount,
    isLoading,
    error,
    refetch,
    presenceChannel
  };
};