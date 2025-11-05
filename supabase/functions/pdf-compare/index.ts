import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import fuzzball from 'https://esm.sh/fuzzball@2.2.2';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const startTime = Date.now();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const {
      fileText,
      filePages,
      fileHash,
      fileName,
      filePath,
      gradeLevel,
      comparisonType,
      userId,
      schoolId,
    } = await req.json();

    console.log(`Starting comparison for ${fileName} (Grade ${gradeLevel})`);
    
    // فحص حجم النص
    const wordCount = fileText.split(/\s+/).length;
    console.log(`File contains ${wordCount} words`);
    
    if (wordCount > 500000) {
      throw new Error(`File too large: ${wordCount} words. Maximum 500,000 words allowed.`);
    }

    // 1. فحص التطابق التام (Hash comparison)
    const { data: exactMatch } = await supabase
      .from('pdf_comparison_repository')
      .select('*')
      .eq('text_hash', fileHash)
      .eq('grade_level', gradeLevel)
      .single();

    if (exactMatch) {
      console.log('Exact match found!');
      
      const result = {
        compared_file_name: fileName,
        compared_file_path: filePath,
        compared_file_hash: fileHash,
        grade_level: gradeLevel,
        comparison_type: comparisonType,
        matches: [{
          matched_file_id: exactMatch.id,
          matched_file_name: exactMatch.file_name,
          similarity_score: 1.0,
          similarity_method: 'hash_exact_match',
          flagged: true,
        }],
        max_similarity_score: 1.0,
        avg_similarity_score: 1.0,
        total_matches_found: 1,
        high_risk_matches: 1,
        status: 'flagged',
        review_required: true,
        requested_by: userId,
        school_id: schoolId,
        processing_time_ms: Date.now() - startTime,
        algorithm_used: 'hash_comparison',
      };

      // حفظ النتيجة
      await supabase.from('pdf_comparison_results').insert(result);

      // تسجيل في audit log
      await supabase.from('pdf_comparison_audit_log').insert({
        action_type: 'compare',
        performed_by: userId,
        details: { fileName, matchType: 'exact_hash', similarity: 1.0 },
      });

      return new Response(JSON.stringify({ success: true, result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. جلب الملفات المرجعية من المستودع
    const { data: repositoryFiles, error: repoError } = await supabase
      .from('pdf_comparison_repository')
      .select('*')
      .eq('grade_level', gradeLevel)
      .eq('project_type', comparisonType);

    if (repoError) {
      throw new Error(`Repository fetch error: ${repoError.message}`);
    }

    console.log(`Comparing against ${repositoryFiles?.length || 0} repository files`);

    if (!repositoryFiles || repositoryFiles.length === 0) {
      // لا توجد ملفات للمقارنة
      const result = {
        compared_file_name: fileName,
        compared_file_path: filePath,
        compared_file_hash: fileHash,
        grade_level: gradeLevel,
        comparison_type: comparisonType,
        matches: [],
        max_similarity_score: 0,
        avg_similarity_score: 0,
        total_matches_found: 0,
        high_risk_matches: 0,
        status: 'safe',
        review_required: false,
        requested_by: userId,
        school_id: schoolId,
        processing_time_ms: Date.now() - startTime,
        algorithm_used: 'tfidf_cosine',
      };

      await supabase.from('pdf_comparison_results').insert(result);

      return new Response(JSON.stringify({ success: true, result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. تحضير النص الأصلي (sampling للملفات الكبيرة)
    const processedFileText = preprocessText(fileText, wordCount);
    console.log(`Processed text ready for comparison`);
    
    // 3. حساب التشابه مع كل ملف
    const comparisons = [];
    const maxComparisonTime = 25000; // 25 ثانية كحد أقصى
    const comparisonStartTime = Date.now();

    for (const refFile of repositoryFiles) {
      // فحص الوقت
      if (Date.now() - comparisonStartTime > maxComparisonTime) {
        console.warn('⚠️ Comparison timeout reached, stopping early');
        break;
      }
      
      if (!refFile.extracted_text) continue;

      try {
        // تحضير النص المرجعي
        const refWordCount = refFile.extracted_text.split(/\s+/).length;
        const processedRefText = preprocessText(refFile.extracted_text, refWordCount);
        
        // 1. Fuzzy Similarity
        const fuzzySim = fuzzball.ratio(processedFileText.normalized, processedRefText.normalized) / 100;
        
        // 2. Jaccard Similarity
        const jaccardSim = calculateJaccardSimilarity(
          processedFileText.wordSet,
          processedRefText.wordSet
        );
        
        // 3. Sequence Similarity
        const sequenceSim = calculateSequenceSimilarity(
          processedFileText.words,
          processedRefText.words
        );
        
        // 4. Structural Similarity
        const structuralSim = calculateStructuralSimilarity(
          processedFileText.normalized,
          processedRefText.normalized
        );
        
        // Overall Score (وزن مخصص)
        const overallScore = (
          fuzzySim * 0.35 +
          jaccardSim * 0.25 +
          sequenceSim * 0.25 +
          structuralSim * 0.15
        );

        // إيجاد القطع المتشابهة (إذا كان التشابه عالي)
        let matchedSegments = [];
        let coveragePercentage = 0;
        
        if (overallScore >= 0.50 && filePages && filePages.length > 0) {
          // استخراج صفحات الملف المرجعي
          const refPages = refFile.pages_data || [{ pageNumber: 1, text: refFile.extracted_text }];
          
          matchedSegments = findSimilarSegments(filePages, refPages, 0.70);
          coveragePercentage = calculateCoveragePercentage(matchedSegments, wordCount);
        }

        if (overallScore > 0.30) {
          comparisons.push({
            matched_file_id: refFile.id,
            matched_file_name: refFile.file_name,
            similarity_score: Math.round(overallScore * 100) / 100,
            similarity_method: 'advanced_multi_algorithm',
            fuzzy_score: Math.round(fuzzySim * 100) / 100,
            jaccard_score: Math.round(jaccardSim * 100) / 100,
            sequence_score: Math.round(sequenceSim * 100) / 100,
            structural_score: Math.round(structuralSim * 100) / 100,
            coverage_percentage: Math.round(coveragePercentage * 100) / 100,
            matched_segments: matchedSegments.slice(0, 20),
            flagged: overallScore >= 0.70,
          });
        }
      } catch (compError) {
        console.error(`Error comparing with ${refFile.file_name}:`, compError);
        continue;
      }
    }

    // 4. ترتيب النتائج وأخذ أعلى 5 فقط
    comparisons.sort((a, b) => b.similarity_score - a.similarity_score);
    
    const totalFilesCompared = repositoryFiles.length;
    const totalMatchesFound = comparisons.length;
    const highRiskCount = comparisons.filter(m => m.flagged).length;
    
    // الاحتفاظ بأعلى 5 تطابقات فقط للحفظ في قاعدة البيانات
    const top5Matches = comparisons.slice(0, 5);

    const maxScore = comparisons.length > 0 
      ? Math.max(...comparisons.map(m => m.similarity_score)) 
      : 0;
    
    const avgScore = comparisons.length > 0
      ? comparisons.reduce((sum, m) => sum + m.similarity_score, 0) / comparisons.length
      : 0;
    
    console.log(`📊 Results: ${totalMatchesFound} matches found, showing top ${top5Matches.length}`);

    // 5. تحديد الحالة
    let status = 'safe';
    if (maxScore >= 0.70) status = 'flagged';
    else if (maxScore >= 0.50) status = 'warning';

    // 6. حفظ النتيجة (أعلى 5 تطابقات فقط)
    const result = {
      compared_file_name: fileName,
      compared_file_path: filePath,
      compared_file_hash: fileHash,
      compared_extracted_text: fileText,
      grade_level: gradeLevel,
      comparison_type: comparisonType,
      matches: top5Matches,
      max_similarity_score: maxScore,
      avg_similarity_score: Math.round(avgScore * 100) / 100,
      total_matches_found: totalMatchesFound,
      total_files_compared: totalFilesCompared,
      high_risk_matches: highRiskCount,
      status,
      review_required: status === 'flagged',
      requested_by: userId,
      school_id: schoolId,
      processing_time_ms: Date.now() - startTime,
      algorithm_used: 'optimized_hybrid',
    };

    const { data: savedResult, error: saveError } = await supabase
      .from('pdf_comparison_results')
      .insert(result)
      .select()
      .single();

    if (saveError) {
      console.error('Save error:', saveError);
      throw saveError;
    }

    // تسجيل في audit log
    await supabase.from('pdf_comparison_audit_log').insert({
      comparison_result_id: savedResult.id,
      action_type: 'compare',
      performed_by: userId,
      details: { 
        fileName, 
        matchesFound: comparisons.length, 
        maxSimilarity: maxScore,
        status 
      },
    });

    console.log(`Comparison completed in ${Date.now() - startTime}ms - Status: ${status}`);

    return new Response(
      JSON.stringify({ success: true, result: savedResult }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in pdf-compare function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// تحضير النص للمعالجة
function preprocessText(text: string, wordCount: number) {
  const normalized = normalizeArabicText(text);
  let words = normalized.split(/\s+/).filter(w => w.length > 2);
  
  // استخدام sampling للملفات الكبيرة جداً
  const maxWords = 50000;
  if (words.length > maxWords) {
    console.log(`⚠️ Large file detected (${words.length} words). Sampling to ${maxWords} words.`);
    
    // أخذ عينة موزعة بشكل متساوي من النص
    const step = Math.floor(words.length / maxWords);
    words = words.filter((_, i) => i % step === 0).slice(0, maxWords);
  }
  
  const wordSet = new Set(words);
  
  return { normalized, words, wordSet };
}

// واجهة للقطع المتشابهة
interface SimilarSegment {
  text1: string;
  text2: string;
  page1: number;
  page2: number;
  similarity: number;
}

// 2. Jaccard Similarity
function calculateJaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
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

// 3. Sequence Similarity (التشابه التسلسلي)
function calculateSequenceSimilarity(words1: string[], words2: string[]): number {
  let totalMatchedLength = 0;
  const minLength = Math.min(words1.length, words2.length);
  
  if (minLength === 0) return 0;
  
  // Sliding Window: 3-10 كلمات
  for (let windowSize = 10; windowSize >= 3; windowSize--) {
    const phrases1 = generatePhrases(words1, windowSize);
    const phrases2 = generatePhrases(words2, windowSize);
    
    for (const phrase of phrases1) {
      if (phrases2.has(phrase)) {
        totalMatchedLength += windowSize;
      }
    }
  }
  
  return totalMatchedLength / minLength;
}

function generatePhrases(words: string[], size: number): Set<string> {
  const phrases = new Set<string>();
  for (let i = 0; i <= words.length - size; i++) {
    phrases.add(words.slice(i, i + size).join(' '));
  }
  return phrases;
}

// 4. Structural Similarity (التشابه الهيكلي)
function calculateStructuralSimilarity(text1: string, text2: string): number {
  const sentences1 = text1.split(/[.؟!،؛]+/).filter(s => s.trim().length > 0);
  const sentences2 = text2.split(/[.؟!،؛]+/).filter(s => s.trim().length > 0);
  
  if (sentences1.length === 0 || sentences2.length === 0) return 0;
  
  const paragraphs1 = text1.split(/\n\n+/).length;
  const paragraphs2 = text2.split(/\n\n+/).length;
  
  const avgSentenceLength1 = sentences1.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences1.length;
  const avgSentenceLength2 = sentences2.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences2.length;
  
  const sentenceLengthSim = 1 - Math.abs(avgSentenceLength1 - avgSentenceLength2) / Math.max(avgSentenceLength1, avgSentenceLength2);
  const paragraphSim = 1 - Math.abs(paragraphs1 - paragraphs2) / Math.max(paragraphs1, paragraphs2);
  const sentenceCountSim = 1 - Math.abs(sentences1.length - sentences2.length) / Math.max(sentences1.length, sentences2.length);
  
  return (sentenceLengthSim + paragraphSim + sentenceCountSim) / 3;
}

// إيجاد القطع المتشابهة
function findSimilarSegments(
  pages1: Array<{ pageNumber: number; text: string }>,
  pages2: Array<{ pageNumber: number; text: string }>,
  threshold: number = 0.70
): SimilarSegment[] {
  const segments: SimilarSegment[] = [];
  
  // تقسيم كل صفحة إلى جمل
  const sentences1 = pages1.flatMap(({ text, pageNumber }) => 
    text.split(/[.؟!،؛]+/)
      .filter(s => s.trim().length > 10)
      .map(s => ({ text: s.trim(), page: pageNumber }))
  );
  
  const sentences2 = pages2.flatMap(({ text, pageNumber }) => 
    text.split(/[.؟!،؛]+/)
      .filter(s => s.trim().length > 10)
      .map(s => ({ text: s.trim(), page: pageNumber }))
  );
  
  // مقارنة كل جملة بكل جملة أخرى
  for (let i = 0; i < sentences1.length; i++) {
    for (let j = 0; j < sentences2.length; j++) {
      const similarity = fuzzball.ratio(sentences1[i].text, sentences2[j].text) / 100;
      
      if (similarity > threshold) {
        segments.push({
          text1: sentences1[i].text,
          text2: sentences2[j].text,
          page1: sentences1[i].page,
          page2: sentences2[j].page,
          similarity,
        });
      }
    }
  }
  
  // ترتيب حسب التشابه
  return segments.sort((a, b) => b.similarity - a.similarity);
}

// حساب نسبة التغطية
function calculateCoveragePercentage(
  segments: SimilarSegment[],
  totalWords: number
): number {
  if (totalWords === 0) return 0;
  
  const coveredWords = segments.reduce((sum, segment) => {
    return sum + segment.text1.split(/\s+/).length;
  }, 0);
  
  return coveredWords / totalWords;
}

// تطبيع النص العربي
function normalizeArabicText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ًٌٍَُِّْ]/g, '') // إزالة التشكيل
    .replace(/[آإأٱ]/g, 'ا') // توحيد الألف
    .replace(/ة/g, 'ه') // توحيد التاء المربوطة
    .replace(/ى/g, 'ي') // توحيد الياء
    .replace(/[^\w\s\u0600-\u06FF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
