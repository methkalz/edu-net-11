import React, { useState, useEffect, useCallback } from 'react';
import { logError, logInfo } from '@/lib/logger';

interface PerformanceMetrics {
  // Page performance
  pageLoadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  
  // JavaScript performance
  jsHeapSizeUsed: number;
  jsHeapSizeTotal: number;
  jsHeapSizeLimit: number;
  
  // Network performance
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
  
  // Custom metrics
  renderTime: number;
  interactionTime: number;
  errorCount: number;
}

interface ResourceMetrics {
  name: string;
  type: string;
  size: number;
  duration: number;
  startTime: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Partial<PerformanceMetrics> = {};
  private resources: ResourceMetrics[] = [];
  private startTime: number = Date.now();
  private observer: PerformanceObserver | null = null;

  private constructor() {
    this.initializeMonitoring();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private initializeMonitoring() {
    // Monitor navigation timing
    this.collectNavigationMetrics();
    
    // Monitor resource loading
    this.collectResourceMetrics();
    
    // Monitor JavaScript heap
    this.collectMemoryMetrics();
    
    // Monitor network information
    this.collectNetworkMetrics();
    
    // Set up performance observer
    this.setupPerformanceObserver();
  }

  private collectNavigationMetrics() {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
      this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
      
      // First Contentful Paint
      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcp) {
        this.metrics.firstContentfulPaint = fcp.startTime;
      }
    }
  }

  private collectResourceMetrics() {
    if ('performance' in window) {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      this.resources = resources.map(resource => ({
        name: resource.name,
        type: this.getResourceType(resource.name),
        size: resource.transferSize || 0,
        duration: resource.responseEnd - resource.requestStart,
        startTime: resource.startTime
      }));
    }
  }

  private collectMemoryMetrics() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.jsHeapSizeUsed = memory.usedJSHeapSize;
      this.metrics.jsHeapSizeTotal = memory.totalJSHeapSize;
      this.metrics.jsHeapSizeLimit = memory.jsHeapSizeLimit;
    }
  }

  private collectNetworkMetrics() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.metrics.connectionType = connection.type || 'unknown';
      this.metrics.effectiveType = connection.effectiveType || 'unknown';
      this.metrics.downlink = connection.downlink || 0;
      this.metrics.rtt = connection.rtt || 0;
    }
  }

  private setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'measure' || entry.entryType === 'mark') {
            logInfo('Performance entry recorded', {
              name: entry.name,
              duration: entry.duration,
              startTime: entry.startTime
            });
          }
        });
      });

      this.observer.observe({ entryTypes: ['measure', 'mark', 'paint'] });
    }
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
    return 'other';
  }

  public markStart(name: string) {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(`${name}-start`);
    }
  }

  public markEnd(name: string) {
    if ('performance' in window && 'mark' in performance && 'measure' in performance) {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
    }
  }

  public measureRenderTime(componentName: string, renderFn: () => void) {
    this.markStart(`render-${componentName}`);
    renderFn();
    this.markEnd(`render-${componentName}`);
  }

  public getMetrics(): PerformanceMetrics {
    return {
      pageLoadTime: this.metrics.pageLoadTime || 0,
      domContentLoaded: this.metrics.domContentLoaded || 0,
      firstContentfulPaint: this.metrics.firstContentfulPaint || 0,
      jsHeapSizeUsed: this.metrics.jsHeapSizeUsed || 0,
      jsHeapSizeTotal: this.metrics.jsHeapSizeTotal || 0,
      jsHeapSizeLimit: this.metrics.jsHeapSizeLimit || 0,
      connectionType: this.metrics.connectionType || 'unknown',
      effectiveType: this.metrics.effectiveType || 'unknown',
      downlink: this.metrics.downlink || 0,
      rtt: this.metrics.rtt || 0,
      renderTime: this.metrics.renderTime || 0,
      interactionTime: this.metrics.interactionTime || 0,
      errorCount: this.metrics.errorCount || 0
    };
  }

  public getResourceMetrics(): ResourceMetrics[] {
    return this.resources;
  }

  public incrementErrorCount() {
    this.metrics.errorCount = (this.metrics.errorCount || 0) + 1;
  }

  public destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [resources, setResources] = useState<ResourceMetrics[]>([]);
  const monitor = PerformanceMonitor.getInstance();

  const updateMetrics = useCallback(() => {
    setMetrics(monitor.getMetrics());
    setResources(monitor.getResourceMetrics());
  }, [monitor]);

  useEffect(() => {
    // Update metrics periodically
    const interval = setInterval(updateMetrics, 5000);
    
    // Initial update
    updateMetrics();

    return () => clearInterval(interval);
  }, [updateMetrics]);

  const markStart = useCallback((name: string) => {
    monitor.markStart(name);
  }, [monitor]);

  const markEnd = useCallback((name: string) => {
    monitor.markEnd(name);
  }, [monitor]);

  const measureComponent = useCallback((componentName: string, renderFn: () => void) => {
    monitor.measureRenderTime(componentName, renderFn);
  }, [monitor]);

  return {
    metrics,
    resources,
    markStart,
    markEnd,
    measureComponent,
    updateMetrics
  };
};

// HOC for measuring component render time
export const withPerformanceTracking = <P extends Record<string, any>>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) => {
  return (props: P) => {
    const monitor = PerformanceMonitor.getInstance();
    
    useEffect(() => {
      monitor.markStart(`component-${componentName}`);
      return () => {
        monitor.markEnd(`component-${componentName}`);
      };
    }, [monitor]);

    return React.createElement(WrappedComponent, props);
  };
};