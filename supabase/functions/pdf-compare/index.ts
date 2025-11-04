import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

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
          similarity_score: 100,
          similarity_method: 'hash_exact_match',
          flagged: true,
        }],
        max_similarity_score: 100,
        avg_similarity_score: 100,
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
        details: { fileName, matchType: 'exact_hash', similarity: 100 },
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
        
        // حساب Cosine Similarity بناءً على TF-IDF المحسن
        const cosineSim = calculateOptimizedCosineSimilarity(
          processedFileText.normalized,
          processedRefText.normalized,
          processedFileText.words,
          processedRefText.words
        );

        // حساب Jaccard Similarity المحسن
        const jaccardSim = calculateOptimizedJaccardSimilarity(
          processedFileText.wordSet,
          processedRefText.wordSet
        );

        // النتيجة النهائية (وزن Cosine 70% و Jaccard 30%)
        const finalScore = (cosineSim * 0.7 + jaccardSim * 0.3);

        if (finalScore > 0.30) {
          comparisons.push({
            matched_file_id: refFile.id,
            matched_file_name: refFile.file_name,
            similarity_score: Math.round(finalScore * 100) / 100,
            similarity_method: 'optimized_hybrid',
            cosine_score: Math.round(cosineSim * 100) / 100,
            jaccard_score: Math.round(jaccardSim * 100) / 100,
            flagged: finalScore >= 0.70,
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

// حساب TF-IDF + Cosine Similarity المحسن
function calculateOptimizedCosineSimilarity(
  text1: string, 
  text2: string,
  words1: string[],
  words2: string[]
): number {
  // بناء frequency maps بدلاً من arrays
  const freq1 = new Map<string, number>();
  const freq2 = new Map<string, number>();
  
  for (const word of words1) {
    freq1.set(word, (freq1.get(word) || 0) + 1);
  }
  
  for (const word of words2) {
    freq2.set(word, (freq2.get(word) || 0) + 1);
  }
  
  // استخدام الكلمات المشتركة فقط
  const commonWords = new Set([...freq1.keys()].filter(w => freq2.has(w)));
  
  if (commonWords.size === 0) return 0;
  
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;
  
  // حساب باستخدام الكلمات المشتركة فقط
  for (const word of commonWords) {
    const tf1 = (freq1.get(word) || 0) / words1.length;
    const tf2 = (freq2.get(word) || 0) / words2.length;
    
    // IDF مبسط
    const idf = Math.log(2 / (1 + (freq1.has(word) ? 1 : 0) + (freq2.has(word) ? 1 : 0)));
    
    const tfidf1 = tf1 * idf;
    const tfidf2 = tf2 * idf;
    
    dotProduct += tfidf1 * tfidf2;
    mag1 += tfidf1 * tfidf1;
    mag2 += tfidf2 * tfidf2;
  }
  
  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);
  
  if (mag1 === 0 || mag2 === 0) return 0;
  return dotProduct / (mag1 * mag2);
}

// حساب Jaccard Similarity المحسن
function calculateOptimizedJaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
  if (set1.size === 0 && set2.size === 0) return 0;
  
  // حساب التقاطع
  let intersectionSize = 0;
  const smallerSet = set1.size < set2.size ? set1 : set2;
  const largerSet = set1.size < set2.size ? set2 : set1;
  
  for (const word of smallerSet) {
    if (largerSet.has(word)) intersectionSize++;
  }
  
  // حساب الاتحاد
  const unionSize = set1.size + set2.size - intersectionSize;
  
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
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
