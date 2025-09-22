import type { GameQuestion } from '@/hooks/useGrade11Game';
import { logger } from '@/lib/logger';

// تطهير بيانات الأسئلة وضمان سلامتها
export const sanitizeQuestionData = (question: any): GameQuestion | null => {
  try {
    // التحقق من وجود البيانات المطلوبة
    if (!question.question_text || !question.choices) {
      logger.warn('Missing required question data', { questionId: question.id });
      return null;
    }

    // تحليل الخيارات
    let parsedChoices: {id: string, text: string}[] = [];
    
    if (Array.isArray(question.choices)) {
      // إذا كانت البيانات array، تحقق من تنسيقها
      parsedChoices = question.choices.map((choice: any, index: number) => {
        if (typeof choice === 'object' && choice.id && choice.text) {
          return choice;
        } else if (typeof choice === 'string') {
          return {
            id: String.fromCharCode(65 + index),
            text: choice
          };
        } else {
          return {
            id: String.fromCharCode(65 + index),
            text: String(choice || '')
          };
        }
      });
    } else if (typeof question.choices === 'string') {
      try {
        const parsed = JSON.parse(question.choices);
        parsedChoices = parsed.map((choice: any, index: number) => {
          if (typeof choice === 'object' && choice.id && choice.text) {
            return choice;
          } else {
            return {
              id: String.fromCharCode(65 + index),
              text: String(choice || '')
            };
          }
        });
      } catch {
        logger.warn('Failed to parse choices JSON', { questionId: question.id });
        return null;
      }
    }

    // التحقق من وجود الإجابة الصحيحة في الخيارات
    const choiceIds = parsedChoices.map(c => c.id);
    if (!choiceIds.includes(question.correct_answer)) {
      logger.warn('Correct answer not found in choices', { 
        questionId: question.id, 
        correctAnswer: question.correct_answer,
        choiceIds: choiceIds 
      });
    }

    return {
      id: question.id,
      section_id: question.section_id,
      topic_id: question.topic_id,
      lesson_id: question.lesson_id,
      question_text: question.question_text,
      question_type: question.question_type as 'multiple_choice' | 'true_false' | 'fill_blank',
      choices: parsedChoices,
      correct_answer: question.correct_answer,
      explanation: question.explanation || '',
      difficulty_level: (question.difficulty_level as 'easy' | 'medium' | 'hard') || 'medium',
      points: question.points || 10,
      time_limit: 60 // وقت افتراضي
    };

  } catch (error) {
    logger.error('Error sanitizing question data', error as Error, { questionId: question.id });
    return null;
  }
};

// حساب الدرجة النهائية مع المكافآت
export const calculateFinalScore = (
  correctAnswers: number,
  totalQuestions: number,
  timeBonus: number = 0,
  streakBonus: number = 0,
  perfectBonus: number = 0
): number => {
  const baseScore = (correctAnswers / totalQuestions) * 100;
  const bonuses = timeBonus + streakBonus + perfectBonus;
  return Math.min(100, Math.round(baseScore + bonuses));
};

// توليد أسئلة ديناميكية حسب الموضوع
export const generateDynamicQuestions = (topic: string, difficulty: 'easy' | 'medium' | 'hard', count: number = 5): GameQuestion[] => {
  const questions: GameQuestion[] = [];
  
  for (let i = 0; i < count; i++) {
    const questionId = `dyn_${topic}_${difficulty}_${i + 1}`;
    
    // Generate question based on topic and difficulty
    const questionData = generateQuestionForTopic(topic, difficulty);
    
    questions.push({
      id: questionId,
      section_id: 'dynamic',
      topic_id: 'dynamic',
      lesson_id: 'dynamic',
      question_text: questionData.text,
      question_type: 'multiple_choice',
      choices: questionData.choices,
      correct_answer: questionData.correct_answer,
      explanation: questionData.explanation,
      difficulty_level: difficulty,
      points: difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : 20,
      time_limit: 60
    });
  }
  
  return questions;
};

// توليد سؤال لموضوع معين
const generateQuestionForTopic = (topic: string, difficulty: 'easy' | 'medium' | 'hard') => {
  const questionTemplates = {
    'networking': {
      easy: [
        {
          text: 'ما هو المضيف في الشبكة؟',
          choices: [
            { id: 'A', text: 'أي جهاز متصل بالشبكة' },
            { id: 'B', text: 'فقط الخوادم' },
            { id: 'C', text: 'فقط الحاسوب' },
            { id: 'D', text: 'فقط الطابعة' }
          ],
          correct_answer: 'A',
          explanation: 'المضيف هو أي جهاز متصل بالشبكة'
        }
      ],
      medium: [
        {
          text: 'ما الفرق بين Hub و Switch؟',
          choices: [
            { id: 'A', text: 'Hub يعمل في الطبقة الفيزيائية، Switch في طبقة البيانات' },
            { id: 'B', text: 'لا يوجد فرق' },
            { id: 'C', text: 'Hub أسرع' },
            { id: 'D', text: 'Switch أبطأ' }
          ],
          correct_answer: 'A',
          explanation: 'Hub يعمل في الطبقة الفيزيائية بينما Switch في طبقة وصلة البيانات'
        }
      ],
      hard: [
        {
          text: 'في شبكة Class C، كم عدد المضيفين الممكن؟',
          choices: [
            { id: 'A', text: '254 مضيف' },
            { id: 'B', text: '256 مضيف' },
            { id: 'C', text: '1024 مضيف' },
            { id: 'D', text: '65536 مضيف' }
          ],
          correct_answer: 'A',
          explanation: 'Class C يدعم 254 مضيف (2^8 - 2)'
        }
      ]
    }
  };

  const templates = questionTemplates[topic as keyof typeof questionTemplates] || questionTemplates.networking;
  const difficultyQuestions = templates[difficulty] || templates.easy;
  
  return difficultyQuestions[Math.floor(Math.random() * difficultyQuestions.length)];
};

// تحليل أداء اللعبة
export const analyzeGamePerformance = (answers: string[], correctAnswers: string[], timeSpent: number[]) => {
  const correctCount = answers.filter((answer, index) => answer === correctAnswers[index]).length;
  const accuracy = (correctCount / answers.length) * 100;
  const totalTime = timeSpent.reduce((sum, time) => sum + time, 0);
  const averageTime = totalTime / answers.length;
  
  return {
    correctCount,
    totalQuestions: answers.length,
    accuracy: Math.round(accuracy),
    totalTime: Math.round(totalTime),
    averageTime: Math.round(averageTime),
    performance: accuracy >= 80 ? 'excellent' : accuracy >= 60 ? 'good' : 'needs_improvement'
  };
};