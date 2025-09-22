import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

// أنواع البيانات
interface GameQuestion {
  id: string;
  question_text: string;
  choices: { id: string; text: string; }[];
  correct_answer: string;
  explanation?: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  points: number;
}

interface ShuffledChoice {
  id: string;
  text: string;
  originalId: string; // الـ ID الأصلي قبل الخلط
}

interface ShuffledQuestion extends Omit<GameQuestion, 'choices'> {
  originalIndex: number;
  choices: ShuffledChoice[];
  shuffledCorrectAnswer: string; // الإجابة الصحيحة بعد الخلط
}

interface QuizSession {
  id: string;
  lesson_id: string;
  shuffled_questions: ShuffledQuestion[];
  current_question_index: number;
  answers: Record<number, string>; // فهرس السؤال -> الإجابة المختارة
  score: number;
  max_score: number;
  status: 'active' | 'completed' | 'expired';
  started_at: string;
  expires_at: string;
}

interface QuizConfig {
  questionsPerQuiz: number;
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  timeLimit?: number;
}

export function useShuffledQuizSession() {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<ShuffledQuestion | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // إعداد افتراضي للاختبار
  const defaultConfig: QuizConfig = {
    questionsPerQuiz: 10,
    difficultyDistribution: {
      easy: 40,     // 40% سهل
      medium: 40,   // 40% متوسط
      hard: 20      // 20% صعب
    },
    timeLimit: 1800 // 30 دقيقة بالثواني
  };

  // خلط المصفوفة (Fisher-Yates shuffle)
  const shuffleArray = useCallback(<T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  // اختيار الأسئلة حسب الصعوبة
  const selectQuestionsByDifficulty = useCallback((
    allQuestions: GameQuestion[],
    config: QuizConfig
  ): GameQuestion[] => {
    const easyQuestions = allQuestions.filter(q => q.difficulty_level === 'easy');
    const mediumQuestions = allQuestions.filter(q => q.difficulty_level === 'medium');
    const hardQuestions = allQuestions.filter(q => q.difficulty_level === 'hard');

    const totalQuestions = config.questionsPerQuiz;
    const easyCount = Math.floor((config.difficultyDistribution.easy / 100) * totalQuestions);
    const mediumCount = Math.floor((config.difficultyDistribution.medium / 100) * totalQuestions);
    const hardCount = totalQuestions - easyCount - mediumCount;

    const selected: GameQuestion[] = [];
    
    // اختيار الأسئلة السهلة
    const shuffledEasy = shuffleArray(easyQuestions);
    selected.push(...shuffledEasy.slice(0, Math.min(easyCount, shuffledEasy.length)));

    // اختيار الأسئلة المتوسطة
    const shuffledMedium = shuffleArray(mediumQuestions);
    selected.push(...shuffledMedium.slice(0, Math.min(mediumCount, shuffledMedium.length)));

    // اختيار الأسئلة الصعبة
    const shuffledHard = shuffleArray(hardQuestions);
    selected.push(...shuffledHard.slice(0, Math.min(hardCount, shuffledHard.length)));

    // إذا لم نحصل على العدد المطلوب، نضيف أسئلة إضافية
    if (selected.length < totalQuestions) {
      const remaining = allQuestions.filter(q => !selected.find(s => s.id === q.id));
      const shuffledRemaining = shuffleArray(remaining);
      selected.push(...shuffledRemaining.slice(0, totalQuestions - selected.length));
    }

    return shuffleArray(selected);
  }, [shuffleArray]);

  // خلط الاختيارات وتتبع الإجابة الصحيحة
  const shuffleChoicesAndTrackCorrect = useCallback((question: GameQuestion): {
    shuffledChoices: ShuffledChoice[];
    newCorrectAnswer: string;
  } => {
    const originalChoices = question.choices.map(choice => ({
      ...choice,
      originalId: choice.id
    }));
    
    const shuffledChoices = shuffleArray(originalChoices);
    
    // إنشاء IDs جديدة للاختيارات المخلوطة
    const newChoices: ShuffledChoice[] = shuffledChoices.map((choice, index) => ({
      id: String.fromCharCode(65 + index), // A, B, C, D
      text: choice.text,
      originalId: choice.originalId
    }));
    
    // العثور على الإجابة الصحيحة الجديدة
    const correctChoiceIndex = shuffledChoices.findIndex(
      choice => choice.originalId === question.correct_answer
    );
    const newCorrectAnswer = String.fromCharCode(65 + correctChoiceIndex);
    
    return {
      shuffledChoices: newChoices,
      newCorrectAnswer
    };
  }, [shuffleArray]);

  // جلب الأسئلة من قاعدة البيانات
  const fetchQuestions = useCallback(async (lessonId: string): Promise<GameQuestion[]> => {
    const { data, error } = await supabase
      .from('grade11_game_questions')
      .select('*')
      .eq('lesson_id', lessonId);

    if (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }

    return data.map(q => ({
      id: q.id,
      question_text: q.question_text,
      choices: typeof q.choices === 'string' ? JSON.parse(q.choices) : q.choices,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      difficulty_level: q.difficulty_level as 'easy' | 'medium' | 'hard',
      points: q.points || 10
    }));
  }, []);

  // إنشاء جلسة جديدة
  const createSession = useCallback(async (
    lessonId: string,
    config: QuizConfig = defaultConfig
  ): Promise<void> => {
    if (!user) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // جلب الأسئلة
      const allQuestions = await fetchQuestions(lessonId);
      
      if (allQuestions.length === 0) {
        throw new Error('لا توجد أسئلة متاحة لهذا الدرس');
      }

      // اختيار الأسئلة حسب التوزيع المطلوب
      const selectedQuestions = selectQuestionsByDifficulty(allQuestions, config);
      
      // خلط الأسئلة والاختيارات
      const shuffledQuestions: ShuffledQuestion[] = selectedQuestions.map((question, index) => {
        const { shuffledChoices, newCorrectAnswer } = shuffleChoicesAndTrackCorrect(question);
        
        return {
          ...question,
          originalIndex: index,
          choices: shuffledChoices,
          shuffledCorrectAnswer: newCorrectAnswer
        };
      });

      // حساب النقاط القصوى
      const maxScore = shuffledQuestions.reduce((total, q) => total + q.points, 0);

      // حفظ الجلسة في قاعدة البيانات
      const { data: sessionData, error: sessionError } = await supabase
        .from('grade11_quiz_sessions')
        .insert([{
          user_id: user.id,
          lesson_id: lessonId,
          quiz_config: config as any,
          shuffled_questions: shuffledQuestions as any,
          max_score: maxScore,
          expires_at: new Date(Date.now() + (config.timeLimit || 1800) * 1000).toISOString()
        }])
        .select()
        .single();

      if (sessionError) throw sessionError;

      // إنشاء الجلسة المحلية
      const newSession: QuizSession = {
        id: sessionData.id,
        lesson_id: lessonId,
        shuffled_questions: shuffledQuestions,
        current_question_index: 0,
        answers: {},
        score: 0,
        max_score: maxScore,
        status: 'active',
        started_at: sessionData.started_at,
        expires_at: sessionData.expires_at
      };

      setSession(newSession);
      setQuestions(selectedQuestions);
      setCurrentQuestion(shuffledQuestions[0] || null);
      
      toast({
        title: "تم بدء الاختبار",
        description: `تم إنشاء اختبار جديد بـ ${shuffledQuestions.length} أسئلة`
      });

    } catch (error: any) {
      console.error('Error creating session:', error);
      toast({
        title: "خطأ في إنشاء الاختبار",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, fetchQuestions, selectQuestionsByDifficulty, shuffleChoicesAndTrackCorrect, toast, defaultConfig]);

  // الانتقال للسؤال التالي
  const nextQuestion = useCallback(async () => {
    if (!session) return;

    const nextIndex = session.current_question_index + 1;
    
    if (nextIndex < session.shuffled_questions.length) {
      const updatedSession = {
        ...session,
        current_question_index: nextIndex
      };
      
      setSession(updatedSession);
      setCurrentQuestion(session.shuffled_questions[nextIndex]);
      
      // تحديث قاعدة البيانات
      await supabase
        .from('grade11_quiz_sessions')
        .update({ current_question_index: nextIndex })
        .eq('id', session.id);
    }
  }, [session]);

  // إجابة السؤال
  const answerQuestion = useCallback(async (
    questionIndex: number,
    selectedAnswer: string
  ): Promise<{ isCorrect: boolean; points: number; explanation?: string }> => {
    if (!session) {
      throw new Error('لا توجد جلسة نشطة');
    }

    const question = session.shuffled_questions[questionIndex];
    const isCorrect = selectedAnswer === question.shuffledCorrectAnswer;
    const points = isCorrect ? question.points : 0;

    // تحديث الإجابات والنقاط
    const updatedAnswers = { ...session.answers, [questionIndex]: selectedAnswer };
    const updatedScore = session.score + points;
    
    const updatedSession = {
      ...session,
      answers: updatedAnswers,
      score: updatedScore
    };

    setSession(updatedSession);

    // تحديث قاعدة البيانات
    await supabase
      .from('grade11_quiz_sessions')
      .update({
        answers: updatedAnswers as any,
        score: updatedScore
      })
      .eq('id', session.id);

    return {
      isCorrect,
      points,
      explanation: question.explanation
    };
  }, [session]);

  // إنهاء الاختبار
  const completeSession = useCallback(async (): Promise<{
    finalScore: number;
    maxScore: number;
    percentage: number;
    totalQuestions: number;
    correctAnswers: number;
  }> => {
    if (!session) {
      throw new Error('لا توجد جلسة نشطة');
    }

    const correctAnswers = Object.entries(session.answers).filter(([index, answer]) => {
      const question = session.shuffled_questions[parseInt(index)];
      return answer === question.shuffledCorrectAnswer;
    }).length;

    const percentage = Math.round((session.score / session.max_score) * 100);

    // تحديث حالة الجلسة
    await supabase
      .from('grade11_quiz_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', session.id);

    const result = {
      finalScore: session.score,
      maxScore: session.max_score,
      percentage,
      totalQuestions: session.shuffled_questions.length,
      correctAnswers
    };

    // إعادة تعيين الحالة
    setSession(null);
    setCurrentQuestion(null);
    setQuestions([]);

    return result;
  }, [session]);

  // تنظيف الجلسات المنتهية الصلاحية
  useEffect(() => {
    const cleanupExpiredSessions = async () => {
      try {
        await supabase.rpc('cleanup_expired_quiz_sessions');
      } catch (error) {
        console.error('Error cleaning up expired sessions:', error);
      }
    };

    cleanupExpiredSessions();
    
    // تنظيف دوري كل 5 دقائق
    const interval = setInterval(cleanupExpiredSessions, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    session,
    currentQuestion,
    questions,
    loading,
    createSession,
    nextQuestion,
    answerQuestion,
    completeSession,
    
    // معلومات إضافية
    currentQuestionNumber: session ? session.current_question_index + 1 : 0,
    totalQuestions: session ? session.shuffled_questions.length : 0,
    currentScore: session ? session.score : 0,
    maxScore: session ? session.max_score : 0,
    progress: session ? Math.round(((session.current_question_index + 1) / session.shuffled_questions.length) * 100) : 0,
    timeRemaining: session ? Math.max(0, new Date(session.expires_at).getTime() - Date.now()) : 0,
    isCompleted: session ? session.current_question_index >= session.shuffled_questions.length : false
  };
}