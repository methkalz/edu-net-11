/**
 * إعداد نظام تحسين الأداء الشامل
 * يتم تشغيله عند بداية التطبيق لضمان أفضل أداء ممكن
 */

import { setupPerformanceMonitoring, MemoryLeakPrevention } from '@/utils/performanceUtils';
import { setupGlobalChunkErrorHandler } from '@/utils/chunkRetry';
import { Logger } from '@/lib/logging/core/logger';

// إعداد Logger محسّن للإنتاج
const performanceLogger = new Logger({
  isDevelopment: import.meta.env.DEV,
  maxLogEntries: 500,
  enableLocalStorage: import.meta.env.DEV
});

class PerformanceSetup {
  private static isInitialized = false;
  private static cleanupFunctions: (() => void)[] = [];

  static initialize() {
    if (this.isInitialized) {
      performanceLogger.warn('Performance setup already initialized');
      return;
    }

    performanceLogger.info('🚀 Initializing performance optimizations...');

    try {
      // 1. إعداد معالجة أخطاء الـ chunks
      setupGlobalChunkErrorHandler();
      performanceLogger.info('✅ Chunk error handling initialized');

      // 2. إعداد مراقبة الأداء والذاكرة
      setupPerformanceMonitoring();
      performanceLogger.info('✅ Performance monitoring initialized');

      // 3. تحسين الـ garbage collection
      this.setupGarbageCollectionOptimization();
      performanceLogger.info('✅ Garbage collection optimization initialized');

      // 4. إعداد تحسينات الشبكة
      this.setupNetworkOptimizations();
      performanceLogger.info('✅ Network optimizations initialized');

      // 5. إعداد تحسينات الـ DOM
      this.setupDOMOptimizations();
      performanceLogger.info('✅ DOM optimizations initialized');

      // 6. إعداد مراقبة الأخطاء العامة
      this.setupGlobalErrorHandling();
      performanceLogger.info('✅ Global error handling initialized');

      // 7. إعداد التنظيف التلقائي
      this.setupAutoCleanup();
      performanceLogger.info('✅ Auto cleanup initialized');

      this.isInitialized = true;
      performanceLogger.info('🎯 Performance setup completed successfully');

    } catch (error) {
      performanceLogger.error('❌ Failed to initialize performance setup', error);
    }
  }

  // تحسين الـ garbage collection
  private static setupGarbageCollectionOptimization() {
    // تشغيل تنظيف دوري للذاكرة
    const cleanupInterval = setInterval(() => {
      if (import.meta.env.DEV && 'memory' in performance) {
        const memory = (performance as any).memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        
        // إذا استخدمنا أكثر من 50MB، نطلب garbage collection
        if (usedMB > 50 && 'gc' in window && typeof (window as any).gc === 'function') {
          (window as any).gc();
          performanceLogger.info(`🗑️ Manual garbage collection triggered at ${usedMB}MB`);
        }
      }
    }, 60000); // كل دقيقة

    MemoryLeakPrevention.registerInterval(cleanupInterval);

    this.cleanupFunctions.push(() => {
      clearInterval(cleanupInterval);
    });
  }

