import * as fuzzball from 'https://esm.sh/fuzzball@2.2.2';
import { generateEmbedding, normalizeArabicText } from '../_shared/embeddings.ts';

// Re-export for backwards compatibility
export { generateEmbedding };

export interface ExtractedPage {
  page_number: number;
  text: string;
  word_count: number;
}

export interface ExtractedSentence {
  text: string;
  page: number;
  position: number;
}

export interface MatchedSegment {
  source_text: string;
  matched_text: string;
  similarity: number;
  source_page: number;
  matched_page: number;
  source_position: number;
  matched_position: number;
}

// normalizeArabicText is now imported from _shared/embeddings.ts
export { normalizeArabicText } from '../_shared/embeddings.ts';

export function extractSentencesWithPages(text: string, pages?: ExtractedPage[]): ExtractedSentence[] {
  const sentences: ExtractedSentence[] = [];
  
  if (pages && pages.length > 0) {
    pages.forEach((page) => {
      const pageSentences = page.text.split(/[.!?؟\n]+/).filter(s => s.trim().length > 20);
      pageSentences.forEach((sentence, idx) => {
        sentences.push({
          text: sentence.trim(),
          page: page.page_number,
          position: idx,
        });
      });
    });
  } else {
    const allSentences = text.split(/[.!?؟\n]+/).filter(s => s.trim().length > 20);
    allSentences.forEach((sentence, idx) => {
      sentences.push({
        text: sentence.trim(),
        page: Math.floor(idx / 10) + 1,
        position: idx % 10,
      });
    });
  }
  
  return sentences;
}

export function extractMatchingSegments(
  text1: string,
  text2: string,
  pages1?: ExtractedPage[],
  pages2?: ExtractedPage[]
): MatchedSegment[] {
  const segments: MatchedSegment[] = [];
  
  const sentences1 = extractSentencesWithPages(text1, pages1);
  const sentences2 = extractSentencesWithPages(text2, pages2);
  
  // تحسين الأداء: أخذ عينة من الجمل فقط
  const maxSentences = 50;
  const sample1 = sentences1.slice(0, maxSentences);
  const sample2 = sentences2.slice(0, maxSentences);
  
  for (const sent1 of sample1) {
    for (const sent2 of sample2) {
      // التوقف إذا وصلنا لـ 20 segment
      if (segments.length >= 20) break;
      
      const similarity = fuzzball.ratio(
        normalizeArabicText(sent1.text),
        normalizeArabicText(sent2.text)
      ) / 100;
      
      if (similarity > 0.60) {
        segments.push({
          source_text: sent1.text.substring(0, 500),
          matched_text: sent2.text.substring(0, 500),
          similarity: Math.round(similarity * 100) / 100,
          source_page: sent1.page,
          matched_page: sent2.page,
          source_position: sent1.position,
          matched_position: sent2.position,
        });
      }
    }
    if (segments.length >= 20) break;
  }
  
  return segments.sort((a, b) => b.similarity - a.similarity).slice(0, 20);
}

export function preprocessText(text: string, wordCount: number) {
  const normalized = normalizeArabicText(text);
  const words = normalized.split(/\s+/).filter(w => w.length > 2);
  
  // Process ALL words (no sampling) for accurate comparison
  const wordSet = new Set(words);
  
  return { 
    normalized, 
    words, 
    wordSet,
    wordCount: words.length,
    wordSetSize: wordSet.size
  };
}

export function calculateSimilarity(text1: any, text2: any): number {
  const jaccard = calculateJaccard(text1.wordSet, text2.wordSet);
  
  const sampleSize = Math.min(
    15000,
    Math.min(text1.normalized.length, text2.normalized.length)
  );
  
  const sample1 = text1.normalized.substring(0, sampleSize);
  const sample2 = text2.normalized.substring(0, sampleSize);
  
  const fuzzy = fuzzball.ratio(sample1, sample2) / 100;
  
  const sentences1 = text1.normalized.split(/[.!?؟]/);
  const sentences2 = text2.normalized.split(/[.!?؟]/);
  
  let sentenceSimilarity = 0;
  if (sentences1.length > 0 && sentences2.length > 0) {
    const sampleSentences = Math.min(30, sentences1.length, sentences2.length);
    let matchCount = 0;
    
    for (let i = 0; i < sampleSentences; i++) {
      const s1 = sentences1[i];
      const s2 = sentences2[i];
      if (s1 && s2) {
        const ratio = fuzzball.ratio(s1, s2) / 100;
        if (ratio > 0.6) matchCount++;
      }
    }
    
    sentenceSimilarity = matchCount / sampleSentences;
  }
  
  return (jaccard * 0.4 + fuzzy * 0.4 + sentenceSimilarity * 0.2);
}

function calculateJaccard(set1: Set<string>, set2: Set<string>): number {
  if (set1.size === 0 && set2.size === 0) return 0;
  
  let intersectionSize = 0;
  const smallerSet = set1.size < set2.size ? set1 : set2;
  const largerSet = set1.size < set2.size ? set2 : set1;
  
  for (const word of smallerSet) {
    if (largerSet.has(word)) intersectionSize++;
  }
  
  const unionSize = set1.size + set2.size - intersectionSize;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}
