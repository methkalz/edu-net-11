import { format as dateFnsFormat } from 'date-fns';

/**
 * تنسيق التاريخ والوقت باستخدام الأرقام الإنجليزية والتقويم الميلادي
 * الأشهر تُعرض بالأرقام وليس الأسماء
 */
export const formatDate = (date: Date | string, formatStr: string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // استخدام date-fns بدون locale عربي لضمان الأرقام الإنجليزية
  const formatted = dateFnsFormat(dateObj, formatStr);
  
  // التأكد من أن الأرقام إنجليزية (تحويل أي أرقام عربية محتملة)
  return formatted.replace(/[٠-٩]/g, (d) => 
    '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString()
  );
};

/**
 * تنسيقات شائعة محددة مسبقاً
 */
export const DateFormats = {
  // التاريخ فقط
  DATE_NUMERIC: 'dd/MM/yyyy',           // 15/03/2024
  DATE_NUMERIC_DASH: 'dd-MM-yyyy',      // 15-03-2024
  DATE_ISO: 'yyyy-MM-dd',               // 2024-03-15
  
  // التاريخ والوقت
  DATETIME_NUMERIC: 'dd/MM/yyyy - HH:mm',     // 15/03/2024 - 14:30
  DATETIME_NUMERIC_12H: 'dd/MM/yyyy - hh:mm a', // 15/03/2024 - 02:30 PM
  DATETIME_FULL: 'dd/MM/yyyy HH:mm:ss',       // 15/03/2024 14:30:45
  
  // الوقت فقط
  TIME_24H: 'HH:mm',                    // 14:30
  TIME_12H: 'hh:mm a',                  // 02:30 PM
  TIME_FULL: 'HH:mm:ss',                // 14:30:45
  
  // تنسيقات ISO
  ISO_DATETIME: "yyyy-MM-dd'T'HH:mm:ss", // 2024-03-15T14:30:45
} as const;

/**
 * تنسيق الأرقام بالإنجليزية (لا يستخدم toLocaleString العربي)
 */
export const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return '0';
  return num.toLocaleString('en-US');
};

/**
 * تنسيق التاريخ بالأرقام فقط (بدون أسماء الأشهر)
 * مثال: 15/03/2024
 */
export const formatDateNumericOnly = (date: Date | string): string => {
  return formatDate(date, DateFormats.DATE_NUMERIC);
};

/**
 * تنسيق التاريخ للرسوم البيانية (dd/MM)
 * مثال: 15/03
 */
export const formatDateChart = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
};

/**
 * دوال مساعدة سريعة
 */
export const formatDateNumeric = (date: Date | string) => 
  formatDate(date, DateFormats.DATE_NUMERIC);

export const formatDateTimeNumeric = (date: Date | string) => 
  formatDate(date, DateFormats.DATETIME_NUMERIC);

export const formatDateTime12H = (date: Date | string) => 
  formatDate(date, DateFormats.DATETIME_NUMERIC_12H);

export const formatTimeOnly = (date: Date | string) => 
  formatDate(date, DateFormats.TIME_24H);

/**
 * تحويل ISO string إلى تنسيق datetime-local لـ HTML5 input
 * يحول من: "2025-10-12T01:18:00.000Z" أو "2025-10-12T01:18:00+00:00"
 * إلى: "2025-10-12T01:18"
 */
export const toDateTimeLocalString = (isoString: string | Date | null | undefined): string => {
  if (!isoString) return '';
  
  try {
    const date = typeof isoString === 'string' ? new Date(isoString) : isoString;
    
    // التحقق من صحة التاريخ
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', isoString);
      return '';
    }
    
    // تحويل إلى التوقيت المحلي بتنسيق yyyy-MM-ddTHH:mm
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (error) {
    console.error('Error converting to datetime-local format:', error);
    return '';
  }
};

/**
 * تحويل قيمة datetime-local input إلى ISO string
 * يحول من: "2025-10-12T01:18"
 * إلى: "2025-10-12T01:18:00.000Z"
 */
export const fromDateTimeLocalString = (localString: string | null | undefined): string => {
  if (!localString) return '';
  
  try {
    // إضافة ثواني إذا لم تكن موجودة
    const dateTimeString = localString.includes(':') && localString.split(':').length === 2
      ? `${localString}:00`
      : localString;
    
    const date = new Date(dateTimeString);
    
    // التحقق من صحة التاريخ
    if (isNaN(date.getTime())) {
      console.warn('Invalid local datetime:', localString);
      return '';
    }
    
    return date.toISOString();
  } catch (error) {
    console.error('Error converting from datetime-local format:', error);
    return '';
  }
};
