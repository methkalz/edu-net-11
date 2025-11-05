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

    console.log('🔄 Starting repository migration...');

    // جلب جميع الملفات التي تحتاج تحديث
    const { data: files, error: fetchError } = await supabase
      .from('pdf_comparison_repository')
      .select('*')
      .or('normalized_text.is.null,simhash_value.is.null');

    if (fetchError) {
      throw new Error(`Failed to fetch files: ${fetchError.message}`);
    }

    console.log(`📚 Found ${files?.length || 0} files to migrate`);

    if (!files || files.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No files need migration',
          migrated: 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let migratedCount = 0;
    let errorCount = 0;

    for (const file of files) {
      try {
        console.log(`Processing ${file.file_name}...`);

        // تحديد الـ bucket الصحيح
        const bucket = file.grade_level === '12' 
          ? 'pdf-comparison-grade12' 
          : 'pdf-comparison-grade10';

        // استدعاء pdf-extract-text لإعادة معالجة الملف
        const extractResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/pdf-extract-text`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader,
            },
            body: JSON.stringify({ 
              filePath: file.file_path, 
              bucket 
            }),
          }
        );

        if (!extractResponse.ok) {
          console.error(`❌ Failed to extract ${file.file_name}`);
          errorCount++;
          continue;
        }

        const extractData = await extractResponse.json();
        const { 
          cleanedText, 
          normalizedText, 
          hash, 
          simhash, 
          wordCount, 
          ngrams3 
        } = extractData;

        // تحديث السجل في قاعدة البيانات
        const { error: updateError } = await supabase
          .from('pdf_comparison_repository')
          .update({
            extracted_text: cleanedText,
            normalized_text: normalizedText,
            text_hash: hash,
            simhash_value: simhash,
            ngrams_3: ngrams3,
            word_count: wordCount,
          })
          .eq('id', file.id);

        if (updateError) {
          console.error(`❌ Failed to update ${file.file_name}:`, updateError);
          errorCount++;
          continue;
        }

        migratedCount++;
        console.log(`✅ Migrated ${file.file_name} (${migratedCount}/${files.length})`);

      } catch (error) {
        console.error(`❌ Error processing ${file.file_name}:`, error);
        errorCount++;
      }
    }

    console.log(`✅ Migration complete: ${migratedCount} migrated, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Migration completed',
        migrated: migratedCount,
        errors: errorCount,
        total: files.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error in migrate-repository-texts:', error);
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
