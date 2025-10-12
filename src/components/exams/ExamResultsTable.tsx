import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useExamResults } from '@/hooks/useExamResults';
import { ExamResultsFilters } from './ExamResultsFilters';

interface ExamResultsTableProps {
  exams: Array<{ id: string; title: string }>;
}

export const ExamResultsTable: React.FC<ExamResultsTableProps> = ({ exams }) => {
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [sortField, setSortField] = useState<string>('percentage');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 10;
  
  const { data, isLoading } = useExamResults(selectedExam || null);
  
  
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const sortedResults = useMemo(() => {
    if (!data?.results) return [];
    
    const sorted = [...data.results].sort((a, b) => {
      const aValue = a[sortField as keyof typeof a];
      const bValue = b[sortField as keyof typeof b];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue, 'ar')
          : bValue.localeCompare(aValue, 'ar');
      }
      
      return 0;
    });
    
    return sorted;
  }, [data?.results, sortField, sortDirection]);
  
  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * resultsPerPage;
    return sortedResults.slice(startIndex, startIndex + resultsPerPage);
  }, [sortedResults, currentPage]);
  
  const totalPages = Math.ceil(sortedResults.length / resultsPerPage);
  
  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-primary" />
      : <ArrowDown className="h-4 w-4 text-primary" />;
  };
  
  return (
    <div className="space-y-4">
      <ExamResultsFilters
        type="exam"
        selectedExam={selectedExam}
        onExamChange={setSelectedExam}
        onReset={() => {
          setSelectedExam('');
          setCurrentPage(1);
        }}
        exams={exams}
      />
      
      {!selectedExam ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Eye className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              اختر امتحاناً لعرض نتائجه
            </p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">جاري تحميل النتائج...</p>
        </div>
      ) : !data || data.results.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg font-medium text-muted-foreground">
              لا توجد نتائج لهذا الامتحان
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">عدد المحاولات</p>
                <p className="text-2xl font-bold" dir="ltr">{data.stats.total_attempts}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">المتوسط العام</p>
                <p className="text-2xl font-bold text-emerald-500" dir="ltr">
                  {data.stats.avg_percentage}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">معدل النجاح</p>
                <p className="text-2xl font-bold text-blue-500" dir="ltr">
                  {data.stats.pass_rate}%
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-right">
                        <Button variant="ghost" onClick={() => handleSort('student_name')} className="gap-2 font-semibold">
                          اسم الطالب
                          {getSortIcon('student_name')}
                        </Button>
                      </TableHead>
                      <TableHead className="text-center" dir="ltr">
                        <Button variant="ghost" onClick={() => handleSort('attempt_number')} className="gap-2 font-semibold">
                          رقم المحاولة
                          {getSortIcon('attempt_number')}
                        </Button>
                      </TableHead>
                      <TableHead className="text-center" dir="ltr">
                        <Button variant="ghost" onClick={() => handleSort('score')} className="gap-2 font-semibold">
                          الدرجة
                          {getSortIcon('score')}
                        </Button>
                      </TableHead>
                      <TableHead className="text-center" dir="ltr">
                        <Button variant="ghost" onClick={() => handleSort('percentage')} className="gap-2 font-semibold">
                          النسبة
                          {getSortIcon('percentage')}
                        </Button>
                      </TableHead>
                      <TableHead className="text-center">الحالة</TableHead>
                      <TableHead className="text-center" dir="ltr">
                        <Button variant="ghost" onClick={() => handleSort('time_spent_minutes')} className="gap-2 font-semibold">
                          الوقت
                          {getSortIcon('time_spent_minutes')}
                        </Button>
                      </TableHead>
                      <TableHead className="text-center">التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedResults.map((result) => (
                      <TableRow key={result.id} className="hover:bg-accent/5">
                        <TableCell className="font-medium">{result.student_name}</TableCell>
                        <TableCell className="text-center" dir="ltr">
                          <Badge variant="outline">{result.attempt_number}</Badge>
                        </TableCell>
                        <TableCell className="text-center" dir="ltr">
                          <span className="font-mono">
                            {result.score} / {result.total_points}
                          </span>
                        </TableCell>
                        <TableCell className="text-center" dir="ltr">
                          <span className="font-mono font-bold text-lg">
                            {result.percentage.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={result.passed ? "default" : "destructive"}>
                            {result.passed ? "ناجح ✓" : "راسب ✗"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center" dir="ltr">
                          <span className="text-sm font-medium">
                            {result.time_spent_minutes > 0 ? (
                              `${result.time_spent_minutes} دقيقة`
                            ) : (
                              <span className="text-muted-foreground/50">-</span>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-center" dir="ltr">
                          <span className="text-sm">
                            {format(new Date(result.submitted_at), 'dd/MM/yyyy', { locale: ar })}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    عرض {((currentPage - 1) * resultsPerPage) + 1} - {Math.min(currentPage * resultsPerPage, sortedResults.length)} من {sortedResults.length}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                      السابق
                    </Button>
                    <span className="px-3 py-1 text-sm" dir="ltr">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      التالي
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
