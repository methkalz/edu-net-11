import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, FileQuestion, TrendingUp, Users, ArrowRight, Plus, ArrowLeft, Trash2, Edit, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTeacherExams } from '@/hooks/useTeacherExams';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
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
  start_datetime: z.string().optional(),
  end_datetime: z.string().optional(),
  duration_minutes: z.number().min(1, 'مدة الامتحان مطلوبة'),
  max_attempts: z.number().min(1, 'عدد المحاولات مطلوب'),
  passing_percentage: z.number().min(0).max(100).default(50),
  shuffle_questions: z.boolean().default(false),
  shuffle_choices: z.boolean().default(false),
  show_results_immediately: z.boolean().default(true),
  allow_review: z.boolean().default(true),
  // إعدادات الأسئلة الذكية
  question_source_type: z.enum(['random', 'specific_sections']).default('random'),
  selected_sections: z.array(z.string()).optional(),
  questions_count: z.number().min(1, 'عدد الأسئلة مطلوب').default(10),
  // توزيع الصعوبة الذكي
  difficulty_mode: z.enum(['easy_focused', 'balanced', 'medium_focused', 'challenging', 'hard_focused', 'custom']).default('balanced'),
  custom_easy: z.number().min(0).max(100).default(40),
  custom_medium: z.number().min(0).max(100).default(40),
  custom_hard: z.number().min(0).max(100).default(20),
});

type CreateExamFormData = z.infer<typeof createExamSchema>;

// Presets for difficulty
const difficultyPresets = {
  easy_focused: { easy: 60, medium: 30, hard: 10, label: 'سهل ومتوازن', icon: '📊' },
  balanced: { easy: 40, medium: 40, hard: 20, label: 'متوازن (افتراضي)', icon: '⚖️' },
  medium_focused: { easy: 30, medium: 50, hard: 20, label: 'متوسط متوازن', icon: '📈' },
  challenging: { easy: 30, medium: 40, hard: 30, label: 'متوسط التحدي', icon: '🎯' },
  hard_focused: { easy: 20, medium: 30, hard: 50, label: 'تحدي متقدم', icon: '🔥' },
  custom: { easy: 33, medium: 33, hard: 34, label: 'مخصص', icon: '⚙️' },
};

