import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId } = await req.json();
    
    console.log('Fetching stats for document:', documentId);
    
    if (!documentId) {
      throw new Error('Document ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the Google document info
    const { data: docData, error: docError } = await supabase
      .from('google_documents')
      .select('doc_google_id, google_doc_url')
      .eq('id', documentId)
      .single();

    if (docError || !docData) {
      console.error('Document not found:', docError);
      throw new Error('Document not found');
    }

    console.log('Document found:', docData.doc_google_id);

    // For now, return mock data until we properly set up Google API authentication
    // You'll need to add proper Google Service Account credentials
    const mockWordCount = Math.floor(Math.random() * 1000) + 100;
    const mockCharCount = mockWordCount * 6;

    console.log('Returning stats:', { wordCount: mockWordCount, characterCount: mockCharCount });

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          wordCount: mockWordCount,
          characterCount: mockCharCount
        },
        message: 'Note: These are placeholder stats. Configure Google Service Account for real data.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error fetching document stats:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
