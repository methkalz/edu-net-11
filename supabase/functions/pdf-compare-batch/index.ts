import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { generateEmbedding, extractTopKeywords } from '../_shared/embeddings.ts';
import { 
  extractMatchingSegments, 
  preprocessText, 
  calculateSimilarity,
  type ExtractedPage,
  type MatchedSegment 
} from './_helpers.ts';

interface FileToCompare {
  fileName: string;
  filePath: string;
  fileText: string;
  fileHash: string;
  filePages: number;
}

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
      files,
      gradeLevel,
      comparisonType,
      userId,
      schoolId,
    } = await req.json();

    if (!files || files.length === 0) {
      throw new Error('No files provided for comparison');
    }

    console.log(`📦 Starting batch comparison for ${files.length} files (Grade ${gradeLevel})`);

    const batchId = crypto.randomUUID();
    const results = [];

    // الخطوة 1: إضافة جميع الملفات للمستودع أولاً
    console.log('📤 Step 1: Adding all files to repository...');
    const repositoryFileIds: Map<string, string> = new Map();
    const newlyAddedIds: Set<string> = new Set(); // تتبع الملفات المضافة حديثاً
    
    for (const file of files) {
      try {
        // إضافة للمستودع
        const addResult = await supabase.functions.invoke('pdf-add-to-repository', {
          body: {
            filePath: file.filePath, // تصحيح: استخدام filePath بدلاً من tempFilePath
            fileName: file.fileName,
            bucket: 'pdf-comparison-temp',
            fileSize: 0,
            gradeLevel,
            projectType: comparisonType,
            sourceProjectId: null,
            sourceProjectType: gradeLevel === '10' ? 'grade10_mini_project' : 'grade12_final_project',
            userId,
            schoolId,
            // تمرير البيانات المستخرجة مسبقاً
            extractedText: file.fileText,
            textHash: file.fileHash,
            wordCount: file.fileText.split(/\s+/).length,
            pageCount: file.filePages,
          },
        });

        if (addResult.data?.success && addResult.data?.data?.id) {
          const repoId = addResult.data.data.id;
          const isDuplicate = addResult.data?.isDuplicate || false;
          
          repositoryFileIds.set(file.fileHash, repoId);
          
          // ✅ فقط إضافة الملفات الجديدة فعلاً (ليست مكررة)
          if (!isDuplicate) {
            newlyAddedIds.add(repoId);
            console.log(`✅ Added NEW file ${file.fileName} to repository (ID: ${repoId})`);
          } else {
            console.log(`ℹ️ File ${file.fileName} already exists in repository (ID: ${repoId})`);
          }
        } else if (addResult.error) {
          console.error(`❌ Failed to add ${file.fileName} to repository:`, {
            error: addResult.error,
            gradeLevel,
            projectType: comparisonType,
            sourceProjectType: gradeLevel === '10' ? 'grade10_mini_project' : 'grade12_final_project',
          });
        }
      } catch (error) {
        console.error(`❌ Error adding ${file.fileName} to repository:`, {
          error,
          fileName: file.fileName,
          gradeLevel,
        });
      }
    }

    // الخطوة 2: المقارنة الداخلية (بين الملفات المرفوعة) باستخدام embeddings
    console.log('🔄 Step 2: Internal comparison with embeddings...');
    const internalStartTime = Date.now();
    const internalComparisons: Map<string, any[]> = new Map();
    
    // توليد embeddings و keywords للملفات المرفوعة
    const fileEmbeddings = files.map(file => {
      const preprocessed = preprocessText(file.fileText, file.fileText.split(/\s+/).length);
      return {
        embedding: generateEmbedding(file.fileText, 1024), // ✅ زيادة من 384 إلى 1024
        keywords: extractTopKeywords(file.fileText, 150),
        wordSetSize: preprocessed.wordSetSize,
        wordCount: preprocessed.wordCount,
        pageCount: file.filePages
      };
    });
    
    console.log(`✅ Generated ${fileEmbeddings.length} embeddings with keywords`);

    if (files.length > 1) {
      for (let i = 0; i < files.length; i++) {
        const file1 = files[i];
        const file1Comparisons = [];

        for (let j = 0; j < files.length; j++) {
          if (i === j) continue; // تخطي مقارنة الملف بنفسه

          const file2 = files[j];

          // فحص التطابق التام (Hash)
          if (file1.fileHash === file2.fileHash) {
            file1Comparisons.push({
              matched_file_name: file2.fileName,
              similarity_score: 1.0,
              similarity_method: 'hash_exact_match',
              flagged: true,
              matched_segments: [],
            });
            continue;
          }

          // ✅ حساب التشابه باستخدام معايير متعددة (Hybrid Approach)
          
          // 1. Cosine similarity على embeddings
          const emb1 = fileEmbeddings[i].embedding;
          const emb2 = fileEmbeddings[j].embedding;
          
          let dotProduct = 0;
          for (let k = 0; k < emb1.length; k++) {
            dotProduct += emb1[k] * emb2[k];
          }
          const cosineSim = Math.max(0, Math.min(1, dotProduct)); // تطبيع بين 0-1
          
          // 2. Jaccard similarity على الكلمات المفتاحية
          const keywords1 = new Set(fileEmbeddings[i].keywords);
          const keywords2 = new Set(fileEmbeddings[j].keywords);
          
          let intersection = 0;
          for (const kw of keywords1) {
            if (keywords2.has(kw)) intersection++;
          }
          const union = keywords1.size + keywords2.size - intersection;
          const jaccardSim = union > 0 ? intersection / union : 0;
          
          // 3. فحص التشابه في الطول (Length similarity penalty)
          const wordCount1 = fileEmbeddings[i].wordCount;
          const wordCount2 = fileEmbeddings[j].wordCount;
          const pageCount1 = fileEmbeddings[i].pageCount;
          const pageCount2 = fileEmbeddings[j].pageCount;
          
          // إذا كان الفرق في عدد الكلمات كبير جداً، خفض التشابه
          const wordRatio = Math.min(wordCount1, wordCount2) / Math.max(wordCount1, wordCount2);
          const pageRatio = Math.min(pageCount1, pageCount2) / Math.max(pageCount1, pageCount2);
          const lengthSimilarity = (wordRatio + pageRatio) / 2;
          
          // 4. الوزن الهجين المحسّن
          // - إذا كان Jaccard منخفض جداً (< 0.15)، فالمستندات مختلفة بغض النظر عن cosine
          // - إذا كان فرق الطول كبير (< 0.5)، خفض الوزن
          let finalSimilarity = 0;
          
          if (jaccardSim < 0.15) {
            // تشابه منخفض جداً في الكلمات - اعتماد أقل على cosine
            finalSimilarity = cosineSim * 0.3 + jaccardSim * 0.6 + lengthSimilarity * 0.1;
          } else if (lengthSimilarity < 0.5) {
            // فرق كبير في الطول - تخفيض التشابه
            finalSimilarity = (cosineSim * 0.4 + jaccardSim * 0.5 + lengthSimilarity * 0.1) * 0.7;
          } else {
            // حالة عادية - توازن بين المعايير
            finalSimilarity = cosineSim * 0.5 + jaccardSim * 0.4 + lengthSimilarity * 0.1;
          }
          
          // ✅ حفظ جميع المقارنات مع التفاصيل
          file1Comparisons.push({
            matched_file_name: file2.fileName,
            similarity_score: Math.round(finalSimilarity * 100) / 100,
            similarity_method: 'hybrid_cosine_jaccard_length',
            flagged: finalSimilarity >= 0.70,
            metadata: {
              cosine: Math.round(cosineSim * 100) / 100,
              jaccard: Math.round(jaccardSim * 100) / 100,
              length_similarity: Math.round(lengthSimilarity * 100) / 100,
              word_count_ratio: Math.round(wordRatio * 100) / 100,
            }
          });
        }

        // ترتيب وأخذ أعلى 5
        file1Comparisons.sort((a, b) => b.similarity_score - a.similarity_score);
        internalComparisons.set(file1.fileHash, file1Comparisons.slice(0, 5));
      }
    }
    
    const internalEndTime = Date.now();
    console.log(`✅ Internal comparison completed in ${internalEndTime - internalStartTime}ms`);

    // ⚡ الخطوة 3: تخطي المقارنة مع المستودع (ستتم في background)
    console.log('⚡ Step 3: Skipping repository comparison (will run in background)...');

    // الخطوة 4: حفظ النتائج الداخلية فوراً
    console.log('💾 Step 4: Saving internal comparison results...');
    
    for (const file of files) {
      const internalMatches = internalComparisons.get(file.fileHash) || [];
      
      // حساب الإحصائيات الداخلية فقط
      const internalMaxSim = internalMatches.length > 0
        ? Math.max(...internalMatches.map(m => m.similarity_score))
        : 0;
      const internalHighRisk = internalMatches.filter(m => m.flagged).length;
      
      let status = 'safe';
      if (internalMaxSim >= 0.70) status = 'flagged';
      else if (internalMaxSim >= 0.40) status = 'warning';
      
      const result = {
        batch_id: batchId,
        compared_file_name: file.fileName,
        compared_file_path: file.filePath,
        compared_file_hash: file.fileHash,
        grade_level: gradeLevel,
        comparison_type: comparisonType,
        comparison_source: 'internal',
        
        // المقارنة الداخلية
        internal_matches: internalMatches.slice(0, 5),
        internal_max_similarity: internalMaxSim,
        internal_high_risk_count: internalHighRisk,
        
        // المقارنة مع المستودع - ستتم في background
        repository_matches: [],
        repository_max_similarity: 0,
        repository_high_risk_count: 0,
        
        // الإحصائيات الإجمالية
        matches: internalMatches.slice(0, 5),
        max_similarity_score: internalMaxSim,
        total_matches_found: internalMatches.length,
        high_risk_matches: internalHighRisk,
        status,
        review_required: status === 'flagged',
        
        // ⚡ Metadata لاستخراج segments on-demand
        segments_metadata: {
          internal_file_pairs: internalMatches
            .filter(m => m.similarity_score >= 0.40)
            .map(m => ({
              file1_hash: file.fileHash,
              file2_name: m.matched_file_name,
              similarity: m.similarity_score,
            })),
        },
        segments_processing_status: 'pending',
        segments_count: 0,
        
        added_to_repository: true,
        repository_file_id: repositoryFileIds.get(file.fileHash),
        requested_by: userId,
        school_id: schoolId,
        processing_time_ms: Date.now() - startTime,
        algorithm_used: 'batch_comparison',
      };

      // ✅ محاولة الحفظ مع معالجة الأخطاء
      try {
        const { data: savedResult, error: saveError } = await supabase
          .from('pdf_comparison_results')
          .insert(result)
          .select()
          .single();

        if (saveError) {
          console.error(`❌ Failed to save result for ${file.fileName}:`, saveError);
          // ✅ إضافة النتيجة حتى لو فشل الحفظ
          results.push({
            ...result,
            id: crypto.randomUUID(), // توليد ID مؤقت
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            _error: saveError.message, // وضع علامة على الخطأ
          } as any);
        } else if (savedResult) {
          results.push(savedResult);
          
          // تسجيل في audit log
          await supabase.from('pdf_comparison_audit_log').insert({
            comparison_result_id: savedResult.id,
            action_type: 'batch_compare',
            performed_by: userId,
            details: {
              fileName: file.fileName,
              batchId,
              internalMatches: internalMatches.length,
              maxSimilarity: internalMaxSim,
              status,
            },
          });
        }
      } catch (error) {
        console.error(`❌ Exception saving result for ${file.fileName}:`, error);
        results.push({
          ...result,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          _error: error instanceof Error ? error.message : String(error),
        } as any);
      }
    }

    // ⚡ معالجة المستودع في background باستخدام pgvector
    const backgroundRepositoryComparison = async () => {
      try {
        console.log('🔄 Starting background repository comparison with pgvector...');
        console.log(`📊 Processing ${files.length} files for repository comparison`);
        const repoStartTime = Date.now();
        
        // معالجة كل ملف على حدة
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const savedResult = results[i];
          
          if (!savedResult?.id) {
            console.log(`⚠️ Skipping ${file.fileName} - no saved result ID`);
            continue;
          }
          
          console.log(`🔍 [${i+1}/${files.length}] Comparing ${file.fileName} against repository using pgvector...`);
          console.log(`📋 Result ID: ${savedResult.id}, comparison_source: ${savedResult.comparison_source}`);
          
          // استخدام embedding و keywords المولدة مسبقاً
          const queryEmbedding = fileEmbeddings[i].embedding;
          const queryKeywords = fileEmbeddings[i].keywords;
          const queryWordCount = fileEmbeddings[i].wordCount;
          const queryPageCount = fileEmbeddings[i].pageCount;
          
          try {
            // ✅ استدعاء الدالة الجديدة مع structural filters و real Jaccard
            const { data: matches, error: rpcError } = await supabase.rpc(
              'match_documents_hybrid',
              {
                query_embedding: queryEmbedding,
                query_keywords: queryKeywords,
                match_threshold: 0.35, // ✅ عرض ملفات المستودع بتشابه ≥ 35%
                match_count: 100,
                p_grade_level: gradeLevel,
                p_project_type: comparisonType === 'mini_project' ? 'mini_project' : 'final_project',
                jaccard_threshold: 0.20, // ✅ تخفيض للسماح بمزيد من النتائج
                p_page_count: queryPageCount, // ✅ structural filter
                p_word_count: queryWordCount  // ✅ structural filter
              }
            );
            
            if (rpcError) {
              console.error(`❌ RPC error for ${file.fileName}:`, rpcError);
              continue;
            }
            
            console.log(`✅ Found ${matches?.length || 0} potential matches for ${file.fileName}`);
            
            // تصفية الملفات المضافة حديثاً
            const filteredMatches = (matches || []).filter(
              (m: any) => !newlyAddedIds.has(m.id)
            );
            
            console.log(`✅ After filtering: ${filteredMatches.length} matches for ${file.fileName}`);
            
            // تحويل النتائج إلى الصيغة المطلوبة
            const repositoryMatches = filteredMatches.map((match: any) => ({
              matched_file_id: match.id,
              matched_file_name: match.file_name,
              similarity_score: Math.round(match.similarity * 100) / 100,
              similarity_method: 'pgvector_cosine',
              flagged: match.similarity >= 0.70,
            })).slice(0, 5); // أخذ أعلى 5 فقط
            
            // تحديث النتيجة في قاعدة البيانات
            if (repositoryMatches.length > 0) {
              const repoMaxSim = Math.max(...repositoryMatches.map(m => m.similarity_score));
              const repoHighRisk = repositoryMatches.filter(m => m.flagged).length;
              
              // إعادة حساب الـ status الإجمالي
              const internalMaxSim = savedResult.internal_max_similarity || 0;
              const overallMaxSim = Math.max(internalMaxSim, repoMaxSim);
              let newStatus = savedResult.status;
              if (overallMaxSim >= 0.70) newStatus = 'flagged';
              else if (overallMaxSim >= 0.40) newStatus = 'warning';
              
              console.log(`📤 Updating result for ${file.fileName}:`, {
                resultId: savedResult.id,
                repositoryMatches: repositoryMatches.length,
                repoMaxSim,
                overallMaxSim,
                newStatus,
                comparison_source: 'both'
              });
              
              const { error: updateError } = await supabase
                .from('pdf_comparison_results')
                .update({
                  repository_matches: repositoryMatches,
                  repository_max_similarity: repoMaxSim,
                  repository_high_risk_count: repoHighRisk,
                  comparison_source: 'both',
                  status: newStatus,
                  max_similarity_score: overallMaxSim,
                  total_matches_found: (savedResult.internal_matches?.length || 0) + repositoryMatches.length,
                  high_risk_matches: (savedResult.internal_high_risk_count || 0) + repoHighRisk,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', savedResult.id);
              
              if (updateError) {
                console.error(`❌ Error updating result for ${file.fileName}:`, updateError);
              } else {
                console.log(`✅ Successfully updated ${file.fileName} with ${repositoryMatches.length} repo matches (status: ${newStatus})`);
              }
            } else {
              console.log(`ℹ️ No repository matches for ${file.fileName} after filtering`);
              
              // تحديث comparison_source إلى 'both' حتى لو لم تكن هناك مطابقات
              const { error: updateError } = await supabase
                .from('pdf_comparison_results')
                .update({
                  comparison_source: 'both',
                  repository_matches: [],
                  repository_max_similarity: 0,
                  repository_high_risk_count: 0,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', savedResult.id);
              
              if (updateError) {
                console.error(`❌ Error updating result for ${file.fileName}:`, updateError);
              } else {
                console.log(`✅ Updated ${file.fileName} to comparison_source='both' (no matches)`);
              }
            }
          } catch (fileError) {
            console.error(`❌ Error processing ${file.fileName}:`, fileError);
          }
        }
        
        const repoEndTime = Date.now();
        const totalRepoTime = repoEndTime - repoStartTime;
        
        console.log(`✅ Background repository comparison completed in ${totalRepoTime}ms`);
        console.log(`📊 Summary: Processed ${files.length} files`);
        
        // تسجيل الأداء
        await supabase.from('pdf_comparison_performance_log').insert({
          operation_type: 'repository_comparison',
          file_count: files.length,
          execution_time_ms: totalRepoTime,
          grade_level: gradeLevel,
          performed_by: userId,
          school_id: schoolId,
          metadata: {
            avg_time_per_file: totalRepoTime / files.length,
            using_pgvector: true,
            embedding_dim: 384,
            method: 'hybrid_screening'
          }
        });
        
      } catch (bgError) {
        console.error('❌ Background repository comparison failed:', bgError);
      }
    };

    // ⚡ بدء background task لمعالجة المستودع باستخدام waitUntil
    // هذا يضمن بقاء الـ Edge Function حياً حتى يكتمل الـ Promise
    EdgeRuntime.waitUntil(
      backgroundRepositoryComparison().catch(err => 
        console.error('Background task error:', err)
      )
    );

    console.log(`⚡ Returning results immediately (${Date.now() - startTime}ms)`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        batchId,
        totalFiles: files.length,
        processingTime: Date.now() - startTime,
        note: 'Repository comparison running in background',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in pdf-compare-batch function:', error);
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