import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, FileQuestion, TrendingUp, Users, ArrowRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTeacherExams } from '@/hooks/useTeacherExams';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

interface ExamsWidgetProps {
  canAccessGrade10: boolean;
  canAccessGrade11: boolean;
}

export const ExamsWidget: React.FC<ExamsWidgetProps> = ({ canAccessGrade10, canAccessGrade11 }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading } = useTeacherExams(user?.id);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);

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

  const handleOpenCreateDialog = () => {
    setSelectedGrades([]);
    setIsCreateDialogOpen(true);
  };

  const handleGradeToggle = (grade: string) => {
    setSelectedGrades(prev => 
      prev.includes(grade) 
        ? prev.filter(g => g !== grade)
        : [...prev, grade]
    );
  };

  const handleCreateExam = () => {
    if (selectedGrades.length === 0) {
      toast({
        title: "تنبيه",
        description: "يرجى اختيار صف واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    // التوجيه إلى صفحة إدارة الامتحانات مع تمرير الصفوف المختارة
    const primaryGrade = selectedGrades.includes('11') ? '11' : '10';
    const gradesParam = selectedGrades.join(',');
    navigate(`/grade${primaryGrade}-management?tab=exams&grades=${gradesParam}&action=create`);
    setIsCreateDialogOpen(false);
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
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/10 to-purple-500/10 flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-muted-foreground mb-6 text-lg">لم تقم بإنشاء أي امتحان بعد</p>
            <Button
              onClick={handleOpenCreateDialog}
              className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
              size="lg"
            >
              <Plus className="w-4 h-4 ml-2" />
              إنشاء امتحان جديد
            </Button>
          </div>
        )}
      </CardContent>

      {/* Dialog لاختيار الصفوف */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">إنشاء امتحان جديد</DialogTitle>
            <DialogDescription>
              اختر الصف أو الصفوف التي سيكون الامتحان متاحاً لها
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {canAccessGrade10 && (
              <div className="flex items-center space-x-3 space-x-reverse">
                <Checkbox
                  id="grade10"
                  checked={selectedGrades.includes('10')}
                  onCheckedChange={() => handleGradeToggle('10')}
                />
                <Label
                  htmlFor="grade10"
                  className="text-base font-medium cursor-pointer flex items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center">
                    <span className="text-orange-600 font-bold text-sm">10</span>
                  </div>
                  الصف العاشر
                </Label>
              </div>
            )}

            {canAccessGrade11 && (
              <div className="flex items-center space-x-3 space-x-reverse">
                <Checkbox
                  id="grade11"
                  checked={selectedGrades.includes('11')}
                  onCheckedChange={() => handleGradeToggle('11')}
                />
                <Label
                  htmlFor="grade11"
                  className="text-base font-medium cursor-pointer flex items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center">
                    <span className="text-purple-600 font-bold text-sm">11</span>
                  </div>
                  الصف الحادي عشر
                </Label>
              </div>
            )}

            {selectedGrades.length > 0 && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  الصفوف المختارة: {selectedGrades.map(g => `الصف ${g === '10' ? 'العاشر' : 'الحادي عشر'}`).join(' و ')}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleCreateExam}
              className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
              disabled={selectedGrades.length === 0}
            >
              <Plus className="w-4 h-4 ml-2" />
              متابعة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
