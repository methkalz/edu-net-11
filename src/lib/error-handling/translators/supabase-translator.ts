// ترجمة أخطاء Supabase
export class SupabaseErrorTranslator {
  private static readonly SUPABASE_TRANSLATIONS: Record<string, string> = {
    '23505': 'هذا العنصر موجود مسبقاً',
    '23503': 'لا يمكن حذف هذا العنصر لوجود عناصر مرتبطة به',
    '42501': 'ليس لديك صلاحية للقيام بهذا الإجراء',
    'PGRST116': 'لم يتم العثور على البيانات المطلوبة',
    'PGRST301': 'خطأ في بنية البيانات المرسلة',
    'network_error': 'مشكلة في الاتصال بالشبكة',
    'timeout': 'انتهت مهلة الطلب',
  };

  static translate(code: string, originalMessage: string): string {
    return this.SUPABASE_TRANSLATIONS[code] || originalMessage || 'حدث خطأ في قاعدة البيانات';
  }

  static isSupabaseError(error: unknown): boolean {
    return typeof error === 'object' && 
           error !== null && 
           'code' in error && 
           'message' in error;
  }
}