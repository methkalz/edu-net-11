import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTeacherExams } from '@/hooks/useTeacherExams';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ModernHeader from '@/components/shared/ModernHeader';
import AppFooter from '@/components/shared/AppFooter';
import { 
  ArrowLeft, 
  FileText, 
  Users, 
  TrendingUp, 
  Eye, 
  Edit, 
  Clock, 
  Calendar, 
  Award,
  Search,
  CheckCircle2,
  XCircle,
  CalendarClock,
  FileQuestion,
  Target,
  TrendingDown,
  Star,
  AlertCircle,
  Filter,
  BookOpen
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { ExamResultsTable } from '@/components/exams/ExamResultsTable';
import { StudentPerformanceTable } from '@/components/exams/StudentPerformanceTable';
import { StudentComparisonView } from '@/components/exams/StudentComparisonView';
import { logger } from '@/lib/logging';

const GradeExamsAnalytics: React.FC = () => {
  const { grade } = useParams<{ grade: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useTeacherExams(user?.id);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const gradeLevel = grade || '11';
  const gradeLabel = gradeLevel === '10' ? 'العاشر' : gradeLevel === '11' ? 'الحادي عشر' : 'الثاني عشر';

  // فلترة الامتحانات حسب الصف
  const filteredExams = useMemo(() => {
    if (!data?.exams) return [];
    
    let exams = data.exams.filter(exam => 
      exam.grade_levels.includes(gradeLevel) || 
      exam.grade_levels.includes(`الصف ${gradeLabel}`)
    );

    // تطبيق البحث
    if (searchQuery) {
      exams = exams.filter(exam => 
        exam.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // تطبيق فلتر الحالة
    if (statusFilter !== 'all') {
      exams = exams.filter(exam => exam.status === statusFilter);
    }

    return exams;
  }, [data?.exams, gradeLevel, gradeLabel, searchQuery, statusFilter]);

  // حساب الإحصائيات الموسعة
  const stats = useMemo(() => {
    const totalExams = filteredExams.length;
    const activeExams = filteredExams.filter(e => e.status === 'active').length;
    const scheduledExams = filteredExams.filter(e => e.status === 'scheduled').length;
    const completedExams = filteredExams.filter(e => e.status === 'completed').length;
    const draftExams = filteredExams.filter(e => e.status === 'draft').length;
    
    const totalAttempts = filteredExams.reduce((sum, e) => sum + e.attempts_count, 0);
    const totalQuestions = filteredExams.reduce((sum, e) => sum + e.total_questions, 0);
    const totalPoints = filteredExams.reduce((sum, e) => sum + e.total_points, 0);
    
    const examsWithScores = filteredExams.filter(e => e.avg_percentage !== null && e.attempts_count > 0);
    const avgScore = examsWithScores.length > 0
      ? examsWithScores.reduce((sum, e) => sum + (e.avg_percentage || 0), 0) / examsWithScores.length
      : 0;
    
    const highestScore = examsWithScores.length > 0
      ? Math.max(...examsWithScores.map(e => e.avg_percentage || 0))
      : 0;
    
    const lowestScore = examsWithScores.length > 0
      ? Math.min(...examsWithScores.map(e => e.avg_percentage || 0))
      : 0;

    // حساب معدل النجاح (افتراضياً 50% هو حد النجاح)
    const passRate = examsWithScores.length > 0
      ? (examsWithScores.filter(e => (e.avg_percentage || 0) >= 50).length / examsWithScores.length) * 100
      : 0;

    return { 
      totalExams,
      activeExams, 
      scheduledExams,
      completedExams,
      draftExams,
      totalAttempts, 
      totalQuestions,
      totalPoints,
      avgScore,
      highestScore,
      lowestScore,
      passRate,
      examsWithScores: examsWithScores.length
    };
  }, [filteredExams]);

  // بيانات الرسم البياني للأداء
  const performanceChartData = useMemo(() => {
    return filteredExams
      .filter(e => e.avg_percentage !== null && e.attempts_count > 0)
      .slice(0, 8)
      .map(exam => ({
        name: exam.title.length > 15 ? exam.title.substring(0, 15) + '...' : exam.title,
        'متوسط النتيجة': Number((exam.avg_percentage || 0).toFixed(1)),
        'عدد المحاولات': exam.attempts_count
      }));
  }, [filteredExams]);

  // بيانات الرسم البياني لتوزيع الحالات
  const statusChartData = useMemo(() => {
    return [
      { name: 'نشط', value: stats.activeExams, color: '#10b981' },
      { name: 'مجدول', value: stats.scheduledExams, color: '#f59e0b' },
      { name: 'منتهي', value: stats.completedExams, color: '#6b7280' },
      { name: 'مسودة', value: stats.draftExams, color: '#8b5cf6' }
    ].filter(item => item.value > 0);
  }, [stats]);

  // أفضل 3 امتحانات
  const topPerformers = useMemo(() => {
    return filteredExams
      .filter(e => e.avg_percentage !== null && e.attempts_count > 0)
      .sort((a, b) => (b.avg_percentage || 0) - (a.avg_percentage || 0))
      .slice(0, 3);
  }, [filteredExams]);

  // أسوأ 3 امتحانات
  const bottomPerformers = useMemo(() => {
    return filteredExams
      .filter(e => e.avg_percentage !== null && e.attempts_count > 0)
      .sort((a, b) => (a.avg_percentage || 0) - (b.avg_percentage || 0))
      .slice(0, 3);
  }, [filteredExams]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string, label: string, icon: React.ReactNode }> = {
      active: { 
        className: 'bg-green-500/10 text-green-700 border-green-500/20', 
        label: 'نشط',
        icon: <CheckCircle2 className="h-3 w-3" />
      },
      scheduled: { 
        className: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20', 
        label: 'مجدول',
        icon: <CalendarClock className="h-3 w-3" />
      },
      draft: { 
        className: 'bg-purple-500/10 text-purple-700 border-purple-500/20', 
        label: 'مسودة',
        icon: <FileText className="h-3 w-3" />
      },
      completed: { 
        className: 'bg-gray-500/10 text-gray-700 border-gray-500/20', 
        label: 'منتهي',
        icon: <XCircle className="h-3 w-3" />
      }
    };
    
    const config = variants[status] || variants.draft;
    return (
      <Badge variant="outline" className={`gap-1 ${config.className}`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd MMM yyyy - HH:mm', { locale: ar });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        <ModernHeader 
          title={`إحصائيات امتحانات الصف ${gradeLabel}`}
          showBackButton={true}
          backPath="/dashboard"
        />
        <main className="container mx-auto px-6 py-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <Card key={i} className="relative overflow-hidden border-0 bg-card/50 backdrop-blur-sm animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-20 bg-muted/20 rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <ModernHeader 
        title={`إحصائيات امتحانات الصف ${gradeLabel}`}
        showBackButton={true}
        backPath="/dashboard"
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />
      
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
          {/* العنوان */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-center bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
              إحصائيات امتحانات الصف {gradeLabel}
            </h1>
            <p className="text-muted-foreground text-sm text-center">نظرة شاملة لجميع الامتحانات والنتائج والإحصائيات</p>
          </div>

          {/* بطاقات الإحصائيات - 8 بطاقات */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* إجمالي الامتحانات */}
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-50" />
              <CardContent className="p-4 relative">
                <div className="flex flex-col items-center justify-center text-center space-y-2 mx-auto">
                  <div className="p-2 rounded-lg bg-blue-500/10 backdrop-blur-sm mx-auto">
                    <FileText className="h-5 w-5 text-blue-500 mx-auto" />
                  </div>
                  <div className="space-y-1 text-center w-full">
                    <p className="text-xs text-muted-foreground font-medium text-center">إجمالي الامتحانات</p>
                    <p className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-blue-400 bg-clip-text text-transparent text-center mx-auto" dir="ltr">
                      {stats.totalExams}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* الامتحانات النشطة */}
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-50" />
              <CardContent className="p-4 relative">
                <div className="flex flex-col items-center justify-center text-center space-y-2 mx-auto">
                  <div className="p-2 rounded-lg bg-green-500/10 backdrop-blur-sm mx-auto">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                  </div>
                  <div className="space-y-1 text-center w-full">
                    <p className="text-xs text-muted-foreground font-medium text-center">الامتحانات النشطة</p>
                    <p className="text-2xl font-bold bg-gradient-to-br from-green-500 to-green-400 bg-clip-text text-transparent text-center mx-auto" dir="ltr">
                      {stats.activeExams}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* الامتحانات المجدولة */}
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-yellow-500/10 via-yellow-500/5 to-transparent backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-50" />
              <CardContent className="p-4 relative">
                <div className="flex flex-col items-center justify-center text-center space-y-2 mx-auto">
                  <div className="p-2 rounded-lg bg-yellow-500/10 backdrop-blur-sm mx-auto">
                    <CalendarClock className="h-5 w-5 text-yellow-500 mx-auto" />
                  </div>
                  <div className="space-y-1 text-center w-full">
                    <p className="text-xs text-muted-foreground font-medium text-center">الامتحانات المجدولة</p>
                    <p className="text-2xl font-bold bg-gradient-to-br from-yellow-500 to-yellow-400 bg-clip-text text-transparent text-center mx-auto" dir="ltr">
                      {stats.scheduledExams}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* الامتحانات المنتهية */}
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-gray-500/10 via-gray-500/5 to-transparent backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-transparent opacity-50" />
              <CardContent className="p-4 relative">
                <div className="flex flex-col items-center justify-center text-center space-y-2 mx-auto">
                  <div className="p-2 rounded-lg bg-gray-500/10 backdrop-blur-sm mx-auto">
                    <XCircle className="h-5 w-5 text-gray-500 mx-auto" />
                  </div>
                  <div className="space-y-1 text-center w-full">
                    <p className="text-xs text-muted-foreground font-medium text-center">الامتحانات المنتهية</p>
                    <p className="text-2xl font-bold bg-gradient-to-br from-gray-500 to-gray-400 bg-clip-text text-transparent text-center mx-auto" dir="ltr">
                      {stats.completedExams}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* إجمالي المحاولات */}
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-50" />
              <CardContent className="p-4 relative">
                <div className="flex flex-col items-center justify-center text-center space-y-2 mx-auto">
                  <div className="p-2 rounded-lg bg-purple-500/10 backdrop-blur-sm mx-auto">
                    <Users className="h-5 w-5 text-purple-500 mx-auto" />
                  </div>
                  <div className="space-y-1 text-center w-full">
                    <p className="text-xs text-muted-foreground font-medium text-center">إجمالي المحاولات</p>
                    <p className="text-2xl font-bold bg-gradient-to-br from-purple-500 to-purple-400 bg-clip-text text-transparent text-center mx-auto" dir="ltr">
                      {stats.totalAttempts}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* متوسط النتائج */}
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-50" />
              <CardContent className="p-4 relative">
                <div className="flex flex-col items-center justify-center text-center space-y-2 mx-auto">
                  <div className="p-2 rounded-lg bg-emerald-500/10 backdrop-blur-sm mx-auto">
                    <TrendingUp className="h-5 w-5 text-emerald-500 mx-auto" />
                  </div>
                  <div className="space-y-1 text-center w-full">
                    <p className="text-xs text-muted-foreground font-medium text-center">متوسط النتائج</p>
                    <p className="text-2xl font-bold bg-gradient-to-br from-emerald-500 to-emerald-400 bg-clip-text text-transparent text-center mx-auto" dir="ltr">
                      {stats.avgScore > 0 ? `${stats.avgScore.toFixed(1)}%` : '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* أعلى نتيجة */}
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-50" />
              <CardContent className="p-4 relative">
                <div className="flex flex-col items-center justify-center text-center space-y-2 mx-auto">
                  <div className="p-2 rounded-lg bg-amber-500/10 backdrop-blur-sm mx-auto">
                    <Star className="h-5 w-5 text-amber-500 mx-auto" />
                  </div>
                  <div className="space-y-1 text-center w-full">
                    <p className="text-xs text-muted-foreground font-medium text-center">أعلى متوسط نتائج</p>
                    <p className="text-2xl font-bold bg-gradient-to-br from-amber-500 to-amber-400 bg-clip-text text-transparent text-center mx-auto" dir="ltr">
                      {stats.highestScore > 0 ? `${stats.highestScore.toFixed(1)}%` : '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* أدنى نتيجة */}
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-red-400/10 via-red-400/5 to-transparent backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-red-400/5 to-transparent opacity-50" />
              <CardContent className="p-4 relative">
                <div className="flex flex-col items-center justify-center text-center space-y-2 mx-auto">
                  <div className="p-2 rounded-lg bg-red-400/10 backdrop-blur-sm mx-auto">
                    <TrendingDown className="h-5 w-5 text-red-400 mx-auto" />
                  </div>
                  <div className="space-y-1 text-center w-full">
                    <p className="text-xs text-muted-foreground font-medium text-center">أدنى نتيجة</p>
                    <p className="text-2xl font-bold bg-gradient-to-br from-red-400 to-red-300 bg-clip-text text-transparent text-center mx-auto" dir="ltr">
                      {stats.lowestScore > 0 ? `${stats.lowestScore.toFixed(1)}%` : '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* المخططات البيانية */}
          {(performanceChartData.length > 0 || statusChartData.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* مخطط أداء الامتحانات */}
              {performanceChartData.length > 0 && (
                <Card className="border-0 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      أداء الامتحانات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={performanceChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }}
                          angle={-45}
                          textAnchor="end"
                          height={120}
                          interval={0}
                          dx={-5}
                          dy={10}
                        />
                        <YAxis tick={{ fill: 'hsl(var(--foreground))' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            color: 'hsl(var(--foreground))'
                          }}
                        />
                        <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
                        <Bar dataKey="متوسط النتيجة" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* مخطط توزيع الحالات */}
              {statusChartData.length > 0 && (
                <Card className="border-0 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      توزيع حالة الامتحانات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statusChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            color: 'hsl(var(--foreground))'
                          }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          formatter={(value, entry: any) => (
                            <span style={{ color: entry.payload?.color || entry.color, fontWeight: '600' }}>
                              {value}
                            </span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* البحث والفلترة */}
          <Card className="border-0 bg-card/50 backdrop-blur-sm p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input 
                  placeholder="ابحث عن امتحان..." 
                  className="pr-12 h-12 rounded-xl bg-background/50 border-border/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                  className="rounded-xl"
                >
                  الكل
                </Button>
                <Button
                  variant={statusFilter === 'active' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('active')}
                  className="rounded-xl"
                >
                  نشط
                </Button>
                <Button
                  variant={statusFilter === 'scheduled' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('scheduled')}
                  className="rounded-xl"
                >
                  مجدول
                </Button>
                <Button
                  variant={statusFilter === 'completed' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('completed')}
                  className="rounded-xl"
                >
                  منتهي
                </Button>
              </div>
            </div>
          </Card>

          {/* أفضل وأسوأ أداء */}
          {(topPerformers.length > 0 || bottomPerformers.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* أفضل 3 امتحانات */}
              {topPerformers.length > 0 && (
                <Card className="border-0 bg-gradient-to-br from-green-500/5 to-transparent backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-green-500" />
                      أفضل أداء (أعلى نتائج)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {topPerformers.map((exam, index) => (
                      <div key={exam.id} className="flex items-center gap-3 p-3 rounded-lg bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-all">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{exam.title}</p>
                          <p className="text-xs text-muted-foreground" dir="ltr">
                            {exam.attempts_count} محاولة
                          </p>
                        </div>
                        <div className="text-lg font-bold text-green-600" dir="ltr">
                          {exam.avg_percentage?.toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* أسوأ 3 امتحانات */}
              {bottomPerformers.length > 0 && (
                <Card className="border-0 bg-gradient-to-br from-red-500/5 to-transparent backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      يحتاج تحسين (أقل نتائج)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {bottomPerformers.map((exam, index) => (
                      <div key={exam.id} className="flex items-center gap-3 p-3 rounded-lg bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-all">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{exam.title}</p>
                          <p className="text-xs text-muted-foreground" dir="ltr">
                            {exam.attempts_count} محاولة
                          </p>
                        </div>
                        <div className="text-lg font-bold text-red-500" dir="ltr">
                          {exam.avg_percentage?.toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* جميع الامتحانات - Grid Layout */}
          <Card className="border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                جميع الامتحانات ({filteredExams.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredExams.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <FileText className="h-20 w-20 mx-auto mb-4 opacity-20" />
                  <p className="text-xl font-medium mb-2">لا توجد امتحانات</p>
                  <p className="text-sm">
                    {searchQuery || statusFilter !== 'all' 
                      ? 'لم يتم العثور على امتحانات تطابق البحث أو الفلتر'
                      : 'لم يتم إنشاء أي امتحانات لهذا الصف بعد'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredExams.map((exam) => (
                    <Card 
                      key={exam.id} 
                      className="relative overflow-hidden border-0 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group"
                    >
                      {/* Status indicator bar */}
                      <div className={`absolute top-0 left-0 right-0 h-1 ${
                        exam.status === 'active' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                        exam.status === 'scheduled' ? 'bg-gradient-to-r from-yellow-500 to-amber-500' :
                        exam.status === 'completed' ? 'bg-gradient-to-r from-gray-500 to-slate-500' :
                        'bg-gradient-to-r from-purple-500 to-violet-500'
                      }`} />
                      
                      <CardContent className="p-5 space-y-4">
                        {/* Header */}
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-base line-clamp-2 flex-1">{exam.title}</h3>
                            {getStatusBadge(exam.status)}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-xs gap-1">
                              <Target className="h-3 w-3" />
                              {exam.grade_levels[0]}
                            </Badge>
                          </div>
                        </div>

                        {/* Mini Stats Grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1 p-2 rounded-lg bg-background/50">
                            <p className="text-xs text-muted-foreground">الأسئلة</p>
                            <p className="text-sm font-bold" dir="ltr">{exam.total_questions}</p>
                          </div>
                          <div className="space-y-1 p-2 rounded-lg bg-background/50">
                            <p className="text-xs text-muted-foreground">النقاط</p>
                            <p className="text-sm font-bold" dir="ltr">{exam.total_points}</p>
                          </div>
                          <div className="space-y-1 p-2 rounded-lg bg-background/50">
                            <p className="text-xs text-muted-foreground">المحاولات</p>
                            <p className="text-sm font-bold" dir="ltr">{exam.attempts_count}</p>
                          </div>
                          <div className="space-y-1 p-2 rounded-lg bg-background/50">
                            <p className="text-xs text-muted-foreground">المتوسط</p>
                            <p className="text-sm font-bold" dir="ltr">
                              {exam.avg_percentage !== null ? `${exam.avg_percentage.toFixed(1)}%` : '-'}
                            </p>
                          </div>
                        </div>

                        {/* Dates */}
                        <div className="space-y-2 pt-2 border-t border-border/50">
                          <div className="flex items-center gap-2 text-xs">
                            <Calendar className="h-3 w-3 text-green-600 flex-shrink-0" />
                            <span className="text-muted-foreground">بداية:</span>
                            <span className="font-mono truncate" dir="ltr">
                              {formatDateTime(exam.start_datetime)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Clock className="h-3 w-3 text-red-600 flex-shrink-0" />
                            <span className="text-muted-foreground">نهاية:</span>
                            <span className="font-mono truncate" dir="ltr">
                              {formatDateTime(exam.end_datetime)}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              setSelectedExam(exam);
                              setIsDialogOpen(true);
                            }}
                            className="flex-1 rounded-lg gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            النتائج
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/exam/${exam.id}/edit`)}
                            className="flex-1 rounded-lg gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            تعديل
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* قسم تفاصيل النتائج الفردية */}
          <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                تفاصيل نتائج الامتحانات الفردية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="single-exam" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="single-exam">نتائج امتحان واحد</TabsTrigger>
                  <TabsTrigger value="single-student">نتائج طالب واحد</TabsTrigger>
                  <TabsTrigger value="comparison">مقارنة طلاب</TabsTrigger>
                </TabsList>
                
                <TabsContent value="single-exam" className="mt-6">
                  <ExamResultsTable 
                    exams={filteredExams.map(e => ({ id: e.id, title: e.title }))}
                  />
                </TabsContent>
                
                <TabsContent value="single-student" className="mt-6">
                  <StudentPerformanceTable 
                    students={[]}
                    gradeLevel={gradeLevel || ''}
                  />
                </TabsContent>
                
                <TabsContent value="comparison" className="mt-6">
                  <StudentComparisonView />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <AppFooter />

      {/* Dialog للإحصائيات الأساسية */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
              إحصائيات ونتائج الامتحان
            </DialogTitle>
          </DialogHeader>
          
          {selectedExam && (
            <div className="space-y-6 pt-4">
              {/* عنوان الامتحان */}
              <div className="text-center space-y-2 pb-4 border-b">
                <h3 className="text-xl font-bold">{selectedExam.title}</h3>
                <div className="flex items-center justify-center gap-3">
                  {getStatusBadge(selectedExam.status)}
                  <Badge variant="outline" className="gap-1">
                    <Target className="h-3 w-3" />
                    {selectedExam.grade_levels[0]}
                  </Badge>
                </div>
              </div>

              {/* الإحصائيات الأساسية - 4 بطاقات */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-0 bg-gradient-to-br from-blue-500/10 to-transparent backdrop-blur-sm hover:shadow-lg transition-all">
                  <CardContent className="p-6 text-center space-y-2">
                    <div className="p-3 rounded-full bg-blue-500/10 w-fit mx-auto">
                      <FileQuestion className="h-6 w-6 text-blue-500 mx-auto" />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">عدد الأسئلة</p>
                    <p className="text-3xl font-bold text-center" dir="ltr">{selectedExam.total_questions}</p>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-gradient-to-br from-purple-500/10 to-transparent backdrop-blur-sm hover:shadow-lg transition-all">
                  <CardContent className="p-6 text-center space-y-2">
                    <div className="p-3 rounded-full bg-purple-500/10 w-fit mx-auto">
                      <Target className="h-6 w-6 text-purple-500 mx-auto" />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">إجمالي النقاط</p>
                    <p className="text-3xl font-bold text-center" dir="ltr">{selectedExam.total_points}</p>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-gradient-to-br from-indigo-500/10 to-transparent backdrop-blur-sm hover:shadow-lg transition-all">
                  <CardContent className="p-6 text-center space-y-2">
                    <div className="p-3 rounded-full bg-indigo-500/10 w-fit mx-auto">
                      <Users className="h-6 w-6 text-indigo-500 mx-auto" />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">عدد المحاولات</p>
                    <p className="text-3xl font-bold text-center" dir="ltr">{selectedExam.attempts_count}</p>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-gradient-to-br from-emerald-500/10 to-transparent backdrop-blur-sm hover:shadow-lg transition-all">
                  <CardContent className="p-6 text-center space-y-2">
                    <div className="p-3 rounded-full bg-emerald-500/10 w-fit mx-auto">
                      <Award className="h-6 w-6 text-emerald-500 mx-auto" />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">متوسط النتائج</p>
                    <p className="text-3xl font-bold text-center text-emerald-600" dir="ltr">
                      {selectedExam.avg_percentage !== null ? `${selectedExam.avg_percentage.toFixed(1)}%` : '-'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* التواريخ والإعدادات */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border-0 bg-gradient-to-br from-green-500/5 to-transparent backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-center gap-2">
                      <Calendar className="h-4 w-4 text-green-600" />
                      التواريخ والأوقات
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-center p-3 rounded-lg bg-background/50">
                      <p className="text-xs text-muted-foreground mb-1">تاريخ البداية</p>
                      <p className="text-sm font-mono font-semibold" dir="ltr">{formatDateTime(selectedExam.start_datetime)}</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-background/50">
                      <p className="text-xs text-muted-foreground mb-1">تاريخ النهاية</p>
                      <p className="text-sm font-mono font-semibold" dir="ltr">{formatDateTime(selectedExam.end_datetime)}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-gradient-to-br from-amber-500/5 to-transparent backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-center gap-2">
                      <Clock className="h-4 w-4 text-amber-600" />
                      إعدادات الامتحان
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-center p-3 rounded-lg bg-background/50">
                      <p className="text-xs text-muted-foreground mb-1">مدة الامتحان</p>
                      <p className="text-lg font-bold" dir="ltr">{selectedExam.duration_minutes} دقيقة</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-background/50">
                      <p className="text-xs text-muted-foreground mb-1">نسبة النجاح</p>
                      <p className="text-lg font-bold" dir="ltr">{selectedExam.passing_percentage}%</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  size="lg"
                  onClick={() => {
                    navigate(`/exam/${selectedExam.id}/results`);
                    setIsDialogOpen(false);
                  }}
                  className="flex-1 gap-2 h-12 text-base"
                >
                  <Eye className="h-5 w-5" />
                  عرض النتائج التفصيلية
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    navigate(`/exam/${selectedExam.id}/edit`);
                    setIsDialogOpen(false);
                  }}
                  className="flex-1 gap-2 h-12 text-base"
                >
                  <Edit className="h-5 w-5" />
                  تعديل الامتحان
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GradeExamsAnalytics;