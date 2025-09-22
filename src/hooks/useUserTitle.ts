import { useMemo } from 'react';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface UserTitleData {
  role: AppRole;
  displayTitle?: string | null;
  points?: number | null;
  level?: number | null;
}

export const useUserTitle = ({ role, displayTitle, points, level }: UserTitleData) => {
  
  const calculatedTitle = useMemo(() => {
    // If there's a custom display title, use it
    if (displayTitle) return displayTitle;
    
    // For students, calculate title based on points
    if (role === 'student' && points !== null && points !== undefined) {
      if (points >= 2000) return 'طالب خبير';
      if (points >= 1000) return 'طالب متميز';
      if (points >= 500) return 'طالب نشط';
      return 'طالب جديد';
    }
    
    // Default titles for roles
    const defaultTitles: Record<AppRole, string> = {
      teacher: 'معلم',
      school_admin: 'مدير مدرسة',
      superadmin: 'مدير النظام',
      student: 'طالب جديد',
      parent: 'ولي أمر'
    };
    
    return defaultTitles[role] || 'مستخدم';
  }, [role, displayTitle, points]);

  const calculatedLevel = useMemo(() => {
    if (role !== 'student' || !points) return level || 1;
    
    // Calculate level based on points
    if (points >= 2000) return 5;
    if (points >= 1000) return 4;
    if (points >= 500) return 3;
    if (points >= 200) return 2;
    return 1;
  }, [role, points, level]);

  const nextLevelPoints = useMemo(() => {
    if (role !== 'student' || !points) return null;
    
    const thresholds = [200, 500, 1000, 2000];
    const nextThreshold = thresholds.find(threshold => points < threshold);
    
    return nextThreshold || null;
  }, [role, points]);

  const progressToNextLevel = useMemo(() => {
    if (role !== 'student' || !points || !nextLevelPoints) return null;
    
    const currentLevelThresholds = [0, 200, 500, 1000, 2000];
    const currentThreshold = currentLevelThresholds[calculatedLevel - 1] || 0;
    
    const progress = ((points - currentThreshold) / (nextLevelPoints - currentThreshold)) * 100;
    return Math.min(100, Math.max(0, progress));
  }, [role, points, nextLevelPoints, calculatedLevel]);

  const starCount = useMemo(() => {
    return Math.min(calculatedLevel, 5);
  }, [calculatedLevel]);

  return {
    title: calculatedTitle,
    level: calculatedLevel,
    starCount,
    nextLevelPoints,
    progressToNextLevel,
    isStudent: role === 'student'
  };
};