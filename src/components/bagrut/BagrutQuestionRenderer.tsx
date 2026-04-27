// مكون عرض سؤال البجروت للطالب أثناء الحل
import React, { useMemo } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, Code, Image as ImageIcon, AlertCircle } from 'lucide-react';
import SafeHtml from './SafeHtml';
import type { ParsedQuestion } from '@/lib/bagrut/buildBagrutPreview';
import type { BagrutAnswer } from '@/hooks/useBagrutAttempt';

interface BagrutQuestionRendererProps {
  question: ParsedQuestion;
  answers: Record<string, BagrutAnswer>;  // كل الإجابات - كل سؤال يستخرج إجابته الخاصة
  onAnswerChange: (questionId: string, answer: BagrutAnswer) => void;
  showAnswer?: boolean;
  disabled?: boolean;
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

export default function BagrutQuestionRenderer({
  question,
  answers,  // ← كل الإجابات
  onAnswerChange,
  showAnswer = false,
  disabled = false,
}: BagrutQuestionRendererProps) {
  const questionId = question.question_db_id || question.question_number;

  const handleChange = (value: string | string[] | Record<string, string>) => {
    onAnswerChange(questionId, { answer: value });
  };

  // كل سؤال يستخرج إجابته الخاصة من الـ record
  const currentAnswer = answers[questionId]?.answer;

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary text-lg">
              سؤال {question.question_number}
            </span>
            <Badge variant="outline" className="text-xs">
              {questionTypeLabels[question.question_type] || question.question_type}
            </Badge>
          </div>
          <Badge variant="secondary" className="text-sm">
            {question.points} علامة
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* نص السؤال */}
        <div className="text-foreground leading-relaxed">
          {question.question_type === 'fill_blank' ? (
            <FillBlankQuestion
              question={question}
              answer={currentAnswer as Record<string, string> | undefined}
              onChange={(val) => handleChange(val)}
              disabled={disabled}
              showAnswer={showAnswer}
            />
          ) : (
            <SafeHtml html={question.question_text} />
          )}
        </div>

        {/* صورة */}
        {question.has_image && question.image_url && (
          <div className="rounded-lg overflow-hidden border border-border">
            <img
              src={question.image_url}
              alt={question.image_description || 'صورة السؤال'}
              className="max-w-full h-auto"
            />
          </div>
        )}

        {/* جدول */}
        {(question.has_table || question.table_data) && question.table_data && (
          <TableQuestion
            tableData={question.table_data}
            answer={currentAnswer as Record<string, string> | undefined}
            onChange={(val) => handleChange(val)}
            disabled={disabled}
            showAnswer={showAnswer}
          />
        )}

        {/* كود */}
        {question.has_code && question.code_content && (
          <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg text-sm overflow-x-auto" dir="ltr">
            <code>{question.code_content}</code>
          </pre>
        )}

