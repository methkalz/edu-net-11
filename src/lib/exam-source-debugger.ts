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

    const event: SourceDebugEvent = {
      timestamp: new Date().toISOString(),
      stage,
      data: JSON.parse(JSON.stringify(data)), // Deep clone
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
      data,
      error ? `ERROR: ${error}` : ''
    );
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
