// لوحة المطور لنظام الامتحانات - تظهر فقط في وضع التطوير
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExamDebugger } from '@/lib/exam-debugging';
import { ExamDebugState } from '@/types/exam-debug';
import { 
  Download, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ExamDebugPanelProps {
  currentState: ExamDebugState;
}

export function ExamDebugPanel({ currentState }: ExamDebugPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullReport, setShowFullReport] = useState(false);

  // لا نعرض اللوحة إلا في وضع التطوير
  if (!import.meta.env.DEV) {
    return null;
  }

  const report = ExamDebugger.getReport();
  const hasCriticalIssues = ExamDebugger.hasCriticalIssues();
  const lastError = ExamDebugger.getLastError();

  const handleExport = () => {
    ExamDebugger.exportReport();
  };

  const handleClear = () => {
    ExamDebugger.clear();
    window.location.reload();
  };

  const handleValidate = () => {
    ExamDebugger.validateState('StudentExamAttempt', currentState);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-md">
      {/* زر Toggle */}
      {!isExpanded && (
        <Button
          onClick={() => setIsExpanded(true)}
          className="shadow-lg"
          variant={hasCriticalIssues ? 'destructive' : 'default'}
        >
          📊 Debug Panel
          {hasCriticalIssues && (
            <Badge variant="destructive" className="ml-2">
              {report.summary.failedSubmissions + report.summary.validationErrors}
            </Badge>
          )}
        </Button>
      )}

      {/* اللوحة الكاملة */}
      {isExpanded && (
        <Card className="shadow-2xl border-2">
          <CardHeader className="p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                📊 Exam Debug Panel
                {hasCriticalIssues && (
                  <Badge variant="destructive">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Issues
                  </Badge>
                )}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            {/* Current State */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Info className="w-4 h-4" />
                Current State
              </h3>
              <div className="bg-muted/50 p-3 rounded-md text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Exam ID:</span>
                  <span className="font-mono">{currentState.examId?.substring(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Attempt ID:</span>
                  <span className={`font-mono ${!currentState.attemptId ? 'text-destructive' : ''}`}>
                    {currentState.attemptId ? `${currentState.attemptId.substring(0, 8)}...` : 'NULL'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Answers:</span>
                  <span className="font-mono">{currentState.answersCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Question:</span>
                  <span className="font-mono">{(currentState.currentQuestionIndex || 0) + 1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time Left:</span>
                  <span className="font-mono">
                    {Math.floor((currentState.remainingSeconds || 0) / 60)}:
                    {String((currentState.remainingSeconds || 0) % 60).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-muted/50 p-2 rounded-md">
                  <div className="text-muted-foreground">Total Events</div>
                  <div className="text-lg font-bold">{report.totalEvents}</div>
                </div>
                <div className="bg-muted/50 p-2 rounded-md">
                  <div className="text-muted-foreground">Attempts</div>
                  <div className="text-lg font-bold">{report.summary.totalAttempts}</div>
                </div>
                <div className="bg-green-500/10 p-2 rounded-md border border-green-500/20">
                  <div className="text-muted-foreground">Success</div>
                  <div className="text-lg font-bold text-green-600">
                    {report.summary.successfulSubmissions}
                  </div>
                </div>
                <div className="bg-red-500/10 p-2 rounded-md border border-red-500/20">
                  <div className="text-muted-foreground">Failed</div>
                  <div className="text-lg font-bold text-red-600">
                    {report.summary.failedSubmissions}
                  </div>
                </div>
              </div>
            </div>

            {/* Last Error */}
            {lastError && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Last Error
                </h3>
                <div className="bg-destructive/10 p-3 rounded-md text-xs border border-destructive/20">
                  <div className="font-semibold">{lastError.type}</div>
                  <div className="text-muted-foreground mt-1">
                    {lastError.timestamp}
                  </div>
                  {lastError.data && (
                    <pre className="mt-2 text-xs overflow-x-auto">
                      {JSON.stringify(lastError.data, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            )}

            {/* Recent Events */}
            {showFullReport && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Recent Events</h3>
                <ScrollArea className="h-40 bg-muted/50 rounded-md p-2">
                  <div className="space-y-1 text-xs">
                    {report.events.slice(-20).reverse().map((event, idx) => (
                      <div 
                        key={idx} 
                        className={`p-2 rounded border ${
                          event.type.includes('FAILED') || event.type.includes('ERROR')
                            ? 'bg-destructive/10 border-destructive/20'
                            : event.type.includes('SUCCESS')
                            ? 'bg-green-500/10 border-green-500/20'
                            : 'bg-background border-border'
                        }`}
                      >
                        <div className="font-semibold">{event.type}</div>
                        <div className="text-muted-foreground text-xs">
                          {new Date(event.timestamp!).toLocaleTimeString('ar-EG')}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleValidate}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Validate
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExport}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleClear}
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowFullReport(!showFullReport)}
              className="w-full"
            >
              {showFullReport ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Show Details
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
