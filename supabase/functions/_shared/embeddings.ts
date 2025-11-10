// ============================================
// VECTOR EMBEDDING UTILITIES (TF-IDF + Feature Hashing)
// Shared across multiple edge functions
// ============================================

/**
 * Normalize Arabic text for comparison
 * Removes diacritics, normalizes letters, and cleans punctuation
 */
export function normalizeArabicText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ًٌٍَُِّْ]/g, '')
    .replace(/[آإأٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^\w\s\u0600-\u06FF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Hash function for feature hashing (dimensionality reduction)
 * Uses simple string hashing to map words to fixed vector dimensions
 */
export function hashString(str: string, maxDim: number): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) % maxDim;
}

/**
 * Generate embedding vector from text using TF-IDF + Feature Hashing
 * This creates a fixed-size vector for efficient similarity search with pgvector
 * 
 * @param text - Input text (will be normalized)
 * @param targetDim - Target vector dimension (default: 384)
 * @returns Array of length targetDim representing the text embedding
 */
export function generateEmbedding(text: string, targetDim: number = 384): number[] {
  const normalized = normalizeArabicText(text);
  const words = normalized.split(/\s+/).filter(w => w.length > 2);
  
  if (words.length === 0) {
    return new Array(targetDim).fill(0);
  }
  
  // Calculate Term Frequency (TF)
  const termFrequency = new Map<string, number>();
  for (const word of words) {
    termFrequency.set(word, (termFrequency.get(word) || 0) + 1);
  }
  
  // Normalize TF
  const totalWords = words.length;
  for (const [word, count] of termFrequency.entries()) {
    termFrequency.set(word, count / totalWords);
  }
  
  // Create fixed-size vector using feature hashing
  const vector = new Array(targetDim).fill(0);
  
  for (const [word, tf] of termFrequency.entries()) {
    const index = hashString(word, targetDim);
    // Use TF as weight (could add IDF if we had document frequency data)
    vector[index] += tf;
  }
  
  // L2 normalization for cosine similarity
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] /= magnitude;
    }
  }
  
  return vector;
}
