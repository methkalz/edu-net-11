import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  AlertTriangle, 
  XCircle, 
  Wifi, 
  Clock, 
  FileX,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { PDFComparisonError, PDFErrorCode, formatFileSize } from '@/types/pdf-comparison-errors';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ErrorDetailsCardProps {
  error: PDFComparisonError;
  onRetry?: () => void;
}

const ErrorDetailsCard = ({ error, onRetry }: ErrorDetailsCardProps) => {
  const [showTechnical, setShowTechnical] = useState(false);

  const getErrorIcon = () => {
    switch (error.code) {
      case PDFErrorCode.FILE_TOO_LARGE:
      case PDFErrorCode.TEXT_TOO_LONG:
        return <FileX className="h-8 w-8" />;
      case PDFErrorCode.NETWORK_ERROR:
        return <Wifi className="h-8 w-8" />;
      case PDFErrorCode.COMPARISON_TIMEOUT:
      case PDFErrorCode.CPU_LIMIT_EXCEEDED:
        return <Clock className="h-8 w-8" />;
      case PDFErrorCode.EXTRACTION_FAILED:
        return <XCircle className="h-8 w-8" />;
      default:
        return <AlertCircle className="h-8 w-8" />;
    }
  };

  const getErrorColor = () => {
    switch (error.code) {
      case PDFErrorCode.FILE_TOO_LARGE:
      case PDFErrorCode.TEXT_TOO_LONG:
      case PDFErrorCode.CPU_LIMIT_EXCEEDED:
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900';
      case PDFErrorCode.EXTRACTION_FAILED:
      case PDFErrorCode.COMPARISON_TIMEOUT:
        return 'text-destructive bg-destructive/10 border-destructive/20';
      default:
        return 'text-muted-foreground bg-muted/50 border-muted';
    }
  };

  return (
    <Card className={`border-2 ${getErrorColor()}`}>
      <CardContent className="p-6 space-y-4">
        {/* رأس الخطأ */}
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-background/80 backdrop-blur-sm">
            {getErrorIcon()}
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="text-lg font-bold">
              {error.message}
            </h3>
            <p className="text-sm opacity-90">
              رمز الخطأ: <code className="px-2 py-1 rounded bg-background/50 font-mono text-xs">{error.code}</code>
            </p>
          </div>
        </div>

        {/* معلومات إضافية */}
        {Object.keys(error.details).length > 0 && (
          <div className="p-4 rounded-xl bg-background/80 backdrop-blur-sm space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4" />
              <span className="font-semibold text-sm">تفاصيل الملف:</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {error.details.fileName && (
                <div>
                  <span className="opacity-70">اسم الملف:</span>
                  <p className="font-medium truncate">{error.details.fileName}</p>
                </div>
              )}
              {error.details.fileSize && (
                <div>
                  <span className="opacity-70">حجم الملف:</span>
                  <p className="font-medium">{formatFileSize(error.details.fileSize)}</p>
                </div>
              )}
              {error.details.wordCount && (
                <div>
                  <span className="opacity-70">عدد الكلمات:</span>
                  <p className="font-medium">{error.details.wordCount.toLocaleString('ar-SA')}</p>
                </div>
              )}
              {error.details.maxAllowed && (
                <div>
                  <span className="opacity-70">الحد الأقصى المسموح:</span>
                  <p className="font-medium">{error.details.maxAllowed.toLocaleString('ar-SA')}</p>
                </div>
              )}
              {error.details.processingTime && (
                <div>
                  <span className="opacity-70">وقت المعالجة:</span>
                  <p className="font-medium">{(error.details.processingTime / 1000).toFixed(1)}s</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* الاقتراحات */}
        {error.suggestions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-semibold text-sm">حلول مقترحة:</span>
            </div>
            <ul className="space-y-2 mr-6">
              {error.suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* المعلومات التقنية (قابلة للطي) */}
        {error.details.technicalError && (
          <Collapsible open={showTechnical} onOpenChange={setShowTechnical}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-between text-xs"
              >
                <span>المعلومات التقنية (للمطورين)</span>
                {showTechnical ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="p-3 rounded-lg bg-background/80 backdrop-blur-sm">
                <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
                  {error.details.technicalError}
                </pre>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* زر إعادة المحاولة */}
        {onRetry && (
          <Button 
            onClick={onRetry}
            variant="outline"
            className="w-full mt-4"
          >
            إعادة المحاولة
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ErrorDetailsCard;
