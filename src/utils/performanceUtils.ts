/**
 * أدوات تحسين الأداء والذاكرة
 */

// تنظيف الـ memory leaks الشائعة
export class MemoryLeakPrevention {
  private static timers = new Set<NodeJS.Timeout>();
  private static intervals = new Set<NodeJS.Timeout>();
  private static observers = new Set<IntersectionObserver | MutationObserver | ResizeObserver>();
  private static eventListeners = new Map<EventTarget, Map<string, EventListener>>();

  // تسجيل وإدارة الـ timers
  static registerTimer(timer: NodeJS.Timeout): NodeJS.Timeout {
    this.timers.add(timer);
    return timer;
  }

  static registerInterval(interval: NodeJS.Timeout): NodeJS.Timeout {
    this.intervals.add(interval);
    return interval;
  }

  // تسجيل الـ observers
  static registerObserver<T extends IntersectionObserver | MutationObserver | ResizeObserver>(observer: T): T {
    this.observers.add(observer);
    return observer;
  }

  // تسجيل الـ event listeners
  static registerEventListener(
    element: EventTarget, 
    eventName: string, 
    listener: EventListener, 
    options?: AddEventListenerOptions
  ) {
    if (!this.eventListeners.has(element)) {
      this.eventListeners.set(element, new Map());
    }
    
    const elementMap = this.eventListeners.get(element)!;
    elementMap.set(eventName, listener);
    
    element.addEventListener(eventName, listener, options);
  }

  // تنظيف شامل
  static cleanup() {
    // تنظيف الـ timers
    this.timers.forEach(timer => {
      clearTimeout(timer);
    });
    this.timers.clear();

    // تنظيف الـ intervals
    this.intervals.forEach(interval => {
      clearInterval(interval);
    });
    this.intervals.clear();

    // تنظيف الـ observers
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers.clear();

    // تنظيف الـ event listeners
    this.eventListeners.forEach((elementMap, element) => {
      elementMap.forEach((listener, eventName) => {
        element.removeEventListener(eventName, listener);
      });
    });
    this.eventListeners.clear();
  }

  // تنظيف عند إغلاق الصفحة
  static setupGlobalCleanup() {
    const cleanup = () => this.cleanup();
    
    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('pagehide', cleanup);
    
    // تنظيف دوري كل 5 دقائق
    const cleanupInterval = setInterval(() => {
      // تنظيف الـ observers المنقطعة
      this.observers.forEach(observer => {
        if (observer instanceof IntersectionObserver && !observer.root) {
          observer.disconnect();
          this.observers.delete(observer);
        }
      });
    }, 5 * 60 * 1000);

    this.registerInterval(cleanupInterval);
  }
}

// مُحسِّن للصور
export class ImageOptimizer {
  private static loadedImages = new Map<string, HTMLImageElement>();
  private static loadingPromises = new Map<string, Promise<HTMLImageElement>>();

  // تحميل الصور مع cache
  static async loadImage(src: string): Promise<HTMLImageElement> {
    // التحقق من الـ cache أولاً
    if (this.loadedImages.has(src)) {
      return this.loadedImages.get(src)!;
    }

    // التحقق من الـ loading promises
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src)!;
    }

    // إنشاء promise جديد للتحميل
    const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.loadedImages.set(src, img);
        this.loadingPromises.delete(src);
        resolve(img);
      };

      img.onerror = () => {
        this.loadingPromises.delete(src);
        reject(new Error(`Failed to load image: ${src}`));
      };

      img.src = src;
    });

    this.loadingPromises.set(src, loadPromise);
    return loadPromise;
  }

  // تنظيف cache الصور
  static clearImageCache() {
    this.loadedImages.clear();
    this.loadingPromises.clear();
  }

  // ضغط الصورة
  static compressImage(file: File, quality: number = 0.8): Promise<Blob> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/jpeg', quality);
      };

      img.src = URL.createObjectURL(file);
    });
  }
}

// مُحسِّن للبيانات الكبيرة
export class DataOptimizer {
  // تقسيم البيانات للمعالجة التدريجية
  static async processInChunks<T, R>(
    data: T[],
    processor: (chunk: T[]) => Promise<R[]>,
    chunkSize: number = 100
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      const chunkResults = await processor(chunk);
      results.push(...chunkResults);
      
      // السماح للمتصفح بالتنفس
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    return results;
  }

  // ضغط البيانات النصية
  static compressText(text: string): string {
    // ضغط بسيط عبر إزالة المسافات الزائدة
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  // إلغاء ضغط البيانات
  static decompressText(compressed: string): string {
    return compressed; // في الواقع، يمكن تطبيق خوارزميات ضغط أكثر تعقيداً
  }
}

// مراقب الأداء
export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>();

  // قياس وقت تنفيذ دالة
  static measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    this.metrics.get(name)!.push(duration);
    
    // طباعة تحذير إذا كان الأداء بطيء
    if (duration > 100) {
      console.warn(`🐌 Slow operation: ${name} took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  }

  // قياس وقت تنفيذ دالة غير متزامنة
  static async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    this.metrics.get(name)!.push(duration);
    
    if (duration > 1000) {
      console.warn(`🐌 Slow async operation: ${name} took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  }

  // الحصول على إحصائيات الأداء
  static getMetrics(name?: string) {
    if (name) {
      const times = this.metrics.get(name) || [];
      return {
        name,
        count: times.length,
        average: times.reduce((a, b) => a + b, 0) / times.length || 0,
        min: Math.min(...times) || 0,
        max: Math.max(...times) || 0
      };
    }
    
    const allMetrics: any = {};
    this.metrics.forEach((times, name) => {
      allMetrics[name] = {
        count: times.length,
        average: times.reduce((a, b) => a + b, 0) / times.length || 0,
        min: Math.min(...times) || 0,
        max: Math.max(...times) || 0
      };
    });
    
    return allMetrics;
  }

  // مسح المقاييس
  static clearMetrics() {
    this.metrics.clear();
  }
}

// إعداد المراقبة العامة
export const setupPerformanceMonitoring = () => {
  if (import.meta.env.DEV) {
    // مراقبة الـ memory
    const memoryMonitor = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
        
        if (usedMB > limitMB * 0.9) {
          console.error(`🔥 Critical memory usage: ${usedMB}MB / ${limitMB}MB`);
        }
      }
    }, 60000); // كل دقيقة

    MemoryLeakPrevention.registerInterval(memoryMonitor);
  }

  // إعداد التنظيف العام
  MemoryLeakPrevention.setupGlobalCleanup();
};