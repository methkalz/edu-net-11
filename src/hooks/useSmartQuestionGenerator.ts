import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface QuestionTemplate {
  id: string;
  template_name: string;
  question_type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching' | 'ordering' | 'drag_drop' | 'scenario_based' | 'code_analysis';
  template_pattern: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  subject_category: string;
}

export interface ContentConcept {
  id: string;
  lesson_id: string;
  concept_text: string;
  concept_type: 'definition' | 'process' | 'example' | 'comparison' | 'advantage' | 'disadvantage';
  importance_level: number;
}

export interface GeneratedQuestion {
  id?: string;
  lesson_id: string;
  concept_id?: string;
  template_id?: string;
  question_text: string;
  question_type: string;
  choices?: string[];
  correct_answer: string;
  explanation?: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  points: number;
  time_limit: number;
  usage_count: number;
  success_rate: number;
  is_approved: boolean;
}

export const useSmartQuestionGenerator = () => {
  const [templates, setTemplates] = useState<QuestionTemplate[]>([]);
  const [concepts, setConcepts] = useState<Record<string, ContentConcept[]>>({});
  const [generatedQuestions, setGeneratedQuestions] = useState<Record<string, GeneratedQuestion[]>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // جلب قوالب الأسئلة
  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('grade11_question_templates')
        .select('*')
        .order('template_name');

      if (error) throw error;
      
      const typedTemplates: QuestionTemplate[] = (data || []).map(template => ({
        ...template,
        question_type: template.question_type as QuestionTemplate['question_type'],
        difficulty_level: template.difficulty_level as 'easy' | 'medium' | 'hard'
      }));
      
      setTemplates(typedTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  // جلب مفاهيم المحتوى للدروس
  const fetchConcepts = async () => {
    try {
      const { data, error } = await supabase
        .from('grade11_content_concepts')
        .select('*')
        .order('importance_level', { ascending: false });

      if (error) throw error;

      const conceptsMap: Record<string, ContentConcept[]> = {};
      data?.forEach(concept => {
        if (!conceptsMap[concept.lesson_id]) {
          conceptsMap[concept.lesson_id] = [];
        }
        conceptsMap[concept.lesson_id].push({
          ...concept,
          concept_type: concept.concept_type as ContentConcept['concept_type']
        });
      });

      setConcepts(conceptsMap);
    } catch (error) {
      console.error('Error fetching concepts:', error);
    }
  };

  // جلب الأسئلة المولدة
  const fetchGeneratedQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('grade11_generated_questions')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const questionsMap: Record<string, GeneratedQuestion[]> = {};
      data?.forEach(question => {
        if (!questionsMap[question.lesson_id]) {
          questionsMap[question.lesson_id] = [];
        }
        questionsMap[question.lesson_id].push({
          ...question,
          difficulty_level: question.difficulty_level as 'easy' | 'medium' | 'hard',
          choices: Array.isArray(question.choices) ? question.choices : JSON.parse(question.choices as string || '[]')
        });
      });

      setGeneratedQuestions(questionsMap);
    } catch (error) {
      console.error('Error fetching generated questions:', error);
    }
  };

  // تحليل محتوى الدرس واستخراج المفاهيم
  const analyzeLessonContent = async (lessonId: string, content: string) => {
    try {
      const extractedConcepts = extractConceptsFromText(content);
      
      const conceptsToSave = extractedConcepts.map(concept => ({
        lesson_id: lessonId,
        concept_text: concept.text,
        concept_type: concept.type,
        importance_level: concept.importance
      }));

      const { data, error } = await supabase
        .from('grade11_content_concepts')
        .upsert(conceptsToSave, { onConflict: 'lesson_id,concept_text' })
        .select();

      if (error) throw error;

      // تحديث الحالة المحلية
      setConcepts(prev => ({
        ...prev,
        [lessonId]: (data || []).map(concept => ({
          ...concept,
          concept_type: concept.concept_type as ContentConcept['concept_type']
        }))
      }));

      toast({
        title: 'تم تحليل المحتوى',
        description: `تم استخراج ${extractedConcepts.length} مفهوم من المحتوى`
      });

      return data;
    } catch (error) {
      console.error('Error analyzing lesson content:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحليل محتوى الدرس',
        variant: 'destructive'
      });
      return [];
    }
  };

  // استخراج المفاهيم من النص
  const extractConceptsFromText = (content: string) => {
    const concepts: Array<{text: string, type: ContentConcept['concept_type'], importance: number}> = [];
    
    // تقسيم النص إلى جمل
    const sentences = content.split(/[.!؟]/).filter(s => s.trim().length > 10);

    sentences.forEach(sentence => {
      const cleanSentence = sentence.trim();
      
      // البحث عن التعاريف
      if (cleanSentence.includes('هو') || cleanSentence.includes('هي') || cleanSentence.includes('يُعرف') || cleanSentence.includes('تُعرف')) {
        concepts.push({
          text: cleanSentence,
          type: 'definition',
          importance: 5
        });
      }
      
      // البحث عن العمليات والعمليات
      else if (cleanSentence.includes('يقوم') || cleanSentence.includes('تقوم') || cleanSentence.includes('العملية') || cleanSentence.includes('الخطوات')) {
        concepts.push({
          text: cleanSentence,
          type: 'process',
          importance: 4
        });
      }
      
      // البحث عن الأمثلة
      else if (cleanSentence.includes('مثال') || cleanSentence.includes('على سبيل المثال') || cleanSentence.includes('مثل')) {
        concepts.push({
          text: cleanSentence,
          type: 'example',
          importance: 3
        });
      }
      
      // البحث عن المقارنات
      else if (cleanSentence.includes('بينما') || cleanSentence.includes('الفرق') || cleanSentence.includes('مقارنة') || cleanSentence.includes('بخلاف')) {
        concepts.push({
          text: cleanSentence,
          type: 'comparison',
          importance: 4
        });
      }
      
      // البحث عن المزايا
      else if (cleanSentence.includes('ميزة') || cleanSentence.includes('فائدة') || cleanSentence.includes('إيجابية') || cleanSentence.includes('مزايا')) {
        concepts.push({
          text: cleanSentence,
          type: 'advantage',
          importance: 3
        });
      }
      
      // البحث عن العيوب
      else if (cleanSentence.includes('عيب') || cleanSentence.includes('مشكلة') || cleanSentence.includes('سلبية') || cleanSentence.includes('عيوب')) {
        concepts.push({
          text: cleanSentence,
          type: 'disadvantage',
          importance: 3
        });
      }
    });

    return concepts;
  };

  // توليد أسئلة من المفاهيم والقوالب
  const generateQuestionsForLesson = async (
    lessonId: string, 
    requestedCount: number,
    difficultyDistribution: { easy: number, medium: number, hard: number }
  ) => {
    try {
      const lessonConcepts = concepts[lessonId] || [];
      if (lessonConcepts.length === 0) {
        throw new Error('لم يتم العثور على مفاهيم لهذا الدرس');
      }

      const newQuestions: Omit<GeneratedQuestion, 'id'>[] = [];

      // حساب عدد الأسئلة لكل مستوى صعوبة
      const easyCount = Math.round((requestedCount * difficultyDistribution.easy) / 100);
      const mediumCount = Math.round((requestedCount * difficultyDistribution.medium) / 100);
      const hardCount = requestedCount - easyCount - mediumCount;

      // توليد أسئلة سهلة
      for (let i = 0; i < easyCount; i++) {
        const question = await generateSingleQuestion(lessonId, lessonConcepts, 'easy');
        if (question) newQuestions.push(question);
      }

      // توليد أسئلة متوسطة
      for (let i = 0; i < mediumCount; i++) {
        const question = await generateSingleQuestion(lessonId, lessonConcepts, 'medium');
        if (question) newQuestions.push(question);
      }

      // توليد أسئلة صعبة
      for (let i = 0; i < hardCount; i++) {
        const question = await generateSingleQuestion(lessonId, lessonConcepts, 'hard');
        if (question) newQuestions.push(question);
      }

      // حفظ الأسئلة في قاعدة البيانات
      if (newQuestions.length > 0) {
        const { data, error } = await supabase
          .from('grade11_generated_questions')
          .insert(newQuestions)
          .select();

        if (error) throw error;

        // تحديث الحالة المحلية
        setGeneratedQuestions(prev => ({
          ...prev,
          [lessonId]: [...(prev[lessonId] || []), ...(data || []).map(q => ({
            ...q,
            difficulty_level: q.difficulty_level as 'easy' | 'medium' | 'hard',
            choices: Array.isArray(q.choices) ? q.choices : JSON.parse(q.choices as string || '[]')
          }))]
        }));

        toast({
          title: 'تم توليد الأسئلة',
          description: `تم توليد ${newQuestions.length} سؤال جديد للدرس`
        });
      }

      return newQuestions;
    } catch (error) {
      console.error('Error generating questions:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في توليد الأسئلة',
        variant: 'destructive'
      });
      return [];
    }
  };

  // توليد سؤال واحد
  const generateSingleQuestion = async (
    lessonId: string,
    lessonConcepts: ContentConcept[],
    difficulty: 'easy' | 'medium' | 'hard'
  ): Promise<Omit<GeneratedQuestion, 'id'> | null> => {
    try {
      // اختيار قالب مناسب للصعوبة
      const suitableTemplates = templates.filter(t => t.difficulty_level === difficulty);
      if (suitableTemplates.length === 0) return null;

      const template = suitableTemplates[Math.floor(Math.random() * suitableTemplates.length)];
      
      // اختيار مفهوم مناسب
      const suitableConcepts = lessonConcepts.filter(c => 
        (template.subject_category === 'definitions' && c.concept_type === 'definition') ||
        (template.subject_category === 'functions' && c.concept_type === 'process') ||
        (template.subject_category === 'advantages' && c.concept_type === 'advantage') ||
        (template.subject_category === 'disadvantages' && c.concept_type === 'disadvantage') ||
        (template.subject_category === 'comparisons' && c.concept_type === 'comparison') ||
        template.subject_category === 'general'
      );

      if (suitableConcepts.length === 0) return null;

      const concept = suitableConcepts[Math.floor(Math.random() * suitableConcepts.length)];

      // توليد السؤال باستخدام القالب والمفهوم
      const questionData = generateQuestionFromTemplate(template, concept, lessonConcepts);
      
      if (!questionData) return null;

      return {
        lesson_id: lessonId,
        concept_id: concept.id,
        template_id: template.id,
        question_text: questionData.question_text,
        question_type: template.question_type,
        choices: questionData.choices,
        correct_answer: questionData.correct_answer,
        explanation: questionData.explanation,
        difficulty_level: difficulty,
        points: difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : 20,
        time_limit: difficulty === 'easy' ? 60 : difficulty === 'medium' ? 90 : 120,
        usage_count: 0,
        success_rate: 0,
        is_approved: false // يحتاج مراجعة
      };
    } catch (error) {
      console.error('Error generating single question:', error);
      return null;
    }
  };

  // توليد سؤال من القالب والمفهوم
  const generateQuestionFromTemplate = (
    template: QuestionTemplate,
    concept: ContentConcept,
    allConcepts: ContentConcept[]
  ) => {
    try {
      let questionText = template.template_pattern;
      let choices: string[] = [];
      let correctAnswer = '';
      let explanation = '';

      // استخراج المفهوم الأساسي من النص
      const conceptKey = extractKeyFromConcept(concept.concept_text);
      
      // استبدال متغيرات القالب
      questionText = questionText.replace('{CONCEPT}', conceptKey);

      switch (template.question_type) {
        case 'multiple_choice':
          const mcData = generateMultipleChoiceData(concept, allConcepts);
          choices = mcData.choices;
          correctAnswer = mcData.correct_answer;
          explanation = mcData.explanation;
          break;

        case 'true_false':
          const tfData = generateTrueFalseData(concept);
          correctAnswer = tfData.correct_answer;
          explanation = tfData.explanation;
          questionText = questionText.replace('{STATEMENT}', tfData.statement);
          break;

        case 'fill_blank':
          const fbData = generateFillBlankData(concept);
          correctAnswer = fbData.correct_answer;
          explanation = fbData.explanation;
          questionText = questionText.replace('{FUNCTION}', fbData.function);
          break;

        default:
          return null;
      }

      return {
        question_text: questionText,
        choices,
        correct_answer: correctAnswer,
        explanation
      };
    } catch (error) {
      console.error('Error generating question from template:', error);
      return null;
    }
  };

  // استخراج المفتاح الأساسي من المفهوم
  const extractKeyFromConcept = (conceptText: string): string => {
    // استخراج أول كلمة مهمة من المفهوم
    const words = conceptText.split(' ');
    const importantWords = words.filter(word => 
      word.length > 3 && 
      !['الذي', 'التي', 'هو', 'هي', 'يقوم', 'تقوم', 'في', 'على', 'من', 'إلى'].includes(word)
    );
    
    return importantWords[0] || words[0] || 'المفهوم';
  };

  // توليد بيانات الأسئلة متعددة الخيارات
  const generateMultipleChoiceData = (concept: ContentConcept, allConcepts: ContentConcept[]) => {
    const correctAnswer = extractKeyFromConcept(concept.concept_text);
    
    // توليد خيارات خاطئة من مفاهيم أخرى
    const wrongChoices = allConcepts
      .filter(c => c.id !== concept.id && c.concept_type === concept.concept_type)
      .map(c => extractKeyFromConcept(c.concept_text))
      .slice(0, 3);

    // إضافة خيارات عامة إذا لم يكن هناك خيارات كافية
    while (wrongChoices.length < 3) {
      const genericChoices = ['غير محدد', 'لا ينطبق', 'جميع ما سبق', 'لا شيء مما سبق'];
      const unusedGeneric = genericChoices.find(choice => !wrongChoices.includes(choice));
      if (unusedGeneric) wrongChoices.push(unusedGeneric);
      else break;
    }

    const choices = [correctAnswer, ...wrongChoices].slice(0, 4);
    // خلط الخيارات
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }

    return {
      choices,
      correct_answer: correctAnswer,
      explanation: concept.concept_text
    };
  };

  // توليد بيانات أسئلة صح/خطأ
  const generateTrueFalseData = (concept: ContentConcept) => {
    const isTrue = Math.random() > 0.5;
    
    let statement = concept.concept_text;
    if (!isTrue) {
      // تعديل العبارة لتصبح خاطئة
      statement = statement.replace(/يقوم/g, 'لا يقوم').replace(/تقوم/g, 'لا تقوم');
      if (statement === concept.concept_text) {
        statement = 'لا ' + statement;
      }
    }

    return {
      statement,
      correct_answer: isTrue ? 'صحيح' : 'خطأ',
      explanation: concept.concept_text
    };
  };

  // توليد بيانات أسئلة ملء الفراغ
  const generateFillBlankData = (concept: ContentConcept) => {
    const key = extractKeyFromConcept(concept.concept_text);
    const functionText = concept.concept_text.split(key)[1]?.trim() || 'يؤدي وظائف متعددة';

    return {
      function: functionText,
      correct_answer: key,
      explanation: concept.concept_text
    };
  };

  // الموافقة على الأسئلة المولدة
  const approveGeneratedQuestions = async (questionIds: string[]) => {
    try {
      const { error } = await supabase
        .from('grade11_generated_questions')
        .update({ is_approved: true })
        .in('id', questionIds);

      if (error) throw error;

      // تحديث الحالة المحلية
      setGeneratedQuestions(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(lessonId => {
          updated[lessonId] = updated[lessonId].map(q => 
            questionIds.includes(q.id || '') ? { ...q, is_approved: true } : q
          );
        });
        return updated;
      });

      toast({
        title: 'تمت الموافقة',
        description: `تمت الموافقة على ${questionIds.length} سؤال`
      });
    } catch (error) {
      console.error('Error approving questions:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في الموافقة على الأسئلة',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await Promise.all([
        fetchTemplates(),
        fetchConcepts(),
        fetchGeneratedQuestions()
      ]);
      setLoading(false);
    };

    initializeData();
  }, []);

  return {
    templates,
    concepts,
    generatedQuestions,
    loading,
    analyzeLessonContent,
    generateQuestionsForLesson,
    approveGeneratedQuestions,
    refetch: () => {
      fetchTemplates();
      fetchConcepts();
      fetchGeneratedQuestions();
    }
  };
};