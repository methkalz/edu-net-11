import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DOMPurify from 'dompurify';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Eye, 
  EyeOff, 
  Save, 
  X, 
  CheckCircle,
  Clock,
  Award,
  Layers,
  HelpCircle,
  Table,
  Pencil,
  BookOpen
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import BagrutImageUpload from './BagrutImageUpload';
import BagrutQuestionEditDialog from './BagrutQuestionEditDialog';
import RichTextEditor from '@/components/content/RichTextEditor';
import SafeHtml from './SafeHtml';

import type { ParsedQuestion, ParsedSection, ParsedExam, Statistics } from '@/lib/bagrut/buildBagrutPreview';

// Re-export types for component internal use
export type { ParsedQuestion, ParsedSection, ParsedExam, Statistics };

interface BagrutExamPreviewProps {
  exam: ParsedExam;
  statistics: Statistics;
  onSave?: () => void;
  onCancel: () => void;
  onExamUpdate?: (updatedExam: ParsedExam) => void;
  onSaveEdits?: (updatedExam: ParsedExam) => Promise<void>;
  onInstructionsUpdate?: (instructions: string) => Promise<void>;
  isSaving?: boolean;
  showSaveButton?: boolean;
}

const questionTypeLabels: Record<string, string> = {
  multiple_choice: 'اختيار من متعدد',
  true_false: 'صح/خطأ',
  true_false_multi: 'صح/خطأ متعدد',
  fill_blank: 'إكمال الفراغ',
  fill_table: 'إكمال جدول',
  matching: 'مطابقة',
  ordering: 'ترتيب',
  calculation: 'حسابي',
  diagram_based: 'رسم/مخطط',
  cli_command: 'أوامر CLI',
  open_ended: 'مفتوح',
  multi_part: 'متعدد البنود'
};

// Convert English question number back to Arabic for display
const englishToArabicNumber = (questionNumber: string): string => {
  const map: Record<string, string> = {
    'a': 'أ', 'b': 'ب', 'c': 'ج', 'd': 'د', 'e': 'هـ',
    'f': 'و', 'g': 'ز', 'h': 'ح', 'i': 'ط', 'j': 'ي',
    'k': 'ك', 'l': 'ل', 'm': 'م', 'n': 'ن'
  };
  
  // Convert only single letters after hyphen (e.g., 23-i → 23-ط)
  return questionNumber.replace(/-([a-n])$/i, (match, letter) => {
    return '-' + (map[letter.toLowerCase()] || letter);
  });
};

const seasonLabels: Record<string, string> = {
  summer: 'صيف',
  winter: 'شتاء',
  spring: 'ربيع'
};

const normalizeComparable = (value?: string) => (value || '').trim().toLowerCase();

const isCorrectChoice = (
  question: ParsedQuestion,
  choice: { id: string; text: string; is_correct?: boolean }
) => {
  if (choice?.is_correct) return true;

  const correct = normalizeComparable(question.correct_answer);
  if (!correct) return false;

  return (
    normalizeComparable(choice.id) === correct ||
    normalizeComparable(choice.text) === correct
  );
};

