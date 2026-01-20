import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Eye, 
  EyeOff, 
  Save, 
  X, 
  CheckCircle,
  FileText,
  Clock,
  Award,
  Layers,
  HelpCircle,
  ImageIcon,
  Table
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import BagrutImageUpload from './BagrutImageUpload';

interface ParsedQuestion {
  question_number: string;
  question_text: string;
  question_type: string;
  points: number;
  has_image?: boolean;
  image_description?: string;
  image_url?: string;
  has_table?: boolean;
  table_data?: { headers?: string[]; rows?: string[][] };
  word_bank?: string[];
  has_code?: boolean;
  code_content?: string;
  choices?: Array<{ id: string; text: string; is_correct: boolean }>;
  correct_answer?: string;
  answer_explanation?: string;
  sub_questions?: ParsedQuestion[];
  topic_tags?: string[];
}

interface ParsedSection {
  section_number: number;
  section_title: string;
  section_type: 'mandatory' | 'elective';
  total_points: number;
  specialization?: string;
  specialization_label?: string;
  instructions?: string;
  questions: ParsedQuestion[];
}

interface ParsedExam {
  title: string;
  exam_year: number;
  exam_season: string;
  exam_code?: string;
  subject: string;
  duration_minutes: number;
  total_points: number;
  instructions?: string;
  sections: ParsedSection[];
}

interface Statistics {
  totalSections: number;
  totalQuestions: number;
  questionsByType: Record<string, number>;
  totalPoints: number;
}

