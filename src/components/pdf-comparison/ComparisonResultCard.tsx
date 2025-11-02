import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  FileText, 
  Download 
} from 'lucide-react';
import type { ComparisonResult } from '@/hooks/usePDFComparison';
import { cn } from '@/lib/utils';

interface ComparisonResultCardProps {
  result: ComparisonResult;
}

const ComparisonResultCard = ({ result }: ComparisonResultCardProps) => {
  const getStatusConfig = () => {
    switch (result.status) {
      case 'flagged':
        return {
          icon: AlertTriangle,
          color: 'text-red-600',
          bgColor: 'bg-red-50 border-red-200',
          badgeVariant: 'destructive' as const,
          label: 'يحتاج مراجعة',
        };
      case 'warning':
        return {
          icon: AlertCircle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50 border-yellow-200',
          badgeVariant: 'secondary' as const,
          label: 'تحذير',
        };
      default:
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50 border-green-200',
          badgeVariant: 'secondary' as const,
          label: 'آمن',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Card className={cn('border-2', config.bgColor)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className={cn('h-6 w-6', config.color)} />
            <div>
              <CardTitle className="text-base">نتيجة المقارنة</CardTitle>
              <Badge variant={config.badgeVariant} className="mt-1">
                {config.label}
              </Badge>
            </div>
          </div>

          <div className="text-left">
            <div className="text-3xl font-bold">
              {result.max_similarity_score.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">
              أعلى نسبة تشابه
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">إجمالي التطابقات:</span>
            <span className="font-medium mr-2">{result.total_matches_found}</span>
          </div>
          <div>
            <span className="text-muted-foreground">تطابقات مشبوهة:</span>
            <span className={cn(
              "font-medium mr-2",
              result.high_risk_matches > 0 ? 'text-red-600' : 'text-green-600'
            )}>
              {result.high_risk_matches}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">متوسط التشابه:</span>
            <span className="font-medium mr-2">{result.avg_similarity_score.toFixed(1)}%</span>
          </div>
          <div>
            <span className="text-muted-foreground">وقت المعالجة:</span>
            <span className="font-medium mr-2">{(result.processing_time_ms / 1000).toFixed(1)}ث</span>
          </div>
        </div>

        {/* Matches List */}
        {result.matches && result.matches.length > 0 ? (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">الملفات المتشابهة:</h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {result.matches.slice(0, 10).map((match, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-background rounded-lg border"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm truncate">{match.matched_file_name}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Progress 
                      value={match.similarity_score} 
                      className="w-24" 
                    />
                    <span className={cn(
                      "font-bold text-sm w-16 text-left",
                      match.flagged ? 'text-red-600' : 'text-muted-foreground'
                    )}>
                      {match.similarity_score.toFixed(1)}%
                    </span>
                    {match.flagged && (
                      <Badge variant="destructive" className="text-xs">
                        مشبوه
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {result.matches.length > 10 && (
              <p className="text-xs text-muted-foreground text-center">
                و {result.matches.length - 10} ملفات أخرى...
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-green-600 bg-green-50 rounded-lg">
            <CheckCircle className="h-12 w-12 mx-auto mb-2" />
            <p className="font-medium">لم يتم العثور على تشابه مع الملفات المخزنة</p>
            <p className="text-sm text-muted-foreground mt-1">
              هذا المشروع يبدو أصلياً
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Download className="h-4 w-4 ml-2" />
            تصدير التقرير
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            عرض التفاصيل
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComparisonResultCard;
