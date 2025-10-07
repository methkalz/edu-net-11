import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
  const scope = "https://www.googleapis.com/auth/drive.readonly";
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
    const { folderId: requestFolderId } = await req.json().catch(() => ({}));
    
    // Use the folder ID from the request, or fall back to the environment variable
    const folderId = requestFolderId || Deno.env.get('GOOGLE_FOLDER');

    console.log('Listing Drive files, folderId:', folderId);

    // Parse Google credentials from environment
    const googlePrivateKey = Deno.env.get('GOOGLE_PRIVATE_KEY');
    if (!googlePrivateKey) {
      throw new Error('GOOGLE_PRIVATE_KEY not found in environment');
    }

    const serviceAccount = JSON.parse(googlePrivateKey);
    console.log('Service account email:', serviceAccount.client_email);

    // Get access token
    const accessToken = await getAccessToken(serviceAccount);

    // Build query
    let query = "mimeType='application/vnd.google-apps.document'";
    if (folderId) {
      query += ` and '${folderId}' in parents`;
    }

    // List files from Google Drive
    const listResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,createdTime,modifiedTime,webViewLink)&orderBy=modifiedTime desc`,
      {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    if (!listResponse.ok) {
      const error = await listResponse.text();
      throw new Error(`Failed to list files: ${error}`);
    }

    const files = await listResponse.json();
    console.log('Files retrieved:', files.files?.length || 0);

    return new Response(
      JSON.stringify({
        success: true,
        files: files.files || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in list-drive-files:', error);
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
