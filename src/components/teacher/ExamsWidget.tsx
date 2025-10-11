import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, FileQuestion, TrendingUp, Users, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTeacherExams } from '@/hooks/useTeacherExams';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface ExamsWidgetProps {
  canAccessGrade10: boolean;
  canAccessGrade11: boolean;
}

export const ExamsWidget: React.FC<ExamsWidgetProps> = ({ canAccessGrade10, canAccessGrade11 }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading } = useTeacherExams(user?.id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-600 dark:text-green-400';
      case 'scheduled': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'completed': return 'bg-gray-500/10 text-gray-600 dark:text-gray-400';
      case 'draft': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
      default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'scheduled': return 'مجدول';
      case 'completed': return 'منتهي';
      case 'draft': return 'مسودة';
      default: return status;
    }
  };

  const handleManageExams = (grade: string) => {
    navigate(`/grade${grade}-management?tab=exams`);
  };

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-br from-orange-500/10 to-purple-500/10 border-b">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const exams = data?.exams || [];
  const stats = data?.stats;
  const totalQuestions = data?.totalQuestions || 0;

  // تصفية الامتحانات حسب الصفوف المسموح بها
  const filteredExams = exams.filter(exam => {
    const hasGrade10 = exam.grade_levels.some(g => g === '10' || g.includes('عاشر'));
    const hasGrade11 = exam.grade_levels.some(g => g === '11' || g.includes('حادي'));
    return (canAccessGrade10 && hasGrade10) || (canAccessGrade11 && hasGrade11);
  });

  const recentExams = filteredExams.slice(0, 4);

  return (
    <Card className="overflow-hidden shadow-lg">
      <CardHeader className="bg-gradient-to-br from-orange-500/10 to-purple-500/10 border-b">
        <CardTitle className="text-xl flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-orange-600" />
          الامتحانات الإلكترونية
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 p-4 rounded-lg border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="w-4 h-4 text-green-600" />
              <span className="text-sm text-muted-foreground">امتحانات نشطة</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats?.activeExams || 0}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-4 rounded-lg border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <FileQuestion className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">بنك الأسئلة</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{totalQuestions}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-4 rounded-lg border border-purple-500/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-muted-foreground">متوسط الدرجات</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {stats?.avgScoreAll ? `${stats.avgScoreAll.toFixed(1)}%` : '--'}
            </p>
          </div>
        </div>

        {/* قائمة الامتحانات */}
        {recentExams.length > 0 ? (
          <>
            <div className="space-y-3 mb-4">
              {recentExams.map((exam) => (
                <div
                  key={exam.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm">{exam.title}</h4>
                      <Badge className={getStatusColor(exam.status)} variant="secondary">
                        {getStatusLabel(exam.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileQuestion className="w-3 h-3" />
                        {exam.total_questions} سؤال
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {exam.attempts_count} محاولة
                      </span>
                      {exam.avg_percentage !== null && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {exam.avg_percentage.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* أزرار الإدارة */}
            <div className="flex gap-2 flex-wrap">
              {canAccessGrade10 && (
                <Button
                  onClick={() => handleManageExams('10')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  امتحانات الصف العاشر
                  <ArrowRight className="w-3 h-3" />
                </Button>
              )}
              {canAccessGrade11 && (
                <Button
                  onClick={() => handleManageExams('11')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  امتحانات الصف الحادي عشر
                  <ArrowRight className="w-3 h-3" />
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground mb-4">لم تقم بإنشاء أي امتحان بعد</p>
            <div className="flex gap-2 justify-center flex-wrap">
              {canAccessGrade10 && (
                <Button
                  onClick={() => handleManageExams('10')}
                  variant="default"
                  size="sm"
                >
                  إنشاء امتحان للصف العاشر
                </Button>
              )}
              {canAccessGrade11 && (
                <Button
                  onClick={() => handleManageExams('11')}
                  variant="default"
                  size="sm"
                >
                  إنشاء امتحان للصف الحادي عشر
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
