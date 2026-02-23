/**
 * Exam Integrity Check Engine
 * Analyzes a ParsedExam for structural issues, duplicates, and data integrity problems.
 * Runs entirely on local state — no DB queries needed.
 */

import type { ParsedExam, ParsedQuestion, ParsedSection } from './buildBagrutPreview';

export interface IntegrityIssue {
  level: 'critical' | 'warning' | 'info';
  category: string;
  message: string;
  details?: string;
}

export interface IntegrityReport {
  issues: IntegrityIssue[];
  summary: { critical: number; warnings: number; info: number };
  passed: boolean;
}

// ── helpers ──────────────────────────────────────────────────────────

/** Strip HTML tags and decode common entities to get clean readable text */
const stripHtml = (html: string): string => {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|tr)>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const collectLeafQuestions = (questions: ParsedQuestion[]): ParsedQuestion[] => {
  const leaves: ParsedQuestion[] = [];
  const walk = (qs: ParsedQuestion[]) => {
    for (const q of qs) {
      if (q.sub_questions && q.sub_questions.length > 0) {
        walk(q.sub_questions);
      } else {
        leaves.push(q);
      }
    }
  };
  walk(questions);
  return leaves;
};

const countAll = (questions: ParsedQuestion[]): number => {
  return questions.reduce((n, q) => n + 1 + (q.sub_questions ? countAll(q.sub_questions) : 0), 0);
};

const sumLeafPoints = (questions: ParsedQuestion[]): number => {
  return questions.reduce((acc, q) => {
    if (q.sub_questions && q.sub_questions.length > 0) return acc + sumLeafPoints(q.sub_questions);
    return acc + (Number.isFinite(q.points) ? q.points : 0);
  }, 0);
};

// ── checks ───────────────────────────────────────────────────────────

/** 1. Duplicate sub-question text across different parents */
const checkDuplicateSubQuestions = (sections: ParsedSection[]): IntegrityIssue[] => {
  const issues: IntegrityIssue[] = [];
  for (const sec of sections) {
    // Map: normalized text → array of parent question_numbers
    const textToParents = new Map<string, string[]>();

    const walkParent = (parentNum: string, subs: ParsedQuestion[]) => {
      for (const sub of subs) {
        const norm = stripHtml(sub.question_text);
        if (norm.length < 5) continue; // skip trivially short
        const arr = textToParents.get(norm) || [];
        arr.push(parentNum);
        textToParents.set(norm, arr);
        if (sub.sub_questions?.length) walkParent(sub.question_number, sub.sub_questions);
      }
    };

    for (const q of sec.questions) {
      if (q.sub_questions?.length) walkParent(q.question_number, q.sub_questions);
    }

    for (const [text, parents] of textToParents) {
      const unique = [...new Set(parents)];
      if (unique.length > 1) {
        issues.push({
          level: 'critical',
          category: 'أسئلة فرعية مكررة',
          message: `نص فرعي مكرر تحت الأسئلة: ${unique.join('، ')}`,
          details: `القسم ${sec.section_number} — "${text.slice(0, 80)}${text.length > 80 ? '…' : ''}"`
        });
      }
    }
  }
  return issues;
};

/** 2. Question numbering gaps / duplicates (root-level per section) */
const checkNumbering = (sections: ParsedSection[]): IntegrityIssue[] => {
  const issues: IntegrityIssue[] = [];
  for (const sec of sections) {
    const nums = sec.questions.map(q => q.question_number);
    const seen = new Set<string>();
    for (const n of nums) {
      if (seen.has(n)) {
        issues.push({
          level: 'critical',
          category: 'ترقيم مكرر',
          message: `رقم السؤال "${n}" مكرر في القسم ${sec.section_number}`,
          details: sec.section_title
        });
      }
      seen.add(n);
    }
    // Check for numeric gaps
    const numeric = nums.map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b);
    for (let i = 1; i < numeric.length; i++) {
      if (numeric[i] - numeric[i - 1] > 1) {
        issues.push({
          level: 'critical',
          category: 'فجوة في الترقيم',
          message: `فجوة بين السؤال ${numeric[i - 1]} و ${numeric[i]} في القسم ${sec.section_number}`,
          details: sec.section_title
        });
      }
    }
  }
  return issues;
};

/** 3. MCQ missing choices */
const checkMcqChoices = (sections: ParsedSection[]): IntegrityIssue[] => {
  const issues: IntegrityIssue[] = [];
  const walk = (qs: ParsedQuestion[], secNum: number) => {
    for (const q of qs) {
      if (q.question_type === 'multiple_choice') {
        if (!q.choices || q.choices.length === 0) {
          issues.push({
            level: 'critical',
            category: 'خيارات ناقصة',
            message: `سؤال ${q.question_number} (اختيار من متعدد) بدون خيارات`,
            details: `القسم ${secNum}`
          });
        }
      }
      if (q.sub_questions?.length) walk(q.sub_questions, secNum);
    }
  };
  for (const sec of sections) walk(sec.questions, sec.section_number);
  return issues;
};

