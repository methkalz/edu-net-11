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

export default function StudentExamAttempt() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { answer: string; time_spent?: number }>>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);

  // جلب بيانات الامتحان
  const { data: examData, isLoading: examLoading } = useQuery({
    queryKey: ['exam-with-questions', examId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('غير مصرح');

      const { data, error } = await supabase
        .rpc('get_exam_with_questions', {
          p_exam_id: examId,
          p_student_id: user.id
        });

      if (error) throw error;
      return data as any as ExamWithQuestions;
    },
    enabled: !!examId,
  });

  // إنشاء محاولة جديدة
  const createAttemptMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('غير مصرح');

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

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setAttemptId(data.id);
      logger.info('تم إنشاء محاولة جديدة', { attemptId: data.id });
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
      if (!attemptId) throw new Error('لا يوجد محاولة نشطة');

      // تحديث الإجابات أولاً
      await updateAttemptMutation.mutateAsync(answers);

      // تقديم الامتحان
      const { data, error } = await supabase
        .rpc('submit_exam_attempt', { p_attempt_id: attemptId });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'تم تقديم الامتحان',
        description: 'تم تقديم إجاباتك بنجاح',
      });
      navigate(`/student/exam-result/${attemptId}`);
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
    Object.keys(answers).map(id => 
      examData?.questions.findIndex(q => q.id === id) || -1
    ).filter(idx => idx !== -1)
  );

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
            {!examData ? 'فشل في تحميل الامتحان' : 'لا توجد أسئلة في هذا الامتحان'}
          </AlertDescription>
        </Alert>
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
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-2xl">{examData.exam.title}</CardTitle>
            <div className={`flex items-center gap-2 text-lg font-semibold ${isLastFiveMinutes ? 'text-destructive' : ''}`}>
              <Clock className="w-5 h-5" />
              <span>{formattedTime}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Grid */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">الأسئلة</CardTitle>
          </CardHeader>
          <CardContent>
            <ExamNavigationGrid
              totalQuestions={examData.questions.length}
              answeredQuestions={answeredQuestions}
              currentQuestion={currentQuestionIndex}
              onQuestionSelect={setCurrentQuestionIndex}
            />
          </CardContent>
        </Card>

        {/* Question Area */}
        <div className="lg:col-span-3 space-y-6">
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
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
            >
              <ChevronRight className="w-4 h-4 ml-2" />
              السابق
            </Button>

            {currentQuestionIndex === examData.questions.length - 1 ? (
              <Button
                onClick={() => submitExamMutation.mutate()}
                disabled={submitExamMutation.isPending}
                className="gap-2"
              >
                <Send className="w-4 h-4" />
                تقديم الامتحان
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentQuestionIndex((prev) => 
                  Math.min(examData.questions.length - 1, prev + 1)
                )}
              >
                التالي
                <ChevronLeft className="w-4 h-4 mr-2" />
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
    </div>
  );
}
