import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { generateEmbedding, extractTopKeywords } from '../_shared/embeddings.ts';
import { getPDFComparisonSettings } from '../_shared/pdf-settings.ts';

interface FileInput {
  fileName: string;
  filePath: string;
  fileText: string;
  fileHash: string;
  filePages: number;
  fileSize?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const settings = await getPDFComparisonSettings(supabase);

    const { files, gradeLevel, comparisonType, userId, schoolId } =
      (await req.json()) as {
        files: FileInput[];
        gradeLevel: string;
        comparisonType: string;
        userId: string;
        schoolId?: string;
      };

    if (!files?.length) throw new Error('No files provided');
    console.log(`📦 Enqueueing batch of ${files.length} files (Grade ${gradeLevel})`);

    const batchId = crypto.randomUUID();
    const resultIds: string[] = [];

    // توليد embeddings + keywords لكل ملف (سريع — ~100ms لكل ملف)
    const enrichedFiles = files.map((file, idx) => {
      const embedding = generateEmbedding(file.fileText, 1024, settings.custom_whitelist);
      const keywords = extractTopKeywords(file.fileText, 150, settings.custom_whitelist);
      const wordCount = file.fileText.split(/\s+/).length;
      return { ...file, embedding, keywords, wordCount, index: idx };
    });

    console.log(`✅ Generated embeddings for ${enrichedFiles.length} files`);

    // إدخال result rows
    for (const file of enrichedFiles) {
      const resultRow = {
        batch_id: batchId,
        compared_file_name: file.fileName,
        compared_file_path: file.filePath,
        compared_file_hash: file.fileHash,
        compared_extracted_text: file.fileText,
        grade_level: gradeLevel,
        comparison_type: comparisonType,
        comparison_source: 'internal',
        embedding: file.embedding,
        top_keywords: file.keywords,
        batch_status: 'pending',
        internal_matches: [],
        repository_matches: [],
        matches: [],
        max_similarity_score: 0,
        avg_similarity_score: 0,
        total_matches_found: 0,
        high_risk_matches: 0,
        internal_max_similarity: 0,
        internal_high_risk_count: 0,
        repository_max_similarity: 0,
        repository_high_risk_count: 0,
        status: 'safe',
        review_required: false,
        requested_by: userId,
        school_id: schoolId,
        processing_time_ms: 0,
        algorithm_used: 'queue_batch',
        total_files_compared: files.length,
      };

      const { data, error } = await supabase
        .from('pdf_comparison_results')
        .insert(resultRow)
        .select('id')
        .single();

      if (error) {
        console.error(`❌ Failed to insert result for ${file.fileName}:`, error);
        throw new Error(`فشل حفظ بيانات الملف: ${file.fileName}`);
      }

      resultIds.push(data.id);
    }

    console.log(`✅ Inserted ${resultIds.length} result rows`);

    // إدخال job واحد للمقارنة الداخلية
    const { error: jobError } = await supabase
      .from('pdf_comparison_jobs')
      .insert({
        batch_id: batchId,
        job_type: 'internal',
        status: 'pending',
        grade_level: gradeLevel,
        comparison_type: comparisonType,
        requested_by: userId,
        school_id: schoolId,
      });

    if (jobError) {
      console.error('❌ Failed to create internal job:', jobError);
      throw new Error('فشل إنشاء مهمة المقارنة');
    }

    console.log(`✅ Enqueued batch ${batchId} with 1 internal job`);

    return new Response(
      JSON.stringify({
        success: true,
        batchId,
        resultIds,
        message: `تم تسجيل ${files.length} ملف للمقارنة. ستتم المعالجة في الخلفية.`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Enqueue error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'خطأ غير معروف',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
