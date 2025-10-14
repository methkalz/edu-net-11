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

    // التحقق من المستخدم
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { student_id, document_id } = await req.json();

    if (!student_id && !document_id) {
      throw new Error('Either student_id or document_id is required');
    }

    // جلب معلومات المستخدم
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      throw new Error('Profile not found');
    }

    // جلب المستند
    let query = supabaseClient
      .from('google_documents')
      .select('*, students!inner(user_id, school_id)');

    if (document_id) {
      query = query.eq('id', document_id);
    } else {
      query = query.eq('owner_id', student_id);
    }

    const { data: document, error } = await query.maybeSingle();

    if (error || !document) {
      throw new Error('Document not found');
    }

    // التحقق من الصلاحيات
    const isOwner = document.owner_id === user.id;
    const isTeacher = profile.role === 'teacher' && document.students.school_id === profile.school_id;
    const isAdmin = ['school_admin', 'superadmin'].includes(profile.role);

    if (!isOwner && !isTeacher && !isAdmin) {
      throw new Error('Access denied');
    }

    // فك تشفير الرابط
    let documentUrl: string;
    
    if (document.encrypted_doc_url) {
      // المستندات الجديدة المشفرة
      documentUrl = await ServerEncryption.decrypt(document.encrypted_doc_url);
      console.log('Decrypted document URL successfully');
    } else {
      // المستندات القديمة (غير مشفرة)
      documentUrl = document.doc_url;
      console.log('Using legacy unencrypted URL');
    }

    // تحديث آخر وصول
    await supabaseClient
      .from('google_documents')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('id', document.id);

    // تسجيل في Audit Log
    await supabaseClient
      .from('audit_log')
      .insert({
        actor_user_id: user.id,
        action: 'DOCUMENT_ACCESSED',
        entity: 'google_documents',
        entity_id: document.id,
        payload_json: {
          document_title: document.title,
          access_role: profile.role,
          is_owner: isOwner
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        url: documentUrl,
        title: document.title,
        owner_name: document.owner_name,
        last_accessed_at: document.last_accessed_at
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-student-document:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
