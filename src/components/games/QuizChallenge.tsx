import React, { useState, useEffect } from 'react';
import { Clock, Star, Zap, CheckCircle, XCircle, Trophy, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface QuizChallengeProps {
  player: any;
  gameState: any;
  onCompleteQuest: (questId: string, xpReward: number) => void;
  onEarnXP: (amount: number, source: string) => void;
  onUnlockAchievement: (achievementId: string) => void;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
}

// Sample questions - في التطبيق الحقيقي، هذه ستأتي من قاعدة البيانات
const SAMPLE_QUESTIONS: Question[] = [
  {
    id: 'q1',
    question: 'ما هو ناتج 5 × 8؟',
    options: ['35', '40', '45', '50'],
    correctAnswer: 1,
    explanation: '5 × 8 = 40',
    difficulty: 'easy',
    subject: 'math'
  },
  {
    id: 'q2',
    question: 'ما هي وحدة قياس القوة في النظام الدولي؟',
    options: ['نيوتن', 'جول', 'وات', 'أمبير'],
    correctAnswer: 0,
    explanation: 'النيوتن هو وحدة قياس القوة في النظام الدولي للوحدات',
    difficulty: 'medium',
    subject: 'physics'
  },
  {
    id: 'q3',
    question: 'كم عدد الإلكترونات في ذرة الكربون؟',
    options: ['4', '6', '8', '12'],
    correctAnswer: 1,
    explanation: 'ذرة الكربون تحتوي على 6 إلكترونات في حالتها المتعادلة',
    difficulty: 'medium',
    subject: 'chemistry'
  },
  {
    id: 'q4',
    question: 'ما هي أكبر قارة في العالم؟',
    options: ['أفريقيا', 'آسيا', 'أمريكا الشمالية', 'أوروبا'],
    correctAnswer: 1,
    explanation: 'آسيا هي أكبر قارة في العالم من حيث المساحة وعدد السكان',
    difficulty: 'easy',
    subject: 'geography'
  },
  {
    id: 'q5',
    question: 'من هو شاعر المعلقات الأشهر؟',
    options: ['امرؤ القيس', 'عنترة بن شداد', 'طرفة بن العبد', 'لبيد بن ربيعة'],
    correctAnswer: 0,
    explanation: 'امرؤ القيس يعتبر من أشهر شعراء المعلقات السبع',
    difficulty: 'medium',
    subject: 'literature'
  }
];

const QUEST_CONFIGS = {
  daily: {
    questionsCount: 5,
    timeLimit: 300, // 5 minutes
    xpReward: 50,
    title: 'التحدي اليومي'
  },
  practice: {
    questionsCount: 3,
    timeLimit: 180, // 3 minutes
    xpReward: 25,
    title: 'تدريب سريع'
  },
  challenge: {
    questionsCount: 10,
    timeLimit: 600, // 10 minutes
    xpReward: 100,
    title: 'تحدي المعرفة'
  }
};

const QuizChallenge: React.FC<QuizChallengeProps> = ({
  player,
  gameState,
  onCompleteQuest,
  onEarnXP,
  onUnlockAchievement
}) => {
  const [currentQuiz, setCurrentQuiz] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);

  // Timer
  useEffect(() => {
    if (currentQuiz && timeLeft > 0 && !quizCompleted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && currentQuiz && !quizCompleted) {
      handleQuizComplete();
    }
  }, [timeLeft, currentQuiz, quizCompleted]);

  const startQuiz = (quizType: keyof typeof QUEST_CONFIGS) => {
    const config = QUEST_CONFIGS[quizType];
    const questions = SAMPLE_QUESTIONS.slice(0, config.questionsCount);
    
    setCurrentQuiz(quizType);
    setQuizQuestions(questions);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setTimeLeft(config.timeLimit);
    setQuizCompleted(false);
    setAnswers([]);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);
    
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setAnswers(newAnswers);
    
    if (answerIndex === quizQuestions[currentQuestionIndex].correctAnswer) {
      setScore(score + 1);
      onEarnXP(10, 'correct_answer');
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      handleQuizComplete();
    }
  };

  const handleQuizComplete = () => {
    setQuizCompleted(true);
    
    if (currentQuiz) {
      const config = QUEST_CONFIGS[currentQuiz as keyof typeof QUEST_CONFIGS];
      const percentage = (score / quizQuestions.length) * 100;
      
      if (percentage >= 70) {
        onCompleteQuest(currentQuiz, config.xpReward);
        
        // Check for achievements
        if (percentage === 100) {
          onUnlockAchievement('perfect_score');
        }
        if (currentQuiz === 'daily' && !gameState.dailyQuestCompleted) {
          onUnlockAchievement('daily_warrior');
        }
      }
    }
  };

  const resetQuiz = () => {
    setCurrentQuiz(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setTimeLeft(0);
    setQuizCompleted(false);
    setQuizQuestions([]);
    setAnswers([]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentQuiz) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">المهام والتحديات</h2>
          <p className="text-muted-foreground">
            اختبر معرفتك واكسب نقاط الخبرة
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(QUEST_CONFIGS).map(([type, config]) => (
            <Card key={type} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {type === 'daily' && <Trophy className="h-5 w-5 text-yellow-500" />}
                  {type === 'practice' && <Zap className="h-5 w-5 text-blue-500" />}
                  {type === 'challenge' && <Star className="h-5 w-5 text-purple-500" />}
                  {config.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>عدد الأسئلة: {config.questionsCount}</div>
                  <div>الوقت المحدد: {Math.floor(config.timeLimit / 60)} دقائق</div>
                  <div>مكافأة الخبرة: {config.xpReward} نقطة</div>
                </div>
                
                <Button 
                  onClick={() => startQuiz(type as keyof typeof QUEST_CONFIGS)}
                  className="w-full"
                  disabled={type === 'daily' && gameState.dailyQuestCompleted}
                >
                  {type === 'daily' && gameState.dailyQuestCompleted ? 'مكتمل اليوم' : 'ابدأ الآن'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (quizCompleted) {
    const percentage = (score / quizQuestions.length) * 100;
    const passed = percentage >= 70;

    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className={`mx-auto mb-4 w-20 h-20 rounded-full flex items-center justify-center ${
              passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}>
              {passed ? <Trophy className="h-10 w-10" /> : <XCircle className="h-10 w-10" />}
            </div>
            <CardTitle className="text-2xl">
              {passed ? 'تهانينا!' : 'حاول مرة أخرى'}
            </CardTitle>
            <p className="text-muted-foreground">
              {passed 
                ? 'لقد نجحت في التحدي وكسبت نقاط خبرة!'
                : 'تحتاج إلى 70% على الأقل للنجاح'
              }
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold">{score}/{quizQuestions.length}</div>
              <div className="text-lg text-muted-foreground">{Math.round(percentage)}%</div>
              <Progress value={percentage} className="w-full" />
            </div>
            
            <div className="flex gap-4 justify-center">
              <Button onClick={resetQuiz} variant="outline" className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                العودة للمهام
              </Button>
              <Button onClick={() => startQuiz(currentQuiz as keyof typeof QUEST_CONFIGS)}>
                إعادة المحاولة
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = quizQuestions[currentQuestionIndex];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Badge variant="outline">
            السؤال {currentQuestionIndex + 1} من {quizQuestions.length}
          </Badge>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="font-medium">{score} نقطة</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <Progress value={((currentQuestionIndex + 1) / quizQuestions.length) * 100} />
      </div>

      {/* Question */}
      <Card>
        <CardContent className="p-8">
          <h3 className="text-xl font-bold mb-6">{currentQuestion.question}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {currentQuestion.options.map((option, index) => (
              <Button
                key={index}
                variant={
                  selectedAnswer === null ? "outline" :
                  index === currentQuestion.correctAnswer ? "default" :
                  selectedAnswer === index ? "destructive" : "outline"
                }
                className={`p-4 h-auto text-right justify-start ${
                  selectedAnswer !== null && index === currentQuestion.correctAnswer
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : selectedAnswer === index && index !== currentQuestion.correctAnswer
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : ''
                }`}
                onClick={() => handleAnswerSelect(index)}
                disabled={selectedAnswer !== null}
              >
                <div className="flex items-center gap-3">
                  {selectedAnswer !== null && index === currentQuestion.correctAnswer && (
                    <CheckCircle className="h-5 w-5" />
                  )}
                  {selectedAnswer === index && index !== currentQuestion.correctAnswer && (
                    <XCircle className="h-5 w-5" />
                  )}
                  <span>{option}</span>
                </div>
              </Button>
            ))}
          </div>

          {showExplanation && (
            <div className="p-4 bg-muted rounded-lg mb-6">
              <h4 className="font-medium mb-2">الشرح:</h4>
              <p className="text-muted-foreground">{currentQuestion.explanation}</p>
            </div>
          )}

          {showExplanation && (
            <div className="flex justify-end">
              <Button onClick={handleNextQuestion}>
                {currentQuestionIndex < quizQuestions.length - 1 ? 'السؤال التالي' : 'إنهاء التحدي'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizChallenge;