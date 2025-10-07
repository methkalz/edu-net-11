import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to create JWT for Google API
async function createGoogleJWT(serviceAccount: any, scope: string): Promise<string> {
  const header = {
    alg: "RS256",
    typ: "JWT"
  };

  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: serviceAccount.client_email,
    scope: scope,
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now
  };

  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedClaim = btoa(JSON.stringify(claim)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const signatureInput = `${encodedHeader}.${encodedClaim}`;

  // Import private key
  const privateKey = serviceAccount.private_key;
  console.log('Private key length:', privateKey.length);
  
  // Clean up the private key by removing headers, footers, and all whitespace/newlines
  const pemContents = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\\n/g, '')  // Remove escaped newlines (\n as text)
    .replace(/\n/g, '')   // Remove actual newlines
    .replace(/\r/g, '')   // Remove carriage returns
    .replace(/\s/g, '')   // Remove all whitespace
    .trim();
  
  console.log('PEM contents length after cleanup:', pemContents.length);
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signatureInput)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${signatureInput}.${encodedSignature}`;
}

// Get access token from Google
async function getAccessToken(serviceAccount: any): Promise<string> {
  const scope = "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/documents";
  const jwt = await createGoogleJWT(serviceAccount, scope);

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to get access token: ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studentName, documentContent, folderId } = await req.json();

    console.log('Creating Google Doc for student:', studentName);

    // Parse Google credentials from environment
    const googlePrivateKey = Deno.env.get('GOOGLE_PRIVATE_KEY');
    if (!googlePrivateKey) {
      throw new Error('GOOGLE_PRIVATE_KEY not found in environment');
    }

    const serviceAccount = JSON.parse(googlePrivateKey);
    console.log('Service account email:', serviceAccount.client_email);

    // Get access token
    const accessToken = await getAccessToken(serviceAccount);

    // Create Google Doc
    const title = `مستند ${studentName} - ${new Date().toISOString().split('T')[0]}`;
    const createDocResponse = await fetch("https://docs.googleapis.com/v1/documents", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ title })
    });

    if (!createDocResponse.ok) {
      const error = await createDocResponse.text();
      throw new Error(`Failed to create document: ${error}`);
    }

    const doc = await createDocResponse.json();
    console.log('Document created:', doc.documentId);

    // Add content to the document
    if (documentContent) {
      await fetch(`https://docs.googleapis.com/v1/documents/${doc.documentId}:batchUpdate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          requests: [{
            insertText: {
              location: { index: 1 },
              text: documentContent
            }
          }]
        })
      });
    }

    // Set permissions to "Editor" for anyone with the link
    await fetch(`https://www.googleapis.com/drive/v3/files/${doc.documentId}/permissions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        type: "anyone",
        role: "writer"
      })
    });

    console.log('Permissions set successfully');

    // Get authenticated user from Supabase
    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader || '' } }
    });

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user profile to get school_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('user_id', user.id)
      .single();

    // Save document info to database
    const { error: dbError } = await supabase
      .from('google_documents')
      .insert({
        doc_google_id: doc.documentId,
        title: title,
        doc_url: `https://docs.google.com/document/d/${doc.documentId}/edit`,
        owner_id: user.id,
        owner_name: studentName,
        owner_email: user.email || '',
        school_id: profile?.school_id || null,
        last_accessed_at: new Date().toISOString()
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Failed to save to database: ${dbError.message}`);
    }

    console.log('Document saved to database');

    return new Response(
      JSON.stringify({
        success: true,
        documentId: doc.documentId,
        documentUrl: `https://docs.google.com/document/d/${doc.documentId}/edit`,
        title: title
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-google-doc:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
