import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import * as fuzzball from 'https://esm.sh/fuzzball@2.2.2';

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
    
    for (const file of files) {
      try {
        // إضافة للمستودع
        const addResult = await supabase.functions.invoke('pdf-add-to-repository', {
          body: {
            tempFilePath: file.filePath,
            fileName: file.fileName,
            extractedText: file.fileText,
            textHash: file.fileHash,
            pageCount: file.filePages,
            fileSize: 0,
            gradeLevel,
            projectType: comparisonType,
            uploadedBy: userId,
            schoolId,
            deleteTemp: false, // نحتفظ بالملف المؤقت للمقارنة
          },
        });

        if (addResult.data?.success && addResult.data?.data?.id) {
          repositoryFileIds.set(file.fileHash, addResult.data.data.id);
          console.log(`✅ Added ${file.fileName} to repository`);
        }
      } catch (error) {
        console.error(`❌ Error adding ${file.fileName} to repository:`, error);
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
            });
            continue;
          }

          // مقارنة النصوص
          const text1 = preprocessText(file1.fileText, file1.fileText.split(/\s+/).length);
          const text2 = preprocessText(file2.fileText, file2.fileText.split(/\s+/).length);

          const similarity = calculateSimilarity(text1, text2);

          // ✅ إصلاح 6: خفض العتبة من 0.30 إلى 0.25
          if (similarity > 0.25) {
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

    // الخطوة 3: المقارنة مع المستودع (باستثناء الملفات المرفوعة)
    console.log('🗄️ Step 3: Repository comparison...');
    
    // جلب ملفات المستودع (باستثناء الملفات المرفوعة حالياً)
    const uploadedHashes = files.map((f: FileToCompare) => f.fileHash);
    
    // ✅ إصلاح 1: جلب جميع ملفات المستودع ثم الفلترة يدوياً
    const { data: allRepositoryFiles, error: repoError } = await supabase
      .from('pdf_comparison_repository')
      .select('*')
      .eq('grade_level', gradeLevel)
      .eq('project_type', comparisonType)
      .order('created_at', { ascending: false });

    if (repoError) {
      console.error('❌ Error fetching repository files:', repoError);
    }

    // فلترة الملفات المرفوعة حالياً يدوياً (أكثر أماناً)
    const repositoryFiles = allRepositoryFiles?.filter(
      rf => !uploadedHashes.includes(rf.text_hash)
    ) || [];

    console.log(`📚 Repository query results:`, {
      total: allRepositoryFiles?.length || 0,
      afterFilter: repositoryFiles.length,
      gradeLevel,
      comparisonType,
      excludedHashes: uploadedHashes.length,
    });

    // عرض عينة من الملفات
    if (repositoryFiles.length > 0) {
      console.log(`📄 Sample repository files:`, 
        repositoryFiles.slice(0, 3).map(f => ({
          name: f.file_name,
          hash: f.text_hash?.substring(0, 10) + '...',
          textLength: f.extracted_text?.length || 0,
        }))
      );
    }

    // الخطوة 4: مقارنة كل ملف مع المستودع وحفظ النتائج
    for (const file of files) {
      const internalMatches = internalComparisons.get(file.fileHash) || [];
      const repositoryMatches = [];

      // مقارنة مع ملفات المستودع
      if (repositoryFiles && repositoryFiles.length > 0) {
        const text1 = preprocessText(file.fileText, file.fileText.split(/\s+/).length);

        // ✅ إصلاح 5: فحص تطابق Hash مباشر مع المستودع
        const exactHashMatch = repositoryFiles.find(rf => rf.text_hash === file.fileHash);
        if (exactHashMatch) {
          console.log(`🎯 EXACT HASH MATCH found in repository!`, {
            uploadedFile: file.fileName,
            matchedFile: exactHashMatch.file_name,
            hash: file.fileHash.substring(0, 10) + '...',
          });
          
          repositoryMatches.push({
            matched_file_id: exactHashMatch.id,
            matched_file_name: exactHashMatch.file_name,
            similarity_score: 1.0,
            similarity_method: 'hash_exact_match',
            flagged: true,
          });
        } else {
          // ✅ إصلاح 2: إزالة حد الـ 10 ملفات - مقارنة مع جميع ملفات المستودع
          for (const repoFile of repositoryFiles) {
          if (!repoFile.extracted_text) continue;

          const text2 = preprocessText(
            repoFile.extracted_text,
            repoFile.extracted_text.split(/\s+/).length
          );

          const similarity = calculateSimilarity(text1, text2);

          // ✅ إصلاح 6: خفض العتبة من 0.30 إلى 0.25 + إضافة logging
          if (similarity > 0.25) {
            // ✅ إصلاح 4: إضافة logging للمطابقات
            if (similarity > 0.20) {
              console.log(`🔍 Match found: ${file.fileName} vs ${repoFile.file_name}`, {
                similarity: Math.round(similarity * 100) / 100,
                jaccard: calculateJaccard(text1.wordSet, text2.wordSet),
                repoFileHash: repoFile.text_hash?.substring(0, 10) + '...',
              });
            }
            
            repositoryMatches.push({
              matched_file_id: repoFile.id,
              matched_file_name: repoFile.file_name,
              similarity_score: Math.round(similarity * 100) / 100,
              similarity_method: 'text_comparison',
              flagged: similarity >= 0.70,
            });
          }
        }

        repositoryMatches.sort((a, b) => b.similarity_score - a.similarity_score);
        } // نهاية else الخاص بفحص Hash
      }

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
      
      let status = 'safe';
      if (overallMaxSim >= 0.70) status = 'flagged';
      else if (overallMaxSim >= 0.50) status = 'warning';

      const comparisonSource = 
        internalMatches.length > 0 && repositoryMatches.length > 0 ? 'both' :
        internalMatches.length > 0 ? 'internal' :
        'repository';

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
        
        added_to_repository: true,
        repository_file_id: repositoryFileIds.get(file.fileHash),
        requested_by: userId,
        school_id: schoolId,
        processing_time_ms: Date.now() - startTime,
        algorithm_used: 'batch_comparison',
      };

      const { data: savedResult } = await supabase
        .from('pdf_comparison_results')
        .insert(result)
        .select()
        .single();

      if (savedResult) {
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

// Helper functions
function preprocessText(text: string, wordCount: number) {
  const normalized = normalizeArabicText(text);
  let words = normalized.split(/\s+/).filter(w => w.length > 2);
  
  const maxWords = 50000;
  if (words.length > maxWords) {
    const step = Math.floor(words.length / maxWords);
    words = words.filter((_, i) => i % step === 0).slice(0, maxWords);
  }
  
  const wordSet = new Set(words);
  return { normalized, words, wordSet };
}

function normalizeArabicText(text: string): string {
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

function calculateSimilarity(text1: any, text2: any): number {
  // ✅ إصلاح 3: تحسين دالة calculateSimilarity
  
  // 1. Jaccard Similarity (للكلمات المشتركة)
  const jaccard = calculateJaccard(text1.wordSet, text2.wordSet);
  
  // 2. Fuzzy Similarity (عينة أكبر من 5000 إلى 15000)
  const sampleSize = Math.min(
    15000,
    Math.min(text1.normalized.length, text2.normalized.length)
  );
  
  const sample1 = text1.normalized.substring(0, sampleSize);
  const sample2 = text2.normalized.substring(0, sampleSize);
  
  const fuzzy = fuzzball.ratio(sample1, sample2) / 100;
  
  // 3. حساب تشابه الجمل (Sentence-level similarity)
  const sentences1 = text1.normalized.split(/[.!?؟]/);
  const sentences2 = text2.normalized.split(/[.!?؟]/);
  
  let sentenceSimilarity = 0;
  if (sentences1.length > 0 && sentences2.length > 0) {
    const sentenceSet1 = new Set(sentences1.filter((s: string) => s.trim().length > 10));
    const sentenceSet2 = new Set(sentences2.filter((s: string) => s.trim().length > 10));
    sentenceSimilarity = calculateJaccard(sentenceSet1, sentenceSet2);
  }
  
  // 4. وزن متوازن: Jaccard: 40%, Fuzzy: 40%, Sentence: 20%
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