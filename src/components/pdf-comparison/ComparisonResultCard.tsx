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
              {((result.max_similarity_score > 1 ? result.max_similarity_score : result.max_similarity_score * 100)).toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground font-semibold mt-1">
              أعلى نسبة تشابه
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 relative z-10">
        {/* Statistics Summary */}
        <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-background via-background/98 to-background/95 border shadow-lg">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
          
          <div className="relative grid grid-cols-3 gap-6">
            {/* Total Compared */}
            <div className="text-center">
              <div className="inline-flex p-2 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 mb-2">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="text-2xl font-bold text-foreground">{result.total_files_compared || result.total_matches_found}</div>
              <div className="text-xs text-muted-foreground font-medium mt-1">إجمالي الملفات المفحوصة</div>
            </div>
            
            {/* Matches Found */}
            <div className="text-center border-x border-border/50">
              <div className="inline-flex p-2 rounded-xl bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 mb-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-yellow-600">{result.total_matches_found}</div>
              <div className="text-xs text-muted-foreground font-medium mt-1">عدد التطابقات المكتشفة</div>
            </div>
            
            {/* High Risk */}
            <div className="text-center">
              <div className="inline-flex p-2 rounded-xl bg-gradient-to-br from-red-500/10 to-red-500/5 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className={cn(
                "text-2xl font-bold",
                result.high_risk_matches > 0 ? 'text-red-600' : 'text-green-600'
              )}>
                {result.high_risk_matches}
              </div>
              <div className="text-xs text-muted-foreground font-medium mt-1">تطابقات عالية الخطورة</div>
            </div>
          </div>
        </div>

        {/* Top 5 Matches */}
        {result.matches && result.matches.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                <h4 className="font-bold text-base text-foreground px-3 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {Math.min(5, result.matches.length)}
                  </span>
                  أعلى التطابقات المكتشفة
                </h4>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
              </div>
            </div>
            
            <div className="space-y-3">
              {result.matches.map((match, idx) => (
                <div
                  key={idx}
                  className="relative overflow-hidden group"
                >
                  <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-background via-background/98 to-background/95 rounded-2xl border hover:shadow-xl transition-all duration-300">
                    {/* Rank Badge */}
                    <div className={cn(
                      "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-md",
                      idx === 0 && match.similarity_score >= 70 
                        ? "bg-gradient-to-br from-red-600 to-red-500 text-white"
                        : idx === 0
                        ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
                        : "bg-gradient-to-br from-muted to-muted/80 text-muted-foreground"
                    )}>
                      {idx + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-3">
                      {/* File Name */}
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm font-semibold text-foreground truncate">
                          {match.matched_file_name}
                        </span>
                      </div>
                      
                      {/* Similarity Bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground font-medium">نسبة التشابه</span>
                          <span className={cn(
                            "font-bold text-base",
                            match.flagged ? 'text-red-600' : 
                            match.similarity_score >= 0.5 ? 'text-yellow-600' :
                            'text-green-600'
                          )}>
                            {((match.similarity_score > 1 ? match.similarity_score : match.similarity_score * 100)).toFixed(1)}%
                          </span>
                        </div>
                        <div className="relative h-3 bg-muted/30 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              match.flagged 
                                ? "bg-gradient-to-r from-red-600 to-red-500"
                                : match.similarity_score >= 0.5
                                ? "bg-gradient-to-r from-yellow-600 to-yellow-500"
                                : "bg-gradient-to-r from-green-600 to-green-500"
                            )}
                            style={{ width: `${(match.similarity_score > 1 ? match.similarity_score : match.similarity_score * 100)}%` }}
                          />
                        </div>
                      </div>
                      
                      {/* Method Info */}
                      <div className="flex items-center gap-3 text-xs">
                        {match.cosine_score !== undefined && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-400">
                            <span className="font-medium">Cosine:</span>
                            <span className="font-bold">{((match.cosine_score > 1 ? match.cosine_score : match.cosine_score * 100)).toFixed(0)}%</span>
                          </div>
                        )}
                        {match.jaccard_score !== undefined && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/10 text-purple-700 dark:text-purple-400">
                            <span className="font-medium">Jaccard:</span>
                            <span className="font-bold">{((match.jaccard_score > 1 ? match.jaccard_score : match.jaccard_score * 100)).toFixed(0)}%</span>
                          </div>
                        )}
                        {match.flagged && (
                          <Badge variant="destructive" className="text-xs px-2 py-0.5 font-bold">
                            ⚠️ يحتاج مراجعة
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
