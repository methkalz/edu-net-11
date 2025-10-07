import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validate private key format
function validatePrivateKey(privateKey: string): { valid: boolean; error?: string } {
  if (!privateKey) {
    return { valid: false, error: 'PRIVATE_KEY is empty or undefined' };
  }
  
  if (!privateKey.includes('BEGIN PRIVATE KEY')) {
    return { valid: false, error: 'PRIVATE_KEY missing BEGIN header' };
  }
  
  if (!privateKey.includes('END PRIVATE KEY')) {
    return { valid: false, error: 'PRIVATE_KEY missing END footer' };
  }
  
  // Check for common formatting issues
  if (privateKey.includes('\\\\n')) {
    return { valid: false, error: 'PRIVATE_KEY contains double-escaped newlines (\\\\n)' };
  }
  
  return { valid: true };
}

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
  
  // Validate private key format first
  const validation = validatePrivateKey(privateKey);
  if (!validation.valid) {
    console.error('❌ Private key validation failed:', validation.error);
    console.error('Key length:', privateKey.length);
    console.error('Key starts with:', privateKey.substring(0, 50));
    console.error('Key ends with:', privateKey.substring(privateKey.length - 50));
    throw new Error(`Invalid PRIVATE_KEY format: ${validation.error}`);
  }
  
  console.log('✅ Private key validation passed');
  console.log('Private key length:', privateKey.length);
  
  // Clean up the private key by removing headers, footers, and all whitespace/newlines
  let pemContents = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\\n/g, '')  // Remove escaped newlines (\n as text)
    .replace(/\n/g, '')   // Remove actual newlines
    .replace(/\r/g, '')   // Remove carriage returns
    .replace(/\s/g, '')   // Remove all whitespace
    .trim();
  
  // Remove any non-base64 characters (only keep A-Z, a-z, 0-9, +, /, =)
  pemContents = pemContents.replace(/[^A-Za-z0-9+/=]/g, '');
  
  console.log('PEM contents length after cleanup:', pemContents.length);
  console.log('First 20 chars of cleaned PEM:', pemContents.substring(0, 20));
  
  try {
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
  } catch (error) {
    console.error('❌ Failed to process private key:', error);
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('PEM length was:', pemContents.length);
    console.error('Original key length:', privateKey.length);
    
    let errorMsg = 'Private key processing failed: ';
    if (error.message.includes('decode base64')) {
      errorMsg += 'Invalid base64 encoding. The PRIVATE_KEY must be copied exactly from the Service Account JSON file, including all \\n characters.';
    } else if (error.message.includes('importKey')) {
      errorMsg += 'Key format is invalid. Ensure you copied the entire private_key value including "-----BEGIN PRIVATE KEY-----" and "-----END PRIVATE KEY-----".';
    } else {
      errorMsg += error.message;
    }
    
    throw new Error(errorMsg);
  }
}

// Get access token from Google
async function getAccessToken(serviceAccount: any): Promise<string> {
  const scope = "https://www.googleapis.com/auth/drive";
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
    const clientEmail = Deno.env.get('CLIENT_EMAIL');
    const privateKey = Deno.env.get('PRIVATE_KEY');
    
    if (!clientEmail || !privateKey) {
      throw new Error('CLIENT_EMAIL or PRIVATE_KEY not found in environment');
    }

    const serviceAccount = {
      client_email: clientEmail,
      private_key: privateKey
    };
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
    console.error('❌ Error in list-drive-files:', error);
    
    // Provide detailed error information
    const errorResponse = {
      success: false,
      error: error.message,
      errorType: error.name,
      hint: error.message.includes('PRIVATE_KEY') 
        ? 'تأكد من نسخ قيمة private_key كاملة من ملف Service Account JSON، بما في ذلك جميع أحرف \\n'
        : error.message.includes('CLIENT_EMAIL')
        ? 'تأكد من إضافة CLIENT_EMAIL في Supabase Secrets'
        : 'تحقق من صحة بيانات الاعتماد في Supabase Edge Function Secrets'
    };
    
    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
