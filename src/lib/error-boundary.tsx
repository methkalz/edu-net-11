import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Bug, Home } from 'lucide-react';
import { logError } from './logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // تسجيل الخطأ
    logError('React Error Boundary caught an error', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      retryCount: this.state.retryCount
    });

    // استدعاء callback المخصص إذا وُجد
    this.props.onError?.(error, errorInfo);

    // حفظ معلومات الخطأ في state
    this.setState({
      errorInfo
    });

    // إرسال تقرير للمراقبة في الإنتاج
    if (import.meta.env.PROD) {
      this.reportErrorToService(error, errorInfo);
    }
  }

  private async reportErrorToService(error: Error, errorInfo: React.ErrorInfo) {
    try {
      // يمكن إضافة إرسال للأخطاء إلى خدمة مراقبة خارجية
      // مثل Sentry, Bugsnag, أو LogRocket
      
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toLocaleDateString('en-US') + ' ' + new Date().toLocaleTimeString('en-US')
      };

      // حفظ في localStorage كنسخة احتياطية
      const existingReports = JSON.parse(localStorage.getItem('error_reports') || '[]');
      existingReports.push(errorReport);
      
      // الحفاظ على آخر 10 تقارير
      if (existingReports.length > 10) {
        existingReports.splice(0, existingReports.length - 10);
      }
      
      localStorage.setItem('error_reports', JSON.stringify(existingReports));
    } catch (e) {
      // تجاهل أخطاء الإرسال
    }
  }

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: prevState.retryCount + 1
      }));
    } else {
      // إعادة تحميل الصفحة إذا تم الوصول لحد المحاولات
      window.location.reload();
    }
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportBug = () => {
    const { error, errorInfo } = this.state;
    const reportData = {
      error: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // فتح نافذة لإرسال تقرير الخطأ
    const mailtoLink = `mailto:support@schoolsystem.com?subject=خطأ في النظام&body=${encodeURIComponent(
      `تفاصيل الخطأ:\n\n${JSON.stringify(reportData, null, 2)}`
    )}`;
    
    window.open(mailtoLink);
  };

  render() {
    if (this.state.hasError) {
      // عرض fallback مخصص إذا وُجد
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // عرض صفحة الخطأ الافتراضية
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-bold text-red-600">
                حدث خطأ غير متوقع
              </CardTitle>
              <CardDescription>
                نعتذر، حدث خطأ أثناء تشغيل التطبيق. يمكنك المحاولة مرة أخرى أو العودة للصفحة الرئيسية.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* عرض تفاصيل الخطأ في بيئة التطوير */}
              {import.meta.env.DEV && this.state.error && (
                <div className="p-3 bg-gray-50 rounded-md text-right">
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">تفاصيل الخطأ:</h4>
                  <p className="text-xs text-gray-600 font-mono">
                    {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer">
                        عرض التفاصيل الكاملة
                      </summary>
                      <pre className="text-xs text-gray-600 mt-2 whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* أزرار العمل */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={this.handleRetry}
                  className="flex-1"
                  disabled={this.state.retryCount >= this.maxRetries}
                >
                  <RefreshCw className="h-4 w-4 ml-2" />
                  {this.state.retryCount >= this.maxRetries ? 
                    'تم الوصول لحد المحاولات' : 
                    `المحاولة مرة أخرى (${this.state.retryCount}/${this.maxRetries})`
                  }
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={this.handleGoHome}
                  className="flex-1"
                >
                  <Home className="h-4 w-4 ml-2" />
                  العودة للرئيسية
                </Button>
              </div>

              <Button 
                variant="ghost" 
                onClick={this.handleReportBug}
                className="w-full text-sm"
              >
                <Bug className="h-4 w-4 ml-2" />
                إبلاغ عن المشكلة
              </Button>

              {/* معلومات إضافية */}
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Attempt: {this.state.retryCount + 1}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date().toLocaleDateString('en-US')} {new Date().toLocaleTimeString('en-US')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// مكون Error Boundary بسيط للاستخدام السريع
export const SimpleErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary fallback={
      <div className="p-4 text-center">
        <p className="text-red-600">حدث خطأ أثناء تحميل هذا المحتوى</p>
        <Button onClick={() => window.location.reload()} className="mt-2">
          إعادة تحميل الصفحة
        </Button>
      </div>
    }>
      {children}
    </ErrorBoundary>
  );
};

// Hook لاستخدام Error Boundary في function components  
export const useErrorBoundary = () => {
  return {
    handleError: (error: Error, context?: Record<string, unknown>) => {
      logError('Manual error handling', error, context);
      
      // يمكن إضافة منطق إضافي هنا مثل إظهار toast
      throw error; // إعادة رفع الخطأ ليصل إلى Error Boundary
    }
  };
};