// تتبع أداء الدوال
import { LogFormatter } from './log-formatter';

export class PerformanceTracker {
  static withPerformanceLogging<T extends (...args: unknown[]) => unknown>(
    fn: T,
    functionName: string,
    logger: { debug: (message: string, context?: Record<string, unknown>) => void; error: (message: string, error?: Error, context?: Record<string, unknown>) => void }
  ): T {
    return ((...args: Parameters<T>): ReturnType<T> => {
      const startTime = performance.now();
      
      try {
        const result = fn(...args);
        
        if (result instanceof Promise) {
          return (result as Promise<unknown>)
            .then((data) => {
              const endTime = performance.now();
              logger.debug(`${functionName} completed`, {
                duration: `${(endTime - startTime).toFixed(2)}ms`,
                args: args.length
              });
              return data;
            })
            .catch((error) => {
              const endTime = performance.now();
              logger.error(`${functionName} failed`, error as Error, {
                duration: `${(endTime - startTime).toFixed(2)}ms`,
                args: args.length
              });
              throw error;
            }) as ReturnType<T>;
        } else {
          const endTime = performance.now();
          logger.debug(`${functionName} completed`, {
            duration: `${(endTime - startTime).toFixed(2)}ms`,
            args: args.length
          });
          return result as ReturnType<T>;
        }
      } catch (error) {
        const endTime = performance.now();
        logger.error(`${functionName} failed`, error as Error, {
          duration: `${(endTime - startTime).toFixed(2)}ms`,
          args: args.length
        });
        throw error;
      }
    }) as T;
  }
}