import { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface StudentPresenceData {
  student_id: string;
  user_id: string;
  school_id: string;
  is_online: boolean;
  last_seen_at: string;
  current_page: string | null;
}

interface DailyStats {
  date: string;
  total_active_students: number;
  peak_hour: number | null;
  avg_session_duration: number | null;
  class_distribution: Record<string, number>;
  most_visited_pages: Record<string, number>;
}

interface AdvancedStats {
  // KPIs الحالية
  currentOnline: number;
  todayActive: number;
  yesterdayActive: number;
  weeklyActive: number;
  
  // أوقات الذروة
  peakHour: number | null;
  peakHourData: Array<{ hour: number; count: number }>;
  
  // توزيع الصفوف
  classDistribution: Record<string, number>;
  
  // أكثر الصفحات زيارة
  topPages: Array<{ page: string; visits: number; percentage: number }>;
  
  // اتجاهات الحضور (آخر 7 أيام)
  weekTrend: Array<{
    date: string;
    active_students: number;
    day_name: string;
  }>;
  
  // الطلاب الغائبين لفترة طويلة
  longAbsentStudents: Array<{
    student_id: string;
    days_absent: number;
    last_seen: string;
  }>;
}

type TimePeriod = 'today' | 'week' | 'month';

export const useAdvancedStudentStats = (timePeriod: TimePeriod = 'today') => {
  const [stats, setStats] = useState<AdvancedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // حساب التواريخ
  const dateRange = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (timePeriod) {
      case 'today':
        return { 
          start: today, 
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000) 
        };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 6);
        return { 
          start: weekStart, 
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000) 
        };
      case 'month':
        const monthStart = new Date(today);
        monthStart.setDate(today.getDate() - 29);
        return { 
          start: monthStart, 
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000) 
        };
      default:
        return { 
          start: today, 
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000) 
        };
    }
  }, [timePeriod]);

  // جلب بيانات student_presence
  const fetchPresenceData = async () => {
    try {
      const { data, error } = await supabase
        .from('student_presence')
        .select('student_id, user_id, school_id, is_online, last_seen_at, current_page')
        .order('last_seen_at', { ascending: false });

      if (error) throw error;
      return data as StudentPresenceData[];
    } catch (err) {
      console.error('Error fetching presence data:', err);
      throw err;
    }
  };

  // جلب الإحصائيات التاريخية
  const fetchHistoricalStats = async () => {
    try {
      const startDate = dateRange.start.toISOString().split('T')[0];
      const endDate = dateRange.end.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('daily_activity_stats')
        .select('*')
        .gte('date', startDate)
        .lt('date', endDate)
        .order('date', { ascending: true });

      if (error) throw error;
      return data as DailyStats[];
    } catch (err) {
      console.error('Error fetching historical stats:', err);
      return [];
    }
  };

  // حساب الإحصائيات المتقدمة
  const calculateAdvancedStats = (
    presenceData: StudentPresenceData[],
    historicalData: DailyStats[]
  ): AdvancedStats => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    // الطلاب المتصلين حالياً
    const currentOnline = presenceData.filter(p => p.is_online).length;

    // الطلاب النشطين اليوم
    const todayActive = presenceData.filter(p => {
      const lastSeen = new Date(p.last_seen_at);
      return lastSeen >= today;
    }).length;

    // الطلاب النشطين أمس
    const yesterdayActive = presenceData.filter(p => {
      const lastSeen = new Date(p.last_seen_at);
      return lastSeen >= yesterday && lastSeen < today;
    }).length;

    // الطلاب النشطين هذا الأسبوع
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklyActive = presenceData.filter(p => {
      const lastSeen = new Date(p.last_seen_at);
      return lastSeen >= weekAgo;
    }).length;

    // حساب ساعة الذروة اليوم
    const todayPresence = presenceData.filter(p => {
      const lastSeen = new Date(p.last_seen_at);
      return lastSeen >= today;
    });
    
    const hourCounts = new Array(24).fill(0);
    todayPresence.forEach(p => {
      const hour = new Date(p.last_seen_at).getHours();
      hourCounts[hour]++;
    });
    
    const peakHour = hourCounts.reduce((maxIndex, count, index, arr) => 
      count > arr[maxIndex] ? index : maxIndex, 0
    );
    
    const peakHourData = hourCounts.map((count, hour) => ({ hour, count }));

    // توزيع الصفوف (محاكاة لحين ربط البيانات الحقيقية)
    const classDistribution: Record<string, number> = {};
    ['10', '11', '12'].forEach(grade => {
      classDistribution[grade] = Math.floor(todayActive / 3) + 
        Math.floor(Math.random() * 10);
    });

    // أكثر الصفحات زيارة
    const pageVisits: Record<string, number> = {};
    todayPresence.forEach(p => {
      if (p.current_page) {
        const page = p.current_page.replace(/^\//, '') || 'الصفحة الرئيسية';
        pageVisits[page] = (pageVisits[page] || 0) + 1;
      }
    });

    const totalVisits = Object.values(pageVisits).reduce((sum, count) => sum + count, 0);
    const topPages = Object.entries(pageVisits)
      .map(([page, visits]) => ({
        page,
        visits,
        percentage: totalVisits > 0 ? Math.round((visits / totalVisits) * 100) : 0
      }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 5);

    // اتجاه الحضور لآخر 7 أيام
    const weekTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const dayName = dayNames[date.getDay()];
      
      // البحث في البيانات التاريخية
      const historicalRecord = historicalData.find(h => h.date === dateStr);
      let activeStudents = 0;

      if (historicalRecord) {
        activeStudents = historicalRecord.total_active_students;
      } else {
        // حساب من بيانات student_presence
        const dayEnd = new Date(date.getTime() + 24 * 60 * 60 * 1000);
        activeStudents = presenceData.filter(p => {
          const lastSeen = new Date(p.last_seen_at);
          return lastSeen >= date && lastSeen < dayEnd;
        }).length;
      }

      weekTrend.push({
        date: dateStr,
        active_students: activeStudents,
        day_name: dayName
      });
    }

    // الطلاب الغائبين لفترة طويلة (أكثر من 3 أيام)
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const longAbsentStudents = presenceData
      .filter(p => {
        const lastSeen = new Date(p.last_seen_at);
        return lastSeen < threeDaysAgo;
      })
      .map(p => ({
        student_id: p.student_id,
        days_absent: Math.floor((now.getTime() - new Date(p.last_seen_at).getTime()) / (24 * 60 * 60 * 1000)),
        last_seen: p.last_seen_at
      }))
      .sort((a, b) => b.days_absent - a.days_absent)
      .slice(0, 10);

    return {
      currentOnline,
      todayActive,
      yesterdayActive,
      weeklyActive,
      peakHour: hourCounts[peakHour] > 0 ? peakHour : null,
      peakHourData,
      classDistribution,
      topPages,
      weekTrend,
      longAbsentStudents
    };
  };

  // جلب البيانات
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [presenceData, historicalData] = await Promise.all([
        fetchPresenceData(),
        fetchHistoricalStats()
      ]);

      const calculatedStats = calculateAdvancedStats(presenceData, historicalData);
      setStats(calculatedStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  // تشغيل حساب الإحصائيات اليومية
  const triggerDailyCalculation = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('calculate-daily-stats', {
        body: { 
          date: new Date().toISOString().split('T')[0]
        }
      });

      if (error) throw error;
      
      // إعادة جلب البيانات بعد الحساب
      await fetchData();
      return data;
    } catch (err) {
      console.error('Error triggering daily calculation:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchData();
  }, [timePeriod]);

  // إعادة جلب البيانات كل 2 دقيقة للبيانات الحية
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchData,
    triggerDailyCalculation,
    dateRange
  };
};