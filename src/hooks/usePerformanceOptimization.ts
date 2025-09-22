import { useCallback, useMemo, useRef, useEffect } from 'react';

/**
 * Hook محسّن للأداء - يوفر أدوات تحسين الأداء المختلفة
 */
export const usePerformanceOptimization = () => {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(Date.now());
  
  // عداد الـ renders للتطوير
  useEffect(() => {
    if (import.meta.env.DEV) {
      renderCountRef.current += 1;
      const now = Date.now();
      const timeSinceLastRender = now - lastRenderTimeRef.current;
      lastRenderTimeRef.current = now;
      
      if (renderCountRef.current > 10 && timeSinceLastRender < 16) {
        console.warn('⚠️ كثرة الـ re-renders - تحقق من dependency arrays');
      }
    }
  });

  // دالة للتحكم في الـ debouncing
  const useDebounced = useCallback(<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
  ) => {
    const timeoutRef = useRef<NodeJS.Timeout>();
    
    return useCallback(
      (...args: Parameters<T>) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          callback(...args);
        }, delay);
      },
      [callback, delay]
    ) as T;
  }, []);

  // دالة للتحكم في الـ throttling
  const useThrottled = useCallback(<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
  ) => {
    const lastCallRef = useRef(0);
    
    return useCallback(
      (...args: Parameters<T>) => {
        const now = Date.now();
        if (now - lastCallRef.current >= delay) {
          lastCallRef.current = now;
          callback(...args);
        }
      },
      [callback, delay]
    ) as T;
  }, []);

  // مُحسِّن للكائنات المعقدة
  const useMemoizedObject = useCallback(<T extends Record<string, any>>(
    factory: () => T,
    deps: React.DependencyList
  ) => {
    return useMemo(factory, deps);
  }, []);

  // مُحسِّن للقوائم الكبيرة
  const useMemoizedList = useCallback(<T>(
    list: T[],
    sorter?: (a: T, b: T) => number,
    filter?: (item: T) => boolean
  ) => {
    return useMemo(() => {
      let result = [...list];
      
      if (filter) {
        result = result.filter(filter);
      }
      
      if (sorter) {
        result.sort(sorter);
      }
      
      return result;
    }, [list, sorter, filter]);
  }, []);

  // تنظيف الـ memory leaks
  const useCleanup = useCallback((cleanupFn: () => void) => {
    const cleanupRef = useRef(cleanupFn);
    cleanupRef.current = cleanupFn;
    
    useEffect(() => {
      return () => {
        cleanupRef.current?.();
      };
    }, []);
  }, []);

  // مراقب الأداء
  const usePerformanceMonitor = useCallback((componentName: string) => {
    const startTimeRef = useRef<number>();
    
    useEffect(() => {
      if (import.meta.env.DEV) {
        startTimeRef.current = performance.now();
        
        return () => {
          if (startTimeRef.current) {
            const renderTime = performance.now() - startTimeRef.current;
            if (renderTime > 16.67) { // أكثر من frame واحد
              console.warn(`🐌 ${componentName} render time: ${renderTime.toFixed(2)}ms`);
            }
          }
        };
      }
    });
  }, []);

  return {
    useDebounced,
    useThrottled,
    useMemoizedObject,
    useMemoizedList,
    useCleanup,
    usePerformanceMonitor,
    renderCount: renderCountRef.current
  };
};

/**
 * Hook للتحقق من الـ memory usage
 */
export const useMemoryMonitor = () => {
  useEffect(() => {
    if (import.meta.env.DEV && 'memory' in performance) {
      const checkMemory = () => {
        const memory = (performance as any).memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
        
        if (usedMB > limitMB * 0.8) {
          console.warn(`🔥 High memory usage: ${usedMB}MB / ${limitMB}MB`);
        }
      };
      
      const interval = setInterval(checkMemory, 30000); // كل 30 ثانية
      
      return () => {
        clearInterval(interval);
      };
    }
  }, []);
};

/**
 * Hook محسّن للـ event listeners
 */
export const useOptimizedEventListener = (
  eventName: string,
  handler: (event: Event) => void,
  element: EventTarget | null = window,
  options?: AddEventListenerOptions
) => {
  const savedHandler = useRef<(event: Event) => void>();

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!element?.addEventListener) return;

    const eventListener = (event: Event) => {
      savedHandler.current?.(event);
    };

    element.addEventListener(eventName, eventListener, options);

    return () => {
      element.removeEventListener(eventName, eventListener, options);
    };
  }, [eventName, element, options]);
};