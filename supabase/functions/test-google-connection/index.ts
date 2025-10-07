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
  
  if (privateKey.includes('\\\\\\\\\\\\\\\\n')) {
    return { valid: false, error: 'PRIVATE_KEY contains double-escaped newlines (\\\\\\\\\\\\\\\\n)' };
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

  const privateKey = serviceAccount.private_key;
  
  // Clean the private key - handle both literal \n and actual newlines
  let pemContents = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\\\\n/g, '')  // Remove literal \\n
    .replace(/\\\\r/g, '')  // Remove literal \\r
    .replace(/\r/g, '')   // Remove actual \r
    .replace(/\n/g, '')   // Remove actual newlines
    .replace(/\s/g, '')   // Remove all whitespace
    .trim();
  
  pemContents = pemContents.replace(/[^A-Za-z0-9+/=]/g, '');
  
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
    throw new Error('Private key processing failed: ' + error.message);
  }
}

// Get access token from Google - Full Drive access
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
    console.log('🔍 Testing Google API connection...');

    // Parse Google credentials
    const googleServiceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT');
    
    if (!googleServiceAccountJson) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT secret not found');
    }
    
    let serviceAccount: any;
    try {
      serviceAccount = JSON.parse(googleServiceAccountJson);
    } catch (parseError) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT must be valid JSON');
    }

    // Get access token
    const accessToken = await getAccessToken(serviceAccount);
    console.log('✅ Access token obtained successfully');

    // Test Drive API with Workspace support
    console.log('🔍 Testing Drive API access...');
    const driveUrl = new URL('https://www.googleapis.com/drive/v3/about');
    driveUrl.searchParams.append('fields', 'user,storageQuota');
    
    const driveResponse = await fetch(driveUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (!driveResponse.ok) {
      const error = await driveResponse.text();
      throw new Error(`Drive API test failed: ${error}`);
    }

    const driveData = await driveResponse.json();
    console.log('✅ Drive API accessible');

    // Test file listing with Workspace support
    console.log('🔍 Testing file listing with Workspace support...');
    const listUrl = new URL('https://www.googleapis.com/drive/v3/files');
    listUrl.searchParams.append('pageSize', '10');
    listUrl.searchParams.append('supportsAllDrives', 'true');
    listUrl.searchParams.append('includeItemsFromAllDrives', 'true');
    
    const listResponse = await fetch(listUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    const listSuccess = listResponse.ok;
    console.log('✅ File listing test:', listSuccess ? 'Success' : 'Failed');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'الاتصال مع Google API يعمل بنجاح! ✅',
        serviceAccount: serviceAccount.client_email,
        driveUser: driveData.user,
        workspaceSupport: listSuccess,
        scopes: ['documents', 'drive']
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in test-google-connection:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        hint: 'تحقق من صحة بيانات الاعتماد في Supabase Secrets'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
