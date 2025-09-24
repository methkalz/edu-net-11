import { useState } from 'react';
import { AlertTriangle, RefreshCw, Wifi, WifiOff, HelpCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { NetworkDiagnostics } from '@/components/diagnostics/NetworkDiagnostics';
import { useNetworkMonitor } from '@/hooks/useNetworkMonitor';

interface AuthError {
  type: 'network' | 'auth' | 'server' | 'timeout' | 'unknown';
  message: string;
  originalError?: any;
}

interface AuthErrorHandlerProps {
  error: AuthError | null;
  onRetry: () => void;
  loading?: boolean;
}

export const AuthErrorHandler = ({ error, onRetry, loading = false }: AuthErrorHandlerProps) => {
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const { networkStatus } = useNetworkMonitor();

  if (!error) return null;

  const getErrorIcon = () => {
    switch (error.type) {
      case 'network':
        return networkStatus.isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />;
      case 'timeout':
        return <RefreshCw className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getErrorTitle = () => {
    switch (error.type) {
      case 'network':
        return 'مشكلة في الاتصال';
      case 'auth':
        return 'خطأ في المصادقة';
      case 'server':
        return 'مشكلة في الخادم';
      case 'timeout':
        return 'انتهت مهلة الاتصال';
      default:
        return 'حدث خطأ غير متوقع';
    }
  };

  const getErrorDescription = () => {
    switch (error.type) {
      case 'network':
        return 'تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت.';
      case 'auth':
        return 'فشل في التحقق من بيانات الدخول. تحقق من البريد الإلكتروني وكلمة المرور.';
      case 'server':
        return 'الخادم غير متاح حالياً. حاول مرة أخرى بعد قليل.';
      case 'timeout':
        return 'استغرق الاتصال وقتاً أطول من المتوقع. حاول مرة أخرى.';
      default:
        return error.message || 'حدث خطأ غير محدد. حاول مرة أخرى.';
    }
  };

  const getSolutions = () => {
    switch (error.type) {
      case 'network':
        return [
          'تحقق من اتصالك بالإنترنت',
          'أعد تحميل الصفحة',
          'جرب شبكة إنترنت أخرى',
          'تأكد من عدم حجب المتصفح للموقع'
        ];
      case 'auth':
        return [
          'تحقق من صحة البريد الإلكتروني',
          'تحقق من صحة كلمة المرور',
          'تأكد من تفعيل حسابك',
          'اتصل بالدعم التقني إذا استمرت المشكلة'
        ];
      case 'server':
        return [
          'انتظر بضع دقائق وحاول مرة أخرى',
          'تحقق من حالة الخدمة',
          'امسح ذاكرة التخزين المؤقت',
          'اتصل بالدعم التقني'
        ];
      case 'timeout':
        return [
          'تحقق من سرعة الإنترنت',
          'أغلق التطبيقات الأخرى',
          'جرب في وقت آخر',
          'استخدم شبكة إنترنت أسرع'
        ];
      default:
        return [
          'أعد تحميل الصفحة',
          'امسح ذاكرة التخزين المؤقت',
          'جرب متصفح آخر',
          'اتصل بالدعم التقني'
        ];
    }
  };

  return (
    <div className="w-full space-y-4">
      <Alert variant="destructive">
        <div className="flex items-center gap-2">
          {getErrorIcon()}
          <div className="flex-1">
            <h4 className="font-medium">{getErrorTitle()}</h4>
            <AlertDescription className="mt-1">
              {getErrorDescription()}
            </AlertDescription>
          </div>
        </div>
      </Alert>

      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={onRetry}
          disabled={loading}
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          إعادة المحاولة
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDiagnostics(!showDiagnostics)}
          className="flex items-center gap-2"
        >
          <Wifi className="h-4 w-4" />
          فحص الاتصال
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowHelp(!showHelp)}
          className="flex items-center gap-2"
        >
          <HelpCircle className="h-4 w-4" />
          المساعدة
        </Button>
      </div>

      {showDiagnostics && (
        <div className="animate-in slide-in-from-top-2">
          <NetworkDiagnostics />
        </div>
      )}

      <Collapsible open={showHelp} onOpenChange={setShowHelp}>
        <CollapsibleContent>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">خطوات حل المشكلة</CardTitle>
              <CardDescription>
                جرب هذه الحلول بالترتيب
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                {getSolutions().map((solution, index) => (
                  <li key={index} className="text-muted-foreground">
                    {solution}
                  </li>
                ))}
              </ol>
              
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  إذا استمرت المشكلة، يُرجى الاتصال بالدعم التقني مع ذكر رمز الخطأ:
                  <code className="ml-2 px-2 py-1 bg-muted rounded">
                    {error.type}_{Date.now().toString().slice(-6)}
                  </code>
                </p>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};