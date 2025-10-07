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
  
  // Remove any non-base64 characters
  pemContents = pemContents.replace(/[^A-Za-z0-9+/=]/g, '');
  
  console.log('PEM contents length after cleanup:', pemContents.length);
  
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
    const { folderId: requestFolderId, includeAllFiles } = await req.json().catch(() => ({}));
    
    const folderId = requestFolderId || Deno.env.get('GOOGLE_FOLDER');

    console.log('📂 Listing Drive files, folderId:', folderId);
    console.log('📋 Include all file types:', includeAllFiles !== false);

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

    // Build query with Workspace support
    let query = includeAllFiles === false 
      ? "mimeType='application/vnd.google-apps.document'"
      : "trashed=false";
    
    if (folderId) {
      query += ` and '${folderId}' in parents`;
    }
    
    console.log('📋 Search query:', query);
    
    // Prepare API URL with Workspace support parameters
    const apiUrl = new URL('https://www.googleapis.com/drive/v3/files');
    apiUrl.searchParams.append('q', query);
    apiUrl.searchParams.append('fields', 'files(id,name,mimeType,createdTime,modifiedTime,webViewLink),nextPageToken');
    apiUrl.searchParams.append('orderBy', 'modifiedTime desc');
    apiUrl.searchParams.append('pageSize', '100');
    apiUrl.searchParams.append('supportsAllDrives', 'true');
    apiUrl.searchParams.append('includeItemsFromAllDrives', 'true');
    
    console.log('🔗 Full URL:', apiUrl.toString());

    // List files from Google Drive
    const listResponse = await fetch(apiUrl.toString(), {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    });

    if (!listResponse.ok) {
      const error = await listResponse.text();
      console.error('❌ Drive API error:', error);
      throw new Error(`Failed to list files: ${error}`);
    }

    const files = await listResponse.json();
    console.log('📁 Files retrieved:', files.files?.length || 0);
    
    // Check folder info and permissions
    let folderInfo = null;
    if (folderId) {
      console.log('🔍 Checking folder permissions...');
      const folderUrl = `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,permissions,owners,capabilities&supportsAllDrives=true`;
      const folderCheckResponse = await fetch(folderUrl, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      
      if (folderCheckResponse.ok) {
        folderInfo = await folderCheckResponse.json();
        console.log('📁 Folder info:', JSON.stringify(folderInfo, null, 2));
        console.log('✅ Can add children:', folderInfo.capabilities?.canAddChildren);
      } else {
        const folderError = await folderCheckResponse.json();
        console.error('❌ Cannot access folder:', JSON.stringify(folderError, null, 2));
      }
    }

    // Return response with folder info and service account
    return new Response(
      JSON.stringify({
        files: files.files || [],
        folderInfo: folderInfo,
        serviceAccount: serviceAccount.client_email
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in list-drive-files:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        hint: 'تأكد من مشاركة المجلد مع Service Account بصلاحية "محرر"'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
