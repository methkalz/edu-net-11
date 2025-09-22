import React from 'react';
import { BookOpen, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Grade11LoadingFallbackProps {
  message?: string;
  showRetry?: boolean;
  onRetry?: () => void;
}

export const Grade11LoadingFallback: React.FC<Grade11LoadingFallbackProps> = ({ 
  message = "جاري تحميل محتوى الصف الحادي عشر...",
  showRetry = false,
  onRetry
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 relative">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <Loader2 className="h-6 w-6 text-blue-500 animate-spin absolute -top-1 -right-1" />
          </div>
          <CardTitle className="text-xl font-bold text-blue-700">
            الصف الحادي عشر
          </CardTitle>
          <CardDescription className="text-center">
            {message}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center">
          <div className="space-y-2">
            <div className="flex justify-center items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-75"></div>
              <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse delay-150"></div>
            </div>
            <p className="text-xs text-muted-foreground">
              قد يستغرق الأمر بضع ثوانٍ...
            </p>
          </div>
          
          {showRetry && onRetry && (
            <button
              onClick={onRetry}
              className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              المحاولة مرة أخرى
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Grade11LoadingFallback;