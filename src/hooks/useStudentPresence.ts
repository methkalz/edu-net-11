import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  const [recentlyLeftStudents, setRecentlyLeftStudents] = useState<StudentPresence[]>([]);
  const [allStudentPresence, setAllStudentPresence] = useState<StudentPresence[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('student-presence-selected-classes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { user, userProfile } = useAuth();
  
  // للتحكم في debouncing
  const debounceTimeout = useRef<NodeJS.Timeout>();
  const lastDataRef = useRef<string>('');
  const mountedRef = useRef(true);

  // حفظ الفلاتر في localStorage عند تغييرها
  useEffect(() => {
    localStorage.setItem('student-presence-selected-classes', JSON.stringify(selectedClasses));
  }, [selectedClasses]);

  // جلب بيانات الطلاب والصفوف مع debouncing محسن
  const fetchStudentPresence = useCallback(async (silent = false) => {
    if (!user || userProfile?.role !== 'teacher' || !mountedRef.current) return;

    try {
      if (!silent) setLoading(true);
      setRefreshing(true);

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

      // التحقق من تغيير البيانات لمنع re-render غير الضروري
      const dataHash = JSON.stringify(enrichedPresence.map(p => ({ id: p.id, last_seen_at: p.last_seen_at, is_online: p.is_online })));
      if (dataHash === lastDataRef.current && silent) {
        setRefreshing(false);
        return;
      }
      lastDataRef.current = dataHash;

      setAllStudentPresence(enrichedPresence);

      // فلترة الطلاب بحالات واضحة
      const now = Date.now();
      const oneMinute = 60 * 1000;
      const fiveMinutes = 5 * 60 * 1000;
      
      // المتصلون فعلياً فقط
      const actuallyOnline = enrichedPresence.filter(presence => {
        const lastSeen = new Date(presence.last_seen_at).getTime();
        const timeDiff = now - lastSeen;
        return presence.is_online && timeDiff <= oneMinute;
      });

      // الذين غادروا حديثاً (خلال 5 دقائق لكن ليسوا متصلين)
      const recentlyLeft = enrichedPresence.filter(presence => {
        const lastSeen = new Date(presence.last_seen_at).getTime();
        const timeDiff = now - lastSeen;
        return !presence.is_online && timeDiff > oneMinute && timeDiff <= fiveMinutes;
      });

      // كل المعروضين (متصلين + غادروا حديثاً)
      const allVisible = [...actuallyOnline, ...recentlyLeft].sort((a, b) => 
        new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime()
      );
      
      setOnlineStudents(actuallyOnline);
      setRecentlyLeftStudents(recentlyLeft);
      setLastUpdated(new Date());

      // جلب قائمة الصفوف الفريدة مع عدد الطلاب المتصلين
      if (classesData) {
        const classMap = new Map<string, ClassInfo>();
        classesData.forEach(item => {
          const key = item.class.id;
          const studentsInClass = allVisible.filter(p => 
            p.class_info && p.class_info.class_name === item.class.class_name.name
          );
          
          if (classMap.has(key)) {
            classMap.get(key)!.student_count++;
          } else {
            classMap.set(key, {
              id: item.class.id,
              name: item.class.class_name.name,
              grade_level: item.class.grade_level.label,
              student_count: studentsInClass.length
            });
          }
        });
        setClasses(Array.from(classMap.values()));
      }

    } catch (error) {
      console.error('Error in fetchStudentPresence:', error);
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  }, [user, userProfile?.role]);

  // دالة تحديث مع debouncing محسن
  const debouncedFetch = useCallback(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => fetchStudentPresence(true), 300);
  }, [fetchStudentPresence]);

  // إعداد realtime للاستماع للتحديثات مع تحسينات
  useEffect(() => {
    if (!user || userProfile?.role !== 'teacher') return;
    
    mountedRef.current = true;
    fetchStudentPresence(false);

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
          debouncedFetch();
        }
      )
      .subscribe();

    // تحديث دوري كل 30 ثانية (أقل تكراراً لتحسين الأداء)
    const interval = setInterval(() => fetchStudentPresence(true), 30000);

    return () => {
      mountedRef.current = false;
      supabase.removeChannel(channel);
      clearInterval(interval);
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [user, userProfile?.role, debouncedFetch, fetchStudentPresence]);

  // فلترة الطلاب حسب الصفوف المختارة مع memoization محسن
  const filteredOnlineStudents = useMemo(() => {
    if (selectedClasses.length === 0) return onlineStudents;
    return onlineStudents.filter(student => 
      student.class_info && 
      classes.some(c => 
        selectedClasses.includes(c.id) && 
        c.name === student.class_info!.class_name
      )
    );
  }, [onlineStudents, selectedClasses, classes]);

  const filteredRecentlyLeftStudents = useMemo(() => {
    if (selectedClasses.length === 0) return recentlyLeftStudents;
    return recentlyLeftStudents.filter(student => 
      student.class_info && 
      classes.some(c => 
        selectedClasses.includes(c.id) && 
        c.name === student.class_info!.class_name
      )
    );
  }, [recentlyLeftStudents, selectedClasses, classes]);

  const allVisibleStudents = useMemo(() => {
    return [...filteredOnlineStudents, ...filteredRecentlyLeftStudents];
  }, [filteredOnlineStudents, filteredRecentlyLeftStudents]);

  const toggleClassSelection = useCallback((classId: string) => {
    setSelectedClasses(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  }, []);

  const clearClassSelection = useCallback(() => setSelectedClasses([]), []);

  return {
    onlineStudents: filteredOnlineStudents,
    recentlyLeftStudents: filteredRecentlyLeftStudents,
    allVisibleStudents,
    actualOnlineCount: filteredOnlineStudents.length,
    totalVisibleCount: allVisibleStudents.length,
    allStudentPresence,
    classes,
    selectedClasses,
    loading,
    refreshing,
    lastUpdated,
    toggleClassSelection,
    clearClassSelection,
    refresh: () => fetchStudentPresence(false)
  };
};