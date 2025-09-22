// ترجمة رسائل الأخطاء العامة
export class MessageTranslator {
  private static readonly TRANSLATION_PATTERNS: Array<[RegExp, string]> = [
    [/network.*error/i, 'مشكلة في الاتصال بالشبكة'],
    [/timeout/i, 'انتهت مهلة الطلب'],
    [/unauthorized/i, 'غير مصرح لك بهذا الإجراء'],
    [/forbidden/i, 'مرفوض'],
    [/not.*found/i, 'لم يتم العثور على المحتوى'],
    [/validation.*error/i, 'خطأ في البيانات المدخلة'],
    [/duplicate/i, 'هذا العنصر موجود مسبقاً'],
  ];

  static translate(message: string): string {
    for (const [pattern, translation] of this.TRANSLATION_PATTERNS) {
      if (pattern.test(message)) {
        return translation;
      }
    }

    return message || 'حدث خطأ غير متوقع';
  }

  static isNetworkError(message: string): boolean {
    return /network.*error|timeout/i.test(message);
  }

  static isValidationError(message: string): boolean {
    return /validation.*error|duplicate/i.test(message);
  }

  static isPermissionError(message: string): boolean {
    return /unauthorized|forbidden/i.test(message);
  }
}