import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  FileText,
  Users,
  Database,
  Download,
  Loader2
} from 'lucide-react';
import type { ComparisonResult, MatchedSegment } from '@/hooks/usePDFComparison';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BatchComparisonResultProps {
  result: ComparisonResult;
}

const BatchComparisonResult = ({ result: initialResult }: BatchComparisonResultProps) => {
  const [result, setResult] = useState(initialResult);
  const [allSegments, setAllSegments] = useState<MatchedSegment[] | null>(null);
  const [loadingSegments, setLoadingSegments] = useState(false);
  const [showingAllSegments, setShowingAllSegments] = useState(false);
  const [isComparingRepository, setIsComparingRepository] = useState(
    initialResult.comparison_source === 'internal'
  );

  // Realtime subscription to listen for updates
  useEffect(() => {
    if (!result.id) return;

    console.log(`🔔 Setting up realtime subscription for comparison ${result.id}`);
    console.log(`📊 Initial state: comparison_source="${result.comparison_source}", isComparingRepository=${isComparingRepository}`);

    const channel = supabase
      .channel(`comparison-${result.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pdf_comparison_results',
          filter: `id=eq.${result.id}`,
        },
        (payload) => {
          console.log('📡 Received realtime update:', {
            id: payload.new.id,
            comparison_source: payload.new.comparison_source,
            repository_matches_count: payload.new.repository_matches?.length || 0,
            status: payload.new.status
          });
          
          const updatedResult = payload.new as ComparisonResult;
          
          // Update the result
          setResult(updatedResult);
          
          // Check if repository comparison is complete
          if (updatedResult.comparison_source === 'both') {
            console.log('✅ Repository comparison completed!');
            setIsComparingRepository(false);
            toast.success('اكتملت المقارنة مع المستودع');
          }
        }
      )
      .subscribe((status) => {
        console.log(`🔔 Subscription status: ${status}`);
      });

    return () => {
      console.log(`🔕 Cleaning up subscription for comparison ${result.id}`);
      supabase.removeChannel(channel);
    };
  }, [result.id]); // Removed isComparingRepository from dependencies

  const loadAllSegments = async () => {
    setLoadingSegments(true);
    try {
      const { data, error } = await supabase.functions.invoke('pdf-get-all-segments', {
        body: { comparisonId: result.id },
      });

      if (error) throw error;

      if (data?.success) {
        setAllSegments(data.segments || []);
        setShowingAllSegments(true);
        toast.success(`تم تحميل ${data.segments?.length || 0} تشابه`);
      } else {
        throw new Error(data?.error || 'فشل تحميل التشابهات');
      }
    } catch (error) {
      console.error('Error loading all segments:', error);
      toast.error('فشل تحميل جميع التشابهات');
    } finally {
      setLoadingSegments(false);
    }
  };

  const exportSegments = () => {
    const segments = allSegments || result.top_matched_segments || [];
    const exportData = segments.map((seg, idx) => ({
      '#': idx + 1,
      'النص المصدر': seg.source_text,
      'النص المطابق': seg.matched_text,
      'نسبة التشابه': `${(seg.similarity * 100).toFixed(1)}%`,
      'صفحة المصدر': seg.source_page,
      'صفحة المطابقة': seg.matched_page,
      'اسم الملف': seg.matched_file_name || 'غير محدد',
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comparison-segments-${result.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('تم تصدير النتائج');
  };

  const getStatusConfig = () => {
    switch (result.status) {
      case 'flagged':
        return {
          icon: AlertTriangle,
          color: 'text-destructive',
          bgColor: 'bg-destructive/10',
          badgeVariant: 'destructive' as const,
          label: 'يحتاج مراجعة',
        };
      case 'warning':
        return {
          icon: AlertCircle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-500/10',
          badgeVariant: 'secondary' as const,
          label: 'تحذير',
        };
      default:
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-500/10',
          badgeVariant: 'secondary' as const,
          label: 'آمن',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const hasInternalMatches = result.internal_matches && result.internal_matches.length > 0;
  const hasRepositoryMatches = result.repository_matches && result.repository_matches.length > 0;

  const renderMatchList = (matches: any[], title: string, icon: React.ReactNode) => {
    if (!matches || matches.length === 0) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b">
          {icon}
          <h4 className="font-bold text-sm">{title}</h4>
          <Badge variant="outline" className="mr-auto">
            {matches.length}
          </Badge>
        </div>
        
        <div className="space-y-2">
          {matches.map((match, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 bg-background/50 rounded-lg border hover:shadow-md transition-all duration-200"
            >
              <div className={cn(
                "flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs",
                match.flagged 
                  ? "bg-gradient-to-br from-destructive/20 to-destructive/10 text-destructive"
                  : "bg-gradient-to-br from-primary/20 to-primary/10 text-primary"
              )}>
                {idx + 1}
              </div>
              
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs font-semibold truncate">
                    {match.matched_file_name}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">التشابه</span>
                    <span className={cn(
                      "font-bold",
                      match.flagged ? 'text-destructive' : 
                      match.similarity_score >= 0.5 ? 'text-yellow-600' :
                      'text-green-600'
                    )}>
                      {((match.similarity_score > 1 ? match.similarity_score : match.similarity_score * 100)).toFixed(1)}%
                    </span>
                  </div>
                  <div className="relative h-1.5 bg-muted/30 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        match.flagged 
                          ? "bg-gradient-to-r from-destructive to-destructive/80"
                          : match.similarity_score >= 0.5
                          ? "bg-gradient-to-r from-yellow-600 to-yellow-500"
                          : "bg-gradient-to-r from-green-600 to-green-500"
                      )}
                      style={{ width: `${(match.similarity_score > 1 ? match.similarity_score : match.similarity_score * 100)}%` }}
                    />
                  </div>
                </div>
                
                {match.flagged && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">
                    ⚠️ عالي الخطورة
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className={cn(
      'relative overflow-hidden border backdrop-blur-sm shadow-lg transition-all duration-300',
      result.status === 'flagged' ? 'bg-gradient-to-br from-destructive/5 via-background to-background' :
      result.status === 'warning' ? 'bg-gradient-to-br from-yellow-500/5 via-background to-background' :
      'bg-gradient-to-br from-green-500/5 via-background to-background'
    )}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
      
      <CardHeader className="relative z-10 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-xl', config.bgColor)}>
              <Icon className={cn('h-5 w-5', config.color)} />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">نتيجة المقارنة</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={config.badgeVariant} className="text-xs">
                  {config.label}
                </Badge>
                {isComparingRepository && (
                  <Badge variant="secondary" className="text-xs animate-pulse">
                    <Loader2 className="h-3 w-3 ml-1 animate-spin" />
                    جاري المقارنة مع المستودع...
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="text-left">
            <div className={cn(
              'text-2xl font-bold bg-gradient-to-br bg-clip-text text-transparent',
              result.status === 'flagged' ? 'from-destructive via-destructive/80 to-destructive/60' :
              result.status === 'warning' ? 'from-yellow-600 via-yellow-500 to-yellow-400' :
              'from-green-600 via-green-500 to-green-400'
            )}>
              {((result.max_similarity_score > 1 ? result.max_similarity_score : result.max_similarity_score * 100)).toFixed(1)}%
            </div>
            <div className="text-[10px] text-muted-foreground font-semibold mt-0.5">
              أعلى تشابه
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 relative z-10">
        {/* Statistics */}
        <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-card/80 border">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex p-1.5 rounded-lg bg-primary/10 mb-1">
              <FileText className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="text-lg font-bold">{result.total_matches_found || 0}</div>
            <div className="text-[10px] text-muted-foreground">تطابقات</div>
          </div>
          
          {hasInternalMatches && (
            <div className="flex flex-col items-center text-center border-x">
              <div className="inline-flex p-1.5 rounded-lg bg-blue-500/10 mb-1">
                <Users className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <div className="text-lg font-bold text-blue-600">
                {result.internal_high_risk_count || 0}
              </div>
              <div className="text-[10px] text-muted-foreground">داخلية</div>
            </div>
          )}
          
          {hasRepositoryMatches && (
            <div className="flex flex-col items-center text-center">
              <div className="inline-flex p-1.5 rounded-lg bg-purple-500/10 mb-1">
                <Database className="h-3.5 w-3.5 text-purple-600" />
              </div>
              <div className="text-lg font-bold text-purple-600">
                {result.repository_high_risk_count || 0}
              </div>
              <div className="text-[10px] text-muted-foreground">مستودع</div>
            </div>
          )}
        </div>

        {/* Internal Matches */}
        {hasInternalMatches && renderMatchList(
          result.internal_matches,
          'المقارنة بين الملفات المرفوعة',
          <Users className="h-4 w-4 text-blue-600" />
        )}

        {/* Repository Matches */}
        {hasRepositoryMatches && renderMatchList(
          result.repository_matches,
          'المقارنة مع المستودع',
          <Database className="h-4 w-4 text-purple-600" />
        )}

        {/* No Matches */}
        {!hasInternalMatches && !hasRepositoryMatches && (
          <div className="text-center py-8 bg-green-500/5 rounded-xl">
            <div className="inline-flex p-3 rounded-full bg-green-500/10 mb-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <p className="font-bold text-green-700 dark:text-green-400 mb-1">
              لم يتم العثور على تشابه
            </p>
            <p className="text-xs text-green-600 dark:text-green-500">
              هذا المشروع يبدو أصلياً ✓
            </p>
          </div>
        )}

        {/* Matched Segments Section */}
        {((result.top_matched_segments && result.top_matched_segments.length > 0) || showingAllSegments) && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h4 className="font-bold text-sm">الجمل والعبارات المتشابهة</h4>
                <Badge variant="outline">
                  {showingAllSegments ? allSegments?.length : result.top_matched_segments?.length || 0}
                </Badge>
              </div>
              
              <div className="flex gap-2">
                {!showingAllSegments && result.segments_count && result.segments_count > 20 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={loadAllSegments}
                    disabled={loadingSegments}
                  >
                    {loadingSegments ? (
                      <>
                        <Loader2 className="h-3 w-3 ml-2 animate-spin" />
                        جاري التحميل...
                      </>
                    ) : (
                      <>تحميل الكل ({result.segments_count})</>
                    )}
                  </Button>
                )}
                
                {(allSegments || result.top_matched_segments) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={exportSegments}
                  >
                    <Download className="h-3 w-3 ml-2" />
                    تصدير
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {(showingAllSegments ? allSegments : result.top_matched_segments)?.map((segment, idx) => (
                <Card key={idx} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs",
                      segment.similarity >= 0.8 
                        ? "bg-destructive/20 text-destructive"
                        : segment.similarity >= 0.65
                        ? "bg-yellow-500/20 text-yellow-600"
                        : "bg-green-500/20 text-green-600"
                    )}>
                      {idx + 1}
                    </div>

                    <div className="flex-1 space-y-3">
                      {/* Similarity Score */}
                      <div className="flex items-center justify-between">
                        <Badge variant={
                          segment.similarity >= 0.8 ? "destructive" :
                          segment.similarity >= 0.65 ? "secondary" : "outline"
                        }>
                          تشابه: {(segment.similarity * 100).toFixed(1)}%
                        </Badge>
                        
                        {segment.matched_file_name && (
                          <span className="text-xs text-muted-foreground">
                            📄 {segment.matched_file_name}
                          </span>
                        )}
                      </div>

                      {/* Source Text */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-semibold">النص المصدر</span>
                          <Badge variant="outline" className="text-[10px]">
                            صفحة {segment.source_page}
                          </Badge>
                        </div>
                        <p className="text-sm bg-blue-50 dark:bg-blue-950/20 p-3 rounded border-r-2 border-blue-500">
                          {segment.source_text}
                        </p>
                      </div>

                      {/* Matched Text */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-semibold">النص المطابق</span>
                          <Badge variant="outline" className="text-[10px]">
                            صفحة {segment.matched_page}
                          </Badge>
                        </div>
                        <p className="text-sm bg-purple-50 dark:bg-purple-950/20 p-3 rounded border-r-2 border-purple-500">
                          {segment.matched_text}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BatchComparisonResult;