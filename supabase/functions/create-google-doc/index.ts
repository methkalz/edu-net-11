import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

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

// Get access token from Google - Full Drive access for Workspace
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
    const { studentName, documentContent, folderId: requestFolderId } = await req.json();
    
    const folderId = requestFolderId || Deno.env.get('GOOGLE_FOLDER');

    console.log('Creating Google Doc for student:', studentName);
    console.log('Target folder ID:', folderId);

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
    console.log('✅ Access token obtained');

    // Check folder permissions first
    const targetFolderId = folderId;
    if (targetFolderId) {
      console.log('🔍 Checking folder permissions for:', targetFolderId);
      const folderUrl = `https://www.googleapis.com/drive/v3/files/${targetFolderId}?fields=id,name,capabilities&supportsAllDrives=true`;
      const folderCheckResponse = await fetch(folderUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!folderCheckResponse.ok) {
        const error = await folderCheckResponse.text();
        console.error('❌ Cannot access folder:', error);
        throw new Error(`لا يمكن الوصول للمجلد. تأكد من مشاركته مع: ${serviceAccount.client_email} بصلاحية "محرر"`);
      }

      const folderData = await folderCheckResponse.json();
      console.log('📁 Folder capabilities:', folderData.capabilities);
      
      if (!folderData.capabilities?.canAddChildren) {
        throw new Error(`Service Account (${serviceAccount.client_email}) لا يملك صلاحية إضافة ملفات للمجلد. يجب مشاركة المجلد معه بصلاحية "محرر".`);
      }
      
      console.log('✅ Folder permissions verified');
    }

    // Create Google Doc directly in folder using Drive API with Workspace support
    const title = `مستند ${studentName} - ${new Date().toISOString().split('T')[0]}`;
    console.log('📝 Creating Google Doc via Drive API...');
    
    const createDocUrl = new URL('https://www.googleapis.com/drive/v3/files');
    createDocUrl.searchParams.append('supportsAllDrives', 'true');
    
    const createDocResponse = await fetch(createDocUrl.toString(), {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: title,
        mimeType: 'application/vnd.google-apps.document',
        parents: folderId ? [folderId] : undefined
      })
    });

    if (!createDocResponse.ok) {
      const error = await createDocResponse.text();
      throw new Error(`فشل إنشاء المستند: ${error}`);
    }

    const doc = await createDocResponse.json();
    const documentId = doc.id;
    console.log('✅ Document created:', documentId);

    // Add content to the document with RTL and center alignment
    if (documentContent) {
      // حساب موقع نهاية السطر الأول (أهلاً + اسم الطالب)
      const firstLineEndIndex = documentContent.indexOf('\n') + 1;
      
      const requests = [
        {
          insertText: {
            location: { index: 1 },
            text: documentContent
          }
        },
        // تطبيق RTL والمحاذاة المركزية على كل النص
        {
          updateParagraphStyle: {
            range: {
              startIndex: 1,
              endIndex: documentContent.length + 1
            },
            paragraphStyle: {
              direction: 'RIGHT_TO_LEFT',
              alignment: 'CENTER'
            },
            fields: 'direction,alignment'
          }
        },
        // تطبيق حجم خط مناسب على كل النص
        {
          updateTextStyle: {
            range: {
              startIndex: 1,
              endIndex: documentContent.length + 1
            },
            textStyle: {
              fontSize: {
                magnitude: 14,
                unit: 'PT'
              }
            },
            fields: 'fontSize'
          }
        },
        // تطبيق Bold وحجم أكبر على السطر الأول (أهلاً + اسم الطالب)
        {
          updateTextStyle: {
            range: {
              startIndex: 1,
              endIndex: firstLineEndIndex
            },
            textStyle: {
              bold: true,
              fontSize: {
                magnitude: 18,
                unit: 'PT'
              }
            },
            fields: 'bold,fontSize'
          }
        }
      ];

      await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ requests })
      });
      
      console.log('✅ Content added with RTL and center alignment');
    }

    // Set permissions with Workspace support
    console.log('🔓 Setting document permissions...');
    const permUrl = new URL(`https://www.googleapis.com/drive/v3/files/${documentId}/permissions`);
    permUrl.searchParams.append('supportsAllDrives', 'true');
    
    await fetch(permUrl.toString(), {
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
    console.log('✅ Permissions set');

    // Save to Supabase database
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('user_id', user.id)
      .single();

    await supabase
      .from('google_documents')
      .insert({
        doc_google_id: documentId,
        title: title,
        doc_url: `https://docs.google.com/document/d/${documentId}/edit`,
        owner_id: user.id,
        owner_name: studentName,
        owner_email: user.email || '',
        school_id: profile?.school_id || null,
        last_accessed_at: new Date().toISOString()
      });

    console.log('✅ Document saved to database');

    return new Response(
      JSON.stringify({
        success: true,
        documentId: documentId,
        documentUrl: `https://docs.google.com/document/d/${documentId}/edit`,
        title: title
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in create-google-doc:', error);
    
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
