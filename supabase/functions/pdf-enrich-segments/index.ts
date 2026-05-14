import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { extractMatchingSegments, calculateCoverage } from '../_shared/pdf-helpers.ts';
import { getPDFComparisonSettings } from '../_shared/pdf-settings.ts';

// حساب lazy للـ segments + coverage عند فتح نتيجة من الـ UI
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { result_id, against_id } = await req.json();
    if (!result_id || !against_id) {
      return new Response(JSON.stringify({ error: 'result_id and against_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // التحقق من JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // قراءة الملفين (مع فحص أنهما من نفس الـ batch + المدرسة عبر RLS لاحقاً)
    const { data: rows, error } = await supabase
      .from('pdf_comparison_results')
      .select('id, batch_id, school_id, compared_extracted_text, compared_file_pages')
      .in('id', [result_id, against_id]);

    if (error || !rows || rows.length !== 2) {
      return new Response(JSON.stringify({ error: 'Files not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (rows[0].batch_id !== rows[1].batch_id || rows[0].school_id !== rows[1].school_id) {
      return new Response(JSON.stringify({ error: 'Cross-batch enrichment not allowed' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const a = rows.find((r: any) => r.id === result_id)!;
    const b = rows.find((r: any) => r.id === against_id)!;

    if (!a.compared_extracted_text || !b.compared_extracted_text) {
      return new Response(JSON.stringify({ segments: [], coverage: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const settings = await getPDFComparisonSettings(supabase);
    const segments = extractMatchingSegments(a.compared_extracted_text, b.compared_extracted_text).slice(0, 10);
    const coverage = calculateCoverage(
      a.compared_extracted_text,
      b.compared_extracted_text,
      settings.thresholds.paragraph_similarity_min
    );

    return new Response(JSON.stringify({ segments, coverage: Math.round(coverage * 100) / 100 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('❌ enrich error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
