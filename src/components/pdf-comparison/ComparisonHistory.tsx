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
import { RefreshCw, FileText, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { usePDFComparison, type GradeLevel, type ComparisonResult } from '@/hooks/usePDFComparison';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ComparisonHistoryProps {
  gradeLevel?: GradeLevel;
}

const ComparisonHistory = ({ gradeLevel }: ComparisonHistoryProps) => {
  const { getComparisonHistory } = usePDFComparison();
  const [history, setHistory] = useState<ComparisonResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
                      <Button variant="outline" size="sm" className="hover:bg-primary hover:text-primary-foreground transition-all">
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
    </Card>
  );
};

export default ComparisonHistory;
