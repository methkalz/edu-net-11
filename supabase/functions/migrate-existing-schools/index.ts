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

    // التحقق من صلاحيات superadmin فقط
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'superadmin') {
      throw new Error('Only superadmin can run migration');
    }

    const { school_id } = await req.json();

    console.log('Starting migration for schools...');

    // جلب المدارس المطلوبة
    let schoolsQuery = supabaseClient
      .from('schools')
      .select('id, name');

    if (school_id) {
      schoolsQuery = schoolsQuery.eq('id', school_id);
    }

    const { data: schools } = await schoolsQuery;

    if (!schools || schools.length === 0) {
      throw new Error('No schools found');
    }

    const results = [];

    for (const school of schools) {
      try {
        console.log(`Migrating school: ${school.name} (${school.id})`);

        // إنشاء الهيكل الهرمي للمدرسة
        const setupResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/setup-school-drive-structure`,
          {
            method: 'POST',
            headers: {
              'Authorization': req.headers.get('Authorization')!,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              school_id: school.id,
              school_name: school.name,
              force_recreate: false
            }),
          }
        );

        if (!setupResponse.ok) {
          throw new Error(`Failed to setup structure for school ${school.name}`);
        }

        const setupData = await setupResponse.json();
        console.log(`Structure created for ${school.name}`);

        // جلب المستندات القديمة غير المشفرة
        const { data: oldDocuments } = await supabaseClient
          .from('google_documents')
          .select('*')
          .eq('school_id', school.id)
          .is('encrypted_doc_id', null);

        if (oldDocuments && oldDocuments.length > 0) {
          console.log(`Encrypting ${oldDocuments.length} documents for ${school.name}`);

          for (const doc of oldDocuments) {
            try {
              // تشفير البيانات القديمة
              const encryptedDocId = await ServerEncryption.encrypt(doc.doc_google_id);
              const encryptedDocUrl = await ServerEncryption.encrypt(doc.doc_url);

              // تحديث المستند
              await supabaseClient
                .from('google_documents')
                .update({
                  encrypted_doc_id: encryptedDocId,
                  encrypted_doc_url: encryptedDocUrl
                })
                .eq('id', doc.id);

              console.log(`Encrypted document: ${doc.title}`);
            } catch (docError) {
              console.error(`Error encrypting document ${doc.id}:`, docError);
            }
          }
        }

        results.push({
          school_id: school.id,
          school_name: school.name,
          status: 'success',
          documents_encrypted: oldDocuments?.length || 0
        });

      } catch (schoolError) {
        console.error(`Error migrating school ${school.name}:`, schoolError);
        results.push({
          school_id: school.id,
          school_name: school.name,
          status: 'error',
          error: schoolError.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Migration completed',
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in migrate-existing-schools:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
