import React, { useState, useEffect } from 'react';
import { Activity, Clock, Database, Cpu, AlertCircle } from 'lucide-react';
import { PerformanceMonitor } from '@/lib/performance-monitor';

interface PerformanceMetric {
  name: string;
  count: number;
  avg: string;
  min: string;
  max: string;
}

export const PerformanceDebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [metrics, setMetrics] = useState<Record<string, PerformanceMetric>>({});
  const [networkRequests, setNetworkRequests] = useState<number>(0);
  const [slowOperations, setSlowOperations] = useState<string[]>([]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const interval = setInterval(() => {
      const stats = PerformanceMonitor.getStats();
      setMetrics(stats);

      // تحديد العمليات البطيئة (أكثر من 500ms)
      const slow = Object.entries(stats)
        .filter(([_, metric]) => parseFloat(metric.avg) > 500)
        .map(([name]) => name);
      setSlowOperations(slow);
    }, 1000);

    // تتبع طلبات الشبكة
    const originalFetch = window.fetch;
    let requestCount = 0;
    window.fetch = async (...args) => {
      requestCount++;
      setNetworkRequests(requestCount);
      return originalFetch(...args);
    };

    return () => {
      clearInterval(interval);
      window.fetch = originalFetch;
    };
  }, []);

  if (!import.meta.env.DEV) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 font-sans">
      <div className={`bg-background/95 backdrop-blur border rounded-lg shadow-lg transition-all ${
        isOpen ? 'w-96' : 'w-auto'
      }`}>
        {/* Header */}
        <div 
          className="flex items-center justify-between p-3 cursor-pointer border-b"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-500" />
            <span className="font-semibold text-sm">Performance Monitor</span>
          </div>
          <div className="flex items-center gap-2">
            {slowOperations.length > 0 && (
              <AlertCircle className="h-4 w-4 text-orange-500 animate-pulse" />
            )}
            <span className="text-xs text-muted-foreground">
              {isOpen ? '▼' : '▲'}
            </span>
          </div>
        </div>

        {/* Content */}
        {isOpen && (
          <div className="p-3 space-y-3 max-h-96 overflow-y-auto text-sm">
            {/* Network Stats */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Database className="h-3 w-3" />
                <span>Network Requests</span>
              </div>
              <div className="text-2xl font-bold text-blue-500">{networkRequests}</div>
            </div>

            {/* Performance Metrics */}
            {Object.keys(metrics).length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Operations Timing</span>
                </div>
                <div className="space-y-1">
                  {Object.entries(metrics).map(([name, metric]) => {
                    const isSlowAvg = parseFloat(metric.avg) > 500;
                    const isSlowMax = parseFloat(metric.max) > 1000;
                    
                    return (
                      <div 
                        key={name} 
                        className={`p-2 rounded text-xs ${
                          isSlowAvg ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium truncate" title={name}>
                            {name.length > 25 ? name.substring(0, 25) + '...' : name}
                          </span>
                          <span className="text-muted-foreground">×{metric.count}</span>
                        </div>
                        <div className="flex gap-3 text-muted-foreground">
                          <span className={isSlowAvg ? 'text-orange-600 font-semibold' : ''}>
                            Avg: {metric.avg}ms
                          </span>
                          <span>Min: {metric.min}ms</span>
                          <span className={isSlowMax ? 'text-red-600 font-semibold' : ''}>
                            Max: {metric.max}ms
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Slow Operations Alert */}
            {slowOperations.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-orange-600">
                  <AlertCircle className="h-3 w-3" />
                  <span>Slow Operations (avg &gt; 500ms)</span>
                </div>
                <div className="space-y-1">
                  {slowOperations.map(name => (
                    <div key={name} className="p-2 bg-orange-500/10 rounded text-xs border border-orange-500/20">
                      <span className="font-medium text-orange-700">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Memory Info */}
            {(performance as any).memory && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Cpu className="h-3 w-3" />
                  <span>Memory Usage</span>
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Used:</span>
                    <span className="font-medium">
                      {((performance as any).memory.usedJSHeapSize / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">
                      {((performance as any).memory.totalJSHeapSize / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Limit:</span>
                    <span className="font-medium">
                      {((performance as any).memory.jsHeapSizeLimit / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Clear Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                PerformanceMonitor.clear();
                setMetrics({});
                setNetworkRequests(0);
                setSlowOperations([]);
              }}
              className="w-full py-1.5 text-xs bg-muted hover:bg-muted/80 rounded transition-colors"
            >
              Clear Stats
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