        {/* مخزن الكلمات */}
        {question.word_bank && question.word_bank.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-base font-bold mb-3 text-foreground">مخزن الكلمات:</p>
            <div className="p-3 bg-accent/50 rounded-lg border border-border">
              <div className="flex flex-wrap gap-2">
                {question.word_bank.map((word: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-sm px-3 py-1 bg-background">
                    {word}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* حقول الإجابة حسب نوع السؤال */}
        {question.question_type === 'multiple_choice' && (
          <MultipleChoiceQuestion
            question={question}
            answer={currentAnswer as string | undefined}
            onChange={(val) => handleChange(val)}
            disabled={disabled}
            showAnswer={showAnswer}
          />
        )}

        {(question.question_type === 'true_false' || question.question_type === 'true_false_multi') && (
          <TrueFalseQuestion
            question={question}
            answer={currentAnswer as string | undefined}
            onChange={(val) => handleChange(val)}
            disabled={disabled}
            showAnswer={showAnswer}
          />
        )}

        {(question.question_type === 'open_ended' || 
          question.question_type === 'calculation' || 
          question.question_type === 'cli_command' ||
          question.question_type === 'diagram_based') && (
          <OpenEndedQuestion
            questionType={question.question_type}
            answer={currentAnswer as string | undefined}
            onChange={(val) => handleChange(val)}
            disabled={disabled}
          />
        )}

        {/* Fallback: عرض Textarea للأسئلة التي ليس لها مساحة إجابة */}
        <FallbackAnswerArea
          question={question}
          currentAnswer={currentAnswer}
          handleChange={handleChange}
          disabled={disabled}
          showAnswer={showAnswer}
        />

        {/* الأسئلة الفرعية */}
        {question.sub_questions && question.sub_questions.length > 0 && (
          <div className="mr-4 border-r-2 border-muted pr-4 space-y-4">
            {question.sub_questions.map((subQ, index) => (
              <BagrutQuestionRenderer
                key={subQ.question_db_id || index}
                question={subQ}
                answers={answers}  // ← تمرير كل الإجابات - كل سؤال فرعي يستخرج إجابته
                onAnswerChange={onAnswerChange}
                showAnswer={showAnswer}
                disabled={disabled}
              />
            ))}
          </div>
        )}

        {/* عرض الإجابة الصحيحة */}
        {showAnswer && question.correct_answer && (
          <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/30">
            <span className="font-medium text-primary">الإجابة الصحيحة: </span>
            <SafeHtml html={question.correct_answer} />
            {question.answer_explanation && (
              <div className="mt-2">
                <span className="font-medium text-primary">الشرح: </span>
                <SafeHtml html={question.answer_explanation} className="text-muted-foreground mt-1" />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// مكون أسئلة الاختيار من متعدد
function MultipleChoiceQuestion({
  question,
  answer,
  onChange,
  disabled,
  showAnswer,
}: {
  question: ParsedQuestion;
  answer: string | undefined;
  onChange: (value: string) => void;
  disabled: boolean;
  showAnswer: boolean;
}) {
  const choices = question.choices || [];
  const questionId = question.question_db_id || question.question_number;  // ← id فريد

  return (
    <RadioGroup
      value={answer || ''}
      onValueChange={onChange}
      disabled={disabled}
      className="space-y-2"
    >
      {choices.map((choice: any, index: number) => {
        const isCorrect = showAnswer && (
          choice.is_correct ||
          choice.id === question.correct_answer ||
          choice.text === question.correct_answer
        );
        const isSelected = answer === choice.id || answer === choice.text;
        const choiceId = `choice-${questionId}-${index}`;  // ← id فريد لكل سؤال

        return (
          <label
            key={choice.id || index}
            className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
              isSelected
                ? 'border-primary bg-primary/5'
                : 'border-border hover:bg-accent/50'
            } ${isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-950/30' : ''}`}
          >
            <RadioGroupItem value={choice.id || choice.text} id={choiceId} />
            <SafeHtml html={choice.text} className="flex-1" />
            {showAnswer && isCorrect && (
              <Badge variant="default" className="bg-green-500">صحيح</Badge>
            )}
          </label>
        );
      })}
    </RadioGroup>
  );
}

// مكون أسئلة صح/خطأ
function TrueFalseQuestion({
  question,
  answer,
  onChange,
  disabled,
  showAnswer,
}: {
  question: ParsedQuestion;
  answer: string | undefined;
  onChange: (value: string) => void;
  disabled: boolean;
  showAnswer: boolean;
}) {
  const options = [
    { value: 'صح', label: 'صح ✓' },
    { value: 'خطأ', label: 'خطأ ✗' },
  ];
  const questionId = question.question_db_id || question.question_number;  // ← id فريد

  return (
    <RadioGroup
      value={answer || ''}
      onValueChange={onChange}
      disabled={disabled}
      className="flex gap-4"
    >
      {options.map((option) => {
        const isCorrect = showAnswer && question.correct_answer === option.value;
        const isSelected = answer === option.value;
        const optionId = `tf-${questionId}-${option.value}`;  // ← id فريد لكل سؤال

        return (
          <label
            key={option.value}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg border p-4 cursor-pointer transition-colors ${
              isSelected
                ? 'border-primary bg-primary/5'
                : 'border-border hover:bg-accent/50'
            } ${isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-950/30' : ''}`}
          >
            <RadioGroupItem value={option.value} id={optionId} />
            <span className="font-medium">{option.label}</span>
          </label>
        );
      })}
    </RadioGroup>
  );
}

// مكون الأسئلة المفتوحة
function OpenEndedQuestion({
  questionType,
  answer,
  onChange,
  disabled,
}: {
  questionType: string;
  answer: string | undefined;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const placeholder = {
    open_ended: 'اكتب إجابتك هنا...',
    calculation: 'اكتب الحل...',
    cli_command: 'اكتب الأمر...',
    diagram_based: 'صف المخطط أو اكتب الإجابة...',
  }[questionType] || 'اكتب إجابتك...';

  return (
    <Textarea
      value={answer || ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      className="min-h-[120px] resize-y"
      dir={questionType === 'cli_command' ? 'ltr' : 'rtl'}
    />
  );
}

// مكون أسئلة إكمال الفراغ
function FillBlankQuestion({
  question,
  answer,
  onChange,
  disabled,
  showAnswer,
}: {
  question: ParsedQuestion;
  answer: Record<string, string> | string | undefined;
  onChange: (value: Record<string, string> | string) => void;
  disabled: boolean;
  showAnswer: boolean;
}) {
  // Strip HTML tags but preserve line breaks from block elements
  const stripHtml = (html: string): string => {
    let processed = html
      .replace(/<\/p>\s*<p[^>]*>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/div>\s*<div[^>]*>/gi, '\n')
      .replace(/<\/(p|div|h[1-6]|li)>/gi, '\n');
    const tmp = document.createElement('div');
    tmp.innerHTML = processed;
    const text = tmp.textContent || tmp.innerText || html;
    return text.replace(/\n{3,}/g, '\n\n').trim();
  };
  const text = stripHtml(question.question_text);
  const blanks = question.blanks || [];
  
  // تحديد الفراغات في النص
  const pattern = /(\[(?:BLANK|فراغ):(\d+)\])|(_+|\.{3,}|…+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let blankCounter = 0;
  let match;

  // فحص إذا كان النص يحتوي على markers للفراغات
  const hasMarkers = pattern.test(text);
  pattern.lastIndex = 0; // إعادة تعيين الـ regex بعد test

  const handleBlankChange = (blankId: string, value: string) => {
    if (typeof answer === 'string') {
      onChange({ [blankId]: value });
    } else {
      onChange({ ...(answer || {}), [blankId]: value });
    }
  };

  // إذا لم يحتوي النص على markers - نعرض Textarea كـ fallback
  if (!hasMarkers) {
    const textAnswer = typeof answer === 'string' ? answer : (answer as Record<string, string>)?.['1'] || '';
    return (
      <div className="space-y-3">
        <p className="text-foreground whitespace-pre-wrap">{text}</p>
        <Textarea
          value={textAnswer}
          onChange={(e) => onChange({ '1': e.target.value })}
          disabled={disabled}
          placeholder="اكتب إجابتك هنا..."
          className="min-h-[120px] resize-y"
        />
        {showAnswer && question.correct_answer && (
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/30">
            <span className="font-medium text-primary">الإجابة الصحيحة: </span>
            <pre className="text-foreground whitespace-pre-wrap mt-1" dir="ltr">{question.correct_answer}</pre>
          </div>
        )}
      </div>
    );
  }

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>);
    }

    blankCounter++;
    const blankId = match[2] || String(blankCounter);
    const blankDef = blanks.find((b: any) => b.id === blankId) || blanks[blankCounter - 1];
    const answerRecord = typeof answer === 'object' ? answer : {};
    const currentValue = answerRecord?.[blankId] || '';

    const MAX_BLANK_LENGTH = 40;
    const placeholderText = blankDef?.placeholder || `فراغ ${blankId}`;
    // العرض الديناميكي: يكبر مع النص لكن لا يتجاوز 40 حرف
    const displayLength = Math.max(
      8, // حد أدنى لعرض الـ placeholder
      Math.min(MAX_BLANK_LENGTH, currentValue.length + 2),
      placeholderText.length
    );

    parts.push(
      <span key={`blank-${blankCounter}`} className="inline-block mx-1 align-middle">
        {showAnswer && blankDef?.correct_answer ? (
          <span className="px-2 py-1 bg-primary/10 border-b-2 border-primary text-primary font-medium rounded">
            {blankDef.correct_answer}
          </span>
        ) : (
          <Input
            type="text"
            value={currentValue}
            onChange={(e) => handleBlankChange(blankId, e.target.value.slice(0, MAX_BLANK_LENGTH))}
            disabled={disabled}
            maxLength={MAX_BLANK_LENGTH}
            size={displayLength}
            style={{ width: `${displayLength + 2}ch` }}
            className="inline-block px-2 py-1 h-8 text-center transition-[width] duration-150 ease-out"
            placeholder={placeholderText}
            title={`الحد الأقصى ${MAX_BLANK_LENGTH} حرف`}
          />
        )}
      </span>
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(<span key="text-end">{text.slice(lastIndex)}</span>);
  }

  return <div className="leading-10 whitespace-pre-wrap">{parts}</div>;
}

// مكون أسئلة الجدول
function TableQuestion({
  tableData,
  answer,
  onChange,
  disabled,
  showAnswer,
}: {
  tableData: any;
  answer: Record<string, string> | undefined;
  onChange: (value: Record<string, string>) => void;
  disabled: boolean;
  showAnswer: boolean;
}) {
  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const key = `${rowIndex}-${colIndex}`;
    onChange({ ...(answer || {}), [key]: value });
  };

  const isInputCell = (cell: string, colIndex: number) => {
    const inputIndicators = ['?', '؟', '', '_', '___', '...', '----'];
    if (tableData.input_columns?.includes(colIndex)) return true;
    return inputIndicators.includes(cell?.trim() || '') || /^[\?\؟\.\_\-\s]+$/.test(cell?.trim() || '');
  };

  return (
    <div className="overflow-x-auto border border-border rounded-lg">
      <table className="min-w-full border-collapse">
        {tableData.headers && (
          <thead>
            <tr className="bg-muted/50">
              {tableData.headers.map((header: string, i: number) => (
                <th key={i} className="border border-border p-2 text-sm font-medium text-center">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {tableData.rows?.map((row: string[], rowIndex: number) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
              {row.map((cell: string, colIndex: number) => (
                <td key={colIndex} className="border border-border p-2 text-sm text-center">
                  {isInputCell(cell, colIndex) ? (
                    showAnswer && tableData.correct_answers?.[rowIndex]?.[colIndex] ? (
                      <span className="px-2 py-1 bg-primary/10 rounded font-medium">
                        {tableData.correct_answers[rowIndex][colIndex]}
                      </span>
                    ) : (
                      <Input
                        type="text"
                        value={answer?.[`${rowIndex}-${colIndex}`] || ''}
                        onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                        disabled={disabled}
                        className="w-full min-w-[80px] h-8 text-center"
                        placeholder="..."
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
  );
}

// مكون Fallback لعرض Textarea للأسئلة بدون مساحة إجابة
function FallbackAnswerArea({
  question,
  currentAnswer,
  handleChange,
  disabled,
  showAnswer,
}: {
  question: ParsedQuestion;
  currentAnswer: string | string[] | Record<string, string> | undefined;
  handleChange: (value: string | string[] | Record<string, string>) => void;
  disabled: boolean;
  showAnswer: boolean;
}) {
  // تحديد إذا كان السؤال له مساحة إجابة
  const hasAnswerComponent = useMemo(() => {
    const type = question.question_type;
    
    // أنواع لها Textarea مباشر
    if (['open_ended', 'calculation', 'cli_command', 'diagram_based'].includes(type)) return true;
    
    // fill_blank لها fallback موجود
    if (type === 'fill_blank') return true;
    
    // MCQ/TF تحتاج خيارات
    if (['multiple_choice', 'true_false', 'true_false_multi'].includes(type)) {
      return (question.choices?.length || 0) >= 2;
    }
    
    // جدول
    if (type === 'fill_table' || question.has_table) {
      return !!question.table_data?.rows?.length;
    }
    
    // matching/ordering - لها مكونات خاصة (نفترض أنها موجودة)
    if (['matching', 'ordering'].includes(type)) return true;
    
    return false;
  }, [question]);

  const hasSubQuestions = (question.sub_questions?.length || 0) > 0;

  // إذا كان للسؤال مساحة إجابة أو أسئلة فرعية، لا نعرض الـ fallback
  if (hasAnswerComponent || hasSubQuestions) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
        <AlertCircle className="h-4 w-4" />
        <span>نوع السؤال غير محدد - اكتب إجابتك أدناه</span>
      </div>
      <Textarea
        value={currentAnswer as string || ''}
        onChange={(e) => handleChange(e.target.value)}
        disabled={disabled}
        placeholder="اكتب إجابتك هنا..."
        className="min-h-[120px] resize-y"
      />
      {showAnswer && question.correct_answer && (
        <div className="p-3 bg-primary/10 rounded-lg border border-primary/30">
          <span className="font-medium text-primary">الإجابة الصحيحة: </span>
          <span className="text-foreground">{question.correct_answer}</span>
        </div>
      )}
    </div>
  );
}
