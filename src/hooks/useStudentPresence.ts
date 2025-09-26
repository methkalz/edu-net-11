import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface StudentPresence {
  id: string;
  student_id: string;
  user_id: string;
  school_id: string;
  is_online: boolean;
  last_seen_at: string;
  current_page?: string;
  student: {
    id: string;
    full_name: string;
    username?: string;
    email?: string;
  };
  class_info?: {
    class_name: string;
    grade_level: string;
  };
}

export interface ClassInfo {
  id: string;
  name: string;
  grade_level: string;
  student_count: number;
}

export const useStudentPresence = () => {
  const [onlineStudents, setOnlineStudents] = useState<StudentPresence[]>([]);
  const [allStudentPresence, setAllStudentPresence] = useState<StudentPresence[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userProfile } = useAuth();

  // جلب بيانات الطلاب والصفوف
  const fetchStudentPresence = async () => {
    if (!user || userProfile?.role !== 'teacher') return;

    try {
      setLoading(true);

      // جلب حالة حضور الطلاب
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
        console.error('Error fetching student presence:', presenceError);
        return;
      }

      // جلب معلومات الصفوف للطلاب
      const { data: classesData, error: classesError } = await supabase
        .from('class_students')
        .select(`
          student_id,
          class:classes!inner(
            id,
            class_name:class_names!inner(name),
            grade_level:grade_levels!inner(label)
          )
        `);

      if (classesError) {
        console.error('Error fetching classes:', classesError);
      }

      // دمج بيانات الصفوف مع بيانات الحضور
      const enrichedPresence = presenceData?.map(presence => {
        const classInfo = classesData?.find(c => c.student_id === presence.student_id);
        return {
          ...presence,
          class_info: classInfo ? {
            class_name: classInfo.class.class_name.name,
            grade_level: classInfo.class.grade_level.label
          } : undefined
        };
      }) || [];

      setAllStudentPresence(enrichedPresence);

      // فلترة الطلاب المتواجدين حاليا (آخر 5 دقائق)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const online = enrichedPresence.filter(presence => 
        presence.is_online || new Date(presence.last_seen_at) > fiveMinutesAgo
      );
      setOnlineStudents(online);

      // جلب قائمة الصفوف الفريدة
      if (classesData) {
        const classMap = new Map<string, ClassInfo>();
        classesData.forEach(item => {
          const key = item.class.id;
          if (classMap.has(key)) {
            classMap.get(key)!.student_count++;
          } else {
            classMap.set(key, {
              id: item.class.id,
              name: item.class.class_name.name,
              grade_level: item.class.grade_level.label,
              student_count: 1
            });
          }
        });
        setClasses(Array.from(classMap.values()));
      }

    } catch (error) {
      console.error('Error in fetchStudentPresence:', error);
    } finally {
      setLoading(false);
    }
  };

  // إعداد realtime للاستماع للتحديثات
  useEffect(() => {
    if (!user || userProfile?.role !== 'teacher') return;

    fetchStudentPresence();

    const channel = supabase
      .channel('student-presence-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_presence'
        },
        () => {
          fetchStudentPresence();
        }
      )
      .subscribe();

    // تحديث دوري كل دقيقة
    const interval = setInterval(fetchStudentPresence, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user, userProfile?.role]);

  // فلترة الطلاب حسب الصفوف المختارة
  const filteredStudents = selectedClasses.length > 0 
    ? onlineStudents.filter(student => {
        // البحث في بيانات class_info المخزنة مع كل طالب
        return student.class_info && 
               classes.some(c => 
                 selectedClasses.includes(c.id) && 
                 c.name === student.class_info!.class_name
               );
      })
    : onlineStudents;

  const toggleClassSelection = (classId: string) => {
    setSelectedClasses(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const clearClassSelection = () => setSelectedClasses([]);

  return {
    onlineStudents: filteredStudents,
    allStudentPresence,
    classes,
    selectedClasses,
    loading,
    toggleClassSelection,
    clearClassSelection,
    refresh: fetchStudentPresence
  };
};