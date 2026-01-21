import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Choice {
  id: string;
  text: string;
  is_correct: boolean;
}

interface ParsedQuestion {
  question_number: string;
  question_text: string;
  question_type: string;
  points: number;
  has_image?: boolean;
  image_description?: string;
  image_url?: string;
  has_table?: boolean;
  table_data?: { headers?: string[]; rows?: string[][]; input_columns?: number[] };
  word_bank?: string[];
  has_code?: boolean;
  code_content?: string;
  choices?: Choice[];
  correct_answer?: string;
  answer_explanation?: string;
  sub_questions?: ParsedQuestion[];
  topic_tags?: string[];
  question_db_id?: string;
}

interface BagrutQuestionEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: ParsedQuestion;
  questionTypeLabel: string;
  onSubmit: (updatedQuestion: ParsedQuestion) => void;
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

const BagrutQuestionEditDialog: React.FC<BagrutQuestionEditDialogProps> = ({
  open,
  onOpenChange,
  question,
  questionTypeLabel,
  onSubmit
}) => {
  const [editedQuestion, setEditedQuestion] = useState<ParsedQuestion>(question);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset state when question changes
  useEffect(() => {
    setEditedQuestion({ ...question });
    setValidationError(null);
  }, [question, open]);

  const isChoiceQuestion =
    editedQuestion.question_type === 'multiple_choice' ||
    editedQuestion.question_type === 'true_false' ||
    editedQuestion.question_type === 'true_false_multi';

  const isTrueFalse = 
    editedQuestion.question_type === 'true_false' ||
    editedQuestion.question_type === 'true_false_multi';

  // Initialize choices if needed
  const choices: Choice[] = editedQuestion.choices || 
    (isTrueFalse ? [
      { id: 'صح', text: 'صح', is_correct: false },
      { id: 'خطأ', text: 'خطأ', is_correct: false }
    ] : []);

  const handleTextChange = (field: keyof ParsedQuestion, value: string | number) => {
    setEditedQuestion(prev => ({ ...prev, [field]: value }));
    setValidationError(null);
  };

  const handleChoiceTextChange = (index: number, text: string) => {
    const newChoices = [...choices];
    newChoices[index] = { ...newChoices[index], text };
    setEditedQuestion(prev => ({ ...prev, choices: newChoices }));
  };

  const handleCorrectAnswerChange = (choiceId: string) => {
    const newChoices = choices.map(c => ({
      ...c,
      is_correct: c.id === choiceId
    }));
    setEditedQuestion(prev => ({
      ...prev,
      choices: newChoices,
      correct_answer: choiceId
    }));
    setValidationError(null);
  };

  const handleAddChoice = () => {
    const newId = String.fromCharCode(65 + choices.length); // A, B, C, D...
    const newChoices = [...choices, { id: newId, text: '', is_correct: false }];
    setEditedQuestion(prev => ({ ...prev, choices: newChoices }));
  };

  const handleRemoveChoice = (index: number) => {
    if (choices.length <= 2) {
      toast.error('يجب أن يكون هناك خياران على الأقل');
      return;
    }
    const newChoices = choices.filter((_, i) => i !== index);
    // Reassign IDs
    const reIdChoices = newChoices.map((c, i) => ({
      ...c,
      id: String.fromCharCode(65 + i)
    }));
    // If we removed the correct answer, clear it
    const hadCorrect = choices[index]?.is_correct;
    setEditedQuestion(prev => ({
      ...prev,
      choices: reIdChoices,
      correct_answer: hadCorrect ? '' : prev.correct_answer
    }));
  };

  const handleTableHeaderChange = (index: number, value: string) => {
    const tableData = editedQuestion.table_data || { headers: [], rows: [] };
    const newHeaders = [...(tableData.headers || [])];
    newHeaders[index] = value;
    setEditedQuestion(prev => ({
      ...prev,
      table_data: { ...tableData, headers: newHeaders }
    }));
  };

  const handleTableCellChange = (rowIndex: number, cellIndex: number, value: string) => {
    const tableData = editedQuestion.table_data || { headers: [], rows: [] };
    const newRows = [...(tableData.rows || [])];
    if (!newRows[rowIndex]) newRows[rowIndex] = [];
    newRows[rowIndex] = [...newRows[rowIndex]];
    newRows[rowIndex][cellIndex] = value;
    setEditedQuestion(prev => ({
      ...prev,
      table_data: { ...tableData, rows: newRows }
    }));
  };

  const handleCodeChange = (value: string) => {
    setEditedQuestion(prev => ({ ...prev, code_content: value }));
  };

  const validateAndSubmit = () => {
    // Validation for choice questions
    if (isChoiceQuestion) {
      const currentChoices = editedQuestion.choices || [];
      if (currentChoices.length < 2) {
        setValidationError('يجب أن يكون هناك خياران على الأقل');
        return;
      }
      const hasCorrect = currentChoices.some(c => c.is_correct);
      if (!hasCorrect && !editedQuestion.correct_answer) {
        setValidationError('يجب تحديد الإجابة الصحيحة');
        return;
      }
    }

    // Validate question text
    if (!editedQuestion.question_text.trim()) {
      setValidationError('نص السؤال مطلوب');
      return;
    }

    onSubmit(editedQuestion);
    onOpenChange(false);
    toast.success('تم حفظ التعديلات');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            تحرير السؤال {question.question_number}
            <Badge variant="secondary">
              {questionTypeLabels[question.question_type] || question.question_type}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            قم بتعديل نص السؤال والخيارات والإجابة الصحيحة
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            {/* Question Text */}
            <div className="space-y-2">
              <Label htmlFor="question-text">نص السؤال</Label>
              <Textarea
                id="question-text"
                value={editedQuestion.question_text}
                onChange={(e) => handleTextChange('question_text', e.target.value)}
                className="min-h-[100px]"
                dir="rtl"
              />
            </div>

            {/* Points */}
            <div className="space-y-2">
              <Label htmlFor="points">النقاط</Label>
              <Input
                id="points"
                type="number"
                value={editedQuestion.points}
                onChange={(e) => handleTextChange('points', Number(e.target.value))}
                className="w-32"
                min={0}
              />
            </div>

            {/* Choices for MCQ / True-False */}
            {isChoiceQuestion && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>الخيارات</Label>
                  {!isTrueFalse && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddChoice}
                      className="gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      إضافة خيار
                    </Button>
                  )}
                </div>

                <RadioGroup
                  value={editedQuestion.correct_answer || choices.find(c => c.is_correct)?.id || ''}
                  onValueChange={handleCorrectAnswerChange}
                  className="space-y-3"
                >
                  {choices.map((choice, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <RadioGroupItem value={choice.id} id={`choice-${index}`} />
                      <Input
                        value={choice.text}
                        onChange={(e) => handleChoiceTextChange(index, e.target.value)}
                        placeholder={`خيار ${choice.id}`}
                        className="flex-1"
                      />
                      {!isTrueFalse && choices.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveChoice(index)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </RadioGroup>

                <p className="text-sm text-muted-foreground">
                  اختر الإجابة الصحيحة بالنقر على الدائرة بجانب الخيار
                </p>
              </div>
            )}

            {/* Table Editor */}
            {editedQuestion.has_table && editedQuestion.table_data && (
              <div className="space-y-4">
                <Label>تحرير الجدول</Label>
                
                {/* Headers */}
                {editedQuestion.table_data.headers && editedQuestion.table_data.headers.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">العناوين</Label>
                    <div className="flex gap-2 flex-wrap">
                      {editedQuestion.table_data.headers.map((header, i) => (
                        <Input
                          key={i}
                          value={header}
                          onChange={(e) => handleTableHeaderChange(i, e.target.value)}
                          className="w-32"
                          placeholder={`عمود ${i + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Rows */}
                {editedQuestion.table_data.rows && editedQuestion.table_data.rows.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">الصفوف</Label>
                    <div className="space-y-2">
                      {editedQuestion.table_data.rows.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex gap-2 flex-wrap">
                          {row.map((cell, cellIndex) => (
                            <Input
                              key={cellIndex}
                              value={cell}
                              onChange={(e) => handleTableCellChange(rowIndex, cellIndex, e.target.value)}
                              className="w-32"
                              placeholder="..."
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Code Editor */}
            {editedQuestion.has_code && (
              <div className="space-y-2">
                <Label htmlFor="code-content">الكود</Label>
                <Textarea
                  id="code-content"
                  value={editedQuestion.code_content || ''}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  className="min-h-[120px] font-mono text-sm"
                  dir="ltr"
                />
              </div>
            )}

            {/* Answer Explanation */}
            <div className="space-y-2">
              <Label htmlFor="explanation">شرح الإجابة (اختياري)</Label>
              <Textarea
                id="explanation"
                value={editedQuestion.answer_explanation || ''}
                onChange={(e) => handleTextChange('answer_explanation', e.target.value)}
                className="min-h-[80px]"
                dir="rtl"
              />
            </div>

            {/* Validation Error */}
            {validationError && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {validationError}
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-row-reverse gap-2">
          <Button onClick={validateAndSubmit} className="gap-2">
            <Save className="h-4 w-4" />
            حفظ التعديلات
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BagrutQuestionEditDialog;
