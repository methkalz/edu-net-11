// صفحة حل امتحان البجروت للطالب
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBagrutAttempt } from '@/hooks/useBagrutAttempt';
import { useExamTimer } from '@/hooks/useExamTimer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import BagrutSectionSelector from '@/components/bagrut/BagrutSectionSelector';
import BagrutQuestionRenderer from '@/components/bagrut/BagrutQuestionRenderer';
import ExamAntiCopyWrapper from '@/components/bagrut/ExamAntiCopyWrapper';
import ExamCalculator from '@/components/bagrut/ExamCalculator';
import SectionTransitionAlert from '@/components/bagrut/SectionTransitionAlert';
import {
  AlertCircle,
  Clock,
  ChevronRight,
  ChevronLeft,
  Save,
  Send,
  CheckCircle2,
  Circle,
  Loader2,
  Home,
  Lock,
} from 'lucide-react';
import { logger } from '@/lib/logging';
import type { ParsedQuestion, ParsedSection } from '@/lib/bagrut/buildBagrutPreview';

export default function StudentBagrutAttempt() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    examData,
    isLoading,
    isError,
    error,
    attemptId,
    attemptStartedAt,
    answers,
    selectedSectionIds,
    updateAnswer,
    startExam,
    submitExam,
    saveAnswers,
    isCreatingAttempt,
    isSaving,
    isSubmitting,
    isSubmitted,
    isTimeExpired,
    // دوال مساعدة لحد N-of-M
    findSectionForQuestion,
    getAnsweredRootCountInSection,
    collectAllSubIds,
  } = useBagrutAttempt(examId, user?.id, isPreview);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  
  // حالة تنبيه الانتقال لقسم الاختصاص
  const [showSectionAlert, setShowSectionAlert] = useState(false);
  const [currentAlertSection, setCurrentAlertSection] = useState<ParsedSection | null>(null);
  const shownSectionAlertsRef = useRef<Set<string>>(new Set());
  const lastSectionIdRef = useRef<string | null>(null);

  // جمع كل الأسئلة من الأقسام المختارة مع معلومات القسم
  const questionsWithSections = useMemo(() => {
    if (!examData || selectedSectionIds.length === 0) return [];
    
    const result: Array<{ question: ParsedQuestion; section: ParsedSection }> = [];
    examData.sections.forEach(section => {
      if (selectedSectionIds.includes(section.section_db_id!)) {
        section.questions.forEach(q => {
          result.push({ question: q, section });
        });
      }
    });
    return result;
  }, [examData, selectedSectionIds]);

  const allQuestions = useMemo(() => 
    questionsWithSections.map(item => item.question),
    [questionsWithSections]
  );

  // المؤقت
  const timer = useExamTimer({
    durationMinutes: examData?.exam.duration_minutes || 180,
    startedAt: attemptStartedAt,
    onTimeUp: () => {
      toast({
        title: '⏰ انتهى وقت الامتحان',
        description: 'جاري تقديم الامتحان تلقائياً...',
        variant: 'destructive',
      });
      handleSubmit();
    },
    startImmediately: false,
  });

  // بدء المؤقت عند وجود محاولة
  useEffect(() => {
    if (attemptId && attemptStartedAt && !timer.isRunning && !timer.isTimeUp) {
      timer.start();
    }
  }, [attemptId, attemptStartedAt, timer]);

  // دالة للتحقق إذا كان السؤال محلولاً (مع دعم الأسئلة الفرعية)
  const isQuestionAnswered = useCallback((question: ParsedQuestion): boolean => {
    const qId = question.question_db_id || question.question_number;
    
    if (question.sub_questions && question.sub_questions.length > 0) {
      return question.sub_questions.every(subQ => {
        const subQId = subQ.question_db_id || subQ.question_number;
        return answers[subQId] && answers[subQId].answer;
      });
    }
    
    return !!(answers[qId] && answers[qId].answer);
  }, [answers]);

  // دالة للتحقق إذا كان السؤال مقفلاً (وصل القسم لحد N والسؤال غير مجاب)
  const isQuestionLocked = useCallback((question: ParsedQuestion): boolean => {
    const section = findSectionForQuestion(question.question_db_id || question.question_number);
    if (!section || !section.max_questions_to_answer) return false;
    
    const maxQ = section.max_questions_to_answer;
    const answeredCount = getAnsweredRootCountInSection(section, answers);
    
    if (answeredCount < maxQ) return false;
    
    // تحقق إذا السؤال الحالي (أو أي من فرعياته) مجاب — إذا نعم فليس مقفلاً
    const allIds = collectAllSubIds(question);
    const hasAnswer = allIds.some(id => answers[id]?.answer);
    return !hasAnswer;
  }, [findSectionForQuestion, getAnsweredRootCountInSection, collectAllSubIds, answers]);

  // دالة مساعدة لحساب الأسئلة الطرفية (leaf) عودياً
  const countLeafQuestions = useCallback((question: ParsedQuestion): number => {
    if (question.sub_questions && question.sub_questions.length > 0) {
      return question.sub_questions.reduce((sum, sq) => sum + countLeafQuestions(sq), 0);
    }
    return 1;
  }, []);

  const countAnsweredLeaves = useCallback((question: ParsedQuestion): number => {
    if (question.sub_questions && question.sub_questions.length > 0) {
      return question.sub_questions.reduce((sum, sq) => sum + countAnsweredLeaves(sq), 0);
    }
    const qId = question.question_db_id || question.question_number;
    return (answers[qId] && answers[qId].answer) ? 1 : 0;
  }, [answers]);

  // إحصائيات الإجابات - على مستوى الأسئلة الطرفية (leaf)
  const answeredCount = useMemo(() => {
    return allQuestions.reduce((sum, q) => sum + countAnsweredLeaves(q), 0);
  }, [allQuestions, countAnsweredLeaves]);

  // العدد المطلوب للإجابة (مع مراعاة "اختر N من M") على مستوى leaf
  const requiredAnswerCount = useMemo(() => {
    if (!examData || selectedSectionIds.length === 0) {
      return allQuestions.reduce((sum, q) => sum + countLeafQuestions(q), 0);
    }
    let required = 0;
    examData.sections.forEach(section => {
      if (selectedSectionIds.includes(section.section_db_id!)) {
        const maxQ = section.max_questions_to_answer;
        const questionsToCount = maxQ && maxQ < section.questions.length
          ? section.questions.slice(0, maxQ)
          : section.questions;
        required += questionsToCount.reduce((sum, q) => sum + countLeafQuestions(q), 0);
      }
    });
    return required;
  }, [examData, selectedSectionIds, allQuestions, countLeafQuestions]);

  const progressPercent = requiredAnswerCount > 0 
    ? Math.min(100, Math.round((answeredCount / requiredAnswerCount) * 100)) 
    : 0;

  // التنقل مع التحقق من الانتقال لقسم الاختصاص
  const goToQuestion = useCallback((index: number) => {
    if (index >= 0 && index < allQuestions.length) {
      const targetItem = questionsWithSections[index];
      const currentSectionId = targetItem?.section.section_db_id;
      
      // التحقق من الانتقال لقسم اختياري جديد
      if (
        currentSectionId && 
        targetItem.section.section_type === 'elective' &&
        currentSectionId !== lastSectionIdRef.current &&
        !shownSectionAlertsRef.current.has(currentSectionId)
      ) {
        // تسجيل أن هذا القسم تم عرض التنبيه له
        shownSectionAlertsRef.current.add(currentSectionId);
        setCurrentAlertSection(targetItem.section);
        setShowSectionAlert(true);
      }
      
      lastSectionIdRef.current = currentSectionId || null;
      setCurrentQuestionIndex(index);
    }
  }, [allQuestions.length, questionsWithSections]);

  const dismissSectionAlert = useCallback(() => {
    setShowSectionAlert(false);
    setCurrentAlertSection(null);
  }, []);

  const goNext = () => goToQuestion(currentQuestionIndex + 1);
  const goPrev = () => goToQuestion(currentQuestionIndex - 1);

  // التقديم
  const handleSubmit = useCallback(() => {
    if (isSubmitting) return;
    submitExam();
  }, [submitExam, isSubmitting]);

  const confirmSubmit = () => {
    const unansweredNeeded = Math.max(0, requiredAnswerCount - answeredCount);
    if (unansweredNeeded > 0) {
      toast({
        title: `⚠️ يُنصح بالإجابة عن ${unansweredNeeded} سؤال إضافي`,
        description: `أجبت عن ${answeredCount} من ${requiredAnswerCount} المطلوبة. هل تريد التقديم؟`,
        variant: 'destructive',
      });
    }
    setShowConfirmSubmit(true);
  };

  // حساب الوقت المستغرق
  const calculateTimeSpent = useCallback(() => {
    if (!attemptStartedAt) return 0;
    const startTime = new Date(attemptStartedAt).getTime();
    const endTime = Date.now();
    return Math.floor((endTime - startTime) / 1000);
  }, [attemptStartedAt]);

  // التوجيه بعد التقديم - إلى صفحة التأكيد الجديدة
  useEffect(() => {
    if (isSubmitted && attemptId) {
      navigate(`/student/bagrut-submitted/${examId}`, {
        state: {
          answeredCount,
          totalQuestions: requiredAnswerCount,
          timeSpentSeconds: calculateTimeSpent(),
          attemptNumber: examData?.attempt?.attempt_number || 1,
          examTitle: examData?.exam.title,
        },
      });
    }
  }, [isSubmitted, attemptId, examId, navigate, answeredCount, requiredAnswerCount, calculateTimeSpent, examData]);

  // Loading
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-lg">جاري تحميل الامتحان...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error
  if (isError || !examData) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error?.message || 'فشل في تحميل الامتحان'}
          </AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/student/bagrut-exams')}>
          <Home className="ml-2 h-4 w-4" />
          العودة لقائمة الامتحانات
        </Button>
      </div>
    );
  }

  // لا يمكن البدء
  if (!examData.can_start) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            لقد استنفدت جميع المحاولات المسموح بها ({examData.exam.max_attempts})
          </AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/student/bagrut-exams')}>
          <Home className="ml-2 h-4 w-4" />
          العودة لقائمة الامتحانات
        </Button>
      </div>
    );
  }

  // اختيار الأقسام (إذا لم تبدأ المحاولة بعد)
  if (!attemptId) {
    // تحديد نوع هيكل الامتحان
    const examStructureType = examData.exam.exam_structure_type || 'standard';
    
    return (
      <div className="container mx-auto p-6">
        <BagrutSectionSelector
          sections={examData.sections}
          examTitle={examData.exam.title}
          examDuration={examData.exam.duration_minutes}
          totalPoints={examData.exam.total_points}
          instructions={examData.exam.instructions}
          onStart={startExam}
          isStarting={isCreatingAttempt}
          examStructureType={examStructureType}
        />
      </div>
    );
  }

  const currentQuestion = allQuestions[currentQuestionIndex];

  if (!currentQuestion) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>لا توجد أسئلة في الأقسام المختارة</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* banner المعاينة */}
      {isPreview && (
        <div className="bg-amber-500 text-white text-center py-2 px-4 font-medium text-sm">
          وضع المعاينة — هذا ليس امتحان حقيقي ولن يتم حفظ أي إجابات
        </div>
      )}
      {/* شريط المؤقت والمعلومات */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* العنوان */}
            <div className="hidden sm:block">
              <h1 className="font-semibold text-lg truncate max-w-[200px]">
                {examData.exam.title}
              </h1>
            </div>

            {/* المؤقت */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              timer.isLastFiveMinutes 
                ? 'bg-destructive/10 text-destructive animate-pulse' 
                : 'bg-muted'
            }`}>
              <Clock className="h-5 w-5" />
              <span className="font-mono text-xl font-bold">{timer.formattedTime}</span>
            </div>

            {/* التقدم */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {answeredCount}/{requiredAnswerCount}
              </span>
              <Progress value={progressPercent} className="w-24" />
              <Badge variant={isSaving ? 'secondary' : 'outline'} className="hidden sm:flex gap-1">
                {isSaving ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    حفظ...
                  </>
                ) : (
                  <>
                    <Save className="h-3 w-3" />
                    محفوظ
                  </>
                )}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 flex gap-6">
        {/* القائمة الجانبية - التنقل بين الأسئلة */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <Card className="sticky top-24">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">الأسئلة</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="grid grid-cols-4 gap-2">
                  {allQuestions.map((q, index) => {
                    const qId = q.question_db_id || q.question_number;
                    const isAnswered = isQuestionAnswered(q);
                    const isCurrent = index === currentQuestionIndex;
                    const locked = isQuestionLocked(q);
                    const hasSubs = q.sub_questions && q.sub_questions.length > 0;

                    return (
                      <React.Fragment key={qId}>
                        <button
                          onClick={() => goToQuestion(index)}
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition-all flex items-center justify-center ${
                            isCurrent
                              ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                              : isAnswered
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : locked
                              ? 'bg-muted/50 text-muted-foreground opacity-50'
                              : 'bg-muted hover:bg-muted/80'
                          }`}
                          title={locked ? 'مقفل — وصلت للحد الأقصى' : undefined}
                        >
                          {locked && !isAnswered ? <Lock className="h-3 w-3" /> : index + 1}
                        </button>
                        {/* مربعات فرعية — تظهر دائماً */}
                        {hasSubs && (
                          <div className="col-span-4 flex flex-wrap gap-1 py-1">
                            {q.sub_questions!.map((subQ, si) => {
                              const subId = subQ.question_db_id || subQ.question_number;
                              const subAnswered = !!(answers[subId] && answers[subId].answer);
                              return (
                                <button
                                  key={subId}
                                  onClick={() => {
                                    goToQuestion(index);
                                    setTimeout(() => {
                                      const el = document.getElementById(`sub-q-${subId}`);
                                      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }, 100);
                                  }}
                                  className={`w-7 h-7 rounded text-xs font-medium transition-all flex items-center justify-center ${
                                    subAnswered
                                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                      : isCurrent
                                      ? 'bg-primary/20 text-primary hover:bg-primary/30'
                                      : 'bg-muted hover:bg-muted/80'
                                  }`}
                                  title={subQ.question_number || `فرعي ${si + 1}`}
                                >
                                  {subQ.question_number || String.fromCharCode(1571 + si)}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </aside>

        {/* محتوى السؤال */}
        <main className="flex-1 max-w-3xl">
          {/* رقم السؤال الحالي */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-lg px-4 py-2">
                السؤال {currentQuestionIndex + 1} من {allQuestions.length}
              </Badge>
              {(() => {
                const currentSection = questionsWithSections[currentQuestionIndex]?.section;
                const maxQ = currentSection?.max_questions_to_answer;
                if (maxQ && maxQ < (currentSection?.questions.length || 0)) {
                  return (
                    <Badge variant="secondary" className="text-xs">
                      أجب عن {maxQ} من {currentSection!.questions.length} في هذا القسم
                    </Badge>
                  );
                }
                return null;
              })()}
            </div>
            <div className="flex gap-2 lg:hidden">
              {allQuestions.slice(
                Math.max(0, currentQuestionIndex - 2),
                Math.min(allQuestions.length, currentQuestionIndex + 3)
              ).map((q, i) => {
                const actualIndex = Math.max(0, currentQuestionIndex - 2) + i;
                const qId = q.question_db_id || q.question_number;
                const isAnswered = isQuestionAnswered(q);
                const isCurrent = actualIndex === currentQuestionIndex;
                
                return (
                  <button
                    key={qId}
                    onClick={() => goToQuestion(actualIndex)}
                    className={`w-8 h-8 rounded text-sm font-medium ${
                      isCurrent
                        ? 'bg-primary text-primary-foreground'
                        : isAnswered
                        ? 'bg-green-100 text-green-700'
                        : 'bg-muted'
                    }`}
                  >
                    {actualIndex + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* تنبيه القفل إذا وصل الطالب لحد N */}
          {isQuestionLocked(currentQuestion) && (
            <Alert className="mb-4 border-orange-300 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
              <Lock className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-700 dark:text-orange-400">
                لقد أجبت على العدد المسموح من الأسئلة في هذا القسم. لتعديل اختيارك، احذف إجابة سؤال آخر أولاً.
              </AlertDescription>
            </Alert>
          )}

          {/* السؤال - محمي ضد النسخ */}
          <ExamAntiCopyWrapper enabled={!isPreview}>
            <BagrutQuestionRenderer
              question={currentQuestion}
              answers={answers}
              onAnswerChange={updateAnswer}
              disabled={isSubmitting || isQuestionLocked(currentQuestion)}
            />
          </ExamAntiCopyWrapper>

          {/* أزرار التنقل */}
          <div className="flex items-center justify-between mt-6 gap-4">
            <Button
              variant="outline"
              onClick={goPrev}
              disabled={currentQuestionIndex === 0}
              className="gap-2"
            >
              <ChevronRight className="h-4 w-4" />
              السابق
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={saveAnswers}
                disabled={isSaving}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline">حفظ</span>
              </Button>

              {currentQuestionIndex === allQuestions.length - 1 ? (
                isPreview ? (
                  <Button
                    onClick={() => window.close()}
                    className="gap-2 bg-amber-500 hover:bg-amber-600"
                  >
                    إغلاق المعاينة
                  </Button>
                ) : (
                  <Button
                    onClick={confirmSubmit}
                    disabled={isSubmitting}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Send className="h-4 w-4" />
                    تقديم الامتحان
                  </Button>
                )
              ) : (
                <Button onClick={goNext} className="gap-2">
                  التالي
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* نافذة تأكيد التقديم */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>تأكيد تقديم الامتحان</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span>الأسئلة المجابة</span>
                <Badge variant="default">{answeredCount} / {allQuestions.length}</Badge>
              </div>
              
              {answeredCount < allQuestions.length && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    لديك {allQuestions.length - answeredCount} سؤال بدون إجابة
                  </AlertDescription>
                </Alert>
              )}

              <p className="text-sm text-muted-foreground">
                لا يمكن التراجع بعد التقديم. هل أنت متأكد؟
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowConfirmSubmit(false)}
                >
                  إلغاء
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري التقديم...
                    </>
                  ) : (
                    <>
                      <Send className="ml-2 h-4 w-4" />
                      تقديم نهائي
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* الآلة الحاسبة */}
      <ExamCalculator />

      {/* تنبيه الانتقال لقسم الاختصاص */}
      {currentAlertSection && (
        <SectionTransitionAlert
          open={showSectionAlert}
          onDismiss={dismissSectionAlert}
          sectionTitle={currentAlertSection.section_title}
          specializationLabel={currentAlertSection.specialization_label}
          questionsCount={currentAlertSection.questions.length}
          totalPoints={currentAlertSection.total_points}
        />
      )}
    </div>
  );
}
