import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Bug, 
  Download, 
  Trash2, 
  Activity, 
  BarChart3, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Info,
  Zap,
  Trophy,
  Target
} from 'lucide-react';
import { useGameLogger } from '@/hooks/useGameLogger';

const GameDebugConsole: React.FC = () => {
  const { 
    logs, 
    isLogging, 
    getFilteredLogs, 
    getMetrics, 
    getSessionReport, 
    clearLogs, 
    exportLogs 
  } = useGameLogger();
  
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // السجلات المصفاة
  const filteredLogs = useMemo(() => {
    let filtered = logs;
    
    if (selectedLevel !== 'all') {
      filtered = filtered.filter(log => log.level === selectedLevel);
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(log => log.category === selectedCategory);
    }
    
    return filtered;
  }, [logs, selectedLevel, selectedCategory]);

  // المقاييس
  const metrics = getMetrics();
  const sessionReport = getSessionReport();

  // إحصائيات السجلات
  const logStats = useMemo(() => {
    const stats = {
      total: logs.length,
      error: logs.filter(l => l.level === 'error').length,
      warn: logs.filter(l => l.level === 'warn').length,
      info: logs.filter(l => l.level === 'info').length,
      debug: logs.filter(l => l.level === 'debug').length,
      success: logs.filter(l => l.level === 'success').length
    };
    return stats;
  }, [logs]);

  // أيقونة المستوى
  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <XCircle className="h-4 w-4" />;
      case 'warn': return <AlertTriangle className="h-4 w-4" />;
      case 'info': return <Info className="h-4 w-4" />;
      case 'debug': return <Bug className="h-4 w-4" />;
      case 'success': return <CheckCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  // لون المستوى
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warn': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'debug': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // تنسيق الوقت
  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('ar-SA', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // تصدير السجلات
  const handleExport = () => {
    const data = exportLogs();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            وحدة تحكم تطوير اللعبة
            {isLogging && (
              <Badge className="bg-green-500 text-white">
                <Activity className="h-3 w-3 mr-1" />
                نشط
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport}
              disabled={logs.length === 0}
            >
              <Download className="h-4 w-4 mr-1" />
              تصدير
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearLogs}
              disabled={logs.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              مسح
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="logs" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="logs">السجلات</TabsTrigger>
            <TabsTrigger value="metrics">المقاييس</TabsTrigger>
            <TabsTrigger value="session">تقرير الجلسة</TabsTrigger>
          </TabsList>

          {/* السجلات */}
          <TabsContent value="logs" className="space-y-4">
            {/* الإحصائيات */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-center text-xs">
              <div className="p-2 bg-gray-50 rounded">
                <div className="font-bold">{logStats.total}</div>
                <div className="text-gray-600">إجمالي</div>
              </div>
              <div className="p-2 bg-red-50 rounded">
                <div className="font-bold text-red-600">{logStats.error}</div>
                <div className="text-red-700">أخطاء</div>
              </div>
              <div className="p-2 bg-yellow-50 rounded">
                <div className="font-bold text-yellow-600">{logStats.warn}</div>
                <div className="text-yellow-700">تحذيرات</div>
              </div>
              <div className="p-2 bg-blue-50 rounded">
                <div className="font-bold text-blue-600">{logStats.info}</div>
                <div className="text-blue-700">معلومات</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="font-bold text-gray-600">{logStats.debug}</div>
                <div className="text-gray-700">تطوير</div>
              </div>
              <div className="p-2 bg-green-50 rounded">
                <div className="font-bold text-green-600">{logStats.success}</div>
                <div className="text-green-700">نجاح</div>
              </div>
            </div>

            {/* المرشحات */}
            <div className="flex gap-2 flex-wrap">
              <select 
                value={selectedLevel} 
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="all">جميع المستويات</option>
                <option value="error">أخطاء</option>
                <option value="warn">تحذيرات</option>
                <option value="info">معلومات</option>
                <option value="debug">تطوير</option>
                <option value="success">نجاح</option>
              </select>

              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="all">جميع الفئات</option>
                <option value="session">جلسة</option>
                <option value="question">أسئلة</option>
                <option value="progress">تقدم</option>
                <option value="achievement">إنجازات</option>
                <option value="system">نظام</option>
                <option value="user_action">إجراءات المستخدم</option>
                <option value="performance">أداء</option>
              </select>
            </div>

            {/* قائمة السجلات */}
            <ScrollArea className="h-96 border rounded">
              <div className="space-y-2 p-2">
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    لا توجد سجلات
                  </div>
                ) : (
                  filteredLogs.map((log) => (
                    <div 
                      key={log.id}
                      className={`p-3 rounded border text-xs ${getLevelColor(log.level)}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getLevelIcon(log.level)}
                          <Badge variant="outline" className="text-xs">
                            {log.category}
                          </Badge>
                          <span className="font-medium">{log.event}</span>
                        </div>
                        <div className="text-xs opacity-75">
                          {formatTime(log.timestamp)}
                        </div>
                      </div>
                      
                      {log.data && (
                        <div className="mt-2 p-2 bg-white/50 rounded text-xs">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="mt-1 text-xs opacity-75">
                          {Object.entries(log.metadata).map(([key, value]) => (
                            <span key={key} className="mr-2">
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* المقاييس */}
          <TabsContent value="metrics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* إحصائيات الأسئلة */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    إحصائيات الأسئلة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>إجمالي الأسئلة:</span>
                    <span className="font-bold">{metrics.totalQuestions}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>إجابات صحيحة:</span>
                    <span className="font-bold text-green-600">{metrics.correctAnswers}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>إجابات خاطئة:</span>
                    <span className="font-bold text-red-600">{metrics.wrongAnswers}</span>
                  </div>
                  {metrics.totalQuestions > 0 && (
                    <div className="mt-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>معدل الصحة:</span>
                        <span className="font-bold">
                          {Math.round((metrics.correctAnswers / metrics.totalQuestions) * 100)}%
                        </span>
                      </div>
                      <Progress 
                        value={(metrics.correctAnswers / metrics.totalQuestions) * 100} 
                        className="h-2"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* إحصائيات الوقت */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    إحصائيات الوقت
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>متوسط الوقت/سؤال:</span>
                    <span className="font-bold">
                      {metrics.timePerQuestion.length > 0
                        ? Math.round(metrics.timePerQuestion.reduce((a, b) => a + b, 0) / metrics.timePerQuestion.length)
                        : 0} ث
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>أسرع إجابة:</span>
                    <span className="font-bold">
                      {metrics.timePerQuestion.length > 0 ? Math.min(...metrics.timePerQuestion) : 0} ث
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>أبطأ إجابة:</span>
                    <span className="font-bold">
                      {metrics.timePerQuestion.length > 0 ? Math.max(...metrics.timePerQuestion) : 0} ث
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* توزيع الصعوبة */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    توزيع الصعوبة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(metrics.difficultyDistribution).map(([difficulty, count]) => (
                    <div key={difficulty} className="flex justify-between text-sm">
                      <span>
                        {difficulty === 'easy' ? 'سهل' : difficulty === 'medium' ? 'متوسط' : 'صعب'}:
                      </span>
                      <span className="font-bold">{count}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* إحصائيات أخرى */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    إحصائيات أخرى
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>التلميحات المستخدمة:</span>
                    <span className="font-bold">{metrics.hintsUsed}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>عدد الأخطاء:</span>
                    <span className="font-bold text-red-600">{metrics.errorCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>إجراءات المستخدم:</span>
                    <span className="font-bold">{metrics.userActions.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>مشاكل الأداء:</span>
                    <span className="font-bold text-yellow-600">{metrics.performanceIssues.length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* تقرير الجلسة */}
          <TabsContent value="session" className="space-y-4">
            {sessionReport.sessionId ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">ملخص الجلسة</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">معرف الجلسة:</span>
                        <div className="text-xs text-gray-600 font-mono">
                          {sessionReport.sessionId}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">مدة الجلسة:</span>
                        <div className="text-xs">
                          {Math.floor(sessionReport.duration / 1000 / 60)} دقيقة و {Math.floor((sessionReport.duration / 1000) % 60)} ثانية
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-3 bg-blue-50 rounded">
                        <div className="text-2xl font-bold text-blue-600">
                          {sessionReport.summary.questionsAnswered}
                        </div>
                        <div className="text-blue-800">أسئلة مُجابة</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded">
                        <div className="text-2xl font-bold text-green-600">
                          {Math.round(sessionReport.summary.accuracy)}%
                        </div>
                        <div className="text-green-800">دقة</div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded">
                        <div className="text-2xl font-bold text-purple-600">
                          {Math.round(sessionReport.summary.averageTime)}s
                        </div>
                        <div className="text-purple-800">متوسط الوقت</div>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded">
                        <div className="text-2xl font-bold text-yellow-600">
                          {sessionReport.summary.hintsUsed}
                        </div>
                        <div className="text-yellow-800">تلميحات</div>
                      </div>
                    </div>

                    {sessionReport.summary.errorsEncountered > 0 && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded">
                        <div className="flex items-center gap-2 text-red-800">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">
                            تم اكتشاف {sessionReport.summary.errorsEncountered} خطأ في هذه الجلسة
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">السجلات الأخيرة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-40">
                      <div className="space-y-1">
                        {sessionReport.recentLogs.map((log) => (
                          <div key={log.id} className="text-xs p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              {getLevelIcon(log.level)}
                              <span className="font-medium">{log.event}</span>
                              <span className="text-gray-500">
                                {formatTime(log.timestamp)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                لا توجد جلسة نشطة حالياً
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default GameDebugConsole;