  // تحسينات الشبكة
  private static setupNetworkOptimizations() {
    // تحسين الـ fetch requests
    const originalFetch = window.fetch;
    
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      // إذا كان هناك signal موجود مسبقاً، استخدمه بدلاً من إنشاء واحد جديد
      // هذا يسمح للطلبات الطويلة (مثل parse-bagrut-exam) بتحديد timeout خاص بها
      if (init?.signal) {
        return originalFetch(input, init);
      }
      
      // فقط للطلبات بدون signal نضيف timeout افتراضي 30 ثانية
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await originalFetch(input, {
          ...init,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    };

    // إعداد Service Worker للـ caching (إذا كان متاحاً)
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // تجاهل الأخطاء - Service Worker اختياري
      });
    }
  }

  // تحسينات الـ DOM
  private static setupDOMOptimizations() {
    // تحسين الـ event delegation
    document.addEventListener('click', (e) => {
      // تسجيل الضغطات للتحليل (في التطوير فقط)
      if (import.meta.env.DEV) {
        const target = e.target as HTMLElement;
        if (target.dataset.trackClick) {
          performanceLogger.info('Click tracked', { 
            element: target.tagName, 
            id: target.id, 
            className: target.className 
          });
        }
      }
    }, { passive: true });

    // تحسين الـ scroll performance
    let scrollTimeout: NodeJS.Timeout;
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        // تنظيف العناصر غير المرئية
        const hiddenElements = document.querySelectorAll('[data-cleanup-when-hidden]');
        hiddenElements.forEach(element => {
          const rect = element.getBoundingClientRect();
          const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
          
          if (!isVisible && element.getAttribute('data-cleaned') !== 'true') {
            // تنظيف المحتوى غير المرئي
            element.setAttribute('data-cleaned', 'true');
          }
        });
      }, 100);
    }, { passive: true });

    MemoryLeakPrevention.registerTimer(scrollTimeout);
  }

  // معالجة الأخطاء غير المُعالجة
  private static setupGlobalErrorHandling() {
    // معالجة الأخطاء غير المُعالجة
    window.addEventListener('error', (event) => {
      performanceLogger.error('Global error caught', event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        message: event.message
      });
    });

    // معالجة Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      performanceLogger.error('Unhandled promise rejection', event.reason);
      
      // منع إظهار الخطأ في الـ console في الإنتاج
      if (import.meta.env.PROD) {
        event.preventDefault();
      }
    });

    // مراقبة Long Tasks (المهام الطويلة) - معالجة منفصلة للـ PerformanceObserver
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // أكثر من 50ms
              performanceLogger.warn('Long task detected', {
                duration: entry.duration,
                startTime: entry.startTime,
                name: entry.name
              });
            }
          }
        });
        
        observer.observe({ entryTypes: ['longtask'] });
        
        // إضافة cleanup منفصل للـ PerformanceObserver
        this.cleanupFunctions.push(() => {
          observer.disconnect();
        });
      } catch (error) {
        // تجاهل إذا لم يكن مدعوماً
      }
    }
  }

  // إعداد التنظيف التلقائي
  private static setupAutoCleanup() {
    // تنظيف كل 5 دقائق
    const cleanupInterval = setInterval(() => {
      try {
        // تنظيف الـ caches القديمة
        if ('caches' in window) {
          caches.keys().then(cacheNames => {
            cacheNames.forEach(cacheName => {
              if (cacheName.includes('old-') || cacheName.includes('temp-')) {
                caches.delete(cacheName);
              }
            });
          });
        }

        // تنظيف localStorage القديم
        const oldKeys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('temp-') || key.includes('cache-'))) {
            try {
              const data = JSON.parse(localStorage.getItem(key) || '{}');
              if (data.expiry && Date.now() > data.expiry) {
                oldKeys.push(key);
              }
            } catch (e) {
              // تجاهل أخطاء JSON parsing
            }
          }
        }
        
        oldKeys.forEach(key => localStorage.removeItem(key));
        
        if (oldKeys.length > 0) {
          performanceLogger.info(`🧹 Cleaned ${oldKeys.length} old cache entries`);
        }

      } catch (error) {
        performanceLogger.error('Error during auto cleanup', error);
      }
    }, 5 * 60 * 1000); // كل 5 دقائق

    MemoryLeakPrevention.registerInterval(cleanupInterval);
  }

  // تنظيف شامل عند إغلاق التطبيق
  static cleanup() {
    performanceLogger.info('🧹 Starting performance cleanup...');
    
    // تشغيل دوال التنظيف المُسجلة
    this.cleanupFunctions.forEach(cleanupFn => {
      try {
        cleanupFn();
      } catch (error) {
        performanceLogger.error('Error in cleanup function', error);
      }
    });

    // تنظيف MemoryLeakPrevention
    MemoryLeakPrevention.cleanup();

    this.isInitialized = false;
    performanceLogger.info('✅ Performance cleanup completed');
  }

  // الحصول على تقرير الأداء
  static getPerformanceReport() {
    const report: {
      memoryUsage: any;
      timing: PerformanceTiming;
      navigation: PerformanceNavigation;
      isInitialized: boolean;
      timestamp: number;
    } = {
      memoryUsage: 'unknown',
      timing: performance.timing,
      navigation: performance.navigation,
      isInitialized: this.isInitialized,
      timestamp: Date.now()
    };

    if ('memory' in performance) {
      const memory = (performance as any).memory;
      report.memoryUsage = {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB',
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + 'MB',
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
      };
    }

    return report;
  }
}

export default PerformanceSetup;