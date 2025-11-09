import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
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

    // الخطوة 2: المقارنة الداخلية (بين الملفات المرفوعة) إذا كان هناك أكثر من ملف
    console.log('🔄 Step 2: Internal comparison...');
    const internalComparisons: Map<string, any[]> = new Map();

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

          // مقارنة النصوص
          const text1 = preprocessText(file1.fileText, file1.fileText.split(/\s+/).length);
          const text2 = preprocessText(file2.fileText, file2.fileText.split(/\s+/).length);

          const similarity = calculateSimilarity(text1, text2);

          // خفض العتبة من 0.25 إلى 0.20
          if (similarity > 0.20) {
            // ⚡ لا نستخرج segments هنا لتوفير CPU time
            
            file1Comparisons.push({
              matched_file_name: file2.fileName,
              similarity_score: Math.round(similarity * 100) / 100,
              similarity_method: 'text_comparison',
              flagged: similarity >= 0.70,
            });
          }
        }

        // ترتيب وأخذ أعلى 5
        file1Comparisons.sort((a, b) => b.similarity_score - a.similarity_score);
        internalComparisons.set(file1.fileHash, file1Comparisons.slice(0, 5));
      }
    }

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

    // ⚡ معالجة المستودع في background بعد إرجاع النتائج
    const backgroundRepositoryComparison = async () => {
      console.log('🔄 Starting background repository comparison...');
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          // جلب نتيجة المقارنة المحفوظة
          const savedResult = results[i];
          if (!savedResult?.id) continue;

          // المقارنة مع المستودع في الخلفية
          const { data: repoFiles } = await supabase
            .from('pdf_comparison_repository')
            .select('id, file_name, file_path, text_hash, extracted_text, word_count, grade_level, project_type')
            .eq('grade_level', gradeLevel)
            .eq('project_type', comparisonType)
            .neq('text_hash', file.fileHash)
            .limit(50);

          if (!repoFiles || repoFiles.length === 0) continue;

          const repositoryMatches = [];
          const preprocessed1 = preprocessText(file.fileText, 5000);

          for (const repoFile of repoFiles) {
            const preprocessed2 = preprocessText(repoFile.extracted_text, 5000);
            const similarity = calculateSimilarity(preprocessed1, preprocessed2);
            
            if (similarity > 0.20) {
              repositoryMatches.push({
                matched_file_id: repoFile.id,
                matched_file_name: repoFile.file_name,
                similarity_score: similarity,
                similarity_method: 'hybrid',
                flagged: similarity >= 0.60,
              });
            }
          }

          // تصفية الملفات المضافة حديثاً
          const filteredMatches = repositoryMatches.filter(
            m => !newlyAddedIds.has(m.matched_file_id)
          );

          // تحديث النتيجة في DB
          if (filteredMatches.length > 0) {
            const repoMaxSim = Math.max(...filteredMatches.map(m => m.similarity_score));
            const repoHighRisk = filteredMatches.filter(m => m.flagged).length;
            
            // إعادة حساب الـ status الإجمالي
            const internalMaxSim = savedResult.internal_max_similarity || 0;
            const overallMaxSim = Math.max(internalMaxSim, repoMaxSim);
            let newStatus = savedResult.status;
            if (overallMaxSim >= 0.70) newStatus = 'flagged';
            else if (overallMaxSim >= 0.40) newStatus = 'warning';

            await supabase
              .from('pdf_comparison_results')
              .update({
                repository_matches: filteredMatches.slice(0, 5),
                repository_max_similarity: repoMaxSim,
                repository_high_risk_count: repoHighRisk,
                comparison_source: 'both',
                status: newStatus,
                max_similarity_score: overallMaxSim,
                total_matches_found: (savedResult.internal_matches?.length || 0) + filteredMatches.length,
                high_risk_matches: (savedResult.internal_high_risk_count || 0) + repoHighRisk,
                updated_at: new Date().toISOString(),
              })
              .eq('id', savedResult.id);

            console.log(`✅ Updated ${file.fileName} with ${filteredMatches.length} repo matches (status: ${newStatus})`);
          } else {
            console.log(`ℹ️ No repository matches for ${file.fileName} after filtering`);
          }
        } catch (error) {
          console.error(`❌ Background comparison failed for ${file.fileName}:`, error);
        }
      }
      
      console.log('✅ Background repository comparison completed');
    };

    // ⚡ بدء background task لمعالجة المستودع
    // ملاحظة: Promise سيستمر بعد إرجاع Response
    backgroundRepositoryComparison().catch(err => 
      console.error('Background task error:', err)
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