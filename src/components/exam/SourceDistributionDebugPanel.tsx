import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bug, Download, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { examSourceDebugger } from '@/lib/exam-source-debugger';

interface SourceDistributionDebugPanelProps {
  currentDistribution: any[];
}

export function SourceDistributionDebugPanel({ currentDistribution }: SourceDistributionDebugPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);

  // لا تعرض في الإنتاج
  if (!import.meta.env.DEV) return null;

  const report = examSourceDebugger.getReport();

  const handleExport = () => {
    examSourceDebugger.export();
  };

  const handleClear = () => {
    examSourceDebugger.clear();
    window.location.reload();
  };

  const getEventColor = (stage: string) => {
    if (stage.includes('error') || stage.includes('Error')) return 'text-red-600';
    if (stage.includes('success') || stage.includes('Success')) return 'text-green-600';
    if (stage.includes('started') || stage.includes('Started')) return 'text-blue-600';
    return 'text-gray-600';
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        variant="outline"
        size="sm"
        className="mb-2 shadow-lg bg-yellow-50 border-yellow-300 hover:bg-yellow-100"
      >
        <Bug className="w-4 h-4 mr-2" />
        Source Distribution Debug
        {isExpanded ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronUp className="w-4 h-4 mr-2" />}
        <Badge variant={report.errors.length > 0 ? 'destructive' : 'default'} className="ml-2">
          {report.totalEvents}
        </Badge>
      </Button>

      {isExpanded && (
        <Card className="w-[600px] max-h-[70vh] overflow-y-auto shadow-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>🔍 Source Distribution Debugger</span>
              <div className="flex gap-2">
                <Button onClick={handleExport} variant="outline" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
                <Button onClick={handleClear} variant="outline" size="sm">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Distribution */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-sm mb-2">📊 Current Distribution</h3>
              <pre className="text-xs overflow-x-auto bg-white dark:bg-gray-800 p-2 rounded border">
                {(() => {
                  try {
                    return JSON.stringify(currentDistribution, null, 2);
                  } catch (e) {
                    return 'Error: Circular reference detected';
                  }
                })()}
              </pre>
              <div className="mt-2 space-y-1">
                <p className="text-xs">
                  <strong>Is Array:</strong>{' '}
                  <Badge variant={Array.isArray(currentDistribution) ? 'default' : 'destructive'}>
                    {Array.isArray(currentDistribution) ? 'Yes' : 'No'}
                  </Badge>
                </p>
                <p className="text-xs">
                  <strong>Length:</strong>{' '}
                  <Badge variant={currentDistribution?.length > 0 ? 'default' : 'destructive'}>
                    {currentDistribution?.length || 0}
                  </Badge>
                </p>
                <p className="text-xs">
                  <strong>Empty:</strong>{' '}
                  <Badge variant={!currentDistribution || currentDistribution.length === 0 ? 'destructive' : 'default'}>
                    {!currentDistribution || currentDistribution.length === 0 ? 'Yes ⚠️' : 'No'}
                  </Badge>
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                <div className="text-xs text-muted-foreground">Total Events</div>
                <div className="text-lg font-bold">{report.totalEvents}</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded">
                <div className="text-xs text-muted-foreground">Errors</div>
                <div className="text-lg font-bold text-red-600">{report.errors.length}</div>
              </div>
            </div>

            {/* Last Error */}
            {report.errors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200">
                <h3 className="font-semibold text-sm mb-2 text-red-700">🚨 Last Error</h3>
                <div className="text-xs space-y-1">
                  <p><strong>Stage:</strong> {report.errors[report.errors.length - 1].stage}</p>
                  <p><strong>Error:</strong> {report.errors[report.errors.length - 1].error}</p>
                  <pre className="text-xs overflow-x-auto bg-white dark:bg-gray-800 p-2 rounded border mt-2">
                    {(() => {
                      try {
                        return JSON.stringify(report.errors[report.errors.length - 1].data, null, 2);
                      } catch (e) {
                        return 'Error: Circular reference';
                      }
                    })()}
                  </pre>
                </div>
              </div>
            )}

            {/* Recent Events */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">📝 Recent Events</h3>
                <Button
                  onClick={() => setShowAllEvents(!showAllEvents)}
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                >
                  {showAllEvents ? 'Show Less' : 'Show All'}
                </Button>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {(showAllEvents ? report.events : report.events.slice(-10)).map((event, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs border"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-mono font-semibold ${getEventColor(event.stage)}`}>
                        {event.stage}
                      </span>
                      <span className="text-muted-foreground text-[10px]">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {event.error && (
                      <div className="text-red-600 font-semibold mb-1">❌ {event.error}</div>
                    )}
                    <details className="cursor-pointer">
                      <summary className="text-muted-foreground">Show data</summary>
                      <pre className="text-[10px] overflow-x-auto bg-white dark:bg-gray-900 p-2 rounded border mt-1">
                        {(() => {
                          try {
                            return JSON.stringify(event.data, null, 2);
                          } catch (e) {
                            return 'Error: Circular reference';
                          }
                        })()}
                      </pre>
                    </details>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <Button onClick={handleExport} variant="outline" size="sm" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Export Full Report
              </Button>
              <Button onClick={handleClear} variant="outline" size="sm" className="flex-1">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear & Reload
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