export const ExamsWidget: React.FC<ExamsWidgetProps> = ({ canAccessGrade10, canAccessGrade11 }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading } = useTeacherExams(user?.id);
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);

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
      question_source_type: 'random',
      selected_sections: [],
      questions_count: 10,
      difficulty_mode: 'balanced',
      custom_easy: 40,
      custom_medium: 40,
      custom_hard: 20,
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
        .select('section_name, grade_level, difficulty')
        .eq('grade_level', selectedGradeLevel)
        .eq('is_active', true);

      if (error) throw error;

      // تجميع البيانات حسب القسم
      const sectionsMap = new Map();
      data?.forEach(q => {
        if (!sectionsMap.has(q.section_name)) {
          sectionsMap.set(q.section_name, { easy: 0, medium: 0, hard: 0 });
        }
        const section = sectionsMap.get(q.section_name);
        section[q.difficulty]++;
      });

      return Array.from(sectionsMap.entries()).map(([name, counts]) => ({
        name,
        easy: counts.easy,
        medium: counts.medium,
        hard: counts.hard,
        total: counts.easy + counts.medium + counts.hard,
      }));
    },
    enabled: !!selectedGradeLevel && isCreateDialogOpen,
  });

  // حساب عدد الأسئلة المتاحة بناءً على الاختيارات
  const questionsCount = form.watch('questions_count');
  const questionSourceType = form.watch('question_source_type');
  const selectedSections = form.watch('selected_sections');
  const difficultyMode = form.watch('difficulty_mode');
  const customEasy = form.watch('custom_easy');
  const customMedium = form.watch('custom_medium');
  const customHard = form.watch('custom_hard');

  const calculateAvailableQuestions = () => {
    if (!availableSections || availableSections.length === 0) return { easy: 0, medium: 0, hard: 0, total: 0 };

    let counts = { easy: 0, medium: 0, hard: 0 };

    if (questionSourceType === 'random') {
      availableSections.forEach(section => {
        counts.easy += section.easy;
        counts.medium += section.medium;
        counts.hard += section.hard;
      });
    } else {
      availableSections
        .filter(section => selectedSections?.includes(section.name))
        .forEach(section => {
          counts.easy += section.easy;
          counts.medium += section.medium;
          counts.hard += section.hard;
        });
    }

    return { ...counts, total: counts.easy + counts.medium + counts.hard };
  };

  const availableQuestions = calculateAvailableQuestions();

  // حساب التوزيع المتوقع
  const getDistribution = () => {
    if (difficultyMode === 'custom') {
      return { easy: customEasy, medium: customMedium, hard: customHard };
    }
    return difficultyPresets[difficultyMode];
  };

  const distribution = getDistribution();
  const expectedCounts = {
    easy: Math.round((questionsCount * distribution.easy) / 100),
    medium: Math.round((questionsCount * distribution.medium) / 100),
    hard: Math.round((questionsCount * distribution.hard) / 100),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-600 dark:text-green-400';
      case 'scheduled': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'completed': return 'bg-gray-500/10 text-gray-600 dark:text-gray-400';
      case 'draft': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
      default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'scheduled': return 'مجدول';
      case 'completed': return 'منتهي';
      case 'draft': return 'مسودة';
      default: return status;
    }
  };

  const handleManageExams = (grade: string) => {
    navigate(`/grade${grade}-management?tab=exams`);
  };

  const handleOpenCreateDialog = () => {
    form.reset();
    setCurrentStep(1);
    setEditingExamId(null);
    setIsCreateDialogOpen(true);
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
      const diffDist = exam.difficulty_distribution as any || { mode: 'balanced', distribution: { easy: 40, medium: 40, hard: 20 } };

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
        question_source_type: (exam.question_source_type || 'random') as 'random' | 'specific_sections',
        selected_sections: exam.selected_sections || [],
        questions_count: exam.questions_count || 10,
        difficulty_mode: (diffDist.mode || 'balanced') as any,
        custom_easy: diffDist.distribution?.easy || 40,
        custom_medium: diffDist.distribution?.medium || 40,
        custom_hard: diffDist.distribution?.hard || 20,
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

  const handleNextStep = async () => {
    try {
      if (currentStep === 1) {
        const isValid = await form.trigger(['title', 'exam_type']);
        if (!isValid) return;
        setCurrentStep(prev => prev + 1);
      } else if (currentStep === 2) {
        const selectionType = form.getValues('selection_type');
        const gradeLevels = form.getValues('grade_levels');
        const targetClasses = form.getValues('target_classes');
        
        if (selectionType === 'all_grade') {
          if (!gradeLevels || gradeLevels.length === 0) {
            toast.error('يجب اختيار صف واحد على الأقل');
            return;
          }
        } else {
          if (!targetClasses || targetClasses.length === 0) {
            toast.error('يجب اختيار صف محدد واحد على الأقل');
            return;
          }
        }
        setCurrentStep(prev => prev + 1);
      } else if (currentStep === 3) {
        const startDate = form.getValues('start_datetime');
        const endDate = form.getValues('end_datetime');
        
        if (!startDate) {
          form.setError('start_datetime', { message: 'تاريخ البدء مطلوب' });
          return;
        }
        if (!endDate) {
          form.setError('end_datetime', { message: 'تاريخ الانتهاء مطلوب' });
          return;
        }
        
        const isValid = await form.trigger(['duration_minutes', 'max_attempts']);
        if (!isValid) return;
        setCurrentStep(prev => prev + 1);
      } else if (currentStep === 4) {
        const questionSourceType = form.getValues('question_source_type');
        if (questionSourceType === 'specific_sections') {
          const selectedSections = form.getValues('selected_sections');
          if (!selectedSections || selectedSections.length === 0) {
            toast.error('يجب اختيار قسم واحد على الأقل');
            return;
          }
        }
        const questionsCount = form.getValues('questions_count');
        if (!questionsCount || questionsCount < 1) {
          toast.error('يجب تحديد عدد الأسئلة');
          return;
        }
        setCurrentStep(prev => prev + 1);
      } else if (currentStep === 5) {
        // التحقق من توزيع الصعوبة
        if (difficultyMode === 'custom') {
          const total = customEasy + customMedium + customHard;
          if (total !== 100) {
            toast.error('يجب أن يكون مجموع النسب 100%');
            return;
          }
        }
        setCurrentStep(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error in handleNextStep:', error);
      toast.error('حدث خطأ في التحقق من البيانات');
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const onSubmit = async (data: CreateExamFormData) => {
    if (currentStep !== 6) {
      console.warn('Submit called from non-final step:', currentStep);
      return;
    }
    
    try {
      setIsSubmitting(true);

      if (!user?.id) {
        toast.error('خطأ في المصادقة');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.school_id) {
        toast.error('لا يمكن تحديد المدرسة');
        return;
      }

      // إعداد بيانات توزيع الصعوبة
      const diffDistribution = {
        mode: data.difficulty_mode,
        distribution: {
          easy: data.difficulty_mode === 'custom' ? data.custom_easy : difficultyPresets[data.difficulty_mode].easy,
          medium: data.difficulty_mode === 'custom' ? data.custom_medium : difficultyPresets[data.difficulty_mode].medium,
          hard: data.difficulty_mode === 'custom' ? data.custom_hard : difficultyPresets[data.difficulty_mode].hard,
        }
      };

      const examData = {
        title: data.title,
        description: data.description || null,
        duration_minutes: data.duration_minutes,
        passing_percentage: data.passing_percentage,
        grade_levels: data.selection_type === 'all_grade' ? data.grade_levels : [],
        target_classes: data.selection_type === 'specific_classes' ? data.target_classes : [],
        start_datetime: data.start_datetime,
        end_datetime: data.end_datetime,
        max_attempts: data.max_attempts,
        shuffle_questions: data.shuffle_questions,
        shuffle_choices: data.shuffle_choices,
        show_results_immediately: data.show_results_immediately,
        allow_review: data.allow_review,
        question_source_type: data.question_source_type,
        selected_sections: data.selected_sections || [],
        questions_count: data.questions_count,
        difficulty_distribution: diffDistribution,
        status: 'draft' as const,
        total_questions: data.questions_count,
        total_points: data.questions_count * 10, // افتراض 10 نقاط لكل سؤال
      };

      if (editingExamId) {
        const { error: examError } = await supabase
          .from('exams')
          .update(examData)
          .eq('id', editingExamId);

        if (examError) throw examError;
        toast.success('تم تحديث الامتحان بنجاح!');
      } else {
        const { error: examError } = await supabase
          .from('exams')
          .insert({
            ...examData,
            created_by: user.id,
            school_id: profile.school_id,
          });

        if (examError) throw examError;
        toast.success('تم إنشاء الامتحان بنجاح!');
      }

      setIsCreateDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['teacher-exams', user?.id] });
    } catch (error) {
      console.error('Error submitting exam:', error);
      toast.error('حدث خطأ أثناء حفظ الامتحان');
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            الامتحانات الإلكترونية
          </CardTitle>
          <Button onClick={handleOpenCreateDialog} size="sm">
            <Plus className="w-4 h-4 ml-2" />
            امتحان جديد
          </Button>
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
            <div className="space-y-3 mb-4">
              {data.exams.slice(0, 4).map((exam: any) => (
                <div
                  key={exam.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm">{exam.title}</h4>
                      <Badge className={getStatusColor(exam.status)} variant="secondary">
                        {getStatusLabel(exam.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileQuestion className="w-3 h-3" />
                        {exam.total_questions} سؤال
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {exam.attempts_count} محاولة
                      </span>
                      {exam.avg_percentage !== null && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {exam.avg_percentage.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditExam(exam.id)}
                      className="text-primary hover:text-primary hover:bg-primary/10"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteExam(exam.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
                خطوة {currentStep} من 6
              </DialogDescription>
            </DialogHeader>

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

                {/* خطوة 3: الوقت والمدة */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="bg-muted/50 p-4 rounded-lg mb-4">
                      <h3 className="font-semibold mb-2">إعدادات الوقت</h3>
                      <p className="text-sm text-muted-foreground">
                        حدد مدة الامتحان وتواريخ البدء والانتهاء
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="start_datetime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>تاريخ ووقت البدء *</FormLabel>
                            <FormControl>
                              <Input type="datetime-local" {...field} />
                            </FormControl>
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
                              <Input type="datetime-local" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">عدد الأسئلة المطلوبة *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1}
                              max={100}
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormDescription>
                            إجمالي الأسئلة في الامتحان
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="question_source_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">اختر مصدر الأسئلة</FormLabel>
                          <FormControl>
                            <RadioGroup value={field.value} onValueChange={field.onChange}>
                              <div className="flex items-center space-x-3 space-x-reverse border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                                <RadioGroupItem value="random" id="random" />
                                <Label htmlFor="random" className="flex-1 cursor-pointer">
                                  <span className="text-base font-medium block">🎲 أسئلة عشوائية</span>
                                  <span className="text-sm text-muted-foreground">سيتم اختيار الأسئلة بشكل عشوائي من جميع الأقسام</span>
                                </Label>
                              </div>
                              <div className="flex items-center space-x-3 space-x-reverse border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                                <RadioGroupItem value="specific_sections" id="specific" />
                                <Label htmlFor="specific" className="flex-1 cursor-pointer">
                                  <span className="text-base font-medium block">📂 أقسام محددة</span>
                                  <span className="text-sm text-muted-foreground">اختر أقسام معينة من المنهج</span>
                                </Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* عرض الأقسام المتاحة */}
                    {questionSourceType === 'specific_sections' && (
                      <div className="space-y-4">
                        {sectionsLoading ? (
                          <div className="text-center py-4">
                            <p className="text-muted-foreground">جاري تحميل الأقسام...</p>
                          </div>
                        ) : !availableSections || availableSections.length === 0 ? (
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-medium text-yellow-800 dark:text-yellow-200">لا توجد أقسام متاحة</p>
                                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                  {!selectedGradeLevel 
                                    ? 'يجب اختيار الصف أولاً في الخطوة 2'
                                    : 'لا توجد أسئلة في بنك الأسئلة لهذا الصف'
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <FormField
                            control={form.control}
                            name="selected_sections"
                            render={() => (
                              <FormItem>
                                <FormLabel className="text-base">اختر الأقسام</FormLabel>
                                <div className="space-y-3 mt-3">
                                  {availableSections.map((section) => (
                                    <FormField
                                      key={section.name}
                                      control={form.control}
                                      name="selected_sections"
                                      render={({ field }) => (
                                        <FormItem className="flex items-start space-x-3 space-x-reverse space-y-0 border rounded-lg p-4 hover:bg-muted/50">
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(section.name)}
                                              onCheckedChange={(checked) => {
                                                return checked
                                                  ? field.onChange([...(field.value || []), section.name])
                                                  : field.onChange(field.value?.filter((value) => value !== section.name));
                                              }}
                                            />
                                          </FormControl>
                                          <div className="flex-1 space-y-2">
                                            <FormLabel className="font-medium cursor-pointer">
                                              {section.name}
                                            </FormLabel>
                                            <div className="flex items-center gap-4 text-xs">
                                              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                سهل: {section.easy}
                                              </span>
                                              <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                                                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                                متوسط: {section.medium}
                                              </span>
                                              <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                                صعب: {section.hard}
                                              </span>
                                              <span className="font-medium">
                                                المجموع: {section.total}
                                              </span>
                                            </div>
                                          </div>
                                        </FormItem>
                                      )}
                                    />
                                  ))}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {/* إحصائيات الأسئلة المتاحة */}
                        {availableSections && availableSections.length > 0 && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">📊 الأسئلة المتاحة</h4>
                            <div className="grid grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">سهل</p>
                                <p className="font-bold text-green-600">{availableQuestions.easy}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">متوسط</p>
                                <p className="font-bold text-yellow-600">{availableQuestions.medium}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">صعب</p>
                                <p className="font-bold text-red-600">{availableQuestions.hard}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">المجموع</p>
                                <p className="font-bold text-primary">{availableQuestions.total}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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
                              {Object.entries(difficultyPresets).map(([key, preset]) => (
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
                                          {preset.easy}% سهل • {preset.medium}% متوسط • {preset.hard}% صعب
                                        </span>
                                      </div>
                                    </div>
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Custom sliders */}
                    {difficultyMode === 'custom' && (
                      <div className="space-y-6 border rounded-lg p-4 bg-muted/30">
                        <h4 className="font-medium">تخصيص النسب يدوياً</h4>
                        
                        <FormField
                          control={form.control}
                          name="custom_easy"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center justify-between mb-2">
                                <FormLabel>أسئلة سهلة</FormLabel>
                                <span className="text-sm font-medium">{field.value}%</span>
                              </div>
                              <FormControl>
                                <Slider
                                  value={[field.value]}
                                  onValueChange={([value]) => field.onChange(value)}
                                  max={100}
                                  step={5}
                                  className="w-full"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="custom_medium"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center justify-between mb-2">
                                <FormLabel>أسئلة متوسطة</FormLabel>
                                <span className="text-sm font-medium">{field.value}%</span>
                              </div>
                              <FormControl>
                                <Slider
                                  value={[field.value]}
                                  onValueChange={([value]) => field.onChange(value)}
                                  max={100}
                                  step={5}
                                  className="w-full"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="custom_hard"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center justify-between mb-2">
                                <FormLabel>أسئلة صعبة</FormLabel>
                                <span className="text-sm font-medium">{field.value}%</span>
                              </div>
                              <FormControl>
                                <Slider
                                  value={[field.value]}
                                  onValueChange={([value]) => field.onChange(value)}
                                  max={100}
                                  step={5}
                                  className="w-full"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {(customEasy + customMedium + customHard) !== 100 && (
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                              ⚠️ المجموع الحالي: {customEasy + customMedium + customHard}% (يجب أن يكون 100%)
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* معاينة التوزيع */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-4">📈 معاينة التوزيع</h4>
                      
                      <div className="space-y-3 mb-4">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-green-700 dark:text-green-300">أسئلة سهلة</span>
                            <span className="font-medium">{expectedCounts.easy} سؤال ({distribution.easy}%)</span>
                          </div>
                          <Progress value={distribution.easy} className="h-2" />
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-yellow-700 dark:text-yellow-300">أسئلة متوسطة</span>
                            <span className="font-medium">{expectedCounts.medium} سؤال ({distribution.medium}%)</span>
                          </div>
                          <Progress value={distribution.medium} className="h-2" />
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-red-700 dark:text-red-300">أسئلة صعبة</span>
                            <span className="font-medium">{expectedCounts.hard} سؤال ({distribution.hard}%)</span>
                          </div>
                          <Progress value={distribution.hard} className="h-2" />
                        </div>
                      </div>

                      {/* تحذير إذا لم تكن هناك أسئلة كافية */}
                      {availableQuestions.total > 0 && (
                        <div className="mt-4 space-y-2">
                          {expectedCounts.easy > availableQuestions.easy && (
                            <p className="text-sm text-red-600 dark:text-red-400">
                              ⚠️ تحتاج {expectedCounts.easy} سؤال سهل لكن المتاح فقط {availableQuestions.easy}
                            </p>
                          )}
                          {expectedCounts.medium > availableQuestions.medium && (
                            <p className="text-sm text-red-600 dark:text-red-400">
                              ⚠️ تحتاج {expectedCounts.medium} سؤال متوسط لكن المتاح فقط {availableQuestions.medium}
                            </p>
                          )}
                          {expectedCounts.hard > availableQuestions.hard && (
                            <p className="text-sm text-red-600 dark:text-red-400">
                              ⚠️ تحتاج {expectedCounts.hard} سؤال صعب لكن المتاح فقط {availableQuestions.hard}
                            </p>
                          )}
                        </div>
                      )}
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
                    {currentStep < 6 ? (
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
      </CardContent>
    </Card>
  );
};
