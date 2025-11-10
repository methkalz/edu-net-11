// ============================================
// VECTOR EMBEDDING UTILITIES (TF-IDF + Feature Hashing + N-grams)
// Shared across multiple edge functions
// ============================================

import { filterStopwords } from './stopwords.ts';

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
 * Generate n-grams from an array of words
 * @param words - Array of words
 * @param n - N-gram size (default: 2 for bigrams)
 * @returns Array of n-grams
 */
export function generateNGrams(words: string[], n: number = 2): string[] {
  const ngrams: string[] = [];
  
  // Add individual words (unigrams)
  ngrams.push(...words);
  
  // Add n-grams
  for (let i = 0; i <= words.length - n; i++) {
    const ngram = words.slice(i, i + n).join(' ');
    ngrams.push(ngram);
  }
  
  return ngrams;
}

/**
 * Extract top keywords from text for Jaccard similarity
 * @param text - Input text
 * @param maxKeywords - Maximum number of keywords to extract (default: 150)
 * @returns Array of top keywords
 */
export function extractTopKeywords(text: string, maxKeywords: number = 150): string[] {
  const normalized = normalizeArabicText(text);
  const words = normalized.split(/\s+/).filter(w => w.length > 2);
  
  // Remove stopwords
  const filteredWords = filterStopwords(words);
  
  // Calculate term frequency
  const termFrequency = new Map<string, number>();
  for (const word of filteredWords) {
    termFrequency.set(word, (termFrequency.get(word) || 0) + 1);
  }
  
  // Sort by frequency and take top N
  return Array.from(termFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
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
 * Generate embedding vector from text using TF-IDF + Feature Hashing + N-grams
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
  
  // Remove stopwords BEFORE processing
  const filteredWords = filterStopwords(words);
  
  if (filteredWords.length === 0) {
    return new Array(targetDim).fill(0);
  }
  
  // Generate n-grams (includes unigrams + bigrams)
  const ngrams = generateNGrams(filteredWords, 2);
  
  // Calculate Term Frequency (TF) for n-grams
  const termFrequency = new Map<string, number>();
  for (const ngram of ngrams) {
    termFrequency.set(ngram, (termFrequency.get(ngram) || 0) + 1);
  }
  
  // Normalize TF
  const totalNGrams = ngrams.length;
  for (const [ngram, count] of termFrequency.entries()) {
    termFrequency.set(ngram, count / totalNGrams);
  }
  
  // Create fixed-size vector using feature hashing
  const vector = new Array(targetDim).fill(0);
  
  for (const [ngram, tf] of termFrequency.entries()) {
    const index = hashString(ngram, targetDim);
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
