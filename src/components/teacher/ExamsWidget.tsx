import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, FileQuestion, TrendingUp, Users, ArrowRight, Plus, ArrowLeft, Trash2, Edit } from 'lucide-react';
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

interface ExamsWidgetProps {
  canAccessGrade10: boolean;
  canAccessGrade11: boolean;
}

// Schema للنموذج - الحقول optional للسماح بالتحقق التدريجي حسب الخطوات
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
  question_source_type: z.enum(['random', 'specific_sections']).default('random'),
  selected_sections: z.array(z.string()).optional(),
  difficulty_levels: z.array(z.enum(['easy', 'medium', 'hard'])).optional(),
});

type CreateExamFormData = z.infer<typeof createExamSchema>;

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
      difficulty_levels: [],
    },
  });

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

      // ملء البيانات في النموذج
      form.reset({
        title: exam.title,
        description: exam.description || '',
        exam_type: 'quiz', // قيمة افتراضية
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
        difficulty_levels: (exam.difficulty_levels || []) as ('easy' | 'medium' | 'hard')[],
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
      
      // إعادة تحميل بيانات الامتحانات
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
        if (!isValid) {
          return;
        }
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
        if (!isValid) {
          return;
        }
        setCurrentStep(prev => prev + 1);
      } else if (currentStep === 4) {
        // التحقق من إعدادات مصدر الأسئلة
        const questionSourceType = form.getValues('question_source_type');
        if (questionSourceType === 'specific_sections') {
          const selectedSections = form.getValues('selected_sections');
          if (!selectedSections || selectedSections.length === 0) {
            toast.error('يجب اختيار قسم واحد على الأقل');
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
    // حماية: التأكد من أننا في الخطوة الأخيرة
    if (currentStep !== 5) {
      console.warn('Submit called from non-final step:', currentStep);
      return;
    }
    
    try {
      setIsSubmitting(true);

      // التحقق النهائي من جميع الحقول المطلوبة
      if (data.selection_type === 'all_grade') {
        if (!data.grade_levels || data.grade_levels.length === 0) {
          toast.error('يجب اختيار صف واحد على الأقل');
          setIsSubmitting(false);
          return;
        }
      } else {
        if (!data.target_classes || data.target_classes.length === 0) {
          toast.error('يجب اختيار صف محدد واحد على الأقل');
          setIsSubmitting(false);
          return;
        }
      }
      
      if (!data.start_datetime) {
        toast.error('تاريخ البدء مطلوب');
        setIsSubmitting(false);
        return;
      }
      if (!data.end_datetime) {
        toast.error('تاريخ الانتهاء مطلوب');
        setIsSubmitting(false);
        return;
      }

      if (!user?.id) {
        toast.error('خطأ في المصادقة');
        return;
      }

      // Get school_id from user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.school_id) {
        toast.error('لا يمكن تحديد المدرسة');
        return;
      }

      // تحديث أو إنشاء الامتحان
      if (editingExamId) {
        // تحديث الامتحان
        const { error: examError } = await supabase
          .from('exams')
          .update({
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
            difficulty_levels: data.difficulty_levels || [],
          })
          .eq('id', editingExamId);

        if (examError) throw examError;

        toast.success('تم تحديث الامتحان بنجاح!');
      } else {
        // إنشاء امتحان جديد
        const { error: examError } = await supabase
          .from('exams')
          .insert({
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
            difficulty_levels: data.difficulty_levels || [],
            status: 'draft',
            created_by: user.id,
            school_id: profile.school_id,
          });

        if (examError) throw examError;

        toast.success('تم إنشاء الامتحان بنجاح!');
      }
      
      // إعادة تحميل بيانات الامتحانات
      await queryClient.invalidateQueries({ queryKey: ['teacher-exams', user.id] });
      
      setIsCreateDialogOpen(false);
      form.reset();
      setCurrentStep(1);
      
    } catch (error) {
      console.error('Error creating exam:', error);
      toast.error('حدث خطأ أثناء إنشاء الامتحان');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-br from-orange-500/10 to-purple-500/10 border-b">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const exams = data?.exams || [];
  const stats = data?.stats;
  const totalQuestions = data?.totalQuestions || 0;

  // تصفية الامتحانات حسب الصفوف المسموح بها
  const filteredExams = exams.filter(exam => {
    const hasGrade10 = exam.grade_levels.some(g => g === '10' || g.includes('عاشر'));
    const hasGrade11 = exam.grade_levels.some(g => g === '11' || g.includes('حادي'));
    return (canAccessGrade10 && hasGrade10) || (canAccessGrade11 && hasGrade11);
  });

  const recentExams = filteredExams.slice(0, 4);

  return (
    <Card className="overflow-hidden shadow-lg">
      <CardHeader className="bg-gradient-to-br from-orange-500/10 to-purple-500/10 border-b">
        <CardTitle className="text-xl flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-orange-600" />
          الامتحانات الإلكترونية
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 p-4 rounded-lg border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="w-4 h-4 text-green-600" />
              <span className="text-sm text-muted-foreground">امتحانات نشطة</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats?.activeExams || 0}</p>
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
              {stats?.avgScoreAll ? `${stats.avgScoreAll.toFixed(1)}%` : '--'}
            </p>
          </div>
        </div>

        {/* قائمة الامتحانات */}
        {recentExams.length > 0 ? (
          <>
            <div className="space-y-3 mb-4">
              {recentExams.map((exam) => (
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
      </CardContent>

      {/* Dialog متعدد الخطوات لإنشاء امتحان */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingExamId ? 'تعديل الامتحان' : 'إنشاء امتحان جديد'}
            </DialogTitle>
            <DialogDescription>
              خطوة {currentStep} من 5
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form 
              onSubmit={form.handleSubmit(onSubmit)} 
              onKeyDown={(e) => {
                if (e.key === 'Enter' && currentStep < 5) {
                  e.preventDefault();
                }
              }}
              className="space-y-6"
            >
              {/* الخطوة 1: معلومات أساسية */}
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

              {/* الخطوة 2: اختيار الصفوف */}
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

              {/* الخطوة 3: إعدادات الوقت */}
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

              {/* الخطوة 4: مصدر الأسئلة ودرجة الصعوبة */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg mb-4">
                    <h3 className="font-semibold mb-2">مصدر الأسئلة والصعوبة</h3>
                    <p className="text-sm text-muted-foreground">
                      حدد كيف سيتم اختيار الأسئلة ومستوى صعوبتها
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="question_source_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>مصدر الأسئلة</FormLabel>
                        <FormControl>
                          <div className="space-y-3">
                            <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                              <input
                                type="radio"
                                value="random"
                                checked={field.value === 'random'}
                                onChange={() => field.onChange('random')}
                                className="w-4 h-4"
                              />
                              <div>
                                <span className="text-sm font-medium block">أسئلة عشوائية</span>
                                <span className="text-xs text-muted-foreground">سيتم اختيار الأسئلة بشكل عشوائي من بنك الأسئلة</span>
                              </div>
                            </label>
                            <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                              <input
                                type="radio"
                                value="specific_sections"
                                checked={field.value === 'specific_sections'}
                                onChange={() => field.onChange('specific_sections')}
                                className="w-4 h-4"
                              />
                              <div>
                                <span className="text-sm font-medium block">أقسام محددة</span>
                                <span className="text-xs text-muted-foreground">اختر أقسام معينة من المنهج</span>
                              </div>
                            </label>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch('question_source_type') === 'specific_sections' && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        ملاحظة: يمكنك تحديد الأقسام المحددة عند إضافة الأسئلة للامتحان في صفحة إدارة الامتحانات
                      </p>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="difficulty_levels"
                    render={() => (
                      <FormItem>
                        <FormLabel>مستويات الصعوبة</FormLabel>
                        <FormDescription>
                          اختر مستويات الصعوبة المطلوبة للأسئلة (اختياري)
                        </FormDescription>
                        <div className="space-y-3">
                          <FormField
                            control={form.control}
                            name="difficulty_levels"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-3 space-x-reverse space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes('easy')}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), 'easy'])
                                        : field.onChange(field.value?.filter((value) => value !== 'easy'));
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-medium cursor-pointer flex items-center gap-2">
                                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/10 flex items-center justify-center">
                                    <span className="text-green-600 font-bold text-xs">سهل</span>
                                  </div>
                                  أسئلة سهلة
                                </FormLabel>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="difficulty_levels"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-3 space-x-reverse space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes('medium')}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), 'medium'])
                                        : field.onChange(field.value?.filter((value) => value !== 'medium'));
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-medium cursor-pointer flex items-center gap-2">
                                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 flex items-center justify-center">
                                    <span className="text-yellow-600 font-bold text-xs">متوسط</span>
                                  </div>
                                  أسئلة متوسطة
                                </FormLabel>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="difficulty_levels"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-3 space-x-reverse space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes('hard')}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), 'hard'])
                                        : field.onChange(field.value?.filter((value) => value !== 'hard'));
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-medium cursor-pointer flex items-center gap-2">
                                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500/20 to-red-600/10 flex items-center justify-center">
                                    <span className="text-red-600 font-bold text-xs">صعب</span>
                                  </div>
                                  أسئلة صعبة
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormDescription className="text-xs mt-2">
                          إذا لم تختر أي مستوى، سيتم تضمين جميع المستويات
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* الخطوة 5: خيارات متقدمة */}
              {currentStep === 5 && (
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

              {/* أزرار التنقل */}
              <DialogFooter className="gap-2">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePreviousStep}
                  >
                    <ArrowRight className="w-4 h-4 ml-2" />
                    السابق
                  </Button>
                )}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  إلغاء
                </Button>

                {currentStep < 5 ? (
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleNextStep();
                    }}
                    className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
                  >
                    التالي
                    <ArrowLeft className="w-4 h-4 mr-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                  >
                    {isSubmitting 
                      ? (editingExamId ? 'جاري التحديث...' : 'جاري الإنشاء...') 
                      : (editingExamId ? 'تحديث الامتحان' : 'إنشاء الامتحان')
                    }
                    <Plus className="w-4 h-4 mr-2" />
                  </Button>
                )}
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
