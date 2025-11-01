import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

      const realNetworkingQuestions = [
        {
          question_text: "ما هو البروتوكول المستخدم لتخصيص عناوين IP تلقائياً؟",
          choices: ["DHCP", "DNS", "HTTP", "FTP"],
          correct_answer: "DHCP",
          category: "بروتوكولات الشبكة",
          explanation: "DHCP (Dynamic Host Configuration Protocol) يُستخدم لتخصيص عناوين IP تلقائياً للأجهزة في الشبكة"
        },
        {
          question_text: "أي طبقة من طبقات OSI مسؤولة عن التوجيه (Routing)؟",
          choices: ["الطبقة الثالثة - طبقة الشبكة", "الطبقة الثانية - طبقة وصلة البيانات", "الطبقة الرابعة - طبقة النقل", "الطبقة الخامسة - طبقة الجلسة"],
          correct_answer: "الطبقة الثالثة - طبقة الشبكة",
          category: "نموذج OSI",
          explanation: "طبقة الشبكة (Layer 3) مسؤولة عن التوجيه واختيار أفضل مسار للبيانات"
        },
        {
          question_text: "ما هو الفرق الرئيسي بين Switch و Hub؟",
          choices: ["Switch يعمل في طبقة وصلة البيانات، Hub يعمل في الطبقة الفيزيائية", "Switch أسرع فقط", "لا يوجد فرق", "Hub أكثر أماناً"],
          correct_answer: "Switch يعمل في طبقة وصلة البيانات، Hub يعمل في الطبقة الفيزيائية",
          category: "أجهزة الشبكة",
          explanation: "Switch ذكي ويعمل في طبقة وصلة البيانات ويتعرف على عناوين MAC، بينما Hub بسيط ويعمل في الطبقة الفيزيائية"
        },
        {
          question_text: "كم عدد البتات في عنوان IPv4؟",
          choices: ["32 بت", "64 بت", "128 بت", "16 بت"],
          correct_answer: "32 بت",
          category: "عناوين IP",
          explanation: "عنوان IPv4 يتكون من 32 بت مقسمة إلى 4 مجموعات كل مجموعة 8 بت"
        },
        {
          question_text: "ما هو المنفذ الافتراضي لبروتوكول HTTP؟",
          choices: ["80", "443", "21", "25"],
          correct_answer: "80",
          category: "بروتوكولات التطبيق",
          explanation: "المنفذ 80 هو المنفذ الافتراضي لبروتوكول HTTP، بينما 443 لـ HTTPS"
        },
        {
          question_text: "ما هي فائدة قناع الشبكة الفرعية (Subnet Mask)؟",
          choices: ["تحديد جزء الشبكة وجزء المضيف في عنوان IP", "تشفير البيانات", "تسريع الاتصال", "حماية من الفيروسات"],
          correct_answer: "تحديد جزء الشبكة وجزء المضيف في عنوان IP",
          category: "الشبكات الفرعية",
          explanation: "قناع الشبكة الفرعية يساعد في تقسيم عنوان IP إلى جزأين: جزء الشبكة وجزء المضيف"
        },
        {
          question_text: "أي من البروتوكولات التالية يعمل بدون اتصال (Connectionless)؟",
          choices: ["UDP", "TCP", "SMTP", "FTP"],
          correct_answer: "UDP",
          category: "بروتوكولات النقل",
          explanation: "UDP بروتوكول بسيط وسريع لا يتطلب إنشاء اتصال قبل إرسال البيانات، على عكس TCP"
        },
        {
          question_text: "ما هو VLAN؟",
          choices: ["شبكة محلية افتراضية", "نوع من الكابلات", "بروتوكول أمان", "جهاز شبكة"],
          correct_answer: "شبكة محلية افتراضية",
          category: "تقنيات الشبكة المتقدمة",
          explanation: "VLAN (Virtual Local Area Network) تسمح بتقسيم الشبكة الفيزيائية إلى عدة شبكات منطقية منفصلة"
        }
      ];

      for (const question of realNetworkingQuestions) {
        const { error } = await supabase
          .from('grade11_game_questions')
          .insert([{
            question_text: question.question_text,
            choices: question.choices,
            correct_answer: question.correct_answer,
            lesson_id: null, // يمكن ربطها بدروس لاحقاً
            difficulty: determineDifficulty({
              question_text: question.question_text,
              choices: question.choices
            }),
            category: question.category,
            explanation: question.explanation
          }]);

        if (error) {
          console.error('Error adding question:', error);
          toast.error(`خطأ في إضافة السؤال: ${question.question_text.substring(0, 30)}...`);
        }
      }

      toast.success(`تم إضافة ${realNetworkingQuestions.length} سؤال جديد بنجاح`);
      await fetchQuestions(); // تحديث القائمة
      
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