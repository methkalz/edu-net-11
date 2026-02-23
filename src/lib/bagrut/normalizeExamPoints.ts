/**
 * Normalize Exam Points
 * Ensures leaf-level question points sum exactly to section.total_points
 * Uses proportional scaling with 0.5-step rounding and remainder correction.
 */

import type { ParsedExam, ParsedQuestion, ParsedSection } from './buildBagrutPreview';

// ── helpers ──────────────────────────────────────────────────────────

/** Collect all leaf questions (no sub_questions) recursively */
const collectLeaves = (questions: ParsedQuestion[]): ParsedQuestion[] => {
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

/** Sum points of leaf questions only */
const sumLeafPoints = (questions: ParsedQuestion[]): number => {
  return collectLeaves(questions).reduce((acc, q) => acc + (Number.isFinite(q.points) ? q.points : 0), 0);
};

/** Round to nearest 0.5 */
const roundHalf = (n: number): number => Math.round(n * 2) / 2;

// ── main ─────────────────────────────────────────────────────────────

export interface NormalizeResult {
  exam: ParsedExam;
  sectionsFixed: number;
  details: Array<{ sectionNumber: number; before: number; after: number }>;
}

/**
 * Normalize all section leaf-point totals to match section.total_points.
 * Returns a **new** exam object (immutable) + metadata about what changed.
 */
export const normalizeExamPoints = (exam: ParsedExam): NormalizeResult => {
  let sectionsFixed = 0;
  const details: NormalizeResult['details'] = [];

  // Deep-clone the exam so we don't mutate the original
  const cloned: ParsedExam = JSON.parse(JSON.stringify(exam));

  for (const section of cloned.sections) {
    const leaves = collectLeaves(section.questions);
    const currentSum = leaves.reduce((s, q) => s + (Number.isFinite(q.points) ? q.points : 0), 0);

    // Skip if no points assigned yet or already correct
    if (currentSum === 0 || currentSum === section.total_points) continue;

    const factor = section.total_points / currentSum;

    // Scale each leaf
    for (const leaf of leaves) {
      leaf.points = roundHalf(leaf.points * factor);
    }

    // Fix rounding remainder on the last leaf
    const newSum = leaves.reduce((s, q) => s + q.points, 0);
    const remainder = roundHalf(section.total_points - newSum);
    if (remainder !== 0 && leaves.length > 0) {
      leaves[leaves.length - 1].points = roundHalf(leaves[leaves.length - 1].points + remainder);
    }

    sectionsFixed++;
    details.push({
      sectionNumber: section.section_number,
      before: currentSum,
      after: section.total_points,
    });
  }

  return { exam: cloned, sectionsFixed, details };
};
