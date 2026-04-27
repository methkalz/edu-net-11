import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useStudentContent } from '@/hooks/useStudentContent';
import { useStudentBagrutExams, AvailableBagrutExam } from '@/hooks/useStudentBagrutExams';
import ModernHeader from '@/components/shared/ModernHeader';
import AppFooter from '@/components/shared/AppFooter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  GraduationCap,
  Clock,
  Calendar,
  PlayCircle,
  Trophy,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCcw,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

function ExamCard({ exam, onStart, onViewResults }: {
  exam: AvailableBagrutExam;
  onStart: () => void;
  onViewResults: () => void;
}) {
  const hasAttempts = exam.attempts_used > 0;
  const isInProgress = exam.last_attempt_status === 'in_progress';
  const isCompleted = hasAttempts && !exam.can_start;
  const isPassed = exam.best_percentage !== null && exam.best_percentage >= 55;

  return (
    <Card className={`transition-all hover:shadow-md ${isInProgress ? 'border-blue-300 dark:border-blue-700' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg line-clamp-2">{exam.title}</CardTitle>
            <CardDescription>
              {exam.subject} | {exam.exam_year} - {exam.exam_season === 'summer' ? 'صيفي' : exam.exam_season === 'winter' ? 'شتوي' : 'ربيعي'}
            </CardDescription>
          </div>
          {isInProgress && (
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              قيد التقدم
            </Badge>
          )}
          {isCompleted && (
            <Badge className={isPassed 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }>
              {isPassed ? 'ناجح' : 'راسب'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* معلومات الامتحان */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{exam.duration_minutes} دقيقة</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Trophy className="h-4 w-4" />
            <span>{exam.total_points} علامة</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <RotateCcw className="h-4 w-4" />
            <span>{exam.attempts_used}/{exam.max_attempts} محاولات</span>
          </div>
          {exam.available_until && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(exam.available_until), 'dd/MM/yyyy', { locale: ar })}</span>
            </div>
          )}
        </div>

        {/* شريط التقدم للمحاولات */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>المحاولات المستخدمة</span>
            <span>{exam.attempts_used} / {exam.max_attempts}</span>
          </div>
          <Progress 
            value={(exam.attempts_used / exam.max_attempts) * 100} 
            className="h-2"
          />
        </div>

        {/* أفضل نتيجة */}
        {exam.best_percentage !== null && (
          <div className="p-3 rounded-lg bg-muted/50 flex items-center justify-between">
            <span className="text-sm font-medium">أفضل نتيجة</span>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${
                exam.best_percentage >= 55 ? 'text-green-600' : 'text-red-600'
              }`}>
                {Math.round(exam.best_percentage)}%
              </span>
              {exam.best_score !== null && (
                <span className="text-sm text-muted-foreground">
                  ({exam.best_score}/{exam.total_points})
                </span>
              )}
            </div>
          </div>
        )}

        {/* أزرار الإجراءات */}
        <div className="flex gap-2">
          {exam.can_start && (
            <Button onClick={onStart} className="flex-1 bg-orange-500 hover:bg-orange-600">
              <PlayCircle className="ml-2 h-4 w-4" />
              {isInProgress ? 'متابعة' : 'بدء الامتحان'}
            </Button>
          )}
          {hasAttempts && (
            <Button 
              variant={exam.can_start ? 'outline' : 'default'}
              onClick={onViewResults}
              className={exam.can_start ? '' : 'flex-1'}
            >
              <Eye className="ml-2 h-4 w-4" />
              {exam.can_start ? '' : 'عرض النتائج'}
            </Button>
          )}
          {!exam.can_start && !hasAttempts && (
            <Button disabled className="flex-1" variant="outline">
              <AlertCircle className="ml-2 h-4 w-4" />
              غير متاح
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function StudentBagrutExams() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('available');
  
  // استخراج صف الطالب من useStudentContent
  const { assignedGrade } = useStudentContent();
  
  const { data: exams, isLoading } = useStudentBagrutExams(user?.id, assignedGrade);

  // تصنيف الامتحانات
  const availableExams = exams?.filter(e => e.can_start) || [];
  const completedExams = exams?.filter(e => e.attempts_used > 0 && !e.can_start) || [];
  const allExams = exams || [];

  const handleStartExam = (examId: string) => {
    navigate(`/student/bagrut-attempt/${examId}`);
  };

  const handleViewResults = (examId: string) => {
    navigate(`/student/bagrut-results/${examId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <ModernHeader title="امتحانات البجروت" showBackButton backPath="/dashboard" />

      <main className="container mx-auto px-4 py-8">
        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/30">
                <GraduationCap className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allExams.length}</p>
                <p className="text-sm text-muted-foreground">إجمالي الامتحانات</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedExams.length}</p>
                <p className="text-sm text-muted-foreground">مكتملة</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <PlayCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{availableExams.length}</p>
                <p className="text-sm text-muted-foreground">متاحة للحل</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* التبويبات */}
        <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
            <TabsTrigger value="available" className="gap-2">
              <PlayCircle className="h-4 w-4" />
              متاحة
              {availableExams.length > 0 && (
                <Badge variant="secondary" className="mr-1">{availableExams.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              مكتملة
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2">
              <FileText className="h-4 w-4" />
              الكل
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              <TabsContent value="available">
                {availableExams.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableExams.map(exam => (
                      <ExamCard
                        key={exam.id}
                        exam={exam}
                        onStart={() => handleStartExam(exam.id)}
                        onViewResults={() => handleViewResults(exam.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">لا توجد امتحانات متاحة</h3>
                      <p className="text-muted-foreground">
                        سيتم إشعارك عند توفر امتحانات جديدة
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="completed">
                {completedExams.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {completedExams.map(exam => (
                      <ExamCard
                        key={exam.id}
                        exam={exam}
                        onStart={() => handleStartExam(exam.id)}
                        onViewResults={() => handleViewResults(exam.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">لم تكمل أي امتحان بعد</h3>
                      <p className="text-muted-foreground">
                        ابدأ بحل امتحان من قائمة المتاحة
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="all">
                {allExams.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allExams.map(exam => (
                      <ExamCard
                        key={exam.id}
                        exam={exam}
                        onStart={() => handleStartExam(exam.id)}
                        onViewResults={() => handleViewResults(exam.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">لا توجد امتحانات</h3>
                      <p className="text-muted-foreground">
                        لم يتم نشر امتحانات بجروت لصفك بعد
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>

      <AppFooter />
    </div>
  );
}
