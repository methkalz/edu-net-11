import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Bug, 
  RefreshCw, 
  ChevronDown, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  XCircle,
  Clock,
  Database,
  Zap,
  Eye,
  EyeOff,
  Trash2,
  Copy
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'api' | 'database' | 'upload' | 'ai' | 'general';
  message: string;
  details?: any;
}

interface BagrutDevConsoleProps {
  isVisible?: boolean;
}

export const BagrutDevConsole = ({ isVisible = true }: BagrutDevConsoleProps) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filterType, setFilterType] = useState<'all' | LogEntry['type']>('all');
  const [dbStats, setDbStats] = useState({
    exams: 0,
    sections: 0,
    questions: 0,
    attempts: 0
  });

  const addLog = useCallback((
    type: LogEntry['type'],
    category: LogEntry['category'],
    message: string,
    details?: any
  ) => {
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type,
      category,
      message,
      details
    };
    setLogs(prev => [entry, ...prev].slice(0, 100)); // Keep last 100 logs
  }, []);

  const fetchDbStats = useCallback(async () => {
    try {
      const [examsRes, sectionsRes, questionsRes, attemptsRes] = await Promise.all([
        supabase.from('bagrut_exams').select('id', { count: 'exact', head: true }),
        supabase.from('bagrut_exam_sections').select('id', { count: 'exact', head: true }),
        supabase.from('bagrut_questions').select('id', { count: 'exact', head: true }),
        supabase.from('bagrut_attempts').select('id', { count: 'exact', head: true })
      ]);

      setDbStats({
        exams: examsRes.count || 0,
        sections: sectionsRes.count || 0,
        questions: questionsRes.count || 0,
        attempts: attemptsRes.count || 0
      });

      addLog('info', 'database', 'تم تحديث إحصائيات قاعدة البيانات', dbStats);
    } catch (error) {
      addLog('error', 'database', 'فشل في جلب الإحصائيات', error);
    }
  }, [addLog]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!autoRefresh) return;

    const channel = supabase
      .channel('bagrut-dev-console')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bagrut_exams' },
        (payload) => {
          addLog('info', 'database', `امتحان: ${payload.eventType}`, payload);
          fetchDbStats();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bagrut_questions' },
        (payload) => {
          addLog('info', 'database', `سؤال: ${payload.eventType}`, payload);
          fetchDbStats();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bagrut_attempts' },
        (payload) => {
          addLog('info', 'database', `محاولة: ${payload.eventType}`, payload);
          fetchDbStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [autoRefresh, addLog, fetchDbStats]);

  useEffect(() => {
    fetchDbStats();
    addLog('info', 'general', 'تم تفعيل وحدة التطوير');
  }, []);

  const clearLogs = () => {
    setLogs([]);
    addLog('info', 'general', 'تم مسح السجلات');
  };

  const copyLogs = () => {
    const logsText = logs.map(log => 
      `[${log.timestamp.toISOString()}] [${log.type.toUpperCase()}] [${log.category}] ${log.message}${log.details ? '\n' + JSON.stringify(log.details, null, 2) : ''}`
    ).join('\n\n');
    navigator.clipboard.writeText(logsText);
    toast.success('تم نسخ السجلات');
  };

  const getTypeIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getCategoryBadge = (category: LogEntry['category']) => {
    const variants: Record<string, string> = {
      api: 'bg-purple-100 text-purple-800',
      database: 'bg-blue-100 text-blue-800',
      upload: 'bg-orange-100 text-orange-800',
      ai: 'bg-pink-100 text-pink-800',
      general: 'bg-gray-100 text-gray-800'
    };
    return <Badge className={`text-xs ${variants[category]}`}>{category}</Badge>;
  };

  const filteredLogs = filterType === 'all' 
    ? logs 
    : logs.filter(log => log.type === filterType);

  if (!isVisible) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 bg-background shadow-lg"
        >
          <Bug className="h-4 w-4" />
          <span>Dev Console</span>
          {logs.filter(l => l.type === 'error').length > 0 && (
            <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center">
              {logs.filter(l => l.type === 'error').length}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-4 left-4 w-[500px] max-h-[600px] z-50 shadow-xl border-2" dir="rtl">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-orange-500" />
          <CardTitle className="text-sm">وحدة التطوير - البجروت</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchDbStats}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyLogs}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearLogs}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsMinimized(true)}>
            <EyeOff className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-0 space-y-3">
        {/* Database Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-muted rounded-lg p-2 text-center">
            <Database className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <div className="text-lg font-bold">{dbStats.exams}</div>
            <div className="text-xs text-muted-foreground">امتحانات</div>
          </div>
          <div className="bg-muted rounded-lg p-2 text-center">
            <div className="text-lg font-bold">{dbStats.sections}</div>
            <div className="text-xs text-muted-foreground">أقسام</div>
          </div>
          <div className="bg-muted rounded-lg p-2 text-center">
            <div className="text-lg font-bold">{dbStats.questions}</div>
            <div className="text-xs text-muted-foreground">أسئلة</div>
          </div>
          <div className="bg-muted rounded-lg p-2 text-center">
            <div className="text-lg font-bold">{dbStats.attempts}</div>
            <div className="text-xs text-muted-foreground">محاولات</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1 flex-wrap">
          <Button 
            variant={filterType === 'all' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="h-7 text-xs"
            onClick={() => setFilterType('all')}
          >
            الكل
          </Button>
          <Button 
            variant={filterType === 'error' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="h-7 text-xs"
            onClick={() => setFilterType('error')}
          >
            <XCircle className="h-3 w-3 ml-1 text-red-500" />
            أخطاء ({logs.filter(l => l.type === 'error').length})
          </Button>
          <Button 
            variant={filterType === 'warning' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="h-7 text-xs"
            onClick={() => setFilterType('warning')}
          >
            <AlertCircle className="h-3 w-3 ml-1 text-yellow-500" />
            تحذيرات
          </Button>
          <Button 
            variant={filterType === 'success' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="h-7 text-xs"
            onClick={() => setFilterType('success')}
          >
            <CheckCircle className="h-3 w-3 ml-1 text-green-500" />
            نجاح
          </Button>
          <div className="flex-1" />
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Zap className={`h-3 w-3 ml-1 ${autoRefresh ? 'text-yellow-300' : ''}`} />
            تحديث تلقائي
          </Button>
        </div>

        {/* Logs */}
        <ScrollArea className="h-[280px] rounded-lg border bg-muted/30 p-2">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Clock className="h-8 w-8 mb-2" />
              <p className="text-sm">لا توجد سجلات</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map(log => (
                <Collapsible key={log.id}>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-background hover:bg-muted/50 transition-colors text-right">
                      {getTypeIcon(log.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getCategoryBadge(log.category)}
                          <span className="text-xs text-muted-foreground">
                            {log.timestamp.toLocaleTimeString('en-US', { hour12: false })}
                          </span>
                        </div>
                        <p className="text-sm truncate">{log.message}</p>
                      </div>
                      {log.details && <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </CollapsibleTrigger>
                  {log.details && (
                    <CollapsibleContent>
                      <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto" dir="ltr">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </CollapsibleContent>
                  )}
                </Collapsible>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

// Export a hook to use the console from other components
export const useBagrutDevLog = () => {
  const [logFn, setLogFn] = useState<((
    type: LogEntry['type'],
    category: LogEntry['category'],
    message: string,
    details?: any
  ) => void) | null>(null);

  return {
    log: (type: LogEntry['type'], category: LogEntry['category'], message: string, details?: any) => {
      // Dispatch custom event for the console to pick up
      window.dispatchEvent(new CustomEvent('bagrut-dev-log', {
        detail: { type, category, message, details }
      }));
    }
  };
};
