import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { html, title, options } = await req.json();
    
    // For now, we'll create a simple PDF generation response
    // In production, you would use Puppeteer or similar
    const mockPdfBuffer = new TextEncoder().encode(`
      PDF Export for: ${title}
      
      Content: ${html}
      
      Options: ${JSON.stringify(options)}
    `);
    
    // Convert to base64
    const base64Pdf = btoa(String.fromCharCode(...mockPdfBuffer));
    
    return new Response(JSON.stringify({ 
      pdf: base64Pdf,
      title: title 
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });
  } catch (error) {
    console.error('Error in export-to-pdf function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });
  }
});