import React, { useState } from 'react';
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

interface ParsedExam {
  title: string;
  exam_year: number;
  exam_season: string;
  exam_code?: string;
  subject: string;
  duration_minutes: number;
  total_points: number;
  instructions?: string;
  sections: any[];
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
  isSaving = false
}) => {
  const [showAnswers, setShowAnswers] = useState(false);
  const [activeSection, setActiveSection] = useState('0');

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
          {exam.sections.map((section, index) => (
            <TabsTrigger key={index} value={String(index)}>
              {section.section_title}
              {section.section_type === 'elective' && (
                <Badge variant="outline" className="mr-2 text-xs">اختياري</Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {exam.sections.map((section, sectionIndex) => (
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
                    {section.questions.map((question: any, qIndex: number) => (
                      <QuestionCard 
                        key={qIndex} 
                        question={question} 
                        showAnswers={showAnswers}
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

// Question Card Component
const QuestionCard: React.FC<{ question: any; showAnswers: boolean }> = ({ question, showAnswers }) => {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      {/* Question Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-primary">سؤال {question.question_number}</span>
          <Badge variant="outline" className="text-xs">
            {questionTypeLabels[question.question_type] || question.question_type}
          </Badge>
        </div>
        <Badge variant="secondary">{question.points} نقاط</Badge>
      </div>

      {/* Question Text */}
      <p className="text-foreground whitespace-pre-wrap">{question.question_text}</p>

      {/* Image Placeholder */}
      {question.has_image && (
        <div className="border-2 border-dashed border-muted rounded-lg p-4 bg-muted/20">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
              <ImageIcon className="h-8 w-8" />
            </div>
            <p className="text-sm font-medium">صورة مرفقة في الامتحان الأصلي</p>
            {question.image_description && (
              <p className="text-xs text-center max-w-md">
                وصف: {question.image_description}
              </p>
            )}
          </div>
        </div>
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
          {question.sub_questions.map((subQ: any, subIndex: number) => (
            <QuestionCard key={subIndex} question={subQ} showAnswers={showAnswers} />
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
