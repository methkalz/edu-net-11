/**
 * نظام تتبع شامل لمصادر الأسئلة في الامتحانات
 * يعمل فقط في وضع التطوير
 */

export interface SourceDebugEvent {
  timestamp: string;
  stage: string;
  data: any;
  error?: string;
}

class ExamSourceDebugger {
  private events: SourceDebugEvent[] = [];
  private maxEvents = 100;
  private enabled = import.meta.env.DEV;

  log(stage: string, data: any, error?: string) {
    if (!this.enabled) return;

    // Safe deep clone - handle circular references
    let clonedData: any;
    try {
      clonedData = JSON.parse(JSON.stringify(data));
    } catch (e) {
      // If circular reference, just extract safe data
      clonedData = this.extractSafeData(data);
    }

    const event: SourceDebugEvent = {
      timestamp: new Date().toISOString(),
      stage,
      data: clonedData,
      error
    };

    this.events.push(event);
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    // عرض في الكونسول بألوان
    const style = error ? 'color: red; font-weight: bold' : 'color: green';
    console.log(
      `%c[ExamSource] ${stage}`,
      style,
      clonedData,
      error ? `ERROR: ${error}` : ''
    );
  }

  private extractSafeData(data: any): any {
    if (data === null || data === undefined) return data;
    if (typeof data !== 'object') return data;
    
    // Handle React elements
    if (data.$$typeof) return '[React Element]';
    
    if (Array.isArray(data)) {
      return data.map(item => this.extractSafeData(item));
    }
    
    const safe: any = {};
    try {
      for (const key in data) {
        if (!data.hasOwnProperty(key)) continue;
        
        const value = data[key];
        
        // Skip React internals and DOM elements
        if (key.startsWith('_') || key.startsWith('__react') || key === '$$typeof') continue;
        if (value instanceof HTMLElement) continue;
        if (value instanceof Node) continue;
        if (typeof value === 'function') continue;
        
        // Handle React elements
        if (value && typeof value === 'object' && value.$$typeof) {
          safe[key] = '[React Element]';
          continue;
        }
        
        if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value)) {
            safe[key] = value.map(item => this.extractSafeData(item));
          } else {
            // Create a simple copy to avoid deep recursion
            safe[key] = this.extractSafeData(value);
          }
        } else {
          safe[key] = value;
        }
      }
    } catch (e) {
      return '[Error extracting data]';
    }
    return safe;
  }

  getEvents() {
    return this.events;
  }

  getReport() {
    return {
      totalEvents: this.events.length,
      events: this.events,
      errors: this.events.filter(e => e.error),
    };
  }

  clear() {
    this.events = [];
  }

  export() {
    const report = this.getReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exam-source-debug-${Date.now()}.json`;
    a.click();
  }
}

export const examSourceDebugger = new ExamSourceDebugger();
