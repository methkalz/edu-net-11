/**
 * مراقب حالة النظام لبيانات الألعاب
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Activity,
  Wifi,
  Database,
  User
} from 'lucide-react';
import { gameDataErrorHandler } from '@/lib/error-handling/game-data/game-data-error-handler';
import { useAuth } from '@/hooks/useAuth';

interface SystemHealth {
  healthy: boolean;
  issues: string[];
  recommendations: string[];
  lastChecked?: Date;
}

interface SystemMetrics {
  connectionLatency: number;
  operationsInProgress: number;
  lastSuccessfulOperation?: Date;
  totalOperationsToday: number;
}

export const GameSystemHealthMonitor = () => {
  const { userProfile } = useAuth();
  const [health, setHealth] = useState<SystemHealth>({
    healthy: true,
    issues: [],
    recommendations: []
  });
  const [metrics, setMetrics] = useState<SystemMetrics>({
    connectionLatency: 0,
    operationsInProgress: 0,
    totalOperationsToday: 0
  });
  const [isChecking, setIsChecking] = useState(false);

  // فحص حالة النظام عند التحميل وكل دقيقتين (فقط عندما يكون المستخدم متاحاً)
  useEffect(() => {
    if (userProfile) {
      checkSystemHealth();
      const interval = setInterval(checkSystemHealth, 120000); // كل دقيقتين
      return () => clearInterval(interval);
    }
  }, [userProfile]);

  const checkSystemHealth = async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    const startTime = Date.now();
    
    try {
      // تمرير معلومات المستخدم من useAuth بدلاً من localStorage
      const healthResult = await gameDataErrorHandler.validateSystemHealth(userProfile);
      const latency = Date.now() - startTime;
      
      setHealth({
        ...healthResult,
        lastChecked: new Date()
      });
      
      setMetrics(prev => ({
        ...prev,
        connectionLatency: latency,
        lastSuccessfulOperation: healthResult.healthy ? new Date() : prev.lastSuccessfulOperation
      }));
      
    } catch (error) {
      console.error('System health check error:', error);
      setHealth({
        healthy: false,
        issues: ['فشل في فحص حالة النظام'],
        recommendations: ['أعد تحميل الصفحة وحاول مرة أخرى'],
        lastChecked: new Date()
      });
    } finally {
      setIsChecking(false);
    }
  };

  const getHealthStatus = () => {
    if (!health.healthy) {
      return { color: 'destructive', icon: AlertTriangle, text: 'غير صحي' };
    }
    return { color: 'success', icon: CheckCircle, text: 'صحي' };
  };

  const status = getHealthStatus();

  return (
    <Card className="glass-card border-l-4 border-l-primary transition-all duration-300 animate-fade-in shadow-elegant">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <span className="text-gradient bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            مراقب النظام
          </span>
          <Badge 
            variant={status.color === 'success' ? 'default' : 'destructive'}
            className={`mr-auto px-3 py-1 text-xs ${status.color === 'success' ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-destructive to-red-600'} text-white`}
          >
            <status.icon className="h-3 w-3 ml-1" />
            {status.text}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4 p-4">
        {/* Compact Performance Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="text-center p-3 glass-card bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-lg border border-blue-500/20 transition-all duration-300">
            <div className="flex items-center justify-center gap-1 text-xs text-blue-600 font-medium mb-1">
              <Wifi className="h-3 w-3" />
              الاستجابة
            </div>
            <div className="text-lg font-bold text-gradient bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
              {metrics.connectionLatency}ms
            </div>
          </div>
          
          <div className="text-center p-3 glass-card bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-lg border border-green-500/20 transition-all duration-300">
            <div className="flex items-center justify-center gap-1 text-xs text-green-600 font-medium mb-1">
              <Database className="h-3 w-3" />
              العمليات
            </div>
            <div className="text-lg font-bold text-gradient bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
              {metrics.operationsInProgress}
            </div>
          </div>
          
          <div className="text-center p-3 glass-card bg-gradient-to-br from-primary/10 to-accent/5 rounded-lg border border-primary/20 transition-all duration-300">
            <div className="flex items-center justify-center gap-1 text-xs text-primary font-medium mb-1">
              <User className="h-3 w-3" />
              المستخدم
            </div>
            <div className="text-sm font-bold">
              {userProfile?.role === 'superadmin' ? (
                <span className="text-green-600">✓ مصرح</span>
              ) : (
                <span className="text-red-600">✗ غير مصرح</span>
              )}
            </div>
          </div>
          
          <div className="text-center p-3 glass-card bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-lg border border-purple-500/20 transition-all duration-300">
            <div className="flex items-center justify-center gap-1 text-xs text-purple-600 font-medium mb-1">
              <Shield className="h-3 w-3" />
              آخر فحص
            </div>
            <div className="text-xs font-semibold text-purple-600">
              {health.lastChecked 
                ? health.lastChecked.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                : 'لم يتم'}
            </div>
          </div>
        </div>

        {/* Issues and Recommendations */}
        {health.issues.length > 0 && (
          <Alert className="border-destructive/20">
            <AlertTriangle className="h-3 w-3" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium text-sm">مشاكل:</p>
                <ul className="list-disc list-inside space-y-1">
                  {health.issues.map((issue, index) => (
                    <li key={index} className="text-xs">{issue}</li>
                  ))}
                </ul>
                {health.recommendations.length > 0 && (
                  <>
                    <p className="font-medium text-sm pt-2">التوصيات:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {health.recommendations.map((rec, index) => (
                        <li key={index} className="text-xs text-muted-foreground">{rec}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Monitoring Actions */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkSystemHealth}
            disabled={isChecking}
            className="text-xs"
          >
            <RefreshCw className={`h-3 w-3 ml-1 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'فحص...' : 'فحص'}
          </Button>
          
          {!health.healthy && (
            <Button 
              variant="default" 
              size="sm"
              onClick={() => window.location.reload()}
              className="text-xs"
            >
              إعادة تحميل
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};