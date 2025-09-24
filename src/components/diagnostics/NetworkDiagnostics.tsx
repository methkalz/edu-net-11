import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, WifiOff, RefreshCw, Globe, Database } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface DiagnosticResult {
  test: string;
  status: 'checking' | 'success' | 'error';
  message: string;
  details?: string;
}

export const NetworkDiagnostics = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const tests: DiagnosticResult[] = [
      { test: 'internet', status: 'checking', message: 'فحص الاتصال بالإنترنت...' },
      { test: 'supabase', status: 'checking', message: 'فحص الاتصال بخادم البيانات...' },
      { test: 'auth', status: 'checking', message: 'فحص خدمة المصادقة...' },
      { test: 'browser', status: 'checking', message: 'فحص إعدادات المتصفح...' }
    ];
    
    setDiagnostics([...tests]);

    // Test 1: Internet connectivity
    try {
      const response = await fetch('https://www.google.com/favicon.ico', { 
        mode: 'no-cors',
        signal: AbortSignal.timeout(5000)
      });
      tests[0] = { 
        test: 'internet', 
        status: 'success', 
        message: 'الاتصال بالإنترنت يعمل بشكل جيد' 
      };
    } catch (error) {
      tests[0] = { 
        test: 'internet', 
        status: 'error', 
        message: 'مشكلة في الاتصال بالإنترنت',
        details: 'تأكد من اتصالك بالإنترنت'
      };
    }
    setDiagnostics([...tests]);

    // Test 2: Supabase connectivity
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id')
        .limit(1)
        .maybeSingle();
      
      if (error && error.code === 'PGRST116') {
        // No rows returned is actually success for connectivity test
        tests[1] = { 
          test: 'supabase', 
          status: 'success', 
          message: 'الاتصال بخادم البيانات يعمل بشكل جيد' 
        };
      } else if (!error) {
        tests[1] = { 
          test: 'supabase', 
          status: 'success', 
          message: 'الاتصال بخادم البيانات يعمل بشكل جيد' 
        };
      } else {
        throw error;
      }
    } catch (error: any) {
      tests[1] = { 
        test: 'supabase', 
        status: 'error', 
        message: 'مشكلة في الاتصال بخادم البيانات',
        details: `خطأ: ${error.message || 'فشل الاتصال'}`
      };
    }
    setDiagnostics([...tests]);

    // Test 3: Auth service
    try {
      const { data } = await supabase.auth.getSession();
      tests[2] = { 
        test: 'auth', 
        status: 'success', 
        message: 'خدمة المصادقة تعمل بشكل جيد' 
      };
    } catch (error: any) {
      tests[2] = { 
        test: 'auth', 
        status: 'error', 
        message: 'مشكلة في خدمة المصادقة',
        details: `خطأ: ${error.message || 'فشل الوصول لخدمة المصادقة'}`
      };
    }
    setDiagnostics([...tests]);

    // Test 4: Browser settings
    const browserIssues = [];
    
    // Check if cookies are enabled
    if (!navigator.cookieEnabled) {
      browserIssues.push('ملفات تعريف الارتباط (Cookies) معطلة');
    }
    
    // Check if localStorage is available
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
    } catch {
      browserIssues.push('التخزين المحلي (LocalStorage) غير متاح');
    }
    
    // Check connection type
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      if (conn && conn.effectiveType && ['slow-2g', '2g'].includes(conn.effectiveType)) {
        browserIssues.push('اتصال الإنترنت بطيء');
      }
    }

    tests[3] = browserIssues.length === 0 
      ? { 
          test: 'browser', 
          status: 'success', 
          message: 'إعدادات المتصفح مناسبة' 
        }
      : { 
          test: 'browser', 
          status: 'error', 
          message: 'مشاكل في إعدادات المتصفح',
          details: browserIssues.join('، ')
        };

    setDiagnostics([...tests]);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'checking':
        return <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getTestIcon = (test: string) => {
    switch (test) {
      case 'internet':
        return <Globe className="h-4 w-4" />;
      case 'supabase':
        return <Database className="h-4 w-4" />;
      case 'auth':
        return <Database className="h-4 w-4" />;
      case 'browser':
        return <WifiOff className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const hasErrors = diagnostics.some(d => d.status === 'error');

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          تشخيص مشاكل الاتصال
        </CardTitle>
        <CardDescription>
          فحص شامل لتحديد أسباب مشاكل "Failed to Fetch"
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {diagnostics.map((diagnostic, index) => (
            <div 
              key={diagnostic.test}
              className="flex items-start gap-3 p-3 rounded-lg border bg-card/50"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {getTestIcon(diagnostic.test)}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(diagnostic.status)}
                    <span className="font-medium text-sm">{diagnostic.message}</span>
                  </div>
                  {diagnostic.details && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {diagnostic.details}
                    </p>
                  )}
                </div>
              </div>
              <Badge 
                variant={diagnostic.status === 'success' ? 'default' : 
                        diagnostic.status === 'error' ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {diagnostic.status === 'checking' ? 'فحص' : 
                 diagnostic.status === 'success' ? 'نجح' : 'فشل'}
              </Badge>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
            إعادة الفحص
          </Button>
          
          {hasErrors && (
            <div className="text-sm text-muted-foreground">
              يُرجى حل المشاكل المعروضة وإعادة المحاولة
            </div>
          )}
        </div>

        {hasErrors && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">نصائح لحل المشاكل:</h4>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
              <li>• تأكد من اتصالك بالإنترنت</li>
              <li>• أعد تحميل الصفحة (F5 أو Ctrl+R)</li>
              <li>• امسح ذاكرة التخزين المؤقت للمتصفح</li>
              <li>• تأكد من تفعيل الكوكيز والتخزين المحلي</li>
              <li>• جرب متصفح آخر أو جهاز آخر</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};