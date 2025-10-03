import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    // 1. إعداد Supabase client
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
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 3. جلب معلومات المستخدم من profiles
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('full_name, email, school_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Could not fetch user profile' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 4. إعداد Google Drive API
    const credentialsJson = Deno.env.get('GOOGLE_FINAL_API');
    if (!credentialsJson) {
      console.error('GOOGLE_FINAL_API not configured');
      return new Response(
        JSON.stringify({ error: 'Google API credentials not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const credentials = JSON.parse(credentialsJson);
    const templateId = Deno.env.get('TEMPLATE_DOC_ID');
    
    if (!templateId) {
      console.error('TEMPLATE_DOC_ID not configured');
      return new Response(
        JSON.stringify({ error: 'Template document ID not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 5. إنشاء JWT token للمصادقة مع Google
    const jwtHeader = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const now = Math.floor(Date.now() / 1000);
    const jwtClaimSet = btoa(JSON.stringify({
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/drive',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    }));

    const signatureInput = `${jwtHeader}.${jwtClaimSet}`;
    
    // استيراد المفتاح الخاص
    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      new TextEncoder().encode(
        credentials.private_key
          .replace(/-----BEGIN PRIVATE KEY-----/, '')
          .replace(/-----END PRIVATE KEY-----/, '')
          .replace(/\s/g, '')
      ),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      privateKey,
      new TextEncoder().encode(signatureInput)
    );

    const jwt = `${signatureInput}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`;

    // 6. الحصول على access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      console.error('Failed to get access token:', tokenData);
      return new Response(
        JSON.stringify({ error: 'Failed to authenticate with Google' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const accessToken = tokenData.access_token;

    // 7. نسخ القالب
    const copyResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${templateId}/copy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: profile.email || `document_${user.id}`,
      }),
    });

    const copiedFile = await copyResponse.json();
    if (!copiedFile.id) {
      console.error('Failed to copy template:', copiedFile);
      return new Response(
        JSON.stringify({ error: 'Failed to create document' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const fileId = copiedFile.id;

    // 8. منح صلاحيات التعديل لأي شخص لديه الرابط
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
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

    // 9. الحصول على رابط المستند
    const fileResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=webViewLink`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      }
    );

    const fileData = await fileResponse.json();
    const docUrl = fileData.webViewLink;

    // 10. حفظ المستند في قاعدة البيانات
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
      console.error('Database insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save document to database' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

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

  } catch (error) {
    console.error('Error in create-google-document:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
