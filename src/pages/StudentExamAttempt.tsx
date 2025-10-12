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
import { ExamDebugger } from '@/lib/exam-debugging';
import { ExamDebugPanel } from '@/components/exam/ExamDebugPanel';

export default function StudentExamAttempt() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { answer: string; time_spent?: number }>>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);

  // تسجيل mount/unmount
  useEffect(() => {
    ExamDebugger.log({
      type: 'COMPONENT_MOUNTED',
      data: { examId }
    });
    
    return () => {
      ExamDebugger.log({
        type: 'COMPONENT_UNMOUNTED',
        data: { examId, attemptId }
      });
    };
  }, []);

  // إعادة تعيين الحالة عند تغيير examId
  useEffect(() => {
    ExamDebugger.log({
      type: 'NAVIGATION_CHANGED',
      data: { newExamId: examId }
    });
    
    setAttemptId(null);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setShowSubmitDialog(false);
    setRecoveryMode(false);
  }, [examId]);

  // جلب بيانات الامتحان
  const { data: examData, isLoading: examLoading } = useQuery({
    queryKey: ['exam-with-questions', examId],
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('غير مصرح');

        ExamDebugger.log({
          type: 'EXAM_DATA_LOADED',
          data: { examId, userId: user.id }
        });

        // استخدام دالة توليد الأسئلة التلقائية
        const { data, error } = await supabase
          .rpc('generate_exam_questions', {
            p_exam_id: examId,
            p_student_id: user.id
          });

        if (error) {
          ExamDebugger.log({
            type: 'EXAM_DATA_ERROR',
            data: { error: error.message }
          });
          throw error;
        }

        ExamDebugger.log({
          type: 'EXAM_DATA_LOADED',
          data: {
            examId: (data as any)?.exam?.id,
            questionsCount: (data as any)?.questions?.length,
            maxAttempts: (data as any)?.exam?.max_attempts
          }
        });

        return data as any as ExamWithQuestions;
      } catch (error: any) {
        ExamDebugger.log({
          type: 'EXAM_DATA_ERROR',
          data: { error: error.message }
        });
        throw error;
      }
    },
    enabled: !!examId,
  });

  // إنشاء أو استرجاع محاولة
  const createAttemptMutation = useMutation({
    mutationFn: async () => {
      ExamDebugger.log({
        type: 'ATTEMPT_CREATION_STARTED',
        data: { examId }
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('غير مصرح');

      logger.info('🔍 التحقق من وجود محاولات سابقة...', { examId, userId: user.id });

      // التحقق من وجود محاولة قيد التقدم
      const { data: inProgressAttempt } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('exam_id', examId!)
        .eq('student_id', user.id)
        .eq('status', 'in_progress')
        .maybeSingle();

      // إذا كانت هناك محاولة قيد التقدم، استخدامها
      if (inProgressAttempt) {
        ExamDebugger.log({
          type: 'ATTEMPT_RESUMED',
          data: { attemptId: inProgressAttempt.id }
        });
        logger.info('✅ تم العثور على محاولة قيد التقدم', { 
          attemptId: inProgressAttempt.id 
        });
        return inProgressAttempt;
      }

      // التحقق من عدد المحاولات المكتملة
      const { count: completedAttempts } = await supabase
        .from('exam_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('exam_id', examId!)
        .eq('student_id', user.id)
        .eq('status', 'submitted');

      logger.info('📊 عدد المحاولات المكتملة', { 
        completedAttempts,
        maxAttempts: examData?.exam.max_attempts 
      });

      // التحقق من عدد المحاولات المسموح بها
      if (completedAttempts && completedAttempts >= (examData?.exam.max_attempts || 1)) {
        logger.warn('⚠️ تم استنفاد جميع المحاولات المسموح بها');
        throw new Error(`لقد استنفدت جميع المحاولات المسموح بها (${examData?.exam.max_attempts || 1})`);
      }

      // حساب رقم المحاولة الجديدة
      const attemptNumber = (completedAttempts || 0) + 1;

      // إنشاء محاولة جديدة
      logger.info('➕ إنشاء محاولة جديدة...', { attemptNumber });
      const schoolData = await supabase.from('profiles').select('school_id').eq('user_id', user.id).single();

      const { data, error } = await supabase
        .from('exam_attempts')
        .insert([{
          exam_id: examId!,
          student_id: user.id,
          school_id: schoolData.data?.school_id!,
          status: 'in_progress' as any,
          attempt_number: attemptNumber,
          questions_data: examData?.questions || [],
          answers: {},
        }] as any)
        .select()
        .single();

      if (error) {
        ExamDebugger.log({
          type: 'ATTEMPT_CREATION_FAILED',
          data: { error: error.message }
        });
        logger.error('❌ فشل إنشاء المحاولة', error instanceof Error ? error : new Error(String(error)), { originalError: error });
        throw error;
      }
      
      ExamDebugger.log({
        type: 'ATTEMPT_CREATED',
        data: { attemptId: data.id, attemptNumber }
      });
      logger.info('✅ تم إنشاء محاولة جديدة بنجاح', { attemptId: data.id, attemptNumber });
      return data;
    },
    retry: 3, // إعادة المحاولة 3 مرات
    retryDelay: 1000, // تأخير ثانية واحدة بين المحاولات
    onSuccess: (data) => {
      setAttemptId(data.id);
      ExamDebugger.log({
        type: 'ATTEMPT_CREATED',
        data: {
          attemptId: data.id,
          attemptNumber: data.attempt_number,
          status: data.status
        }
      });
      logger.info('✅ تم تعيين attemptId', { attemptId: data.id });
      
      // تحميل الإجابات السابقة إذا كانت موجودة
      if (data.answers && typeof data.answers === 'object' && Object.keys(data.answers).length > 0) {
        setAnswers(data.answers as Record<string, { answer: string; time_spent?: number }>);
        logger.info('✅ تم تحميل الإجابات السابقة', { answersCount: Object.keys(data.answers).length });
      }
    },
    onError: (error: any) => {
      ExamDebugger.log({
        type: 'ATTEMPT_CREATION_FAILED',
        data: { error: error.message }
      });
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
      ExamDebugger.log({
        type: 'SUBMIT_STARTED',
        data: {
          attemptId,
          answersCount: Object.keys(answers).length
        }
      });

      // فحص متقدم قبل التقديم
      ExamDebugger.validateState('StudentExamAttempt', {
        attemptId,
        examData,
        hasStarted: true,
        answersCount: Object.keys(answers).length,
        createMutationStatus: createAttemptMutation.status
      });

      logger.info('🚀 submitExamMutation.mutationFn بدأ التنفيذ', {
        attemptId,
        answersCount: Object.keys(answers).length,
        answers
      });

      if (!attemptId) {
        ExamDebugger.log({
          type: 'SUBMIT_FAILED_NO_ATTEMPT',
          data: {
            examId,
            answersCount: Object.keys(answers).length,
            createMutationStatus: createAttemptMutation.status
          }
        });
        logger.error('❌ لا يوجد attemptId', undefined, { attemptId });
        throw new Error('لا يوجد محاولة نشطة');
      }

      ExamDebugger.log({
        type: 'SUBMIT_UPDATE_STARTED',
        data: { attemptId, answersCount: Object.keys(answers).length }
      });
      logger.info('✅ attemptId موجود، سيتم تحديث الإجابات', { attemptId });

      try {
        // تحديث الإجابات أولاً
        logger.info('🔄 بدء تحديث الإجابات...', { answers });
        await updateAttemptMutation.mutateAsync(answers);
        ExamDebugger.log({
          type: 'SUBMIT_UPDATE_SUCCESS',
          data: { answersCount: Object.keys(answers).length }
        });
        logger.info('✅ تم تحديث الإجابات بنجاح');
      } catch (error) {
        ExamDebugger.log({
          type: 'SUBMIT_UPDATE_FAILED',
          data: { error: error instanceof Error ? error.message : String(error) }
        });
        logger.error('❌ فشل تحديث الإجابات', error instanceof Error ? error : new Error(String(error)), { originalError: error });
        throw error;
      }

      try {
        // تقديم الامتحان
        ExamDebugger.log({
          type: 'SUBMIT_RPC_STARTED',
          data: { attemptId }
        });
        logger.info('🔄 بدء استدعاء submit_exam_attempt...', { attemptId });
        const { data, error } = await supabase
          .rpc('submit_exam_attempt', { p_attempt_id: attemptId });

        if (error) {
          ExamDebugger.log({
            type: 'SUBMIT_RPC_FAILED',
            data: { error: error.message }
          });
          logger.error('❌ خطأ من submit_exam_attempt', error instanceof Error ? error : new Error(String(error)), { originalError: error });
          throw error;
        }
        
        ExamDebugger.log({
          type: 'SUBMIT_RPC_SUCCESS',
          data: { result: data }
        });
        logger.info('✅ تم تقديم الامتحان بنجاح', { data });
        return data;
      } catch (error) {
        ExamDebugger.log({
          type: 'SUBMIT_FAILED',
          data: { error: error instanceof Error ? error.message : String(error) }
        });
        logger.error('❌ فشل تقديم الامتحان', error instanceof Error ? error : new Error(String(error)), { originalError: error });
        throw error;
      }
    },
    onSuccess: (data) => {
      ExamDebugger.log({
        type: 'SUBMIT_SUCCESS',
        data: { attemptId }
      });
      logger.info('🎉 submitExamMutation.onSuccess', { data });
      toast({
        title: 'تم تقديم الامتحان',
        description: 'تم تقديم إجاباتك بنجاح',
      });
      navigate(`/student/exam-result/${attemptId}`);
    },
    onError: (error: any) => {
      ExamDebugger.log({
        type: 'SUBMIT_FAILED',
        data: {
          error: error?.message,
          code: error?.code,
          details: error?.details
        }
      });
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
      ExamDebugger.log({
        type: 'TIMER_EXPIRED',
        data: { attemptId }
      });
      toast({
        title: 'انتهى الوقت',
        description: 'سيتم تقديم الامتحان تلقائياً',
        variant: 'destructive',
      });
      submitExamMutation.mutate();
    },
    startImmediately: !!attemptId,
  });

  // تسجيل بدء المؤقت
  useEffect(() => {
    if (attemptId && remainingSeconds > 0) {
      ExamDebugger.log({
        type: 'TIMER_STARTED',
        data: { 
          attemptId, 
          durationMinutes: examData?.exam.duration_minutes,
          remainingSeconds 
        }
      });
    }
  }, [attemptId]);

  // تحذير عند اقتراب نهاية الوقت
  useEffect(() => {
    if (isLastFiveMinutes && !isTimeUp) {
      ExamDebugger.log({
        type: 'TIMER_WARNING',
        data: { remainingSeconds }
      });
    }
  }, [isLastFiveMinutes]);

  // إنشاء محاولة عند تحميل الامتحان
  useEffect(() => {
    if (examData && !attemptId && !createAttemptMutation.isPending) {
      createAttemptMutation.mutate();
    }
  }, [examData, attemptId, createAttemptMutation.isPending]);

  // Recovery Mode - إذا لم يتم إنشاء attemptId بعد 5 ثواني
  useEffect(() => {
    if (!examData) return;

    const timer = setTimeout(() => {
      if (!attemptId && !createAttemptMutation.isPending && !createAttemptMutation.isError) {
        ExamDebugger.log({
          type: 'RECOVERY_MODE_ACTIVATED',
          data: { 
            reason: 'attemptId not created after 5 seconds',
            mutationStatus: createAttemptMutation.status
          }
        });
        setRecoveryMode(true);
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [examData, attemptId, createAttemptMutation.isPending, createAttemptMutation.isError]);

  // حفظ الإجابات تلقائياً كل 30 ثانية
  useEffect(() => {
    if (!attemptId) return;

    const interval = setInterval(() => {
      ExamDebugger.log({
        type: 'AUTO_SAVE_TRIGGERED',
        data: { attemptId, answersCount: Object.keys(answers).length }
      });
      
      updateAttemptMutation.mutate(answers, {
        onSuccess: () => {
          ExamDebugger.log({
            type: 'AUTO_SAVE_SUCCESS',
            data: { answersCount: Object.keys(answers).length }
          });
        },
        onError: (error) => {
          ExamDebugger.log({
            type: 'AUTO_SAVE_FAILED',
            data: { error: error instanceof Error ? error.message : String(error) }
          });
        }
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [attemptId, answers]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    ExamDebugger.log({
      type: 'ANSWER_CHANGED',
      data: { 
        questionId: questionId.substring(0, 8), 
        answerLength: answer.length,
        totalAnswers: Object.keys(answers).length + 1
      }
    });
    
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
    // فحص وجود attemptId قبل التقديم
    if (!attemptId) {
      ExamDebugger.log({
        type: 'SUBMIT_VALIDATION_FAILED',
        data: {
          reason: 'No attemptId',
          examData: !!examData,
          hasAnswers: Object.keys(answers).length > 0,
          createMutationStatus: createAttemptMutation.status
        }
      });
      
      toast({
        title: 'خطأ في النظام',
        description: 'لم يتم تسجيل محاولة الامتحان. يرجى تحديث الصفحة والمحاولة مرة أخرى.',
        variant: 'destructive'
      });
      return;
    }

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
      {/* Recovery Mode Alert */}
      {recoveryMode && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>حدث خطأ في تسجيل محاولة الامتحان. يرجى تحديث الصفحة.</span>
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
              className="mr-4"
            >
              تحديث الصفحة
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Debug Panel - يظهر فقط في وضع التطوير */}
      <ExamDebugPanel 
        currentState={{
          examId,
          attemptId,
          examData,
          isLoading: examLoading,
          hasStarted: !!attemptId,
          answersCount: Object.keys(answers).length,
          currentQuestionIndex,
          remainingSeconds,
          createMutationStatus: createAttemptMutation.status,
          submitMutationStatus: submitExamMutation.status
        }}
      />

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
