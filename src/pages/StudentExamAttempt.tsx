import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { useToast } from '@/hooks/use-toast';
import { ExamQuestion } from '@/components/exam/ExamQuestion';
import { ExamNavigationGrid } from '@/components/exam/ExamNavigationGrid';
import { useExamTimer } from '@/hooks/useExamTimer';
import { ExamWithQuestions } from '@/types/exam';
import { AlertCircle, Clock, ChevronRight, ChevronLeft, Send } from 'lucide-react';
import { logger } from '@/lib/logging';

export default function StudentExamAttempt() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { answer: string; time_spent?: number }>>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  // جلب بيانات الامتحان
  const { data: examData, isLoading: examLoading } = useQuery({
    queryKey: ['exam-with-questions', examId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('غير مصرح');

      // استخدام دالة توليد الأسئلة التلقائية
      const { data, error } = await supabase
        .rpc('generate_exam_questions', {
          p_exam_id: examId,
          p_student_id: user.id
        });

      if (error) throw error;
      return data as any as ExamWithQuestions;
    },
    enabled: !!examId,
  });

  // إنشاء أو استرجاع محاولة
  const createAttemptMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('غير مصرح');

      logger.info('🔍 التحقق من وجود محاولة سابقة...', { examId, userId: user.id });

      // التحقق من وجود محاولة سابقة
      const { data: existingAttempt, error: checkError } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('exam_id', examId!)
        .eq('student_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        logger.error('❌ خطأ في التحقق من المحاولة', checkError instanceof Error ? checkError : new Error(String(checkError)), { originalError: checkError });
        throw checkError;
      }

      // إذا كانت هناك محاولة سابقة
      if (existingAttempt) {
        logger.info('✅ تم العثور على محاولة سابقة', { 
          attemptId: existingAttempt.id, 
          status: existingAttempt.status 
        });

        if (existingAttempt.status === 'submitted') {
          logger.warn('⚠️ المحاولة السابقة مكتملة');
          throw new Error('لقد قمت بتقديم هذا الامتحان مسبقاً');
        }

        // استخدام المحاولة السابقة إذا كانت قيد التقدم
        logger.info('🔄 استخدام المحاولة السابقة');
        return existingAttempt;
      }

      // إنشاء محاولة جديدة
      logger.info('➕ إنشاء محاولة جديدة...');
      const schoolData = await supabase.from('profiles').select('school_id').eq('user_id', user.id).single();

      const { data, error } = await supabase
        .from('exam_attempts')
        .insert([{
          exam_id: examId!,
          student_id: user.id,
          school_id: schoolData.data?.school_id!,
          status: 'in_progress' as any,
          questions_data: examData?.questions || [],
          answers: {},
        }] as any)
        .select()
        .single();

      if (error) {
        logger.error('❌ فشل إنشاء المحاولة', error instanceof Error ? error : new Error(String(error)), { originalError: error });
        throw error;
      }
      
      logger.info('✅ تم إنشاء محاولة جديدة بنجاح', { attemptId: data.id });
      return data;
    },
    onSuccess: (data) => {
      setAttemptId(data.id);
      logger.info('✅ تم تعيين attemptId', { attemptId: data.id });
      
      // تحميل الإجابات السابقة إذا كانت موجودة
      if (data.answers && typeof data.answers === 'object' && Object.keys(data.answers).length > 0) {
        setAnswers(data.answers as Record<string, { answer: string; time_spent?: number }>);
        logger.info('✅ تم تحميل الإجابات السابقة', { answersCount: Object.keys(data.answers).length });
      }
    },
    onError: (error: any) => {
      logger.error('💥 خطأ في createAttemptMutation', error instanceof Error ? error : new Error(String(error)), { originalError: error });
    },
  });

  // تحديث المحاولة
  const updateAttemptMutation = useMutation({
    mutationFn: async (updatedAnswers: Record<string, { answer: string; time_spent?: number }>) => {
      if (!attemptId) return;

      const { error } = await supabase
        .from('exam_attempts')
        .update({
          answers: updatedAnswers,
          time_spent_seconds: (examData?.exam.duration_minutes || 0) * 60 - remainingSeconds,
        })
        .eq('id', attemptId);

      if (error) throw error;
    },
  });

  // تقديم الامتحان
  const submitExamMutation = useMutation({
    mutationFn: async () => {
      logger.info('🚀 submitExamMutation.mutationFn بدأ التنفيذ', {
        attemptId,
        answersCount: Object.keys(answers).length,
        answers
      });

      if (!attemptId) {
        logger.error('❌ لا يوجد attemptId', undefined, { attemptId });
        throw new Error('لا يوجد محاولة نشطة');
      }

      logger.info('✅ attemptId موجود، سيتم تحديث الإجابات', { attemptId });

      try {
        // تحديث الإجابات أولاً
        logger.info('🔄 بدء تحديث الإجابات...', { answers });
        await updateAttemptMutation.mutateAsync(answers);
        logger.info('✅ تم تحديث الإجابات بنجاح');
      } catch (error) {
        logger.error('❌ فشل تحديث الإجابات', error instanceof Error ? error : new Error(String(error)), { originalError: error });
        throw error;
      }

      try {
        // تقديم الامتحان
        logger.info('🔄 بدء استدعاء submit_exam_attempt...', { attemptId });
        const { data, error } = await supabase
          .rpc('submit_exam_attempt', { p_attempt_id: attemptId });

        if (error) {
          logger.error('❌ خطأ من submit_exam_attempt', error instanceof Error ? error : new Error(String(error)), { originalError: error });
          throw error;
        }
        
        logger.info('✅ تم تقديم الامتحان بنجاح', { data });
        return data;
      } catch (error) {
        logger.error('❌ فشل تقديم الامتحان', error instanceof Error ? error : new Error(String(error)), { originalError: error });
        throw error;
      }
    },
    onSuccess: (data) => {
      logger.info('🎉 submitExamMutation.onSuccess', { data });
      toast({
        title: 'تم تقديم الامتحان',
        description: 'تم تقديم إجاباتك بنجاح',
      });
      navigate(`/student/exam-result/${attemptId}`);
    },
    onError: (error: any) => {
      logger.error('💥 submitExamMutation.onError', error instanceof Error ? error : new Error(String(error)), { 
        originalError: error,
        errorMessage: error?.message,
        errorCode: error?.code,
        errorDetails: error?.details,
        fullError: JSON.stringify(error, null, 2)
      });
      toast({
        title: 'فشل تقديم الامتحان',
        description: error?.message || 'حدث خطأ أثناء تقديم الامتحان',
        variant: 'destructive',
      });
    },
  });

  const { remainingSeconds, formattedTime, isLastFiveMinutes, isTimeUp } = useExamTimer({
    durationMinutes: examData?.exam.duration_minutes || 60,
    onTimeUp: () => {
      toast({
        title: 'انتهى الوقت',
        description: 'سيتم تقديم الامتحان تلقائياً',
        variant: 'destructive',
      });
      submitExamMutation.mutate();
    },
    startImmediately: !!attemptId,
  });

  // إنشاء محاولة عند تحميل الامتحان
  useEffect(() => {
    if (examData && !attemptId && !createAttemptMutation.isPending) {
      createAttemptMutation.mutate();
    }
  }, [examData]);

  // حفظ الإجابات تلقائياً كل 30 ثانية
  useEffect(() => {
    if (!attemptId) return;

    const interval = setInterval(() => {
      updateAttemptMutation.mutate(answers);
    }, 30000);

    return () => clearInterval(interval);
  }, [attemptId, answers]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { answer, time_spent: 0 },
    }));
  };

  const answeredQuestions = new Set(
    Object.keys(answers).map(id => {
      const index = examData?.questions.findIndex(q => q.id === id);
      return index !== undefined ? index : -1;
    }).filter(idx => idx !== -1)
  );

  const handleSubmitClick = () => {
    logger.info('🔴🔴🔴 handleSubmitClick تم استدعاؤه', {
      answeredCount: answeredQuestions.size,
      totalQuestions: examData?.questions.length || 0,
      showSubmitDialog: showSubmitDialog
    });
    
    const unansweredCount = (examData?.questions.length || 0) - answeredQuestions.size;
    
    if (unansweredCount > 0) {
      logger.info('🟡 يوجد أسئلة غير مجابة، فتح نافذة التأكيد', { 
        unansweredCount,
        willOpenDialog: true 
      });
      setShowSubmitDialog(true);
      logger.info('🟢 تم استدعاء setShowSubmitDialog(true)');
    } else {
      logger.info('🟢 جميع الأسئلة مجابة، تقديم الامتحان مباشرة');
      submitExamMutation.mutate();
    }
  };

  const handleConfirmSubmit = () => {
    logger.info('تأكيد تقديم الامتحان');
    setShowSubmitDialog(false);
    submitExamMutation.mutate();
  };

  if (examLoading || createAttemptMutation.isPending) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-lg">جاري تحميل الامتحان...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!examData || !examData.questions || examData.questions.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {!examData ? 'فشل في تحميل الامتحان' : 'الأقسام المحددة في هذا الامتحان لا تحتوي على أسئلة. يرجى الاتصال بالمعلم لإعادة إنشاء الامتحان مع اختيار أقسام تحتوي على أسئلة.'}
          </AlertDescription>
        </Alert>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => navigate('/student/dashboard')}
        >
          العودة إلى لوحة التحكم
        </Button>
      </div>
    );
  }

  const currentQuestion = examData.questions[currentQuestionIndex];

  if (!currentQuestion) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>خطأ في تحميل السؤال الحالي</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 sm:p-6 max-w-6xl">
      {/* Header */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4">
            <CardTitle className="text-lg sm:text-2xl">{examData.exam.title}</CardTitle>
            <div className={`flex items-center gap-2 text-base sm:text-lg font-semibold ${isLastFiveMinutes ? 'text-destructive' : ''}`}>
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{formattedTime}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Navigation Grid */}
        <Card className="lg:col-span-1 order-2 lg:order-1">
          <CardHeader className="p-4">
            <CardTitle className="text-base sm:text-lg">الأسئلة</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ExamNavigationGrid
              totalQuestions={examData.questions.length}
              answeredQuestions={answeredQuestions}
              currentQuestion={currentQuestionIndex}
              onQuestionSelect={setCurrentQuestionIndex}
            />
          </CardContent>
        </Card>

        {/* Question Area */}
        <div className="lg:col-span-3 space-y-4 sm:space-y-6 order-1 lg:order-2">
          <ExamQuestion
            question={{
              id: currentQuestion.id,
              question_text: currentQuestion.question_text,
              question_type: currentQuestion.question_type as 'multiple_choice' | 'true_false' | 'essay',
              choices: currentQuestion.choices?.map(c => ({ text: c.text, value: c.id })),
              points: currentQuestion.points,
            }}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={examData.questions.length}
            currentAnswer={answers[currentQuestion.id]?.answer}
            onAnswerChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
          />

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch justify-between gap-3 w-full">
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                onClick={() => {
                  logger.info('زر السابق تم النقر عليه');
                  setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
                }}
                disabled={currentQuestionIndex === 0}
                className="flex-1 min-h-[48px] text-base font-semibold"
              >
                <ChevronRight className="w-5 h-5 ml-2" />
                السابق
              </Button>

              {currentQuestionIndex < examData.questions.length - 1 && (
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    logger.info('زر التالي تم النقر عليه');
                    setCurrentQuestionIndex((prev) => 
                      Math.min(examData.questions.length - 1, prev + 1)
                    );
                  }}
                  className="flex-1 min-h-[48px] text-base font-semibold"
                >
                  التالي
                  <ChevronLeft className="w-5 h-5 mr-2" />
                </Button>
              )}
            </div>

            {currentQuestionIndex === examData.questions.length - 1 && (
              <Button
                type="button"
                onClick={() => {
                  logger.info('🔴🔴🔴 زر تقديم الامتحان تم النقر عليه', {
                    currentQuestionIndex,
                    totalQuestions: examData.questions.length
                  });
                  handleSubmitClick();
                }}
                disabled={submitExamMutation.isPending}
                className="w-full min-h-[56px] text-base font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg"
              >
                <Send className="w-5 h-5 ml-2" />
                {submitExamMutation.isPending ? 'جاري التسليم...' : 'تقديم الامتحان'}
              </Button>
            )}
          </div>

          {/* Progress Info */}
          <Alert>
            <AlertDescription>
              تم الإجابة على {answeredQuestions.size} من {examData.questions.length} سؤال
            </AlertDescription>
          </Alert>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog 
        open={showSubmitDialog} 
        onOpenChange={(open) => {
          logger.info('🔵 AlertDialog onOpenChange:', { open });
          setShowSubmitDialog(open);
        }}
      >
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md z-[100]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">تأكيد تقديم الامتحان</AlertDialogTitle>
            <AlertDialogDescription className="text-sm sm:text-base">
              لم تجب على {(examData?.questions.length || 0) - answeredQuestions.size} سؤال.
              هل أنت متأكد من أنك تريد تقديم الامتحان الآن؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel 
              className="w-full sm:w-auto"
              onClick={() => logger.info('🔴 تم النقر على إلغاء')}
            >
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmSubmit}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
            >
              نعم، قدم الامتحان
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
