import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

export interface QuestionCategory {
  id: string;
  name: string;
  name_ar: string;
  description?: string;
  color: string;
  icon: string;
}

export interface QuestionBank {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  choices: any;
  correct_answer?: string;
  explanation?: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  points: number;
  category_id?: string;
  section_id?: string;
  topic_id?: string;
  lesson_id?: string;
  tags: string[];
  is_active: boolean;
}

export interface ExamTemplate {
  id: string;
  title: string;
  description?: string;
  grade_level: string;
  total_questions: number;
  duration_minutes: number;
  difficulty_distribution: any;
  randomize_questions: boolean;
  randomize_answers: boolean;
  pass_percentage: number;
  max_attempts: number;
  show_results_immediately: boolean;
  is_active: boolean;
}

export interface TeacherExamInstance {
  id: string;
  template_id: string;
  teacher_id: string;
  school_id: string;
  is_active: boolean;
  max_attempts: number;
  show_results_immediately: boolean;
  randomize_questions: boolean;
  randomize_answers: boolean;
  pass_percentage: number;
  target_class_ids: string[];
  starts_at?: string;
  ends_at?: string;
}

export const useExamSystem = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QuestionBank[]>([]);
  const [templates, setTemplates] = useState<ExamTemplate[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [examInstances, setExamInstances] = useState<TeacherExamInstance[]>([]);

  // Fetch Question Bank
  const fetchQuestions = useCallback(async (filters?: {
    difficulty_level?: string;
    section_id?: string;
    topic_id?: string;
    lesson_id?: string;
  }) => {
    try {
      setLoading(true);
      let query = supabase
        .from('question_bank')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (filters?.difficulty_level) {
        query = query.eq('difficulty_level', filters.difficulty_level as any);
      }
      if (filters?.section_id) {
        query = query.eq('section_id', filters.section_id);
      }
      if (filters?.topic_id) {
        query = query.eq('topic_id', filters.topic_id);
      }
      if (filters?.lesson_id) {
        query = query.eq('lesson_id', filters.lesson_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setQuestions(data as any || []);
    } catch (error) {
      logger.error('Error fetching questions', error as Error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بنك الأسئلة",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Add Question to Bank
  const addQuestion = useCallback(async (questionData: any) => {
    try {
      setLoading(true);
      
      // Validate data before submission
      const cleanData = {
        ...questionData,
        created_by: userProfile?.user_id,
        school_id: userProfile?.school_id,
        // Ensure proper null handling for foreign keys
        section_id: questionData.section_id || null,
        topic_id: questionData.topic_id || null,
        lesson_id: questionData.lesson_id || null,
      };

      const { data, error } = await supabase
        .from('question_bank')
        .insert([cleanData])
        .select()
        .single();

      if (error) {
        logger.error('Supabase error', error);
        throw new Error(error.message || 'فشل في إضافة السؤال إلى قاعدة البيانات');
      }

      toast({
        title: "تم بنجاح",
        description: "تم إضافة السؤال إلى بنك الأسئلة",
      });

      await fetchQuestions();
      return data;
    } catch (error: any) {
      logger.error('Error adding question', error);
      
      let errorMessage = "فشل في إضافة السؤال";
      if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "خطأ في إضافة السؤال",
        description: errorMessage,
        variant: "destructive"
      });
      throw error; // Re-throw to let the component handle it
    } finally {
      setLoading(false);
    }
  }, [userProfile, fetchQuestions]);

  // Update Question
  const updateQuestion = useCallback(async (questionId: string, updates: any) => {
    try {
      setLoading(true);
      
      // Clean data for update
      const cleanUpdates = {
        ...updates,
        // Ensure proper null handling for foreign keys
        section_id: updates.section_id || null,
        topic_id: updates.topic_id || null,
        lesson_id: updates.lesson_id || null,
      };

      const { error } = await supabase
        .from('question_bank')
        .update(cleanUpdates)
        .eq('id', questionId);

      if (error) {
        logger.error('Supabase error', error);
        throw new Error(error.message || 'فشل في تحديث السؤال');
      }

      toast({
        title: "تم بنجاح",
        description: "تم تحديث السؤال",
      });

      await fetchQuestions();
    } catch (error: any) {
      logger.error('Error updating question', error);
      
      let errorMessage = "فشل في تحديث السؤال";
      if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "خطأ في التحديث",
        description: errorMessage,
        variant: "destructive"
      });
      throw error; // Re-throw to let the component handle it
    } finally {
      setLoading(false);
    }
  }, [fetchQuestions]);

  // Delete Question
  const deleteQuestion = useCallback(async (questionId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('question_bank')
        .update({ is_active: false })
        .eq('id', questionId);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم حذف السؤال",
      });

      await fetchQuestions();
    } catch (error) {
      logger.error('Error deleting question', error as Error);
      toast({
        title: "خطأ",
        description: "فشل في حذف السؤال",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [fetchQuestions]);

  // Fetch Exam Templates
  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('exam_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data as any || []);
    } catch (error) {
      logger.error('Error fetching templates', error as Error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل قوالب الاختبارات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Create Exam Template
  const createTemplate = useCallback(async (templateData: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('exam_templates')
        .insert([{
          ...templateData,
          created_by: userProfile?.user_id,
          school_id: userProfile?.school_id
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم إنشاء قالب الاختبار",
      });

      await fetchTemplates();
      return data;
    } catch (error) {
      logger.error('Error creating template', error as Error);
      toast({
        title: "خطأ",
        description: "فشل في إنشاء قالب الاختبار",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [userProfile, fetchTemplates]);

  // Fetch Sections with Question Counts
  const fetchSections = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch sections with question counts
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('grade11_sections')
        .select('id, title, order_index')
        .order('order_index', { ascending: true });

      if (sectionsError) throw sectionsError;

      // Get question counts for each section
      const sectionsWithCounts = await Promise.all(
        (sectionsData || []).map(async (section) => {
          const { count } = await supabase
            .from('question_bank')
            .select('*', { count: 'exact', head: true })
            .eq('section_id', section.id)
            .eq('is_active', true);
          
          return {
            ...section,
            question_count: count || 0
          };
        })
      );

      // Get general questions count (section_id IS NULL)
      const { count: generalQuestionsCount } = await supabase
        .from('question_bank')
        .select('*', { count: 'exact', head: true })
        .is('section_id', null)
        .eq('is_active', true);

      // Add general questions as a special section
      const sectionsWithGeneral = [
        {
          id: 'general',
          title: 'الأسئلة العامة',
          order_index: -1,
          question_count: generalQuestionsCount || 0
        },
        ...sectionsWithCounts
      ];

      setSections(sectionsWithGeneral);
    } catch (error) {
      logger.error('Error fetching sections', error as Error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الأقسام",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Update Template Settings
  const updateTemplateSettings = useCallback(async (templateId: string, settings: any) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('exam_templates')
        .update(settings)
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم تحديث إعدادات الاختبار",
      });

      await fetchTemplates();
    } catch (error) {
      logger.error('Error updating template settings', error as Error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث إعدادات الاختبار",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchTemplates]);

  // Generate Questions for Template Preview
  const generateTemplatePreview = useCallback(async (template: any) => {
    try {
      const questionSources = template.question_sources || { type: "random", sections: [] };
      const difficultyDist = template.difficulty_distribution || { easy: 30, medium: 50, hard: 20 };
      
      // Calculate question counts for each difficulty
      const totalQuestions = template.total_questions;
      const easyCount = Math.round((totalQuestions * difficultyDist.easy) / 100);
      const mediumCount = Math.round((totalQuestions * difficultyDist.medium) / 100);
      const hardCount = totalQuestions - easyCount - mediumCount;

      const selectedQuestions: any[] = [];

      // Get questions for each difficulty level
      for (const [difficulty, count] of [
        ['easy', easyCount],
        ['medium', mediumCount], 
        ['hard', hardCount]
      ] as Array<[string, number]>) {
        if (count <= 0) continue;

        let query = supabase
          .from('question_bank')
          .select('*')
          .eq('is_active', true)
          .eq('difficulty_level', difficulty as 'easy' | 'medium' | 'hard');

        // Apply section filters if specified
        if (questionSources.type === 'sections' && questionSources.sections?.length > 0) {
          const validSections = questionSources.sections.filter((s: string) => s !== 'general');
          if (validSections.length > 0) {
            query = query.in('section_id', validSections);
          } else {
            query = query.is('section_id', null);
          }
        }

        const { data: questions, error } = await query;
        if (error) throw error;

        // Randomly select questions
        const shuffled = questions?.sort(() => 0.5 - Math.random()) || [];
        const selected = shuffled.slice(0, count as number);
        selectedQuestions.push(...selected);
      }

      // Randomize questions if enabled
      if (template.randomize_questions) {
        selectedQuestions.sort(() => 0.5 - Math.random());
      }

      // Randomize answers if enabled
      const finalQuestions = selectedQuestions.map(q => {
        if (template.randomize_answers && q.choices && Array.isArray(q.choices)) {
          const shuffledChoices = [...q.choices].sort(() => 0.5 - Math.random());
          return { ...q, choices: shuffledChoices };
        }
        return q;
      });

      return {
        exam: template,
        questions: finalQuestions
      };
    } catch (error) {
      logger.error('Error generating template preview', error as Error);
      toast({
        title: "خطأ",
        description: "فشل في توليد معاينة الاختبار",
        variant: "destructive"
      });
      throw error;
    }
  }, []);

  // دالة لجلب نسخ المعلم من الاختبارات
  const fetchTeacherExamInstances = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('teacher_exam_instances')
        .select(`
          *,
          exam_templates(
            title,
            description,
            total_questions,
            duration_minutes,
            grade_level
          )
        `)
        .eq('teacher_id', userProfile?.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExamInstances(data || []);
    } catch (error) {
      logger.error('Error fetching teacher exam instances', error as Error);
      toast({
        title: "خطأ",
        description: "فشل في جلب نسخ الاختبارات",
        variant: "destructive",
      });
    }
  }, [userProfile?.user_id]);

  // دالة لجلب نسخة معينة من القالب
  const fetchTeacherExamInstance = async (templateId: string) => {
    try {
      const { data, error } = await supabase
        .from('teacher_exam_instances')
        .select('*')
        .eq('template_id', templateId)
        .eq('teacher_id', userProfile?.user_id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      logger.error('Error fetching teacher exam instance', error as Error);
      return null;
    }
  };

  // دالة لإنشاء أو تحديث نسخة المعلم
  const createOrUpdateExamInstance = async (
    templateId: string,
    settings: Partial<TeacherExamInstance>
  ) => {
    try {
      setLoading(true);

      const instanceData = {
        template_id: templateId,
        teacher_id: userProfile?.user_id,
        school_id: userProfile?.school_id,
        ...settings,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('teacher_exam_instances')
        .upsert(instanceData, {
          onConflict: 'template_id,teacher_id',
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم تحديث نسختك من الاختبار",
      });

      await fetchTeacherExamInstances();
      return data;
    } catch (error) {
      logger.error('Error creating/updating exam instance', error as Error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث الاختبار",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // دالة لتفعيل الاختبار لصفوف معينة
  const activateExamForClasses = async (
    templateId: string,
    classIds: string[],
    startsAt?: Date,
    endsAt?: Date
  ) => {
    return createOrUpdateExamInstance(templateId, {
      is_active: true,
      target_class_ids: classIds,
      starts_at: startsAt?.toISOString(),
      ends_at: endsAt?.toISOString(),
    });
  };

  return {
    loading,
    questions,
    templates,
    sections,
    examInstances,
    fetchQuestions,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    fetchTemplates,
    createTemplate,
    fetchSections,
    updateTemplateSettings,
    generateTemplatePreview,
    fetchTeacherExamInstances,
    fetchTeacherExamInstance,
    createOrUpdateExamInstance,
    activateExamForClasses,
  };
};