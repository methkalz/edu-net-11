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
      normalizedText,
      simhash: fileSimhash,
      fileHash,
      fileName,
      filePath,
      gradeLevel,
      comparisonType,
      userId,
      schoolId,
    } = await req.json();

    console.log(`🔍 Starting comparison for ${fileName} (Grade ${gradeLevel})`);
    
    const wordCount = fileText.split(/\s+/).length;
    console.log(`📊 File contains ${wordCount} words`);
    
    if (wordCount > 500000) {
      throw new Error(`File too large: ${wordCount} words. Maximum 500,000 words allowed.`);
    }

    // Layer 1: Simhash للكشف السريع عن التطابق التام
    if (fileSimhash) {
      console.log('🔎 Checking Simhash for near-duplicates...');
      
      const { data: simhashMatches } = await supabase
        .from('pdf_comparison_repository')
        .select('*')
        .eq('grade_level', gradeLevel)
        .not('simhash_value', 'is', null);

      if (simhashMatches && simhashMatches.length > 0) {
        const fileSimhashBigInt = BigInt(fileSimhash);
        
        for (const refFile of simhashMatches) {
          if (!refFile.simhash_value) continue;
          
          try {
            const refSimhash = BigInt(refFile.simhash_value);
            const hammingDist = hammingDistance(fileSimhashBigInt, refSimhash);
            
            // إذا كان Hamming Distance <= 3، فهذا تطابق تام أو شبه تام (95%+)
            if (hammingDist <= 3) {
              console.log(`🚨 Near-exact match found via Simhash! Distance: ${hammingDist}`);
              
              const similarity = 1.0 - (hammingDist / 64);
              
              const result = {
                compared_file_name: fileName,
                compared_file_path: filePath,
                compared_file_hash: fileHash,
                grade_level: gradeLevel,
                comparison_type: comparisonType,
                matches: [{
                  matched_file_id: refFile.id,
                  matched_file_name: refFile.file_name,
                  similarity_score: Math.round(similarity * 100) / 100,
                  similarity_method: 'simhash_near_exact',
                  hamming_distance: hammingDist,
                  flagged: true,
                }],
                max_similarity_score: similarity,
                avg_similarity_score: similarity,
                total_matches_found: 1,
                high_risk_matches: 1,
                status: 'flagged',
                review_required: true,
                requested_by: userId,
                school_id: schoolId,
                processing_time_ms: Date.now() - startTime,
                algorithm_used: 'simhash_fingerprinting',
              };

              await supabase.from('pdf_comparison_results').insert(result);
              await supabase.from('pdf_comparison_audit_log').insert({
                action_type: 'compare',
                performed_by: userId,
                details: { fileName, matchType: 'simhash', similarity, hammingDist },
              });

              return new Response(JSON.stringify({ success: true, result }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
          } catch (err) {
            console.warn('⚠️ Simhash comparison error:', err);
            continue;
          }
        }
      }
    }

    // Layer 2: Hash-based exact match (fallback)
    const { data: exactMatch } = await supabase
      .from('pdf_comparison_repository')
      .select('*')
      .eq('text_hash', fileHash)
      .eq('grade_level', gradeLevel)
      .single();

    if (exactMatch) {
      console.log('✅ Exact hash match found!');
      
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
        algorithm_used: 'sha256_hash',
      };

      await supabase.from('pdf_comparison_results').insert(result);
      await supabase.from('pdf_comparison_audit_log').insert({
        action_type: 'compare',
        performed_by: userId,
        details: { fileName, matchType: 'exact_hash', similarity: 1.0 },
      });

      return new Response(JSON.stringify({ success: true, result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Layer 3: جلب الملفات المرجعية للمقارنة التفصيلية
    const { data: repositoryFiles, error: repoError } = await supabase
      .from('pdf_comparison_repository')
      .select('*')
      .eq('grade_level', gradeLevel)
      .eq('project_type', comparisonType);

    if (repoError) {
      throw new Error(`Repository fetch error: ${repoError.message}`);
    }

    console.log(`📚 Comparing against ${repositoryFiles?.length || 0} repository files`);

    if (!repositoryFiles || repositoryFiles.length === 0) {
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
        algorithm_used: 'hybrid_multilayer',
      };

      await supabase.from('pdf_comparison_results').insert(result);

      return new Response(JSON.stringify({ success: true, result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // تحضير النص للمقارنة (استخدام النص المُطبّع)
    const textToCompare = normalizedText || advancedArabicNormalization(fileText);
    const processedFileText = preprocessText(textToCompare, wordCount);
    
    console.log(`🔧 Preprocessed text ready for comparison`);
    
    // Layer 4: المقارنة الهجينة (N-Grams + TF-IDF)
    const comparisons = [];
    const maxComparisonTime = 25000;
    const comparisonStartTime = Date.now();

    for (const refFile of repositoryFiles) {
      if (Date.now() - comparisonStartTime > maxComparisonTime) {
        console.warn('⏱️ Comparison timeout reached, stopping early');
        break;
      }
      
      if (!refFile.extracted_text) continue;

      try {
        // استخدام النص المُطبّع من المستودع إن وجد
        const refTextToCompare = refFile.normalized_text || 
          advancedArabicNormalization(refFile.extracted_text);
        
        const refWordCount = refTextToCompare.split(/\s+/).length;
        const processedRefText = preprocessText(refTextToCompare, refWordCount);
        
        // Layer 4a: N-Gram Jaccard Similarity (أدق من الكلمات المنفردة)
        const ngrams1 = generateNGrams(processedFileText.normalized, 3);
        const ngrams2 = generateNGrams(processedRefText.normalized, 3);
        const ngramJaccard = calculateJaccardSimilarity(ngrams1, ngrams2);

        // Layer 4b: TF-IDF Cosine Similarity المُحسّن
        const cosineSim = calculateImprovedCosineSimilarity(
          processedFileText.words,
          processedRefText.words
        );

        // Combined Score (وزن ديناميكي)
        let finalScore;
        if (ngramJaccard > 0.8) {
          // تطابق كبير - نعتمد على N-Grams أكثر
          finalScore = ngramJaccard * 0.7 + cosineSim * 0.3;
        } else {
          // تطابق متوسط - نوازن بين الاثنين
          finalScore = ngramJaccard * 0.5 + cosineSim * 0.5;
        }

        if (finalScore > 0.25) {
          comparisons.push({
            matched_file_id: refFile.id,
            matched_file_name: refFile.file_name,
            similarity_score: Math.round(finalScore * 100) / 100,
            similarity_method: 'hybrid_ngram_tfidf',
            ngram_jaccard_score: Math.round(ngramJaccard * 100) / 100,
            cosine_score: Math.round(cosineSim * 100) / 100,
            flagged: finalScore >= 0.70,
          });
        }
      } catch (compError) {
        console.error(`❌ Error comparing with ${refFile.file_name}:`, compError);
        continue;
      }
    }

    // ترتيب النتائج
    comparisons.sort((a, b) => b.similarity_score - a.similarity_score);
    
    const totalFilesCompared = repositoryFiles.length;
    const totalMatchesFound = comparisons.length;
    const highRiskCount = comparisons.filter(m => m.flagged).length;
    const top5Matches = comparisons.slice(0, 5);

    const maxScore = comparisons.length > 0 
      ? Math.max(...comparisons.map(m => m.similarity_score)) 
      : 0;
    
    const avgScore = comparisons.length > 0
      ? comparisons.reduce((sum, m) => sum + m.similarity_score, 0) / comparisons.length
      : 0;
    
    console.log(`📊 Results: ${totalMatchesFound} matches, top score: ${maxScore}`);

    let status = 'safe';
    if (maxScore >= 0.70) status = 'flagged';
    else if (maxScore >= 0.50) status = 'warning';

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
      algorithm_used: 'hybrid_multilayer_2024',
    };

    const { data: savedResult, error: saveError } = await supabase
      .from('pdf_comparison_results')
      .insert(result)
      .select()
      .single();

    if (saveError) {
      console.error('❌ Save error:', saveError);
      throw saveError;
    }

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

    console.log(`✅ Comparison completed in ${Date.now() - startTime}ms - Status: ${status}`);

    return new Response(
      JSON.stringify({ success: true, result: savedResult }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error in pdf-compare function:', error);
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

// تحضير النص
function preprocessText(text: string, wordCount: number) {
  const normalized = text; // النص مُطبّع مسبقاً
  let words = normalized.split(/\s+/).filter(w => w.length > 2);
  
  const maxWords = 50000;
  if (words.length > maxWords) {
    console.log(`⚠️ Large file (${words.length} words). Sampling to ${maxWords}.`);
    const step = Math.floor(words.length / maxWords);
    words = words.filter((_, i) => i % step === 0).slice(0, maxWords);
  }
  
  const wordSet = new Set(words);
  return { normalized, words, wordSet };
}

// توليد Character N-Grams
function generateNGrams(text: string, n: number = 3): Set<string> {
  const ngrams = new Set<string>();
  const normalized = text.replace(/\s+/g, '');
  
  for (let i = 0; i <= normalized.length - n; i++) {
    ngrams.add(normalized.substring(i, i + n));
  }
  
  return ngrams;
}

// Jaccard Similarity
function calculateJaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
  if (set1.size === 0 && set2.size === 0) return 0;
  
  let intersectionSize = 0;
  const smallerSet = set1.size < set2.size ? set1 : set2;
  const largerSet = set1.size < set2.size ? set2 : set1;
  
  for (const item of smallerSet) {
    if (largerSet.has(item)) intersectionSize++;
  }
  
  const unionSize = set1.size + set2.size - intersectionSize;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

// TF-IDF Cosine Similarity المُحسّن
function calculateImprovedCosineSimilarity(
  words1: string[],
  words2: string[]
): number {
  const freq1 = new Map<string, number>();
  const freq2 = new Map<string, number>();
  
  for (const word of words1) {
    freq1.set(word, (freq1.get(word) || 0) + 1);
  }
  
  for (const word of words2) {
    freq2.set(word, (freq2.get(word) || 0) + 1);
  }
  
  const allWords = new Set([...freq1.keys(), ...freq2.keys()]);
  
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;
  
  for (const word of allWords) {
    const tf1 = (freq1.get(word) || 0) / words1.length;
    const tf2 = (freq2.get(word) || 0) / words2.length;
    
    // Smooth IDF
    const df = (freq1.has(word) ? 1 : 0) + (freq2.has(word) ? 1 : 0);
    const idf = Math.log((2 + 1) / (df + 1)) + 1;
    
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

// حساب Hamming Distance
function hammingDistance(hash1: bigint, hash2: bigint): number {
  let xor = hash1 ^ hash2;
  let distance = 0;
  while (xor) {
    distance += Number(xor & 1n);
    xor >>= 1n;
  }
  return distance;
}

// تطبيع متقدم للنص العربي
function advancedArabicNormalization(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[آأإٱ]/g, 'ا')
    .replace(/[ؤئ]/g, 'ء')
    .replace(/[ىي]/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ـ/g, '')
    .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632 + 48))
    .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776 + 48))
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
