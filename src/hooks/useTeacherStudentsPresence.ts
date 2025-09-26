import { useState, useEffect, useMemo } from 'react';
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
  const [presenceChannel, setPresenceChannel] = useState<any>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const {
    data: allStudents = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['teacher-students', user?.id],
    queryFn: async (): Promise<StudentPresence[]> => {
      if (!user?.id) return [];

      try {
        // جلب الطلاب المكلف بهم المعلم
        const { data: studentsData, error: studentsError } = await supabase
          .rpc('get_students_for_teacher');

        if (studentsError) {
          console.error('Error fetching students:', studentsError);
          throw studentsError;
        }

        if (!studentsData || studentsData.length === 0) {
          return [];
        }

        // جلب معلومات الصفوف
        const studentIds = studentsData.map(s => s.id);
        const { data: classData } = await supabase
          .from('class_students')
          .select(`
            student_id,
            classes (
              grade_level_id,
              class_name_id,
              grade_levels (
                label,
                code
              ),
              class_names (
                name
              )
            )
          `)
          .in('student_id', studentIds);

        // جلب آخر نشاط لكل طالب من جدول student_activity_log
        const { data: activitiesData } = await supabase
          .from('student_activity_log')
          .select('student_id, created_at, activity_type')
          .in('student_id', studentIds)
          .order('created_at', { ascending: false });

        // تجميع آخر نشاط لكل طالب
        const lastActivities = activitiesData?.reduce((acc, activity) => {
          if (!acc[activity.student_id]) {
            acc[activity.student_id] = activity;
          }
          return acc;
        }, {} as Record<string, any>) || {};

        // تنسيق البيانات النهائية
        const studentsWithPresence: StudentPresence[] = studentsData.map(student => {
          const classInfo = classData?.find(c => c.student_id === student.id);
          const lastActivity = lastActivities[student.id];
          const lastActiveAt = lastActivity?.created_at;
          
          // تحديد الحالة بناءً على آخر نشاط وحالة الحضور
          const now = new Date().getTime();
          const lastActiveTime = lastActiveAt ? new Date(lastActiveAt).getTime() : 0;
          const timeDiff = now - lastActiveTime;
          
          // الطالب متواجد إذا كان في قائمة المتواجدين أو كان نشطاً في آخر 3 دقائق
          const isCurrentlyOnline = onlineUsers.has(student.id) || timeDiff < 3 * 60 * 1000;
          
          let status: 'online' | 'away' | 'offline';
          if (isCurrentlyOnline) {
            status = 'online';
          } else if (timeDiff < 15 * 60 * 1000) { // آخر 15 دقيقة
            status = 'away';
          } else {
            status = 'offline';
          }

          return {
            id: student.id,
            full_name: student.full_name,
            username: student.username,
            class_name: classInfo?.classes?.class_names?.name || 'غير محدد',
            grade_level: classInfo?.classes?.grade_levels?.label || classInfo?.classes?.grade_levels?.code || '',
            is_online: isCurrentlyOnline,
            last_active_at: lastActiveAt,
            status
          };
        });

        return studentsWithPresence;
      } catch (error) {
        console.error('Error in useTeacherStudentsPresence:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
    refetchInterval: 20000, // تحديث كل 20 ثانية
    retry: 2,
    staleTime: 10000, // البيانات تعتبر قديمة بعد 10 ثوان
  });

  // إعداد Realtime presence tracking - نظام محسن
  useEffect(() => {
    if (!user?.id) return;

    const schoolId = user.user_metadata?.school_id;
    if (!schoolId) return;

    // إنشاء channel خاص بالمدرسة
    const channel = supabase.channel(`school-${schoolId}-presence`, {
      config: {
        presence: {
          key: `teacher-${user.id}`,
        },
      },
    });

    let heartbeatInterval: NodeJS.Timeout;

    const setupChannel = async () => {
      try {
        channel
          .on('presence', { event: 'sync' }, () => {
            const presenceState = channel.presenceState();
            
            // استخراج IDs الطلاب المتواجدين
            const onlineUserIds = new Set<string>();
            Object.values(presenceState).forEach((presences: any) => {
              presences.forEach((presence: any) => {
                if (presence.user_id && presence.role === 'student') {
                  onlineUserIds.add(presence.user_id);
                }
              });
            });
            
            setOnlineUsers(onlineUserIds);
          })
          .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            console.log('User joined:', key, newPresences);
          })
          .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            console.log('User left:', key, leftPresences);
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              // تتبع وجود المعلم
              await channel.track({
                user_id: user.id,
                role: 'teacher',
                full_name: user.user_metadata?.full_name || user.email,
                online_at: new Date().toISOString(),
                school_id: schoolId
              });

              // إعداد heartbeat للحفاظ على الاتصال
              heartbeatInterval = setInterval(async () => {
                try {
                  await channel.track({
                    user_id: user.id,
                    role: 'teacher',
                    full_name: user.user_metadata?.full_name || user.email,
                    online_at: new Date().toISOString(),
                    school_id: schoolId,
                    last_heartbeat: new Date().toISOString()
                  });
                } catch (error) {
                  console.error('Heartbeat error:', error);
                }
              }, 30000); // كل 30 ثانية
            }
          });

        setPresenceChannel(channel);
      } catch (error) {
        console.error('Error setting up presence channel:', error);
      }
    };

    setupChannel();

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      channel.unsubscribe();
    };
  }, [user?.id, user?.user_metadata?.school_id]);

  // البيانات محدثة بالفعل في queryFn، نستخدم البيانات المحدثة مباشرة
  const studentsWithPresence = useMemo(() => {
    return allStudents.map(student => {
      // تحديث الحالة بناءً على أحدث بيانات presence
      const isCurrentlyOnline = onlineUsers.has(student.id);
      const isRecentlyActive = student.last_active_at && 
        new Date().getTime() - new Date(student.last_active_at).getTime() < 15 * 60 * 1000;

      let status: 'online' | 'away' | 'offline';
      if (isCurrentlyOnline) {
        status = 'online';
      } else if (isRecentlyActive) {
        status = 'away';
      } else {
        status = 'offline';
      }

      return {
        ...student,
        is_online: isCurrentlyOnline,
        status
      };
    });
  }, [allStudents, onlineUsers]);

  // إحصائيات مفيدة
  const onlineCount = studentsWithPresence.filter(s => s.status === 'online').length;
  const awayCount = studentsWithPresence.filter(s => s.status === 'away').length;
  const totalCount = studentsWithPresence.length;

  // تجميع حسب الصف
  const studentsByClass = studentsWithPresence.reduce((acc, student) => {
    const classKey = student.class_name || 'غير محدد';
    if (!acc[classKey]) {
      acc[classKey] = [];
    }
    acc[classKey].push(student);
    return acc;
  }, {} as Record<string, StudentPresence[]>);

  return {
    students: studentsWithPresence,
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