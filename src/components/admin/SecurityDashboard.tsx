import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Activity, Trash2, Download } from 'lucide-react';
import { SecurityMonitor } from '@/lib/security/security-monitor';
import { RateLimiter } from '@/lib/security/rate-limiter';
import { toast } from 'sonner';

export const SecurityDashboard: React.FC = () => {
  const [securityStats, setSecurityStats] = useState<any>(null);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);

  useEffect(() => {
    // تحديث الإحصائيات
    const updateStats = () => {
      const stats = SecurityMonitor.getSecurityStats();
      setSecurityStats(stats);
      
      const events = SecurityMonitor.getSecurityEvents().slice(-10);
      setRecentEvents(events);
    };

    updateStats();
    
    // تحديث كل 30 ثانية
    const interval = setInterval(updateStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleClearEvents = () => {
    SecurityMonitor.clearSecurityEvents();
    setSecurityStats(SecurityMonitor.getSecurityStats());
    setRecentEvents([]);
    toast.success('تم مسح سجلات الأمان');
  };

  const handleExportEvents = () => {
    const events = SecurityMonitor.getSecurityEvents();
    const data = JSON.stringify(events, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-events-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    toast.success('تم تصدير سجلات الأمان');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'destructive';
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'secondary';
      case 'LOW': return 'outline';
      default: return 'outline';
    }
  };

  const formatEventType = (type: string) => {
    const types: Record<string, string> = {
      'UNAUTHORIZED_ACCESS': 'وصول غير مصرح',
      'SUSPICIOUS_ACTIVITY': 'نشاط مشبوه',
      'IMPERSONATION_ATTEMPT': 'محاولة انتحال',
      'DATA_TAMPERING': 'تلاعب بالبيانات'
    };
    return types[type] || type;
  };

  if (!securityStats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            لوحة الأمان
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">جاري تحميل إحصائيات الأمان...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* إحصائيات الأمان */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-4 w-4" />
              إجمالي الأحداث
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityStats.totalEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              أحداث عالية الخطورة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {securityStats.highSeverityEvents}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              أحداث حرجة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {securityStats.criticalEvents}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* تحذيرات الأمان */}
      {securityStats.criticalEvents > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            تم اكتشاف {securityStats.criticalEvents} حدث أمني حرج. يرجى مراجعة السجلات فوراً.
          </AlertDescription>
        </Alert>
      )}

      {/* الأحداث الأخيرة */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                آخر الأحداث الأمنية
              </CardTitle>
              <CardDescription>
                آخر 10 أحداث أمنية مسجلة في النظام
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportEvents}>
                <Download className="h-4 w-4 mr-1" />
                تصدير
              </Button>
              <Button variant="destructive" size="sm" onClick={handleClearEvents}>
                <Trash2 className="h-4 w-4 mr-1" />
                مسح السجلات
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {recentEvents.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              لا توجد أحداث أمنية مسجلة
            </div>
          ) : (
            <div className="space-y-3">
              {recentEvents.map((event, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getSeverityColor(event.severity) as any}>
                        {event.severity}
                      </Badge>
                      <span className="text-sm font-medium">
                        {formatEventType(event.type)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{event.message}</p>
                    {event.userId && (
                      <p className="text-xs text-muted-foreground mt-1">
                        المستخدم: {event.userId}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(event.timestamp).toLocaleString('ar-SA')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};