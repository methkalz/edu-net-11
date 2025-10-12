import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTeacherExams } from '@/hooks/useTeacherExams';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/ui/StatsCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppHeader from '@/components/shared/AppHeader';
import AppFooter from '@/components/shared/AppFooter';
import { 
  FileText, 
  Users, 
  TrendingUp, 
  Calendar,
  Clock,
  Target,
  Eye,
  Edit,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const GradeExamsAnalytics: React.FC = () => {
  const { grade } = useParams<{ grade: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading } = useTeacherExams(user?.id);

  const gradeLevel = grade || '11';
  const gradeLabel = gradeLevel === '10' ? 'العاشر' : gradeLevel === '11' ? 'الحادي عشر' : 'الثاني عشر';

  // فلترة الامتحانات حسب الصف
  const filteredExams = React.useMemo(() => {
    if (!data?.exams) return [];
    
    return data.exams.filter(exam => 
      exam.grade_levels.includes(gradeLevel) || 
      exam.grade_levels.includes(`الصف ${gradeLabel}`)
    );
  }, [data?.exams, gradeLevel, gradeLabel]);

  // حساب الإحصائيات
  const stats = React.useMemo(() => {
    const activeExams = filteredExams.filter(e => e.status === 'active').length;
    const totalAttempts = filteredExams.reduce((sum, e) => sum + e.attempts_count, 0);
    const examsWithScores = filteredExams.filter(e => e.avg_percentage !== null);
    const avgScore = examsWithScores.length > 0
      ? examsWithScores.reduce((sum, e) => sum + (e.avg_percentage || 0), 0) / examsWithScores.length
      : null;

    return { activeExams, totalAttempts, avgScore };
  }, [filteredExams]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      active: { variant: 'default', label: 'نشط' },
      scheduled: { variant: 'secondary', label: 'مجدول' },
      draft: { variant: 'outline', label: 'مسودة' },
      completed: { variant: 'destructive', label: 'منتهي' }
    };
    
    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd MMM yyyy - HH:mm', { locale: ar });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <AppHeader 
          title={`إحصائيات امتحانات الصف ${gradeLabel}`}
          showBackButton={true}
          backPath="/dashboard"
          showLogout={true}
        />
        <main className="container mx-auto px-6 py-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map(i => (
                <StatsCard
                  key={i}
                  title="جاري التحميل..."
                  value="..."
                  icon={FileText}
                  loading={true}
                />
              ))}
            </div>
          </div>
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <AppHeader 
        title={`إحصائيات امتحانات الصف ${gradeLabel}`}
        showBackButton={true}
        backPath="/dashboard"
        showLogout={true}
      />
      
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
          {/* العنوان */}
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-bold">إحصائيات امتحانات الصف {gradeLabel}</h1>
            <p className="text-muted-foreground">عرض شامل لجميع الامتحانات والنتائج</p>
          </div>

          {/* بطاقات الإحصائيات */}
          <div className="grid gap-4 md:grid-cols-3">
            <StatsCard
              title="الامتحانات النشطة"
              value={stats.activeExams.toString()}
              icon={FileText}
              gradient="bg-gradient-to-br from-blue-500 to-blue-600"
              change={`من إجمالي ${filteredExams.length} امتحان`}
            />
            
            <StatsCard
              title="إجمالي المحاولات"
              value={stats.totalAttempts.toString()}
              icon={Users}
              gradient="bg-gradient-to-br from-purple-500 to-purple-600"
              change="من جميع الطلاب"
            />
            
            <StatsCard
              title="متوسط النتائج"
              value={stats.avgScore !== null ? `${stats.avgScore.toFixed(1)}%` : 'لا توجد بيانات'}
              icon={TrendingUp}
              gradient="bg-gradient-to-br from-green-500 to-green-600"
              change="للامتحانات المكتملة"
            />
          </div>

          {/* جدول الامتحانات */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                قائمة الامتحانات التفصيلية
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredExams.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">لا توجد امتحانات</p>
                  <p className="text-sm">لم يتم إنشاء أي امتحانات لهذا الصف بعد</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredExams.map((exam) => (
                    <Card key={exam.id} className="overflow-hidden hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">{exam.title}</h3>
                              {getStatusBadge(exam.status)}
                            </div>
                            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                              <Badge variant="outline" className="gap-1">
                                <Target className="h-3 w-3" />
                                {exam.grade_levels.join(', ')}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/exam/${exam.id}/results`)}
                            >
                              <Eye className="h-4 w-4 ml-2" />
                              النتائج
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigate(`/exam/${exam.id}/edit`)}
                            >
                              <Edit className="h-4 w-4 ml-2" />
                              تعديل
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">عدد الأسئلة</p>
                            <p className="text-sm font-semibold">{exam.total_questions} سؤال</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">مجموع النقاط</p>
                            <p className="text-sm font-semibold">{exam.total_points} نقطة</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">عدد المحاولات</p>
                            <p className="text-sm font-semibold">{exam.attempts_count} محاولة</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">متوسط النتيجة</p>
                            <p className="text-sm font-semibold">
                              {exam.avg_percentage !== null 
                                ? `${exam.avg_percentage.toFixed(1)}%` 
                                : 'لا توجد بيانات'}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-green-600" />
                            <span className="text-muted-foreground">بداية:</span>
                            <span className="font-mono text-xs" dir="ltr">
                              {formatDateTime(exam.start_datetime)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-red-600" />
                            <span className="text-muted-foreground">نهاية:</span>
                            <span className="font-mono text-xs" dir="ltr">
                              {formatDateTime(exam.end_datetime)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* زر العودة */}
          <div className="text-center pt-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              العودة إلى لوحة التحكم
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
      
      <AppFooter />
    </div>
  );
};

export default GradeExamsAnalytics;
