// مكونات مشتركة لتنسيق إجابات البجروت (الطالب + المعلم)
// تأخذ سؤال (DB row أو ParsedQuestion) وتعرض إجابة الطالب / الإجابة الصحيحة
import React from 'react';
import SafeHtml from '@/components/bagrut/SafeHtml';

type AnyQuestion = {
  question_type?: string;
  choices?: any;
  table_data?: any;
  correct_answer?: string | null;
  correct_answer_data?: any;
  blanks?: any[];
};

// استخراج الفراغات من السؤال (تأتي إما مباشرة أو ضمن correct_answer_data)
function getBlanks(question: AnyQuestion): any[] {
  if (Array.isArray(question.blanks) && question.blanks.length > 0) return question.blanks;
  const fromData = question.correct_answer_data?.blanks;
  if (Array.isArray(fromData) && fromData.length > 0) return fromData;
  return [];
}

// ====== تنسيق إجابة الطالب ======
export function formatStudentAnswer(question: AnyQuestion, answer: any): React.ReactNode {
  const value = answer?.answer;
  if (value === undefined || value === null || value === '') {
    return <span className="text-muted-foreground italic">لم تجب</span>;
  }

  const choices = Array.isArray(question.choices) ? question.choices : [];

  // 1. جداول
  if (question.question_type === 'fill_table' && typeof value === 'object' && question.table_data) {
    const tableData = question.table_data;
    if (!tableData.rows || !tableData.headers) {
      return <span className="text-muted-foreground">إجابة جدول غير صالحة</span>;
    }
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm mt-2">
          <thead>
            <tr>
              {tableData.headers.map((h: string, i: number) => (
                <th key={i} className="border p-2 bg-muted/30 text-right text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.rows.map((row: string[], rowIdx: number) => (
              <tr key={rowIdx}>
                {row.map((cell: string, colIdx: number) => {
                  const isInput = tableData.input_columns?.includes(colIdx);
                  const studentAnswer =
                    value[`${rowIdx}-${colIdx}`] || value[`cell_${rowIdx}_${colIdx}`];
                  return (
                    <td key={colIdx} className="border p-2 text-xs">
                      {isInput ? (
                        <span className="font-medium text-primary bg-primary/10 px-1 rounded">
                          {studentAnswer || '—'}
                        </span>
                      ) : cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // 2. ملء الفراغات
  if (question.question_type === 'fill_blank' && typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return <span className="text-muted-foreground italic">لم تجب</span>;
    }
    return (
      <div className="space-y-1">
        {entries.map(([blankId, ans], idx) => (
          <div key={blankId} className="flex gap-2 text-sm">
            <span className="text-muted-foreground">فراغ {idx + 1}:</span>
            <span className="font-medium">{String(ans) || '—'}</span>
          </div>
        ))}
      </div>
    );
  }

  // 3. MCQ
  if ((question.question_type === 'mcq' || question.question_type === 'multiple_choice') && choices.length > 0) {
    const strValue = String(value).trim().toLowerCase();
    let matchedChoice = choices.find(
      (c: any) =>
        String(c.id).toLowerCase() === strValue ||
        String(c.text).trim().toLowerCase() === strValue
    );
    if (!matchedChoice) {
      const numVal = parseInt(String(value));
      if (!isNaN(numVal) && numVal >= 1 && numVal <= choices.length) {
        matchedChoice = choices[numVal - 1];
      }
    }
    if (matchedChoice) {
      const idx = choices.indexOf(matchedChoice) + 1;
      return (
        <span>
          <span className="text-muted-foreground">الخيار {idx}:</span>{' '}
          <span className="font-medium">{matchedChoice.text}</span>
        </span>
      );
    }
  }

  // 4. صح/خطأ
  if (question.question_type === 'true_false') {
    const boolValue = value === true || value === 'true' || value === 'صح' || value === '1';
    return <span className="font-medium">{boolValue ? 'صح ✓' : 'خطأ ✗'}</span>;
  }

  // 5. نص
  if (typeof value === 'string') {
    return <p className="whitespace-pre-wrap break-words">{value}</p>;
  }

  // fallback
  if (typeof value === 'object') {
    return (
      <pre className="text-xs overflow-auto bg-muted/30 p-2 rounded max-h-32" dir="ltr">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }
  return <span>{String(value)}</span>;
}

// ====== تنسيق الإجابة الصحيحة ======
export function formatCorrectAnswer(question: AnyQuestion): React.ReactNode {
  const choices = Array.isArray(question.choices) ? question.choices : [];

  // جداول
  if (question.question_type === 'fill_table' && question.table_data?.correct_answers) {
    const { correct_answers, headers, rows, input_columns } = question.table_data;
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm mt-2">
          <thead>
            <tr>
              {headers?.map((h: string, i: number) => (
                <th key={i} className="border p-2 bg-green-100 dark:bg-green-950/50 text-right text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows?.map((row: string[], rowIdx: number) => (
              <tr key={rowIdx}>
                {row.map((cell: string, colIdx: number) => {
                  const isInput = input_columns?.includes(colIdx);
                  const correctAns =
                    correct_answers?.[`${rowIdx}-${colIdx}`] ||
                    correct_answers?.[`cell_${rowIdx}_${colIdx}`];
                  return (
                    <td key={colIdx} className="border p-2 text-xs">
                      {isInput && correctAns ? (
                        <span className="font-bold text-green-600 dark:text-green-400">{correctAns}</span>
                      ) : cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // فراغات
  const blanks = getBlanks(question);
  if (question.question_type === 'fill_blank' && blanks.length > 0) {
    return (
      <div className="space-y-1">
        {blanks.map((blank: any, i: number) => (
          <div key={blank.id || i} className="flex gap-2 text-sm">
            <span className="text-muted-foreground">فراغ {i + 1}:</span>
            <span className="font-bold text-green-600 dark:text-green-400">{blank.correct_answer}</span>
          </div>
        ))}
      </div>
    );
  }

  // MCQ
  if ((question.question_type === 'mcq' || question.question_type === 'multiple_choice') && choices.length > 0) {
    const correctChoice = choices.find((c: any) => c.is_correct);
    if (correctChoice) {
      const idx = choices.indexOf(correctChoice) + 1;
      return (
        <span>
          <span className="text-muted-foreground">الخيار {idx}:</span>{' '}
          <span className="font-bold text-green-600 dark:text-green-400">{correctChoice.text}</span>
        </span>
      );
    }
  }

  // صح/خطأ
  if (question.question_type === 'true_false') {
    if (question.correct_answer) {
      const ans = String(question.correct_answer).toLowerCase();
      const isTrue = ans === 'true' || ans === 'صح' || ans === '1' || ans === 'صحيح';
      return <span className="font-bold text-green-600 dark:text-green-400">{isTrue ? 'صح ✓' : 'خطأ ✗'}</span>;
    }
    if (choices.length > 0) {
      const correctChoice = choices.find((c: any) => c.is_correct);
      if (correctChoice) {
        const isTrue =
          correctChoice.text === 'صح' ||
          String(correctChoice.id) === '1' ||
          String(correctChoice.id) === 'choice_true' ||
          String(correctChoice.id) === 'true';
        return <span className="font-bold text-green-600 dark:text-green-400">{isTrue ? 'صح ✓' : 'خطأ ✗'}</span>;
      }
    }
  }

  // نص عادي
  if (question.correct_answer) {
    return <SafeHtml html={question.correct_answer} className="font-medium text-green-700 dark:text-green-400" />;
  }

  return null;
}

export function hasCorrectAnswer(question: AnyQuestion): boolean {
  const choices = Array.isArray(question.choices) ? question.choices : [];
  if ((question.question_type === 'mcq' || question.question_type === 'multiple_choice') && choices.length > 0) {
    return choices.some((c: any) => c.is_correct);
  }
  if (question.question_type === 'true_false') {
    if (question.correct_answer) return true;
    if (choices.some((c: any) => c.is_correct)) return true;
    return false;
  }
  if (question.question_type === 'fill_table' && question.table_data?.correct_answers) {
    return Object.keys(question.table_data.correct_answers).length > 0;
  }
  if (question.question_type === 'fill_blank') {
    return getBlanks(question).some((b: any) => b.correct_answer);
  }
  return !!question.correct_answer;
}
