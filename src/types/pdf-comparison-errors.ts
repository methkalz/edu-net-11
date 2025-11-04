// أنواع الأخطاء المخصصة لنظام مقارنة PDF

export enum PDFErrorCode {
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  TEXT_TOO_LONG = 'TEXT_TOO_LONG',
  EXTRACTION_FAILED = 'EXTRACTION_FAILED',
  COMPARISON_TIMEOUT = 'COMPARISON_TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INVALID_FILE = 'INVALID_FILE',
  CPU_LIMIT_EXCEEDED = 'CPU_LIMIT_EXCEEDED',
  MEMORY_LIMIT_EXCEEDED = 'MEMORY_LIMIT_EXCEEDED',
}

export interface PDFErrorDetails {
  fileSize?: number;
  fileName?: string;
  wordCount?: number;
  maxAllowed?: number;
  processingTime?: number;
  timeLimit?: number;
  technicalError?: string;
}

export class PDFComparisonError extends Error {
  code: PDFErrorCode;
  details: PDFErrorDetails;
  suggestions: string[];
  
  constructor(
    code: PDFErrorCode, 
    message: string, 
    details: PDFErrorDetails = {},
    suggestions: string[] = []
  ) {
    super(message);
    this.name = 'PDFComparisonError';
    this.code = code;
    this.details = details;
    this.suggestions = suggestions;
  }

  static fromResponse(error: any): PDFComparisonError {
    if (error?.error) {
      return new PDFComparisonError(
        error.error.code || PDFErrorCode.UNKNOWN_ERROR,
        error.error.message || 'حدث خطأ غير متوقع',
        error.error.details || {},
        error.error.suggestions || []
      );
    }
    
    // التعرف على أخطاء شائعة
    const errorMessage = error?.message || String(error);
    
    if (errorMessage.includes('CPU') || errorMessage.includes('compute resources')) {
      return new PDFComparisonError(
        PDFErrorCode.CPU_LIMIT_EXCEEDED,
        'الملف كبير جداً ويتطلب وقت معالجة طويل',
        { technicalError: errorMessage },
        [
          'قلل حجم الملف إلى أقل من 15MB',
          'تأكد من أن الملف لا يحتوي على صور كثيرة',
          'حاول تقسيم المشروع إلى ملفات أصغر',
        ]
      );
    }
    
    if (errorMessage.includes('timeout') || errorMessage.includes('WORKER_LIMIT')) {
      return new PDFComparisonError(
        PDFErrorCode.COMPARISON_TIMEOUT,
        'انتهت مهلة المعالجة - الملف يحتاج وقت طويل',
        { technicalError: errorMessage },
        [
          'قلل حجم الملف',
          'تأكد من أن الملف نصي وليس مجرد صور ممسوحة',
        ]
      );
    }
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return new PDFComparisonError(
        PDFErrorCode.NETWORK_ERROR,
        'مشكلة في الاتصال بالشبكة',
        { technicalError: errorMessage },
        [
          'تحقق من اتصالك بالإنترنت',
          'أعد المحاولة بعد قليل',
        ]
      );
    }
    
    return new PDFComparisonError(
      PDFErrorCode.UNKNOWN_ERROR,
      errorMessage || 'حدث خطأ غير متوقع',
      { technicalError: errorMessage },
      ['حاول مرة أخرى', 'إذا استمر الخطأ، تواصل مع الدعم الفني']
    );
  }
}

// دوال مساعدة للتحقق من حجم الملف
export const FILE_SIZE_LIMITS = {
  MAX_FILE_SIZE_MB: 20,
  MAX_FILE_SIZE_BYTES: 20 * 1024 * 1024,
  WARN_FILE_SIZE_MB: 15,
  WARN_FILE_SIZE_BYTES: 15 * 1024 * 1024,
  MAX_WORD_COUNT: 100000,
  WARN_WORD_COUNT: 50000,
};

export function checkFileSize(file: File): { valid: boolean; warning?: string; error?: string } {
  const sizeInMB = file.size / 1024 / 1024;
  
  if (file.size > FILE_SIZE_LIMITS.MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `الملف كبير جداً (${sizeInMB.toFixed(1)}MB). الحد الأقصى المسموح: ${FILE_SIZE_LIMITS.MAX_FILE_SIZE_MB}MB`,
    };
  }
  
  if (file.size > FILE_SIZE_LIMITS.WARN_FILE_SIZE_BYTES) {
    return {
      valid: true,
      warning: `الملف كبير (${sizeInMB.toFixed(1)}MB). قد يستغرق وقتاً أطول في المعالجة.`,
    };
  }
  
  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} بايت`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
