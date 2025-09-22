import React, { useState, useEffect } from 'react';
import { Plus, Minus, Save, X, Loader2, ChevronDown, HelpCircle, Target, Star, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useExamSystem } from '@/hooks/useExamSystem';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface QuestionFormProps {
  question?: any;
  onClose: () => void;
  onSave: () => void;
}

const QuestionForm: React.FC<QuestionFormProps> = ({
  question,
  onClose,
  onSave
}) => {
  const { addQuestion, updateQuestion } = useExamSystem();
  
  const [formData, setFormData] = useState({
    question_text: '',
    question_type: 'multiple_choice' as 'multiple_choice' | 'true_false' | 'short_answer',
    choices: ['', ''],
    correct_answer: '',
    difficulty_level: 'medium' as 'easy' | 'medium' | 'hard',
    points: 1,
    section_id: '',
    is_active: true
  });

  const [sections, setSections] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    fetchSections();
    if (question) {
      setFormData({
        question_text: question.question_text || '',
        question_type: question.question_type || 'multiple_choice',
        choices: question.choices || ['', ''],
        correct_answer: question.correct_answer || '',
        difficulty_level: question.difficulty_level || 'medium',
        points: question.points || 1,
        section_id: question.section_id || '',
        is_active: question.is_active ?? true
      });
      if (question.section_id) {
        setShowAdvanced(true);
      }
    }
  }, [question]);

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from('grade11_sections')
        .select('id, title')
        .order('order_index');
      
      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      logger.error('Error fetching sections', error as Error);
    }
  };

  const handleSectionChange = (sectionId: string) => {
    setFormData(prev => ({
      ...prev,
      section_id: sectionId
    }));
  };

  const addChoice = () => {
    setFormData(prev => ({
      ...prev,
      choices: [...prev.choices, '']
    }));
  };

  const removeChoice = (index: number) => {
    if (formData.choices.length > 2) {
      const newChoices = formData.choices.filter((_, i) => i !== index);
      // Reset correct answer if it was the removed choice
      const newCorrectAnswer = formData.correct_answer === formData.choices[index] ? '' : formData.correct_answer;
      setFormData(prev => ({ 
        ...prev, 
        choices: newChoices,
        correct_answer: newCorrectAnswer
      }));
    }
  };

  const validateForm = () => {
    // Basic validations
    if (!formData.question_text.trim()) {
      toast({
        title: "خطأ في التحقق",
        description: "يرجى إدخال نص السؤال",
        variant: "destructive"
      });
      return false;
    }

    // Multiple choice specific validations
    if (formData.question_type === 'multiple_choice') {
      const validChoices = formData.choices.filter(choice => choice.trim());
      
      if (validChoices.length < 2) {
        toast({
          title: "خطأ في التحقق",
          description: "يجب إدخال خيارين على الأقل للأسئلة متعددة الاختيارات",
          variant: "destructive"
        });
        return false;
      }

      if (!formData.correct_answer || !validChoices.includes(formData.correct_answer)) {
        toast({
          title: "خطأ في التحقق",
          description: "يرجى اختيار الإجابة الصحيحة من الخيارات المتاحة",
          variant: "destructive"
        });
        return false;
      }

      // Check for duplicate choices
      const uniqueChoices = [...new Set(validChoices)];
      if (uniqueChoices.length !== validChoices.length) {
        toast({
          title: "خطأ في التحقق",
          description: "لا يمكن أن تكون هناك خيارات مكررة",
          variant: "destructive"
        });
        return false;
      }
    }

    // True/False specific validation
    if (formData.question_type === 'true_false' && !formData.correct_answer) {
      toast({
        title: "خطأ في التحقق",
        description: "يرجى اختيار الإجابة الصحيحة (صح أو خطأ)",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const prepareDataForSubmission = () => {
    const dataToSubmit = {
      ...formData,
      // Convert empty strings to null for foreign keys
      section_id: formData.section_id || null,
      topic_id: null,
      lesson_id: null,
    };

    // Clean up choices for multiple choice questions
    if (formData.question_type === 'multiple_choice') {
      dataToSubmit.choices = formData.choices.filter(choice => choice.trim());
    } else {
      dataToSubmit.choices = null;
    }

    return dataToSubmit;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const dataToSubmit = prepareDataForSubmission();
      
      if (question) {
        await updateQuestion(question.id, dataToSubmit);
      } else {
        await addQuestion(dataToSubmit);
      }
      onSave();
    } catch (error) {
      logger.error('Error saving question', error as Error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ السؤال. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Question Content Card */}
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <HelpCircle className="h-5 w-5 text-primary" />
              محتوى السؤال
            </CardTitle>
            <CardDescription>
              أدخل نص السؤال وحدد نوعه
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question_text" className="text-base font-medium flex items-center gap-2">
                <span>نص السؤال</span>
                <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="question_text"
                value={formData.question_text}
                onChange={(e) => setFormData(prev => ({ ...prev, question_text: e.target.value }))}
                placeholder="اكتب السؤال هنا بوضوح..."
                className="min-h-[80px] text-base resize-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="question_type" className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  نوع السؤال
                </Label>
                <Select value={formData.question_type} onValueChange={(value) => {
                  setFormData(prev => ({ 
                    ...prev, 
                    question_type: value as any,
                    choices: value === 'multiple_choice' ? ['', ''] : [],
                    correct_answer: ''
                  }));
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">اختيار متعدد</SelectItem>
                    <SelectItem value="true_false">صح/خطأ</SelectItem>
                    <SelectItem value="short_answer">إجابة قصيرة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty_level" className="text-sm font-medium flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  مستوى الصعوبة
                </Label>
                <Select value={formData.difficulty_level} onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty_level: value as any }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        سهل
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        متوسط
                      </div>
                    </SelectItem>
                    <SelectItem value="hard">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        صعب
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="points" className="text-sm font-medium flex items-center gap-2">
                  <Hash className="h-4 w-4 text-green-500" />
                  النقاط
                </Label>
                <Input
                  id="points"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.points}
                  onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Choices (for multiple choice) */}
        {formData.question_type === 'multiple_choice' && (
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-bold">A</span>
                </div>
                خيارات الإجابة
              </CardTitle>
              <CardDescription>
                أضف الخيارات المتاحة واختر الإجابة الصحيحة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup 
                value={formData.correct_answer} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, correct_answer: value }))}
                className="space-y-3"
              >
                {formData.choices.map((choice, index) => {
                  const isCorrect = choice === formData.correct_answer && choice.trim();
                  const choiceLabels = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];
                  
                  return (
                    <div 
                      key={index} 
                      className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-all duration-200 ${
                        isCorrect 
                          ? 'border-green-300 bg-green-50 shadow-md' 
                          : 'border-border hover:border-primary/30 hover:bg-accent/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                          isCorrect 
                            ? 'border-green-500 bg-green-500 text-white' 
                            : 'border-gray-300 bg-background text-gray-600'
                        }`}>
                          {choiceLabels[index] || index + 1}
                        </div>
                        <RadioGroupItem 
                          value={choice} 
                          id={`choice-${index}`}
                          disabled={!choice.trim()}
                          className="flex-shrink-0"
                        />
                      </div>
                      
                      <Input
                        value={choice}
                        onChange={(e) => {
                          const newChoices = [...formData.choices];
                          newChoices[index] = e.target.value;
                          setFormData(prev => ({ ...prev, choices: newChoices }));
                        }}
                        placeholder={`الخيار ${choiceLabels[index] || (index + 1)}`}
                        className={`flex-1 border-none bg-transparent focus:bg-background ${
                          isCorrect ? 'font-medium' : ''
                        }`}
                      />
                      
                      {formData.choices.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeChoice(index)}
                          className="flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </RadioGroup>
              
              {formData.choices.length < 6 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={addChoice}
                  className="w-full border-dashed border-2 hover:border-primary/50 hover:bg-primary/5"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة خيار جديد
                </Button>
              )}
              
              {formData.correct_answer && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 font-medium">
                    ✓ الإجابة الصحيحة: {formData.correct_answer}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* True/False Answer */}
        {formData.question_type === 'true_false' && (
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                  <span className="text-amber-600 text-sm">✓</span>
                </div>
                الإجابة الصحيحة
              </CardTitle>
              <CardDescription>
                حدد ما إذا كانت الإجابة صحيحة أم خاطئة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={formData.correct_answer} onValueChange={(value) => setFormData(prev => ({ ...prev, correct_answer: value }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر الإجابة الصحيحة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="صح">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      صح
                    </div>
                  </SelectItem>
                  <SelectItem value="خطأ">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      خطأ
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Short Answer Notice */}
        {formData.question_type === 'short_answer' && (
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-purple-600 text-xs">✍</span>
                </div>
                <p>
                  أسئلة الإجابة القصيرة سيتم تقييمها يدوياً من قبل المدرس
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Advanced Options (Collapsible) */}
        <Card>
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 text-xs">📚</span>
                    </div>
                    ربط بقسم تعليمي (اختياري)
                  </CardTitle>
                  <ChevronDown className={`h-4 w-4 transition-transform text-muted-foreground ${showAdvanced ? 'rotate-180' : ''}`} />
                </div>
                <CardDescription>
                  يمكنك ربط السؤال بقسم تعليمي محدد لتنظيم أفضل
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      💡 <strong>نصيحة:</strong> ربط السؤال بقسم يساعد في تنظيم الأسئلة وتسهيل البحث لاحقاً
                    </p>
                  </div>
                  
                  <Select value={formData.section_id} onValueChange={(value) => handleSectionChange(value === 'none' ? '' : value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="اختر القسم المناسب" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                          أسئلة عامة (بدون قسم)
                        </div>
                      </SelectItem>
                      {sections.map(section => (
                        <SelectItem key={section.id} value={section.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-primary"></div>
                            {section.title}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Form Actions */}
        <Card className="bg-gradient-to-r from-background to-accent/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Button 
                type="submit" 
                className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md"
                disabled={isSubmitting}
                size="lg"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {question ? 'تحديث السؤال' : 'حفظ السؤال'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
                size="lg"
                className="border-2"
              >
                <X className="h-4 w-4 mr-2" />
                إلغاء
              </Button>
            </div>
            
            {isSubmitting && (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>جاري حفظ السؤال...</span>
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default QuestionForm;