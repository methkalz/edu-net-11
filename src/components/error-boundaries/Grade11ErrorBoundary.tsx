import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, BookOpen } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

export class Grade11ErrorBoundary extends Component<Props, State> {
  private maxRetries = 2;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    console.error('🚨 Grade11ErrorBoundary caught error:', error);
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Grade11 Component Error Details:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount
    });

    // Save error report for Grade11 specific issues
    const errorReport = {
      component: 'Grade11Management',
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      retryCount: this.state.retryCount,
      url: window.location.href
    };

    try {
      const existingReports = JSON.parse(localStorage.getItem('grade11_error_reports') || '[]');
      existingReports.push(errorReport);
      if (existingReports.length > 5) {
        existingReports.splice(0, existingReports.length - 5);
      }
      localStorage.setItem('grade11_error_reports', JSON.stringify(existingReports));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  private handleRetry = () => {
    console.log(`🔄 Retrying Grade11 component (attempt ${this.state.retryCount + 1}/${this.maxRetries})`);
    
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        retryCount: prevState.retryCount + 1
      }));
    } else {
      // Force page reload if max retries reached
      console.log('🔄 Max retries reached, reloading page...');
      window.location.reload();
    }
  };

  private handleGoToContentManagement = () => {
    console.log('🏠 Navigating back to content management...');
    window.location.href = '/content-management';
  };

  private handleGoHome = () => {
    console.log('🏠 Navigating to dashboard...');
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4" dir="rtl">
          <Card className="w-full max-w-lg shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-xl font-bold text-red-600">
                خطأ في تحميل محتوى الصف الحادي عشر
              </CardTitle>
              <CardDescription className="text-center">
                نعتذر، حدث خطأ أثناء تحميل صفحة محتوى الصف الحادي عشر. 
                يمكنك المحاولة مرة أخرى أو العودة لإدارة المحتوى.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Development error details */}
              {import.meta.env.DEV && this.state.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-right">
                  <h4 className="font-semibold text-sm text-red-700 mb-2">تفاصيل الخطأ (وضع التطوير):</h4>
                  <p className="text-xs text-red-600 font-mono break-all">
                    {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <details className="mt-2">
                      <summary className="text-xs text-red-500 cursor-pointer hover:text-red-700">
                        عرض Stack Trace
                      </summary>
                      <pre className="text-xs text-red-600 mt-2 whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="grid grid-cols-1 gap-3">
                <Button 
                  onClick={this.handleRetry}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={this.state.retryCount >= this.maxRetries}
                >
                  <RefreshCw className="h-4 w-4 ml-2" />
                  {this.state.retryCount >= this.maxRetries ? 
                    'إعادة تحميل الصفحة' : 
                    `المحاولة مرة أخرى (${this.state.retryCount}/${this.maxRetries})`
                  }
                </Button>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    onClick={this.handleGoToContentManagement}
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <BookOpen className="h-4 w-4 ml-2" />
                    إدارة المحتوى
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={this.handleGoHome}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <Home className="h-4 w-4 ml-2" />
                    الرئيسية
                  </Button>
                </div>
              </div>

              {/* Info */}
              <div className="text-center pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  محاولة رقم: {this.state.retryCount + 1} | 
                  {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString('en-GB')}
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

// HOC wrapper for easy use
export const withGrade11ErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return (props: P) => (
    <Grade11ErrorBoundary>
      <Component {...props} />
    </Grade11ErrorBoundary>
  );
};