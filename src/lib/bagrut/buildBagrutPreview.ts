// Enhanced table data with correct answers support
export interface TableData {
  headers?: string[];
  rows?: string[][];
  input_columns?: number[];
  // Correct answers for each input cell: { rowIndex: { colIndex: "answer" } }
  correct_answers?: { [rowIndex: number]: { [colIndex: number]: string } };
}

// Structured blank for fill_blank questions
export interface BlankDefinition {
  id: string;
  placeholder?: string;
  correct_answer: string;
}

export interface ParsedQuestion {
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
  choices?: Array<{ id: string; text: string; is_correct: boolean }>;
  correct_answer?: string;
  answer_explanation?: string;
  sub_questions?: ParsedQuestion[];
  topic_tags?: string[];
  // Structured blanks for fill_blank questions
  blanks?: BlankDefinition[];
  // Generic structured answers for complex types (matching/ordering/...) or future extensions
  correct_answer_data?: any;
  // DB ID for updates (only present for exams loaded from database)
  question_db_id?: string;
}

export interface ParsedSection {
  section_number: number;
  section_title: string;
  section_type: 'mandatory' | 'elective';
  total_points: number;
  specialization?: string;
  specialization_label?: string;
  instructions?: string;
  questions: ParsedQuestion[];
  // عدد الأسئلة المطلوب الإجابة عنها (في حالة "اختر N من M")
  max_questions_to_answer?: number;
  // DB ID for updates (only present for exams loaded from database)
  section_db_id?: string;
}

export interface ParsedExam {
  title: string;
  exam_year: number;
  exam_season: string;
  exam_code?: string;
  subject: string;
  duration_minutes: number;
  total_points: number;
  instructions?: string;
  sections: ParsedSection[];
  // DB ID for updates (only present for exams loaded from database)
  exam_db_id?: string;
  // نوع هيكل الامتحان: standard = إلزامي + اختياري، all_mandatory = جميع الأقسام إلزامية
  exam_structure_type?: 'standard' | 'all_mandatory';
}

export interface Statistics {
  totalSections: number;
  totalQuestions: number;
  questionsByType: Record<string, number>;
  totalPoints: number;
}

type ExamRow = {
  id: string;
  title: string;
  exam_year: number;
  exam_season: string;
  exam_code: string | null;
  subject: string;
  duration_minutes: number | null;
  total_points: number | null;
  instructions: string | null;
  exam_structure_type: string | null;
};

type SectionRow = {
  id: string;
  section_number: number;
  section_title: string;
  section_type: string;
  total_points: number;
  specialization: string | null;
  specialization_label: string | null;
  instructions: string | null;
  order_index: number | null;
  max_questions_to_answer: number | null;
};

const toSectionType = (value: string): 'mandatory' | 'elective' =>
  value === 'elective' ? 'elective' : 'mandatory';

type QuestionRow = {
  id: string;
  section_id: string | null;
  parent_question_id: string | null;
  order_index: number | null;
  question_number: string;
  question_text: string;
  question_type: string;
  points: number;
  has_image: boolean | null;
  image_url: string | null;
  image_alt_text: string | null;
  has_table: boolean | null;
  table_data: any;
  has_code: boolean | null;
  code_content: string | null;
  choices: any;
  correct_answer: string | null;
  correct_answer_data: any;
  answer_explanation: string | null;
  topic_tags: string[] | null;
};

const sortByOrderIndex = <T extends { order_index: number | null }>(items: T[]) => {
  return [...items].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
};

const buildQuestionTree = (rows: QuestionRow[]): ParsedQuestion[] => {
  const byId = new Map<string, ParsedQuestion & { __id: string; __parent: string | null; __order: number }>();
  const children = new Map<string, Array<ParsedQuestion & { __id: string; __parent: string | null; __order: number }>>();

  for (const r of rows) {
    const correctAnswerData = (r as any).correct_answer_data ?? undefined;
    const blanksFromDb = correctAnswerData?.blanks as BlankDefinition[] | undefined;
    const wordBankFromDb = correctAnswerData?.word_bank as string[] | undefined;

    byId.set(r.id, {
      __id: r.id,
      __parent: r.parent_question_id,
      __order: r.order_index ?? 0,
      question_number: r.question_number,
      question_text: r.question_text,
      question_type: r.question_type,
      points: r.points,
      has_image: !!r.has_image,
      image_description: r.image_alt_text ?? undefined,
      image_url: r.image_url ?? undefined,
      has_table: !!r.has_table,
      table_data: r.table_data ?? undefined,
      has_code: !!r.has_code,
      code_content: r.code_content ?? undefined,
      choices: (r.choices as any) ?? undefined,
      correct_answer: r.correct_answer ?? undefined,
      correct_answer_data: correctAnswerData,
      answer_explanation: r.answer_explanation ?? undefined,
      topic_tags: r.topic_tags ?? undefined,
      blanks: blanksFromDb,
      word_bank: wordBankFromDb,
      sub_questions: [],
      // Add DB ID for updates
      question_db_id: r.id
    });
  }

  for (const q of byId.values()) {
    const parentId = q.__parent;
    if (!parentId) continue;
    const arr = children.get(parentId) || [];
    arr.push(q);
    children.set(parentId, arr);
  }

  const attach = (node: ParsedQuestion & { __id: string; __order: number }) => {
    const kids = children.get(node.__id) || [];
    kids.sort((a, b) => a.__order - b.__order);
    node.sub_questions = kids.map((k) => {
      attach(k);
      // strip internal fields but keep question_db_id
      const { __id, __parent, __order, ...clean } = k as any;
      return clean as ParsedQuestion;
    });
  };

  const roots = [...byId.values()].filter((q) => !q.__parent);
  roots.sort((a, b) => a.__order - b.__order);

  return roots.map((r) => {
    attach(r);
    // strip internal fields but keep question_db_id
    const { __id, __parent, __order, ...clean } = r as any;
    return clean as ParsedQuestion;
  });
};

