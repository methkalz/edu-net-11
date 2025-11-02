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
    <Card className={cn('border-0 bg-gradient-to-br backdrop-blur-sm shadow-lg', config.bgColor)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg backdrop-blur-sm', 
              result.status === 'flagged' ? 'bg-red-600/20' :
              result.status === 'warning' ? 'bg-yellow-600/20' :
              'bg-green-600/20'
            )}>
              <Icon className={cn('h-6 w-6', config.color)} />
            </div>
            <div>
              <CardTitle className="text-base">نتيجة المقارنة</CardTitle>
              <Badge variant={config.badgeVariant} className="mt-1">
                {config.label}
              </Badge>
            </div>
          </div>

          <div className="text-left">
            <div className={cn(
              'text-3xl font-bold bg-gradient-to-br bg-clip-text text-transparent',
              result.status === 'flagged' ? 'from-red-600 to-red-400' :
              result.status === 'warning' ? 'from-yellow-600 to-yellow-400' :
              'from-green-600 to-green-400'
            )}>
              {result.max_similarity_score.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              أعلى نسبة تشابه
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Statistics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-background/50 border">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">إجمالي التطابقات</span>
              <span className="text-lg font-bold text-primary">{result.total_matches_found}</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-background/50 border">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">تطابقات مشبوهة</span>
              <span className={cn(
                "text-lg font-bold",
                result.high_risk_matches > 0 ? 'text-red-600' : 'text-green-600'
              )}>
                {result.high_risk_matches}
              </span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-background/50 border">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">متوسط التشابه</span>
              <span className="text-lg font-bold text-yellow-600">{result.avg_similarity_score.toFixed(1)}%</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-background/50 border">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">وقت المعالجة</span>
              <span className="text-lg font-bold text-purple-600">{(result.processing_time_ms / 1000).toFixed(1)}ث</span>
            </div>
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
                  className="flex items-center justify-between p-3 bg-background/80 rounded-lg border hover:shadow-md transition-all duration-200"
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
          <div className="text-center py-8 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/10 rounded-xl border-2 border-green-200 dark:border-green-800">
            <div className="p-3 rounded-full bg-green-500/10 w-fit mx-auto mb-3">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <p className="font-bold text-green-700 dark:text-green-400 text-lg">لم يتم العثور على تشابه مع الملفات المخزنة</p>
            <p className="text-sm text-green-600 dark:text-green-500 mt-2">
              هذا المشروع يبدو أصلياً ✓
            </p>
          </div>
        )}

      </CardContent>
    </Card>
  );
};

export default ComparisonResultCard;
