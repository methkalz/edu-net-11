// إشعارات Toast للمستخدمين
import { toast } from 'sonner';
import type { AppError } from '../types/error-types';

export class ToastNotifier {
  static showError(error: AppError): void {
    const isValidation = this.isValidationError(error);
    const isNetwork = this.isNetworkError(error);
    const isPermission = this.isPermissionError(error);

    if (isValidation) {
      toast.warning(error.message, {
        description: 'يرجى مراجعة البيانات المدخلة والمحاولة مرة أخرى'
      });
    } else if (isNetwork) {
      toast.error(error.message, {
        description: 'يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى',
        action: {
          label: 'إعادة المحاولة',
          onClick: () => window.location.reload()
        }
      });
    } else if (isPermission) {
      toast.error(error.message, {
        description: 'يرجى التواصل مع المشرف إذا كنت تعتقد أن هذا خطأ'
      });
    } else {
      toast.error(error.message, {
        description: 'إذا استمر هذا الخطأ، يرجى التواصل مع الدعم الفني'
      });
    }
  }

  private static isValidationError(error: AppError): boolean {
    return error.code.includes('VALIDATION') || error.code === '23505';
  }

  private static isNetworkError(error: AppError): boolean {
    return error.code.includes('NETWORK') || error.code === 'network_error';
  }

  private static isPermissionError(error: AppError): boolean {
    return error.code === '42501' || error.code.includes('UNAUTHORIZED');
  }
}