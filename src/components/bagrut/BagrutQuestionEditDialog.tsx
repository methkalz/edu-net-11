import React, { useState, useEffect, useCallback } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Save, AlertCircle, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import type { TableData, BlankDefinition } from '@/lib/bagrut/buildBagrutPreview';

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
  table_data?: TableData;
  word_bank?: string[];
  has_code?: boolean;
  code_content?: string;
  choices?: Choice[];
  correct_answer?: string;
  answer_explanation?: string;
  sub_questions?: ParsedQuestion[];
  topic_tags?: string[];
  blanks?: BlankDefinition[];
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

  const isFillBlank = editedQuestion.question_type === 'fill_blank';

  // Initialize choices if needed - use numeric IDs (1, 2, 3...)
  const choices: Choice[] = editedQuestion.choices || 
    (isTrueFalse ? [
      { id: '1', text: 'صح', is_correct: false },
      { id: '2', text: 'خطأ', is_correct: false }
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
    const newId = String(choices.length + 1); // Numeric IDs: 1, 2, 3...
    const newChoices = [...choices, { id: newId, text: '', is_correct: false }];
    setEditedQuestion(prev => ({ ...prev, choices: newChoices }));
  };

  const handleRemoveChoice = (index: number) => {
    if (choices.length <= 2) {
      toast.error('يجب أن يكون هناك خياران على الأقل');
      return;
    }
    const newChoices = choices.filter((_, i) => i !== index);
    // Reassign IDs (numeric: 1, 2, 3...)
    const reIdChoices = newChoices.map((c, i) => ({
      ...c,
      id: String(i + 1)
    }));
    // If we removed the correct answer, clear it
    const hadCorrect = choices[index]?.is_correct;
    setEditedQuestion(prev => ({
      ...prev,
      choices: reIdChoices,
      correct_answer: hadCorrect ? '' : prev.correct_answer
    }));
  };

  // ========== Table Editor Functions ==========
  const tableData = editedQuestion.table_data || { headers: [], rows: [], input_columns: [], correct_answers: {} };

  const handleTableHeaderChange = (index: number, value: string) => {
    const newHeaders = [...(tableData.headers || [])];
    newHeaders[index] = value;
    setEditedQuestion(prev => ({
      ...prev,
      table_data: { ...tableData, headers: newHeaders }
    }));
  };

  const handleTableCellChange = (rowIndex: number, cellIndex: number, value: string) => {
    const newRows = [...(tableData.rows || [])];
    if (!newRows[rowIndex]) newRows[rowIndex] = [];
    newRows[rowIndex] = [...newRows[rowIndex]];
    newRows[rowIndex][cellIndex] = value;
    setEditedQuestion(prev => ({
      ...prev,
      table_data: { ...tableData, rows: newRows }
    }));
  };

  const handleAddTableRow = () => {
    const colCount = tableData.headers?.length || (tableData.rows?.[0]?.length || 3);
    const newRow = Array(colCount).fill('');
    const newRows = [...(tableData.rows || []), newRow];
    setEditedQuestion(prev => ({
      ...prev,
      table_data: { ...tableData, rows: newRows }
    }));
  };

  const handleRemoveTableRow = (rowIndex: number) => {
    if ((tableData.rows?.length || 0) <= 1) {
      toast.error('يجب أن يكون هناك صف واحد على الأقل');
      return;
    }
    const newRows = (tableData.rows || []).filter((_, i) => i !== rowIndex);
    // Also remove correct answers for this row and shift higher indices
    const newCorrectAnswers = { ...(tableData.correct_answers || {}) };
    delete newCorrectAnswers[rowIndex];
    // Shift indices
    const shiftedAnswers: typeof newCorrectAnswers = {};
    for (const [key, val] of Object.entries(newCorrectAnswers)) {
      const idx = Number(key);
      if (idx > rowIndex) {
        shiftedAnswers[idx - 1] = val;
      } else {
        shiftedAnswers[idx] = val;
      }
    }
    setEditedQuestion(prev => ({
      ...prev,
      table_data: { ...tableData, rows: newRows, correct_answers: shiftedAnswers }
    }));
  };

  const handleToggleInputColumn = (colIndex: number) => {
    const inputColumns = [...(tableData.input_columns || [])];
    const idx = inputColumns.indexOf(colIndex);
    if (idx >= 0) {
      inputColumns.splice(idx, 1);
    } else {
      inputColumns.push(colIndex);
      inputColumns.sort((a, b) => a - b);
    }
    setEditedQuestion(prev => ({
      ...prev,
      table_data: { ...tableData, input_columns: inputColumns }
    }));
  };

  const handleTableCorrectAnswerChange = (rowIndex: number, colIndex: number, value: string) => {
    const newCorrectAnswers = { ...(tableData.correct_answers || {}) };
    if (!newCorrectAnswers[rowIndex]) {
      newCorrectAnswers[rowIndex] = {};
    }
    newCorrectAnswers[rowIndex] = { ...newCorrectAnswers[rowIndex], [colIndex]: value };
    setEditedQuestion(prev => ({
      ...prev,
      table_data: { ...tableData, correct_answers: newCorrectAnswers }
    }));
  };

  // ========== Word Bank Functions ==========
  const wordBank = editedQuestion.word_bank || [];

  const handleAddWord = () => {
    setEditedQuestion(prev => ({
      ...prev,
      word_bank: [...(prev.word_bank || []), '']
    }));
  };

  const handleRemoveWord = (index: number) => {
    setEditedQuestion(prev => ({
      ...prev,
      word_bank: (prev.word_bank || []).filter((_, i) => i !== index)
    }));
  };

  const handleWordChange = (index: number, value: string) => {
    setEditedQuestion(prev => {
      const newWordBank = [...(prev.word_bank || [])];
      newWordBank[index] = value;
      return { ...prev, word_bank: newWordBank };
    });
  };

  // ========== Blanks Functions (fill_blank) ==========
  const blanks = editedQuestion.blanks || [];

  // Extract blanks from question text (auto-detect on open)
  const extractBlanksFromText = useCallback((text: string, existingBlanks?: BlankDefinition[]): BlankDefinition[] => {
    const foundBlanks: BlankDefinition[] = [];
    
    // Pattern 1: New format [فراغ:X]
    const newFormatPattern = /\[فراغ:(\d+)\]/g;
    // Pattern 2: Old numbered format ____X____
    const oldNumberedPattern = /____(\d+)____/g;
    // Pattern 3: General blanks (unnamed) - ____, ..., etc.
    const generalPattern = /(_+|\.{3,}|…+)/g;
    
    let match;
    const numberedIds = new Set<number>();
    
    // First pass: find numbered blanks
    while ((match = newFormatPattern.exec(text)) !== null) {
      const id = parseInt(match[1]);
      numberedIds.add(id);
      foundBlanks.push({
        id: String(id),
        placeholder: '',
        correct_answer: existingBlanks?.find(b => b.id === String(id))?.correct_answer || ''
      });
    }
    
    // Reset regex
    oldNumberedPattern.lastIndex = 0;
    while ((match = oldNumberedPattern.exec(text)) !== null) {
      const id = parseInt(match[1]);
      if (!numberedIds.has(id)) {
        numberedIds.add(id);
        foundBlanks.push({
          id: String(id),
          placeholder: '',
          correct_answer: existingBlanks?.find(b => b.id === String(id))?.correct_answer || ''
        });
      }
    }
    
    // Second pass: count general blanks and assign IDs
    let generalIndex = 0;
    generalPattern.lastIndex = 0;
    while ((match = generalPattern.exec(text)) !== null) {
      generalIndex++;
      // Only add if no numbered blanks found (to avoid duplicates)
      if (numberedIds.size === 0) {
        foundBlanks.push({
          id: String(generalIndex),
          placeholder: '',
          correct_answer: existingBlanks?.[generalIndex - 1]?.correct_answer || ''
        });
      }
    }
    
    // Sort by ID
    foundBlanks.sort((a, b) => parseInt(a.id) - parseInt(b.id));
    
    // Remove duplicates
    const uniqueBlanks = foundBlanks.filter((blank, index, self) => 
      index === self.findIndex(b => b.id === blank.id)
    );
    
    return uniqueBlanks;
  }, []);

  // Auto-detect blanks when dialog opens for fill_blank questions
  useEffect(() => {
    if (open && isFillBlank) {
      const existingBlanks = question.blanks || [];
      if (existingBlanks.length === 0) {
        // Only auto-detect if no blanks are defined
        const detected = extractBlanksFromText(question.question_text, existingBlanks);
        if (detected.length > 0) {
          setEditedQuestion(prev => ({ ...prev, blanks: detected }));
        }
      }
    }
  }, [open, isFillBlank, question, extractBlanksFromText]);

  // Check if a blank marker exists in the text
  const isBlankInText = (blankId: string): boolean => {
    const text = editedQuestion.question_text;
    const newFormat = new RegExp(`\\[فراغ:${blankId}\\]`);
    const oldFormat = new RegExp(`____${blankId}____`);
    return newFormat.test(text) || oldFormat.test(text);
  };

  // Count general blanks in text (without IDs)
  const countGeneralBlanksInText = (): number => {
    const text = editedQuestion.question_text;
    const generalPattern = /(_+|\.{3,}|…+)/g;
    const matches = text.match(generalPattern);
    return matches ? matches.length : 0;
  };

  const handleAddBlank = () => {
    const newId = String(blanks.length + 1);
    const newBlanks: BlankDefinition[] = [...blanks, { id: newId, placeholder: '', correct_answer: '' }];
    setEditedQuestion(prev => ({ ...prev, blanks: newBlanks }));
  };

  const handleRemoveBlank = (index: number) => {
    const blankToRemove = blanks[index];
    const newBlanks = blanks.filter((_, i) => i !== index);
    // Re-ID blanks
    const reIdBlanks = newBlanks.map((b, i) => ({ ...b, id: String(i + 1) }));
    
    // Also remove the marker from text if exists
    let updatedText = editedQuestion.question_text;
    updatedText = updatedText.replace(new RegExp(`\\[فراغ:${blankToRemove.id}\\]`, 'g'), '____');
    updatedText = updatedText.replace(new RegExp(`____${blankToRemove.id}____`, 'g'), '____');
    
    setEditedQuestion(prev => ({ ...prev, blanks: reIdBlanks, question_text: updatedText }));
  };

  const handleBlankChange = (index: number, field: 'placeholder' | 'correct_answer', value: string) => {
    const newBlanks = [...blanks];
    newBlanks[index] = { ...newBlanks[index], [field]: value };
    setEditedQuestion(prev => ({ ...prev, blanks: newBlanks }));
  };

  const handleInsertBlankMarker = (blankId: string) => {
    // Use new format: [فراغ:X]
    const marker = `[فراغ:${blankId}]`;
    setEditedQuestion(prev => ({
      ...prev,
      question_text: prev.question_text + ' ' + marker
    }));
    toast.success(`تم إدراج علامة الفراغ ${blankId}`);
  };

  const handleDetectBlanks = () => {
    const detected = extractBlanksFromText(editedQuestion.question_text, editedQuestion.blanks);
    if (detected.length > 0) {
      setEditedQuestion(prev => ({ ...prev, blanks: detected }));
      toast.success(`تم اكتشاف ${detected.length} فراغ/فراغات`);
    } else {
      toast.info('لم يتم العثور على فراغات في النص');
    }
  };

  // ========== Code Editor ==========
  const handleCodeChange = (value: string) => {
    setEditedQuestion(prev => ({ ...prev, code_content: value }));
  };

  // ========== Validation & Submit ==========
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

  const colCount = tableData.headers?.length || (tableData.rows?.[0]?.length || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]" dir="rtl">
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

            {/* Choices for MCQ / True-False (Numeric IDs) */}
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
                      <span className="w-6 text-sm font-medium text-muted-foreground">{choice.id}.</span>
                      <Input
                        value={choice.text}
                        onChange={(e) => handleChoiceTextChange(index, e.target.value)}
                        placeholder={`خيار ${index + 1}`}
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

            {/* Fill Blank - Blanks Management */}
            {isFillBlank && (
              <div className="space-y-4">
                <Separator />
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">إدارة الفراغات</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDetectBlanks}
                      className="gap-1"
                    >
                      🔍 اكتشاف الفراغات
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddBlank}
                      className="gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      إضافة فراغ
                    </Button>
                  </div>
                </div>
                
                {/* Info about detected blanks */}
                {countGeneralBlanksInText() > 0 && blanks.length === 0 && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-200">
                    ℹ️ تم اكتشاف {countGeneralBlanksInText()} فراغ/فراغات في النص. انقر "اكتشاف الفراغات" لإنشائها تلقائياً.
                  </div>
                )}
                
                <p className="text-sm text-muted-foreground">
                  أضف الفراغات ثم انقر "إدراج" لوضع علامة الفراغ في نص السؤال. الصيغة: [فراغ:1]
                </p>

                <div className="space-y-3">
                  {blanks.map((blank, index) => {
                    const inText = isBlankInText(blank.id);
                    return (
                      <div key={index} className={`flex items-center gap-2 p-3 rounded-lg ${inText ? 'bg-muted/30' : 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800'}`}>
                        <span className="font-medium text-sm min-w-[70px]">فراغ {blank.id}:</span>
                        {inText ? (
                          <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300">
                            ✓ في النص
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300">
                            ⚠ غير مدرج
                          </Badge>
                        )}
                        <Input
                          value={blank.correct_answer}
                          onChange={(e) => handleBlankChange(index, 'correct_answer', e.target.value)}
                          placeholder="الإجابة الصحيحة"
                          className="flex-1"
                        />
                        {!inText && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleInsertBlankMarker(blank.id)}
                          >
                            إدراج
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveBlank(index)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                  {blanks.length === 0 && countGeneralBlanksInText() === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      لا توجد فراغات محددة. انقر "إضافة فراغ" لإنشاء فراغ جديد.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Table Editor - Enhanced */}
            {editedQuestion.has_table && (
              <div className="space-y-4">
                <Separator />
                <Label className="text-base font-semibold">تحرير الجدول</Label>
                
                {/* Input Columns Selection */}
                {colCount > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">أعمدة الإدخال (يملأها الطالب)</Label>
                    <div className="flex gap-2 flex-wrap">
                      {Array.from({ length: colCount }, (_, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Checkbox
                            id={`input-col-${i}`}
                            checked={(tableData.input_columns || []).includes(i)}
                            onCheckedChange={() => handleToggleInputColumn(i)}
                          />
                          <Label htmlFor={`input-col-${i}`} className="text-sm">
                            عمود {i + 1}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Headers */}
                {tableData.headers && tableData.headers.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">العناوين</Label>
                    <div className="flex gap-2 flex-wrap">
                      {tableData.headers.map((header, i) => (
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

                {/* Rows with correct answers */}
                {tableData.rows && tableData.rows.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-muted-foreground">الصفوف</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddTableRow}
                        className="gap-1"
                      >
                        <Plus className="h-4 w-4" />
                        إضافة صف
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {tableData.rows.map((row, rowIndex) => (
                        <div key={rowIndex} className="p-3 bg-muted/20 rounded-lg space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            {row.map((cell, cellIndex) => (
                              <div key={cellIndex} className="flex flex-col gap-1">
                                <Input
                                  value={cell}
                                  onChange={(e) => handleTableCellChange(rowIndex, cellIndex, e.target.value)}
                                  className="w-28"
                                  placeholder="..."
                                />
                                {/* Show correct answer input for input columns */}
                                {(tableData.input_columns || []).includes(cellIndex) && (
                                  <Input
                                    value={tableData.correct_answers?.[rowIndex]?.[cellIndex] || ''}
                                    onChange={(e) => handleTableCorrectAnswerChange(rowIndex, cellIndex, e.target.value)}
                                    className="w-28 text-xs bg-green-50 dark:bg-green-950/30 border-green-300"
                                    placeholder="الصحيح"
                                  />
                                )}
                              </div>
                            ))}
                            {(tableData.rows?.length || 0) > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveTableRow(rowIndex)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Word Bank Editor */}
            {(editedQuestion.word_bank && editedQuestion.word_bank.length > 0) || editedQuestion.has_table ? (
              <div className="space-y-4">
                <Separator />
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">مستودع المصطلحات</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddWord}
                    className="gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    إضافة مصطلح
                  </Button>
                </div>

                <div className="space-y-2">
                  {wordBank.map((word, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={word}
                        onChange={(e) => handleWordChange(index, e.target.value)}
                        placeholder="أدخل المصطلح"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveWord(index)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {wordBank.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      لا توجد مصطلحات. انقر "إضافة مصطلح" لإنشاء مصطلح جديد.
                    </p>
                  )}
                </div>
              </div>
            ) : null}

            {/* Code Editor */}
            {editedQuestion.has_code && (
              <div className="space-y-2">
                <Separator />
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
              <Separator />
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
