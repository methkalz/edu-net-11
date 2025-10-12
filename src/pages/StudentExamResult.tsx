import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExamResult } from '@/types/exam';
import { Trophy, Clock, CheckCircle, XCircle, ArrowRight, Info, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="glass-card p-8 rounded-2xl border border-border/50 backdrop-blur-md bg-card/80 shadow-xl">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-lg font-medium">جاري تحميل النتائج...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-6">
        <Alert variant="destructive" className="max-w-md">
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        {showResults ? (
          <>
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl border border-border/50 backdrop-blur-md bg-gradient-to-br from-card/80 via-card/60 to-card/40 shadow-2xl mb-8">
              <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />
              
              <div className="relative p-12 text-center">
                {/* Trophy Icon with Glow */}
                <div className="flex justify-center mb-6">
                  <div className={cn(
                    "relative w-32 h-32 rounded-full flex items-center justify-center",
                    "backdrop-blur-sm border-2 shadow-2xl",
                    result.passed 
                      ? "bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-500/30" 
                      : "bg-gradient-to-br from-red-500/20 to-rose-500/10 border-red-500/30"
                  )}>
                    <div className={cn(
                      "absolute inset-0 rounded-full blur-2xl opacity-50",
                      result.passed ? "bg-green-500" : "bg-red-500"
                    )} />
                    <Trophy className={cn(
                      "w-16 h-16 relative z-10",
                      result.passed ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    )} />
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {result.exam_title}
                </h1>

                {/* Status Badge */}
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Badge 
                    variant={result.passed ? 'default' : 'destructive'} 
                    className={cn(
                      "text-xl px-6 py-2 rounded-full shadow-lg",
                      result.passed && "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    )}
                  >
                    {result.passed ? (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        ناجح
                      </>
                    ) : (
                      'راسب'
                    )}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Score Card */}
              <div className="group relative overflow-hidden rounded-2xl border border-border/50 backdrop-blur-md bg-card/60 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-6">
                  <p className="text-sm font-medium text-muted-foreground mb-3">الدرجة</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                      {result.score}
                    </span>
                    <span className="text-2xl text-muted-foreground font-medium">
                      / {result.total_points}
                    </span>
                  </div>
                  <div className="mt-2 inline-block px-3 py-1 rounded-full bg-primary/10 backdrop-blur-sm">
                    <p className="text-sm font-semibold text-primary">
                      {result.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Time Card */}
              <div className="group relative overflow-hidden rounded-2xl border border-border/50 backdrop-blur-md bg-card/60 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-6">
                  <p className="text-sm font-medium text-muted-foreground mb-3">الوقت المستغرق</p>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/10 backdrop-blur-sm">
                      <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-3xl font-bold">
                      {formatTime(getActualTimeSpent())}
                    </span>
                  </div>
                </div>
              </div>

              {/* Attempt Card */}
              <div className="group relative overflow-hidden rounded-2xl border border-border/50 backdrop-blur-md bg-card/60 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-6">
                  <p className="text-sm font-medium text-muted-foreground mb-3">المحاولة</p>
                  <div className="flex items-center gap-3">
                    <div className="text-4xl font-bold bg-gradient-to-br from-purple-600 to-purple-400 bg-clip-text text-transparent">
                      #{result.attempt_number}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Details Card */}
            {result.detailed_results && (
              <div className="rounded-2xl border border-border/50 backdrop-blur-md bg-card/60 shadow-lg overflow-hidden mb-8">
                <div className="p-6 border-b border-border/30 bg-muted/30">
                  <h2 className="text-xl font-bold">تفاصيل الأداء</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Correct Answers */}
                    <div className="relative overflow-hidden rounded-xl p-5 bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 backdrop-blur-sm">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-green-500/20 backdrop-blur-sm">
                          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">إجابات صحيحة</p>
                          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                            {result.detailed_results.correct_count}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Incorrect Answers */}
                    <div className="relative overflow-hidden rounded-xl p-5 bg-gradient-to-br from-red-500/10 to-rose-500/5 border border-red-500/20 backdrop-blur-sm">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-red-500/20 backdrop-blur-sm">
                          <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">إجابات خاطئة</p>
                          <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                            {result.detailed_results.incorrect_count}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pass Grade */}
                  <div className="rounded-xl p-4 bg-muted/50 backdrop-blur-sm border border-border/30">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-muted-foreground">درجة النجاح المطلوبة</p>
                      <p className="text-2xl font-bold text-primary">{result.passing_percentage}%</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Pending Results Hero */}
            <div className="relative overflow-hidden rounded-3xl border border-border/50 backdrop-blur-md bg-gradient-to-br from-card/80 via-card/60 to-card/40 shadow-2xl mb-8">
              <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />
              
              <div className="relative p-12 text-center">
                {/* Info Icon with Glow */}
                <div className="flex justify-center mb-6">
                  <div className="relative w-32 h-32 rounded-full flex items-center justify-center backdrop-blur-sm bg-gradient-to-br from-blue-500/20 to-blue-500/10 border-2 border-blue-500/30 shadow-2xl">
                    <div className="absolute inset-0 rounded-full bg-blue-500 blur-2xl opacity-50" />
                    <Info className="w-16 h-16 text-blue-600 dark:text-blue-400 relative z-10" />
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {result.exam_title}
                </h1>

                {/* Success Message */}
                <div className="max-w-2xl mx-auto space-y-3">
                  <Badge className="text-xl px-6 py-2 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                    <Sparkles className="w-5 h-5 mr-2" />
                    تم التقديم بنجاح
                  </Badge>
                  <p className="text-lg text-muted-foreground">
                    سيتم نشر النتائج من قبل المعلم قريباً
                  </p>
                  <p className="text-sm text-muted-foreground/80">
                    ستتمكن من مشاهدة درجتك والتفاصيل بعد مراجعة المعلم
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Time Card */}
              <div className="group relative overflow-hidden rounded-2xl border border-border/50 backdrop-blur-md bg-card/60 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-6">
                  <p className="text-sm font-medium text-muted-foreground mb-3">الوقت المستغرق</p>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/10 backdrop-blur-sm">
                      <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-3xl font-bold">
                      {formatTime(getActualTimeSpent())}
                    </span>
                  </div>
                </div>
              </div>

              {/* Attempt Card */}
              <div className="group relative overflow-hidden rounded-2xl border border-border/50 backdrop-blur-md bg-card/60 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-6">
                  <p className="text-sm font-medium text-muted-foreground mb-3">المحاولة</p>
                  <div className="flex items-center gap-3">
                    <div className="text-4xl font-bold bg-gradient-to-br from-purple-600 to-purple-400 bg-clip-text text-transparent">
                      #{result.attempt_number}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Action Button */}
        <div className="flex justify-center">
          <Button 
            onClick={() => navigate('/student?tab=exams')} 
            size="lg"
            className="group relative overflow-hidden rounded-xl px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <span className="relative z-10 flex items-center gap-3">
              العودة للامتحانات
              <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </Button>
        </div>
      </div>
    </div>
  );
}
