import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { grade11NetworkingQuestions, questionsMetadata } from '@/data/grade11NetworkingQuestions';

export interface RealQuestion {
  id: string;
  question_text: string;
  choices: {id: string, text: string}[];
  correct_answer: string;
  lesson_id: string | null;
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
  explanation?: string;
}

export interface QuestionStats {
  totalQuestions: number;
  easyQuestions: number;
  mediumQuestions: number;
  hardQuestions: number;
  categoryCounts: Record<string, number>;
}

export const useRealQuestionGenerator = () => {
  const [questions, setQuestions] = useState<RealQuestion[]>([]);
  const [stats, setStats] = useState<QuestionStats | null>(null);
  const [loading, setLoading] = useState(false);

  // جلب الأسئلة الموجودة
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('grade11_game_questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching questions:', error);
        toast.error('خطأ في جلب الأسئلة');
        return;
      }

      if (data) {
        // تحويل البيانات من قاعدة البيانات إلى الشكل المطلوب
        const formattedQuestions = data.map(q => {
          let validatedChoices = [];
          
          try {
            // Handle choices parsing more safely
            let parsedChoices = [];
            if (Array.isArray(q.choices)) {
              parsedChoices = q.choices;
            } else if (typeof q.choices === 'string') {
              try {
                parsedChoices = JSON.parse(q.choices);
              } catch {
                parsedChoices = [];
              }
            } else {
              parsedChoices = [];
            }
            
            // التأكد من أن الخيارات بالتنسيق الصحيح {id, text}
            validatedChoices = parsedChoices.map((choice: any, index: number) => {
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
                  text: String(choice)
                };
              }
            });
          } catch (error) {
            console.error('Error parsing choices:', error);
            validatedChoices = [];
          }

          return {
            id: q.id,
            question_text: q.question_text,
            choices: validatedChoices,
            correct_answer: q.correct_answer,
            lesson_id: q.lesson_id,
            difficulty: determineDifficulty(q),
            category: 'عام',
            explanation: q.explanation || undefined
          };
        });
        setQuestions(formattedQuestions);
        calculateStats(formattedQuestions);
      }
    } catch (error) {
      console.error('Error in fetchQuestions:', error);
      toast.error('خطأ في النظام');
    } finally {
      setLoading(false);
    }
  };

  // حساب إحصائيات الأسئلة
  const calculateStats = (questionsData: any[]) => {
    const stats: QuestionStats = {
      totalQuestions: questionsData.length,
      easyQuestions: 0,
      mediumQuestions: 0,
      hardQuestions: 0,
      categoryCounts: {}
    };

    questionsData.forEach(q => {
      // حساب الصعوبة حسب طول النص والخيارات
      const difficulty = determineDifficulty(q);
      if (difficulty === 'easy') stats.easyQuestions++;
      else if (difficulty === 'medium') stats.mediumQuestions++;
      else stats.hardQuestions++;

      // حساب الفئات
      const category = q.category || 'عام';
      stats.categoryCounts[category] = (stats.categoryCounts[category] || 0) + 1;
    });

    setStats(stats);
  };

  // تحديد صعوبة السؤال
  const determineDifficulty = (question: any): 'easy' | 'medium' | 'hard' => {
    const textLength = question.question_text.length;
    const choicesCount = question.choices?.length || 0;
    
    if (textLength < 50 && choicesCount <= 3) return 'easy';
    if (textLength < 100 && choicesCount <= 4) return 'medium';
    return 'hard';
  };

  // إضافة أسئلة حقيقية جديدة
  const addRealQuestions = async () => {
    try {
      setLoading(true);
      toast.info(`جاري إضافة ${questionsMetadata.totalQuestions} سؤال من ${questionsMetadata.totalCards} بطاقة...`);
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const question of grade11NetworkingQuestions) {
        const { error } = await supabase
          .from('grade11_game_questions')
          .insert([{
            section_id: question.section_id,
            topic_id: question.topic_id,
            lesson_id: question.lesson_id,
            question_text: question.question_text,
            question_type: 'multiple_choice',
            choices: question.choices,
            correct_answer: question.correct_answer,
            explanation: question.explanation,
            difficulty_level: question.difficulty_level,
            points: 10
          }]);

        if (error) {
          console.error('Error adding question:', error);
          errorCount++;
        } else {
          successCount++;
        }
      }

      toast.success(`تم إضافة ${successCount} سؤال بنجاح! 🎉\n${questionsMetadata.totalCards} بطاقة جاهزة للعب!`);
      if (errorCount > 0) {
        toast.warning(`فشل إضافة ${errorCount} سؤال ⚠️`);
      }
      
      await fetchQuestions();
      
    } catch (error) {
      console.error('Error adding real questions:', error);
      toast.error('خطأ في إضافة الأسئلة الجديدة');
    } finally {
      setLoading(false);
    }
  };

  // حذف سؤال محدد
  const deleteQuestion = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from('grade11_game_questions')
        .delete()
        .eq('id', questionId);

      if (error) {
        console.error('Error deleting question:', error);
        toast.error('خطأ في حذف السؤال');
        return false;
      }

      toast.success('تم حذف السؤال بنجاح');
      await fetchQuestions(); // تحديث القائمة
      return true;
    } catch (error) {
      console.error('Error in deleteQuestion:', error);
      toast.error('خطأ في النظام');
      return false;
    }
  };

  // جلب أسئلة لدرس معين
  const getQuestionsForLesson = async (lessonId: string, count: number = 5): Promise<RealQuestion[]> => {
    try {
      const { data, error } = await supabase
        .from('grade11_game_questions')
        .select('*')
        .eq('lesson_id', lessonId)
        .limit(count);

      if (error) {
        console.error('Error fetching lesson questions:', error);
        return [];
      }

      // إذا لم توجد أسئلة للدرس، اجلب أسئلة عامة
      if (!data || data.length === 0) {
        const { data: generalData, error: generalError } = await supabase
          .from('grade11_game_questions')
          .select('*')
          .is('lesson_id', null)
          .limit(count);

        if (generalError) {
          console.error('Error fetching general questions:', generalError);
          return [];
        }

        // تحويل البيانات العامة إلى الشكل المطلوب
        return (generalData || []).map(q => {
          let validatedChoices = [];
          
          try {
            // Handle choices parsing more safely
            let parsedChoices = [];
            if (Array.isArray(q.choices)) {
              parsedChoices = q.choices;
            } else if (typeof q.choices === 'string') {
              try {
                parsedChoices = JSON.parse(q.choices);
              } catch {
                parsedChoices = [];
              }
            } else {
              parsedChoices = [];
            }
            
            validatedChoices = parsedChoices.map((choice: any, index: number) => {
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
                  text: String(choice)
                };
              }
            });
          } catch (error) {
            console.error('Error parsing choices:', error);
            validatedChoices = [];
          }

          return {
            id: q.id,
            question_text: q.question_text,
            choices: validatedChoices,
            correct_answer: q.correct_answer,
            lesson_id: q.lesson_id,
            difficulty: determineDifficulty(q),
            category: 'عام',
            explanation: q.explanation || undefined
          };
        });
      }

      // تحويل بيانات الدرس إلى الشكل المطلوب
      return data.map(q => {
        let validatedChoices = [];
        
        try {
          // Handle choices parsing more safely
          let parsedChoices = [];
          if (Array.isArray(q.choices)) {
            parsedChoices = q.choices;
          } else if (typeof q.choices === 'string') {
            try {
              parsedChoices = JSON.parse(q.choices);
            } catch {
              parsedChoices = [];
            }
          } else {
            parsedChoices = [];
          }
          
          validatedChoices = parsedChoices.map((choice: any, index: number) => {
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
                text: String(choice)
              };
            }
          });
        } catch (error) {
          console.error('Error parsing choices:', error);
          validatedChoices = [];
        }

        return {
          id: q.id,
          question_text: q.question_text,
          choices: validatedChoices,
          correct_answer: q.correct_answer,
          lesson_id: q.lesson_id,
          difficulty: determineDifficulty(q),
          category: 'عام',
          explanation: q.explanation || undefined
        };
      });
    } catch (error) {
      console.error('Error in getQuestionsForLesson:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  return {
    questions,
    stats,
    loading,
    fetchQuestions,
    addRealQuestions,
    deleteQuestion,
    getQuestionsForLesson
  };
};