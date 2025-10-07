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
    console.error('Failed to process private key:', error);
    throw new Error(`Private key processing failed: ${error.message}. Please ensure PRIVATE_KEY is properly formatted.`);
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
    console.error('Error in test-google-connection:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'فشل الاتصال بـ Google APIs',
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
