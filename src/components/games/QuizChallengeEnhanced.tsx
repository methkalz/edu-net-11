import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Trophy, ArrowLeft, ArrowRight, RotateCcw, CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import { useGameSession } from '@/hooks/useGameSession';
import { useRealQuestionGenerator } from '@/hooks/useRealQuestionGenerator';
import { useGameLogger } from '@/hooks/useGameLogger';
import { useToast } from '@/hooks/use-toast';

interface QuizChallengeEnhancedProps {
  lessonId: string;
  onComplete: (lessonId: string, score: number, maxScore: number, completionTime?: number, mistakesCount?: number) => void;
  onBack: () => void;
}

export const QuizChallengeEnhanced: React.FC<QuizChallengeEnhancedProps> = ({
  lessonId,
  onComplete,
  onBack
}) => {
  const { toast } = useToast();
  
  // Game state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showExplanations, setShowExplanations] = useState<Record<number, boolean>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes default
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [startTime] = useState(Date.now());
  
  // Hooks
  const { getQuestionsForLesson } = useRealQuestionGenerator();
  const [questions, setQuestions] = useState<any[]>([]);
  const [lesson, setLesson] = useState<any>(null);
  const { 
    session, 
    startSession, 
    resumeSession, 
    answerQuestion, 
    endSession,
    nextQuestion,
    sessionData 
  } = useGameSession();
  
  const { 
    logAnswer, 
    logUserAction, 
    startLogging,
    stopLogging 
  } = useGameLogger();

  // Initialize quiz
  useEffect(() => {
    const loadQuestionsAndLesson = async () => {
      const lessonQuestions = await getQuestionsForLesson(lessonId, 10);
      setQuestions(lessonQuestions);
      
      // Mock lesson data - في التطبيق الحقيقي، اجلبها من قاعدة البيانات
      setLesson({
        id: lessonId,
        title: `درس الشبكات - ${lessonId}`,
        description: 'درس تفاعلي في الشبكات'
      });
    };
    
    loadQuestionsAndLesson();
  }, [lessonId, getQuestionsForLesson]);

  useEffect(() => {
    if (!questions || questions.length === 0) return;
    
    const initializeQuiz = async () => {
      // Check if there's a resumable session
      const resumed = await resumeSession(lessonId);
      if (resumed) {
        toast({
          title: "تم استئناف اللعبة",
          description: "تم استئناف جلستك السابقة",
        });
        setCurrentQuestionIndex(sessionData?.currentQuestionIndex || 0);
        setSelectedAnswers(sessionData?.answers || {});
        return;
      }
      
      // Start new session
      await startSession(lessonId, questions);
      startLogging(`quiz_${lessonId}`, lessonId);
      
      logUserAction('quiz_started', { 
        lessonId, 
        questionCount: questions.length,
        timestamp: new Date().toISOString()
      });
    };

    initializeQuiz();
  }, [questions, lessonId]);

  // Timer effect
  useEffect(() => {
    if (quizCompleted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleQuizComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizCompleted, timeLeft]);

  // Handle answer selection
  const handleAnswerSelect = useCallback(async (choiceIndex: number) => {
    if (!questions || selectedAnswers[currentQuestionIndex]) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    const selectedChoice = currentQuestion.choices[choiceIndex];
    const isCorrect = selectedChoice === currentQuestion.correct_answer;
    
    // Update local state
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: selectedChoice
    }));
    
    setShowExplanations(prev => ({
      ...prev,
      [currentQuestionIndex]: true
    }));
    
    // Log the answer - بتوقيع صحيح
    logAnswer(
      currentQuestion.id,
      currentQuestion,
      selectedChoice,
      isCorrect,
      Date.now() - startTime
    );
    
    // Update session
    await answerQuestion(selectedChoice);
    
    // Show feedback
    if (isCorrect) {
      toast({
        title: "إجابة صحيحة! ✅",
        description: "أحسنت، لنتابع للسؤال التالي",
      });
    } else {
      toast({
        title: "إجابة خاطئة ❌",
        description: `الإجابة الصحيحة: ${currentQuestion.correct_answer}`,
        variant: "destructive"
      });
    }
  }, [questions, currentQuestionIndex, selectedAnswers, answerQuestion, startTime, toast]);

  // Navigate to next question
  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      nextQuestion();
      logUserAction('question_navigated', { 
        from: currentQuestionIndex, 
        to: currentQuestionIndex + 1 
      });
    } else {
      handleQuizComplete();
    }
  }, [currentQuestionIndex, questions, nextQuestion, logUserAction]);

  // Navigate to previous question
  const handlePreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      logUserAction('question_navigated', { 
        from: currentQuestionIndex, 
        to: currentQuestionIndex - 1 
      });
    }
  }, [currentQuestionIndex, logUserAction]);

  // Complete quiz
  const handleQuizComplete = useCallback(async () => {
    if (quizCompleted) return;
    
    setQuizCompleted(true);
    
    const completionTime = Math.round((Date.now() - startTime) / 1000);
    const totalScore = Object.values(selectedAnswers).filter(
      (answer, index) => answer === questions[index]?.correct_answer
    ).length;
    
    const mistakesCount = Object.keys(selectedAnswers).length - totalScore;
    
    // End sessions
    await endSession();
    const report = stopLogging(totalScore, questions.length);
    
    // Call completion callback
    onComplete(lessonId, totalScore, questions.length, completionTime, mistakesCount);
    
    toast({
      title: "تم إنهاء الاختبار",
      description: `النتيجة: ${totalScore}/${questions.length}`,
    });
  }, [quizCompleted, startTime, selectedAnswers, questions, lessonId, endSession, stopLogging, onComplete, toast]);

  // Restart quiz
  const handleRestartQuiz = useCallback(async () => {
    setSelectedAnswers({});
    setShowExplanations({});
    setCurrentQuestionIndex(0);
    setTimeLeft(300);
    setQuizCompleted(false);
    
    await startSession(lessonId, questions);
    startLogging(`quiz_${lessonId}_retry`, lessonId);
    
    logUserAction('quiz_restarted', { lessonId });
  }, [lessonId, questions, startSession, startLogging, logUserAction]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (!questions || questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">جاري تحميل الأسئلة...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const currentAnswer = selectedAnswers[currentQuestionIndex];
  const showExplanation = showExplanations[currentQuestionIndex];
  
  // Quiz completion screen
  if (quizCompleted) {
    const totalScore = Object.values(selectedAnswers).filter(
      (answer, index) => answer === questions[index]?.correct_answer
    ).length;
    const percentage = Math.round((totalScore / questions.length) * 100);
    
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Trophy className="w-16 h-16 text-yellow-500" />
          </div>
          <CardTitle className="text-2xl">تم إنهاء الاختبار!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="text-4xl font-bold text-primary">
              {totalScore}/{questions.length}
            </div>
            <div className="text-lg text-muted-foreground">
              النسبة: {percentage}%
            </div>
            <Progress value={percentage} className="w-full max-w-md mx-auto" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-green-100 dark:bg-green-900/20 p-4 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="font-semibold">{totalScore}</div>
              <div className="text-sm text-muted-foreground">إجابات صحيحة</div>
            </div>
            <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
              <div className="font-semibold">{questions.length - totalScore}</div>
              <div className="text-sm text-muted-foreground">إجابات خاطئة</div>
            </div>
          </div>
          
          <div className="flex gap-3 justify-center">
            <Button onClick={handleRestartQuiz} variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              إعادة المحاولة
            </Button>
            <Button onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              العودة للدروس
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Quiz Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                العودة
              </Button>
              <div>
                <CardTitle className="text-lg">{lesson?.title || 'اختبار تفاعلي'}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  السؤال {currentQuestionIndex + 1} من {questions.length}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4" />
                <span className={timeLeft < 60 ? 'text-red-500 font-bold' : ''}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              <Badge variant="outline">
                النقاط: {Object.values(selectedAnswers).filter(
                  (answer, index) => answer === questions[index]?.correct_answer
                ).length}/{Object.keys(selectedAnswers).length}
              </Badge>
            </div>
          </div>
          <Progress value={progress} className="w-full" />
        </CardHeader>
      </Card>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl leading-relaxed">
            {currentQuestion.question_text}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {currentQuestion.choices.map((choice, index) => {
              const isSelected = currentAnswer === choice;
              const isCorrect = currentQuestion.correct_answer === choice;
              const showResult = showExplanation;
              
              let buttonVariant: "default" | "outline" | "secondary" | "destructive" = "outline";
              let buttonClass = "";
              
              if (showResult) {
                if (isCorrect) {
                  buttonVariant = "default";
                  buttonClass = "bg-green-100 border-green-300 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300";
                } else if (isSelected && !isCorrect) {
                  buttonVariant = "destructive";
                  buttonClass = "bg-red-100 border-red-300 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300";
                }
              } else if (isSelected) {
                buttonVariant = "secondary";
              }

              return (
                <Button
                  key={index}
                  variant={buttonVariant}
                  className={`h-auto p-4 text-right justify-start whitespace-normal ${buttonClass}`}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showExplanation}
                >
                  <div className="flex items-center gap-3 w-full">
                    <span className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-semibold">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="flex-1 text-right">{choice}</span>
                    {showResult && isCorrect && (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    )}
                  </div>
                </Button>
              );
            })}
          </div>

          {/* Explanation */}
          {showExplanation && currentQuestion.explanation && (
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                      شرح الإجابة:
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              السؤال السابق
            </Button>

            {showExplanation && (
              <Button onClick={handleNextQuestion}>
                {currentQuestionIndex === questions.length - 1 ? (
                  <>
                    إنهاء الاختبار
                    <Trophy className="w-4 h-4 mr-2" />
                  </>
                ) : (
                  <>
                    السؤال التالي
                    <ArrowRight className="w-4 h-4 mr-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};