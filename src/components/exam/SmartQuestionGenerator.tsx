import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, AlertCircle, ExternalLink, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useGradeSections } from '@/hooks/useGradeSections';
import { useSectionTopics } from '@/hooks/useSectionTopics';
import { useSmartGenTopicLessons } from '@/hooks/useSmartGenTopicLessons';
import { DifficultyDistributionSelector } from './DifficultyDistributionSelector';
import { ContentSuitabilityBadge } from './ContentSuitabilityBadge';
import { GeneratedQuestionCard, GeneratedQuestion } from './GeneratedQuestionCard';
import { evaluateLessonContent } from '@/utils/contentEvaluator';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { findSimilarQuestion } from '@/utils/textSimilarity';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'setup' | 'preview';

export function SmartQuestionGenerator({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  
  // Step 1: Setup
  const [step, setStep] = useState<Step>('setup');
  const [gradeLevel, setGradeLevel] = useState<string | null>(null);
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(10);
  const [difficultyDistribution, setDifficultyDistribution] = useState({
    easy: 33,
    medium: 34,
    hard: 33
  });
  const [questionTypes, setQuestionTypes] = useState<string[]>(['multiple_choice', 'true_false']);
  
  // Step 2: Preview
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [approvedQuestions, setApprovedQuestions] = useState<Set<number>>(new Set());
  const [showOnlyNew, setShowOnlyNew] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Data loading
  const { data: sections = [] } = useGradeSections(gradeLevel);
  const { data: topics = [] } = useSectionTopics(gradeLevel, sectionId);
  const { data: lessons = [] } = useSmartGenTopicLessons(selectedTopicIds);
  
  const selectedSection = sections.find(s => s.id === sectionId);
  
  // فلترة الدروس لعرض المناسبة فقط
  const suitableLessons = lessons.filter(l => {
    if (!l.content) return false;
    const evaluation = evaluateLessonContent(l.content);
    return evaluation.isSuitable;
  });

  // Fetch existing questions to check for duplicates
  const { data: existingQuestions = [] } = useQuery({
    queryKey: ['existing-questions', gradeLevel, selectedSection?.title],
    queryFn: async () => {
      if (!gradeLevel || !selectedSection) return [];
      const { data } = await supabase
        .from('question_bank')
        .select('question_text')
        .eq('grade_level', gradeLevel)
        .eq('section_name', selectedSection.title)
        .eq('is_active', true);
      return data || [];
    },
    enabled: !!gradeLevel && !!selectedSection
  });
  
  // معالجة اختيار المواضيع
  const handleTopicChange = (values: string[]) => {
    if (values.includes('all') && !selectedTopicIds.includes('all')) {
      // اختار "كل المواضيع" - اختر جميعها
      setSelectedTopicIds(['all', ...topics.map(t => t.id)]);
    } else if (!values.includes('all') && selectedTopicIds.includes('all')) {
      // ألغى "كل المواضيع" - إلغاء الكل
      setSelectedTopicIds([]);
    } else {
      // اختيار عادي
      const withoutAll = values.filter(v => v !== 'all');
      const allSelected = withoutAll.length === topics.length;
      setSelectedTopicIds(allSelected ? ['all', ...withoutAll] : withoutAll);
    }
    setSelectedLessonIds([]); // إعادة تعيين الدروس
  };
  
  // معالجة اختيار الدروس
  const handleLessonChange = (values: string[]) => {
    if (values.includes('all') && !selectedLessonIds.includes('all')) {
      // اختار "كل الدروس" - اختر جميع المناسبة
      setSelectedLessonIds(['all', ...suitableLessons.map(l => l.id)]);
    } else if (!values.includes('all') && selectedLessonIds.includes('all')) {
      // ألغى "كل الدروس" - إلغاء الكل
      setSelectedLessonIds([]);
    } else {
      // اختيار عادي
      const withoutAll = values.filter(v => v !== 'all');
      const allSelected = withoutAll.length === suitableLessons.length;
      setSelectedLessonIds(allSelected ? ['all', ...withoutAll] : withoutAll);
    }
  };
  
  const canGenerate = gradeLevel && sectionId && selectedTopicIds.length > 0 && 
                      selectedLessonIds.length > 0 && questionTypes.length > 0;
  
  const handleGenerate = async () => {
    if (!canGenerate || !selectedSection) return;
    
    // جلب أسماء المواضيع المختارة
    const selectedTopicsNames = topics
      .filter(t => selectedTopicIds.includes(t.id))
      .map(t => t.title)
      .join(', ');
    
    // جلب الدروس المختارة الفعلية (بدون 'all')
    const actualLessonIds = selectedLessonIds.filter(id => id !== 'all');
    const selectedLessons = lessons.filter(l => actualLessonIds.includes(l.id));
    
    if (selectedLessons.length === 0) {
      toast.error('لم يتم العثور على دروس مختارة');
      return;
    }
    
    // جمع محتوى جميع الدروس المختارة
    const combinedContent = selectedLessons
      .map(l => `## ${l.title}\n\n${l.content || ''}`)
      .join('\n\n---\n\n');
    
    // حساب مجموع أطوال النصوص لجميع الدروس
    const totalTextLength = selectedLessons.reduce((sum, l) => {
      if (!l.content) return sum;
      const evaluation = evaluateLessonContent(l.content);
      return sum + evaluation.textLength;
    }, 0);
    
    // تقدير العدد الأقصى الموصى به (كل 200 حرف = سؤال واحد)
    const estimatedMaxQuestions = Math.floor(totalTextLength / 200);
    
    // تحذير إذا طلب عدد أكثر من الموصى به
    if (questionCount > estimatedMaxQuestions) {
      const confirmed = window.confirm(
        `المحتوى قد لا يكون كافياً لتوليد ${questionCount} سؤال بجودة عالية.\n` +
        `العدد الموصى به بناءً على الدروس المختارة: ${estimatedMaxQuestions} سؤال.\n\n` +
        `هل تريد المتابعة؟`
      );
      if (!confirmed) return;
    }
    
    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-smart-questions', {
        body: {
          gradeLevel: gradeLevel,
          sectionName: selectedSection.title,
          topicName: selectedTopicsNames,
          lessonId: actualLessonIds[0], // للتوافق مع الكود القديم
          lessonContent: combinedContent,
          questionCount: questionCount,
          difficultyDistribution: difficultyDistribution,
          questionTypes: questionTypes
        }
      });
      
      if (error) {
        // معالجة أخطاء Rate Limit و Payment
        if (error.message?.includes('rate_limit_exceeded')) {
          toast.error('تم تجاوز حد الطلبات', {
            description: 'يرجى الانتظار قليلاً والمحاولة مرة أخرى.',
            duration: 5000
          });
          return;
        }
        
        if (error.message?.includes('payment_required')) {
          toast.error('نفد رصيد Lovable AI', {
            description: 'يرجى إضافة رصيد من الإعدادات',
            duration: 8000,
            action: {
              label: 'إعدادات الاستخدام',
              onClick: () => window.open('https://lovable.dev/settings', '_blank')
            }
          });
          return;
        }
        
        throw error;
      }
      
      if (data?.error === 'rate_limit_exceeded') {
        toast.error('تم تجاوز حد الطلبات', {
          description: data.message || 'يرجى الانتظار قليلاً والمحاولة مرة أخرى.',
          duration: 5000
        });
        return;
      }
      
      if (data?.error === 'payment_required') {
        toast.error('نفد رصيد Lovable AI', {
          description: data.message || 'يرجى إضافة رصيد من الإعدادات',
          duration: 8000,
          action: {
            label: 'إعدادات الاستخدام',
            onClick: () => window.open(data.settingsUrl || 'https://lovable.dev/settings', '_blank')
          }
        });
        return;
      }
      
      if (!data?.questions || data.questions.length === 0) {
        toast.error('لم يتم توليد أسئلة', {
          description: 'يرجى المحاولة مرة أخرى'
        });
        return;
      }

      // Check for similarity with existing questions
      const questionsWithSimilarity = data.questions.map((q: GeneratedQuestion) => {
        const similarityCheck = findSimilarQuestion(q.question_text, existingQuestions);
        return {
          ...q,
          similarityWarning: similarityCheck
        };
      });
      
      setGeneratedQuestions(questionsWithSimilarity);
      setApprovedQuestions(new Set());
      setStep('preview');

      const similarCount = questionsWithSimilarity.filter((q: GeneratedQuestion) => q.similarityWarning?.found).length;
      
      if (similarCount > 0) {
        toast.success(`تم توليد ${data.questions.length} سؤال! ⚠️ ${similarCount} منها مشابه لأسئلة موجودة`);
      } else {
        toast.success(`تم توليد ${data.questions.length} سؤال بنجاح! 🎉`);
      }
      
    } catch (error) {
      console.error('Error generating questions:', error);
      toast.error('حدث خطأ أثناء توليد الأسئلة', {
        description: error instanceof Error ? error.message : 'خطأ غير معروف'
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleApproveAll = () => {
    const allIndices = new Set(generatedQuestions.map((_, idx) => idx));
    setApprovedQuestions(allIndices);
    toast.success(`تمت الموافقة على جميع الأسئلة (${generatedQuestions.length})`);
  };
  
  const handleApproveQuestion = (index: number) => {
    const newApproved = new Set(approvedQuestions);
    newApproved.add(index);
    setApprovedQuestions(newApproved);
  };
  
  const handleEditQuestion = (index: number, edited: GeneratedQuestion) => {
    const newQuestions = [...generatedQuestions];
    newQuestions[index] = edited;
    setGeneratedQuestions(newQuestions);
    toast.success('تم تحديث السؤال');
  };
  
  const handleDeleteQuestion = (index: number) => {
    const newQuestions = generatedQuestions.filter((_, idx) => idx !== index);
    setGeneratedQuestions(newQuestions);
    
    // تحديث الموافقات
    const newApproved = new Set<number>();
    approvedQuestions.forEach(approvedIdx => {
      if (approvedIdx < index) {
        newApproved.add(approvedIdx);
      } else if (approvedIdx > index) {
        newApproved.add(approvedIdx - 1);
      }
    });
    setApprovedQuestions(newApproved);
    
    toast.success('تم حذف السؤال');
  };
  
  const handleSaveApproved = async () => {
    const questionsToSave = generatedQuestions.filter((_, idx) => approvedQuestions.has(idx));
    
    if (questionsToSave.length === 0) {
      toast.error('يرجى الموافقة على سؤال واحد على الأقل');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // حفظ الأسئلة في question_bank
      const { error } = await supabase
        .from('question_bank')
        .insert(questionsToSave.map(q => ({
          question_text: q.question_text,
          question_type: q.question_type,
          difficulty: q.difficulty_level,
          choices: q.choices,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          section_name: q.section_name,
          topic_name: q.topic_name,
          grade_level: q.grade_level,
          points: 1,
          is_active: true
        })));
      
      if (error) throw error;
      
      // تحديث البيانات
      queryClient.invalidateQueries({ queryKey: ['exam-bank-questions'] });
      
      toast.success(`تم حفظ ${questionsToSave.length} سؤال في بنك الأسئلة! 🎉`);
      
      // إغلاق Dialog
      onOpenChange(false);
      
      // إعادة تعيين الحالة
      setTimeout(() => {
        setStep('setup');
        setGeneratedQuestions([]);
        setApprovedQuestions(new Set());
      }, 300);
      
    } catch (error) {
      console.error('Error saving questions:', error);
      toast.error('حدث خطأ أثناء حفظ الأسئلة', {
        description: error instanceof Error ? error.message : 'خطأ غير معروف'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleBack = () => {
    setStep('setup');
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-purple-600" />
            {step === 'setup' ? 'توليد أسئلة ذكية بالذكاء الاصطناعي' : 'مراجعة والموافقة على الأسئلة'}
          </DialogTitle>
        </DialogHeader>
        
        {step === 'setup' ? (
          <div className="space-y-6 py-4">
            {/* اختيار الصف */}
            <div>
              <Label>الصف الدراسي *</Label>
              <Select value={gradeLevel || ''} onValueChange={(v) => {
                setGradeLevel(v);
                setSectionId(null);
                setSelectedTopicIds([]);
                setSelectedLessonIds([]);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الصف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">الصف العاشر</SelectItem>
                  <SelectItem value="11">الصف الحادي عشر</SelectItem>
                  <SelectItem value="12">الصف الثاني عشر</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* اختيار القسم */}
            {gradeLevel && (
              <div>
                <Label>القسم *</Label>
                <Select value={sectionId || ''} onValueChange={(v) => {
                  setSectionId(v);
                  setSelectedTopicIds([]);
                  setSelectedLessonIds([]);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر القسم" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map(section => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* اختيار المواضيع */}
            {sectionId && (
              <div>
                <Label>المواضيع * (يمكن اختيار أكثر من موضوع)</Label>
                <MultiSelect
                  options={[
                    { value: 'all', label: '📋 كل المواضيع' },
                    ...topics.map(t => ({ value: t.id, label: t.title }))
                  ]}
                  value={selectedTopicIds}
                  onChange={handleTopicChange}
                  placeholder="اختر الموضوع أو المواضيع"
                  searchPlaceholder="بحث في المواضيع..."
                />
                {selectedTopicIds.length > 0 && !selectedTopicIds.includes('all') && (
                  <p className="text-xs text-muted-foreground mt-1">
                    تم اختيار {selectedTopicIds.length} من {topics.length} مواضيع
                  </p>
                )}
                {selectedTopicIds.includes('all') && (
                  <p className="text-xs text-muted-foreground mt-1">
                    تم اختيار كل المواضيع ({topics.length} مواضيع)
                  </p>
                )}
              </div>
            )}
            
            {/* اختيار الدروس */}
            {selectedTopicIds.length > 0 && (
              <div>
                <Label>الدروس * (يمكن اختيار أكثر من درس - فقط الدروس المناسبة)</Label>
                <MultiSelect
                  options={[
                    { value: 'all', label: '📚 كل الدروس المناسبة' },
                    ...suitableLessons.map(l => ({ value: l.id, label: l.title }))
                  ]}
                  value={selectedLessonIds}
                  onChange={handleLessonChange}
                  placeholder="اختر الدرس أو الدروس"
                  searchPlaceholder="بحث في الدروس..."
                />
                {selectedLessonIds.length > 0 && !selectedLessonIds.includes('all') && (
                  <p className="text-xs text-muted-foreground mt-1">
                    تم اختيار {selectedLessonIds.length} من {suitableLessons.length} دروس مناسبة
                  </p>
                )}
                {selectedLessonIds.includes('all') && (
                  <p className="text-xs text-muted-foreground mt-1">
                    تم اختيار كل الدروس المناسبة ({suitableLessons.length} دروس)
                  </p>
                )}
                {lessons.length > suitableLessons.length && (
                  <p className="text-xs text-orange-600 mt-1">
                    ⚠️ تم إخفاء {lessons.length - suitableLessons.length} درس غير مناسب لتوليد الأسئلة
                  </p>
                )}
              </div>
            )}
            
            {/* عدد الأسئلة */}
            <div>
              <Label htmlFor="question-count">عدد الأسئلة المطلوبة *</Label>
              <Input
                id="question-count"
                type="number"
                min={1}
                max={50}
                value={questionCount}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value >= 1 && value <= 50) {
                    setQuestionCount(value);
                  }
                }}
                placeholder="أدخل عدد الأسئلة (1-50)"
                className="text-center"
              />
              <p className="text-xs text-muted-foreground mt-1">
                يمكن كتابة عدد من 1 إلى 50 سؤال
              </p>
            </div>

            {/* توزيع الصعوبة */}
            <DifficultyDistributionSelector
              totalQuestions={questionCount}
              value={difficultyDistribution}
              onChange={setDifficultyDistribution}
            />
            
            {/* أنواع الأسئلة */}
            <div>
              <Label className="mb-3 block">أنواع الأسئلة *</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="multiple_choice"
                    checked={questionTypes.includes('multiple_choice')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setQuestionTypes([...questionTypes, 'multiple_choice']);
                      } else {
                        setQuestionTypes(questionTypes.filter(t => t !== 'multiple_choice'));
                      }
                    }}
                  />
                  <Label htmlFor="multiple_choice" className="cursor-pointer">
                    اختيار من متعدد
                  </Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="true_false"
                    checked={questionTypes.includes('true_false')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setQuestionTypes([...questionTypes, 'true_false']);
                      } else {
                        setQuestionTypes(questionTypes.filter(t => t !== 'true_false'));
                      }
                    }}
                  />
                  <Label htmlFor="true_false" className="cursor-pointer">
                    صح/خطأ
                  </Label>
                </div>
              </div>
              
              {questionTypes.length === 0 && (
                <p className="text-sm text-orange-600 mt-2">يرجى اختيار نوع واحد على الأقل</p>
              )}
            </div>
            
            {/* تحذيرات */}
            {selectedLessonIds.length === 0 && selectedTopicIds.length > 0 && suitableLessons.length === 0 && (
              <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-orange-900">لا توجد دروس مناسبة في المواضيع المختارة</p>
                  <p className="text-xs text-orange-700">• يرجى اختيار مواضيع تحتوي على دروس بمحتوى نصي كافٍ</p>
                </div>
              </div>
            )}
            
            {/* أزرار */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                إلغاء
              </Button>
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={!canGenerate || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري التوليد...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 ml-2" />
                    توليد الأسئلة
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  تم توليد {generatedQuestions.length} سؤال
                </p>
                {generatedQuestions.filter(q => q.similarityWarning?.found).length > 0 && (
                  <Badge variant="secondary">
                    {generatedQuestions.filter(q => q.similarityWarning?.found).length} سؤال مشابه
                  </Badge>
                )}
              </div>
              
              <div className="flex gap-2">
                {generatedQuestions.some(q => q.similarityWarning?.found) && (
                  <Button
                    type="button"
                    size="sm"
                    variant={showOnlyNew ? "default" : "outline"}
                    onClick={() => setShowOnlyNew(!showOnlyNew)}
                  >
                    <Filter className="w-4 h-4 mr-1" />
                    {showOnlyNew ? 'عرض الكل' : 'إخفاء المشابهة'}
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleApproveAll}
                  disabled={approvedQuestions.size === generatedQuestions.length}
                >
                  الموافقة على الكل
                </Button>
              </div>
            </div>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {generatedQuestions
                .filter(q => !showOnlyNew || !q.similarityWarning?.found)
                .map((question, idx) => (
                  <GeneratedQuestionCard
                    key={idx}
                    question={question}
                    index={idx}
                    onEdit={(edited) => handleEditQuestion(idx, edited)}
                    onDelete={() => handleDeleteQuestion(idx)}
                    onApprove={() => handleApproveQuestion(idx)}
                    isApproved={approvedQuestions.has(idx)}
                  />
                ))}
            </div>
            
            <div className="flex justify-between gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
              >
                رجوع
              </Button>
              
              <Button
                type="button"
                onClick={handleSaveApproved}
                disabled={approvedQuestions.size === 0 || isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  `حفظ الأسئلة الموافق عليها (${approvedQuestions.size})`
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
