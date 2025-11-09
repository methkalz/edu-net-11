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

    console.log(`📥 Fetching all segments for comparison: ${comparisonId}`);

    // 1. جلب المعلومات من DB
    const { data: comparison, error: comparisonError } = await supabase
      .from('pdf_comparison_results')
      .select('top_matched_segments, segments_file_path, segments_count')
      .eq('id', comparisonId)
      .single();

    if (comparisonError) {
      throw new Error(`Failed to fetch comparison: ${comparisonError.message}`);
    }

    if (!comparison) {
      throw new Error('Comparison not found');
    }

    // 2. إذا لم يكن هناك ملف، أرجع أول 20 فقط
    if (!comparison.segments_file_path) {
      console.log(`✅ Returning ${comparison.top_matched_segments?.length || 0} segments from DB`);
      return new Response(
        JSON.stringify({
          success: true,
          segments: comparison.top_matched_segments || [],
          hasMore: false,
          totalCount: comparison.segments_count || 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 3. تحميل الملف الكامل من Storage
    const storageClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: fileData, error: downloadError } = await storageClient.storage
      .from('pdf-comparison-data')
      .download(comparison.segments_file_path);

    if (downloadError) {
      console.error('❌ Failed to download segments file:', downloadError);
      // Fallback: إرجاع أول 20 من DB
      return new Response(
        JSON.stringify({
          success: true,
          segments: comparison.top_matched_segments || [],
          hasMore: false,
          totalCount: comparison.segments_count || 0,
          warning: 'Failed to load full segments, showing top 20 only',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const allSegments = JSON.parse(await fileData.text());
    
    console.log(`✅ Returning ${allSegments.length} segments from Storage`);

    return new Response(
      JSON.stringify({
        success: true,
        segments: allSegments,
        hasMore: false,
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
