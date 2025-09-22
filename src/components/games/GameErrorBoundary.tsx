import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class GameErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // تسجيل تفاصيل الخطأ مع معلومات إضافية
    logger.error('Game Error Boundary caught an error', error, {
      componentStack: errorInfo.componentStack,
      source: 'GameErrorBoundary',
      errorMessage: error.message,
      errorStack: error.stack,
      timestamp: new Date().toISOString()
    });

    // تسجيل أخطاء null pointer بشكل خاص
    if (error.message.includes('Cannot read properties of null') || 
        error.message.includes('reading \'difficulty_level\'')) {
      logger.warn('Null reference error detected in game', {
        error: error.message,
        component: 'GameErrorBoundary',
        likelyIssue: 'currentQuestion is null'
      });
    }

    // تسجيل أخطاء قاعدة البيانات
    if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
      logger.warn('Database constraint error', {
        error: error.message,
        component: 'GameErrorBoundary',
        likelyIssue: 'Duplicate progress record'
      });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-xl">حدث خطأ في اللعبة</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                عذراً، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-left">
                  <code className="text-xs text-red-800">
                    {this.state.error.message}
                  </code>
                </div>
              )}
              
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={() => this.setState({ hasError: false, error: undefined })}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  إعادة المحاولة
                </Button>
                
                <Button 
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2"
                >
                  إعادة تحميل الصفحة
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GameErrorBoundary;