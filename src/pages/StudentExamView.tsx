import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useExamSession } from '@/hooks/useExamSession';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

const StudentExamView = () => {
  const { templateId } = useParams();
  const [searchParams] = useSearchParams();
  const instanceId = searchParams.get('instance');
  const navigate = useNavigate();

  const {
    loading,
    currentAttempt,
    questions,
    startExamAttempt,
    submitAnswer,
    finishExam
  } = useExamSession();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0); // بالدقائق
  const [isSubmitting, setIsSubmitting] = useState(false);

  // بدء الامتحان عند التحميل
  useEffect(() => {
    if (templateId && instanceId && !currentAttempt) {
      startExamAttempt(templateId, instanceId);
    }
  }, [templateId, instanceId, currentAttempt, startExamAttempt]);

  // Timer
  useEffect(() => {
    if (!currentAttempt) return;

    // حساب الوقت المتبقي
    const calculateTimeRemaining = async () => {
      const { data: template } = await supabase
        .from('exam_templates')
        .select('duration_minutes')
        .eq('id', templateId)
        .single();

      if (!template) return;

      const startTime = new Date(currentAttempt.started_at);
      const now = new Date();
      const elapsedMinutes = (now.getTime() - startTime.getTime()) / 60000;
      const remaining = Math.max(0, template.duration_minutes - elapsedMinutes);
      
      setTimeRemaining(remaining);
    };

    calculateTimeRemaining();

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          handleFinishExam(true); // إنهاء تلقائي
          return 0;
        }
        return prev - 1/60; // تقليل كل ثانية
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentAttempt]);

  // حفظ تلقائي كل 30 ثانية
  useEffect(() => {
    if (!currentAttempt || Object.keys(answers).length === 0) return;

    const autoSave = setInterval(() => {
      Object.entries(answers).forEach(([questionId, answer]) => {
        if (answer) {
          submitAnswer(currentAttempt.id, questionId, answer);
        }
      });
    }, 30000);

    return () => clearInterval(autoSave);
  }, [answers, currentAttempt, submitAnswer]);

  // منع الخروج بدون تأكيد
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentAttempt && currentAttempt.status === 'in_progress') {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentAttempt]);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value
    }));

    // حفظ فوري للإجابة
    if (currentAttempt) {
      submitAnswer(currentAttempt.id, questionId, value);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleFinishExam = async (autoFinish = false) => {
    if (!currentAttempt) return;

    if (!autoFinish) {
      const confirmed = window.confirm('هل أنت متأكد من إنهاء الامتحان؟ لن تتمكن من العودة بعد الإنهاء.');
      if (!confirmed) return;
    }

    setIsSubmitting(true);

    // حفظ جميع الإجابات قبل الإنهاء
    await Promise.all(
      Object.entries(answers).map(([questionId, answer]) =>
        submitAnswer(currentAttempt.id, questionId, answer)
      )
    );

    const result = await finishExam(currentAttempt.id);

    if (result) {
      navigate(`/exam/results/${result.id}`);
    } else {
      setIsSubmitting(false);
      toast.error('فشل إنهاء الامتحان، يرجى المحاولة مرة أخرى');
    }
  };

  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.floor((minutes % 1) * 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).length;
  const progressPercentage = (answeredCount / questions.length) * 100;

  if (loading || !currentAttempt || !currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل الامتحان...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4" dir="rtl">
      {/* Header - Timer & Progress */}
      <div className="mb-6 space-y-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className={`w-5 h-5 ${timeRemaining < 5 ? 'text-destructive animate-pulse' : 'text-primary'}`} />
              <span className={`font-mono text-lg font-bold ${timeRemaining < 5 ? 'text-destructive' : 'text-foreground'}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              السؤال {currentQuestionIndex + 1} من {questions.length}
            </div>
          </CardContent>
        </Card>

        {timeRemaining < 5 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              تبقى أقل من 5 دقائق! يرجى الإسراع في إكمال الامتحان
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>تم الإجابة على {answeredCount} من {questions.length} سؤال</span>
            <span>{progressPercentage.toFixed(0)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </div>

      {/* Question Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
              {currentQuestionIndex + 1}
            </span>
            {currentQuestion.question_text}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentQuestion.question_type === 'multiple_choice' ? (
            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
            >
              {currentQuestion.choices?.map((choice: any, index: number) => (
                <div key={index} className="flex items-center space-x-2 space-x-reverse p-3 rounded-lg hover:bg-accent transition-colors">
                  <RadioGroupItem value={choice.value} id={`choice-${index}`} />
                  <Label htmlFor={`choice-${index}`} className="flex-1 cursor-pointer">
                    {choice.text}
                  </Label>
                  {answers[currentQuestion.id] === choice.value && (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  )}
                </div>
              ))}
            </RadioGroup>
          ) : (
            <p className="text-muted-foreground">نوع السؤال غير مدعوم</p>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-4 mb-6">
        <Button
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
          variant="outline"
          size="lg"
        >
          ← السابق
        </Button>

        {currentQuestionIndex === questions.length - 1 ? (
          <Button
            onClick={() => handleFinishExam(false)}
            disabled={isSubmitting}
            size="lg"
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            {isSubmitting ? 'جاري الإنهاء...' : 'إنهاء الامتحان'}
          </Button>
        ) : (
          <Button
            onClick={handleNextQuestion}
            size="lg"
          >
            التالي →
          </Button>
        )}
      </div>

      {/* Quick Navigation Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">الانتقال السريع للأسئلة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-8 gap-2">
            {questions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`
                  w-10 h-10 rounded-md font-semibold text-sm transition-all
                  ${index === currentQuestionIndex 
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2' 
                    : answers[q.id]
                    ? 'bg-primary/20 text-primary hover:bg-primary/30'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }
                `}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentExamView;

// Import supabase
import { supabase } from '@/integrations/supabase/client';
