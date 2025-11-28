/**
 * Text similarity utilities for Arabic text comparison
 * Uses Jaccard Similarity algorithm for word-based comparison
 */

/**
 * Calculate Jaccard Similarity between two Arabic texts
 * @param text1 First text to compare
 * @param text2 Second text to compare
 * @returns Similarity score between 0 and 1
 */
export function calculateSimilarity(text1: string, text2: string): number {
  // Clean and normalize Arabic text
  const clean = (t: string) => t
    .replace(/[؟.،:!]/g, '') // Remove Arabic punctuation
    .toLowerCase()
    .trim();
  
  const words1 = new Set(clean(text1).split(/\s+/));
  const words2 = new Set(clean(text2).split(/\s+/));
  
  // Calculate Jaccard Similarity: intersection / union
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  
  if (union.size === 0) return 0;
  
  return intersection.size / union.size;
}

/**
 * Find similar questions in existing question bank
 * @param newQuestion The new question text to check
 * @param existingQuestions Array of existing questions
 * @param threshold Similarity threshold (default 0.7 = 70%)
 * @returns Object with found status, matched question, and similarity percentage
 */
export function findSimilarQuestion(
  newQuestion: string,
  existingQuestions: { question_text: string }[],
  threshold = 0.7
): { found: boolean; match?: string; similarity?: number } {
  for (const existing of existingQuestions) {
    const similarity = calculateSimilarity(newQuestion, existing.question_text);
    if (similarity >= threshold) {
      return {
        found: true,
        match: existing.question_text,
        similarity: Math.round(similarity * 100)
      };
    }
  }
  return { found: false };
}
