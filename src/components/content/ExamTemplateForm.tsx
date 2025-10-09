import React, { useState, useEffect } from 'react';
import { Save, FileText, Settings, BarChart3, Zap, Shield, Clock, Users, CheckCircle2, AlertCircle, Info, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useExamSystem } from '@/hooks/useExamSystem';
import { logger } from '@/lib/logger';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ExamTemplateFormProps {
  template?: any;
  onClose: () => void;
  onSave: () => void;
}

const ExamTemplateForm: React.FC<ExamTemplateFormProps> = ({
  template,
  onClose,
  onSave
}) => {
  const { createTemplate, sections, fetchSections } = useExamSystem();
  
  const [formData, setFormData] = useState({
    title: 'اختبار أساسيات الاتصال',
    description: '',
    grade_level: '11',
    total_questions: 10,
    duration_minutes: 60,
    difficulty_distribution: {
      easy: 30,
      medium: 50,
      hard: 20
    },
    randomize_questions: true,
    randomize_answers: true,
    pass_percentage: 60,
    max_attempts: 1,
    show_results_immediately: false,
    is_active: true,
    question_sources: {
      type: 'random', // 'random', 'specific', 'general_only', 'mixed'
      sections: [], // array of section IDs
      include_general: false, // include general questions
      section_distribution: {} // distribution per section
    }
  });

  useEffect(() => {
    if (template) {
      setFormData({
        title: template.title || 'اختبار أساسيات الاتصال',
        description: template.description || '',
        grade_level: template.grade_level || '11',
        total_questions: template.total_questions || 10,
        duration_minutes: template.duration_minutes || 60,
        difficulty_distribution: template.difficulty_distribution || {
          easy: 30,
          medium: 50,
          hard: 20
        },
        randomize_questions: template.randomize_questions ?? true,
        randomize_answers: template.randomize_answers ?? true,
        pass_percentage: template.pass_percentage || 60,
        max_attempts: template.max_attempts || 1,
        show_results_immediately: template.show_results_immediately ?? false,
        is_active: template.is_active ?? true,
        question_sources: template.question_sources || {
          type: 'random',
          sections: [],
          include_general: false,
          section_distribution: {}
        }
      });
    }
  }, [template]);

  // Fetch sections on component mount
  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const handleDifficultyChange = (level: 'easy' | 'medium' | 'hard', value: number[]) => {
    const newValue = value[0];
    const currentTotal = formData.difficulty_distribution.easy + 
                        formData.difficulty_distribution.medium + 
                        formData.difficulty_distribution.hard;
    
    const otherTotal = currentTotal - formData.difficulty_distribution[level];
    const remaining = 100 - newValue;
    
    // Distribute remaining percentage among other levels proportionally
    const otherLevels = Object.keys(formData.difficulty_distribution).filter(l => l !== level) as ('easy' | 'medium' | 'hard')[];
    
    const newDistribution = { ...formData.difficulty_distribution };
    newDistribution[level] = newValue;
    
    if (otherTotal > 0) {
      let distributedTotal = 0;
      otherLevels.forEach((otherLevel, index) => {
        if (index === otherLevels.length - 1) {
          // Last level gets the remainder to ensure total is 100
          newDistribution[otherLevel] = remaining - distributedTotal;
        } else {
          const proportion = formData.difficulty_distribution[otherLevel] / otherTotal;
          const newAmount = Math.round(remaining * proportion);
          newDistribution[otherLevel] = newAmount;
          distributedTotal += newAmount;
        }
      });
    } else {
      // If other levels were 0, distribute equally
      const equalShare = Math.floor(remaining / otherLevels.length);
      const remainder = remaining % otherLevels.length;
      
      otherLevels.forEach((otherLevel, index) => {
        newDistribution[otherLevel] = equalShare + (index < remainder ? 1 : 0);
      });
    }
    
    setFormData(prev => ({
      ...prev,
      difficulty_distribution: newDistribution
    }));
  };

  // Handle question source changes
  const handleSourceTypeChange = (type: string) => {
    setFormData(prev => ({
      ...prev,
      question_sources: {
        ...prev.question_sources,
        type,
        sections: type === 'random' ? [] : prev.question_sources.sections,
        include_general: type === 'general_only' ? true : prev.question_sources.include_general
      }
    }));
  };

  const handleSectionSelection = (sectionId: string, checked: boolean) => {
    if (sectionId === 'general') {
      setFormData(prev => ({
        ...prev,
        question_sources: {
          ...prev.question_sources,
          include_general: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        question_sources: {
          ...prev.question_sources,
          sections: checked 
            ? [...prev.question_sources.sections, sectionId]
            : prev.question_sources.sections.filter(id => id !== sectionId)
        }
      }));
    }
  };

  const handleSelectAllSections = () => {
    const regularSections = sections.filter(s => s.id !== 'general');
    setFormData(prev => ({
      ...prev,
      question_sources: {
        ...prev.question_sources,
        sections: regularSections.map(s => s.id),
        include_general: true
      }
    }));
  };

  const handleClearAllSections = () => {
    setFormData(prev => ({
      ...prev,
      question_sources: {
        ...prev.question_sources,
        sections: [],
        include_general: false
      }
    }));
  };

  // Calculate total available questions
  const getTotalAvailableQuestions = () => {
    let total = 0;
    
    if (formData.question_sources.type === 'random') {
      // All questions from all sections
      total = sections.reduce((sum, section) => sum + (section.question_count || 0), 0);
    } else if (formData.question_sources.type === 'general_only') {
      // Only general questions
      const generalSection = sections.find(s => s.id === 'general');
      total = generalSection?.question_count || 0;
    } else {
      // Specific sections
      if (formData.question_sources.include_general) {
        const generalSection = sections.find(s => s.id === 'general');
        total += generalSection?.question_count || 0;
      }
      
      formData.question_sources.sections.forEach(sectionId => {
        const section = sections.find(s => s.id === sectionId);
        total += section?.question_count || 0;
      });
    }
    
    return total;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "خطأ في التحقق",
        description: "يرجى إدخال عنوان القالب",
        variant: "destructive"
      });
      return;
    }

    if (formData.total_questions < 1) {
      toast({
        title: "خطأ في التحقق",
        description: "يجب أن يكون عدد الأسئلة أكبر من صفر",
        variant: "destructive"
      });
      return;
    }

    // Validate difficulty distribution totals to 100%
    const total = formData.difficulty_distribution.easy + 
                  formData.difficulty_distribution.medium + 
                  formData.difficulty_distribution.hard;
    
    if (Math.abs(total - 100) > 1) {
      toast({
        title: "خطأ في التحقق",
        description: "يجب أن يكون مجموع نسب مستويات الصعوبة 100%",
        variant: "destructive"
      });
      return;
    }

    // Validate question sources
    if (formData.question_sources.type === 'specific' && 
        formData.question_sources.sections.length === 0 && 
        !formData.question_sources.include_general) {
      toast({
        title: "خطأ في التحقق",
        description: "يرجى اختيار قسم واحد على الأقل أو تضمين الأسئلة العامة",
        variant: "destructive"
      });
      return;
    }

    // Validate available questions
    const availableQuestions = getTotalAvailableQuestions();
    if (availableQuestions < formData.total_questions) {
      toast({
        title: "خطأ في التحقق",
        description: `عدد الأسئلة المتاحة (${availableQuestions}) أقل من المطلوب (${formData.total_questions})`,
        variant: "destructive"
      });
      return;
    }

    try {
      await createTemplate(formData);
      onSave();
    } catch (error) {
      logger.error('Error saving template', error as Error);
    }
  };

  const difficultyTotal = formData.difficulty_distribution.easy + 
                          formData.difficulty_distribution.medium + 
                          formData.difficulty_distribution.hard;
  
  const isFormValid = formData.title.trim() && difficultyTotal === 100;

  return (
    <TooltipProvider>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">
              {template ? 'تحديث قالب الاختبار' : 'إنشاء قالب اختبار جديد'}
            </h2>
            <Badge variant={isFormValid ? "default" : "secondary"} className="px-3 py-1">
              {isFormValid ? (
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  جاهز للحفظ
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  يتطلب إكمال البيانات
                </div>
              )}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-6">
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-2">
                <FileText className="h-4 w-4" />
              </div>
              <span className="text-xs text-muted-foreground">المعلومات الأساسية</span>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-2">
                <Settings className="h-4 w-4" />
              </div>
              <span className="text-xs text-muted-foreground">إعدادات الاختبار</span>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-2">
                <Database className="h-4 w-4" />
              </div>
              <span className="text-xs text-muted-foreground">مصدر الأسئلة</span>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-2">
                <BarChart3 className="h-4 w-4" />
              </div>
              <span className="text-xs text-muted-foreground">توزيع الصعوبة</span>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-2">
                <Zap className="h-4 w-4" />
              </div>
              <span className="text-xs text-muted-foreground">الإعدادات المتقدمة</span>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">المعلومات الأساسية</CardTitle>
                <CardDescription>معلومات القالب والإعدادات العامة</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium flex items-center gap-2">
                عنوان القالب *
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>اختر عنواناً واضحاً ومميزاً للقالب</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="مثال: اختبار أساسيات الاتصال"
                className={cn(
                  "transition-all duration-200",
                  formData.title.trim() ? "border-green-500/50 bg-green-50/50" : "border-border"
                )}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">الوصف</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="شرح سريع عن الاختبار..."
                className="min-h-[80px] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="grade_level" className="text-sm font-medium">مستوى الصف</Label>
                <Select value={formData.grade_level} onValueChange={(value) => setFormData(prev => ({ ...prev, grade_level: value }))}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">الصف العاشر</SelectItem>
                    <SelectItem value="11">الصف الحادي عشر</SelectItem>
                    <SelectItem value="12">الصف الثاني عشر</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-accent/50">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-green-600" />
                  <div>
                    <Label htmlFor="is_active" className="text-sm font-medium">حالة القالب</Label>
                    <p className="text-xs text-muted-foreground">تفعيل أو إلغاء تفعيل القالب</p>
                  </div>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exam Configuration */}
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Settings className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">إعدادات الاختبار</CardTitle>
                <CardDescription>الإعدادات الأساسية للاختبار وشروط النجاح</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="total_questions" className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  عدد الأسئلة
                </Label>
                <Input
                  id="total_questions"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.total_questions}
                  onChange={(e) => setFormData(prev => ({ ...prev, total_questions: parseInt(e.target.value) || 1 }))}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">من 1 إلى 100 سؤال</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration_minutes" className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  مدة الاختبار (بالدقائق)
                </Label>
                <Input
                  id="duration_minutes"
                  type="number"
                  min="5"
                  max="300"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 60 }))}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">من 5 إلى 300 دقيقة</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pass_percentage" className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  نسبة النجاح (%)
                </Label>
                <Input
                  id="pass_percentage"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.pass_percentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, pass_percentage: parseInt(e.target.value) || 60 }))}
                  className="h-11"
                />
                <Progress value={formData.pass_percentage} className="h-2" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_attempts" className="text-sm font-medium">عدد المحاولات المسموحة</Label>
                <Select 
                  value={formData.max_attempts.toString()} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, max_attempts: parseInt(value) }))}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">محاولة واحدة</SelectItem>
                    <SelectItem value="2">محاولتان</SelectItem>
                    <SelectItem value="3">ثلاث محاولات</SelectItem>
                    <SelectItem value="5">خمس محاولات</SelectItem>
                    <SelectItem value="10">غير محدود (10)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Sources */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5"></div>
          <CardHeader className="relative">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl text-white">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl">مصدر الأسئلة</CardTitle>
                <CardDescription>تحديد من أين ستؤخذ أسئلة الاختبار</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative space-y-6">
            <div className="space-y-4">
              <Label className="text-base font-medium">نوع المصدر</Label>
              <Select value={formData.question_sources.type} onValueChange={handleSourceTypeChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="random">عشوائي من جميع الأقسام</SelectItem>
                  <SelectItem value="specific">أقسام محددة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.question_sources.type === 'specific' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">اختيار الأقسام</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllSections}
                      className="text-xs"
                    >
                      اختيار الكل
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleClearAllSections}
                      className="text-xs"
                    >
                      إلغاء الاختيار
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto p-3 bg-background/50 rounded-lg border">
                  {sections.map((section) => {
                    const isSelected = section.id === 'general' 
                      ? formData.question_sources.include_general 
                      : formData.question_sources.sections.includes(section.id);
                    const questionCount = section.question_count || 0;
                    const hasQuestions = questionCount > 0;
                    
                    return (
                      <div key={section.id} className={cn(
                        "flex items-center justify-between p-3 rounded-lg border transition-all",
                        hasQuestions ? "bg-background hover:bg-accent/50" : "bg-muted/30",
                        isSelected && hasQuestions && "bg-primary/5 border-primary/20"
                      )}>
                        <div className="flex items-center space-x-2 space-x-reverse flex-1">
                          <Checkbox
                            id={section.id}
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSectionSelection(section.id, checked as boolean)}
                            disabled={!hasQuestions}
                          />
                          <div className="flex-1">
                            <Label 
                              htmlFor={section.id} 
                              className={cn(
                                "text-sm cursor-pointer leading-relaxed",
                                hasQuestions ? "text-foreground" : "text-muted-foreground"
                              )}
                            >
                              {section.title}
                            </Label>
                            {!hasQuestions && section.id !== 'general' && (
                              <p className="text-xs text-muted-foreground">لا توجد أسئلة</p>
                            )}
                          </div>
                        </div>
                        <Badge 
                          variant={hasQuestions ? "secondary" : "outline"} 
                          className={cn(
                            "ml-2 font-mono",
                            hasQuestions ? "bg-primary/10 text-primary" : "text-muted-foreground"
                          )}
                        >
                          {questionCount}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="px-2 py-1">
                        {formData.question_sources.include_general ? 1 : 0} + {formData.question_sources.sections.length} مصدر مختار
                      </Badge>
                    </div>
                    <Badge variant="outline" className="font-mono">
                      {getTotalAvailableQuestions()} سؤال متاح
                    </Badge>
                  </div>
                  
                  {getTotalAvailableQuestions() < formData.total_questions && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <p className="text-sm text-destructive">
                        عدد الأسئلة المتاحة ({getTotalAvailableQuestions()}) أقل من المطلوب ({formData.total_questions})
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Difficulty Distribution */}
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">توزيع مستويات الصعوبة</CardTitle>
                  <CardDescription>توزيع الأسئلة حسب مستوى الصعوبة</CardDescription>
                </div>
              </div>
              <Badge 
                variant={difficultyTotal === 100 ? "default" : "destructive"}
                className="font-mono"
              >
                {difficultyTotal}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-6">
              {/* Easy Questions */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    أسئلة سهلة
                  </Label>
                  <Badge variant="secondary" className="font-mono bg-green-50 text-green-700 border-green-200">
                    {formData.difficulty_distribution.easy}%
                  </Badge>
                </div>
                <Slider
                  value={[formData.difficulty_distribution.easy]}
                  onValueChange={(value) => handleDifficultyChange('easy', value)}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <Progress value={formData.difficulty_distribution.easy} className="h-2 bg-green-100">
                  <div 
                    className="h-full bg-green-500 transition-all duration-300 rounded-full" 
                    style={{ width: `${formData.difficulty_distribution.easy}%` }}
                  />
                </Progress>
              </div>

              {/* Medium Questions */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    أسئلة متوسطة
                  </Label>
                  <Badge variant="secondary" className="font-mono bg-yellow-50 text-yellow-700 border-yellow-200">
                    {formData.difficulty_distribution.medium}%
                  </Badge>
                </div>
                <Slider
                  value={[formData.difficulty_distribution.medium]}
                  onValueChange={(value) => handleDifficultyChange('medium', value)}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <Progress value={formData.difficulty_distribution.medium} className="h-2 bg-yellow-100">
                  <div 
                    className="h-full bg-yellow-500 transition-all duration-300 rounded-full" 
                    style={{ width: `${formData.difficulty_distribution.medium}%` }}
                  />
                </Progress>
              </div>

              {/* Hard Questions */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    أسئلة صعبة
                  </Label>
                  <Badge variant="secondary" className="font-mono bg-red-50 text-red-700 border-red-200">
                    {formData.difficulty_distribution.hard}%
                  </Badge>
                </div>
                <Slider
                  value={[formData.difficulty_distribution.hard]}
                  onValueChange={(value) => handleDifficultyChange('hard', value)}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <Progress value={formData.difficulty_distribution.hard} className="h-2 bg-red-100">
                  <div 
                    className="h-full bg-red-500 transition-all duration-300 rounded-full" 
                    style={{ width: `${formData.difficulty_distribution.hard}%` }}
                  />
                </Progress>
              </div>

              {/* Total Visualization */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">إجمالي التوزيع</span>
                  <Badge variant={difficultyTotal === 100 ? "default" : "destructive"}>
                    {difficultyTotal}% / 100%
                  </Badge>
                </div>
                <div className="flex h-4 bg-background rounded-lg overflow-hidden">
                  <div 
                    className="bg-green-500 transition-all duration-300" 
                    style={{ width: `${formData.difficulty_distribution.easy}%` }}
                  />
                  <div 
                    className="bg-yellow-500 transition-all duration-300" 
                    style={{ width: `${formData.difficulty_distribution.medium}%` }}
                  />
                  <div 
                    className="bg-red-500 transition-all duration-300" 
                    style={{ width: `${formData.difficulty_distribution.hard}%` }}
                  />
                </div>
                {difficultyTotal !== 100 && (
                  <p className="text-xs text-destructive mt-2">
                    يجب أن يكون المجموع 100% تماماً
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Zap className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg">الإعدادات المتقدمة</CardTitle>
                <CardDescription>خيارات إضافية لتخصيص سلوك الاختبار</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-accent/50">
                <div className="space-y-1">
                  <Label htmlFor="randomize_questions" className="text-sm font-medium">
                    ترتيب عشوائي للأسئلة
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    تبديل ترتيب الأسئلة لكل طالب
                  </p>
                </div>
                <Switch
                  id="randomize_questions"
                  checked={formData.randomize_questions}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, randomize_questions: checked }))}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-accent/50">
                <div className="space-y-1">
                  <Label htmlFor="randomize_answers" className="text-sm font-medium">
                    ترتيب عشوائي للإجابات
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    تبديل ترتيب خيارات الإجابة
                  </p>
                </div>
                <Switch
                  id="randomize_answers"
                  checked={formData.randomize_answers}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, randomize_answers: checked }))}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-accent/50 md:col-span-2">
                <div className="space-y-1">
                  <Label htmlFor="show_results_immediately" className="text-sm font-medium">
                    إظهار النتائج فوراً
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    عرض النتيجة للطالب بمجرد انتهائه من الاختبار
                  </p>
                </div>
                <Switch
                  id="show_results_immediately"
                  checked={formData.show_results_immediately}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_results_immediately: checked }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="px-8"
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            disabled={!isFormValid}
            className="px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            <Save className="w-4 h-4 mr-2" />
            {template ? 'تحديث القالب' : 'حفظ القالب'}
          </Button>
        </div>
      </form>
    </TooltipProvider>
  );
};

export default ExamTemplateForm;