/**
 * دالة إنشاء أسماء ملفات آمنة للتخزين الداخلي مع الاحتفاظ بالأسماء الأصلية للعرض
 * يدعم الأحرف العربية والعبرية في العرض، لكن يستخدم أسماء آمنة للتخزين
 */

export const createSafeStoragePath = (originalFileName: string, timestamp?: number): string => {
  // استخراج الامتداد
  const lastDotIndex = originalFileName.lastIndexOf('.');
  const extension = lastDotIndex > 0 ? originalFileName.substring(lastDotIndex) : '';
  
  // إنشاء اسم آمن باستخدام timestamp و UUID جزئي
  const timeStamp = timestamp || Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  
  // إنشاء اسم ملف آمن للتخزين الداخلي فقط
  return `${timeStamp}_${randomId}${extension}`;
};

export const hasUnsafeCharacters = (fileName: string): boolean => {
  // فحص وجود أحرف عربية أو عبرية أو أحرف خاصة قد تسبب مشاكل في التخزين
  const unsafePattern = /[\u0600-\u06FF\u0590-\u05FF]/;
  return unsafePattern.test(fileName);
};

export const validateFileName = (fileName: string): { isValid: boolean; message?: string } => {
  // فحص الامتدادات المسموحة
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.ppt', '.pptx'];
  const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  
  if (!allowedExtensions.includes(extension)) {
    return {
      isValid: false,
      message: 'نوع الملف غير مدعوم. الأنواع المدعومة: PDF, DOC, DOCX, TXT, PPT, PPTX'
    };
  }
  
  // فحص حجم الاسم
  if (fileName.length > 255) {
    return {
      isValid: false,
      message: 'اسم الملف طويل جداً (أقصى 255 حرف)'
    };
  }
  
  return { isValid: true };
};
