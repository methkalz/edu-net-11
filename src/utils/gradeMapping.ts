// دالة تحويل أكواد الصفوف من الإنجليزية إلى العربية والعكس
export const gradeMapping = {
  // تحويل من كود إنجليزي إلى تسمية عربية
  codeToArabic: {
    '10': 'الصف العاشر',
    '11': 'الصف الحادي عشر', 
    '12': 'الصف الثاني عشر'
  },
  
  // تحويل من تسمية عربية إلى كود إنجليزي
  arabicToCode: {
    'الصف العاشر': '10',
    'الصف الحادي عشر': '11',
    'الصف الثاني عشر': '12'
  }
};

/**
 * تحويل كود الصف الإنجليزي إلى التسمية العربية
 */
export const getArabicGradeName = (code: string): string => {
  return gradeMapping.codeToArabic[code as keyof typeof gradeMapping.codeToArabic] || code;
};

/**
 * تحويل التسمية العربية إلى كود الصف الإنجليزي
 */
export const getGradeCode = (arabicName: string): string => {
  return gradeMapping.arabicToCode[arabicName as keyof typeof gradeMapping.arabicToCode] || arabicName;
};

/**
 * تحويل قائمة أكواد الصفوف إلى تسميات عربية
 */
export const convertCodesToArabic = (codes: string[]): string[] => {
  return codes.map(code => getArabicGradeName(code));
};

/**
 * تحويل قائمة التسميات العربية إلى أكواد
 */
export const convertArabicToCodes = (names: string[]): string[] => {
  return names.map(name => getGradeCode(name));
};