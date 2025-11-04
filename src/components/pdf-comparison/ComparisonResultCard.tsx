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
    <Card className={cn(
      'relative overflow-hidden border-0 backdrop-blur-sm shadow-xl transition-all duration-300',
      result.status === 'flagged' ? 'bg-gradient-to-br from-red-50 via-red-50/80 to-red-100/60 dark:from-red-950/30 dark:via-red-950/20 dark:to-red-900/10' :
      result.status === 'warning' ? 'bg-gradient-to-br from-yellow-50 via-yellow-50/80 to-yellow-100/60 dark:from-yellow-950/30 dark:via-yellow-950/20 dark:to-yellow-900/10' :
      'bg-gradient-to-br from-green-50 via-green-50/80 to-green-100/60 dark:from-green-950/30 dark:via-green-950/20 dark:to-green-900/10'
    )}>
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-accent/5 to-transparent rounded-full blur-2xl" />
      
      <CardHeader className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              'relative p-3 rounded-2xl backdrop-blur-sm shadow-lg',
              result.status === 'flagged' ? 'bg-gradient-to-br from-red-600/20 to-red-500/10' :
              result.status === 'warning' ? 'bg-gradient-to-br from-yellow-600/20 to-yellow-500/10' :
              'bg-gradient-to-br from-green-600/20 to-green-500/10'
            )}>
              <Icon className={cn('h-7 w-7', config.color)} />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">نتيجة المقارنة</CardTitle>
              <Badge 
                variant={config.badgeVariant} 
                className="mt-2 px-3 py-1 text-xs font-semibold"
              >
                {config.label}
              </Badge>
            </div>
          </div>

          <div className="text-left">
            <div className={cn(
              'text-4xl font-bold bg-gradient-to-br bg-clip-text text-transparent',
              result.status === 'flagged' ? 'from-red-600 via-red-500 to-red-400' :
              result.status === 'warning' ? 'from-yellow-600 via-yellow-500 to-yellow-400' :
              'from-green-600 via-green-500 to-green-400'
            )}>
              {result.max_similarity_score.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground font-semibold mt-1">
              أعلى نسبة تشابه
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 relative z-10">
        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="relative overflow-hidden p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full blur-2xl" />
            <div className="relative">
              <span className="text-xs text-muted-foreground font-medium block mb-1">إجمالي التطابقات</span>
              <span className="text-2xl font-bold text-primary">{result.total_matches_found}</span>
            </div>
          </div>
          
          <div className="relative overflow-hidden p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full blur-2xl" />
            <div className="relative">
              <span className="text-xs text-muted-foreground font-medium block mb-1">تطابقات مشبوهة</span>
              <span className={cn(
                "text-2xl font-bold",
                result.high_risk_matches > 0 ? 'text-red-600' : 'text-green-600'
              )}>
                {result.high_risk_matches}
              </span>
            </div>
          </div>
          
          <div className="relative overflow-hidden p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-full blur-2xl" />
            <div className="relative">
              <span className="text-xs text-muted-foreground font-medium block mb-1">متوسط التشابه</span>
              <span className="text-2xl font-bold text-yellow-600">{result.avg_similarity_score.toFixed(1)}%</span>
            </div>
          </div>
          
          <div className="relative overflow-hidden p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl" />
            <div className="relative">
              <span className="text-xs text-muted-foreground font-medium block mb-1">وقت المعالجة</span>
              <span className="text-2xl font-bold text-purple-600">{(result.processing_time_ms / 1000).toFixed(1)}ث</span>
            </div>
          </div>
        </div>

        {/* Matches List */}
        {result.matches && result.matches.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
              <h4 className="font-semibold text-sm text-muted-foreground px-3">الملفات المتشابهة</h4>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
            </div>
            
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {result.matches.slice(0, 10).map((match, idx) => (
                <div
                  key={idx}
                  className="relative overflow-hidden flex items-center justify-between p-4 bg-gradient-to-br from-background via-background/95 to-background/90 rounded-xl border hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium truncate">{match.matched_file_name}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 flex-shrink-0 relative z-10">
                    <Progress 
                      value={match.similarity_score} 
                      className="w-28 h-2" 
                    />
                    <span className={cn(
                      "font-bold text-sm w-16 text-left",
                      match.flagged ? 'text-red-600' : 'text-muted-foreground'
                    )}>
                      {match.similarity_score.toFixed(1)}%
                    </span>
                    {match.flagged && (
                      <Badge variant="destructive" className="text-xs px-2 py-1">
                        مشبوه
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {result.matches.length > 10 && (
              <p className="text-xs text-muted-foreground text-center py-2 px-4 bg-muted/30 rounded-lg">
                و {result.matches.length - 10} ملفات أخرى...
              </p>
            )}
          </div>
        ) : (
          <div className="relative overflow-hidden text-center py-12 bg-gradient-to-br from-green-50 via-green-100/80 to-green-50 dark:from-green-950/30 dark:via-green-900/20 dark:to-green-950/10 rounded-2xl border-2 border-green-200 dark:border-green-800 shadow-xl">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <div className="p-4 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/10 w-fit mx-auto mb-4 shadow-lg">
                <CheckCircle className="h-14 w-14 text-green-600" />
              </div>
              <p className="font-bold text-green-700 dark:text-green-400 text-xl mb-2">
                لم يتم العثور على تشابه مع الملفات المخزنة
              </p>
              <p className="text-sm text-green-600 dark:text-green-500 font-medium">
                هذا المشروع يبدو أصلياً ✓
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ComparisonResultCard;
