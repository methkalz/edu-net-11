import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useGradeSections } from '@/hooks/useGradeSections';
import { useSectionTopics } from '@/hooks/useSectionTopics';
import { useSmartGenTopicLessons } from '@/hooks/useSmartGenTopicLessons';
import { DifficultyDistributionSelector } from './DifficultyDistributionSelector';
import { ContentSuitabilityBadge } from './ContentSuitabilityBadge';
import { GeneratedQuestionCard, GeneratedQuestion } from './GeneratedQuestionCard';
import { evaluateLessonContent } from '@/utils/contentEvaluator';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

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
  const [topicId, setTopicId] = useState<string | null>(null);
  const [lessonId, setLessonId] = useState<string | null>(null);
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
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Data loading
  const { data: sections = [] } = useGradeSections(gradeLevel);
  const { data: topics = [] } = useSectionTopics(gradeLevel, sectionId);
  const { data: lessons = [] } = useSmartGenTopicLessons(topicId);
  
  const selectedSection = sections.find(s => s.id === sectionId);
  const selectedTopic = topics.find(t => t.id === topicId);
  const selectedLesson = lessons.find(l => l.id === lessonId);
  
  // تقييم المحتوى
  const contentEvaluation = selectedLesson?.content 
    ? evaluateLessonContent(selectedLesson.content)
    : null;
  
  const canGenerate = gradeLevel && sectionId && topicId && lessonId && 
                      questionTypes.length > 0 && 
                      contentEvaluation?.isSuitable;
  
  const handleGenerate = async () => {
    if (!canGenerate || !selectedLesson || !selectedSection || !selectedTopic) return;
    
    // تحذير إذا طلب عدد أكثر من الموصى به
    if (contentEvaluation && questionCount > contentEvaluation.maxRecommendedQuestions) {
      const confirmed = window.confirm(
        `المحتوى قد لا يكون كافياً لتوليد ${questionCount} سؤال بجودة عالية.\n` +
        `العدد الموصى به: ${contentEvaluation.maxRecommendedQuestions} سؤال.\n\n` +
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
          topicName: selectedTopic.title,
          lessonId: lessonId,
          lessonContent: selectedLesson.content,
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
      
      setGeneratedQuestions(data.questions);
      setApprovedQuestions(new Set());
      setStep('preview');
      
      toast.success(`تم توليد ${data.questions.length} سؤال بنجاح! 🎉`);
      
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
                setTopicId(null);
                setLessonId(null);
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
                  setTopicId(null);
                  setLessonId(null);
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
            
            {/* اختيار الموضوع */}
            {sectionId && (
              <div>
                <Label>الموضوع *</Label>
                <Select value={topicId || ''} onValueChange={(v) => {
                  setTopicId(v);
                  setLessonId(null);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الموضوع" />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map(topic => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* اختيار الدرس */}
            {topicId && (
              <div>
                <Label>الدرس *</Label>
                <Select value={lessonId || ''} onValueChange={setLessonId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الدرس" />
                  </SelectTrigger>
                  <SelectContent>
                    {lessons.map(lesson => (
                      <SelectItem key={lesson.id} value={lesson.id}>
                        <div className="flex items-center justify-between w-full gap-2">
                          <span>{lesson.title}</span>
                          {lesson.content && (
                            <ContentSuitabilityBadge content={lesson.content} />
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {lessonId && selectedLesson?.content && (
                  <div className="mt-2">
                    <ContentSuitabilityBadge content={selectedLesson.content} />
                  </div>
                )}
              </div>
            )}
            
            {/* عدد الأسئلة */}
            <div>
              <Label>عدد الأسئلة المطلوبة *</Label>
              <Select value={questionCount.toString()} onValueChange={(v) => setQuestionCount(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                    <SelectItem key={n} value={n.toString()}>
                      {n} {n === 1 ? 'سؤال' : 'أسئلة'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            
            {/* تحذيرات المحتوى */}
            {contentEvaluation && !contentEvaluation.isSuitable && (
              <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-orange-900">المحتوى غير كافٍ لتوليد أسئلة عالية الجودة</p>
                  {contentEvaluation.warnings.map((warning, idx) => (
                    <p key={idx} className="text-xs text-orange-700">• {warning}</p>
                  ))}
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
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                تم توليد {generatedQuestions.length} سؤال • 
                تمت الموافقة على {approvedQuestions.size} سؤال
              </p>
              
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
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {generatedQuestions.map((question, idx) => (
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
