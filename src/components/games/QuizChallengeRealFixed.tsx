import React, { useState, useEffect } from 'react';
import { Clock, Star, Zap, CheckCircle, XCircle, Trophy, RotateCcw, ArrowRight, Book, Info, AlertCircle, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useGrade11Game, GameQuestion } from '@/hooks/useGrade11Game';
import { useGameSession } from '@/hooks/useGameSession';
import { useGameLogger } from '@/hooks/useGameLogger';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

interface QuizChallengeRealProps {
  lessonId: string;
  onComplete: (lessonId: string, score: number, maxScore: number, completionTime?: number, mistakesCount?: number) => void;
  onBack: () => void;
}

// Helper function to extract choice data properly from database structure
const extractChoiceData = (choice: any, index: number) => {
  // The database stores choices as simple strings
  // We need to create proper ID/text pairs for the UI
  const choiceId = String.fromCharCode(65 + index); // A, B, C, D
  
  if (typeof choice === 'string') {
    return {
      id: choiceId,
      text: choice.trim()
    };
  } else if (typeof choice === 'object' && choice !== null) {
    // Handle legacy object format if it exists
    return {
      id: choiceId,
      text: choice.text || choice.content || String(choice) || `الخيار ${index + 1}`
    };
  } else {
    return {
      id: choiceId,
      text: String(choice) || `الخيار ${index + 1}`
    };
  }
};

