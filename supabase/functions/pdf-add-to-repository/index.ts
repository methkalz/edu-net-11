import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const {
      fileName,
      filePath,
      fileSize,
      gradeLevel,
      projectType,
      sourceProjectId,
      sourceProjectType,
      userId,
      schoolId,
      bucket,
    } = await req.json();

    console.log(`Adding ${fileName} to repository (Grade ${gradeLevel})`);

    // 1. استخراج النص من الملف
    const extractResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/pdf-extract-text`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({ filePath, bucket }),
      }
    );

    if (!extractResponse.ok) {
      throw new Error('Failed to extract text from PDF');
    }

    const { text, hash, wordCount } = await extractResponse.json();

    // 2. نسخ الملف إلى bucket المستودع المناسب
    const targetBucket = gradeLevel === '12' 
      ? 'pdf-comparison-grade12' 
      : 'pdf-comparison-grade10';

    // تحميل الملف من الـ bucket المؤقت
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(filePath);

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    // رفع إلى bucket المستودع
    const newFileName = `${Date.now()}_${hash.substring(0, 8)}_${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from(targetBucket)
      .upload(newFileName, fileData, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Failed to upload to repository: ${uploadError.message}`);
    }

    // 4. إضافة إلى جدول المستودع
    const { data: repositoryEntry, error: insertError } = await supabase
      .from('pdf_comparison_repository')
      .insert({
        file_name: fileName,
        file_path: newFileName,
        file_size: fileSize,
        grade_level: gradeLevel,
        project_type: projectType,
        extracted_text: text,
        text_hash: hash,
        word_count: wordCount,
        language_detected: 'ar',
        uploaded_by: userId,
        school_id: schoolId,
        source_project_id: sourceProjectId,
        source_project_type: sourceProjectType,
        metadata: {
          original_path: filePath,
          original_bucket: bucket,
          added_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      
      // محاولة حذف الملف المرفوع في حالة فشل الإدراج
      await supabase.storage.from(targetBucket).remove([newFileName]);
      
      throw new Error(`Failed to add to repository: ${insertError.message}`);
    }

    // 5. تسجيل في audit log
    await supabase.from('pdf_comparison_audit_log').insert({
      action_type: 'add_to_repository',
      performed_by: userId,
      details: {
        fileName,
        gradeLevel,
        projectType,
        wordCount,
        repositoryId: repositoryEntry.id,
      },
    });

    // 6. حذف الملف من bucket المؤقت (اختياري)
    if (bucket === 'pdf-comparison-temp') {
      await supabase.storage.from(bucket).remove([filePath]);
    }

    console.log(`Successfully added ${fileName} to repository`);

    return new Response(
      JSON.stringify({
        success: true,
        data: repositoryEntry,
        message: 'File successfully added to repository',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in pdf-add-to-repository function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
