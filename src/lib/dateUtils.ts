import { formatDistanceToNow } from 'date-fns';
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
 * التحقق من أن التاريخ خلال آخر 24 ساعة - دقة 100%
 */
export const isWithinLast24Hours = (date: string | Date): boolean => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // التحقق من صحة التاريخ
    if (isNaN(dateObj.getTime())) {
      console.error('Invalid date:', date);
      return false;
    }
    
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    // يجب أن يكون خلال آخر 24 ساعة (وليس في المستقبل)
    const result = diffHours >= 0 && diffHours <= 24;
    
    console.log('🕐 isWithinLast24Hours:', {
      date: dateObj.toISOString(),
      now: now.toISOString(),
      diffHours: diffHours.toFixed(2),
      result
    });
    
    return result;
  } catch (error) {
    console.error('Error in isWithinLast24Hours:', error);
    return false;
  }
};

/**
 * التحقق من أن التاريخ خلال آخر 30 يوم - دقة 100%
 */
export const isWithinLast30Days = (date: string | Date): boolean => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // التحقق من صحة التاريخ
    if (isNaN(dateObj.getTime())) {
      console.error('Invalid date:', date);
      return false;
    }
    
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    
    // يجب أن يكون خلال آخر 30 يوم (وليس في المستقبل)
    const result = diffDays >= 0 && diffDays <= 30;
    
    console.log('📅 isWithinLast30Days:', {
      date: dateObj.toISOString(),
      now: now.toISOString(),
      diffDays: diffDays.toFixed(2),
      result
    });
    
    return result;
  } catch (error) {
    console.error('Error in isWithinLast30Days:', error);
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
