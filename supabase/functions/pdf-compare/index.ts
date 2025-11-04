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
      wordCount,
    } = await req.json();

    console.log(`[COMPARE] Starting - File: ${fileName} (Grade ${gradeLevel}), Words: ${wordCount || 'unknown'}`);
    
    // فحص عدد الكلمات
    const MAX_WORD_COUNT = 100000;
    const WARN_WORD_COUNT = 50000;
    
    if (wordCount && wordCount > MAX_WORD_COUNT) {
      console.error(`[COMPARE] Text too long: ${wordCount} words`);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'TEXT_TOO_LONG',
            message: 'الملف يحتوي على نص طويل جداً للمقارنة',
            message_en: 'Text too long for comparison',
            details: {
              wordCount,
              maxAllowed: MAX_WORD_COUNT,
              fileName,
            },
            suggestions: [
              `قلل عدد الكلمات إلى أقل من ${MAX_WORD_COUNT.toLocaleString('ar-SA')}`,
              'قسّم المشروع إلى ملفات أصغر',
              'احذف الأجزاء غير الضرورية',
            ]
          }
        }),
        {
          status: 413,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    if (wordCount && wordCount > WARN_WORD_COUNT) {
      console.log(`[COMPARE] Warning: Large text (${wordCount} words) - may take longer`);
    }

    // 1. فحص التطابق التام (Hash comparison)
    const { data: exactMatch } = await supabase
      .from('pdf_comparison_repository')
      .select('*')
      .eq('text_hash', fileHash)
      .eq('grade_level', gradeLevel)
      .single();

    if (exactMatch) {
      console.log(`[COMPARE] ⚠️ Exact match found! File: ${exactMatch.file_name}`);
      
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

    console.log(`[COMPARE] Repository has ${repositoryFiles?.length || 0} files`);

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

    // 3. حساب التشابه مع كل ملف
    console.log(`[COMPARE] Starting similarity calculations...`);
    const comparisons = [];
    let processed = 0;

    for (const refFile of repositoryFiles) {
      if (!refFile.extracted_text) continue;
      
      processed++;
      if (processed % 5 === 0) {
        console.log(`[COMPARE] Progress: ${processed}/${repositoryFiles.length} files processed`);
      }

      // حساب Cosine Similarity بناءً على TF-IDF
      const cosineSim = calculateCosineSimilarity(fileText, refFile.extracted_text);

      // حساب Jaccard Similarity
      const jaccardSim = calculateJaccardSimilarity(fileText, refFile.extracted_text);

      // النتيجة النهائية (وزن Cosine 70% و Jaccard 30%)
      const finalScore = (cosineSim * 0.7 + jaccardSim * 0.3);

      if (finalScore > 0.30) {
        console.log(`[COMPARE] Match found: ${refFile.file_name} - Similarity: ${(finalScore * 100).toFixed(1)}%`);
        comparisons.push({
          matched_file_id: refFile.id,
          matched_file_name: refFile.file_name,
          similarity_score: Math.round(finalScore * 100) / 100,
          similarity_method: 'hybrid_tfidf_jaccard',
          cosine_score: Math.round(cosineSim * 100) / 100,
          jaccard_score: Math.round(jaccardSim * 100) / 100,
          flagged: finalScore >= 0.70,
        });
      }
    }
    
    console.log(`[COMPARE] Similarity calculations completed - ${comparisons.length} potential matches found`);

    // 4. ترتيب النتائج
    comparisons.sort((a, b) => b.similarity_score - a.similarity_score);

    const maxScore = comparisons.length > 0 
      ? Math.max(...comparisons.map(m => m.similarity_score)) 
      : 0;
    
    const avgScore = comparisons.length > 0
      ? comparisons.reduce((sum, m) => sum + m.similarity_score, 0) / comparisons.length
      : 0;

    const highRiskCount = comparisons.filter(m => m.flagged).length;

    // 5. تحديد الحالة
    let status = 'safe';
    if (maxScore >= 0.70) status = 'flagged';
    else if (maxScore >= 0.50) status = 'warning';

    // 6. حفظ النتيجة
    const result = {
      compared_file_name: fileName,
      compared_file_path: filePath,
      compared_file_hash: fileHash,
      compared_extracted_text: fileText,
      grade_level: gradeLevel,
      comparison_type: comparisonType,
      matches: comparisons,
      max_similarity_score: maxScore,
      avg_similarity_score: Math.round(avgScore * 100) / 100,
      total_matches_found: comparisons.length,
      high_risk_matches: highRiskCount,
      status,
      review_required: status === 'flagged',
      requested_by: userId,
      school_id: schoolId,
      processing_time_ms: Date.now() - startTime,
      algorithm_used: 'tfidf_cosine_jaccard',
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

    const totalTime = Date.now() - startTime;
    console.log(`[COMPARE] ✅ Completed - Status: ${status}, Matches: ${comparisons.length}, Time: ${totalTime}ms`);

    return new Response(
      JSON.stringify({ success: true, result: savedResult }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[COMPARE] ❌ Error:', error);
    
    // التعرف على أخطاء Timeout/CPU
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('CPU') || errorMessage.includes('timeout') || errorMessage.includes('WORKER')) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'CPU_LIMIT_EXCEEDED',
            message: 'الملف يتطلب وقت معالجة طويل جداً',
            message_en: 'File requires too much processing time',
            details: {
              error: errorMessage,
            },
            suggestions: [
              'قلل حجم الملف إلى أقل من 15MB',
              'تأكد من أن الملف لا يحتوي على صور كثيرة',
              'حاول تقسيم المشروع إلى ملفات أصغر',
            ]
          }
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'COMPARISON_FAILED',
          message: 'فشلت عملية المقارنة',
          message_en: 'Comparison operation failed',
          details: {
            error: errorMessage,
          },
          suggestions: [
            'حاول مرة أخرى',
            'تأكد من صلاحية الملف',
            'إذا استمر الخطأ، تواصل مع الدعم الفني',
          ]
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// حساب TF-IDF + Cosine Similarity
function calculateCosineSimilarity(text1: string, text2: string): number {
  const words1 = normalizeArabicText(text1).split(/\s+/).filter(w => w.length > 2);
  const words2 = normalizeArabicText(text2).split(/\s+/).filter(w => w.length > 2);

  // بناء قاموس الكلمات
  const vocabulary = new Set([...words1, ...words2]);
  
  // حساب TF-IDF vectors
  const vector1 = Array.from(vocabulary).map(word => {
    const tf = words1.filter(w => w === word).length / words1.length;
    const idf = Math.log(2 / (1 + [words1, words2].filter(arr => arr.includes(word)).length));
    return tf * idf;
  });

  const vector2 = Array.from(vocabulary).map(word => {
    const tf = words2.filter(w => w === word).length / words2.length;
    const idf = Math.log(2 / (1 + [words1, words2].filter(arr => arr.includes(word)).length));
    return tf * idf;
  });

  // Cosine Similarity
  const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
  const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));

  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  return dotProduct / (magnitude1 * magnitude2);
}

// حساب Jaccard Similarity
function calculateJaccardSimilarity(text1: string, text2: string): number {
  const words1 = new Set(normalizeArabicText(text1).split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(normalizeArabicText(text2).split(/\s+/).filter(w => w.length > 2));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return union.size === 0 ? 0 : intersection.size / union.size;
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
