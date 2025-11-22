import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  const [attemptStartedAt, setAttemptStartedAt] = useState<string | null>(null);
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

  // إعادة تعيين الحالة عند mount الكومبوننت
  useEffect(() => {
    logger.info('🔄 Component mounted - resetting ALL state including mutation');
    setAttemptId(null);
    setAttemptStartedAt(null); // إعادة تعيين وقت البدء
    setAnswers({});
    setCurrentQuestionIndex(0);
    setRecoveryMode(false);
    
    // ⭐ Reset mutation state أيضاً عند mount
    createAttemptMutation.reset();
    
    return () => {
      // Cleanup عند unmount
      ExamDebugger.log({
        type: 'COMPONENT_UNMOUNTED',
        data: { examId, attemptId }
      });
    };
  }, []); // empty array - يعمل مرة واحدة فقط عند mount

  // تتبع تغيير examId
  useEffect(() => {
    ExamDebugger.log({
      type: 'NAVIGATION_CHANGED',
      data: { newExamId: examId }
    });
    
    logger.info('📍 examId changed - resetting attempt state', { examId });
    setAttemptId(null);
    setAnswers({});
    
    // ⭐ إعادة تعيين state الـ mutation
    createAttemptMutation.reset();
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
            maxAttempts: (data as any)?.exam?.max_attempts,
            warnings: (data as any)?.warnings,
            hasFallback: (data as any)?.has_fallback
          }
        });

        // ✅ عرض تنبيه إذا كان هناك fallback
        if ((data as any)?.has_fallback && (data as any)?.warnings?.length > 0) {
          const warnings = (data as any).warnings;
          console.warn('⚠️ Exam generated with fallback:', warnings);
        }

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
    retry: (failureCount, error: any) => {
      // لا تعيد المحاولة إذا كان الخطأ "استنفاد المحاولات"
      if (error?.message?.includes('استنفدت جميع المحاولات') || error?.message?.includes('استنفاد المحاولات')) {
        logger.warn('🛑 Retry stopped - max attempts reached');
        return false;
      }
      // أعد المحاولة فقط للأخطاء الشبكية
      return failureCount < 3;
    },
    retryDelay: 1000, // تأخير ثانية واحدة بين المحاولات
    onSuccess: (data) => {
      setAttemptId(data.id);
      setAttemptStartedAt(data.started_at); // حفظ وقت بدء المحاولة
      ExamDebugger.log({
        type: 'ATTEMPT_CREATED',
        data: {
          attemptId: data.id,
          attemptNumber: data.attempt_number,
          status: data.status,
          startedAt: data.started_at
        }
      });
      logger.info('✅ تم تعيين attemptId', { attemptId: data.id, startedAt: data.started_at });
      
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

      logger.info('🚀 submitExamMutation بدأ التنفيذ', {
        attemptId,
        answersCount: Object.keys(answers).length,
        answers: answers,
        isTimeUp: timer.isTimeUp,
        remainingSeconds,
        submitType: timer.isTimeUp ? 'auto' : 'manual'
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

  const timer = useExamTimer({
    durationMinutes: examData?.exam.duration_minutes || 60,
    startedAt: attemptStartedAt, // تمرير وقت البدء الفعلي من قاعدة البيانات
    onTimeUp: async () => {
      ExamDebugger.log({
        type: 'TIMER_EXPIRED',
        data: { attemptId, answersCount: Object.keys(answers).length }
      });
      
      logger.info('⏰ انتهى الوقت - بدء التقديم التلقائي', { 
        attemptId, 
        answersCount: Object.keys(answers).length 
      });
      
      toast({
        title: '⏰ انتهى وقت الامتحان',
        description: 'جاري تقديم الامتحان تلقائياً...',
        variant: 'destructive',
      });
      
      // ✅ حفظ الإجابات قبل التقديم
      if (attemptId && !submitExamMutation.isPending) {
        try {
          // حفظ الإجابات الحالية أولاً
          if (Object.keys(answers).length > 0) {
            logger.info('💾 حفظ الإجابات قبل التقديم التلقائي', { answers });
            await updateAttemptMutation.mutateAsync(answers);
            logger.info('✅ تم حفظ الإجابات بنجاح');
          } else {
            logger.warn('⚠️ لا توجد إجابات لحفظها');
          }
          
          // ثم تقديم الامتحان
          logger.info('🚀 بدء تقديم الامتحان تلقائياً');
          submitExamMutation.mutate();
        } catch (error) {
          logger.error('❌ فشل حفظ الإجابات قبل التقديم التلقائي', error instanceof Error ? error : new Error(String(error)));
          // حتى لو فشل الحفظ، نقدم الامتحان بالإجابات الموجودة
          submitExamMutation.mutate();
        }
      }
    },
    startImmediately: false, // سيتم بدء العداد يدوياً عند إنشاء attemptId
  });
  
  const { remainingSeconds, formattedTime, isLastFiveMinutes, isTimeUp } = timer;

  // بدء العداد عند إنشاء أو استئناف المحاولة
  useEffect(() => {
    if (attemptId && !timer.isRunning && !timer.isTimeUp && remainingSeconds > 0 && attemptStartedAt) {
      logger.info('⏰ بدء العداد التنازلي', { 
        attemptId, 
        durationMinutes: examData?.exam.duration_minutes,
        remainingSeconds,
        startedAt: attemptStartedAt,
        calculatedRemaining: remainingSeconds
      });
      ExamDebugger.log({
        type: 'TIMER_STARTED',
        data: { 
          attemptId, 
          durationMinutes: examData?.exam.duration_minutes,
          remainingSeconds,
          startedAt: attemptStartedAt
        }
      });
      timer.start();
    }
  }, [attemptId, attemptStartedAt, timer, examData, remainingSeconds]);

  // تحذير عند اقتراب نهاية الوقت
  useEffect(() => {
    if (isLastFiveMinutes && !isTimeUp) {
      ExamDebugger.log({
        type: 'TIMER_WARNING',
        data: { remainingSeconds }
      });
      
      // تحذير عند بقاء دقيقة واحدة فقط
      if (remainingSeconds === 60) {
        toast({
          title: '⚠️ تحذير: بقيت دقيقة واحدة فقط!',
          description: 'سيتم تقديم الامتحان تلقائياً عند انتهاء الوقت',
          variant: 'destructive',
        });
      }
    }
  }, [isLastFiveMinutes, remainingSeconds]);

  // إنشاء محاولة عند تحميل الامتحان
  useEffect(() => {
    logger.info('🔍 useEffect check for attempt creation', {
      hasExamData: !!examData,
      hasAttemptId: !!attemptId,
      isPending: createAttemptMutation.isPending,
      isSuccess: createAttemptMutation.isSuccess,
      isError: createAttemptMutation.isError,
      mutationStatus: createAttemptMutation.status
    });

    if (examData && !attemptId && !createAttemptMutation.isPending && !createAttemptMutation.isSuccess) {
      logger.info('✅ Conditions met - creating new attempt');
      createAttemptMutation.mutate();
    }
  }, [examData, attemptId, createAttemptMutation.isPending, createAttemptMutation.isSuccess]); // ⭐ إضافة كل المتغيرات المستخدمة

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

  // حساب الأسئلة غير المجابة مع أرقامها
  const unansweredQuestionNumbers = examData?.questions
    .map((q, index) => ({ id: q.id, number: index + 1 }))
    .filter(q => !answers[q.id])
    .map(q => q.number) || [];

  const allQuestionsAnswered = unansweredQuestionNumbers.length === 0;

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

    // إذا كان هناك أسئلة غير مجابة، عرض رسالة تحذيرية
    if (unansweredQuestionNumbers.length > 0) {
      const questionsList = unansweredQuestionNumbers.join(' - ');
      toast({
        title: '⚠️ لم تجب على جميع الأسئلة',
        description: `الأسئلة غير المجابة: ${questionsList}`,
        variant: 'destructive',
        duration: 5000
      });
      return;
    }

    // جميع الأسئلة مجابة، تقديم الامتحان مباشرة
    logger.info('🟢 جميع الأسئلة مجابة، تقديم الامتحان');
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

      {/* ✅ تنبيه fallback */}
      {(examData as any)?.has_fallback && (examData as any)?.warnings?.length > 0 && (
        <Alert className="mb-4 border-amber-200 bg-amber-50 dark:bg-amber-900/20">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <p className="font-semibold">ملاحظة:</p>
            <p className="text-sm">
              تم إنشاء هذا الامتحان بتعويض تلقائي من مصادر بديلة. 
              عدد الأسئلة: {(examData as any)?.actual_count || examData?.questions?.length}
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Header with Timer */}
      <div className="bg-background/95 backdrop-blur-sm sticky top-0 z-10 pb-4 mb-6">
        <Card className="border-2 shadow-lg">
          <CardHeader className="p-6">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1 space-y-2">
                <CardTitle className="text-2xl font-bold">{examData.exam.title}</CardTitle>
                {examData.exam.description && (
                  <p className="text-sm text-muted-foreground">{examData.exam.description}</p>
                )}
              </div>
              <div className={`flex flex-col items-end gap-2 shrink-0 ${isLastFiveMinutes ? 'animate-pulse' : ''}`}>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  الوقت المتبقي
                </div>
                <div className={`
                  flex items-center gap-3 px-5 py-3 rounded-2xl border-2 shadow-md
                  transition-all duration-300
                  ${isLastFiveMinutes 
                    ? 'text-destructive border-destructive bg-destructive/10' 
                    : 'text-primary border-primary/30 bg-primary/5'
                  }
                `}>
                  <Clock className="w-6 h-6" />
                  <span className="text-3xl font-bold tabular-nums">{formattedTime}</span>
                </div>
                {isLastFiveMinutes && (
                  <div className="text-xs text-destructive font-semibold flex items-center gap-1">
                    <span>⚠️</span>
                    <span>سيتم التقديم تلقائياً عند انتهاء الوقت</span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Grid */}
        <Card className="lg:col-span-1 order-2 lg:order-1 border-2 shadow-sm h-fit lg:sticky lg:top-24">
          <CardHeader className="p-5 border-b bg-gradient-to-br from-muted/50 to-transparent">
            <CardTitle className="text-lg font-bold">الأسئلة</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <ExamNavigationGrid
              totalQuestions={examData.questions.length}
              answeredQuestions={answeredQuestions}
              currentQuestion={currentQuestionIndex}
              onQuestionSelect={setCurrentQuestionIndex}
            />
          </CardContent>
        </Card>

        {/* Question Area */}
        <div className="lg:col-span-3 space-y-6 order-1 lg:order-2">
          <div className="animate-fade-in">
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
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4 w-full">
            <Button
              variant="outline"
              onClick={() => {
                logger.info('زر السابق تم النقر عليه');
                setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
              }}
              disabled={currentQuestionIndex === 0}
              className="flex-1 h-14 text-base font-bold border-2 hover:shadow-md transition-all"
            >
              <ChevronRight className="w-5 h-5 ml-2" />
              السابق
            </Button>

            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                logger.info('زر التالي تم النقر عليه');
                setCurrentQuestionIndex((prev) => 
                  Math.min(examData.questions.length - 1, prev + 1)
                );
              }}
              disabled={currentQuestionIndex === examData.questions.length - 1}
              className="flex-1 h-14 text-base font-bold shadow-md hover:shadow-lg transition-all"
            >
              التالي
              <ChevronLeft className="w-5 h-5 mr-2" />
            </Button>
          </div>

          {/* Progress Info with Submit Button */}
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardContent className="p-4 space-y-4">
              {/* Progress Bar */}
              <div className="flex items-center justify-between">
                <span className="font-semibold">تم الإجابة على {answeredQuestions.size} من {examData.questions.length} سؤال</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 bg-background rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${(answeredQuestions.size / examData.questions.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-primary">
                    {Math.round((answeredQuestions.size / examData.questions.length) * 100)}%
                  </span>
                </div>
              </div>

              {/* Submit Button - دائم الظهور */}
              <Button
                type="button"
                onClick={handleSubmitClick}
                disabled={!allQuestionsAnswered || submitExamMutation.isPending}
                className={`
                  w-full h-14 text-lg font-bold shadow-lg hover:shadow-xl transition-all
                  ${allQuestionsAnswered 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-muted hover:bg-muted text-muted-foreground cursor-not-allowed'
                  }
                `}
              >
                <Send className="w-5 h-5 ml-2" />
                {submitExamMutation.isPending 
                  ? 'جاري التسليم...' 
                  : allQuestionsAnswered 
                    ? '✅ تقديم الامتحان' 
                    : `⚠️ أجب على ${unansweredQuestionNumbers.length} سؤال متبقي`
                }
              </Button>

              {/* رسالة توضيحية عند عدم اكتمال الإجابات */}
              {!allQuestionsAnswered && (
                <p className="text-xs text-muted-foreground text-center">
                  يجب الإجابة على جميع الأسئلة قبل التقديم
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}
