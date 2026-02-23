/**
 * Normalize Exam Points — Smart Detection
 * 
 * Handles two distinct patterns:
 * 1. "Choose N of M" — all root questions have equal weight, sum > total_points
 *    → Don't change points, set max_questions_to_answer instead
 * 2. Weight mismatch — points don't sum to total_points
 *    → Proportional scaling with 0.5-step rounding, min 0.5, smart remainder distribution
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

/** Get effective weight of a root question (sum of its leaves, or its own points if leaf) */
const getRootQuestionWeight = (q: ParsedQuestion): number => {
  if (q.sub_questions && q.sub_questions.length > 0) {
    return collectLeaves(q.sub_questions).reduce((s, leaf) => s + (leaf.points || 0), 0);
  }
  return q.points || 0;
};

/** Round to nearest 0.5 */
const roundHalf = (n: number): number => Math.round(n * 2) / 2;

// ── Pattern detection ────────────────────────────────────────────────

interface ChooseNofMResult {
  detected: boolean;
  n?: number; // questions to answer
  m?: number; // total questions available
  weightPerQuestion?: number;
}

/**
 * Detect "Choose N of M" pattern:
 * - All root questions have the same effective weight
 * - Leaf sum > total_points
 * - total_points is evenly divisible by the common weight
 */
const detectChooseNofM = (section: ParsedSection): ChooseNofMResult => {
  const roots = section.questions;
  if (roots.length < 2) return { detected: false };

  const weights = roots.map(getRootQuestionWeight);
  const allSame = weights.every(w => w > 0 && w === weights[0]);
  if (!allSame) return { detected: false };

  const leafSum = collectLeaves(roots).reduce((s, q) => s + (q.points || 0), 0);
  if (leafSum <= section.total_points) return { detected: false };

  const w = weights[0];
  const n = section.total_points / w;
  if (!Number.isInteger(n) || n < 1) return { detected: false };

  return { detected: true, n, m: roots.length, weightPerQuestion: w };
};

// ── main ─────────────────────────────────────────────────────────────

export interface NormalizeResult {
  exam: ParsedExam;
  sectionsFixed: number;
  details: Array<{
    sectionNumber: number;
    fixType: 'choose_n_of_m' | 'scaled';
    before: number;
    after: number;
    n?: number;
    m?: number;
  }>;
}

/**
 * Normalize all section leaf-point totals intelligently.
 * Returns a **new** exam object (immutable) + metadata about what changed.
 */
export const normalizeExamPoints = (exam: ParsedExam): NormalizeResult => {
  let sectionsFixed = 0;
  const details: NormalizeResult['details'] = [];

  // Deep-clone the exam so we don't mutate the original
  const cloned: ParsedExam = JSON.parse(JSON.stringify(exam));

  for (const section of cloned.sections) {
    const leaves = collectLeaves(section.questions);
    const currentSum = leaves.reduce((s, q) => s + (q.points || 0), 0);

    // Skip if no points assigned yet or already correct
    if (currentSum === 0 || currentSum === section.total_points) continue;

    // ── Pattern 1: Choose N of M ──
    const chooseResult = detectChooseNofM(section);
    if (chooseResult.detected) {
      section.max_questions_to_answer = chooseResult.n;
      sectionsFixed++;
      details.push({
        sectionNumber: section.section_number,
        fixType: 'choose_n_of_m',
        before: currentSum,
        after: section.total_points,
        n: chooseResult.n,
        m: chooseResult.m,
      });
      continue;
    }

    // ── Pattern 2: Safe proportional scaling ──
    const factor = section.total_points / currentSum;

    // Scale each leaf with minimum 0.5
    for (const leaf of leaves) {
      leaf.points = Math.max(0.5, roundHalf(leaf.points * factor));
    }

    // Calculate remainder
    let newSum = leaves.reduce((s, q) => s + q.points, 0);
    let diff = roundHalf(section.total_points - newSum);

    // Distribute remainder smartly on highest-value questions (in 0.5 steps)
    if (diff !== 0) {
      // Sort by points descending for smart distribution
      const sorted = [...leaves].sort((a, b) => b.points - a.points);
      const step = diff > 0 ? 0.5 : -0.5;
      let iterations = Math.abs(diff / 0.5);

      for (let i = 0; iterations > 0 && i < sorted.length * 3; i++) {
        const target = sorted[i % sorted.length];
        const newVal = target.points + step;
        // Don't go below 0.5 when subtracting
        if (newVal >= 0.5) {
          target.points = roundHalf(newVal);
          iterations--;
        }
      }
    }

    sectionsFixed++;
    details.push({
      sectionNumber: section.section_number,
      fixType: 'scaled',
      before: currentSum,
      after: section.total_points,
    });
  }

  return { exam: cloned, sectionsFixed, details };
};
