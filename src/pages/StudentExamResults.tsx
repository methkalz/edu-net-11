import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExamSession } from '@/hooks/useExamSession';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Award, XCircle, CheckCircle2, Home, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const StudentExamResults = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { getAttemptDetails } = useExamSession();

  const [attempt, setAttempt] = useState<any>(null);
  const [template, setTemplate] = useState<any>(null);
  const [remainingAttempts, setRemainingAttempts] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (attemptId) {
      loadResults();
    }
  }, [attemptId]);

  const loadResults = async () => {
    try {
      setLoading(true);

      // جلب تفاصيل المحاولة
      const details = await getAttemptDetails(attemptId!);
      if (!details?.attempt) return;

      setAttempt(details.attempt);

      // جلب معلومات القالب
      const { data: templateData } = await supabase
        .from('exam_templates')
        .select('title, max_attempts, pass_percentage, show_results_immediately')
        .eq('id', details.attempt.template_id)
        .single();

      if (templateData) {
        setTemplate(templateData);

        // حساب عدد المحاولات المتبقية
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { count } = await supabase
            .from('exam_attempts')
            .select('*', { count: 'exact', head: true })
            .eq('template_id', details.attempt.template_id)
            .eq('student_id', user.id);

          const remaining = Math.max(0, templateData.max_attempts - (count || 0));
          setRemainingAttempts(remaining);
        }
      }

    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !attempt || !template) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل النتائج...</p>
        </div>
      </div>
    );
  }

  const scorePercentage = (attempt.total_score / attempt.max_score) * 100;
  const isPassed = scorePercentage >= template.pass_percentage;

  return (
    <div className="container max-w-3xl mx-auto py-12 px-4" dir="rtl">
      {/* Result Header */}
      <Card className={`mb-8 border-2 ${isPassed ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20' : 'border-destructive bg-destructive/5'}`}>
        <CardContent className="pt-8 text-center">
          <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${isPassed ? 'bg-green-100 dark:bg-green-900' : 'bg-destructive/10'}`}>
            {isPassed ? (
              <Trophy className="w-12 h-12 text-green-600 dark:text-green-400" />
            ) : (
              <XCircle className="w-12 h-12 text-destructive" />
            )}
          </div>

          <h1 className={`text-3xl font-bold mb-2 ${isPassed ? 'text-green-700 dark:text-green-400' : 'text-destructive'}`}>
            {isPassed ? 'مبروك! لقد نجحت 🎉' : 'للأسف، لم تنجح هذه المرة'}
          </h1>

          <p className="text-muted-foreground mb-6">
            {template.title}
          </p>

          <div className="space-y-4">
            <div className="text-5xl font-bold text-foreground">
              {attempt.total_score} / {attempt.max_score}
            </div>
            
            <div className="w-full max-w-md mx-auto space-y-2">
              <Progress 
                value={scorePercentage} 
                className={`h-3 ${isPassed ? '[&>div]:bg-green-500' : '[&>div]:bg-destructive'}`}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>نسبة النجاح: {template.pass_percentage}%</span>
                <span className="font-semibold">{scorePercentage.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              الدرجة النهائية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attempt.total_score}</div>
            <p className="text-xs text-muted-foreground mt-1">من أصل {attempt.max_score}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              النسبة المئوية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isPassed ? 'text-green-600' : 'text-destructive'}`}>
              {scorePercentage.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isPassed ? 'فوق الحد الأدنى' : 'تحت الحد الأدنى'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              المحاولات المتبقية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{remainingAttempts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              من أصل {template.max_attempts}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Message */}
      {isPassed ? (
        <Card className="mb-8 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-200 mb-1">
                  أحسنت! لقد تجاوزت الامتحان بنجاح
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  حصلت على درجة {scorePercentage.toFixed(1)}% وهي أعلى من الحد الأدنى للنجاح ({template.pass_percentage}%). 
                  استمر في العمل الجيد! 🌟
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-8 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-orange-200 dark:border-orange-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Award className="w-6 h-6 text-orange-600 dark:text-orange-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-orange-900 dark:text-orange-200 mb-1">
                  لا تستسلم! يمكنك المحاولة مرة أخرى
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  حصلت على {scorePercentage.toFixed(1)}% وتحتاج إلى {template.pass_percentage}% للنجاح.
                  {remainingAttempts > 0 
                    ? ` لديك ${remainingAttempts} محاولة${remainingAttempts > 1 ? ' متبقية' : ' واحدة'}. راجع المادة وحاول مرة أخرى! 💪`
                    : ' للأسف، لقد استنفذت جميع المحاولات المتاحة.'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          onClick={() => navigate('/students')}
          variant="outline"
          size="lg"
          className="gap-2"
        >
          <Home className="w-5 h-5" />
          العودة للوحة التحكم
        </Button>

        {!isPassed && remainingAttempts > 0 && (
          <Button
            onClick={() => navigate('/students')}
            size="lg"
            className="gap-2 bg-gradient-to-r from-primary to-primary/80"
          >
            <RotateCcw className="w-5 h-5" />
            محاولة مرة أخرى
          </Button>
        )}
      </div>

      {/* Footer Note */}
      {template.show_results_immediately && (
        <p className="text-center text-sm text-muted-foreground mt-8">
          ملاحظة: تم عرض النتائج فوراً كما هو محدد في إعدادات الامتحان
        </p>
      )}
    </div>
  );
};

export default StudentExamResults;
