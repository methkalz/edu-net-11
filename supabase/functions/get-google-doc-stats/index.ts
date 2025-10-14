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
    
    if (!documentId) {
      throw new Error('Document ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the Google document info
    const { data: docData, error: docError } = await supabase
      .from('google_documents')
      .select('doc_google_id, encrypted_doc_id')
      .eq('id', documentId)
      .single();

    if (docError || !docData) {
      throw new Error('Document not found');
    }

    // Get Google service account credentials
    const googleCredsJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    if (!googleCredsJson) {
      throw new Error('Google service account credentials not configured');
    }

    const googleCreds = JSON.parse(googleCredsJson);
    
    // Get access token from Google
    const jwtHeader = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const now = Math.floor(Date.now() / 1000);
    const jwtClaimSet = btoa(JSON.stringify({
      iss: googleCreds.client_email,
      scope: "https://www.googleapis.com/auth/documents.readonly",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now
    }));

    const signatureInput = `${jwtHeader}.${jwtClaimSet}`;
    
    // Import the private key
    const privateKey = await crypto.subtle.importKey(
      "pkcs8",
      new TextEncoder().encode(
        googleCreds.private_key
          .replace(/-----BEGIN PRIVATE KEY-----/, "")
          .replace(/-----END PRIVATE KEY-----/, "")
          .replace(/\n/g, "")
      ),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      privateKey,
      new TextEncoder().encode(signatureInput)
    );

    const jwt = `${signatureInput}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`;

    // Exchange JWT for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });

    const { access_token } = await tokenResponse.json();

    // Fetch document content from Google Docs API
    const docResponse = await fetch(
      `https://docs.googleapis.com/v1/documents/${docData.doc_google_id}`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!docResponse.ok) {
      throw new Error(`Failed to fetch document: ${docResponse.statusText}`);
    }

    const document = await docResponse.json();

    // Extract text content and calculate stats
    let text = '';
    
    if (document.body && document.body.content) {
      for (const element of document.body.content) {
        if (element.paragraph) {
          for (const textElement of element.paragraph.elements || []) {
            if (textElement.textRun && textElement.textRun.content) {
              text += textElement.textRun.content;
            }
          }
        }
      }
    }

    const wordCount = text
      .split(/\s+/)
      .filter(word => word.length > 0 && word !== '\n').length;
    
    const characterCount = text.replace(/\n/g, '').length;

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          wordCount,
          characterCount
        }
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
