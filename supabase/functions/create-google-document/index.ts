import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encode as base64Encode, decode as base64Decode } from 'https://deno.land/std@0.177.0/encoding/base64.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper: base64url encoding (JWT standard)
function base64UrlEncode(input: Uint8Array | string): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  return base64Encode(bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Helper: base64url decoding
function base64UrlDecode(input: string): Uint8Array {
  // Add padding if needed
  const padded = input + '==='.slice((input.length + 3) % 4);
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  return base64Decode(base64);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 بدء عملية إنشاء المستند...');
    
    // 1. إعداد Supabase client
    console.log('📝 Step 1: إعداد Supabase client');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { 
        global: { 
          headers: { Authorization: req.headers.get('Authorization')! } 
        } 
      }
    );

    // 2. التحقق من المستخدم
    console.log('🔐 Step 2: التحقق من المستخدم');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('❌ خطأ في المصادقة:', userError);
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    console.log('✅ تم التحقق من المستخدم:', user.id);

    // 3. جلب معلومات المستخدم من profiles
    console.log('👤 Step 3: جلب معلومات المستخدم');
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('full_name, email, school_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('❌ خطأ في جلب البروفايل:', profileError);
      return new Response(
        JSON.stringify({ error: 'Could not fetch user profile' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    console.log('✅ تم جلب البروفايل:', { email: profile.email, name: profile.full_name });

    // 4. إعداد Google Drive API
    console.log('🔑 Step 4: إعداد Google Drive API');
    const credentialsJson = Deno.env.get('GOOGLE_FINAL_API');
    if (!credentialsJson) {
      console.error('❌ GOOGLE_FINAL_API غير متوفر');
      return new Response(
        JSON.stringify({ error: 'Google API credentials not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const credentials = JSON.parse(credentialsJson);
    console.log('✅ تم تحميل credentials:', {
      client_email: credentials.client_email,
      has_private_key: !!credentials.private_key
    });
    
    const templateId = Deno.env.get('TEMPLATE_DOC_ID');
    if (!templateId) {
      console.error('❌ TEMPLATE_DOC_ID غير متوفر');
      return new Response(
        JSON.stringify({ error: 'Template document ID not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    console.log('✅ Template ID:', templateId);

    // 5. إنشاء JWT token للمصادقة مع Google
    console.log('🔐 Step 5: إنشاء JWT token');
    const now = Math.floor(Date.now() / 1000);
    
    // JWT Header
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    console.log('✅ JWT header تم إنشاؤه');

    // JWT Claims
    const claims = {
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/drive',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };
    const encodedClaims = base64UrlEncode(JSON.stringify(claims));
    console.log('✅ JWT claims تم إنشاؤها');

    const signatureInput = `${encodedHeader}.${encodedClaims}`;
    
    // استيراد المفتاح الخاص
    console.log('🔑 Step 5.1: معالجة المفتاح الخاص');
    try {
      // إزالة headers و footers و whitespace من المفتاح
      const pemKey = credentials.private_key
        .replace(/-----BEGIN PRIVATE KEY-----/, '')
        .replace(/-----END PRIVATE KEY-----/, '')
        .replace(/\s/g, '');
      
      console.log('✅ تم تنظيف المفتاح، طوله:', pemKey.length);
      
      // تحويل base64 إلى ArrayBuffer
      const keyData = base64UrlDecode(pemKey).buffer;
      console.log('✅ تم تحويل المفتاح إلى ArrayBuffer، حجمه:', keyData.byteLength);
      
      const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        keyData,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['sign']
      );
      console.log('✅ تم استيراد المفتاح الخاص بنجاح');

      // التوقيع
      console.log('✍️ Step 5.2: توقيع JWT');
      const signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        privateKey,
        new TextEncoder().encode(signatureInput)
      );
      console.log('✅ تم التوقيع بنجاح');

      // تحويل التوقيع إلى base64url
      const encodedSignature = base64UrlEncode(new Uint8Array(signature));
      const jwt = `${signatureInput}.${encodedSignature}`;
      console.log('✅ تم إنشاء JWT بنجاح');

      // 6. الحصول على access token
      console.log('🎫 Step 6: الحصول على access token من Google');
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
      });

      const tokenData = await tokenResponse.json();
      console.log('📥 استجابة Google OAuth:', { 
        has_access_token: !!tokenData.access_token,
        error: tokenData.error,
        error_description: tokenData.error_description?.substring(0, 100)
      });
      
      if (!tokenData.access_token) {
        console.error('❌ فشل الحصول على access token:', tokenData);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to authenticate with Google', 
            details: tokenData.error_description 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const accessToken = tokenData.access_token;
      console.log('✅ تم الحصول على access token');

      // قراءة معرّف المجلد (اختياري)
      const folderId = Deno.env.get('GOOGLE_DRIVE_FOLDER_ID');
      if (folderId) {
        console.log('📁 سيتم حفظ المستند في المجلد:', folderId);
      } else {
        console.log('📁 لم يتم تحديد مجلد، سيتم الحفظ في الجذر');
      }

      // 7. نسخ القالب
      console.log('📄 Step 7: نسخ القالب من Google Drive');
      const copyResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${templateId}/copy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profile.email || `document_${user.id}`,
          ...(folderId && { parents: [folderId] }) // إضافة المجلد فقط إذا كان موجوداً
        }),
      });

      const copiedFile = await copyResponse.json();
      console.log('📥 استجابة نسخ القالب:', { 
        has_id: !!copiedFile.id,
        error: copiedFile.error 
      });
      
      if (!copiedFile.id) {
        console.error('❌ فشل نسخ القالب:', copiedFile);
        return new Response(
          JSON.stringify({ error: 'Failed to create document', details: copiedFile }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const fileId = copiedFile.id;
      console.log('✅ تم نسخ القالب، File ID:', fileId);

      // 8. منح صلاحيات التعديل لأي شخص لديه الرابط
      console.log('🔓 Step 8: منح الصلاحيات للمستند');
      const permResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'writer',
          type: 'anyone',
        }),
      });
      console.log('✅ تم منح الصلاحيات، Status:', permResponse.status);

      // 9. الحصول على رابط المستند
      console.log('🔗 Step 9: الحصول على رابط المستند');
      const fileResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=webViewLink`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        }
      );

      const fileData = await fileResponse.json();
      const docUrl = fileData.webViewLink;
      console.log('✅ تم الحصول على الرابط:', docUrl);

      // 10. حفظ المستند في قاعدة البيانات
      console.log('💾 Step 10: حفظ المستند في قاعدة البيانات');
      const { error: insertError } = await supabaseClient
        .from('google_documents')
        .insert({
          owner_id: user.id,
          school_id: profile.school_id,
          doc_google_id: fileId,
          doc_url: docUrl,
          title: profile.email || `document_${user.id}`,
          owner_email: profile.email,
          owner_name: profile.full_name,
        });

      if (insertError) {
        console.error('❌ خطأ في حفظ البيانات:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to save document to database', details: insertError }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      console.log('✅ تم حفظ المستند في قاعدة البيانات');

      console.log('🎉 اكتملت العملية بنجاح!');
      return new Response(
        JSON.stringify({ 
          success: true,
          docUrl,
          fileId,
          title: profile.email 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );

    } catch (keyError) {
      console.error('❌ خطأ في معالجة المفتاح الخاص:', keyError);
      console.error('تفاصيل الخطأ:', {
        name: keyError.name,
        message: keyError.message,
        stack: keyError.stack
      });
      throw keyError;
    }

  } catch (error) {
    console.error('❌ خطأ عام في create-google-document:', error);
    console.error('تفاصيل الخطأ الكاملة:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return new Response(
      JSON.stringify({ 
        error: error.message,
        errorName: error.name,
        errorDetails: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
