import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ServerEncryption } from "../_shared/encryption.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // التحقق من الصلاحيات (superadmin أو school_admin فقط)
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single();

    if (!profile || !['superadmin', 'school_admin'].includes(profile.role)) {
      throw new Error('Insufficient permissions');
    }

    const { school_id, school_name, force_recreate = false } = await req.json();
    
    const targetSchoolId = school_id || profile.school_id;
    if (!targetSchoolId) {
      throw new Error('School ID is required');
    }

    // جلب معلومات المدرسة
    const { data: school } = await supabaseClient
      .from('schools')
      .select('name')
      .eq('id', targetSchoolId)
      .single();

    if (!school) {
      throw new Error('School not found');
    }

    const displaySchoolName = school_name || school.name;

    // التحقق من وجود هيكل سابق
    const { data: existingStructure } = await supabaseClient
      .from('drive_folders')
      .select('id')
      .eq('school_id', targetSchoolId)
      .eq('folder_type', 'school')
      .maybeSingle();

    if (existingStructure && !force_recreate) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'School structure already exists',
          school_folder_id: existingStructure.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // الحصول على بيانات Google Service Account
    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT');
    if (!serviceAccountJson) {
      throw new Error('Google Service Account not configured');
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    const accessToken = await getAccessToken(serviceAccount);

    console.log(`Creating folder structure for school: ${displaySchoolName}`);

    // 1. إنشاء مجلد المدرسة الرئيسي
    const schoolFolder = await createDriveFolder(
      displaySchoolName,
      null,
      accessToken
    );

    console.log(`School folder created: ${schoolFolder.id}`);

    // تشفير معلومات مجلد المدرسة
    const encryptedSchoolId = await ServerEncryption.encrypt(schoolFolder.id);
    const encryptedSchoolUrl = await ServerEncryption.encrypt(schoolFolder.webViewLink);

    // حفظ مجلد المدرسة في قاعدة البيانات
    const { data: schoolFolderRecord } = await supabaseClient
      .from('drive_folders')
      .insert({
        school_id: targetSchoolId,
        folder_type: 'school',
        encrypted_folder_id: encryptedSchoolId,
        encrypted_folder_url: encryptedSchoolUrl,
        display_name: displaySchoolName
      })
      .select()
      .single();

    // 2. إنشاء مجلدات الصفوف (10، 11، 12)
    const gradeFolders = [];
    for (const grade of ['10', '11', '12']) {
      const gradeFolderName = `الصف ${grade === '10' ? 'العاشر' : grade === '11' ? 'الحادي عشر' : 'الثاني عشر'}`;
      
      const gradeFolder = await createDriveFolder(
        gradeFolderName,
        schoolFolder.id,
        accessToken
      );

      console.log(`Grade ${grade} folder created: ${gradeFolder.id}`);

      const encryptedGradeId = await ServerEncryption.encrypt(gradeFolder.id);
      const encryptedGradeUrl = await ServerEncryption.encrypt(gradeFolder.webViewLink);

      const { data: gradeFolderRecord } = await supabaseClient
        .from('drive_folders')
        .insert({
          school_id: targetSchoolId,
          folder_type: 'grade',
          parent_folder_id: schoolFolderRecord.id,
          grade_level: grade,
          encrypted_folder_id: encryptedGradeId,
          encrypted_folder_url: encryptedGradeUrl,
          display_name: gradeFolderName
        })
        .select()
        .single();

      gradeFolders.push({ grade, record: gradeFolderRecord, driveId: gradeFolder.id });
    }

    console.log(`Successfully created structure for school: ${displaySchoolName}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'School Drive structure created successfully',
        school_folder_id: schoolFolderRecord.id,
        grade_folders: gradeFolders.map(gf => ({
          grade: gf.grade,
          folder_id: gf.record.id
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in setup-school-drive-structure:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// دالة للحصول على Access Token من Google
async function getAccessToken(serviceAccount: any): Promise<string> {
  const jwt = await createGoogleJWT(
    serviceAccount,
    'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/documents'
  );

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!response.ok) {
    throw new Error('Failed to get access token');
  }

  const data = await response.json();
  return data.access_token;
}

// إنشاء JWT لـ Google
async function createGoogleJWT(serviceAccount: any, scope: string): Promise<string> {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: serviceAccount.client_email,
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedClaim = btoa(JSON.stringify(claim)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const signatureInput = `${encodedHeader}.${encodedClaim}`;

  const privateKey = serviceAccount.private_key.replace(/\\n/g, '\n');
  const keyData = await crypto.subtle.importKey(
    'pkcs8',
    str2ab(atob(privateKey.split('\n').slice(1, -2).join(''))),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    keyData,
    new TextEncoder().encode(signatureInput)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${signatureInput}.${encodedSignature}`;
}

function str2ab(str: string): ArrayBuffer {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0; i < str.length; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

// إنشاء مجلد في Google Drive
async function createDriveFolder(
  folderName: string,
  parentFolderId: string | null,
  accessToken: string
): Promise<any> {
  const metadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Drive API error creating folder:', errorText);
    
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error?.code === 403 && errorJson.error?.message?.includes('quota')) {
        throw new Error('مساحة التخزين في Google Drive ممتلئة. يرجى تفريغ المساحة أو استخدام حساب آخر.');
      }
    } catch (e) {
      // إذا فشل parse الـ JSON، نستمر بالخطأ العادي
    }
    
    throw new Error(`فشل في إنشاء المجلد: ${folderName} - ${errorText}`);
  }

  const folder = await response.json();
  
  if (!folder || !folder.id) {
    throw new Error(`لم يتم إرجاع معلومات المجلد: ${folderName}`);
  }

  console.log(`✅ Folder created: ${folder.id}`);

  // جلب webViewLink
  const detailsResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files/${folder.id}?fields=id,name,webViewLink`,
    {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    }
  );

  if (!detailsResponse.ok) {
    const detailsError = await detailsResponse.text();
    console.error('❌ Error fetching folder details:', detailsError);
    throw new Error(`فشل في جلب تفاصيل المجلد: ${folderName}`);
  }

  const folderDetails = await detailsResponse.json();
  
  if (!folderDetails || !folderDetails.id) {
    throw new Error(`تفاصيل المجلد فارغة: ${folderName}`);
  }

  return folderDetails;
}
