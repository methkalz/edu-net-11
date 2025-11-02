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
import { RefreshCw, FileText, AlertTriangle, AlertCircle, CheckCircle, Eye, Clock, TrendingUp } from 'lucide-react';
import { usePDFComparison, type GradeLevel, type ComparisonResult } from '@/hooks/usePDFComparison';
import { formatDistanceToNow, format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ComparisonHistoryProps {
  gradeLevel?: GradeLevel;
}

const ComparisonHistory = ({ gradeLevel }: ComparisonHistoryProps) => {
  const { getComparisonHistory } = usePDFComparison();
  const [history, setHistory] = useState<ComparisonResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedComparison, setSelectedComparison] = useState<ComparisonResult | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
  };

  return (
    <Card className="border-0 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              سجل المقارنات
            </CardTitle>
            <CardDescription>
              عرض جميع عمليات المقارنة السابقة
              {gradeLevel && ` للصف ${gradeLevel === '12' ? 'الثاني عشر' : 'العاشر'}`}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadHistory}
            disabled={isLoading}
          >
            <RefreshCw className={cn('h-4 w-4 ml-2', isLoading && 'animate-spin')} />
            تحديث
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">جارٍ تحميل السجل...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">لا توجد مقارنات سابقة</p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم الملف</TableHead>
                  <TableHead className="text-center">الحالة</TableHead>
                  <TableHead className="text-center">أعلى تشابه</TableHead>
                  <TableHead className="text-center">عدد التطابقات</TableHead>
                  <TableHead className="text-center">التاريخ</TableHead>
                  <TableHead className="text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium truncate max-w-[300px]">
                          {item.compared_file_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        {getStatusIcon(item.status)}
                        {getStatusBadge(item.status)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        'font-bold',
                        item.max_similarity_score >= 70 ? 'text-red-600' :
                        item.max_similarity_score >= 50 ? 'text-yellow-600' :
                        'text-green-600'
                      )}>
                        {item.max_similarity_score.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div>
                        <span className="font-medium">{item.total_matches_found}</span>
                        {item.high_risk_matches > 0 && (
                          <Badge variant="destructive" className="mr-2 text-xs">
                            {item.high_risk_matches} مشبوه
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(item.created_at), {
                        addSuffix: true,
                        locale: ar,
                      })}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="hover:bg-primary hover:text-primary-foreground transition-all"
                        onClick={() => handleViewDetails(item)}
                      >
                        <Eye className="h-4 w-4 ml-1" />
                        عرض
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              تفاصيل المقارنة
            </DialogTitle>
            <DialogDescription>
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
                    selectedComparison.max_similarity_score >= 70 ? 'text-red-600' :
                    selectedComparison.max_similarity_score >= 50 ? 'text-yellow-600' :
                    'text-green-600'
                  )}>
                    {selectedComparison.max_similarity_score.toFixed(1)}%
                  </p>
                </div>

                <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <p className="text-xs text-muted-foreground">متوسط التشابه</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedComparison.avg_similarity_score.toFixed(1)}%
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
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className={cn(
                              "p-2 rounded-lg",
                              match.similarity_score >= 70 ? "bg-red-500/10" :
                              match.similarity_score >= 50 ? "bg-yellow-500/10" :
                              "bg-green-500/10"
                            )}>
                              <FileText className={cn(
                                "h-4 w-4",
                                match.similarity_score >= 70 ? "text-red-600" :
                                match.similarity_score >= 50 ? "text-yellow-600" :
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
                              match.similarity_score >= 70 ? "text-red-600" :
                              match.similarity_score >= 50 ? "text-yellow-600" :
                              "text-green-600"
                            )}>
                              {match.similarity_score.toFixed(1)}%
                            </span>
                          </div>
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
                      {format(new Date(selectedComparison.created_at), 'dd/MM/yyyy - hh:mm a', { locale: ar })}
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
