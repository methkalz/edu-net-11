import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { corsHeaders } from '../_shared/cors.ts';

// التحقق من صحة Private Key
const validatePrivateKey = (key: string): string => {
  if (!key) throw new Error('Private key is required');
  
  let cleanKey = key.trim();
  if (!cleanKey.includes('BEGIN PRIVATE KEY')) {
    cleanKey = `-----BEGIN PRIVATE KEY-----\n${cleanKey}\n-----END PRIVATE KEY-----`;
  }
  
  cleanKey = cleanKey
    .replace(/\\n/g, '\n')
    .replace(/\s+-----BEGIN/g, '\n-----BEGIN')
    .replace(/KEY-----\s+/g, 'KEY-----\n')
    .trim();
  
  return cleanKey;
};

// إنشاء JWT للمصادقة مع Google
const createGoogleJWT = async (
  serviceAccountEmail: string,
  privateKey: string,
  scopes: string[]
): Promise<string> => {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccountEmail,
    scope: scopes.join(' '),
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const encodedHeader = btoa(JSON.stringify(header))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  
  const pemContents = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  
  console.log('PEM contents length after cleanup:', pemContents.length);

  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${signatureInput}.${encodedSignature}`;
};

// الحصول على Access Token
const getAccessToken = async (
  serviceAccountEmail: string,
  privateKey: string
): Promise<string> => {
  const scopes = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file'
  ];

  const jwt = await createGoogleJWT(serviceAccountEmail, privateKey, scopes);

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  if (!tokenResponse.ok) {
    throw new Error(`فشل الحصول على Access Token: ${await tokenResponse.text()}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { folderName, parentFolderId } = await req.json();
    console.log('📁 Creating new folder:', folderName);
    if (parentFolderId) {
      console.log('📂 Parent folder ID:', parentFolderId);
    }

    // الحصول على بيانات المستخدم
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('غير مصرح');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('فشل التحقق من المستخدم');
    }

    // الحصول على بيانات Service Account
    const serviceAccountEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    const privateKeyEnv = Deno.env.get('GOOGLE_PRIVATE_KEY');

    if (!serviceAccountEmail || !privateKeyEnv) {
      throw new Error('بيانات Service Account غير متوفرة');
    }

    const privateKey = validatePrivateKey(privateKeyEnv);
    const accessToken = await getAccessToken(serviceAccountEmail, privateKey);
    console.log('✅ Access token obtained');

    // التحقق من صلاحيات المجلد الأب إذا كان موجوداً
    if (parentFolderId) {
      console.log('🔍 Checking parent folder permissions...');
      const folderUrl = new URL(`https://www.googleapis.com/drive/v3/files/${parentFolderId}`);
      folderUrl.searchParams.append('fields', 'capabilities,name');
      folderUrl.searchParams.append('supportsAllDrives', 'true');

      const folderResponse = await fetch(folderUrl.toString(), {
        headers: { "Authorization": `Bearer ${accessToken}` }
      });

      if (!folderResponse.ok) {
        throw new Error('فشل التحقق من صلاحيات المجلد الأب');
      }

      const folderData = await folderResponse.json();
      console.log('📁 Parent folder capabilities:', folderData.capabilities);

      if (!folderData.capabilities?.canAddChildren) {
        throw new Error('لا يمكن إضافة مجلدات فرعية في هذا المجلد');
      }
      console.log('✅ Parent folder permissions verified');
    }

    // إنشاء المجلد الجديد
    console.log('📝 Creating folder via Drive API...');
    const createFolderUrl = new URL('https://www.googleapis.com/drive/v3/files');
    createFolderUrl.searchParams.append('supportsAllDrives', 'true');
    createFolderUrl.searchParams.append('fields', 'id,name,webViewLink');

    const createFolderResponse = await fetch(createFolderUrl.toString(), {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentFolderId ? [parentFolderId] : undefined
      })
    });

    if (!createFolderResponse.ok) {
      const error = await createFolderResponse.text();
      throw new Error(`فشل إنشاء المجلد: ${error}`);
    }

    const newFolder = await createFolderResponse.json();
    console.log('✅ Folder created:', newFolder.id);

    // إعداد الصلاحيات للمجلد (اختياري - يمكن جعل المجلد قابل للمشاركة)
    console.log('🔓 Setting folder permissions...');
    const permUrl = new URL(`https://www.googleapis.com/drive/v3/files/${newFolder.id}/permissions`);
    permUrl.searchParams.append('supportsAllDrives', 'true');

    await fetch(permUrl.toString(), {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        role: "writer",
        type: "anyone"
      })
    });
    console.log('✅ Permissions set');

    return new Response(
      JSON.stringify({
        success: true,
        folderId: newFolder.id,
        folderName: newFolder.name,
        webViewLink: newFolder.webViewLink,
        message: `تم إنشاء المجلد "${folderName}" بنجاح`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'حدث خطأ غير متوقع'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
