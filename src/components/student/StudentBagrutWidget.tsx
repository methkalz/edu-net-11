import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useStudentBagrutExams } from '@/hooks/useStudentBagrutExams';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  GraduationCap,
  Clock,
  Calendar,
  ArrowLeft,
  CheckCircle2,
  PlayCircle,
  Trophy,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface StudentBagrutWidgetProps {
  gradeLevel?: string;
}

export default function StudentBagrutWidget({ gradeLevel }: StudentBagrutWidgetProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: exams, isLoading } = useStudentBagrutExams(user?.id, gradeLevel);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  // تصفية الامتحانات المتاحة للبدء
  const availableExams = exams?.filter(e => e.can_start) || [];
  const completedExams = exams?.filter(e => e.attempts_used > 0 && !e.can_start) || [];

  // إذا لم تكن هناك امتحانات، لا نعرض الويدجيت
  if (!exams || exams.length === 0) {
    return null;
  }

  const nextExam = availableExams[0];

  return (
    <Card className="border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50/50 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-orange-500" />
            <span>امتحانات البجروت</span>
          </div>
          {availableExams.length > 0 && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
              {availableExams.length} متاح
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {nextExam ? (
          <div className="space-y-3">
            {/* الامتحان التالي */}
            <div className="p-4 rounded-lg bg-background border">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <h4 className="font-semibold line-clamp-1">{nextExam.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {nextExam.subject} - {nextExam.exam_year}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {nextExam.duration_minutes} دقيقة
                    </span>
                    <span className="flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      {nextExam.total_points} علامة
                    </span>
                  </div>
                  {nextExam.available_until && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      <Calendar className="h-3 w-3 inline ml-1" />
                      متاح حتى: {format(new Date(nextExam.available_until), 'dd MMM yyyy', { locale: ar })}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {nextExam.last_attempt_status === 'in_progress' ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      قيد التقدم
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {nextExam.attempts_remaining} محاولات
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                onClick={() => navigate(`/student/bagrut-attempt/${nextExam.id}`)}
                className="w-full mt-3 bg-orange-500 hover:bg-orange-600"
              >
                <PlayCircle className="ml-2 h-4 w-4" />
                {nextExam.last_attempt_status === 'in_progress' ? 'متابعة الامتحان' : 'بدء الامتحان'}
              </Button>
            </div>

            {/* نتائج سابقة */}
            {completedExams.length > 0 && (
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    {completedExams.length} امتحان مكتمل
                  </span>
                  {completedExams[0].best_percentage !== null && (
                    <span className="font-medium">
                      أفضل نتيجة: {Math.round(completedExams[0].best_percentage)}%
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : completedExams.length > 0 ? (
          // فقط امتحانات مكتملة
          <div className="text-center py-4">
            <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
            <p className="font-medium">أحسنت! أكملت {completedExams.length} امتحان</p>
            <p className="text-sm text-muted-foreground mt-1">
              يمكنك مراجعة نتائجك من صفحة الامتحانات
            </p>
          </div>
        ) : (
          // لا امتحانات متاحة حالياً
          <div className="text-center py-4 text-muted-foreground">
            <GraduationCap className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>لا توجد امتحانات بجروت متاحة حالياً</p>
          </div>
        )}

        {/* رابط لصفحة الامتحانات */}
        <Button
          variant="ghost"
          className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-50"
          onClick={() => navigate('/student/bagrut-exams')}
        >
          عرض جميع الامتحانات
          <ArrowLeft className="mr-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
