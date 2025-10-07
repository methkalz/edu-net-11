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
    console.log('Testing Google API connection...');

    // Parse Google credentials from GOOGLE_SERVICE_ACCOUNT only
    const googleServiceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT');
    
    console.log('🔍 Checking for GOOGLE_SERVICE_ACCOUNT secret...');
    console.log('GOOGLE_SERVICE_ACCOUNT exists:', !!googleServiceAccountJson);
    
    if (!googleServiceAccountJson) {
      console.error('❌ GOOGLE_SERVICE_ACCOUNT not found in environment variables');
      throw new Error('GOOGLE_SERVICE_ACCOUNT secret not found. Please add it in Supabase Edge Function Secrets with the full Service Account JSON content.');
    }
    
    console.log('✅ GOOGLE_SERVICE_ACCOUNT found, length:', googleServiceAccountJson.length);
    console.log('First 50 chars:', googleServiceAccountJson.substring(0, 50));
    console.log('Last 50 chars:', googleServiceAccountJson.substring(googleServiceAccountJson.length - 50));
    
    let serviceAccount: any;
    try {
      serviceAccount = JSON.parse(googleServiceAccountJson);
      console.log('✅ Parsed service account JSON successfully');
      console.log('Service account email:', serviceAccount.client_email);
      console.log('Has private_key:', !!serviceAccount.private_key);
      console.log('Private key length:', serviceAccount.private_key?.length || 0);
    } catch (parseError) {
      console.error('❌ Failed to parse GOOGLE_SERVICE_ACCOUNT JSON:', parseError);
      throw new Error('GOOGLE_SERVICE_ACCOUNT must be valid JSON. Copy the entire content of your Service Account JSON file.');
    }

    // Get access token
    const accessToken = await getAccessToken(serviceAccount);
    console.log('Access token obtained successfully');

    // Test Drive API access
    const testResponse = await fetch(
      "https://www.googleapis.com/drive/v3/about?fields=user",
      {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    if (!testResponse.ok) {
      const error = await testResponse.text();
      throw new Error(`Failed to access Drive API: ${error}`);
    }

    const aboutData = await testResponse.json();
    console.log('Drive API access successful');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'تم الاتصال بـ Google APIs بنجاح',
        details: {
          serviceAccount: serviceAccount.client_email,
          projectId: serviceAccount.project_id,
          driveUser: aboutData.user?.emailAddress || 'N/A'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in test-google-connection:', error);
    
    const errorResponse = {
      success: false,
      message: 'فشل الاتصال بـ Google APIs',
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