/** 4. MCQ missing correct answer */
const checkMcqCorrectAnswer = (sections: ParsedSection[]): IntegrityIssue[] => {
  const issues: IntegrityIssue[] = [];
  const walk = (qs: ParsedQuestion[], secNum: number) => {
    for (const q of qs) {
      if (q.question_type === 'multiple_choice' && q.choices && q.choices.length > 0) {
        const hasCorrect = q.choices.some(c => c.is_correct);
        if (!hasCorrect && !q.correct_answer) {
          issues.push({
            level: 'warning',
            category: 'إجابة صحيحة مفقودة',
            message: `سؤال ${q.question_number} (MCQ) بدون تحديد إجابة صحيحة`,
            details: `القسم ${secNum}`
          });
        }
      }
      if (q.sub_questions?.length) walk(q.sub_questions, secNum);
    }
  };
  for (const sec of sections) walk(sec.questions, sec.section_number);
  return issues;
};

/** 5. multi_part with no sub-questions */
const checkMultiPartEmpty = (sections: ParsedSection[]): IntegrityIssue[] => {
  const issues: IntegrityIssue[] = [];
  const walk = (qs: ParsedQuestion[], secNum: number) => {
    for (const q of qs) {
      if (q.question_type === 'multi_part' && (!q.sub_questions || q.sub_questions.length === 0)) {
        issues.push({
          level: 'warning',
          category: 'سؤال متعدد فارغ',
          message: `سؤال ${q.question_number} من نوع multi_part بدون أسئلة فرعية`,
          details: `القسم ${secNum}`
        });
      }
      if (q.sub_questions?.length) walk(q.sub_questions, secNum);
    }
  };
  for (const sec of sections) walk(sec.questions, sec.section_number);
  return issues;
};

/** 6. Section points mismatch */
const checkSectionPoints = (sections: ParsedSection[]): IntegrityIssue[] => {
  const issues: IntegrityIssue[] = [];
  for (const sec of sections) {
    const calculated = sumLeafPoints(sec.questions);
    if (calculated !== sec.total_points && calculated > 0) {
      issues.push({
        level: 'warning',
        category: 'مجموع العلامات',
        message: `القسم ${sec.section_number}: مجموع علامات الأسئلة (${calculated}) ≠ المعلن (${sec.total_points})`,
        details: sec.section_title
      });
    }
  }
  return issues;
};

/** 7. Empty question text */
const checkEmptyText = (sections: ParsedSection[]): IntegrityIssue[] => {
  const issues: IntegrityIssue[] = [];
  const walk = (qs: ParsedQuestion[], secNum: number) => {
    for (const q of qs) {
      const cleanText = stripHtml(q.question_text || '');
      if (!cleanText || cleanText.length === 0) {
        issues.push({
          level: 'critical',
          category: 'نص فارغ',
          message: `سؤال ${q.question_number} بدون نص`,
          details: `القسم ${secNum}`
        });
      }
      if (q.sub_questions?.length) walk(q.sub_questions, secNum);
    }
  };
  for (const sec of sections) walk(sec.questions, sec.section_number);
  return issues;
};

/** 8. Zero-point leaf questions */
const checkZeroPoints = (sections: ParsedSection[]): IntegrityIssue[] => {
  const issues: IntegrityIssue[] = [];
  for (const sec of sections) {
    const leaves = collectLeafQuestions(sec.questions);
    for (const q of leaves) {
      if (q.points === 0) {
        issues.push({
          level: 'info',
          category: 'علامات صفرية',
          message: `سؤال ${q.question_number} بـ 0 علامات`,
          details: `القسم ${sec.section_number}`
        });
      }
    }
  }
  return issues;
};

/** 9. Question count summary per section */
const buildSummaryInfo = (sections: ParsedSection[]): IntegrityIssue[] => {
  return sections.map(sec => {
    const total = countAll(sec.questions);
    const roots = sec.questions.length;
    const subs = total - roots;
    return {
      level: 'info' as const,
      category: 'ملخص الأسئلة',
      message: `القسم ${sec.section_number}: ${roots} أسئلة رئيسية${subs > 0 ? ` + ${subs} فرعية` : ''}`,
      details: sec.section_title
    };
  });
};

// ── main ─────────────────────────────────────────────────────────────

export const runIntegrityCheck = (exam: ParsedExam): IntegrityReport => {
  const issues: IntegrityIssue[] = [
    ...checkDuplicateSubQuestions(exam.sections),
    ...checkNumbering(exam.sections),
    ...checkEmptyText(exam.sections),
    ...checkMcqChoices(exam.sections),
    ...checkMcqCorrectAnswer(exam.sections),
    ...checkMultiPartEmpty(exam.sections),
    ...checkSectionPoints(exam.sections),
    ...checkZeroPoints(exam.sections),
    ...buildSummaryInfo(exam.sections),
  ];

  const summary = {
    critical: issues.filter(i => i.level === 'critical').length,
    warnings: issues.filter(i => i.level === 'warning').length,
    info: issues.filter(i => i.level === 'info').length,
  };

  return { issues, summary, passed: summary.critical === 0 };
};
