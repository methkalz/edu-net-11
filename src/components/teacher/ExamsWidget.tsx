import React, { useState } from 'react';
import { InteractiveSourceDistributor, createDefaultSources, type SourceDistribution } from '@/components/exams/InteractiveSourceDistributor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, FileQuestion, TrendingUp, Users, ArrowRight, Plus, ArrowLeft, Trash2, Edit, AlertCircle, CheckCircle, Archive, Clock, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import ExamPreview from '@/components/content/ExamPreview';
import { useExamPreview } from '@/hooks/useExamPreview';
import { formatDateTime12H } from '@/utils/dateFormatting';
import { DateTimePicker } from '@/components/ui/datetime-picker';

// معالج أخطاء عام للتطوير
if (import.meta.env.DEV) {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled Promise Rejection:', event.reason);
  });
}
import { useNavigate } from 'react-router-dom';
import { useTeacherExams } from '@/hooks/useTeacherExams';
import { useTeacherQuestions } from '@/hooks/useTeacherQuestions';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/logging';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TeacherQuestionDialog } from '@/components/exam/TeacherQuestionDialog';

interface ExamsWidgetProps {
  canAccessGrade10: boolean;
  canAccessGrade11: boolean;
}

// Schema محسّن للنموذج مع التحكم الذكي
const createExamSchema = z.object({
  title: z.string().min(1, 'العنوان مطلوب').max(200, 'العنوان طويل جداً'),
  description: z.string().optional(),
  exam_type: z.enum(['quiz', 'midterm', 'final', 'practice']),
  selection_type: z.enum(['all_grade', 'specific_classes']).default('all_grade'),
  grade_levels: z.array(z.string()).optional(),
  target_classes: z.array(z.string()).optional(),
  start_datetime: z.string().nullable().optional(),
  end_datetime: z.string().nullable().optional(),
  duration_minutes: z.number().min(1, 'مدة الامتحان مطلوبة'),
  max_attempts: z.number().min(1, 'عدد المحاولات مطلوب'),
  passing_percentage: z.number().min(0).max(100).default(50),
  shuffle_questions: z.boolean().default(false),
  shuffle_choices: z.boolean().default(false),
  show_results_immediately: z.boolean().default(true),
  allow_review: z.boolean().default(true),
  // إعدادات الأسئلة المبسطة - وضع واحد أو متعدد
  question_source_mode: z.enum(['smart', 'question_bank', 'my_questions', 'mixed']).default('smart'),
  selected_sections: z.array(z.string()).optional(),
  selected_teacher_categories: z.array(z.string()).optional(),
  questions_count: z.number().min(1, 'عدد الأسئلة مطلوب').default(10),
  source_distribution: z.any().optional(), // توزيع المصادر المتعددة
  // توزيع الصعوبة الذكي بالأعداد المباشرة
  difficulty_mode: z.enum(['balanced', 'easy', 'hard', 'custom']).default('balanced'),
  custom_easy_count: z.number().min(0).optional(),
  custom_medium_count: z.number().min(0).optional(),
  custom_hard_count: z.number().min(0).optional(),
  // إعدادات النشر
  publish_status: z.enum(['draft', 'scheduled', 'active']).default('draft'),
});

type CreateExamFormData = z.infer<typeof createExamSchema>;

// خطوات إنشاء الامتحان
const EXAM_STEPS = [
  { number: 1, title: 'المعلومات الأساسية', icon: '📝' },
  { number: 2, title: 'الفئة المستهدفة', icon: '🎯' },
  { number: 3, title: 'المدة والمحاولات', icon: '⏱️' },
  { number: 4, title: 'مصدر الأسئلة', icon: '❓' },
  { number: 5, title: 'توزيع الصعوبة', icon: '📊' },
  { number: 6, title: 'إعدادات الامتحان', icon: '⚙️' },
  { number: 7, title: 'النشر والجدولة', icon: '🚀' }
];

// Presets للتوزيع مع دوال ذكية
const difficultyPresets = {
  balanced: {
    label: 'متوازن',
    icon: '⚖️',
    description: '40% سهل • 40% متوسط • 20% صعب',
    getDistribution: (total: number) => {
      const easy = Math.floor(total * 0.4);
      const medium = Math.floor(total * 0.4);
      const hard = total - easy - medium; // الباقي يذهب للصعب
      return { easy, medium, hard };
    }
  },
  easy: {
    label: 'سهل',
    icon: '🟢',
    description: '60% سهل • 30% متوسط • 10% صعب',
    getDistribution: (total: number) => {
      const easy = Math.floor(total * 0.6);
      const medium = Math.floor(total * 0.3);
      const hard = total - easy - medium;
      return { easy, medium, hard };
    }
  },
  hard: {
    label: 'صعب',
    icon: '🔴',
    description: '20% سهل • 30% متوسط • 50% صعب',
    getDistribution: (total: number) => {
      const easy = Math.floor(total * 0.2);
      const medium = Math.floor(total * 0.3);
      const hard = total - easy - medium;
      return { easy, medium, hard };
    }
  },
  custom: {
    label: 'تخصيص يدوي',
    icon: '✏️',
    description: 'حدد العدد بنفسك',
    getDistribution: (total: number) => ({
      easy: Math.floor(total / 3),
      medium: Math.floor(total / 3),
      hard: Math.ceil(total / 3)
    })
  }
};

