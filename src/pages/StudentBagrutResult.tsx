// صفحة عرض نتائج امتحان البجروت للطالب
import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  AlertCircle,
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  FileText,
  Home,
  Loader2,
  Trophy,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function StudentBagrutResult() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // جلب نتائج الطالب
  const { data, isLoading, isError } = useQuery({
    queryKey: ['student-bagrut-result', examId, user?.id],
    queryFn: async () => {
      if (!examId || !user?.id) return null;

      // جلب الامتحان
      const { data: exam } = await supabase
        .from('bagrut_exams')
        .select('*')
        .eq('id', examId)
        .single();

      if (!exam) throw new Error('الامتحان غير موجود');

      // جلب محاولات الطالب
      const { data: attempts } = await supabase
        .from('bagrut_attempts')
        .select('*')
        .eq('exam_id', examId)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      // جلب الأقسام والأسئلة
      const { data: sections } = await supabase
        .from('bagrut_exam_sections')
        .select('*')
        .eq('exam_id', examId)
        .order('order_index');

      const { data: questions } = await supabase
        .from('bagrut_questions')
        .select('*')
        .eq('exam_id', examId)
        .order('order_index');

      // جلب علامات الأسئلة لأفضل محاولة
      const bestAttempt = (attempts || [])
        .filter(a => a.status === 'submitted' || a.status === 'graded')
        .sort((a, b) => (b.percentage || 0) - (a.percentage || 0))[0];

      let questionGrades: any[] = [];
      if (bestAttempt) {
        const { data: grades } = await supabase
          .from('bagrut_question_grades')
          .select('*')
          .eq('attempt_id', bestAttempt.id);
        questionGrades = grades || [];
      }

      return {
        exam,
        attempts: attempts || [],
        sections: sections || [],
        questions: questions || [],
        bestAttempt,
        questionGrades,
      };
    },
    enabled: !!examId && !!user?.id,
  });

  // التحقق من إمكانية عرض النتائج - يجب أن تكون هناك علامة فعلية
  const canViewResults = useMemo(() => {
    if (!data?.bestAttempt) return false;
    
    // إذا تم نشر النتيجة من قبل المعلم
    if (data.bestAttempt.is_result_published) return true;
    
    // إذا كانت هناك علامة محسوبة (تم التصحيح)
    const hasScore = data.bestAttempt.score !== null && data.bestAttempt.percentage !== null;
    if (hasScore && data.exam?.allow_review_after_submit) return true;
    
    return false;
  }, [data]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>فشل في تحميل النتائج</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/student/bagrut-exams')}>
          <Home className="ml-2 h-4 w-4" />
          العودة لقائمة الامتحانات
        </Button>
      </div>
    );
  }

  const { exam, attempts, bestAttempt, sections, questions, questionGrades } = data;

  // لا توجد محاولات
  if (attempts.length === 0) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2">لم تقم بحل هذا الامتحان بعد</h2>
            <p className="text-muted-foreground mb-6">ابدأ الامتحان لمشاهدة نتائجك</p>
            <Button onClick={() => navigate(`/student/bagrut-attempt/${examId}`)}>
              بدء الامتحان
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // النتائج غير منشورة
  if (!canViewResults) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-16 w-16 mx-auto mb-4 text-orange-500" />
            <h2 className="text-xl font-semibold mb-2">النتائج قيد المراجعة</h2>
            <p className="text-muted-foreground mb-6">
              تم تسليم إجاباتك بنجاح. سيتم إبلاغك عند نشر النتائج.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              تم التقديم: {bestAttempt?.submitted_at
                ? format(new Date(bestAttempt.submitted_at), 'dd MMM yyyy HH:mm', { locale: ar })
                : '-'}
            </div>
            <Button variant="outline" className="mt-6" onClick={() => navigate('/student/bagrut-exams')}>
              العودة لقائمة الامتحانات
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const percentage = bestAttempt?.percentage || 0;
  const passed = percentage >= 55;
  const gradesMap = new Map(questionGrades.map((g: any) => [g.question_id, g]));

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/student/bagrut-exams')}>
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">نتيجة الامتحان</h1>
          <p className="text-muted-foreground">{exam.title}</p>
        </div>
      </div>

      {/* النتيجة الرئيسية */}
      <Card className={`border-2 ${passed ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20' : 'border-red-500 bg-red-50/50 dark:bg-red-950/20'}`}>
        <CardContent className="py-8">
          <div className="flex flex-col items-center text-center">
            {passed ? (
              <Trophy className="h-20 w-20 text-green-500 mb-4" />
            ) : (
              <XCircle className="h-20 w-20 text-red-500 mb-4" />
            )}
            
            <h2 className="text-4xl font-bold mb-2">
              {percentage.toFixed(1)}%
            </h2>
            
            <p className="text-xl mb-4">
              {bestAttempt?.score || 0} / {bestAttempt?.max_score || exam.total_points} علامة
            </p>
            
            <Badge
              variant={passed ? 'default' : 'destructive'}
              className="text-lg px-4 py-1"
            >
              {passed ? 'ناجح' : 'راسب'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* إحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Award className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{bestAttempt?.attempt_number || 1}</p>
            <p className="text-sm text-muted-foreground">رقم المحاولة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">
              {bestAttempt?.time_spent_seconds
                ? `${Math.floor(bestAttempt.time_spent_seconds / 60)} د`
                : '-'}
            </p>
            <p className="text-sm text-muted-foreground">الوقت المستغرق</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{questions.length}</p>
            <p className="text-sm text-muted-foreground">عدد الأسئلة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">{attempts.length}</p>
            <p className="text-sm text-muted-foreground">إجمالي المحاولات</p>
          </CardContent>
        </Card>
      </div>

      {/* تعليق المعلم */}
      {bestAttempt?.teacher_feedback && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ملاحظات المعلم</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground whitespace-pre-wrap">
              {bestAttempt.teacher_feedback}
            </p>
          </CardContent>
        </Card>
      )}

      {/* تفاصيل الأسئلة */}
      {exam.show_answers_to_students && (
        <Card>
          <CardHeader>
            <CardTitle>تفاصيل الإجابات</CardTitle>
            <CardDescription>
              مراجعة إجاباتك مع الإجابات الصحيحة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-4">
                {questions.map((question: any, index: number) => {
                  const grade = gradesMap.get(question.id);
                  const answers = bestAttempt?.answers as Record<string, any> || {};
                  const studentAnswer = answers[question.id];
                  const isCorrect = grade?.final_score === grade?.max_score;

                  return (
                    <div
                      key={question.id}
                      className={`p-4 rounded-lg border ${
                        isCorrect
                          ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20'
                          : 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {isCorrect ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          <span className="font-medium">سؤال {question.question_number}</span>
                        </div>
                        <Badge variant={isCorrect ? 'default' : 'secondary'}>
                          {grade?.final_score ?? 0} / {question.points}
                        </Badge>
                      </div>

                      <p className="text-sm mb-3">{question.question_text}</p>

                      <div className="grid gap-2 text-sm">
                        <div className="flex gap-2">
                          <span className="font-medium min-w-[80px]">إجابتك:</span>
                          <span className="text-foreground">
                            {typeof studentAnswer?.answer === 'object'
                              ? JSON.stringify(studentAnswer.answer)
                              : studentAnswer?.answer || <span className="text-muted-foreground italic">لم تجب</span>}
                          </span>
                        </div>
                        
                        {question.correct_answer && (
                          <div className="flex gap-2">
                            <span className="font-medium min-w-[80px]">الصحيحة:</span>
                            <span className="text-green-600 dark:text-green-400">
                              {question.correct_answer}
                            </span>
                          </div>
                        )}

                        {grade?.teacher_feedback && (
                          <div className="mt-2 p-2 bg-muted rounded text-sm">
                            <span className="font-medium">ملاحظة: </span>
                            {grade.teacher_feedback}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* أزرار */}
      <div className="flex gap-4 justify-center">
        <Button variant="outline" onClick={() => navigate('/student/bagrut-exams')}>
          <ArrowRight className="ml-2 h-4 w-4" />
          العودة للقائمة
        </Button>
        {data.exam.max_attempts > attempts.length && (
          <Button onClick={() => navigate(`/student/bagrut-attempt/${examId}`)}>
            محاولة جديدة
          </Button>
        )}
      </div>
    </div>
  );
}
