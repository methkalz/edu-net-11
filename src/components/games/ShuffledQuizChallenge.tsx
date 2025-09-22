import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle, XCircle, Star, ArrowRight, RotateCcw } from 'lucide-react';
import { useShuffledQuizSession } from '@/hooks/useShuffledQuizSession';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ShuffledQuizChallengeProps {
  lessonId: string;
  lessons?: Array<{id: string; title: string; order_index: number}>;
  onComplete: (results: {
    finalScore: number;
    maxScore: number;
    percentage: number;
    totalQuestions: number;
    correctAnswers: number;
    completionTime?: number;
  }) => void;
  onBack: () => void;
  onNextLesson?: (nextLessonId: string) => void;
}

export function ShuffledQuizChallenge({ lessonId, lessons, onComplete, onBack, onNextLesson }: ShuffledQuizChallengeProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [explanation, setExplanation] = useState<string>('');
  const [startTime] = useState(Date.now());
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [quizResults, setQuizResults] = useState<any>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [autoProgressCanceled, setAutoProgressCanceled] = useState(false);

  const { toast } = useToast();
  const {
    session,
    currentQuestion,
    loading,
    createSession,
    nextQuestion,
    answerQuestion,
    completeSession,
    currentQuestionNumber,
    totalQuestions,
    currentScore,
    maxScore,
    progress,
    timeRemaining,
    isCompleted
  } = useShuffledQuizSession();

  // Helper functions for lesson navigation
  const getCurrentLesson = () => lessons?.find(l => l.id === lessonId);
  const getNextLesson = () => {
    if (!lessons) return null;
    const sortedLessons = [...lessons].sort((a, b) => a.order_index - b.order_index);
    const currentIndex = sortedLessons.findIndex(l => l.id === lessonId);
    return currentIndex !== -1 && currentIndex < sortedLessons.length - 1 ? sortedLessons[currentIndex + 1] : null;
  };
  const isLastLesson = () => getNextLesson() === null;

  // Auto-progress countdown effect
  useEffect(() => {
    if (countdown !== null && countdown > 0 && !autoProgressCanceled) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !autoProgressCanceled) {
      const nextLesson = getNextLesson();
      if (nextLesson && onNextLesson) {
        onNextLesson(nextLesson.id);
      }
    }
  }, [countdown, autoProgressCanceled, onNextLesson]);

  const startAutoProgress = () => {
    setCountdown(5);
    setAutoProgressCanceled(false);
  };
  
  const cancelAutoProgress = () => {
    setAutoProgressCanceled(true);
    setCountdown(null);
  };
  
  const goToNextLesson = () => {
    const nextLesson = getNextLesson();
    if (nextLesson && onNextLesson) {
      onNextLesson(nextLesson.id);
    }
  };

  // تنسيق الوقت المتبقي
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // بدء الاختبار
  const handleStartQuiz = () => {
    setIsQuizStarted(true);
    createSession(lessonId, {
      questionsPerQuiz: 10,
      difficultyDistribution: { easy: 40, medium: 40, hard: 20 },
      timeLimit: 1800
    });
  };

  // التعامل مع اختيار الإجابة
  const handleAnswerSelect = async (answer: string) => {
    if (showFeedback || !session || !currentQuestion) return;
    setSelectedAnswer(answer);
    
    try {
      const result = await answerQuestion(session.current_question_index, answer);
      setIsCorrect(result.isCorrect);
      setExplanation(result.explanation || '');
      setShowFeedback(true);

      toast({
        title: result.isCorrect ? "إجابة صحيحة! 🎉" : "إجابة خاطئة",
        description: result.isCorrect ? `حصلت على ${result.points} نقطة` : "حاول مرة أخرى في المرة القادمة",
        variant: result.isCorrect ? "default" : "destructive"
      });
    } catch (error) {
      console.error('Error answering question:', error);
    }
  };

  // الانتقال للسؤال التالي
  const handleNextQuestion = async () => {
    if (!session) return;

    if (session.current_question_index + 1 >= session.shuffled_questions.length) {
      try {
        const results = await completeSession();
        const completionTime = Math.floor((Date.now() - startTime) / 1000);
        
        setQuizResults({ ...results, completionTime });
        onComplete({ ...results, completionTime });
        
        // Start auto-progress if passed and not last lesson
        if (results.percentage >= 70 && !isLastLesson()) {
          setTimeout(() => startAutoProgress(), 1000);
        }
      } catch (error) {
        console.error('Error completing session:', error);
      }
    } else {
      await nextQuestion();
      setSelectedAnswer('');
      setShowFeedback(false);
      setIsCorrect(false);
      setExplanation('');
    }
  };

  const handleRestartQuiz = () => {
    setQuizResults(null);
    setIsQuizStarted(false);
    setSelectedAnswer('');
    setShowFeedback(false);
    setIsCorrect(false);
    setExplanation('');
    setCountdown(null);
    setAutoProgressCanceled(false);
  };

  // Start screen
  if (!isQuizStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 flex items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">اختبار الدرس 🎯</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-gray-600">ستحصل على 10 أسئلة متنوعة لاختبار معرفتك</p>
              <div className="text-sm text-gray-500 space-y-1">
                <p>• أسئلة متنوعة الصعوبة</p>
                <p>• مدة الاختبار: 30 دقيقة</p>
                <p>• تحتاج إلى 70% للنجاح</p>
              </div>
            </div>
            <div className="flex gap-2 justify-center">
              <Button onClick={handleStartQuiz} disabled={loading} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                {loading ? 'جاري التحضير...' : 'بدء الاختبار'}
              </Button>
              <Button variant="outline" onClick={onBack}>العودة</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results screen with smart logic
  if (quizResults) {
    const isSuccess = quizResults.percentage >= 70;
    
    const hasUnlockedNewLesson = isSuccess && !isLastLesson();
    
    return (
      <div className={cn(
        "min-h-screen p-4 flex items-center justify-center", 
        isSuccess 
          ? hasUnlockedNewLesson 
            ? "bg-gradient-to-br from-yellow-50 to-amber-50" 
            : "bg-gradient-to-br from-green-50 to-emerald-50" 
          : "bg-gradient-to-br from-orange-50 to-red-50"
      )}>
        <Card className={cn(
          "w-full max-w-lg relative overflow-hidden",
          hasUnlockedNewLesson && "level-unlock-glow border-yellow-500/30"
        )}>
          {/* Golden sparkles for new level unlock */}
          {hasUnlockedNewLesson && (
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 8 }, (_, i) => (
                <div
                  key={`sparkle-${i}`}
                  className="absolute text-yellow-400 text-lg celebration-sparkles"
                  style={{
                    left: `${15 + (i * 10)}%`,
                    top: `${10 + (i % 2) * 80}%`,
                    animationDelay: `${i * 0.3}s`
                  }}
                >
                  {i % 2 === 0 ? '✨' : '⭐'}
                </div>
              ))}
            </div>
          )}
          
          <CardHeader className="text-center relative z-10">
            <CardTitle className={cn(
              "text-2xl font-bold", 
              isSuccess 
                ? hasUnlockedNewLesson ? "text-yellow-700" : "text-green-800" 
                : "text-orange-800"
            )}>
              {isSuccess ? hasUnlockedNewLesson ? '🎉 مبروك! فتحت درس جديد! 🎉' : '🎉 تهانينا!' : '💪 حاول مرة أخرى!'}
            </CardTitle>
            {isSuccess && (
              <p className={cn(
                "font-medium level-up-entrance",
                hasUnlockedNewLesson ? "text-yellow-600" : "text-green-600"
              )}>
                {isLastLesson() ? '🏆 أكملت جميع الدروس!' : hasUnlockedNewLesson ? '🔓 الدرس التالي متاح الآن!' : 'أحسنت!'}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <div className={cn("text-3xl font-bold", isSuccess ? "text-green-600" : "text-orange-600")}>
                {quizResults.percentage}%
              </div>
              <p className="text-gray-600">{quizResults.finalScore} من {quizResults.maxScore} نقطة</p>
              {!isSuccess && (
                <p className="text-sm text-orange-600 mt-2">
                  تحتاج إلى 70% أو أكثر للنجاح ({Math.ceil(quizResults.maxScore * 0.7)} نقطة)
                </p>
              )}
            </div>

            {/* Auto-progress countdown */}
            {isSuccess && !isLastLesson() && countdown !== null && !autoProgressCanceled && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-center space-y-3">
                  <p className="text-green-700 font-medium">الانتقال للدرس التالي خلال {countdown} ثوان...</p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={goToNextLesson} size="sm" className="bg-green-600 hover:bg-green-700">الانتقال الآن</Button>
                    <Button onClick={cancelAutoProgress} variant="outline" size="sm">البقاء هنا</Button>
                  </div>
                </div>
              </div>
            )}

            {/* Final completion */}
            {isSuccess && isLastLesson() && (
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-center space-y-2">
                  <div className="text-2xl">🏆</div>
                  <p className="text-yellow-700 font-medium">مبروك! أنهيت جميع دروس الشبكات بنجاح</p>
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-center">
              {!isSuccess ? (
                <>
                  <Button onClick={handleRestartQuiz} className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700">
                    <RotateCcw className="h-4 w-4" />إعادة المحاولة
                  </Button>
                  <Button onClick={onBack} variant="outline">العودة للدروس</Button>
                </>
              ) : (
                <>
                  {!isLastLesson() && countdown === null && (
                    <Button onClick={goToNextLesson} className="bg-green-600 hover:bg-green-700">الدرس التالي</Button>
                  )}
                  <Button onClick={handleRestartQuiz} variant="outline" className="flex items-center gap-2">
                    <RotateCcw className="h-4 w-4" />إعادة المحاولة
                  </Button>
                  <Button onClick={onBack} variant="outline">العودة للخريطة</Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // عرض الاختبار
  if (!currentQuestion || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 flex items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardContent className="p-6 text-center">
            <div className="text-lg text-gray-600">جاري تحميل السؤال...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Progress bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Badge variant="outline">سؤال {currentQuestionNumber} من {totalQuestions}</Badge>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />{formatTime(timeRemaining)}
                </div>
              </div>
              <div className="text-sm font-medium text-gray-700">النقاط: {currentScore} / {maxScore}</div>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Question card */}
        <Card className="relative">
          <CardHeader>
            <CardTitle className="text-right text-lg leading-8">{currentQuestion.question_text}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentQuestion.choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => handleAnswerSelect(choice.id)}
                disabled={showFeedback}
                className={cn(
                  "w-full p-4 text-right rounded-lg border-2 transition-all duration-200",
                  showFeedback && selectedAnswer === choice.id
                    ? isCorrect ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                )}
              >
                {choice.text}
              </button>
            ))}
            
            {showFeedback && explanation && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">التفسير:</h4>
                <p className="text-blue-700 text-sm">{explanation}</p>
              </div>
            )}
            
            <div className="flex justify-between items-center pt-4">
              <Button variant="outline" onClick={onBack} disabled={showFeedback}>الخروج</Button>
              {showFeedback && (
                <Button onClick={handleNextQuestion} className="flex items-center gap-2">
                  {session.current_question_index + 1 >= session.shuffled_questions.length ? 'إنهاء الاختبار' : 'السؤال التالي'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
