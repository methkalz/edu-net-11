import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, FileQuestion, TrendingUp, Users, ArrowRight, Plus, ArrowLeft } from 'lucide-react';
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

interface ExamsWidgetProps {
  canAccessGrade10: boolean;
  canAccessGrade11: boolean;
}

// Schema للنموذج
const createExamSchema = z.object({
  title: z.string().min(1, 'العنوان مطلوب').max(200, 'العنوان طويل جداً'),
  description: z.string().optional(),
  exam_type: z.enum(['quiz', 'midterm', 'final', 'practice']),
  grade_levels: z.array(z.string()).min(1, 'يجب اختيار صف واحد على الأقل'),
  start_datetime: z.string().min(1, 'تاريخ البدء مطلوب'),
  end_datetime: z.string().min(1, 'تاريخ الانتهاء مطلوب'),
  duration_minutes: z.number().min(1, 'مدة الامتحان مطلوبة'),
  max_attempts: z.number().min(1, 'عدد المحاولات مطلوب'),
  passing_percentage: z.number().min(0).max(100).default(50),
  shuffle_questions: z.boolean().default(false),
  shuffle_choices: z.boolean().default(false),
  show_results_immediately: z.boolean().default(true),
  allow_review: z.boolean().default(true),
});

type CreateExamFormData = z.infer<typeof createExamSchema>;

export const ExamsWidget: React.FC<ExamsWidgetProps> = ({ canAccessGrade10, canAccessGrade11 }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading } = useTeacherExams(user?.id);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateExamFormData>({
    resolver: zodResolver(createExamSchema),
    defaultValues: {
      title: '',
      description: '',
      exam_type: 'quiz',
      grade_levels: [],
      start_datetime: '',
      end_datetime: '',
      duration_minutes: 60,
      max_attempts: 1,
      passing_percentage: 50,
      shuffle_questions: false,
      shuffle_choices: false,
      show_results_immediately: true,
      allow_review: true,
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
    setIsCreateDialogOpen(true);
  };

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof CreateExamFormData)[] = [];
    
    if (currentStep === 1) {
      fieldsToValidate = ['title', 'description', 'exam_type'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['grade_levels'];
    } else if (currentStep === 3) {
      fieldsToValidate = ['start_datetime', 'end_datetime', 'duration_minutes', 'max_attempts'];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const onSubmit = async (data: CreateExamFormData) => {
    try {
      setIsSubmitting(true);

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

      // إنشاء الامتحان
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .insert({
          title: data.title,
          description: data.description || null,
          duration_minutes: data.duration_minutes,
          passing_percentage: data.passing_percentage,
          grade_levels: data.grade_levels,
          start_datetime: data.start_datetime,
          end_datetime: data.end_datetime,
          max_attempts: data.max_attempts,
          shuffle_questions: data.shuffle_questions,
          shuffle_choices: data.shuffle_choices,
          show_results_immediately: data.show_results_immediately,
          allow_review: data.allow_review,
          status: 'draft',
          created_by: user.id,
          school_id: profile.school_id,
        })
        .select()
        .single();

      if (examError) throw examError;

      toast.success('تم إنشاء الامتحان بنجاح!');
      setIsCreateDialogOpen(false);
      
      // التوجيه إلى صفحة الامتحان لإضافة الأسئلة
      const primaryGrade = data.grade_levels.includes('11') ? '11' : '10';
      navigate(`/grade${primaryGrade}-management?tab=exams&examId=${examData.id}`);
      
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
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
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
            <DialogTitle className="text-xl">إنشاء امتحان جديد</DialogTitle>
            <DialogDescription>
              خطوة {currentStep} من 4
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                          <Input placeholder="مثال: امتحان الوحدة الأولى" {...field} />
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
                            <SelectTrigger>
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
                    <h3 className="font-semibold mb-2">الصفوف المستهدفة</h3>
                    <p className="text-sm text-muted-foreground">
                      اختر الصف أو الصفوف التي سيكون الامتحان متاحاً لها
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="grade_levels"
                    render={() => (
                      <FormItem>
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
                                    الصف العاشر
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
                                    الصف الحادي عشر
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

              {/* الخطوة 4: خيارات متقدمة */}
              {currentStep === 4 && (
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

                {currentStep < 4 ? (
                  <Button
                    type="button"
                    onClick={handleNextStep}
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
                    {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء الامتحان'}
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
