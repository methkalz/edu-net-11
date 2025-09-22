/**
 * معالج الأخطاء المتخصص لنظام إدارة بيانات الألعاب
 */
import { AppErrorHandler } from '../core/error-handler';
import { ErrorFactory } from '../factory/error-factory';
import { logger } from '../../logger';
import type { AppError } from '../types/error-types';

export interface GameDataError extends AppError {
  operation: 'fetch_stats' | 'reset_user' | 'reset_lesson' | 'reset_all' | 'reset_game';
  affectedTables?: string[];
  dataLoss?: boolean;
}

export interface GameDataRetryConfig {
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
}

class GameDataErrorHandler {
  private static gameInstance: GameDataErrorHandler;
  private baseErrorHandler: AppErrorHandler;
  
  private constructor() {
    this.baseErrorHandler = AppErrorHandler.getInstance();
  }
  
  static getGameInstance(): GameDataErrorHandler {
    if (!GameDataErrorHandler.gameInstance) {
      GameDataErrorHandler.gameInstance = new GameDataErrorHandler();
    }
    return GameDataErrorHandler.gameInstance;
  }

  /**
   * معالجة أخطاء العمليات الخاصة ببيانات الألعاب
   */
  handleGameDataError(
    error: unknown, 
    operation: GameDataError['operation'],
    context?: Record<string, unknown>
  ): GameDataError {
    const gameError = this.createGameDataError(error, operation, context);
    
    // تسجيل متقدم للأخطاء الحرجة
    if (gameError.operation === 'reset_all') {
      logger.error('🚨 Critical Game Data Operation Failed', new Error(gameError.message), {
        operation: gameError.operation,
        affectedTables: gameError.affectedTables,
        dataLoss: gameError.dataLoss,
        context: gameError.details
      });
    }

    // معالجة عامة للخطأ
    return this.baseErrorHandler.handleError(gameError, context) as GameDataError;
  }

  /**
   * إنشاء خطأ متخصص لبيانات الألعاب
   */
  private createGameDataError(
    error: unknown,
    operation: GameDataError['operation'],
    context?: Record<string, unknown>
  ): GameDataError {
    const baseError = ErrorFactory.createFromUnknown(error, context);
    
    let affectedTables: string[] = [];
    let dataLoss = false;
    let message = baseError.message;

    // تخصيص الرسالة والبيانات حسب نوع العملية
    switch (operation) {
      case 'fetch_stats':
        message = 'فشل في جلب إحصائيات بيانات الألعاب';
        affectedTables = ['grade11_game_progress', 'grade11_game_achievements'];
        break;
      case 'reset_user':
        message = 'فشل في تصفير بيانات المستخدم';
        affectedTables = ['grade11_game_progress', 'grade11_game_achievements'];
        dataLoss = true;
        break;
      case 'reset_lesson':
        message = 'فشل في تصفير بيانات الدرس';
        affectedTables = ['grade11_game_progress'];
        dataLoss = true;
        break;
      case 'reset_all':
        message = '🚨 فشل في تصفير جميع بيانات الألعاب - عملية حرجة';
        affectedTables = [
          'grade11_game_progress',
          'grade11_game_achievements', 
          'grade11_player_analytics',
          'grade11_generated_questions',
          'grade11_player_profiles',
          'grade11_game_sessions'
        ];
        dataLoss = true;
        break;
    }

    return {
      ...baseError,
      message,
      operation,
      affectedTables,
      dataLoss,
      code: `GAME_DATA_${operation.toUpperCase()}_ERROR`
    };
  }

  /**
   * محاولة استرداد من الخطأ مع إعادة المحاولة
   */
  async withGameDataRetry<T>(
    operation: () => Promise<T>,
    operationType: GameDataError['operation'],
    config: Partial<GameDataRetryConfig> = {}
  ): Promise<T | null> {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      exponentialBackoff = true
    } = config;

    let lastError: unknown;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        // حساب فترة الانتظار
        const delay = exponentialBackoff 
          ? retryDelay * Math.pow(2, attempt - 1)
          : retryDelay;
        
        logger.warn(`Game data operation failed, retrying (${attempt}/${maxRetries})`, {
          operation: operationType,
          attempt,
          nextRetryIn: delay,
          error: String(error)
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // معالجة الخطأ النهائي
    this.baseErrorHandler.handleError(lastError, {
      maxRetries,
      finalAttempt: true,
      allAttemptsFailed: true,
      operationType
    });
    
    return null;
  }

  /**
   * التحقق من حالة النظام والاستعداد للعمليات
   */
  async validateSystemHealth(userProfile?: { role?: string } | null): Promise<{
    healthy: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // تسجيل محاولة فحص النظام
      logger.info('Starting system health check', {
        userRole: userProfile?.role || 'unknown',
        timestamp: new Date().toISOString()
      });

      // فحص الاتصال بقاعدة البيانات
      const { error: connectionError } = await fetch('/api/health', {
        method: 'HEAD'
      }).then(r => ({ error: !r.ok ? 'Connection failed' : null }))
        .catch(() => ({ error: 'Network error' }));

      if (connectionError) {
        issues.push('مشكلة في الاتصال بقاعدة البيانات');
        recommendations.push('تحقق من حالة الشبكة والخادم');
        logger.warn('Database connection check failed', { error: connectionError });
      }

      // فحص صلاحيات المستخدم الحالي باستخدام البيانات الممررة
      if (!userProfile || userProfile.role !== 'superadmin') {
        issues.push('صلاحيات غير كافية للعملية');
        recommendations.push('تأكد من تسجيل الدخول كمدير نظام عام');
        logger.warn('Insufficient permissions detected', {
          currentRole: userProfile?.role || 'none',
          requiredRole: 'superadmin'
        });
      }

      const result = {
        healthy: issues.length === 0,
        issues,
        recommendations
      };

      logger.info('System health check completed', {
        healthy: result.healthy,
        issuesCount: issues.length,
        userRole: userProfile?.role || 'unknown'
      });

      return result;

    } catch (error) {
      logger.error('System health check failed', error as Error, {
        userRole: userProfile?.role || 'unknown',
        errorMessage: (error as Error).message
      });
      return {
        healthy: false,
        issues: ['فشل في فحص حالة النظام'],
        recommendations: ['أعد تحميل الصفحة وحاول مرة أخرى']
      };
    }
  }
}

export const gameDataErrorHandler = GameDataErrorHandler.getGameInstance();