/**
 * أداة مراقبة الأداء - تتبع وقياس أداء العمليات
 */

interface PerformanceMark {
  startTime: number;
  label: string;
}

export class PerformanceMonitor {
  private static marks: Map<string, PerformanceMark> = new Map();
  private static measurements: Map<string, number[]> = new Map();
  
  /**
   * بدء قياس عملية
   */
  static start(label: string): void {
    const startTime = performance.now();
    this.marks.set(label, { startTime, label });
    
    if (import.meta.env.DEV) {
      console.log(`⏱️ [START] ${label}`);
    }
  }
  
  /**
   * إنهاء قياس عملية وحساب المدة
   */
  static end(label: string): number {
    const mark = this.marks.get(label);
    
    if (!mark) {
      console.warn(`⚠️ No start mark found for: ${label}`);
      return 0;
    }
    
    const duration = performance.now() - mark.startTime;
    this.marks.delete(label);
    
    // حفظ القياس في السجل
    const measurements = this.measurements.get(label) || [];
    measurements.push(duration);
    this.measurements.set(label, measurements);
    
    if (import.meta.env.DEV) {
      console.log(`⏱️ [END] ${label}: ${duration.toFixed(2)}ms`);
      
      // تحذير للعمليات البطيئة
      if (duration > 1000) {
        console.warn(`🐌 Slow operation: ${label} took ${duration.toFixed(2)}ms`);
      } else if (duration > 500) {
        console.warn(`⚠️ Moderate delay: ${label} took ${duration.toFixed(2)}ms`);
      }
    }
    
    return duration;
  }
  
  /**
   * قياس دالة async
   */
  static async measure<T>(
    label: string, 
    fn: () => Promise<T>
  ): Promise<T> {
    this.start(label);
    
    try {
      const result = await fn();
      this.end(label);
      return result;
    } catch (error) {
      this.end(label);
      console.error(`❌ Error in ${label}:`, error);
      throw error;
    }
  }
  
  /**
   * قياس دالة عادية
   */
  static measureSync<T>(
    label: string, 
    fn: () => T
  ): T {
    this.start(label);
    
    try {
      const result = fn();
      this.end(label);
      return result;
    } catch (error) {
      this.end(label);
      console.error(`❌ Error in ${label}:`, error);
      throw error;
    }
  }
  
  /**
   * الحصول على إحصائيات الأداء
   */
  static getStats(label?: string): Record<string, any> {
    if (label) {
      const measurements = this.measurements.get(label) || [];
      if (measurements.length === 0) return {};
      
      const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      const min = Math.min(...measurements);
      const max = Math.max(...measurements);
      
      return {
        label,
        count: measurements.length,
        avg: avg.toFixed(2),
        min: min.toFixed(2),
        max: max.toFixed(2)
      };
    }
    
    // إحصائيات لجميع القياسات
    const allStats: Record<string, any> = {};
    this.measurements.forEach((measurements, label) => {
      if (measurements.length > 0) {
        const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
        const min = Math.min(...measurements);
        const max = Math.max(...measurements);
        
        allStats[label] = {
          count: measurements.length,
          avg: avg.toFixed(2),
          min: min.toFixed(2),
          max: max.toFixed(2)
        };
      }
    });
    
    return allStats;
  }
  
  /**
   * طباعة تقرير الأداء
   */
  static printReport(): void {
    if (import.meta.env.DEV) {
      console.log('📊 Performance Report:');
      console.table(this.getStats());
    }
  }
  
  /**
   * مسح جميع القياسات
   */
  static clear(): void {
    this.marks.clear();
    this.measurements.clear();
  }
}
