/**
 * صفحة تأكيد تقديم امتحان البجروت
 * تظهر بعد تقديم الطالب للامتحان مباشرة
 */

import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Clock, FileQuestion, Hash, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PageLoading } from '@/components/ui/LoadingComponents';
import { useEffect } from 'react';

interface SubmissionState {
  answeredCount: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  attemptNumber: number;
  examTitle?: string;
}

export default function StudentBagrutSubmitted() {
  const { examId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const state = location.state as SubmissionState | null;

  // تنظيف الكاش عند الوصول لهذه الصفحة لتجنب بيانات قديمة
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['bagrut-exam-attempt'] });
    queryClient.invalidateQueries({ queryKey: ['student-bagrut-exams'] });
  }, [queryClient]);

  // جلب بيانات الامتحان والمحاولة إذا لم تكن موجودة في state
  const { data, isLoading } = useQuery({
    queryKey: ['bagrut-submission-confirm', examId, user?.id],
    queryFn: async () => {
      if (!examId || !user?.id) throw new Error('بيانات مفقودة');

      // جلب الامتحان
      const { data: exam } = await supabase
        .from('bagrut_exams')
        .select('title, subject, exam_year')
        .eq('id', examId)
        .single();

      // جلب آخر محاولة
      const { data: attempt } = await supabase
        .from('bagrut_attempts')
        .select('*')
        .eq('exam_id', examId)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // جلب عدد الأسئلة الكلي
      const { count: totalQuestions } = await supabase
        .from('bagrut_questions')
        .select('*', { count: 'exact', head: true })
        .eq('exam_id', examId)
        .is('parent_question_id', null);

      const answers = (attempt?.answers || {}) as Record<string, any>;
      const answeredCount = Object.keys(answers).filter(k => {
        const ans = answers[k];
        return ans && (ans.answer !== '' && ans.answer !== null && ans.answer !== undefined);
      }).length;

      return {
        examTitle: exam?.title || 'امتحان البجروت',
        subject: exam?.subject,
        examYear: exam?.exam_year,
        answeredCount,
        totalQuestions: totalQuestions || 0,
        timeSpentSeconds: attempt?.time_spent_seconds || 0,
        attemptNumber: attempt?.attempt_number || 1,
        submittedAt: attempt?.submitted_at,
      };
    },
    enabled: !state && !!examId && !!user?.id,
  });

  // استخدام البيانات من state أو من الاستعلام
  const submissionData = state || data;

  if (isLoading && !state) {
    return <PageLoading message="جاري تحميل بيانات التقديم..." />;
  }

  if (!submissionData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" dir="rtl">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">لم يتم العثور على بيانات التقديم</h2>
            <p className="text-muted-foreground mb-4">قد تكون الجلسة قد انتهت</p>
            <Button onClick={() => navigate('/student/bagrut-exams')}>
              العودة لقائمة الامتحانات
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const {
    answeredCount,
    totalQuestions,
    timeSpentSeconds,
    attemptNumber,
    examTitle,
  } = submissionData;

  const unansweredCount = totalQuestions - answeredCount;
  const formattedTime = formatTimeSpent(timeSpentSeconds);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-2xl w-full space-y-6">
        {/* بطاقة النجاح الرئيسية */}
        <Card className="border-2 border-green-200 dark:border-green-900 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            {/* أيقونة النجاح */}
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
              <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 rounded-full p-4 inline-block">
                <CheckCircle className="w-16 h-16 text-white" />
              </div>
            </div>

            {/* العنوان */}
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold text-green-800 dark:text-green-200">
                تم تقديم امتحانك بنجاح!
              </h1>
              {(examTitle || data?.examTitle) && (
                <p className="text-lg text-green-700 dark:text-green-300">
                  {examTitle || data?.examTitle}
                  {data?.examYear && ` - ${data.examYear}`}
                </p>
              )}
            </div>

            {/* رسالة المراجعة */}
            <div className="bg-white/60 dark:bg-black/20 rounded-xl p-4 max-w-md mx-auto">
              <div className="flex flex-col items-center gap-2 text-center">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">
                    سيتم مراجعة إجاباتك من قبل المعلم
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    ستحصل على إشعار عند نشر النتائج
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={<FileQuestion className="w-5 h-5" />}
            label="أسئلة مجابة"
            value={answeredCount.toString()}
            color="text-blue-600 dark:text-blue-400"
            bgColor="bg-blue-50 dark:bg-blue-950/30"
          />
          <StatCard
            icon={<FileQuestion className="w-5 h-5" />}
            label="أسئلة فارغة"
            value={unansweredCount.toString()}
            color="text-orange-600 dark:text-orange-400"
            bgColor="bg-orange-50 dark:bg-orange-950/30"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="الوقت المستغرق"
            value={formattedTime}
            color="text-purple-600 dark:text-purple-400"
            bgColor="bg-purple-50 dark:bg-purple-950/30"
          />
          <StatCard
            icon={<Hash className="w-5 h-5" />}
            label="رقم المحاولة"
            value={attemptNumber.toString()}
            color="text-green-600 dark:text-green-400"
            bgColor="bg-green-50 dark:bg-green-950/30"
          />
        </div>

        {/* نسبة الإنجاز */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">نسبة الإجابة</span>
              <span className="text-sm text-muted-foreground">
                {answeredCount} من {totalQuestions} سؤال
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* زر العودة */}
        <Button
          onClick={() => navigate('/student/bagrut-exams')}
          size="lg"
          className="w-full gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          العودة لقائمة الامتحانات
        </Button>
      </div>
    </div>
  );
}

// مكون بطاقة الإحصائية
function StatCard({
  icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bgColor: string;
}) {
  return (
    <Card className={`${bgColor} border-0`}>
      <CardContent className="pt-4 pb-4 text-center">
        <div className={`${color} flex justify-center mb-2`}>{icon}</div>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </CardContent>
    </Card>
  );
}

// تنسيق الوقت المستغرق
function formatTimeSpent(seconds: number): string {
  if (!seconds || seconds <= 0) return '0 د';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}س ${minutes}د`;
  }
  return `${minutes} د`;
}