const BagrutExamPreview: React.FC<BagrutExamPreviewProps> = ({
  exam,
  statistics,
  onSave,
  onCancel,
  onExamUpdate,
  onSaveEdits,
  onInstructionsUpdate,
  isSaving = false,
  showSaveButton = true
}) => {
  const [showAnswers, setShowAnswers] = useState(false);
  const [activeSection, setActiveSection] = useState('0');
  const [localExam, setLocalExam] = useState(exam);
  const [editMode, setEditMode] = useState(false);
  const [hasEdits, setHasEdits] = useState(false);
  const [instructionsDialogOpen, setInstructionsDialogOpen] = useState(false);
  const [editingInstructions, setEditingInstructions] = useState(exam.instructions || '');
  const [isSavingInstructions, setIsSavingInstructions] = useState(false);
  const [infoExpanded, setInfoExpanded] = useState(true);

  // مزامنة localExam مع exam prop عندما يتغير (بعد الحفظ أو إعادة الجلب من DB)
  // هذا يضمن بقاء ترتيب الأسئلة كما في قاعدة البيانات
  useEffect(() => {
    setLocalExam(exam);
    // لا نعيد تعيين hasEdits هنا لتجنب race condition
    // يتم تعيينها false فقط بعد الحفظ الناجح في handleSaveEditsClick
  }, [exam]);
  const [isSavingEdits, setIsSavingEdits] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ParsedQuestion | null>(null);
  const [editingContext, setEditingContext] = useState<{ sectionIndex: number } | null>(null);

  // التحقق من نوع التعليمات (HTML أو نص عادي)
  const isHtmlInstructions = useMemo(() => {
    if (!localExam.instructions) return false;
    return /<[a-z][\s\S]*>/i.test(localExam.instructions);
  }, [localExam.instructions]);

  // تنظيف HTML للعرض الآمن
  const sanitizedInstructions = useMemo(() => {
    if (!localExam.instructions) return '';
    if (isHtmlInstructions) {
      return DOMPurify.sanitize(localExam.instructions);
    }
    return localExam.instructions;
  }, [localExam.instructions, isHtmlInstructions]);

  // حفظ الإرشادات
  const handleSaveInstructions = async () => {
    if (!onInstructionsUpdate) return;
    setIsSavingInstructions(true);
    try {
      await onInstructionsUpdate(editingInstructions);
      setLocalExam(prev => ({ ...prev, instructions: editingInstructions }));
      setInstructionsDialogOpen(false);
    } finally {
      setIsSavingInstructions(false);
    }
  };

  // Recursively update a question's image in the questions tree
  const updateImageInQuestions = useCallback((questions: ParsedQuestion[], questionNumber: string, imageUrl: string): ParsedQuestion[] => {
    return questions.map(q => {
      if (q.question_number === questionNumber) {
        return { ...q, image_url: imageUrl, has_image: true };
      }
      if (q.sub_questions && q.sub_questions.length > 0) {
        return { ...q, sub_questions: updateImageInQuestions(q.sub_questions, questionNumber, imageUrl) };
      }
      return q;
    });
  }, []);

  // Find question_db_id recursively
  const findQuestionDbId = useCallback((questions: ParsedQuestion[], questionNumber: string): string | undefined => {
    for (const q of questions) {
      if (q.question_number === questionNumber) return q.question_db_id;
      if (q.sub_questions?.length) {
        const found = findQuestionDbId(q.sub_questions, questionNumber);
        if (found) return found;
      }
    }
    return undefined;
  }, []);

  // Handle image upload for a question - updates state AND saves directly to DB
  const handleImageUploaded = useCallback(async (sectionIndex: number, questionNumber: string, imageUrl: string) => {
    // 1. Update local state recursively
    setLocalExam(prev => {
      const updated = { ...prev };
      updated.sections = prev.sections.map((section, sIdx) => {
        if (sIdx !== sectionIndex) return section;
        return {
          ...section,
          questions: updateImageInQuestions(section.questions, questionNumber, imageUrl)
        };
      });
      onExamUpdate?.(updated);
      return updated;
    });
    setHasEdits(true);

    // 2. Save directly to DB so it persists even without clicking "save"
    const section = localExam.sections[sectionIndex];
    if (section) {
      const dbId = findQuestionDbId(section.questions, questionNumber);
      if (dbId) {
        const { error } = await supabase
          .from('bagrut_questions')
          .update({ image_url: imageUrl, has_image: true, updated_at: new Date().toISOString() })
          .eq('id', dbId);
        if (error) {
          console.error('Failed to save image URL to DB:', error);
        }
      }
    }
  }, [onExamUpdate, updateImageInQuestions, findQuestionDbId, localExam.sections]);

  // Update a question in the exam (supports sub_questions recursively)
  const updateQuestionInSection = useCallback((
    questions: ParsedQuestion[],
    questionNumber: string,
    updater: (q: ParsedQuestion) => ParsedQuestion
  ): ParsedQuestion[] => {
    return questions.map(q => {
      if (q.question_number === questionNumber) {
        return updater(q);
      }
      if (q.sub_questions && q.sub_questions.length > 0) {
        return {
          ...q,
          sub_questions: updateQuestionInSection(q.sub_questions, questionNumber, updater)
        };
      }
      return q;
    });
  }, []);

  const handleQuestionEdit = useCallback((question: ParsedQuestion, sectionIndex: number) => {
    setEditingQuestion(question);
    setEditingContext({ sectionIndex });
  }, []);

  const handleQuestionUpdate = useCallback((updatedQuestion: ParsedQuestion) => {
    if (!editingContext || !editingQuestion) return;

    // استخدام الرقم القديم للبحث (قبل التعديل) لأن السؤال في المصفوفة لا يزال يحمل الرقم القديم
    const originalQuestionNumber = editingQuestion.question_number;

    setLocalExam(prev => {
      const updated = { ...prev };
      updated.sections = prev.sections.map((section, sIdx) => {
        if (sIdx !== editingContext.sectionIndex) return section;
        return {
          ...section,
          questions: updateQuestionInSection(
            section.questions,
            originalQuestionNumber,
            () => updatedQuestion
          )
        };
      });
      onExamUpdate?.(updated);
      return updated;
    });

    setHasEdits(true);
    setEditingQuestion(null);
    setEditingContext(null);
  }, [editingContext, editingQuestion, updateQuestionInSection, onExamUpdate]);

  const handleSaveEditsClick = async () => {
    if (!onSaveEdits) return;
    setIsSavingEdits(true);
    try {
      await onSaveEdits(localExam);
      setHasEdits(false);
    } finally {
      setIsSavingEdits(false);
    }
  };

  // Check if this is a DB-loaded exam
  const isDbExam = !!exam.exam_db_id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Collapsible open={infoExpanded} onOpenChange={setInfoExpanded}>
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${infoExpanded ? '' : '-rotate-90'}`} />
                  </Button>
                </CollapsibleTrigger>
                <div>
                  <CardTitle className="text-2xl">{exam.title}</CardTitle>
                  <p className="text-muted-foreground mt-1">
                    {exam.subject} - {seasonLabels[exam.exam_season] || exam.exam_season} {exam.exam_year}
                    {exam.exam_code && ` (${exam.exam_code})`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {/* Edit Mode Toggle */}
                <div className="flex items-center gap-2">
                  <Switch
                    id="edit-mode"
                    checked={editMode}
                    onCheckedChange={setEditMode}
                  />
                  <Label htmlFor="edit-mode" className="flex items-center gap-1">
                    <Pencil className="h-4 w-4" />
                    وضع التعديل
                  </Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    id="show-answers"
                    checked={showAnswers}
                    onCheckedChange={setShowAnswers}
                  />
                  <Label htmlFor="show-answers" className="flex items-center gap-1">
                    {showAnswers ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    {showAnswers ? 'إخفاء الإجابات' : 'إظهار الإجابات'}
                  </Label>
                </div>
              </div>
            </div>
          </CardHeader>
          <CollapsibleContent>
          <CardContent>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">المدة</p>
                <p className="font-semibold">{exam.duration_minutes} دقيقة</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Award className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">مجموع العلامات</p>
                <p className="font-semibold">{statistics.totalPoints} علامة</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Layers className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">الأقسام</p>
                <p className="font-semibold">{statistics.totalSections} قسم</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <HelpCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">الأسئلة</p>
                <p className="font-semibold">{statistics.totalQuestions} سؤال</p>
              </div>
            </div>
          </div>

          {/* Question Types */}
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(statistics.questionsByType).map(([type, count]) => (
              <Badge key={type} variant="secondary">
                {questionTypeLabels[type] || type}: {count}
              </Badge>
            ))}
          </div>

          {/* تعليمات الامتحان */}
          {localExam.instructions && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm relative group">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  تعليمات الامتحان:
                </p>
                {onInstructionsUpdate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      setEditingInstructions(localExam.instructions || '');
                      setInstructionsDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-3 w-3 ml-1" />
                    تعديل
                  </Button>
                )}
              </div>
              {isHtmlInstructions ? (
                <div 
                  className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: sanitizedInstructions }}
                />
              ) : (
                <p className="text-muted-foreground whitespace-pre-wrap">{localExam.instructions}</p>
              )}
            </div>
          )}
          
          {/* زر إضافة تعليمات إذا لم تكن موجودة */}
          {!localExam.instructions && onInstructionsUpdate && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setEditingInstructions('');
                setInstructionsDialogOpen(true);
              }}
            >
              <BookOpen className="h-4 w-4 ml-1" />
              إضافة تعليمات الامتحان
            </Button>
          )}
        </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Sections */}
      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList className="w-full justify-start sticky top-0 z-10 bg-background">
          {localExam.sections.map((section, index) => (
            <TabsTrigger key={index} value={String(index)}>
              {section.section_title}
              {section.section_type === 'elective' && (
                <Badge variant="outline" className="mr-2 text-xs">اختياري</Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {localExam.sections.map((section, sectionIndex) => (
          <TabsContent key={sectionIndex} value={String(sectionIndex)}>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{section.section_title}</CardTitle>
                    {section.specialization_label && (
                      <p className="text-sm text-muted-foreground">
                        التخصص: {section.specialization_label}
                      </p>
                    )}
                  </div>
                  <Badge>{section.total_points} علامة</Badge>
                </div>
                {section.instructions && (
                  <p className="text-sm text-muted-foreground mt-2">{section.instructions}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {section.questions.map((question, qIndex) => (
                    <QuestionCard 
                      key={qIndex} 
                      question={question} 
                      showAnswers={showAnswers}
                      sectionIndex={sectionIndex}
                      onImageUploaded={handleImageUploaded}
                      editMode={editMode}
                      onEdit={(q) => handleQuestionEdit(q, sectionIndex)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        {/* Save Edits Button - only for DB exams with edits */}
        {isDbExam && hasEdits && onSaveEdits && (
          <Button 
            onClick={handleSaveEditsClick} 
            disabled={isSavingEdits}
            variant="default"
            className="gap-2"
          >
            {isSavingEdits ? (
              <>جاري حفظ التعديلات...</>
            ) : (
              <>
                <Save className="h-4 w-4" />
                حفظ التعديلات
              </>
            )}
          </Button>
        )}
        
        {showSaveButton && (
          <Button onClick={onSave} disabled={isSaving || !onSave} className="gap-2">
            {isSaving ? (
              <>جاري الحفظ...</>
            ) : (
              <>
                <Save className="h-4 w-4" />
                حفظ الامتحان
              </>
            )}
          </Button>
        )}
        <Button variant="outline" onClick={onCancel} disabled={isSaving || isSavingEdits}>
          <X className="h-4 w-4 ml-2" />
          {isDbExam ? 'إغلاق' : 'إلغاء'}
        </Button>
      </div>

      {/* Edit Dialog */}
      {editingQuestion && (
        <BagrutQuestionEditDialog
          open={!!editingQuestion}
          onOpenChange={(open) => {
            if (!open) {
              setEditingQuestion(null);
              setEditingContext(null);
            }
          }}
          question={editingQuestion}
          questionTypeLabel={questionTypeLabels[editingQuestion.question_type] || editingQuestion.question_type}
          onSubmit={handleQuestionUpdate}
        />
      )}

      {/* Instructions Edit Dialog */}
      <Dialog open={instructionsDialogOpen} onOpenChange={setInstructionsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              تعديل إرشادات الامتحان
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <RichTextEditor
              content={editingInstructions}
              onChange={setEditingInstructions}
              placeholder="أدخل تعليمات الامتحان هنا..."
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setInstructionsDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveInstructions} disabled={isSavingInstructions}>
              {isSavingInstructions ? 'جاري الحفظ...' : 'حفظ الإرشادات'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper function to check if a cell should be an input field
const isInputCell = (cellValue: string, columnIndex?: number, inputColumns?: number[]) => {
  // If input_columns is specified and this column is in the list
  if (inputColumns && typeof columnIndex === 'number' && inputColumns.includes(columnIndex)) {
    return true;
  }
  
  // Traditional indicators
  const inputIndicators = ['?', '؟', '', '_', '___', '...', '....', '---', '____'];
  const trimmedValue = cellValue?.trim() || '';
  
  if (inputIndicators.includes(trimmedValue)) {
    return true;
  }
  
  // If the cell contains only question marks, dots, underscores, or dashes
  if (/^[\?\؟\.\_\-\s]+$/.test(trimmedValue)) {
    return true;
  }
  
  return false;
};

// Helper function to render fill_blank text with input fields
// Supports both new format [فراغ:X] and old format ____X____ and general blanks
const renderFillBlankText = (
  text: string, 
  blanks?: Array<{ id: string; correct_answer: string; placeholder?: string }>,
  showAnswers?: boolean
) => {
  // Strip HTML tags from rich text editor content, keeping only text
  const stripHtml = (html: string): string => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || html;
  };
  const cleanText = stripHtml(text);
  
  // First, normalize old numbered format to new format
  let normalizedText = cleanText.replace(/____(\d+)____/g, '[فراغ:$1]');
  
  // Combined pattern: new format OR general blanks
  const combinedPattern = /(\[فراغ:(\d+)\])|(_+|\.{3,}|…+|\[\.+\]|\(\s*\))/g;
  
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let generalBlankCounter = 0;
  let match;
  
  while ((match = combinedPattern.exec(normalizedText)) !== null) {
    // Add text before the blank
    if (match.index > lastIndex) {
      parts.push(<span key={`text-${lastIndex}`}>{normalizedText.slice(lastIndex, match.index)}</span>);
    }
    
    let blankId: number;
    let blankDef: typeof blanks extends Array<infer T> ? T : never | undefined;
    
    if (match[2]) {
      // Numbered format [فراغ:X]
      blankId = parseInt(match[2]);
      blankDef = blanks?.find(b => parseInt(b.id) === blankId);
    } else {
      // General blank - use sequential counter
      generalBlankCounter++;
      blankId = generalBlankCounter;
      // Try to find by sequential index if no numbered blanks exist
      blankDef = blanks?.[generalBlankCounter - 1];
    }
    
    parts.push(
      <span key={`blank-${match.index}`} className="inline-block mx-1">
        {showAnswers && blankDef?.correct_answer ? (
          <span className="px-2 py-1 bg-primary/10 border-b-2 border-primary text-primary font-medium rounded">
            {blankDef.correct_answer}
          </span>
        ) : (
          <input
            type="text"
            className="w-28 px-2 py-1 border-b-2 border-dashed border-primary/50 
                       bg-accent/30 text-center focus:outline-none focus:border-primary 
                       focus:bg-background rounded"
            placeholder={blankDef?.placeholder || `فراغ ${blankId}`}
          />
        )}
      </span>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < normalizedText.length) {
    parts.push(<span key={`text-end`}>{normalizedText.slice(lastIndex)}</span>);
  }
  
  return parts.length > 0 ? parts : [<span key="full">{text}</span>];
};

// Question Card Component
interface QuestionCardProps {
  question: ParsedQuestion;
  showAnswers: boolean;
  sectionIndex: number;
  onImageUploaded: (sectionIndex: number, questionNumber: string, imageUrl: string) => void;
  editMode?: boolean;
  onEdit?: (question: ParsedQuestion) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ 
  question, 
  showAnswers, 
  sectionIndex,
  onImageUploaded,
  editMode = false,
  onEdit
}) => {
  const isChoiceQuestion =
    question.question_type === 'multiple_choice' ||
    question.question_type === 'true_false' ||
    question.question_type === 'true_false_multi';

  const effectiveChoices = useMemo(() => {
    if (question.choices && question.choices.length > 0) return question.choices;
    if (question.question_type === 'true_false' || question.question_type === 'true_false_multi') {
      return [
        { id: 'صح', text: 'صح', is_correct: false },
        { id: 'خطأ', text: 'خطأ', is_correct: false }
      ];
    }
    return [];
  }, [question.choices, question.question_type]);

  const shouldWarnMissingChoices =
    isChoiceQuestion && (!question.choices || question.choices.length === 0);

  return (
    <div className="border rounded-lg p-4 space-y-3 relative group overflow-hidden max-w-full" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>
      {/* Edit Button */}
      {editMode && onEdit && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 left-2 z-50 h-8 w-8 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 shadow-sm"
          onClick={() => onEdit(question)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}

      {/* Question Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-primary">سؤال {englishToArabicNumber(question.question_number)}</span>
          <Badge variant="outline" className="text-xs">
            {questionTypeLabels[question.question_type] || question.question_type}
          </Badge>
        </div>
        <Badge variant="secondary">{question.points} علامة</Badge>
      </div>

      {/* Question Text - with fill blanks support */}
      {question.question_type === 'fill_blank' ? (
        <p className="text-foreground whitespace-pre-wrap leading-8">
          {renderFillBlankText(question.question_text, question.blanks, showAnswers)}
        </p>
      ) : (
        <SafeHtml html={question.question_text} />
      )}

      {/* Open-ended Answer Area */}
      {question.question_type === 'open_ended' && (
        <div className="mt-3">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            أكتب إجابتك هنا:
          </label>
          <textarea
            className="w-full min-h-[120px] p-3 border border-dashed border-muted-foreground/50 
                       rounded-lg bg-accent/20 focus:outline-none focus:border-primary 
                       focus:bg-background resize-y"
            placeholder="اكتب إجابتك هنا..."
            dir="rtl"
          />
        </div>
      )}

      {/* Calculation/CLI Answer Area */}
      {(question.question_type === 'calculation' || question.question_type === 'cli_command') && (
        <div className="mt-3">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            {question.question_type === 'calculation' ? 'الحل:' : 'الأمر:'}
          </label>
          <textarea
            className="w-full min-h-[80px] p-3 border border-dashed border-muted-foreground/50 
                       rounded-lg bg-accent/20 focus:outline-none focus:border-primary 
                       focus:bg-background font-mono"
            placeholder={question.question_type === 'calculation' ? 'اكتب الحل...' : 'اكتب الأمر...'}
            dir="ltr"
          />
        </div>
      )}

      {/* Image Upload/Display */}
      {question.has_image && (
        <BagrutImageUpload
          questionNumber={question.question_number}
          description={question.image_description}
          currentImageUrl={question.image_url}
          onImageUploaded={(url) => onImageUploaded(sectionIndex, question.question_number, url)}
        />
      )}

      {/* Table Display */}
      {(question.has_table || !!question.table_data) && question.table_data && (
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full border-collapse">
            {question.table_data.headers && question.table_data.headers.length > 0 && (
              <thead>
                <tr className="bg-muted/50">
                  {question.table_data.headers.map((header: string, i: number) => (
                    <th key={i} className="border border-muted p-2 text-sm font-medium text-center">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {question.table_data.rows?.map((row: string[], rowIndex: number) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                  {row.map((cell: string, cellIndex: number) => (
                    <td key={cellIndex} className="border border-muted p-2 text-sm text-center">
                      {isInputCell(cell, cellIndex, question.table_data?.input_columns) ? (
                        showAnswers && question.table_data?.correct_answers?.[rowIndex]?.[cellIndex] ? (
                          <span className="inline-flex min-w-[80px] justify-center px-2 py-1 rounded border border-primary/30 bg-primary/10 text-primary font-medium" dir="ltr">
                            {question.table_data.correct_answers[rowIndex][cellIndex]}
                          </span>
                        ) : (
                          <input
                            type="text"
                            className="w-full min-w-[80px] px-2 py-1 border border-dashed border-muted-foreground/50 rounded text-center bg-accent/30 focus:outline-none focus:border-primary focus:bg-background"
                            placeholder="..."
                            dir="ltr"
                          />
                        )
                      ) : (
                        cell
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Word Bank - مخزن الكلمات */}
      {question.word_bank && question.word_bank.length > 0 && (
        <div className="mt-3 p-3 bg-accent/50 rounded-lg border border-border">
          <p className="text-sm font-medium mb-2 text-foreground">مخزن الكلمات:</p>
          <div className="flex flex-wrap gap-2">
            {question.word_bank.map((word: string, index: number) => (
              <Badge key={index} variant="outline" className="text-sm bg-background border-border">
                {word}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Table Indicator (if no table_data) */}
      {(question.has_table || question.question_type === 'fill_table') && !question.table_data && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
          <Table className="h-4 w-4" />
          <span>يحتوي على جدول في الامتحان الأصلي</span>
        </div>
      )}

      {/* Code Block */}
      {question.has_code && question.code_content && (
        <pre className="bg-slate-900 text-slate-50 p-3 rounded-lg text-sm overflow-x-auto" dir="ltr">
          <code>{question.code_content}</code>
        </pre>
      )}

      {/* Choices */}
      {isChoiceQuestion && (
        <div className="space-y-3">
          {shouldWarnMissingChoices && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              تحذير: لم يتم استخراج خيارات هذا السؤال من ملف الامتحان. قد لا يظهر للطالب بشكل صحيح بعد الحفظ.
            </div>
          )}

          {effectiveChoices.length > 0 && (
            <RadioGroup value="" onValueChange={() => {}} className="space-y-2">
              {effectiveChoices.map((choice, index) => {
                const correct = showAnswers && isCorrectChoice(question, choice as any);
                const radioId = `${question.question_number}-choice-${index}`;

                return (
                  <label
                    key={radioId}
                    htmlFor={radioId}
                    className={
                      `flex items-start gap-3 rounded-lg border p-3 transition-colors ` +
                      (correct
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-background')
                    }
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          {index + 1}.
                        </span>
                        <span className="text-sm text-foreground whitespace-pre-wrap break-words">{choice.text}</span>
                      </div>
                    </div>
                    {correct && (
                      <span className="inline-flex items-center gap-1 text-sm text-primary">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">الإجابة الصحيحة</span>
                      </span>
                    )}
                    <RadioGroupItem
                      id={radioId}
                      value={choice.id}
                      disabled
                      className="mt-1"
                    />
                  </label>
                );
              })}
            </RadioGroup>
          )}
        </div>
      )}

      {/* Answer & Explanation */}
      {showAnswers && (question.correct_answer || question.answer_explanation) && (
        <div className="mt-3 p-3 bg-accent/30 rounded-lg border border-border space-y-2 overflow-hidden">
          {question.correct_answer && (
            <div>
              <span className="font-medium text-foreground">الإجابة الصحيحة: </span>
              <SafeHtml html={question.correct_answer} className="inline" />
            </div>
          )}
          {question.answer_explanation && (
            <div>
              <span className="font-medium text-foreground">الشرح: </span>
              <SafeHtml html={question.answer_explanation} />
            </div>
          )}
        </div>
      )}

      {/* Sub Questions */}
      {question.sub_questions && question.sub_questions.length > 0 && (
        <div className="mr-4 border-r-2 border-muted pr-4 space-y-3 overflow-hidden max-w-full">
          {question.sub_questions.map((subQ, subIndex) => (
            <QuestionCard 
              key={subIndex} 
              question={subQ} 
              showAnswers={showAnswers}
              sectionIndex={sectionIndex}
              onImageUploaded={onImageUploaded}
              editMode={editMode}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}

      {/* Topic Tags */}
      {question.topic_tags && question.topic_tags.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-2 border-t">
          {question.topic_tags.map((tag: string, index: number) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default BagrutExamPreview;