const countQuestionsRecursive = (questions: ParsedQuestion[]): number => {
  return questions.reduce((acc, q) => {
    const sub = q.sub_questions ? countQuestionsRecursive(q.sub_questions) : 0;
    return acc + 1 + sub;
  }, 0);
};

/**
 * حساب العلامات من الأسئلة "الطرفية" فقط (Leaf-Only)
 * - إذا كان للسؤال أسئلة فرعية → نحسب الفرعية فقط (لا نضيف علامة الأب)
 * - إذا لم يكن له فرعية → نحسب علامته
 * هذا يمنع الحساب المزدوج
 */
const sumPointsLeafOnly = (questions: ParsedQuestion[]): number => {
  return questions.reduce((acc, q) => {
    if (q.sub_questions && q.sub_questions.length > 0) {
      // للسؤال أسئلة فرعية → نحسب الفرعية فقط (لا نضيف علامة الأب)
      return acc + sumPointsLeafOnly(q.sub_questions);
    }
    // سؤال طرفي (بدون فرعية) → نحسب علامته
    return acc + (Number.isFinite(q.points) ? q.points : 0);
  }, 0);
};

const tallyTypesRecursive = (questions: ParsedQuestion[], acc: Record<string, number>) => {
  for (const q of questions) {
    acc[q.question_type] = (acc[q.question_type] || 0) + 1;
    if (q.sub_questions?.length) tallyTypesRecursive(q.sub_questions, acc);
  }
};

export const buildBagrutPreviewFromDb = (args: {
  exam: ExamRow;
  sections: SectionRow[];
  questions: QuestionRow[];
}): { exam: ParsedExam; statistics: Statistics } => {
  const { exam, sections, questions } = args;

  const sortedSections: Array<{
    id: string;
    section_number: number;
    section_title: string;
    section_type: 'mandatory' | 'elective';
    total_points: number;
    specialization?: string;
    specialization_label?: string;
    instructions?: string;
    max_questions_to_answer?: number;
  }> = sortByOrderIndex(sections).map((s) => ({
    id: s.id,
    section_number: s.section_number,
    section_title: s.section_title,
    section_type: toSectionType(s.section_type),
    total_points: s.total_points,
    specialization: s.specialization ?? undefined,
    specialization_label: s.specialization_label ?? undefined,
    instructions: s.instructions ?? undefined,
    max_questions_to_answer: s.max_questions_to_answer ?? undefined,
  }));

  const sectionsWithQuestions: ParsedSection[] = sortedSections.map((s): ParsedSection => {
    const sectionQuestions = questions.filter((q) => q.section_id === s.id);
    return {
      section_number: s.section_number,
      section_title: s.section_title,
      section_type: s.section_type,
      total_points: s.total_points,
      specialization: s.specialization,
      specialization_label: s.specialization_label,
      instructions: s.instructions,
      max_questions_to_answer: s.max_questions_to_answer,
      questions: buildQuestionTree(sectionQuestions),
      section_db_id: s.id
    };
  });

  // تحديد نوع هيكل الامتحان
  const examStructureType: 'standard' | 'all_mandatory' = 
    (exam.exam_structure_type === 'all_mandatory') ? 'all_mandatory' : 'standard';

  const parsedExam: ParsedExam = {
    title: exam.title,
    exam_year: exam.exam_year,
    exam_season: exam.exam_season,
    exam_code: exam.exam_code ?? undefined,
    subject: exam.subject,
    duration_minutes: exam.duration_minutes ?? 0,
    total_points: exam.total_points ?? 0,
    instructions: exam.instructions ?? undefined,
    sections: sectionsWithQuestions,
    // Add DB ID for updates
    exam_db_id: exam.id,
    // نوع هيكل الامتحان
    exam_structure_type: examStructureType
  };

  const questionsByType: Record<string, number> = {};
  let totalQuestions = 0;

  // حساب المجموع باستخدام العلامات الرسمية للأقسام
  let mandatoryPoints = 0;
  let maxElectivePoints = 0;

  for (const s of sectionsWithQuestions) {
    totalQuestions += countQuestionsRecursive(s.questions);
    tallyTypesRecursive(s.questions, questionsByType);
    
    // استخدام section.total_points الرسمي بدلاً من جمع الأسئلة
    if (s.section_type === 'mandatory') {
      mandatoryPoints += s.total_points;
    } else if (s.section_type === 'elective') {
      // الطالب يختار تخصص واحد فقط → نأخذ الأعلى
      maxElectivePoints = Math.max(maxElectivePoints, s.total_points);
    }
  }

  // حساب المجموع حسب نوع الهيكل
  let totalPoints: number;
  if (examStructureType === 'all_mandatory') {
    // جميع الأقسام إلزامية - جمع كل الأقسام
    totalPoints = mandatoryPoints;
  } else {
    // الهيكل القياسي: إلزامي + أعلى تخصص = 60 + 40 = 100
    totalPoints = mandatoryPoints + maxElectivePoints;
  }

  const statistics: Statistics = {
    totalSections: sectionsWithQuestions.length,
    totalQuestions,
    questionsByType,
    totalPoints
  };

  return { exam: parsedExam, statistics };
};
