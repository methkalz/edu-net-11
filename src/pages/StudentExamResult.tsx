import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExamResult } from '@/types/exam';
import { Trophy, Clock, CheckCircle, XCircle, Home, Info } from 'lucide-react';

export default function StudentExamResult() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const { data: result, isLoading } = useQuery({
    queryKey: ['exam-result', attemptId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_exam_results', { p_attempt_id: attemptId });

      if (error) throw error;
      return data as any as ExamResult;
    },
    enabled: !!attemptId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-lg">جاري تحميل النتائج...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>فشل في تحميل النتائج</AlertDescription>
        </Alert>
      </div>
    );
  }

  // حساب الوقت المستغرق الفعلي
  const getActualTimeSpent = () => {
    // إذا كان time_spent_seconds موجود ولا يساوي 0، استخدمه
    if (result.time_spent_seconds && result.time_spent_seconds > 0) {
      return result.time_spent_seconds;
    }
    
    // إذا كان 0 أو غير موجود، احسبه من started_at و submitted_at
    if (result.started_at && result.submitted_at) {
      const startTime = new Date(result.started_at).getTime();
      const endTime = new Date(result.submitted_at).getTime();
      const diffSeconds = Math.floor((endTime - startTime) / 1000);
      return diffSeconds;
    }
    
    return 0;
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}س ${minutes}د ${secs}ث`;
    }
    return `${minutes}د ${secs}ث`;
  };

  // التحقق من إظهار النتائج فوراً
  const showResults = result.show_results_immediately;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {showResults ? (
        <>
          <Card className="mb-6">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
                  result.passed ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <Trophy className={`w-12 h-12 ${
                    result.passed ? 'text-green-600' : 'text-red-600'
                  }`} />
                </div>
              </div>
              <CardTitle className="text-3xl mb-2">{result.exam_title}</CardTitle>
              <div className="flex items-center justify-center gap-2">
                <Badge variant={result.passed ? 'default' : 'destructive'} className="text-lg px-4 py-2">
                  {result.passed ? 'ناجح' : 'راسب'}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">الدرجة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {result.score} / {result.total_points}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {result.percentage.toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">الوقت المستغرق</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Clock className="w-6 h-6 text-primary" />
                  <span className="text-2xl font-bold">
                    {formatTime(getActualTimeSpent())}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">المحاولة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  #{result.attempt_number}
                </div>
              </CardContent>
            </Card>
          </div>

          {result.detailed_results && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>التفاصيل</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">إجابات صحيحة</p>
                      <p className="text-2xl font-bold text-green-600">
                        {result.detailed_results.correct_count}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50">
                    <XCircle className="w-8 h-8 text-red-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">إجابات خاطئة</p>
                      <p className="text-2xl font-bold text-red-600">
                        {result.detailed_results.incorrect_count}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">درجة النجاح المطلوبة</p>
                  <p className="text-lg font-semibold">{result.passing_percentage}%</p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl mb-2">{result.exam_title}</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
                  <Info className="w-12 h-12 text-blue-600" />
                </div>
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-primary">تم تقديم الامتحان بنجاح</h3>
              <p className="text-lg text-muted-foreground mb-2">
                سيتم نشر النتائج من قبل المعلم قريباً
              </p>
              <p className="text-sm text-muted-foreground">
                ستتمكن من مشاهدة درجتك والتفاصيل بعد مراجعة المعلم
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">الوقت المستغرق</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Clock className="w-6 h-6 text-primary" />
                  <span className="text-2xl font-bold">
                    {formatTime(getActualTimeSpent())}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">المحاولة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  #{result.attempt_number}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <div className="flex justify-center gap-4">
        <Button onClick={() => navigate('/student/exams')} variant="outline" className="gap-2">
          <Home className="w-4 h-4" />
          العودة للامتحانات
        </Button>
      </div>
    </div>
  );
}