interface BagrutExamPreviewProps {
  exam: ParsedExam;
  statistics: Statistics;
  onSave: () => void;
  onCancel: () => void;
  onExamUpdate?: (updatedExam: ParsedExam) => void;
  isSaving?: boolean;
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

const BagrutExamPreview: React.FC<BagrutExamPreviewProps> = ({
  exam,
  statistics,
  onSave,
  onCancel,
  onExamUpdate,
  isSaving = false
}) => {
  const [showAnswers, setShowAnswers] = useState(false);
  const [activeSection, setActiveSection] = useState('0');
  const [localExam, setLocalExam] = useState(exam);

  // Handle image upload for a question
  const handleImageUploaded = useCallback((sectionIndex: number, questionNumber: string, imageUrl: string) => {
    setLocalExam(prev => {
      const updated = { ...prev };
      updated.sections = prev.sections.map((section, sIdx) => {
        if (sIdx !== sectionIndex) return section;
        return {
          ...section,
          questions: section.questions.map(q => 
            q.question_number === questionNumber 
              ? { ...q, image_url: imageUrl }
              : q
          )
        };
      });
      onExamUpdate?.(updated);
      return updated;
    });
  }, [onExamUpdate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{exam.title}</CardTitle>
              <p className="text-muted-foreground mt-1">
                {exam.subject} - {seasonLabels[exam.exam_season] || exam.exam_season} {exam.exam_year}
                {exam.exam_code && ` (${exam.exam_code})`}
              </p>
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
        </CardHeader>
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
                <p className="text-sm text-muted-foreground">مجموع النقاط</p>
                <p className="font-semibold">{statistics.totalPoints} نقطة</p>
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

          {exam.instructions && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm">
              <p className="font-medium mb-1">تعليمات الامتحان:</p>
              <p className="text-muted-foreground">{exam.instructions}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sections */}
      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList className="w-full justify-start">
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
                  <Badge>{section.total_points} نقطة</Badge>
                </div>
                {section.instructions && (
                  <p className="text-sm text-muted-foreground mt-2">{section.instructions}</p>
                )}
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {section.questions.map((question, qIndex) => (
                      <QuestionCard 
                        key={qIndex} 
                        question={question} 
                        showAnswers={showAnswers}
                        sectionIndex={sectionIndex}
                        onImageUploaded={handleImageUploaded}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <Button onClick={onSave} disabled={isSaving} className="gap-2">
          {isSaving ? (
            <>جاري الحفظ...</>
          ) : (
            <>
              <Save className="h-4 w-4" />
              حفظ الامتحان
            </>
          )}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          <X className="h-4 w-4 ml-2" />
          إلغاء
        </Button>
      </div>
    </div>
  );
};

// Helper function to check if a cell should be an input field
const isInputCell = (cellValue: string) => {
  const inputIndicators = ['?', '؟', '', '_', '___', '...', '....'];
  return inputIndicators.includes(cellValue?.trim() || '');
};

// Helper function to render fill_blank text with input fields
const renderFillBlankText = (text: string) => {
  const blankPatterns = /(_+|\.{3,}|…+|\[\.+\]|\(\s*\))/g;
  const parts = text.split(blankPatterns);
  
  let blankIndex = 0;
  return parts.map((part, index) => {
    if (part.match(blankPatterns)) {
      blankIndex++;
      return (
        <input
          key={index}
          type="text"
          className="inline-block w-32 mx-1 px-2 py-1 border-b-2 border-dashed border-primary/50 
                     bg-accent/30 text-center focus:outline-none focus:border-primary 
                     focus:bg-background rounded"
          placeholder={`فراغ ${blankIndex}`}
        />
      );
    }
    return <span key={index}>{part}</span>;
  });
};

// Question Card Component
interface QuestionCardProps {
  question: ParsedQuestion;
  showAnswers: boolean;
  sectionIndex: number;
  onImageUploaded: (sectionIndex: number, questionNumber: string, imageUrl: string) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ 
  question, 
  showAnswers, 
  sectionIndex,
  onImageUploaded 
}) => {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      {/* Question Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-primary">سؤال {englishToArabicNumber(question.question_number)}</span>
          <Badge variant="outline" className="text-xs">
            {questionTypeLabels[question.question_type] || question.question_type}
          </Badge>
        </div>
        <Badge variant="secondary">{question.points} نقاط</Badge>
      </div>

      {/* Question Text - with fill blanks support */}
      {question.question_type === 'fill_blank' ? (
        <p className="text-foreground whitespace-pre-wrap leading-8">
          {renderFillBlankText(question.question_text)}
        </p>
      ) : (
        <p className="text-foreground whitespace-pre-wrap">{question.question_text}</p>
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
      {question.has_table && question.table_data && (
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
                      {isInputCell(cell) ? (
                        <input
                          type="text"
                          className="w-full min-w-[80px] px-2 py-1 border border-dashed border-muted-foreground/50 rounded text-center bg-accent/30 focus:outline-none focus:border-primary focus:bg-background"
                          placeholder="..."
                          dir="ltr"
                        />
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
      {question.has_table && !question.table_data && (
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
      {question.choices && question.choices.length > 0 && (
        <div className="space-y-2">
          {question.choices.map((choice: any, index: number) => (
            <div 
              key={index}
              className={`p-2 rounded border ${
                showAnswers && choice.is_correct 
                  ? 'border-green-500 bg-green-50 dark:bg-green-950/30' 
                  : 'border-muted'
              }`}
            >
              <span className="font-medium ml-2">{choice.id}.</span>
              {choice.text}
              {showAnswers && choice.is_correct && (
                <CheckCircle className="h-4 w-4 text-green-500 inline mr-2" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Answer & Explanation */}
      {showAnswers && (question.correct_answer || question.answer_explanation) && (
        <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg space-y-2">
          {question.correct_answer && (
            <div>
              <span className="font-medium text-green-700 dark:text-green-400">الإجابة الصحيحة: </span>
              <span>{question.correct_answer}</span>
            </div>
          )}
          {question.answer_explanation && (
            <div>
              <span className="font-medium text-green-700 dark:text-green-400">الشرح: </span>
              <span className="text-muted-foreground">{question.answer_explanation}</span>
            </div>
          )}
        </div>
      )}

      {/* Sub Questions */}
      {question.sub_questions && question.sub_questions.length > 0 && (
        <div className="mr-4 border-r-2 border-muted pr-4 space-y-3">
          {question.sub_questions.map((subQ, subIndex) => (
            <QuestionCard 
              key={subIndex} 
              question={subQ} 
              showAnswers={showAnswers}
              sectionIndex={sectionIndex}
              onImageUploaded={onImageUploaded}
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