export const ExamsWidget: React.FC<ExamsWidgetProps> = ({ canAccessGrade10, canAccessGrade11 }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading } = useTeacherExams(user?.id);
  const { questions, categories } = useTeacherQuestions();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [previewExamId, setPreviewExamId] = useState<string | null>(null);

  // استخدام hook للمعاينة
  const { data: previewData, isLoading: previewLoading } = useExamPreview(previewExamId);

  // جلب الصفوف المتاحة للمعلم
  const { data: availableClasses } = useQuery({
    queryKey: ['teacher-classes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.school_id) return [];

      const { data, error } = await supabase
        .from('classes')
        .select(`
          id,
          grade_level_id,
          class_name_id,
          grade_levels:grade_level_id (code, label),
          class_names:class_name_id (name)
        `)
        .eq('school_id', profile.school_id)
        .eq('status', 'active')
        .order('grade_level_id');

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && isCreateDialogOpen,
  });

  const form = useForm<CreateExamFormData>({
    resolver: zodResolver(createExamSchema),
    defaultValues: {
      title: '',
      description: '',
      exam_type: 'quiz',
      selection_type: 'all_grade',
      grade_levels: [],
      target_classes: [],
      start_datetime: '',
      end_datetime: '',
      duration_minutes: 60,
      max_attempts: 1,
      passing_percentage: 50,
      shuffle_questions: false,
      shuffle_choices: false,
      show_results_immediately: true,
      allow_review: true,
      question_source_mode: 'smart',
      selected_sections: [],
      selected_teacher_categories: [],
      source_distribution: createDefaultSources(10), // التوزيع الافتراضي
      questions_count: 10,
      difficulty_mode: 'balanced',
      custom_easy_count: undefined,
      custom_medium_count: undefined,
      custom_hard_count: undefined,
      publish_status: 'draft',
    },
  });

  // جلب الأقسام المتاحة من بنك الأسئلة (بعد تعريف form)
  const selectedGradeLevel = form.watch('grade_levels')?.[0];
  const { data: availableSections, isLoading: sectionsLoading } = useQuery({
    queryKey: ['question-sections', selectedGradeLevel],
    queryFn: async () => {
      if (!selectedGradeLevel) return [];
      
      const { data, error } = await supabase
        .from('question_bank')
        .select('id, section_name, grade_level, difficulty')
        .eq('grade_level', selectedGradeLevel)
        .eq('is_active', true);

      if (error) throw error;

      // تجميع البيانات حسب القسم مع حفظ أول ID
      const sectionsMap = new Map();
      data?.forEach(q => {
        if (!sectionsMap.has(q.section_name)) {
          sectionsMap.set(q.section_name, { 
            id: q.id,  // حفظ أول ID للقسم كمعرف فريد
            counts: { easy: 0, medium: 0, hard: 0 }
          });
        }
        const section = sectionsMap.get(q.section_name);
        section.counts[q.difficulty]++;
      });

      return Array.from(sectionsMap.entries()).map(([name, data]) => ({
        id: data.id,  // معرف فريد للقسم
        name,
        easy: data.counts.easy,
        medium: data.counts.medium,
        hard: data.counts.hard,
        total: data.counts.easy + data.counts.medium + data.counts.hard,
      }));
    },
    enabled: !!selectedGradeLevel && isCreateDialogOpen,
  });

  // حساب عدد الأسئلة المتاحة بناءً على الاختيارات
  const questionsCount = form.watch('questions_count');
  const questionSourceMode = form.watch('question_source_mode') as 'smart' | 'question_bank' | 'my_questions';
  const selectedSections = form.watch('selected_sections');
  const difficultyMode = form.watch('difficulty_mode');
  const customEasyCount = form.watch('custom_easy_count');
  const customMediumCount = form.watch('custom_medium_count');
  const customHardCount = form.watch('custom_hard_count');

  const calculateAvailableQuestions = () => {
    if (!availableSections || availableSections.length === 0) return { easy: 0, medium: 0, hard: 0, total: 0 };

    let counts = { easy: 0, medium: 0, hard: 0 };

    if (questionSourceMode === 'smart' || !selectedSections || selectedSections.length === 0) {
      // في الوضع الذكي أو عدم اختيار أقسام: احسب كل الأقسام
      availableSections.forEach(section => {
        counts.easy += section.easy;
        counts.medium += section.medium;
        counts.hard += section.hard;
      });
    } else {
      // في الوضع اليدوي: احسب الأقسام المحددة فقط
      availableSections
        .filter(section => selectedSections?.includes(section.id))  // البحث بـ ID
        .forEach(section => {
          counts.easy += section.easy;
          counts.medium += section.medium;
          counts.hard += section.hard;
        });
    }

    return { ...counts, total: counts.easy + counts.medium + counts.hard };
  };

  const availableQuestions = calculateAvailableQuestions();

  // حساب إحصائيات أسئلة المعلم
  const selectedTeacherCategories = form.watch('selected_teacher_categories');
  const teacherQuestionsStats = React.useMemo(() => {
    if (!selectedTeacherCategories || selectedTeacherCategories.length === 0) {
      return { easy: 0, medium: 0, hard: 0, total: 0 };
    }
    
    const filteredQuestions = questions.filter(q => 
      selectedTeacherCategories.includes(q.category)
    );
    
    return {
      easy: filteredQuestions.filter(q => q.difficulty === 'easy').length,
      medium: filteredQuestions.filter(q => q.difficulty === 'medium').length,
      hard: filteredQuestions.filter(q => q.difficulty === 'hard').length,
      total: filteredQuestions.length,
    };
  }, [selectedTeacherCategories, questions]);

  // دالة للحصول على إحصائيات الصعوبة المتاحة حسب المصدر
  const getAvailableDifficultyStats = () => {
    const sourceMode = form.getValues('question_source_mode');
    
    if (sourceMode === 'my_questions') {
      return teacherQuestionsStats;
    } else {
      return availableQuestions;
    }
  };

  // دالة لحساب الأسئلة المتاحة حسب المصدر
  const getAvailableQuestionsCount = () => {
    const sourceMode = form.getValues('question_source_mode');
    const selectedSects = form.getValues('selected_sections');
    const selectedCats = form.getValues('selected_teacher_categories');
    
    let availableCount = 0;
    
    if (sourceMode === 'smart') {
      // كل الأسئلة من الصف المختار
      availableCount = availableQuestions.total;
    } else if (sourceMode === 'question_bank' && selectedSects?.length > 0) {
      // مجموع الأسئلة من الأقسام المحددة
      selectedSects.forEach(sectionId => {
        const section = availableSections?.find(s => s.id === sectionId);
        if (section) availableCount += section.total;
      });
    } else if (sourceMode === 'my_questions' && selectedCats?.length > 0) {
      // مجموع أسئلة المعلم من التصنيفات المحددة
      availableCount = teacherQuestionsStats.total;
    }
    
    return availableCount;
  };

  // حساب التوزيع المتوقع بالأعداد المباشرة
  const expectedCounts = React.useMemo(() => {
    if (difficultyMode === 'custom') {
      return {
        easy: customEasyCount || 0,
        medium: customMediumCount || 0,
        hard: customHardCount || 0,
      };
    }
    return difficultyPresets[difficultyMode].getDistribution(questionsCount);
  }, [difficultyMode, questionsCount, customEasyCount, customMediumCount, customHardCount]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-600 dark:text-green-400';
      case 'scheduled': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'ended': return 'bg-gray-500/10 text-gray-600 dark:text-gray-400';
      case 'archived': return 'bg-gray-500/10 text-gray-600 dark:text-gray-400';
      case 'draft': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
      default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'scheduled': return 'مجدول';
      case 'ended': return 'منتهي';
      case 'archived': return 'مؤرشف';
      case 'draft': return 'مسودة';
      default: return status;
    }
  };

  const handleManageExams = (grade: string) => {
    // التوجيه إلى صفحة الإحصائيات المنفصلة
    navigate(`/exams-analytics/${grade}`);
  };

  const handleOpenCreateDialog = () => {
    form.reset();
    setCurrentStep(1);
    setEditingExamId(null);
    setIsCreateDialogOpen(true);
  };

  const handleOpenQuestionDialog = () => {
    logger.debug("فتح نافذة إضافة سؤال جديد");
    setIsQuestionDialogOpen(true);
  };

  const handleEditExam = async (examId: string) => {
    try {
      const { data: exam, error } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();

      if (error) throw error;

      // استخراج معلومات توزيع الصعوبة
      const diffDist = exam.difficulty_distribution as any || { mode: 'balanced', distribution: { easy: 4, medium: 4, hard: 2 } };
      
      // حساب الأعداد إذا كان custom
      const customDist = diffDist.mode === 'custom' ? {
        custom_easy_count: diffDist.distribution?.easy || undefined,
        custom_medium_count: diffDist.distribution?.medium || undefined,
        custom_hard_count: diffDist.distribution?.hard || undefined,
      } : {
        custom_easy_count: undefined,
        custom_medium_count: undefined,
        custom_hard_count: undefined,
      };

      // ملء البيانات في النموذج
      form.reset({
        title: exam.title,
        description: exam.description || '',
        exam_type: 'quiz',
        selection_type: exam.grade_levels?.length > 0 ? 'all_grade' : 'specific_classes',
        grade_levels: exam.grade_levels || [],
        target_classes: exam.target_classes || [],
        start_datetime: exam.start_datetime,
        end_datetime: exam.end_datetime,
        duration_minutes: exam.duration_minutes,
        max_attempts: exam.max_attempts,
        passing_percentage: exam.passing_percentage,
        shuffle_questions: exam.shuffle_questions,
        shuffle_choices: exam.shuffle_choices,
        show_results_immediately: exam.show_results_immediately,
        allow_review: exam.allow_review,
        question_source_mode: ((exam as any).question_source_mode || 'smart') as 'smart' | 'question_bank' | 'my_questions',
        selected_sections: exam.selected_sections || [],
        selected_teacher_categories: (exam as any).selected_teacher_categories || [],
        questions_count: exam.questions_count || 10,
        difficulty_mode: (diffDist.mode || 'balanced') as any,
        ...customDist,
        publish_status: (exam.status || 'draft') as 'draft' | 'scheduled' | 'active',
      });

      setEditingExamId(examId);
      setCurrentStep(1);
      setIsCreateDialogOpen(true);
    } catch (error) {
      console.error('Error loading exam:', error);
      toast.error('حدث خطأ أثناء تحميل بيانات الامتحان');
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الامتحان؟ لا يمكن التراجع عن هذا الإجراء.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', examId);

      if (error) throw error;

      toast.success('تم حذف الامتحان بنجاح');
      await queryClient.invalidateQueries({ queryKey: ['teacher-exams', user?.id] });
    } catch (error) {
      console.error('Error deleting exam:', error);
      toast.error('حدث خطأ أثناء حذف الامتحان');
    }
  };

  const handlePublishExam = async (examId: string) => {
    try {
      // جلب الامتحان أولاً للتحقق
      const { data: exam, error: fetchError } = await supabase
        .from('exams')
        .select('*, exam_questions(count)')
        .eq('id', examId)
        .single();

      if (fetchError) throw fetchError;

      // التحقق من وجود أسئلة
      if (!exam.exam_questions || exam.exam_questions.length === 0) {
        toast.error('لا يمكن نشر الامتحان: لم يتم إضافة أسئلة بعد');
        return;
      }

      // التحقق من تواريخ البدء والانتهاء
      if (!exam.start_datetime || !exam.end_datetime) {
        toast.error('لا يمكن النشر: يجب تحديد تاريخ البدء والانتهاء');
        return;
      }

      const startDate = new Date(exam.start_datetime);
      const now = new Date();

      // تحديد الحالة المناسبة
      const newStatus = startDate > now ? 'scheduled' : 'active';

      const { error } = await supabase
        .from('exams')
        .update({ status: newStatus })
        .eq('id', examId);

      if (error) throw error;

      toast.success(newStatus === 'active' ? 'تم نشر الامتحان بنجاح!' : 'تم جدولة الامتحان بنجاح!');
      await queryClient.invalidateQueries({ queryKey: ['teacher-exams', user?.id] });
    } catch (error) {
      console.error('Error publishing exam:', error);
      toast.error('حدث خطأ أثناء نشر الامتحان');
    }
  };

  const handleArchiveExam = async (examId: string) => {
    if (!confirm('هل تريد أرشفة هذا الامتحان؟ يمكنك إعادة نشره لاحقاً.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('exams')
        .update({ status: 'archived' })
        .eq('id', examId);

      if (error) throw error;

      toast.success('تم أرشفة الامتحان بنجاح');
      await queryClient.invalidateQueries({ queryKey: ['teacher-exams', user?.id] });
    } catch (error) {
      console.error('Error archiving exam:', error);
      toast.error('حدث خطأ أثناء أرشفة الامتحان');
    }
  };

  const handleNextStep = async (): Promise<boolean> => {
    try {
      if (currentStep === 1) {
        const isValid = await form.trigger(['title', 'exam_type']);
        if (!isValid) {
          toast.error('يرجى ملء جميع الحقول المطلوبة');
          return false;
        }
        setCurrentStep(prev => prev + 1);
        return true;
      } else if (currentStep === 2) {
        const selectionType = form.getValues('selection_type');
        const gradeLevels = form.getValues('grade_levels');
        const targetClasses = form.getValues('target_classes');
        
        if (selectionType === 'all_grade') {
          if (!gradeLevels || gradeLevels.length === 0) {
            toast.error('يجب اختيار صف واحد على الأقل');
            return false;
          }
        } else {
          if (!targetClasses || targetClasses.length === 0) {
            toast.error('يجب اختيار صف محدد واحد على الأقل');
            return false;
          }
        }
        setCurrentStep(prev => prev + 1);
        return true;
      } else if (currentStep === 3) {
        const isValid = await form.trigger(['duration_minutes', 'max_attempts']);
        if (!isValid) {
          toast.error('يرجى ملء جميع الحقول المطلوبة');
          return false;
        }
        setCurrentStep(prev => prev + 1);
        return true;
      } else if (currentStep === 4) {
        const sourceMode = form.getValues('question_source_mode');
        if (sourceMode === 'question_bank') {
          const selectedSections = form.getValues('selected_sections');
          if (!selectedSections || selectedSections.length === 0) {
            toast.error('يجب اختيار قسم واحد على الأقل');
            return false;
          }
          
          // تحقق إضافي: هل الـ IDs صحيحة؟
          const invalidSections = selectedSections.filter(id => 
            !availableSections?.some(s => s.id === id)
          );
          
          if (invalidSections.length > 0) {
            console.error('⚠️ Invalid section IDs detected:', invalidSections);
            form.setError('selected_sections', {
              message: 'بعض الأقسام المحددة غير صالحة'
            });
            return false;
          }
        } else if (sourceMode === 'my_questions') {
          const selectedCategories = form.getValues('selected_teacher_categories');
          if (!selectedCategories || selectedCategories.length === 0) {
            toast.error('يجب اختيار تصنيف واحد على الأقل من أسئلتك');
            return false;
          }
        }
        
        const questionsCount = form.getValues('questions_count');
        if (!questionsCount || questionsCount < 1) {
          toast.error('يجب تحديد عدد الأسئلة');
          return false;
        }
        
        // ✨ التحقق الجديد: عدد الأسئلة المتاحة
        const availableCount = getAvailableQuestionsCount();
        
        if (questionsCount > availableCount) {
          toast.error(
            `عدد الأسئلة المطلوبة (${questionsCount}) أكبر من المتاح (${availableCount})`,
            { 
              description: 'يرجى تقليل عدد الأسئلة أو اختيار أقسام/تصنيفات إضافية',
              duration: 5000 
            }
          );
          return false;
        }
        
        setCurrentStep(prev => prev + 1);
        return true;
      } else if (currentStep === 5) {
        // التحقق من توزيع الصعوبة
        if (difficultyMode === 'custom') {
          const total = (customEasyCount || 0) + (customMediumCount || 0) + (customHardCount || 0);
          if (total !== questionsCount) {
            toast.error(`المجموع ${total} يختلف عن العدد المطلوب ${questionsCount}`);
            return false;
          }
        }
        
        // ✨ التحقق الذكي: هل التوزيع المطلوب متاح؟
        const availableStats = getAvailableDifficultyStats();
        
        const issues = [];
        if (expectedCounts.easy > availableStats.easy) {
          issues.push(`سهل: مطلوب ${expectedCounts.easy} متاح ${availableStats.easy}`);
        }
        if (expectedCounts.medium > availableStats.medium) {
          issues.push(`متوسط: مطلوب ${expectedCounts.medium} متاح ${availableStats.medium}`);
        }
        if (expectedCounts.hard > availableStats.hard) {
          issues.push(`صعب: مطلوب ${expectedCounts.hard} متاح ${availableStats.hard}`);
        }
        
        if (issues.length > 0) {
          toast.error(
            'التوزيع المطلوب غير متاح',
            {
              description: issues.join(' • '),
              duration: 6000
            }
          );
          return false;
        }
        
        setCurrentStep(prev => prev + 1);
        return true;
      } else if (currentStep === 6) {
        setCurrentStep(prev => prev + 1);
        return true;
      } else {
        setCurrentStep(prev => prev + 1);
        return true;
      }
    } catch (error) {
      console.error('Error in handleNextStep:', error);
      toast.error('حدث خطأ أثناء التحقق من البيانات');
      return false;
    }
  };

  const handleStepClick = async (targetStep: number) => {
    // السماح بالانتقال للخطوات السابقة دائماً
    if (targetStep < currentStep) {
      setCurrentStep(targetStep);
      return;
    }
    
    // السماح بالانتقال للخطوات التالية إذا كانت البيانات الحالية صحيحة
    if (targetStep > currentStep) {
      const isValid = await handleNextStep();
      if (isValid && targetStep > currentStep + 1) {
        // إذا كان الهدف أكثر من خطوة واحدة، انتقل مباشرة
        setCurrentStep(targetStep);
      }
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const onSubmit = async (data: CreateExamFormData) => {
    console.group('🔍 Exam Submission Debug');
    console.log('📝 Form Data:', data);
    console.log('📊 Selected Sections (IDs):', data.selected_sections);
    console.log('📚 Available Sections:', availableSections);
    
    if (currentStep !== 7) {
      console.warn('Submit called from non-final step:', currentStep);
      console.groupEnd();
      return;
    }
    
    try {
      setIsSubmitting(true);

      if (!user?.id) {
        toast.error('خطأ في المصادقة');
        console.groupEnd();
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.school_id) {
        toast.error('لا يمكن تحديد المدرسة');
        console.groupEnd();
        return;
      }

      // التحقق من التواريخ حسب publish_status
      if (data.publish_status === 'scheduled') {
        if (!data.start_datetime || !data.end_datetime) {
          toast.error('يجب تحديد تاريخ البدء والانتهاء للامتحان المجدول');
          setCurrentStep(7);
          console.groupEnd();
          return;
        }
        const startDate = new Date(data.start_datetime);
        const endDate = new Date(data.end_datetime);
        const now = new Date();
        
        if (startDate < now) {
          toast.error('تاريخ البدء يجب أن يكون في المستقبل');
          setCurrentStep(7);
          console.groupEnd();
          return;
        }
        
        if (startDate >= endDate) {
          toast.error('تاريخ البدء يجب أن يكون قبل تاريخ الانتهاء');
          setCurrentStep(7);
          console.groupEnd();
          return;
        }
      }
      
      if (data.publish_status === 'active') {
        if (!data.end_datetime) {
          toast.error('يجب تحديد تاريخ الانتهاء للامتحان النشط');
          setCurrentStep(7);
          console.groupEnd();
          return;
        }
        if (new Date(data.end_datetime) <= new Date()) {
          toast.error('تاريخ الانتهاء يجب أن يكون في المستقبل');
          setCurrentStep(7);
          console.groupEnd();
          return;
        }
        // تعيين start_datetime للآن تلقائياً
        data.start_datetime = new Date().toISOString();
      }
      
      if (data.publish_status === 'draft') {
        // مسح التواريخ للمسودات
        data.start_datetime = null;
        data.end_datetime = null;
      }

      // إعداد بيانات توزيع الصعوبة
      const diffDistribution = {
        mode: data.difficulty_mode,
        distribution: expectedCounts
      };

      const examData = {
        title: data.title,
        description: data.description || null,
        duration_minutes: data.duration_minutes,
        passing_percentage: data.passing_percentage,
        grade_levels: data.selection_type === 'all_grade' ? data.grade_levels : [],
        target_classes: data.selection_type === 'specific_classes' ? data.target_classes : [],
        start_datetime: data.start_datetime || null,
        end_datetime: data.end_datetime || null,
        max_attempts: data.max_attempts,
        shuffle_questions: data.shuffle_questions,
        shuffle_choices: data.shuffle_choices,
        show_results_immediately: data.show_results_immediately,
        allow_review: data.allow_review,
        question_source_mode: data.question_source_mode,
        selected_sections: data.selected_sections || [],
        selected_teacher_categories: data.selected_teacher_categories || [],
        questions_count: data.questions_count,
        difficulty_distribution: diffDistribution,
        status: data.publish_status as 'draft' | 'scheduled' | 'active',
        total_questions: data.questions_count,
        total_points: data.questions_count * 10, // افتراض 10 نقاط لكل سؤال,
      };

      // 🔍 DEVELOPMENT MODE: فحص شامل لبيانات الامتحان
      if (import.meta.env.DEV) {
        console.group('🔍 === EXAM VALIDATION & DEBUG ===');
        
        // 1️⃣ فحص القيم الأساسية
        console.log('📝 Basic Fields:', {
          title: { value: examData.title, type: typeof examData.title, isEmpty: !examData.title },
          description: { value: examData.description, type: typeof examData.description },
          duration_minutes: { value: examData.duration_minutes, type: typeof examData.duration_minutes },
          passing_percentage: { value: examData.passing_percentage, type: typeof examData.passing_percentage },
          questions_count: { value: examData.questions_count, type: typeof examData.questions_count },
          total_questions: { value: examData.total_questions, type: typeof examData.total_questions },
          total_points: { value: examData.total_points, type: typeof examData.total_points },
        });

        // 2️⃣ فحص المصفوفات
        console.log('📊 Arrays:', {
          grade_levels: { 
            value: examData.grade_levels, 
            isArray: Array.isArray(examData.grade_levels),
            length: examData.grade_levels?.length,
            types: examData.grade_levels?.map(g => typeof g)
          },
          target_classes: { 
            value: examData.target_classes, 
            isArray: Array.isArray(examData.target_classes),
            length: examData.target_classes?.length,
            types: examData.target_classes?.map(c => typeof c)
          },
          selected_sections: { 
            value: examData.selected_sections, 
            isArray: Array.isArray(examData.selected_sections),
            length: examData.selected_sections?.length,
            types: examData.selected_sections?.map(s => typeof s),
            sample: examData.selected_sections?.slice(0, 2)
          },
          selected_teacher_categories: { 
            value: examData.selected_teacher_categories, 
            isArray: Array.isArray(examData.selected_teacher_categories),
            length: examData.selected_teacher_categories?.length
          }
        });

        // 3️⃣ فحص التواريخ
        console.log('📅 Dates:', {
          start_datetime: { 
            value: examData.start_datetime,
            type: typeof examData.start_datetime,
            isNull: examData.start_datetime === null,
            isValid: examData.start_datetime ? !isNaN(new Date(examData.start_datetime).getTime()) : 'N/A'
          },
          end_datetime: { 
            value: examData.end_datetime,
            type: typeof examData.end_datetime,
            isNull: examData.end_datetime === null,
            isValid: examData.end_datetime ? !isNaN(new Date(examData.end_datetime).getTime()) : 'N/A'
          }
        });

        // 4️⃣ فحص الـ Booleans
        console.log('✅ Booleans:', {
          shuffle_questions: { value: examData.shuffle_questions, type: typeof examData.shuffle_questions },
          shuffle_choices: { value: examData.shuffle_choices, type: typeof examData.shuffle_choices },
          show_results_immediately: { value: examData.show_results_immediately, type: typeof examData.show_results_immediately },
          allow_review: { value: examData.allow_review, type: typeof examData.allow_review }
        });

        // 5️⃣ فحص الـ JSONB
        console.log('📦 JSONB Fields:', {
          difficulty_distribution: {
            value: examData.difficulty_distribution,
            type: typeof examData.difficulty_distribution,
            stringified: JSON.stringify(examData.difficulty_distribution),
            mode: examData.difficulty_distribution?.mode,
            distribution: examData.difficulty_distribution?.distribution
          }
        });

        // 6️⃣ فحص الـ Status & Enums
        console.log('🎯 Status & Enums:', {
          status: { value: examData.status, type: typeof examData.status },
          question_source_mode: { value: examData.question_source_mode, type: typeof examData.question_source_mode }
        });

        // 7️⃣ البيانات الكاملة للإرسال
        console.log('📤 Complete Exam Data (will be sent to Supabase):', JSON.stringify(examData, null, 2));

        // 8️⃣ فحص الأخطاء المحتملة
        const validationErrors = [];
        if (!examData.title) validationErrors.push('❌ Title is empty');
        if (!examData.duration_minutes || examData.duration_minutes <= 0) validationErrors.push('❌ Invalid duration_minutes');
        if (!examData.questions_count || examData.questions_count <= 0) validationErrors.push('❌ Invalid questions_count');
        if (examData.status === 'scheduled' && !examData.start_datetime) validationErrors.push('❌ scheduled status requires start_datetime');
        if (examData.status === 'scheduled' && !examData.end_datetime) validationErrors.push('❌ scheduled status requires end_datetime');
        if (examData.status === 'active' && !examData.end_datetime) validationErrors.push('❌ active status requires end_datetime');
        if (!Array.isArray(examData.grade_levels)) validationErrors.push('❌ grade_levels must be array');
        if (!Array.isArray(examData.target_classes)) validationErrors.push('❌ target_classes must be array');
        if (!Array.isArray(examData.selected_sections)) validationErrors.push('❌ selected_sections must be array');
        if (!Array.isArray(examData.selected_teacher_categories)) validationErrors.push('❌ selected_teacher_categories must be array');
        
        if (validationErrors.length > 0) {
          console.error('🚨 VALIDATION ERRORS FOUND:');
          validationErrors.forEach(err => console.error(err));
        } else {
          console.log('✅ All validations passed!');
        }

        console.groupEnd();
      }

      console.log('💾 Exam Data to Save:', examData);

      if (editingExamId) {
        if (import.meta.env.DEV) {
          console.log('🔄 UPDATE MODE: Updating exam with ID:', editingExamId);
          console.log('📤 Data being sent to Supabase:', JSON.stringify(examData, null, 2));
        }
        
        const { data: updateResult, error: examError } = await supabase
          .from('exams')
          .update(examData)
          .eq('id', editingExamId)
          .select();

        if (examError) {
          if (import.meta.env.DEV) {
            console.error('🚨 UPDATE ERROR:');
            console.error('Error Object:', examError);
            console.error('Error Message:', examError.message);
            console.error('Error Code:', examError.code);
            console.error('Error Details:', examError.details);
            console.error('Error Hint:', examError.hint);
          }
          throw examError;
        }
        
        if (import.meta.env.DEV) {
          console.log('✅ Update successful! Result:', updateResult);
        }
        toast.success('تم تحديث الامتحان بنجاح!');
      } else {
        const finalData = {
          ...examData,
          created_by: user.id,
          school_id: profile.school_id,
        };
        
        if (import.meta.env.DEV) {
          console.log('➕ INSERT MODE: Creating new exam');
          console.log('👤 User ID:', user.id);
          console.log('🏫 School ID:', profile.school_id);
          console.log('📤 Final data being sent to Supabase:', JSON.stringify(finalData, null, 2));
          console.log('🔑 Data types check:', {
            created_by: { value: finalData.created_by, type: typeof finalData.created_by },
            school_id: { value: finalData.school_id, type: typeof finalData.school_id },
            title: { value: finalData.title, type: typeof finalData.title },
            status: { value: finalData.status, type: typeof finalData.status }
          });
        }
        
        const { data: insertResult, error: examError } = await supabase
          .from('exams')
          .insert(finalData)
          .select();

        if (examError) {
          if (import.meta.env.DEV) {
            console.error('🚨 INSERT ERROR:');
            console.error('Error Object:', examError);
            console.error('Error Message:', examError.message);
            console.error('Error Code:', examError.code);
            console.error('Error Details:', examError.details);
            console.error('Error Hint:', examError.hint);
            console.error('PostgreSQL Error:', {
              code: examError.code,
              message: examError.message,
              details: examError.details,
              hint: examError.hint
            });
            
            // فحص خاص بأخطاء RLS
            if (examError.code === '42501') {
              console.error('🔒 RLS POLICY ERROR: Row Level Security is blocking this operation');
              console.error('Check if user has proper permissions and RLS policies are correctly configured');
            }
            
            // فحص خاص بأخطاء القيم
            if (examError.code === '23502') {
              console.error('⚠️ NULL VALUE ERROR: A NOT NULL constraint is violated');
              console.error('Check which field is missing in the data');
            }
            
            // فحص خاص بأخطاء النوع
            if (examError.code === '22P02') {
              console.error('🔢 TYPE ERROR: Invalid input syntax for type');
              console.error('Check if data types match database schema');
            }
          }
          throw examError;
        }
        
        if (import.meta.env.DEV) {
          console.log('✅ Insert successful! Result:', insertResult);
        }
        toast.success('تم إنشاء الامتحان بنجاح!');
      }

      setIsCreateDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['teacher-exams', user?.id] });
      console.log('✅ Exam saved successfully');
      console.groupEnd();
    } catch (error: any) {
      console.error('❌ Error submitting exam:', error);
      
      if (import.meta.env.DEV) {
        console.group('🚨 === DETAILED ERROR ANALYSIS ===');
        console.error('Full Error Object:', error);
        console.error('Error Type:', typeof error);
        console.error('Error Constructor:', error?.constructor?.name);
        
        console.group('📋 Error Properties:');
        console.error('message:', error?.message);
        console.error('code:', error?.code);
        console.error('details:', error?.details);
        console.error('hint:', error?.hint);
        console.error('status:', error?.status);
        console.error('statusCode:', error?.statusCode);
        console.groupEnd();
        
        if (error?.message) {
          console.group('💬 Error Message Analysis:');
          console.error('Message:', error.message);
          if (error.message.includes('violates')) {
            console.error('⚠️ Constraint Violation Detected');
          }
          if (error.message.includes('null')) {
            console.error('⚠️ NULL Value Issue Detected');
          }
          if (error.message.includes('type')) {
            console.error('⚠️ Type Mismatch Detected');
          }
          if (error.message.includes('permission') || error.message.includes('policy')) {
            console.error('⚠️ Permission/RLS Policy Issue Detected');
          }
          console.groupEnd();
        }
        
        console.group('🔍 Stack Trace:');
        console.error(error?.stack || 'No stack trace available');
        console.groupEnd();
        
        console.groupEnd();
      }
      
      console.error('📋 Error Details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      });
      console.groupEnd();
      
      // رسالة خطأ مفصلة للمستخدم
      const errorMessage = error?.message || 'حدث خطأ أثناء حفظ الامتحان';
      const detailedError = import.meta.env.DEV 
        ? `${errorMessage}\nCode: ${error?.code}\nDetails: ${error?.details || 'N/A'}` 
        : errorMessage;
      
      toast.error(detailedError);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            الامتحانات الإلكترونية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const totalExams = data?.exams?.length || 0;
  const totalQuestions = data?.totalQuestions || 0;
  const activeExams = data?.exams?.filter((e: any) => e.status === 'active').length || 0;

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            الامتحانات الإلكترونية
          </CardTitle>
          <div className="flex gap-2">
            <Button onClick={handleOpenQuestionDialog} size="sm" variant="outline">
              <Plus className="w-4 h-4 ml-2" />
              سؤال جديد
            </Button>
            <Button onClick={handleOpenCreateDialog} size="sm">
              <Plus className="w-4 h-4 ml-2" />
              امتحان جديد
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 p-4 rounded-lg border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="w-4 h-4 text-green-600" />
              <span className="text-sm text-muted-foreground">امتحانات نشطة</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{activeExams}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-4 rounded-lg border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <FileQuestion className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">بنك الأسئلة</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{totalQuestions}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-4 rounded-lg border border-purple-500/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-muted-foreground">متوسط الدرجات</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {data?.stats?.avgScoreAll ? `${data.stats.avgScoreAll.toFixed(1)}%` : '--'}
            </p>
          </div>
        </div>

        {/* قائمة الامتحانات */}
        {data?.exams && data.exams.length > 0 ? (
          <>
            {/* Tabs للفلترة حسب الحالة */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                الكل ({data.exams.length})
              </Button>
              <Button
                variant={statusFilter === 'draft' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('draft')}
                className={statusFilter === 'draft' ? '' : 'border-yellow-500/20 text-yellow-600'}
              >
                المسودات ({data.exams.filter((e: any) => e.status === 'draft').length})
              </Button>
              <Button
                variant={statusFilter === 'scheduled' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('scheduled')}
                className={statusFilter === 'scheduled' ? '' : 'border-blue-500/20 text-blue-600'}
              >
                المجدولة ({data.exams.filter((e: any) => e.status === 'scheduled').length})
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('active')}
                className={statusFilter === 'active' ? '' : 'border-green-500/20 text-green-600'}
              >
                النشطة ({data.exams.filter((e: any) => e.status === 'active').length})
              </Button>
              <Button
                variant={statusFilter === 'archived' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('archived')}
                className={statusFilter === 'archived' ? '' : 'border-gray-500/20'}
              >
                المؤرشفة ({data.exams.filter((e: any) => e.status === 'archived' || e.status === 'ended').length})
              </Button>
            </div>

            <div className="space-y-3 mb-4">
              {data.exams
                .filter((exam: any) => statusFilter === 'all' || exam.status === statusFilter || (statusFilter === 'archived' && (exam.status === 'archived' || exam.status === 'ended')))
                .slice(0, 4).map((exam: any) => (
                <div
                  key={exam.id}
                  className="flex items-center justify-between p-4 bg-card border border-border/50 rounded-xl hover:border-border hover:shadow-sm transition-all duration-200 group"
                >
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2.5">
                      <h4 className="font-medium text-base text-foreground">{exam.title}</h4>
                      <Badge className={getStatusColor(exam.status)} variant="outline">
                        {getStatusLabel(exam.status)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-5 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <FileQuestion className="w-4 h-4 text-primary/60" />
                        <span dir="ltr">{exam.total_questions}</span> سؤال
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-primary/60" />
                        <span dir="ltr">{exam.attempts_count}</span> محاولة
                      </span>
                      {exam.avg_percentage !== null && (
                        <span className="flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-primary/60" />
                          <span dir="ltr">{exam.avg_percentage.toFixed(1)}%</span>
                        </span>
                      )}
                    </div>
                    
                    {(exam.status === 'scheduled' || exam.status === 'active') && exam.start_datetime && (
                      <div className="pt-2.5 border-t border-border/30">
                        <div className="flex items-center gap-5 text-sm">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-emerald-600/70" />
                            <span className="text-muted-foreground">البداية:</span>
                            <span className="font-mono text-foreground/90" dir="ltr">
                              {formatDateTime12H(exam.start_datetime)}
                            </span>
                          </div>
                          {exam.end_datetime && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-amber-600/70" />
                              <span className="text-muted-foreground">النهاية:</span>
                              <span className="font-mono text-foreground/90" dir="ltr">
                                {formatDateTime12H(exam.end_datetime)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    {/* زر المعاينة - متاح لجميع الحالات */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPreviewExamId(exam.id)}
                      className="text-blue-600 hover:text-blue-600 hover:bg-blue-600/10"
                      title="معاينة الامتحان"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>

                    {exam.status === 'draft' && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditExam(exam.id)}
                          className="text-primary hover:text-primary hover:bg-primary/10"
                          title="تعديل"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePublishExam(exam.id)}
                          className="text-green-600 hover:text-green-600 hover:bg-green-600/10"
                          title="نشر الامتحان"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteExam(exam.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    {(exam.status === 'scheduled' || exam.status === 'active') && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditExam(exam.id)}
                          className="text-primary hover:text-primary hover:bg-primary/10"
                          title="تعديل"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleArchiveExam(exam.id)}
                          className="text-orange-600 hover:text-orange-600 hover:bg-orange-600/10"
                          title="أرشفة"
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    {(exam.status === 'archived' || exam.status === 'ended') && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePublishExam(exam.id)}
                          className="text-green-600 hover:text-green-600 hover:bg-green-600/10"
                          title="إعادة نشر"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteExam(exam.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* أزرار الإدارة */}
            <div className="flex gap-2 flex-wrap">
              {canAccessGrade10 && (
                <Button
                  onClick={() => handleManageExams('10')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  امتحانات الصف العاشر
                  <ArrowRight className="w-3 h-3" />
                </Button>
              )}
              {canAccessGrade11 && (
                <Button
                  onClick={() => handleManageExams('11')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  امتحانات الصف الحادي عشر
                  <ArrowRight className="w-3 h-3" />
                </Button>
              )}
              <Button
                onClick={handleOpenCreateDialog}
                size="sm"
                className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
              >
                <Plus className="w-4 h-4 ml-2" />
                إنشاء امتحان جديد
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/10 to-purple-500/10 flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-muted-foreground mb-6 text-lg">لم تقم بإنشاء أي امتحان بعد</p>
            <Button
              onClick={handleOpenCreateDialog}
              className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
              size="lg"
            >
              <Plus className="w-4 h-4 ml-2" />
              إنشاء امتحان جديد
            </Button>
          </div>
        )}

        {/* Dialog متعدد الخطوات لإنشاء امتحان */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingExamId ? 'تعديل الامتحان' : 'إنشاء امتحان جديد'}
              </DialogTitle>
              <DialogDescription>
                {EXAM_STEPS[currentStep - 1].icon} {EXAM_STEPS[currentStep - 1].title}
              </DialogDescription>
            </DialogHeader>

            {/* Step Navigator */}
            <div className="sticky top-0 bg-background z-10 border-b pb-4 mb-6">
              {/* Progress Bar */}
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-4">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-purple-600 transition-all duration-300"
                  style={{ width: `${(currentStep / 7) * 100}%` }}
                />
              </div>

              {/* Steps */}
              <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
                {EXAM_STEPS.map((step) => (
                  <button
                    key={step.number}
                    type="button"
                    onClick={() => handleStepClick(step.number)}
                    className={cn(
                      "flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-all min-w-[80px] flex-1",
                      currentStep === step.number 
                        ? "bg-gradient-to-br from-orange-500 to-purple-600 text-white shadow-lg scale-105" 
                        : currentStep > step.number
                        ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                        : "hover:bg-muted text-muted-foreground"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all",
                      currentStep === step.number 
                        ? "bg-white text-orange-600 shadow-md" 
                        : currentStep > step.number 
                        ? "bg-green-100 text-green-600 dark:bg-green-900/30"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {currentStep > step.number ? '✓' : step.number}
                    </div>
                    <span className="text-[10px] text-center leading-tight hidden md:block">
                      {step.title}
                    </span>
                    <span className="text-lg md:hidden">
                      {step.icon}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* خطوة 1: معلومات أساسية */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="bg-muted/50 p-4 rounded-lg mb-4">
                      <h3 className="font-semibold mb-2">المعلومات الأساسية</h3>
                      <p className="text-sm text-muted-foreground">
                        أدخل عنوان الامتحان ووصفه ونوعه
                      </p>
                    </div>

                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>عنوان الامتحان *</FormLabel>
                          <FormControl>
                            <Input placeholder="مثال: امتحان أساسيات الاتصال" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الوصف (اختياري)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="وصف مختصر عن محتوى الامتحان"
                              {...field}
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="exam_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نوع الامتحان *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="!justify-end gap-2 [&>span]:flex-1 [&>span]:text-right">
                                <SelectValue placeholder="اختر نوع الامتحان" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="quiz">اختبار قصير</SelectItem>
                              <SelectItem value="midterm">امتحان نصفي</SelectItem>
                              <SelectItem value="final">امتحان نهائي</SelectItem>
                              <SelectItem value="practice">تدريب</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* خطوة 2: الفئة المستهدفة */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="bg-muted/50 p-4 rounded-lg mb-4">
                      <h3 className="font-semibold mb-2">صفوف الامتحان</h3>
                      <p className="text-sm text-muted-foreground">
                        اختر كل الصف أو صفوف محددة للامتحان
                      </p>
                    </div>

                    <FormField
                      control={form.control}
                      name="selection_type"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>نوع الاختيار</FormLabel>
                          <FormControl>
                            <div className="flex gap-4">
                              <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                                <input
                                  type="radio"
                                  value="all_grade"
                                  checked={field.value === 'all_grade'}
                                  onChange={() => {
                                    field.onChange('all_grade');
                                    form.setValue('target_classes', []);
                                  }}
                                  className="w-4 h-4"
                                />
                                <span className="text-sm font-medium">كل الصف</span>
                              </label>
                              <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                                <input
                                  type="radio"
                                  value="specific_classes"
                                  checked={field.value === 'specific_classes'}
                                  onChange={() => {
                                    field.onChange('specific_classes');
                                    form.setValue('grade_levels', []);
                                  }}
                                  className="w-4 h-4"
                                />
                                <span className="text-sm font-medium">صفوف محددة</span>
                              </label>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch('selection_type') === 'all_grade' && (
                      <FormField
                        control={form.control}
                        name="grade_levels"
                        render={() => (
                          <FormItem>
                            <FormLabel>اختر الصف</FormLabel>
                            <div className="space-y-3">
                              {canAccessGrade10 && (
                                <FormField
                                  control={form.control}
                                  name="grade_levels"
                                  render={({ field }) => (
                                    <FormItem className="flex items-center space-x-3 space-x-reverse space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes('10')}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value, '10'])
                                              : field.onChange(field.value?.filter((value) => value !== '10'));
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-medium cursor-pointer flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center">
                                          <span className="text-orange-600 font-bold">10</span>
                                        </div>
                                        كل الصف العاشر
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                              )}

                              {canAccessGrade11 && (
                                <FormField
                                  control={form.control}
                                  name="grade_levels"
                                  render={({ field }) => (
                                    <FormItem className="flex items-center space-x-3 space-x-reverse space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes('11')}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value, '11'])
                                              : field.onChange(field.value?.filter((value) => value !== '11'));
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-medium cursor-pointer flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center">
                                          <span className="text-purple-600 font-bold">11</span>
                                        </div>
                                        كل الصف الحادي عشر
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                              )}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {form.watch('selection_type') === 'specific_classes' && (
                      <FormField
                        control={form.control}
                        name="target_classes"
                        render={() => (
                          <FormItem>
                            <FormLabel>اختر الصفوف المحددة</FormLabel>
                            <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                              {availableClasses && availableClasses.length > 0 ? (
                                availableClasses
                                  .filter((cls: any) => {
                                    const gradeCode = cls.grade_levels?.code;
                                    if (gradeCode === '10') return canAccessGrade10;
                                    if (gradeCode === '11') return canAccessGrade11;
                                    return false;
                                  })
                                  .map((cls: any) => (
                                    <FormField
                                      key={cls.id}
                                      control={form.control}
                                      name="target_classes"
                                      render={({ field }) => (
                                        <FormItem className="flex items-center space-x-3 space-x-reverse space-y-0">
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(cls.id)}
                                              onCheckedChange={(checked) => {
                                                return checked
                                                  ? field.onChange([...field.value, cls.id])
                                                  : field.onChange(field.value?.filter((value) => value !== cls.id));
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="font-medium cursor-pointer">
                                            {cls.grade_levels?.label} - {cls.class_names?.name}
                                          </FormLabel>
                                        </FormItem>
                                      )}
                                    />
                                  ))
                              ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  لا توجد صفوف متاحة
                                </p>
                              )}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}

                {/* خطوة 3: المدة والمحاولات */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="bg-muted/50 p-4 rounded-lg mb-4">
                      <h3 className="font-semibold mb-2">المدة والمحاولات</h3>
                      <p className="text-sm text-muted-foreground">
                        حدد مدة الامتحان وعدد المحاولات المسموحة
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="duration_minutes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>مدة الامتحان (بالدقائق) *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>مدة الإجابة على الامتحان</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="max_attempts"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>عدد المحاولات المسموحة *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>عدد مرات دخول الطالب للامتحان</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* خطوة 4: مصدر الأسئلة (محسّنة) */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-4 rounded-lg border border-primary/20">
                      <h3 className="font-semibold mb-2 text-lg">📚 مصدر الأسئلة</h3>
                      <p className="text-sm text-muted-foreground">
                        اختر من أين سيتم سحب الأسئلة وكم عدد الأسئلة المطلوبة
                      </p>
                    </div>

                    <FormField
                      control={form.control}
                      name="questions_count"
                      render={({ field }) => {
                        const availableCount = getAvailableQuestionsCount();
                        const exceedsLimit = field.value > availableCount;
                        
                        return (
                          <FormItem>
                            <FormLabel className="text-base">عدد الأسئلة المطلوبة *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min={1}
                                max={availableCount || 100}
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                className={exceedsLimit ? 'border-red-500' : ''}
                              />
                            </FormControl>
                            
                            {/* تحذير مباشر */}
                            {exceedsLimit && availableCount > 0 && (
                              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mt-2">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm">
                                  <p className="font-medium text-red-800 dark:text-red-200">
                                    العدد المطلوب أكبر من المتاح!
                                  </p>
                                  <p className="text-red-700 dark:text-red-300">
                                    الأسئلة المتاحة: {availableCount} فقط
                                  </p>
                                </div>
                              </div>
                            )}
                            
                            {/* معلومات مفيدة */}
                            {!exceedsLimit && availableCount > 0 && (
                              <FormDescription className="flex items-center gap-1">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                متاح: {availableCount} سؤال
                              </FormDescription>
                            )}
                            
                            {availableCount === 0 && (
                              <FormDescription className="text-yellow-600">
                                اختر مصدر الأسئلة أولاً لمعرفة العدد المتاح
                              </FormDescription>
                            )}
                            
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />

                    {/* توزيع الأسئلة من المصادر */}
                    <InteractiveSourceDistributor
                      totalQuestions={form.watch('questions_count') || 10}
                      sources={form.watch('source_distribution') || createDefaultSources(form.watch('questions_count') || 10)}
                      onSourcesChange={(sources) => {
                        form.setValue('source_distribution', sources);
                        // تحديث question_source_mode بناءً على المصادر المفعلة
                        const enabledSources = sources.filter(s => s.enabled);
                        if (enabledSources.length === 1) {
                          form.setValue('question_source_mode', enabledSources[0].type);
                        } else if (enabledSources.length > 1) {
                          form.setValue('question_source_mode', 'mixed');
                        }
                        // تحديث الأقسام والتصنيفات المختارة
                        const bankSource = sources.find(s => s.type === 'question_bank');
                        const myQuestionsSource = sources.find(s => s.type === 'my_questions');
                        if (!bankSource?.enabled) {
                          form.setValue('selected_sections', []);
                        }
                        if (!myQuestionsSource?.enabled) {
                          form.setValue('selected_teacher_categories', []);
                        }
                      }}
                      availableSections={availableSections?.map(s => ({ value: s.id, label: s.name })) || []}
                      selectedSections={selectedSections || []}
                      onSectionsChange={(sections) => form.setValue('selected_sections', sections)}
                      availableCategories={categories.map(c => ({ value: c, label: c })) || []}
                      selectedCategories={form.watch('selected_teacher_categories') || []}
                      onCategoriesChange={(cats) => form.setValue('selected_teacher_categories', cats)}
                    />
                  </div>
                )}

                {/* خطوة 5: توزيع الصعوبة (الذكي) */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
                      <h3 className="font-semibold mb-2 text-lg">🎯 توزيع الصعوبة الذكي</h3>
                      <p className="text-sm text-muted-foreground">
                        اختر كيف سيتم توزيع الأسئلة حسب مستوى الصعوبة
                      </p>
                    </div>

                    <FormField
                      control={form.control}
                      name="difficulty_mode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">اختر نمط التوزيع</FormLabel>
                          <FormControl>
                            <RadioGroup value={field.value} onValueChange={field.onChange}>
                              {Object.entries(difficultyPresets).map(([key, preset]) => {
                                const dist = preset.getDistribution(questionsCount);
                                return (
                                  <div 
                                    key={key}
                                    className="flex items-center space-x-3 space-x-reverse border rounded-lg p-4 cursor-pointer hover:bg-muted/50"
                                  >
                                    <RadioGroupItem value={key} id={key} />
                                    <Label htmlFor={key} className="flex-1 cursor-pointer">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <span className="text-base font-medium block">
                                            {preset.icon} {preset.label}
                                          </span>
                                          <span className="text-sm text-muted-foreground">
                                            {preset.description}
                                          </span>
                                          {key !== 'custom' && (
                                            <span className="text-xs text-muted-foreground block mt-1">
                                              {dist.easy} سهل • {dist.medium} متوسط • {dist.hard} صعب = {dist.easy + dist.medium + dist.hard} سؤال
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </Label>
                                  </div>
                                );
                              })}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Custom number inputs */}
                    {difficultyMode === 'custom' && (() => {
                      const availableStats = getAvailableDifficultyStats();
                      return (
                        <div className="space-y-6 border rounded-lg p-4 bg-muted/30">
                          <h4 className="font-medium">تخصيص العدد يدوياً</h4>
                          
                          <FormField
                            control={form.control}
                            name="custom_easy_count"
                            render={({ field }) => (
                              <FormItem>
                                <div className="flex items-center justify-between mb-2">
                                  <FormLabel>🟢 أسئلة سهلة</FormLabel>
                                  <span className="text-xs text-muted-foreground">
                                    متاح: <span className="font-medium text-green-600">{availableStats.easy}</span>
                                  </span>
                                </div>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={0}
                                    max={availableStats.easy}
                                    {...field}
                                    value={field.value || 0}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                    placeholder="عدد الأسئلة"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="custom_medium_count"
                            render={({ field }) => (
                              <FormItem>
                                <div className="flex items-center justify-between mb-2">
                                  <FormLabel>🟡 أسئلة متوسطة</FormLabel>
                                  <span className="text-xs text-muted-foreground">
                                    متاح: <span className="font-medium text-yellow-600">{availableStats.medium}</span>
                                  </span>
                                </div>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={0}
                                    max={availableStats.medium}
                                    {...field}
                                    value={field.value || 0}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                    placeholder="عدد الأسئلة"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="custom_hard_count"
                            render={({ field }) => (
                              <FormItem>
                                <div className="flex items-center justify-between mb-2">
                                  <FormLabel>🔴 أسئلة صعبة</FormLabel>
                                  <span className="text-xs text-muted-foreground">
                                    متاح: <span className="font-medium text-red-600">{availableStats.hard}</span>
                                  </span>
                                </div>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={0}
                                    max={availableStats.hard}
                                    {...field}
                                    value={field.value || 0}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                    placeholder="عدد الأسئلة"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          {(() => {
                            const total = (customEasyCount || 0) + (customMediumCount || 0) + (customHardCount || 0);
                            if (total !== questionsCount) {
                              return (
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                    ⚠️ المجموع الحالي: {total} من {questionsCount}
                                    {total < questionsCount && ` (يجب إضافة ${questionsCount - total} أسئلة)`}
                                    {total > questionsCount && ` (يجب تقليل ${total - questionsCount} أسئلة)`}
                                  </p>
                                </div>
                              );
                            }
                            return (
                              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                                <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4" />
                                  ✅ المجموع صحيح: {total} سؤال
                                </p>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })()}

                    {/* معاينة التوزيع */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-4">📈 معاينة التوزيع</h4>
                      
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{expectedCounts.easy}</div>
                          <div className="text-xs text-muted-foreground mt-1">أسئلة سهلة</div>
                        </div>
                        <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-yellow-600">{expectedCounts.medium}</div>
                          <div className="text-xs text-muted-foreground mt-1">أسئلة متوسطة</div>
                        </div>
                        <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-red-600">{expectedCounts.hard}</div>
                          <div className="text-xs text-muted-foreground mt-1">أسئلة صعبة</div>
                        </div>
                      </div>

                      <div className="text-center text-sm text-muted-foreground mb-4">
                        المجموع: {expectedCounts.easy + expectedCounts.medium + expectedCounts.hard} من {questionsCount} سؤال
                      </div>

                      {/* التحقق الذكي من التوافر */}
                      {(() => {
                        const availableStats = getAvailableDifficultyStats();
                        const hasIssues = 
                          expectedCounts.easy > availableStats.easy ||
                          expectedCounts.medium > availableStats.medium ||
                          expectedCounts.hard > availableStats.hard;
                        
                        if (availableStats.total === 0) {
                          return (
                            <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                ⚠️ لم يتم اختيار مصدر الأسئلة بعد. عد للخطوة السابقة.
                              </p>
                            </div>
                          );
                        }
                        
                        if (!hasIssues) {
                          return (
                            <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                              <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                ✅ التوزيع متاح! جميع الأسئلة المطلوبة متوفرة
                              </p>
                            </div>
                          );
                        }
                        
                        return (
                          <div className="mt-4 space-y-2">
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                              <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                                ⚠️ التوزيع غير متاح بالكامل:
                              </p>
                              {expectedCounts.easy > availableStats.easy && (
                                <p className="text-sm text-red-700 dark:text-red-300">
                                  • سهل: مطلوب <strong>{expectedCounts.easy}</strong> لكن المتاح <strong>{availableStats.easy}</strong> فقط
                                </p>
                              )}
                              {expectedCounts.medium > availableStats.medium && (
                                <p className="text-sm text-red-700 dark:text-red-300">
                                  • متوسط: مطلوب <strong>{expectedCounts.medium}</strong> لكن المتاح <strong>{availableStats.medium}</strong> فقط
                                </p>
                              )}
                              {expectedCounts.hard > availableStats.hard && (
                                <p className="text-sm text-red-700 dark:text-red-300">
                                  • صعب: مطلوب <strong>{expectedCounts.hard}</strong> لكن المتاح <strong>{availableStats.hard}</strong> فقط
                                </p>
                              )}
                              <p className="text-sm text-red-600 dark:text-red-400 mt-2 font-medium">
                                💡 اختر توزيع مختلف أو أضف المزيد من الأسئلة
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* خطوة 6: خيارات متقدمة */}
                {currentStep === 6 && (
                  <div className="space-y-4">
                    <div className="bg-muted/50 p-4 rounded-lg mb-4">
                      <h3 className="font-semibold mb-2">خيارات متقدمة</h3>
                      <p className="text-sm text-muted-foreground">
                        تخصيص طريقة عرض الامتحان والنتائج
                      </p>
                    </div>

                    <FormField
                      control={form.control}
                      name="passing_percentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نسبة النجاح (%) *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={0} 
                              max={100} 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>الحد الأدنى للنسبة المطلوبة للنجاح</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="shuffle_questions"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">خلط ترتيب الأسئلة</FormLabel>
                              <FormDescription>
                                عرض الأسئلة بترتيب مختلف لكل طالب
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="shuffle_choices"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">خلط ترتيب الخيارات</FormLabel>
                              <FormDescription>
                                عرض خيارات الإجابة بترتيب مختلف لكل طالب
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="show_results_immediately"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">عرض النتائج فوراً</FormLabel>
                              <FormDescription>
                                السماح للطالب بمشاهدة نتيجته مباشرة بعد الإرسال
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="allow_review"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">السماح بالمراجعة</FormLabel>
                              <FormDescription>
                                السماح للطالب بمراجعة إجاباته بعد الامتحان
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* خطوة 7: إعدادات النشر والجدولة */}
                {currentStep === 7 && (
                  <div className="space-y-4">
                    <div className="bg-muted/50 p-4 rounded-lg mb-4">
                      <h3 className="font-semibold mb-2">إعدادات النشر والجدولة</h3>
                      <p className="text-sm text-muted-foreground">
                        اختر حالة الامتحان وحدد مواعيد البدء والانتهاء
                      </p>
                    </div>

                    <FormField
                      control={form.control}
                      name="publish_status"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>حالة الامتحان</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="space-y-3"
                            >
                              <div className="flex items-start space-x-3 space-x-reverse border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                                <RadioGroupItem value="draft" id="draft" className="mt-1" />
                                <div className="flex-1">
                                  <Label htmlFor="draft" className="font-semibold cursor-pointer">
                                    مسودة
                                  </Label>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    حفظ كمسودة - لن يظهر للطلاب، يمكنك التعديل عليه لاحقاً
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-start space-x-3 space-x-reverse border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                                <RadioGroupItem value="scheduled" id="scheduled" className="mt-1" />
                                <div className="flex-1">
                                  <Label htmlFor="scheduled" className="font-semibold cursor-pointer">
                                    مجدول
                                  </Label>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    سيظهر للطلاب في الوقت المحدد تلقائياً
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-start space-x-3 space-x-reverse border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                                <RadioGroupItem value="active" id="active" className="mt-1" />
                                <div className="flex-1">
                                  <Label htmlFor="active" className="font-semibold cursor-pointer">
                                    نشط الآن
                                  </Label>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    نشر فوراً - سيظهر للطلاب مباشرة بعد الحفظ
                                  </p>
                                </div>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* حقول التواريخ الديناميكية */}
                    {form.watch('publish_status') === 'scheduled' && (
                      <div className="space-y-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                          📅 مواعيد الامتحان المجدول
                        </h4>
                        
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="start_datetime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>تاريخ ووقت البدء *</FormLabel>
                                <FormControl>
                                  <DateTimePicker
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="اختر تاريخ ووقت البدء"
                                    minDate={new Date()}
                                  />
                                </FormControl>
                                <FormDescription>متى سيصبح الامتحان متاحاً للطلاب</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="end_datetime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>تاريخ ووقت الانتهاء *</FormLabel>
                                <FormControl>
                                  <DateTimePicker
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="اختر تاريخ ووقت الانتهاء"
                                    minDate={form.watch('start_datetime') 
                                      ? new Date(form.watch('start_datetime')!) 
                                      : new Date()
                                    }
                                  />
                                </FormControl>
                                <FormDescription>آخر موعد لتقديم الامتحان</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {form.watch('start_datetime') && form.watch('end_datetime') && (
                          <div className="bg-white dark:bg-gray-900 p-4 rounded-md border">
                            <p className="font-medium mb-3 text-sm">📋 ملخص المواعيد:</p>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">🟢 البدء:</span>
                                <span className="font-mono font-semibold" dir="ltr">
                                  {formatDateTime12H(form.watch('start_datetime')!)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">🔴 الانتهاء:</span>
                                <span className="font-mono font-semibold" dir="ltr">
                                  {formatDateTime12H(form.watch('end_datetime')!)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t">
                                <span className="text-muted-foreground">⏱️ المدة:</span>
                                <span className="font-semibold">
                                  {Math.ceil(
                                    (new Date(form.watch('end_datetime')!).getTime() - 
                                     new Date(form.watch('start_datetime')!).getTime()) 
                                    / (1000 * 60 * 60 * 24)
                                  )} يوم
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {form.watch('publish_status') === 'active' && (
                      <div className="space-y-4 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                        <h4 className="font-semibold text-green-900 dark:text-green-100">
                          ⚡ نشر فوري
                        </h4>
                        
                        <FormField
                          control={form.control}
                          name="end_datetime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>تاريخ ووقت الانتهاء *</FormLabel>
                              <FormControl>
                                <DateTimePicker
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="اختر تاريخ ووقت الانتهاء"
                                  minDate={new Date()}
                                />
                              </FormControl>
                              <FormDescription>
                                الامتحان سيبدأ فوراً وينتهي في التاريخ المحدد
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="bg-white dark:bg-gray-900 p-3 rounded-md text-sm">
                          <p className="text-muted-foreground">
                            📌 سيبدأ الامتحان فوراً عند حفظه، وستحتاج فقط لتحديد موعد الانتهاء
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation buttons */}
                <DialogFooter className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {currentStep > 1 && (
                      <Button type="button" variant="outline" onClick={handlePreviousStep}>
                        <ArrowRight className="w-4 h-4 ml-2" />
                        السابق
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {currentStep < 7 ? (
                      <Button type="button" onClick={handleNextStep}>
                        التالي
                        <ArrowLeft className="w-4 h-4 mr-2" />
                      </Button>
                    ) : (
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'جاري الحفظ...' : editingExamId ? 'تحديث الامتحان' : 'إنشاء الامتحان'}
                      </Button>
                    )}
                  </div>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Dialog معاينة الامتحان */}
        {previewExamId && previewData && (
          <ExamPreview
            examData={previewData}
            open={!!previewExamId}
            onOpenChange={(open) => {
              if (!open) setPreviewExamId(null);
            }}
          />
        )}

        {/* Loading state للمعاينة */}
        {previewExamId && previewLoading && (
          <Dialog open={true} onOpenChange={() => setPreviewExamId(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>جاري تحميل الامتحان...</DialogTitle>
              </DialogHeader>
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
    
    {/* حوار إضافة سؤال جديد */}
    <TeacherQuestionDialog
      open={isQuestionDialogOpen}
      onOpenChange={setIsQuestionDialogOpen}
      onSuccess={() => {
        queryClient.invalidateQueries({ queryKey: ['teacher-exams', user?.id] });
        queryClient.invalidateQueries({ queryKey: ['teacher-questions'] });
        queryClient.invalidateQueries({ queryKey: ['teacher-question-categories'] });
      }}
      existingCategories={categories}
    />
  </>
  );
};
