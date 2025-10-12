import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Minus, LineChart as LineChartIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useStudentResults } from '@/hooks/useExamResults';
import { ExamResultsFilters } from './ExamResultsFilters';

interface StudentPerformanceTableProps {
  students: Array<{ id: string; user_id: string; name: string }>;
  gradeLevel: string;
}

export const StudentPerformanceTable: React.FC<StudentPerformanceTableProps> = ({ 
  students, 
  gradeLevel 
}) => {
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  
  const { data, isLoading } = useStudentResults(selectedStudent || null, gradeLevel);
  
  const chartData = data?.results.map((result, index) => ({
    name: `${index + 1}. ${result.exam_title.substring(0, 10)}...`,
    'النسبة المئوية': result.percentage,
  })) || [];
  
  const getImprovementBadge = (improvement: number | null) => {
    if (improvement === null) return null;
    
    if (improvement > 0) {
      return (
        <Badge variant="default" className="gap-1 bg-emerald-500">
          <TrendingUp className="h-3 w-3" />
          <span dir="ltr">+{improvement}%</span>
        </Badge>
      );
    } else if (improvement < 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <TrendingDown className="h-3 w-3" />
          <span dir="ltr">{improvement}%</span>
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="gap-1">
          <Minus className="h-3 w-3" />
          <span>بدون تغيير</span>
        </Badge>
      );
    }
  };
  
  return (
    <div className="space-y-4">
      <ExamResultsFilters
        type="student"
        selectedStudent={selectedStudent}
        onStudentChange={setSelectedStudent}
        onReset={() => setSelectedStudent('')}
        students={students.map(s => ({ id: s.user_id, name: s.name }))}
      />
      
      {!selectedStudent ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <LineChartIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              اختر طالباً لعرض أدائه
            </p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      ) : !data || data.results.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg font-medium text-muted-foreground">
              لا توجد نتائج لهذا الطالب
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">عدد الامتحانات</p>
                <p className="text-2xl font-bold" dir="ltr">{data.stats.total_exams}</p>
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
                <p className="text-sm text-muted-foreground mb-1">إجمالي التحسن</p>
                <p className={`text-2xl font-bold ${
                  data.stats.total_improvement > 0 ? 'text-emerald-500' :
                  data.stats.total_improvement < 0 ? 'text-red-500' :
                  'text-gray-500'
                }`} dir="ltr">
                  {data.stats.total_improvement > 0 ? '+' : ''}{data.stats.total_improvement}%
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">منحنى الأداء</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tick={{ fill: 'hsl(var(--foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="النسبة المئوية" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ r: 6, fill: '#10b981' }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          {/* Results Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">تفاصيل النتائج</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-right">اسم الامتحان</TableHead>
                      <TableHead className="text-center" dir="ltr">الدرجة</TableHead>
                      <TableHead className="text-center" dir="ltr">النسبة</TableHead>
                      <TableHead className="text-center">التحسن</TableHead>
                      <TableHead className="text-center">الحالة</TableHead>
                      <TableHead className="text-center">التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.results.map((result) => (
                      <TableRow key={result.id} className="hover:bg-accent/5">
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {result.exam_title}
                        </TableCell>
                        <TableCell className="text-center" dir="ltr">
                          <span className="font-mono text-sm">
                            {result.score} / {result.total_points}
                          </span>
                        </TableCell>
                        <TableCell className="text-center" dir="ltr">
                          <span className="font-mono font-bold text-lg">
                            {result.percentage.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {getImprovementBadge(result.improvement)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={result.passed ? "default" : "destructive"}>
                            {result.passed ? "ناجح" : "راسب"}
                          </Badge>
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
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
