import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { RefreshCw, FileText, AlertTriangle, AlertCircle, CheckCircle, Eye, Clock, TrendingUp, Target, BookOpen, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { usePDFComparison, type GradeLevel, type ComparisonResult, type ComparisonMatch } from '@/hooks/usePDFComparison';
import { formatDistanceToNow, format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { AIAnalysisSection } from './AIAnalysisSection';

interface ComparisonHistoryProps {
  gradeLevel?: GradeLevel;
}

const ComparisonHistory = ({ gradeLevel }: ComparisonHistoryProps) => {
  const { getComparisonHistory } = usePDFComparison();
  const [history, setHistory] = useState<ComparisonResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedComparison, setSelectedComparison] = useState<ComparisonResult | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<ComparisonMatch | null>(null);
  const [isMatchDetailOpen, setIsMatchDetailOpen] = useState(false);

  const loadHistory = async () => {
    setIsLoading(true);
    const data = await getComparisonHistory(gradeLevel);
    setHistory(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, [gradeLevel]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'flagged':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      flagged: { label: 'مشبوه', variant: 'destructive' as const },
      warning: { label: 'تحذير', variant: 'secondary' as const },
      safe: { label: 'آمن', variant: 'secondary' as const },
    };
    const statusConfig = config[status as keyof typeof config] || config.safe;
    return <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>;
  };

  const handleViewDetails = (comparison: ComparisonResult) => {
    setSelectedComparison(comparison);
    setIsDialogOpen(true);
    setSelectedMatch(null);
    setIsMatchDetailOpen(false);
  };

  const handleMatchClick = (match: ComparisonMatch) => {
    setSelectedMatch(match);
    setIsMatchDetailOpen(true);
  };

  const getUniquePages = (segments: ComparisonMatch['matched_segments']) => {
    if (!segments) return [];
    const pages = new Set<number>();
    segments.forEach(seg => {
      pages.add(seg.source_page);
      pages.add(seg.matched_page);
    });
    return Array.from(pages).sort((a, b) => a - b);
  };

  return (
    <Card className="border border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
      <CardHeader className="border-b border-border/50 bg-gradient-to-r from-card to-card/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10 backdrop-blur-sm">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold text-foreground">
                سجل المقارنات
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                {gradeLevel && `الصف ${gradeLevel === '12' ? '12' : '10'}`}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadHistory}
            disabled={isLoading}
            className="hover:shadow-sm transition-all duration-200"
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="text-center py-16">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">جارٍ التحميل...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-border/50 rounded-xl bg-muted/20">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm font-medium text-muted-foreground">لا توجد مقارنات سابقة</p>
          </div>
        ) : (
          <div className="border border-border/50 rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 border-b border-border/50">
                  <TableHead className="font-semibold">اسم الملف</TableHead>
                  <TableHead className="text-center font-semibold">المعلم</TableHead>
                  <TableHead className="text-center font-semibold">الحالة</TableHead>
                  <TableHead className="text-center font-semibold">التشابه</TableHead>
                  <TableHead className="text-center font-semibold">التطابقات</TableHead>
                  <TableHead className="text-center font-semibold">التاريخ</TableHead>
                  <TableHead className="text-center font-semibold">عرض</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30 transition-colors duration-200 border-b border-border/30 last:border-0">
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium truncate max-w-[250px]">
                          {item.compared_file_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      <Badge variant="outline" className="text-xs">
                        {item.teacher_name || 'غير معروف'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1.5">
                        {getStatusIcon(item.status)}
                        {getStatusBadge(item.status)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        'text-sm font-bold',
                        item.max_similarity_score >= 0.70 ? 'text-red-600' :
                        item.max_similarity_score >= 0.50 ? 'text-yellow-600' :
                        'text-green-600'
                      )}>
                        {(item.max_similarity_score * 100).toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="text-sm font-semibold">{item.total_matches_found}</span>
                        {item.high_risk_matches > 0 && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            {item.high_risk_matches}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.created_at), {
                        addSuffix: true,
                        locale: ar,
                      })}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleViewDetails(item)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Dialog for viewing comparison details */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto custom-scrollbar" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-xl blur opacity-50" />
                <div className="relative p-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-sm">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              </div>
              تفاصيل المقارنة
            </DialogTitle>
            <DialogDescription className="text-base">
              معلومات مفصلة عن عملية المقارنة
            </DialogDescription>
          </DialogHeader>

          {selectedComparison && (
            <div className="space-y-6 mt-4">
              {/* File info and status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-0 bg-gradient-to-br from-primary/10 to-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-1">اسم الملف</p>
                        <p className="font-semibold text-foreground break-words">
                          {selectedComparison.compared_file_name}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-gradient-to-br from-primary/10 to-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {getStatusIcon(selectedComparison.status)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-1">حالة المقارنة</p>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(selectedComparison.status)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg bg-gradient-to-br from-red-500/10 to-red-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-red-600" />
                    <p className="text-xs text-muted-foreground">أعلى تشابه</p>
                  </div>
                  <p className={cn(
                    "text-2xl font-bold",
                    selectedComparison.max_similarity_score >= 0.70 ? 'text-red-600' :
                    selectedComparison.max_similarity_score >= 0.50 ? 'text-yellow-600' :
                    'text-green-600'
                  )}>
                    {(selectedComparison.max_similarity_score * 100).toFixed(1)}%
                  </p>
                </div>

                <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <p className="text-xs text-muted-foreground">متوسط التشابه</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {(() => {
                      const avgScore = selectedComparison.avg_similarity_score;
                      if (avgScore !== null && avgScore !== undefined) {
                        return (avgScore * 100).toFixed(1);
                      }
                      // حساب المتوسط من التطابقات
                      const matches = selectedComparison.matches || [];
                      if (matches.length === 0) return '0.0';
                      const sum = matches.reduce((acc, match) => acc + (match.similarity_score || 0), 0);
                      return ((sum / matches.length) * 100).toFixed(1);
                    })()}%
                  </p>
                </div>

                <div className="p-4 border rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-purple-600" />
                    <p className="text-xs text-muted-foreground">إجمالي التطابقات</p>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">
                    {selectedComparison.total_matches_found}
                  </p>
                </div>

                <div className="p-4 border rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <p className="text-xs text-muted-foreground">تطابقات مشبوهة</p>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">
                    {selectedComparison.high_risk_matches}
                  </p>
                </div>
              </div>

              {/* Similar files list */}
              {selectedComparison.matches && selectedComparison.matches.length > 0 && (
                <Card className="border-0 bg-card/50">
                  <CardHeader>
                    <CardTitle className="text-base">الملفات المشابهة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedComparison.matches.slice(0, 10).map((match, index) => (
                        <div key={index}>
                          <div
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                            onClick={() => handleMatchClick(match)}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className={cn(
                                "p-2 rounded-lg",
                                match.similarity_score >= 0.70 ? "bg-red-500/10" :
                                match.similarity_score >= 0.50 ? "bg-yellow-500/10" :
                                "bg-green-500/10"
                              )}>
                                <FileText className={cn(
                                  "h-4 w-4",
                                  match.similarity_score >= 0.70 ? "text-red-600" :
                                  match.similarity_score >= 0.50 ? "text-yellow-600" :
                                  "text-green-600"
                                )} />
                              </div>
                              <span className="text-sm font-medium truncate">
                                {match.matched_file_name}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              {match.flagged && (
                                <Badge variant="destructive" className="text-xs">
                                  مشبوه
                                </Badge>
                              )}
                              <span className={cn(
                                "text-sm font-bold",
                                match.similarity_score >= 0.70 ? "text-red-600" :
                                match.similarity_score >= 0.50 ? "text-yellow-600" :
                                "text-green-600"
                              )}>
                                {(match.similarity_score * 100).toFixed(1)}%
                              </span>
                              {selectedMatch?.matched_file_name === match.matched_file_name && isMatchDetailOpen ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>

                          {/* Match Detail Section */}
                          <Collapsible open={selectedMatch?.matched_file_name === match.matched_file_name && isMatchDetailOpen}>
                            <CollapsibleContent>
                              {selectedMatch && selectedMatch.matched_file_name === match.matched_file_name && (
                                <Card className="mt-2 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                                  <CardHeader>
                                    <CardTitle className="flex items-center gap-3 text-lg">
                                      <Target className="h-5 w-5 text-primary" />
                                      تفاصيل التشابه مع: {selectedMatch.matched_file_name}
                                    </CardTitle>
                                  </CardHeader>
                                  
                                  <CardContent className="space-y-6">
                                    {/* إحصائيات سريعة */}
                                    <div className="grid grid-cols-3 gap-4">
                                      <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5">
                                        <div className="flex items-center gap-2 mb-2">
                                          <TrendingUp className="h-4 w-4 text-blue-600" />
                                          <p className="text-xs text-muted-foreground">نسبة التشابه</p>
                                        </div>
                                        <p className="text-2xl font-bold text-blue-600">
                                          {(selectedMatch.similarity_score * 100).toFixed(1)}%
                                        </p>
                                      </div>
                                      <div className="p-4 border rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5">
                                        <div className="flex items-center gap-2 mb-2">
                                          <FileText className="h-4 w-4 text-purple-600" />
                                          <p className="text-xs text-muted-foreground">الجمل المتشابهة</p>
                                        </div>
                                        <p className="text-2xl font-bold text-purple-600">
                                          {selectedMatch.matched_segments?.length || 0}
                                        </p>
                                      </div>
                                      <div className="p-4 border rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-500/5">
                                        <div className="flex items-center gap-2 mb-2">
                                          <BookOpen className="h-4 w-4 text-orange-600" />
                                          <p className="text-xs text-muted-foreground">الصفحات المتأثرة</p>
                                        </div>
                                        <p className="text-2xl font-bold text-orange-600">
                                          {getUniquePages(selectedMatch.matched_segments).length}
                                        </p>
                                      </div>
                                    </div>

                                    {/* جدول الجمل المتشابهة */}
                                    {selectedMatch.matched_segments && selectedMatch.matched_segments.length > 0 && (
                                      <div>
                                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
                                          <Target className="h-4 w-4" />
                                          الجمل المتشابهة
                                        </h4>
                                        
                                        <div className="border rounded-lg overflow-hidden">
                                          <Table>
                                            <TableHeader>
                                              <TableRow className="bg-muted/30">
                                                <TableHead className="font-semibold">النص الأصلي</TableHead>
                                                <TableHead className="font-semibold">النص المطابق</TableHead>
                                                <TableHead className="text-center font-semibold">الصفحة</TableHead>
                                                <TableHead className="text-center font-semibold">التشابه</TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {selectedMatch.matched_segments.map((segment, idx) => (
                                                <TableRow key={idx} className="hover:bg-muted/50">
                                                  <TableCell className="max-w-md">
                                                    <div className="text-sm bg-blue-50 dark:bg-blue-950/30 p-3 rounded border-r-4 border-blue-500">
                                                      {segment.source_text}
                                                      <span className="text-xs text-muted-foreground block mt-1">
                                                        صفحة {segment.source_page}
                                                      </span>
                                                    </div>
                                                  </TableCell>
                                                  <TableCell className="max-w-md">
                                                    <div className="text-sm bg-orange-50 dark:bg-orange-950/30 p-3 rounded border-r-4 border-orange-500">
                                                      {segment.matched_text}
                                                      <span className="text-xs text-muted-foreground block mt-1">
                                                        صفحة {segment.matched_page}
                                                      </span>
                                                    </div>
                                                  </TableCell>
                                                  <TableCell className="text-center">
                                                    <div className="flex items-center gap-1 justify-center">
                                                      <Badge variant="outline" className="text-xs">
                                                        {segment.source_page}
                                                      </Badge>
                                                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                      <Badge variant="outline" className="text-xs">
                                                        {segment.matched_page}
                                                      </Badge>
                                                    </div>
                                                  </TableCell>
                                                  <TableCell className="text-center">
                                                    <Badge 
                                                      variant={segment.similarity > 0.9 ? "destructive" : "secondary"}
                                                      className="font-bold"
                                                    >
                                                      {(segment.similarity * 100).toFixed(0)}%
                                                    </Badge>
                                                  </TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        </div>
                                      </div>
                                    )}

                                    {/* التحليل الأولي بالذكاء الاصطناعي */}
                                    <AIAnalysisSection match={selectedMatch} />
                                  </CardContent>
                                </Card>
                              )}
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Processing time and date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">وقت المعالجة</p>
                    <p className="font-medium">{(selectedComparison.processing_time_ms / 1000).toFixed(2)} ثانية</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">تاريخ المقارنة</p>
                    <p className="font-medium">
                      {format(new Date(selectedComparison.created_at), 'dd/MM/yyyy - HH:mm', { locale: ar })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ComparisonHistory;
