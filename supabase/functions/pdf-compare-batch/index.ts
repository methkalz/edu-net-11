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
            // سيتم استخراجها on-demand عند طلب المستخدم
            
            file1Comparisons.push({
              matched_file_name: file2.fileName,
              similarity_score: Math.round(similarity * 100) / 100,
              similarity_method: 'text_comparison',
              flagged: similarity >= 0.70,
              matched_segments: matchedSegments,
            });
          }
        }

        // ترتيب وأخذ أعلى 5
        file1Comparisons.sort((a, b) => b.similarity_score - a.similarity_score);
        internalComparisons.set(file1.fileHash, file1Comparisons.slice(0, 5));
      }
    }

    // الخطوة 3: المقارنة مع المستودع
    console.log('🗄️ Step 3: Repository comparison...');
    
    const uploadedHashes = files.map((f: FileToCompare) => f.fileHash);
    
    console.log(`📤 Uploaded files hashes:`, uploadedHashes.map(h => 
      `${h.substring(0, 12)}...${h.substring(h.length - 8)}`
    ));
    
    // جلب جميع ملفات المستودع بدون فلترة
    const { data: allRepositoryFiles, error: repoError } = await supabase
      .from('pdf_comparison_repository')
      .select('*')
      .eq('grade_level', gradeLevel)
      .eq('project_type', comparisonType)
      .order('created_at', { ascending: false });

    if (repoError) {
      console.error('❌ Error fetching repository files:', repoError);
    }

    // عدم فلترة ملفات المستودع - المقارنة مع الجميع لاكتشاف المطابقات
    const repositoryFiles = allRepositoryFiles || [];

    console.log(`📚 Repository files for comparison:`, {
      total: repositoryFiles.length,
      gradeLevel,
      comparisonType,
    });

    if (repositoryFiles.length > 0) {
      console.log(`📄 Sample repository files:`, 
        repositoryFiles.slice(0, 5).map(f => ({
          name: f.file_name,
          hash: `${f.text_hash?.substring(0, 12)}...${f.text_hash?.substring(f.text_hash.length - 8)}`,
          textLength: f.extracted_text?.length || 0,
          createdAt: f.created_at,
        }))
      );
    }

    // الخطوة 4: مقارنة كل ملف مع المستودع وحفظ النتائج
    for (const file of files) {
      const internalMatches = internalComparisons.get(file.fileHash) || [];
      let repositoryMatches = [];

      // مقارنة مع ملفات المستودع
      if (repositoryFiles && repositoryFiles.length > 0) {
        const text1 = preprocessText(file.fileText, file.fileText.split(/\s+/).length);

        // فحص تطابق Hash مباشر مع المستودع أولاً
        const exactHashMatch = repositoryFiles.find(rf => rf.text_hash === file.fileHash);
        if (exactHashMatch) {
          console.log(`🎯 EXACT HASH MATCH found in repository!`, {
            uploadedFile: file.fileName,
            matchedFile: exactHashMatch.file_name,
            hash: `${file.fileHash.substring(0, 12)}...`,
          });
          
          repositoryMatches.push({
            matched_file_id: exactHashMatch.id,
            matched_file_name: exactHashMatch.file_name,
            similarity_score: 1.0,
            similarity_method: 'hash_exact_match',
            flagged: true,
          });
        }

        // مقارنة مع جميع ملفات المستودع
        for (const repoFile of repositoryFiles) {
          if (!repoFile.extracted_text) continue;

          // تخطي المقارنة النصية إذا كان هناك مطابقة hash بالفعل
          if (repoFile.text_hash === file.fileHash) continue;

          const text2 = preprocessText(
            repoFile.extracted_text,
            repoFile.extracted_text.split(/\s+/).length
          );

          const similarity = calculateSimilarity(text1, text2);

          if (similarity > 0.20) {
            console.log(`🔍 Match detected:`, {
              uploadedFile: file.fileName,
              uploadedHash: `${file.fileHash.substring(0, 12)}...`,
              repoFile: repoFile.file_name,
              repoHash: `${repoFile.text_hash?.substring(0, 12)}...`,
              similarity: Math.round(similarity * 100) / 100,
              isExactHash: file.fileHash === repoFile.text_hash,
            });
          }

          if (similarity > 0.20) {
            // ⚡ لا نستخرج segments هنا لتوفير CPU time
            
            repositoryMatches.push({
              matched_file_id: repoFile.id,
              matched_file_name: repoFile.file_name,
              similarity_score: Math.round(similarity * 100) / 100,
              similarity_method: 'text_comparison',
              flagged: similarity >= 0.70,
              matched_segments: matchedSegments,
            });

            console.log(
              `✅ Repository match: ${file.fileName} vs ${repoFile.file_name} = ${Math.round(similarity * 100)}%`
            );
          }
        }

        repositoryMatches.sort((a, b) => b.similarity_score - a.similarity_score);
      }

      // فلترة الملفات المضافة حديثاً من النتائج النهائية
      const filteredRepoMatches = repositoryMatches.filter(
        m => !newlyAddedIds.has(m.matched_file_id)
      );

      console.log(`🔍 Repository matches for ${file.fileName}:`, {
        beforeFilter: repositoryMatches.length,
        afterFilter: filteredRepoMatches.length,
        newlyAddedIdsCount: newlyAddedIds.size,
        isFileNewlyAdded: newlyAddedIds.has(repositoryFileIds.get(file.fileHash) || ''),
        fileRepoId: repositoryFileIds.get(file.fileHash),
      });

      // استخدام النتائج المفلترة
      repositoryMatches = filteredRepoMatches;

      // حساب الإحصائيات
      const internalMaxSim = internalMatches.length > 0
        ? Math.max(...internalMatches.map(m => m.similarity_score))
        : 0;
      const internalHighRisk = internalMatches.filter(m => m.flagged).length;

      const repoMaxSim = repositoryMatches.length > 0
        ? Math.max(...repositoryMatches.map(m => m.similarity_score))
        : 0;
      const repoHighRisk = repositoryMatches.filter(m => m.flagged).length;

      const overallMaxSim = Math.max(internalMaxSim, repoMaxSim);
      
      // تصنيف محسّن مع مستويات متدرجة
      let status = 'safe';
      
      if (overallMaxSim >= 0.70) {
        status = 'flagged';
      } else if (overallMaxSim >= 0.40) {
        status = 'warning';
      } else if (overallMaxSim >= 0.20) {
        status = 'review';
      }
      
      console.log(`📊 Comparison Summary for ${file.fileName}:`, {
        internalMatches: internalMatches.length,
        repositoryMatches: repositoryMatches.length,
        maxSimilarity: Math.round(overallMaxSim * 100) + '%',
        status,
        addedToRepo: repositoryFileIds.has(file.fileHash),
        repoId: repositoryFileIds.get(file.fileHash),
      });

      const comparisonSource = 
        internalMatches.length > 0 && repositoryMatches.length > 0 ? 'both' :
        internalMatches.length > 0 ? 'internal' :
        'repository';

      // ⚡ تخزين معلومات لاستخراج segments لاحقاً (on-demand)
      const segmentsMetadata = {
        internal_file_pairs: internalMatches
          .filter(m => m.similarity_score >= 0.40)
          .map(m => ({
            file1_hash: file.fileHash,
            file2_name: m.matched_file_name,
            similarity: m.similarity_score,
          })),
        repository_matches: repositoryMatches
          .filter(m => m.similarity_score >= 0.40)
          .map(m => ({
            file_hash: file.fileHash,
            repo_file_id: m.matched_file_id,
            repo_file_name: m.matched_file_name,
            similarity: m.similarity_score,
          })),
      };

      // حفظ النتيجة
      const result = {
        batch_id: batchId,
        compared_file_name: file.fileName,
        compared_file_path: file.filePath,
        compared_file_hash: file.fileHash,
        grade_level: gradeLevel,
        comparison_type: comparisonType,
        comparison_source: comparisonSource,
        
        // المقارنة الداخلية
        internal_matches: internalMatches.slice(0, 5),
        internal_max_similarity: internalMaxSim,
        internal_high_risk_count: internalHighRisk,
        
        // المقارنة مع المستودع
        repository_matches: repositoryMatches.slice(0, 5),
        repository_max_similarity: repoMaxSim,
        repository_high_risk_count: repoHighRisk,
        
        // الإحصائيات الإجمالية
        matches: [...internalMatches, ...repositoryMatches].slice(0, 5),
        max_similarity_score: overallMaxSim,
        total_matches_found: internalMatches.length + repositoryMatches.length,
        high_risk_matches: internalHighRisk + repoHighRisk,
        status,
        review_required: status === 'flagged',
        
        // ⚡ Metadata لاستخراج segments on-demand
        segments_metadata: segmentsMetadata,
        segments_processing_status: 'pending',
        segments_count: segmentsMetadata.internal_file_pairs.length + segmentsMetadata.repository_matches.length,
        
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
              repositoryMatches: repositoryMatches.length,
              maxSimilarity: overallMaxSim,
              status,
            },
          });
        }
      } catch (error) {
        console.error(`❌ Exception saving result for ${file.fileName}:`, error);
        // ✅ إضافة النتيجة حتى في حالة exception
        results.push({
          ...result,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          _error: error instanceof Error ? error.message : String(error),
        } as any);
      }
    }

    console.log(`✅ Batch comparison completed in ${Date.now() - startTime}ms`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        batchId,
        totalFiles: files.length,
        processingTime: Date.now() - startTime,
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