const QuizChallengeRealFixed: React.FC<QuizChallengeRealProps> = ({
  lessonId,
  onComplete,
  onBack
}) => {
  const { lessons } = useGrade11Game();
  const { 
    session, 
    sessionData,
    startSession, 
    resumeSession, 
    answerQuestion, 
    nextQuestion, 
    endSession,
    currentQuestion,
    isLastQuestion,
    progress: sessionProgress
  } = useGameSession();
  const { 
    startLogging, 
    stopLogging, 
    logAnswer, 
    logUserAction, 
    logError 
  } = useGameLogger();
  const { toast } = useToast();
  
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [canResumeSession, setCanResumeSession] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<Date | null>(null);

  const currentLesson = lessons.find(l => l.id === lessonId);
  const questions = currentLesson?.questions || [];
  
  // التحقق من وجود جلسة محفوظة عند التحميل
  useEffect(() => {
    const checkSession = async () => {
      if (currentLesson && questions.length > 0) {
        const hasSession = await resumeSession(lessonId);
        setCanResumeSession(hasSession);
      }
    };
    checkSession();
  }, [lessonId, currentLesson, questions.length, resumeSession]);

  // Timer
  useEffect(() => {
    if (session && timeLeft > 0 && !quizCompleted && quizStarted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && session && !quizCompleted) {
      handleQuizComplete();
    }
  }, [timeLeft, session, quizCompleted, quizStarted]);

  const startQuiz = async (resume: boolean = false) => {
    try {
      if (questions.length === 0) {
        logUserAction('quiz_start_failed', { reason: 'no_questions', lessonId });
        toast({
          title: 'لا توجد أسئلة',
          description: 'لم يتم إضافة أسئلة لهذا الدرس بعد',
          variant: 'destructive'
        });
        return;
      }
      
      // بدء جلسة التسجيل
      const sessionId = `quiz_${lessonId}_${Date.now()}`;
      startLogging(sessionId, lessonId);
      
      logUserAction('quiz_started', { 
        resume, 
        lessonId, 
        questionsCount: questions.length,
        lessonTitle: currentLesson?.title
      });
      
      if (!resume) {
        await startSession(lessonId, questions);
      }
      
      setQuizStarted(true);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setTimeLeft(300);
      setQuizCompleted(false);
      setCanResumeSession(false);
      
      logUserAction('quiz_ui_initialized', { timeLimit: 300 });
    } catch (error) {
      logError(error as Error, { action: 'start_quiz', lessonId });
    }
  };

  const handleAnswerSelect = async (choiceId: string) => {
    if (selectedAnswer !== null || !session || !currentQuestion) return;
    
    try {
      // حساب الوقت المستغرق للإجابة على السؤال
      const timeSpent = questionStartTime 
        ? Date.now() - questionStartTime.getTime() 
        : 0;
      
      setSelectedAnswer(choiceId);
      setShowExplanation(true);
      
      // Find the selected choice text based on choice ID (A, B, C, D)
      const selectedChoiceIndex = choiceId.charCodeAt(0) - 65; // Convert A,B,C,D to 0,1,2,3
      const selectedChoiceText = currentQuestion.choices[selectedChoiceIndex] || choiceId;
      
      // التحقق من صحة الإجابة
      const isCorrect = choiceId === currentQuestion.correct_answer;
      
      // Use the answerQuestion method with the choice ID
      await answerQuestion(choiceId);
      
      // Prepare choice data for logging
      const selectedChoiceData = { id: choiceId, text: selectedChoiceText };
      const correctChoiceData = currentQuestion.choices.find((choice, idx) => {
        const choiceData = extractChoiceData(choice, idx);
        return choiceData.id === currentQuestion.correct_answer;
      }) || { id: currentQuestion.correct_answer, text: currentQuestion.correct_answer };
      
      // تسجيل الإجابة مع البيانات المحسنة
      logAnswer(
        currentQuestion.id, 
        {
          ...currentQuestion,
          choices: currentQuestion.choices.map((choice, idx) => extractChoiceData(choice, idx))
        }, 
        choiceId, 
        isCorrect, 
        Math.floor(timeSpent / 1000)
      );
      
      // إشعار بصري للإجابة مع تفاصيل أفضل
      if (isCorrect) {
        toast({
          title: '✅ إجابة صحيحة!',
          description: `+${currentQuestion.points} نقطة في ${Math.floor(timeSpent / 1000)} ثانية`,
          duration: 3000
        });
      } else {
        toast({
          title: '❌ إجابة خاطئة',
          description: `الإجابة الصحيحة: ${correctChoiceData.text}`,
          variant: 'destructive',
          duration: 4000
        });
        
        logUserAction('incorrect_answer_given', {
          questionId: currentQuestion.id,
          givenAnswer: choiceId,
          givenAnswerText: selectedChoiceData.text,
          correctAnswer: currentQuestion.correct_answer,
          correctAnswerText: correctChoiceData.text,
          timeSpent: Math.floor(timeSpent / 1000)
        });
      }
    } catch (error) {
      logError(error as Error, { 
        action: 'handle_answer_select', 
        questionId: currentQuestion?.id,
        choiceId 
      });
    }
  };

  const handleNextQuestion = () => {
    try {
      if (!isLastQuestion) {
        nextQuestion();
        setSelectedAnswer(null);
        setShowExplanation(false);
        // إعداد وقت بداية السؤال الجديد
        setQuestionStartTime(new Date());
        logUserAction('next_question', { 
          currentQuestionIndex: sessionData?.currentQuestionIndex || 0 
        });
      } else {
        handleQuizComplete();
      }
    } catch (error) {
      logError(error as Error, { action: 'handle_next_question' });
    }
  };

  // بدء توقيت السؤال الأول عند بدء الاختبار
  useEffect(() => {
    if (quizStarted && currentQuestion && !questionStartTime) {
      setQuestionStartTime(new Date());
    }
  }, [quizStarted, currentQuestion, questionStartTime]);

  const handleQuizComplete = async () => {
    try {
      if (!session || !sessionData) {
        logger.warn('Attempted to complete quiz with no session');
        return;
      }
      
      // إنهاء جلسة التسجيل
      const maxScore = questions.reduce((sum, q) => sum + q.points, 0);
      const completionTimeSeconds = Math.floor((Date.now() - sessionData.startTime) / 1000);
      const sessionReport = stopLogging(sessionData.score, maxScore);
      
      logUserAction('quiz_completed', {
        finalScore: sessionData.score,
        maxScore,
        completionTime: completionTimeSeconds,
        sessionReport
      });
      
      const finalSession = await endSession();
      if (finalSession) {
        setQuizCompleted(true);
        onComplete(
          lessonId, 
          sessionData.score, 
          maxScore, 
          completionTimeSeconds,
          sessionData.mistakesCount
        );
      } else {
        logger.warn('Failed to end session, using current data');
        setQuizCompleted(true);
        onComplete(
          lessonId, 
          sessionData.score, 
          maxScore, 
          completionTimeSeconds,
          sessionData.mistakesCount
        );
      }
    } catch (error) {
      logError(error as Error, { action: 'complete_quiz' });
      if (sessionData) {
        setQuizCompleted(true);
        const maxScore = questions.reduce((sum, q) => sum + q.points, 0);
        const completionTimeSeconds = Math.floor((Date.now() - sessionData.startTime) / 1000);
        
        onComplete(
          lessonId, 
          sessionData.score, 
          maxScore, 
          completionTimeSeconds,
          sessionData.mistakesCount
        );
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentLesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 p-4 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-6">
            <Book className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">الدرس غير موجود</h3>
            <p className="text-muted-foreground mb-4">
              لم يتم العثور على الدرس المطلوب
            </p>
            <Button onClick={onBack}>العودة للخريطة</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 p-4 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-6">
            <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد أسئلة متاحة</h3>
            <p className="text-muted-foreground mb-4">
              لم يتم إضافة أسئلة لهذا الدرس بعد
            </p>
            <Button onClick={onBack}>العودة للخريطة</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center gap-2 justify-center">
              <Book className="h-6 w-6" />
              {currentLesson.title}
            </CardTitle>
            <p className="text-muted-foreground">{currentLesson.section_title}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* إشعار الجلسة المحفوظة */}
            {canResumeSession && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium text-blue-800 dark:text-blue-200">جلسة محفوظة</h4>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  لديك جلسة اختبار محفوظة. يمكنك الاستمرار من حيث توقفت.
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => startQuiz(true)} 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    استكمال الجلسة
                  </Button>
                  <Button 
                    onClick={() => startQuiz(false)} 
                    size="sm" 
                    variant="outline"
                  >
                    بداية جديدة
                  </Button>
                </div>
              </div>
            )}
            
            {/* معلومات الاختبار */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{questions.length}</div>
                <div className="text-sm text-blue-800 dark:text-blue-200">سؤال</div>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">5</div>
                <div className="text-sm text-green-800 dark:text-green-200">دقائق</div>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {questions.reduce((sum, q) => sum + q.points, 0)}
                </div>
                <div className="text-sm text-purple-800 dark:text-purple-200">نقطة</div>
              </div>
            </div>
            
            {!canResumeSession && (
              <div className="flex gap-4 justify-center">
                <Button onClick={onBack} variant="outline">
                  العودة
                </Button>
                <Button onClick={() => startQuiz(false)} className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  ابدأ الاختبار
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (quizCompleted && sessionData) {
    const maxScore = questions.reduce((sum, q) => sum + q.points, 0);
    const percentage = maxScore > 0 ? Math.round((sessionData.score / maxScore) * 100) : 0;
    const passed = percentage >= 70;
    const completionTime = Math.floor((Date.now() - sessionData.startTime) / 1000);

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 p-4 flex items-center justify-center">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className={cn(
              "mx-auto mb-4 w-20 h-20 rounded-full flex items-center justify-center animate-scale-in",
              passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            )}>
              {passed ? <Trophy className="h-10 w-10" /> : <XCircle className="h-10 w-10" />}
            </div>
            <CardTitle className="text-2xl">
              {passed ? '🎉 ممتاز!' : '💪 حاول مرة أخرى'}
            </CardTitle>
            <p className="text-muted-foreground">
              {passed 
                ? 'لقد أكملت الدرس بنجاح!'
                : 'تحتاج إلى 70% على الأقل للنجاح'
              }
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold">{sessionData.score}/{maxScore}</div>
              <div className="text-lg text-muted-foreground">{percentage}%</div>
              <Progress value={percentage} className="w-full" />
            </div>
            
            {/* تفاصيل النتائج المحسّنة */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="font-medium text-green-600">إجابات صحيحة</div>
                <div className="text-2xl font-bold">
                  {sessionData.answers.filter((answer, index) => answer === questions[index]?.correct_answer).length}
                </div>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <div className="font-medium text-red-600">إجابات خاطئة</div>
                <div className="text-2xl font-bold">{sessionData.mistakesCount}</div>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="font-medium text-blue-600">الوقت المستغرق</div>
                <div className="text-lg font-bold">{formatTime(completionTime)}</div>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <div className="font-medium text-purple-600">متوسط الوقت</div>
                <div className="text-lg font-bold">
                  {formatTime(Math.floor(completionTime / questions.length))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 justify-center">
              <Button onClick={onBack} variant="outline">
                العودة للخريطة
              </Button>
              {!passed && (
                <Button onClick={() => startQuiz(false)} className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  إعادة المحاولة
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 p-4 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-6">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">خطأ في تحميل السؤال</h3>
            <p className="text-muted-foreground mb-4">
              تعذر تحميل السؤال الحالي
            </p>
            <Button onClick={onBack}>العودة للخريطة</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestionIndex = sessionData?.currentQuestionIndex || 0;
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button 
            onClick={onBack} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            العودة
          </Button>
          
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(timeLeft)}
            </Badge>
            <Badge variant="outline">
              {currentQuestionIndex + 1} / {questions.length}
            </Badge>
          </div>
        </div>
        
        <Progress value={progressPercentage} className="w-full" />
      </div>

      {/* Question Card */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge 
                variant={currentQuestion.difficulty_level === 'easy' ? 'default' : 
                        currentQuestion.difficulty_level === 'medium' ? 'secondary' : 'destructive'}
              >
                {currentQuestion.difficulty_level === 'easy' ? 'سهل' :
                 currentQuestion.difficulty_level === 'medium' ? 'متوسط' : 'صعب'}
              </Badge>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">{currentQuestion.points} نقطة</span>
              </div>
            </div>
          </div>
          <CardTitle className="text-right text-lg leading-8">
            {currentQuestion.question_text}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Choices */}
          <div className="space-y-3">
            {currentQuestion.choices.map((choice, index) => {
              const choiceData = extractChoiceData(choice, index);
              const isSelected = selectedAnswer === choiceData.id;
              const isCorrect = choiceData.id === currentQuestion.correct_answer;
              
              return (
                <button
                  key={choiceData.id}
                  onClick={() => handleAnswerSelect(choiceData.id)}
                  disabled={selectedAnswer !== null}
                  className={cn(
                    "w-full p-4 text-right border-2 rounded-lg transition-all duration-200",
                    "hover:shadow-md disabled:cursor-not-allowed",
                    {
                      "border-primary bg-primary/5": !selectedAnswer && !showExplanation,
                      "border-green-500 bg-green-50 text-green-800": showExplanation && isCorrect,
                      "border-red-500 bg-red-50 text-red-800": showExplanation && isSelected && !isCorrect,
                      "border-gray-200 bg-gray-50 text-gray-600": showExplanation && !isSelected && !isCorrect,
                      "ring-2 ring-primary ring-offset-2": isSelected && !showExplanation
                    }
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      {
                        "bg-primary text-primary-foreground": !showExplanation,
                        "bg-green-500 text-white": showExplanation && isCorrect,
                        "bg-red-500 text-white": showExplanation && isSelected && !isCorrect,
                        "bg-gray-300 text-gray-600": showExplanation && !isSelected && !isCorrect
                      }
                    )}>
                      {showExplanation && isCorrect ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : showExplanation && isSelected && !isCorrect ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        choiceData.id
                      )}
                    </div>
                    <span className="flex-1">{choiceData.text}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {showExplanation && currentQuestion.explanation && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium text-blue-800 dark:text-blue-200">التفسير</h4>
              </div>
              <p className="text-blue-700 dark:text-blue-300 text-right">
                {currentQuestion.explanation}
              </p>
            </div>
          )}
          
          {/* Next Button */}
          {showExplanation && (
            <div className="flex justify-center pt-4">
              <Button 
                onClick={handleNextQuestion}
                className="flex items-center gap-2"
              >
                {isLastQuestion ? 'إنهاء الاختبار' : 'السؤال التالي'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizChallengeRealFixed;