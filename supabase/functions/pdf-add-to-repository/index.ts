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
      // معاملات اختيارية للنص المستخرج مسبقاً
      extractedText,
      textHash,
      wordCount: providedWordCount,
      pageCount: providedPageCount,
    } = await req.json();

    // ✅ حماية: تصحيح sourceProjectType إذا كان خاطئاً أو غير محدد
    let correctedSourceProjectType = sourceProjectType;
    if (!sourceProjectType || sourceProjectType === 'final_project' || sourceProjectType === 'mini_project') {
      correctedSourceProjectType = gradeLevel === '10' 
        ? 'grade10_mini_project' 
        : 'grade12_final_project';
      
      console.log(`⚠️ Correcting sourceProjectType from '${sourceProjectType}' to '${correctedSourceProjectType}'`);
    }

    console.log(`Adding ${fileName} to repository (Grade ${gradeLevel})`);

    // 1. استخراج النص من الملف (فقط إذا لم يكن موجوداً)
    let text, hash, wordCount, pageCount;

    if (extractedText && textHash) {
      // استخدام البيانات المستخرجة مسبقاً
      console.log(`✅ Using pre-extracted data for ${fileName}`);
      text = extractedText;
      hash = textHash;
      wordCount = providedWordCount;
      pageCount = providedPageCount;
    } else {
      // استخراج النص إذا لم يكن موجوداً
      console.log(`🔄 Extracting text from ${fileName}`);
      
      const { data, error: extractError } = await supabase.functions.invoke('pdf-extract-text', {
        body: { filePath, bucket }
      });

      if (extractError || !data?.success) {
        throw new Error(data?.error || 'Failed to extract text from PDF');
      }

      text = data.text;
      hash = data.hash;
      wordCount = data.wordCount;
      pageCount = data.pageCount;
    }

    // 2. توليد embedding vector للنص و top keywords
    console.log(`🔄 Generating embedding vector and keywords for ${fileName}`);
    
    // استيراد دوال من _shared
    const { generateEmbedding, extractTopKeywords } = await import('../_shared/embeddings.ts');
    const embedding = generateEmbedding(text, 1024); // ✅ زيادة من 384 إلى 1024
    const topKeywords = extractTopKeywords(text, 150);
    
    // حساب word_set_size
    const words = text.split(/\s+/).filter((w: string) => w.length > 2);
    const wordSetSize = new Set(words).size;
    
    console.log(`✅ Embedding generated: ${embedding.length} dimensions, ${topKeywords.length} keywords, word_set_size: ${wordSetSize}`);

    // 3. نسخ الملف إلى bucket المستودع المناسب
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

    // 4. إضافة إلى جدول المستودع مع embedding و keywords
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
        page_count: pageCount,
        embedding: embedding, // Vector embedding
        word_set_size: wordSetSize, // Word set size for fast screening
        top_keywords: topKeywords, // Top keywords for real Jaccard calculation
        language_detected: 'ar',
        uploaded_by: userId,
        school_id: schoolId,
        source_project_id: sourceProjectId,
        source_project_type: correctedSourceProjectType,
        metadata: {
          original_path: filePath,
          original_bucket: bucket,
          added_at: new Date().toISOString(),
          embedding_version: 'v3_tfidf_ngrams_stopwords_signed_1024', // ✅ تحديث الإصدار
        },
      })
      .select()
      .single();

    if (insertError) {
      // ✅ معالجة حالة الملف المكرر (Duplicate Key)
      if (insertError.code === '23505') {
        console.log(`ℹ️ File already exists in repository, fetching existing entry`);
        
        // جلب السجل الموجود
        const { data: existingEntry, error: fetchError } = await supabase
          .from('pdf_comparison_repository')
          .select('*')
          .eq('text_hash', hash)
          .eq('grade_level', gradeLevel)
          .eq('project_type', projectType)
          .single();
        
        if (fetchError) {
          console.error('Insert error:', insertError);
          await supabase.storage.from(targetBucket).remove([newFileName]);
          throw new Error(`Failed to add to repository: ${insertError.message}`);
        }
        
        // إرجاع السجل الموجود
        return new Response(
          JSON.stringify({
            success: true,
            message: 'File already exists in repository',
            data: existingEntry,
            isDuplicate: true,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } else {
        console.error('Insert error:', insertError);
        await supabase.storage.from(targetBucket).remove([newFileName]);
        throw new Error(`Failed to add to repository: ${insertError.message}`);
      }
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
