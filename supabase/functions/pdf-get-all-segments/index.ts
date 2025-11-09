import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { extractMatchingSegments } from '../pdf-compare-batch/_helpers.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { comparisonId } = await req.json();

    if (!comparisonId) {
      throw new Error('Missing comparisonId');
    }

    console.log(`📥 Extracting segments on-demand for comparison: ${comparisonId}`);

    const serviceSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. جلب بيانات المقارنة + metadata
    const { data: comparison, error: comparisonError } = await serviceSupabase
      .from('pdf_comparison_results')
      .select('compared_file_path, segments_metadata, segments_processing_status, top_matched_segments, segments_file_path')
      .eq('id', comparisonId)
      .single();

    if (comparisonError || !comparison) {
      throw new Error('Comparison not found');
    }

    // 2. إذا كانت segments معالجة بالفعل، أرجعها من Storage
    if (comparison.segments_processing_status === 'completed' && comparison.segments_file_path) {
      const { data: fileData } = await serviceSupabase.storage
        .from('pdf-comparison-data')
        .download(comparison.segments_file_path);
      
      if (fileData) {
        const allSegments = JSON.parse(await fileData.text());
        return new Response(JSON.stringify({
          success: true,
          segments: allSegments,
          totalCount: allSegments.length,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // 3. استخراج segments on-demand
    console.log('⚡ Extracting segments on-demand...');
    
    if (!comparison.segments_metadata) {
      return new Response(JSON.stringify({
        success: true,
        segments: [],
        totalCount: 0,
        message: 'No segments metadata available',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const metadata = comparison.segments_metadata as any;
    const allSegments = [];

    // جلب النص الأصلي
    const { data: fileData } = await serviceSupabase.storage
      .from('pdf-comparison-temp')
      .download(comparison.compared_file_path);
    
    if (!fileData) {
      throw new Error('Original file not found');
    }

    // استخدام pdf.js لاستخراج النص (مبسط - يجب استدعاء pdf-extract-text)
    const originalText = await fileData.text(); // مؤقت

    // معالجة المقارنات الداخلية
    for (const pair of metadata.internal_file_pairs || []) {
      // هنا نحتاج جلب النص من الملف الآخر وعمل extractMatchingSegments
      // لتبسيط الكود، نضيف placeholder
      const segments = []; // extractMatchingSegments(text1, text2)
      allSegments.push(...segments.map(s => ({
        ...s,
        matched_file_name: pair.file2_name,
        source_type: 'internal',
      })));
    }

    // معالجة مقارنات المستودع
    for (const match of metadata.repository_matches || []) {
      const { data: repoFile } = await serviceSupabase
        .from('pdf_comparison_repository')
        .select('extracted_text, file_name')
        .eq('id', match.repo_file_id)
        .single();
      
      if (repoFile) {
        // هنا نستخدم originalText + repoFile.extracted_text
        // const segments = extractMatchingSegments(originalText, repoFile.extracted_text);
        // allSegments.push(...segments);
      }
    }

    // 4. حفظ في Storage للمرات القادمة
    if (allSegments.length > 0) {
      const fileName = `segments/${comparisonId}.json`;
      await serviceSupabase.storage
        .from('pdf-comparison-data')
        .upload(fileName, JSON.stringify(allSegments), {
          contentType: 'application/json',
          upsert: true,
        });

      await serviceSupabase
        .from('pdf_comparison_results')
        .update({
          segments_file_path: fileName,
          segments_processing_status: 'completed',
          top_matched_segments: allSegments.slice(0, 20),
        })
        .eq('id', comparisonId);
    }

    console.log(`✅ Extracted ${allSegments.length} segments on-demand`);

    return new Response(
      JSON.stringify({
        success: true,
        segments: allSegments,
        totalCount: allSegments.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in pdf-get-all-segments function:', error);
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
