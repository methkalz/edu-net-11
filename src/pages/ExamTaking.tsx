import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudentExams } from '@/hooks/useStudentExams';
import { ExamTimer } from '@/components/exam/ExamTimer';
import { ExamQuestion } from '@/components/exam/ExamQuestion';
import { ExamNavigationGrid } from '@/components/exam/ExamNavigationGrid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function ExamTaking() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { fetchAttemptDetails, saveAnswer, submitExam } = useStudentExams();
  
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (attemptId) {
      loadAttemptData();
    }
  }, [attemptId]);

  const loadAttemptData = async () => {
    if (!attemptId) return;
    
    setLoading(true);
    const data = await fetchAttemptDetails(attemptId);
    
    if (data) {
      setAttempt(data.attempt);
      setQuestions(data.questions || []);
      
      // تحميل الإجابات السابقة
      const existingAnswers = new Map();
      data.questions?.forEach((q: any) => {
        if (q.student_answer) {
          existingAnswers.set(q.question_id, q.student_answer);
        }
      });
      setAnswers(existingAnswers);
    }
    
    setLoading(false);
  };

  // الحفظ التلقائي
  useEffect(() => {
    const interval = setInterval(() => {
      saveCurrentAnswer();
    }, 30000); // كل 30 ثانية

    return () => clearInterval(interval);
  }, [currentQuestionIndex, answers]);

  const saveCurrentAnswer = useCallback(async () => {
    if (!attemptId || questions.length === 0) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    const answer = answers.get(currentQuestion?.question_id);
    
    if (answer && currentQuestion) {
      await saveAnswer(attemptId, currentQuestion.question_id, answer);
    }
  }, [attemptId, currentQuestionIndex, answers, questions]);

  const handleAnswerChange = (answer: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    setAnswers(prev => {
      const newAnswers = new Map(prev);
      newAnswers.set(currentQuestion.question_id, answer);
      return newAnswers;
    });

    // حفظ فوري
    if (attemptId) {
      saveAnswer(attemptId, currentQuestion.question_id, answer);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleQuestionSelect = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const handleTimeUp = async () => {
    toast.error('انتهى وقت الاختبار! سيتم تسليم الاختبار تلقائياً');
    await handleSubmitExam();
  };

  const handleSubmitExam = async () => {
    if (!attemptId) return;

    setSubmitting(true);
    const success = await submitExam(attemptId);
    setSubmitting(false);

    if (success) {
      navigate(`/exam-results/${attemptId}`);
    }
  };

  const answeredQuestions = new Set(
    Array.from(answers.keys()).map(qId => 
      questions.findIndex(q => q.question_id === qId)
    ).filter(idx => idx !== -1)
  );

  const answeredCount = answeredQuestions.size;
  const totalCount = questions.length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-lg text-muted-foreground">جاري تحميل الاختبار...</p>
        </div>
      </div>
    );
  }

  if (!attempt || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" dir="rtl">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">خطأ في تحميل الاختبار</h2>
            <p className="text-muted-foreground mb-4">تعذر تحميل بيانات الاختبار</p>
            <Button onClick={() => navigate('/dashboard')}>
              العودة للوحة التحكم
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8" dir="rtl">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">{attempt.teacher_exams?.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  السؤال {currentQuestionIndex + 1} من {totalCount}
                </p>
              </div>
              
              <ExamTimer
                durationMinutes={attempt.teacher_exams?.duration_minutes || 60}
                startTime={attempt.started_at}
                onTimeUp={handleTimeUp}
              />
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Current Question */}
            <ExamQuestion
              question={{
                ...currentQuestion.exam_questions,
                id: currentQuestion.question_id
              }}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={totalCount}
              currentAnswer={answers.get(currentQuestion.question_id)}
              onAnswerChange={handleAnswerChange}
            />

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                variant="outline"
              >
                <ArrowRight className="w-4 h-4 ml-2" />
                السابق
              </Button>

              <div className="text-sm text-muted-foreground">
                تم الإجابة: {answeredCount}/{totalCount}
              </div>

              {currentQuestionIndex === questions.length - 1 ? (
                <Button
                  onClick={() => setShowSubmitDialog(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 ml-2" />
                  إنهاء الاختبار
                </Button>
              ) : (
                <Button onClick={handleNextQuestion}>
                  التالي
                  <ArrowLeft className="w-4 h-4 mr-2" />
                </Button>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">خريطة الأسئلة</CardTitle>
              </CardHeader>
              <CardContent>
                <ExamNavigationGrid
                  totalQuestions={totalCount}
                  answeredQuestions={answeredQuestions}
                  currentQuestion={currentQuestionIndex}
                  onQuestionSelect={handleQuestionSelect}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد تسليم الاختبار</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>هل أنت متأكد من إنهاء الاختبار؟</p>
              <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
                <p>• عدد الأسئلة المجابة: {answeredCount}/{totalCount}</p>
                <p>• عدد الأسئلة غير المجابة: {totalCount - answeredCount}</p>
                {totalCount - answeredCount > 0 && (
                  <p className="text-amber-600 font-semibold">⚠️ لديك {totalCount - answeredCount} أسئلة غير مجابة</p>
                )}
              </div>
              <p className="text-destructive font-semibold">
                لن تتمكن من العودة بعد التسليم!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmitExam}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? 'جاري التسليم...' : 'تأكيد التسليم'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}