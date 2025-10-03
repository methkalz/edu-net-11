import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { templateId, newTitle, studentName, studentId } = await req.json();

    console.log('📝 Copying template:', { templateId, newTitle, studentName });

    // الحصول على المفاتيح من البيئة
    const serviceAccountEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    const privateKey = Deno.env.get('GOOGLE_PRIVATE_KEY');

    if (!serviceAccountEmail || !privateKey) {
      throw new Error('Missing Google credentials');
    }

    // إنشاء JWT للمصادقة
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const claim = {
      iss: serviceAccountEmail,
      scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/documents',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };

    // تحويل المفتاح الخاص
    const encoder = new TextEncoder();
    const keyData = privateKey
      .replace(/-----BEGIN PRIVATE KEY-----/g, '')
      .replace(/-----END PRIVATE KEY-----/g, '')
      .replace(/\s/g, '');
    
    const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));

    // استيراد المفتاح
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      binaryKey,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );

    // إنشاء التوقيع
    const headerBase64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const claimBase64 = btoa(JSON.stringify(claim)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const signatureInput = `${headerBase64}.${claimBase64}`;

    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      encoder.encode(signatureInput)
    );

    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const jwt = `${signatureInput}.${signatureBase64}`;

    console.log('🔐 JWT created successfully');

    // الحصول على access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Token error:', errorText);
      throw new Error(`Failed to get access token: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    console.log('✅ Access token obtained');

    // نسخ الملف من القالب
    const copyResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${templateId}/copy`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTitle || `نسخة - ${studentName || 'طالب'}`,
        }),
      }
    );

    if (!copyResponse.ok) {
      const errorText = await copyResponse.text();
      console.error('❌ Copy error:', errorText);
      throw new Error(`Failed to copy template: ${errorText}`);
    }

    const copyData = await copyResponse.json();
    console.log('📄 Template copied:', copyData.id);

    // إذا كان هناك بيانات طالب، استبدل النصوص في المستند
    if (studentName || studentId) {
      try {
        const replaceRequests = [];
        
        if (studentName) {
          replaceRequests.push({
            replaceAllText: {
              containsText: {
                text: '{{student_name}}',
                matchCase: false,
              },
              replaceText: studentName,
            },
          });
        }
        
        if (studentId) {
          replaceRequests.push({
            replaceAllText: {
              containsText: {
                text: '{{student_id}}',
                matchCase: false,
              },
              replaceText: studentId,
            },
          });
        }

        if (replaceRequests.length > 0) {
          const updateResponse = await fetch(
            `https://docs.googleapis.com/v1/documents/${copyData.id}:batchUpdate`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                requests: replaceRequests,
              }),
            }
          );

          if (updateResponse.ok) {
            console.log('✅ Student data replaced in document');
          } else {
            console.warn('⚠️ Failed to replace student data');
          }
        }
      } catch (replaceError) {
        console.warn('⚠️ Error replacing text:', replaceError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        documentId: copyData.id,
        documentUrl: `https://docs.google.com/document/d/${copyData.id}/edit`,
        title: copyData.name,
        studentName: studentName || null,
        studentId: studentId || null,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Error in create-google-doc:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
