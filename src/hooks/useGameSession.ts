import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { GameQuestion } from './useGrade11Game';
import { logger } from '@/lib/logger';

export interface GameSession {
  id: string;
  user_id: string;
  game_id?: string;
  lesson_id: string;
  session_data: any;
  started_at: string;
  ended_at?: string;
  score: number;
  max_score: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface SessionData {
  lessonId: string;
  questions: {
    id: string;
    question_text: string;
    choices: {id: string, text: string}[];
    correct_answer: string;
    explanation?: string;
    difficulty_level: 'easy' | 'medium' | 'hard';
    points: number;
  }[];
  currentQuestionIndex: number;
  answers: string[];
  score: number;
  startTime: number;
  endTime?: number;
  mistakesCount: number;
  hintsUsed: number;
  sessionId: string;
}

export interface QuestionState {
  answered: boolean;
  selectedAnswer?: string;
  isCorrect?: boolean;
  timeSpent: number;
  hintsUsed: number;
}

export const useGameSession = () => {
  const { user } = useAuth();
  const [session, setSession] = useState<GameSession | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [questionStates, setQuestionStates] = useState<Record<number, QuestionState>>({});
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(false);

  // إنشاء جلسة لعب جديدة في قاعدة البيانات
  const startSession = useCallback(async (lessonId: string, questions: GameQuestion[]) => {
    if (!user) {
      logger.error('Cannot start session: user not authenticated');
      return false;
    }

    try {
      setLoading(true);

      // تنظيف بيانات الأسئلة لضمان JSON صالح
      const cleanQuestions = questions.map(q => ({
        id: q.id,
        question_text: q.question_text,
        choices: Array.isArray(q.choices) ? q.choices : [],
        correct_answer: typeof q.correct_answer === 'string' ? q.correct_answer : String(q.correct_answer),
        explanation: q.explanation || '',
        difficulty_level: q.difficulty_level,
        points: q.points || 10
      }));

      const newSessionData: SessionData = {
        lessonId,
        questions: cleanQuestions,
        currentQuestionIndex: 0,
        answers: new Array(cleanQuestions.length).fill(''),
        score: 0,
        startTime: Date.now(),
        mistakesCount: 0,
        hintsUsed: 0,
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      // إنشاء جلسة في قاعدة البيانات
      const { data: newSession, error } = await supabase
        .from('grade11_game_sessions')
        .insert({
          user_id: user.id,
          lesson_id: lessonId,
          session_data: JSON.stringify(newSessionData), // تحويل صريح إلى JSON
          score: 0,
          max_score: cleanQuestions.reduce((sum, q) => sum + q.points, 0),
          completed: false
        })
        .select()
        .single();

      if (error) throw error;

      setSession(newSession);
      setSessionData(newSessionData);
      setQuestionStates({});

      logger.info('Game session started', { 
        sessionId: newSession.id, 
        lessonId, 
        questionCount: questions.length 
      });

      return true;
    } catch (error: any) {
      logger.error('Error starting session', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // استكمال جلسة محفوظة
  const resumeSession = useCallback(async (lessonId: string) => {
    if (!user) return false;

    try {
      setLoading(true);

      // البحث عن جلسة غير مكتملة
      const { data: existingSession, error } = await supabase
        .from('grade11_game_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .eq('completed', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (existingSession && existingSession.session_data) {
        setSession(existingSession);
        // تحليل آمن للبيانات المحفوظة
        const parsedData = typeof existingSession.session_data === 'string' 
          ? JSON.parse(existingSession.session_data)
          : existingSession.session_data;
        setSessionData(parsedData as SessionData);
        logger.info('Game session resumed', { sessionId: existingSession.id });
        return true;
      }

      return false;
    } catch (error: any) {
      logger.error('Error resuming session', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // تحديث جلسة اللعب في قاعدة البيانات
  const updateSessionInDatabase = useCallback(async (updatedSessionData: SessionData, score?: number) => {
    if (!session || !user) return;

    try {
      const updateData: any = {
        session_data: JSON.stringify(updatedSessionData), // تحويل صريح إلى JSON
        updated_at: new Date().toISOString()
      };

      if (score !== undefined) {
        updateData.score = score;
      }

      const { error } = await supabase
        .from('grade11_game_sessions')
        .update(updateData)
        .eq('id', session.id);

      if (error) throw error;

      setSession(prev => prev ? { ...prev, ...updateData } : null);
    } catch (error: any) {
      logger.error('Error updating session in database', error);
    }
  }, [session, user]);

  // إجابة سؤال
  const answerQuestion = useCallback(async (answer: string) => {
    if (!sessionData || !session) return false;

    const currentQuestion = sessionData.questions[sessionData.currentQuestionIndex];
    
    // تحسين مقارنة الإجابة - التعامل مع كل من الـ ID والـ object
    let isCorrect = false;
    if (typeof currentQuestion.correct_answer === 'string') {
      // إذا كانت الإجابة الصحيحة string (ID)
      isCorrect = answer === currentQuestion.correct_answer;
    } else {
      // إذا كانت الإجابة الصحيحة object، نحتاج لاستخراج الـ ID
      const correctAnswerId = typeof currentQuestion.correct_answer === 'object' && currentQuestion.correct_answer !== null
        ? (currentQuestion.correct_answer as any).id
        : String(currentQuestion.correct_answer);
      isCorrect = answer === correctAnswerId;
    }

    const questionStartTime = Date.now();

    // تحديث حالة السؤال
    setQuestionStates(prev => ({
      ...prev,
      [sessionData.currentQuestionIndex]: {
        answered: true,
        selectedAnswer: answer,
        isCorrect,
        timeSpent: questionStartTime - (prev[sessionData.currentQuestionIndex]?.timeSpent || sessionData.startTime),
        hintsUsed: prev[sessionData.currentQuestionIndex]?.hintsUsed || 0
      }
    }));

    // تحديث بيانات الجلسة
    const newAnswers = [...sessionData.answers];
    newAnswers[sessionData.currentQuestionIndex] = answer;
    
    const newScore = isCorrect ? sessionData.score + currentQuestion.points : sessionData.score;
    const newMistakesCount = !isCorrect ? sessionData.mistakesCount + 1 : sessionData.mistakesCount;

    const updatedSessionData = {
      ...sessionData,
      answers: newAnswers,
      score: newScore,
      mistakesCount: newMistakesCount
    };

    setSessionData(updatedSessionData);

    // حفظ التحديث في قاعدة البيانات
    await updateSessionInDatabase(updatedSessionData, newScore);

    return isCorrect;
  }, [sessionData, session, updateSessionInDatabase]);

  // الانتقال للسؤال التالي
  const nextQuestion = useCallback(async () => {
    if (!sessionData || !session) return false;

    if (sessionData.currentQuestionIndex < sessionData.questions.length - 1) {
      const updatedSessionData = {
        ...sessionData,
        currentQuestionIndex: sessionData.currentQuestionIndex + 1
      };

      setSessionData(updatedSessionData);
      await updateSessionInDatabase(updatedSessionData);
      return true;
    }
    return false;
  }, [sessionData, session, updateSessionInDatabase]);

  // إنهاء الجلسة
  const endSession = useCallback(async () => {
    if (!session || !sessionData || !user) return null;

    try {
      const endTime = Date.now();
      const totalTime = Math.floor((endTime - sessionData.startTime) / 1000); // بالثواني

      const finalSessionData = {
        ...sessionData,
        endTime
      };

      // تحديث الجلسة كمكتملة في قاعدة البيانات
      const { error } = await supabase
        .from('grade11_game_sessions')
        .update({
          session_data: JSON.stringify(finalSessionData), // تحويل صريح إلى JSON
          ended_at: new Date().toISOString(),
          completed: true
        })
        .eq('id', session.id);

      if (error) throw error;

      logger.info('Game session ended', { 
        sessionId: session.id, 
        score: sessionData.score, 
        totalTime,
        mistakes: sessionData.mistakesCount 
      });

      const finalSession = {
        ...session,
        session_data: finalSessionData,
        ended_at: new Date().toISOString(),
        completed: true
      };

      // إعادة تعيين الحالة المحلية
      setSession(null);
      setSessionData(null);
      setQuestionStates({});
      
      return finalSession;
    } catch (error: any) {
      logger.error('Error ending session', error);
      return null;
    }
  }, [session, sessionData, user]);

  // إيقاف/استكمال مؤقت
  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  // استخدام تلميح
  const useHint = useCallback(async (questionIndex: number) => {
    if (!sessionData || !session) return false;

    setQuestionStates(prev => ({
      ...prev,
      [questionIndex]: {
        ...prev[questionIndex],
        hintsUsed: (prev[questionIndex]?.hintsUsed || 0) + 1
      }
    }));

    const updatedSessionData = {
      ...sessionData,
      hintsUsed: sessionData.hintsUsed + 1
    };

    setSessionData(updatedSessionData);
    await updateSessionInDatabase(updatedSessionData);

    return true;
  }, [sessionData, session, updateSessionInDatabase]);

  // جلب الجلسات المكتملة للدرس
  const getCompletedSessions = useCallback(async (lessonId: string) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('grade11_game_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .eq('completed', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      logger.error('Error fetching completed sessions', error);
      return [];
    }
  }, [user]);

  // تنظيف الجلسات القديمة غير المكتملة
  useEffect(() => {
    const cleanupOldSessions = async () => {
      if (!user) return;

      try {
        const cutoffDate = new Date();
        cutoffDate.setHours(cutoffDate.getHours() - 24); // جلسات أقدم من 24 ساعة

        const { error } = await supabase
          .from('grade11_game_sessions')
          .delete()
          .eq('user_id', user.id)
          .eq('completed', false)
          .lt('created_at', cutoffDate.toISOString());

        if (error) throw error;
      } catch (error: any) {
        logger.error('Error cleaning up old sessions', error);
      }
    };

    cleanupOldSessions();
  }, [user]);

  return {
    session,
    sessionData,
    questionStates,
    isPaused,
    loading,
    startSession,
    resumeSession,
    answerQuestion,
    nextQuestion,
    endSession,
    togglePause,
    useHint,
    getCompletedSessions,
    currentQuestion: sessionData ? sessionData.questions[sessionData.currentQuestionIndex] : null,
    isLastQuestion: sessionData ? sessionData.currentQuestionIndex >= sessionData.questions.length - 1 : false,
    progress: sessionData ? ((sessionData.currentQuestionIndex + 1) / sessionData.questions.length) * 100 : 0
  };
};