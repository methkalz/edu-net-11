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
