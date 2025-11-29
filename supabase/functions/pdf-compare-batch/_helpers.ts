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
  
  // تحسين التغطية: زيادة عينة الجمل من 50 إلى 100 (معظم الملفات 1800-2500 كلمة)
  const maxSentences = 100;
  const sample1 = sentences1.slice(0, maxSentences);
  const sample2 = sentences2.slice(0, maxSentences);
  
  for (const sent1 of sample1) {
    for (const sent2 of sample2) {
      // زيادة max segments من 20 إلى 30 للحصول على تفاصيل أكثر
      if (segments.length >= 30) break;
      
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
    if (segments.length >= 30) break;
  }
  
  return segments.sort((a, b) => b.similarity - a.similarity).slice(0, 30);
}

export function preprocessText(text: string, wordCount: number) {
  const normalized = normalizeArabicText(text);
  let words = normalized.split(/\s+/).filter(w => w.length > 2);
  
  // معظم الملفات 1800-2500 كلمة - رفع الحد إلى 4000 لتغطية 100%
  const maxWords = 4000;
  if (words.length > maxWords) {
    console.log(`Sampling large file: ${words.length} words → ${maxWords} words`);
    const step = Math.floor(words.length / maxWords);
    words = words.filter((_, i) => i % step === 0).slice(0, maxWords);
  }
  
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
  
  // زيادة sampleSize من 15,000 إلى 25,000 حرف لتغطية 100% من معظم الملفات (1800-2500 كلمة)
  const sampleSize = Math.min(
    25000,
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

// ===== Coverage-Based Scoring Functions =====

/**
 * تقسيم النص إلى فقرات (paragraphs) بحجم متوسط 100-150 كلمة
 */
export function splitIntoParagraphs(text: string, wordsPerParagraph: number = 100): string[] {
  const words = text.split(/\s+/).filter(w => w.length > 2);
  const paragraphs: string[] = [];
  
  for (let i = 0; i < words.length; i += wordsPerParagraph) {
    const paragraph = words.slice(i, i + wordsPerParagraph).join(' ');
    if (paragraph.trim().length > 50) { // تخطي الفقرات القصيرة جداً
      paragraphs.push(paragraph);
    }
  }
  
  return paragraphs;
}

/**
 * حساب نسبة التغطية (Coverage Ratio): نسبة النص المغطاة بتطابقات عالية (≥75%)
 */
export function calculateCoverage(
  text1: string, 
  text2: string, 
  paragraphSimilarityMin: number = 0.75
): number {
  const paragraphs1 = splitIntoParagraphs(text1, 100);
  const paragraphs2 = splitIntoParagraphs(text2, 100);
  
  if (paragraphs1.length === 0) return 0;
  
  let coveredWords = 0;
  const totalWords = text1.split(/\s+/).filter(w => w.length > 2).length;
  
  // مقارنة كل فقرة من text1 مع جميع فقرات text2
  for (const para1 of paragraphs1) {
    let bestMatch = 0;
    
    for (const para2 of paragraphs2) {
      // استخدام fuzzball للمقارنة الدقيقة
      const similarity = fuzzball.ratio(
        normalizeArabicText(para1),
        normalizeArabicText(para2)
      ) / 100;
      
      if (similarity > bestMatch) {
        bestMatch = similarity;
      }
      
      // إذا وجدنا تطابق عالي، نتوقف عن البحث لهذه الفقرة
      if (similarity >= paragraphSimilarityMin) {
        break;
      }
    }
    
    // إذا كان التطابق عالي، نعتبر الفقرة "مغطاة"
    if (bestMatch >= paragraphSimilarityMin) {
      const paraWordCount = para1.split(/\s+/).filter(w => w.length > 2).length;
      coveredWords += paraWordCount;
    }
  }
  
  return totalWords > 0 ? coveredWords / totalWords : 0;
}

/**
 * اكتشاف التطابقات الطويلة المتتالية (للتحليل التفصيلي)
 */
export function findLongMatches(
  text1: string,
  text2: string,
  minSimilarity: number = 0.75
): Array<{ para1: string; para2: string; similarity: number; length: number }> {
  const paragraphs1 = splitIntoParagraphs(text1, 100);
  const paragraphs2 = splitIntoParagraphs(text2, 100);
  
  const longMatches: Array<{ para1: string; para2: string; similarity: number; length: number }> = [];
  
  for (const para1 of paragraphs1) {
    for (const para2 of paragraphs2) {
      const similarity = fuzzball.ratio(
        normalizeArabicText(para1),
        normalizeArabicText(para2)
      ) / 100;
      
      if (similarity >= minSimilarity) {
        const length = para1.split(/\s+/).filter(w => w.length > 2).length;
        longMatches.push({
          para1: para1.substring(0, 200), // أول 200 حرف فقط
          para2: para2.substring(0, 200),
          similarity: Math.round(similarity * 100) / 100,
          length
        });
      }
    }
  }
  
  // ترتيب من الأطول للأقصر
  return longMatches.sort((a, b) => b.length - a.length).slice(0, 10);
}
