import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExamResult } from '@/types/exam';
import { CheckCircle2, Clock, CheckCircle, XCircle, ArrowRight, Info, Frown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCountUp } from '@/hooks/useCountUp';

export default function StudentExamResult() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [showStatus, setShowStatus] = React.useState(false);

  const { data: result, isLoading } = useQuery({
    queryKey: ['exam-result', attemptId],
    queryFn: async () => {
      console.group('🔍 [EXAM RESULT DEBUG] جلب نتائج الامتحان');
      console.log('📋 Attempt ID:', attemptId);
      
      const { data, error } = await supabase
        .rpc('get_exam_results', { p_attempt_id: attemptId });

      if (error) {
        console.error('❌ خطأ في جلب النتائج:', error);
        console.groupEnd();
        throw error;
      }
      
      const resultData = data as any;
      console.log('📊 البيانات المستلمة من get_exam_results:', resultData);
      console.log('📈 Score:', resultData?.score);
      console.log('📊 Total Points:', resultData?.total_points);
      console.log('📐 Percentage:', resultData?.percentage);
      console.log('✅ Passed:', resultData?.passed);
      console.log('📝 Detailed Results:', resultData?.detailed_results);
      console.log('🔢 Correct Count:', resultData?.detailed_results?.correct_count);
      console.log('🔢 Incorrect Count:', resultData?.detailed_results?.incorrect_count);
      console.log('🔢 Total Questions:', resultData?.detailed_results?.total_questions);
      console.groupEnd();
      
      return resultData as ExamResult;
    },
    enabled: !!attemptId,
  });

  // تأثيرات العد للأرقام - مع قيم افتراضية آمنة
  const scoreCount = useCountUp({ end: result?.score || 0, duration: 2250 });
  const percentageCount = useCountUp({ end: result?.percentage || 0, duration: 3000, decimals: 1 });
  const attemptCount = useCountUp({ end: result?.attempt_number || 1, duration: 1000 });
  const correctCount = useCountUp({ 
    end: result?.detailed_results?.correct_count || 0, 
    duration: 1200 
  });
  const incorrectCount = useCountUp({ 
    end: result?.detailed_results?.incorrect_count || 0, 
    duration: 1200 
  });

  // إظهار الأيقونة والبادج بعد اكتمال عد النسبة المئوية
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowStatus(true);
    }, 3000); // نفس مدة عد النسبة المئوية
    return () => clearTimeout(timer);
  }, []);

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
    
    // تنسيق الأرقام بحيث تكون دائماً رقمين
    const pad = (num: number) => String(num).padStart(2, '0');
    
    if (hours > 0) {
      return `${hours}:${pad(minutes)}:${pad(secs)}`;
    }
    return `${minutes}:${pad(secs)}`;
  };

  // التحقق من إظهار النتائج فوراً
  const showResults = result?.show_results_immediately || false;

  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="container mx-auto max-w-4xl">
        {showResults ? (
          <>
            {/* Minimalist Hero Section */}
            <div className="text-center mb-16">
              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-semibold mb-8 text-foreground/90 text-center">
                {result.exam_title}
              </h1>

              {/* Percentage with Status - Hero Element */}
              <div className="mb-12 flex flex-col items-center gap-6">
                {/* Percentage */}
                <div className="text-7xl md:text-8xl font-bold text-foreground tracking-tight">
                  {percentageCount}<span className="text-5xl md:text-6xl text-muted-foreground">%</span>
                </div>
                
                {/* Icon and Status Badge - يظهران بعد اكتمال العد */}
                {showStatus && (
                  <div className="flex items-center gap-3 animate-fade-in">
                    <div className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500",
                      result.passed 
                        ? "bg-green-50 dark:bg-green-950/30" 
                        : "bg-red-50 dark:bg-red-950/30"
                    )}>
                      {result.passed ? (
                        <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                      ) : (
                        <Frown className="w-8 h-8 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    
                    <Badge 
                      variant={result.passed ? 'default' : 'destructive'} 
                      className={cn(
                        "text-base px-6 py-2 rounded-full font-medium",
                        result.passed && "bg-green-600 hover:bg-green-700"
                      )}
                    >
                      {result.passed ? 'ناجح' : 'راسب'}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Clean Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
              {/* Score Card */}
              <div className="border border-border rounded-xl p-6 hover:border-border/80 transition-colors">
                <p className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">العلامة</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold text-foreground">
                    {scoreCount}
                  </span>
                  <span className="text-xl text-muted-foreground font-normal">
                    / {result.total_points}
                  </span>
                </div>
              </div>

              {/* Time Card */}
              <div className="border border-border rounded-xl p-6 hover:border-border/80 transition-colors">
                <p className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">الوقت</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-3xl font-bold text-foreground">
                    {formatTime(getActualTimeSpent())}
                  </span>
                </div>
              </div>

              {/* Attempt Card */}
              <div className="border border-border rounded-xl p-6 hover:border-border/80 transition-colors">
                <p className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">المحاولة</p>
                <div className="text-3xl font-bold text-foreground">
                  #{attemptCount}
                </div>
              </div>
            </div>

            {/* Minimalist Details */}
            {result.detailed_results && (
              <div className="border border-border rounded-xl overflow-hidden mb-12">
                <div className="px-6 py-4 border-b border-border text-center">
                  <h2 className="text-base font-medium text-foreground uppercase tracking-wider">توزيع الإجابات</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-8 mb-8">
                    {/* Correct Answers */}
                    <div className="text-center flex flex-col items-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50 dark:bg-green-950/30 mb-3">
                        <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider">صحيحة</p>
                      <p className="text-3xl font-bold text-foreground">
                        {correctCount}
                      </p>
                    </div>

                    {/* Incorrect Answers */}
                    <div className="text-center flex flex-col items-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/30 mb-3">
                        <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider">خاطئة</p>
                      <p className="text-3xl font-bold text-foreground">
                        {incorrectCount}
                      </p>
                    </div>
                  </div>

                  {/* Pass Grade */}
                  <div className="pt-6 border-t border-border">
                    <div className="text-center flex flex-col items-center">
                      <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider">درجة النجاح</p>
                      <p className="text-xl font-semibold text-foreground">{result.passing_percentage}%</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Minimalist Pending Results */}
            <div className="text-center mb-16">
              {/* Info Icon */}
              <div className="flex justify-center mb-8">
                <div className="w-20 h-20 rounded-full flex items-center justify-center bg-blue-50 dark:bg-blue-950/30">
                  <Info className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
              </div>

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-semibold mb-8 text-foreground/90">
                {result.exam_title}
              </h1>

              {/* Success Message */}
              <div className="space-y-3 mb-12">
                <Badge className="text-base px-6 py-2 rounded-full font-medium bg-blue-600 hover:bg-blue-700">
                  تم التقديم بنجاح
                </Badge>
                <p className="text-base text-muted-foreground">
                  سيتم نشر النتائج من قبل {result.teacher_name || 'المعلم'} قريباً
                </p>
              </div>
            </div>

            {/* Clean Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
              {/* Time Card */}
              <div className="border border-border rounded-xl p-6 hover:border-border/80 transition-colors">
                <p className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">الوقت</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-3xl font-bold text-foreground">
                    {formatTime(getActualTimeSpent())}
                  </span>
                </div>
              </div>

              {/* Attempt Card */}
              <div className="border border-border rounded-xl p-6 hover:border-border/80 transition-colors">
                <p className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">المحاولة</p>
                <div className="text-3xl font-bold text-foreground">
                  #{result.attempt_number}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Minimalist Action Button */}
        <div className="flex justify-center">
          <Button 
            onClick={() => navigate('/student?tab=exams')} 
            variant="outline"
            className="group px-7 py-2.5 rounded-lg text-base font-medium hover:bg-foreground hover:text-background transition-all"
          >
            <span className="flex items-center gap-2">
              العودة للامتحانات
              <ArrowRight className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
