import { formatDistanceToNow, isWithinInterval, subDays, subHours } from 'date-fns';
import { ar } from 'date-fns/locale';

/**
 * تنسيق الوقت النسبي بالعربية
 */
export const formatRelativeTime = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(dateObj, { 
      addSuffix: true, 
      locale: ar 
    });
  } catch {
    return 'غير متاح';
  }
};

/**
 * تنسيق المدة الزمنية (بالدقائق) إلى ساعات ودقائق
 */
export const formatDuration = (minutes: number): string => {
  if (!minutes || minutes === 0) return '0 دقيقة';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins} دقيقة`;
  if (mins === 0) return `${hours} ساعة`;
  
  return `${hours} ساعة و ${mins} دقيقة`;
};

/**
 * التحقق من أن التاريخ خلال آخر 24 ساعة
 */
export const isWithinLast24Hours = (date: string | Date): boolean => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const twentyFourHoursAgo = subHours(now, 24);
    
    return isWithinInterval(dateObj, {
      start: twentyFourHoursAgo,
      end: now
    });
  } catch {
    return false;
  }
};

/**
 * التحقق من أن التاريخ خلال آخر 30 يوم
 */
export const isWithinLast30Days = (date: string | Date): boolean => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    
    return isWithinInterval(dateObj, {
      start: thirtyDaysAgo,
      end: now
    });
  } catch {
    return false;
  }
};

/**
 * حساب متوسط الوقت
 */
export const calculateAverageTime = (totalMinutes: number[]): number => {
  if (!totalMinutes || totalMinutes.length === 0) return 0;
  const sum = totalMinutes.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / totalMinutes.length);
};
