import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { filePath, bucket } = await req.json();

    if (!filePath || !bucket) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'MISSING_PARAMETERS',
            message: 'معلومات الملف غير مكتملة',
            message_en: 'Missing required parameters',
            details: { filePath, bucket },
          }
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[EXTRACT] Starting - File: ${bucket}/${filePath}`);

    // تحميل الملف من Storage
    console.log(`[EXTRACT] Downloading file...`);
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(filePath);

    if (downloadError) {
      console.error('[EXTRACT] Download error:', downloadError);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'DOWNLOAD_FAILED',
            message: 'فشل تحميل الملف من التخزين',
            message_en: 'Failed to download file',
            details: { error: downloadError.message },
          }
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // تحويل Blob إلى ArrayBuffer
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const fileSizeInMB = (uint8Array.length / 1024 / 1024).toFixed(2);
    
    console.log(`[EXTRACT] File downloaded - Size: ${fileSizeInMB}MB`);
    
    // فحص حجم الملف
    const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB
    if (uint8Array.length > MAX_FILE_SIZE) {
      console.error(`[EXTRACT] File too large: ${fileSizeInMB}MB`);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'الملف كبير جداً للمعالجة',
            message_en: 'File too large to process',
            details: {
              fileSize: uint8Array.length,
              maxAllowed: MAX_FILE_SIZE,
              fileSizeMB: parseFloat(fileSizeInMB),
            },
            suggestions: [
              'قلل حجم الملف إلى أقل من 30MB',
              'حاول ضغط الملف',
              'قسّم المشروع إلى ملفات أصغر',
            ]
          }
        }),
        {
          status: 413,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // استخراج النص من PDF
    console.log(`[EXTRACT] Extracting text...`);
    const extractionStart = Date.now();
    
    let extractedText;
    try {
      extractedText = await extractTextFromPDF(uint8Array);
    } catch (error) {
      console.error('[EXTRACT] Extraction failed:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'EXTRACTION_FAILED',
            message: 'فشل استخراج النص من الملف',
            message_en: 'Failed to extract text from PDF',
            details: { 
              error: error instanceof Error ? error.message : String(error),
              fileSize: uint8Array.length,
            },
            suggestions: [
              'تأكد من أن الملف صالح وليس معطوباً',
              'الملف قد يكون محمياً أو مشفراً',
              'حاول تصدير الملف مرة أخرى',
            ]
          }
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // تنظيف النص
    const cleanedText = cleanText(extractedText);
    const extractionTime = Date.now() - extractionStart;

    // حساب hash
    const textHash = await calculateHash(cleanedText);

    // حساب عدد الكلمات
    const wordCount = countWords(cleanedText);

    console.log(`[EXTRACT] Completed - Words: ${wordCount.toLocaleString()}, Time: ${extractionTime}ms, Hash: ${textHash.substring(0, 8)}...`);
    
    // تحذيرات للملفات الكبيرة
    const warnings = [];
    if (wordCount > 100000) {
      warnings.push('الملف يحتوي على أكثر من 100,000 كلمة - قد تفشل المقارنة');
    } else if (wordCount > 50000) {
      warnings.push('الملف يحتوي على نص كبير - قد يستغرق وقتاً أطول');
    }

    return new Response(
      JSON.stringify({
        success: true,
        text: cleanedText,
        hash: textHash,
        wordCount,
        warnings: warnings.length > 0 ? warnings : undefined,
        metadata: {
          fileSize: uint8Array.length,
          fileSizeMB: parseFloat(fileSizeInMB),
          extractionTime,
          processingTime: Date.now() - startTime,
          extractedAt: new Date().toISOString(),
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[EXTRACT] Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'حدث خطأ غير متوقع أثناء معالجة الملف',
          message_en: 'Unexpected error during processing',
          details: {
            error: error instanceof Error ? error.message : String(error),
          },
          suggestions: [
            'حاول مرة أخرى',
            'تأكد من أن الملف صالح',
            'إذا استمر الخطأ، تواصل مع الدعم الفني',
          ]
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// استخراج النص من PDF (نسخة مبسطة)
async function extractTextFromPDF(pdfBytes: Uint8Array): Promise<string> {
  try {
    // تحويل إلى نص
    const decoder = new TextDecoder('utf-8', { fatal: false });
    let rawText = decoder.decode(pdfBytes);

    // استخراج النص بين علامات stream و endstream
    const textMatches = rawText.match(/BT\s+(.*?)\s+ET/gs);
    if (!textMatches) {
      // محاولة بديلة: البحث عن أي نص قابل للقراءة
      const readableText = rawText.replace(/[^\x20-\x7E\u0600-\u06FF\s]/g, ' ');
      return readableText;
    }

    let extractedText = '';
    for (const match of textMatches) {
      // استخراج النص من بين الأقواس
      const textParts = match.match(/\((.*?)\)/g);
      if (textParts) {
        for (const part of textParts) {
          extractedText += part.replace(/[()]/g, '') + ' ';
        }
      }
    }

    return extractedText || rawText.replace(/[^\x20-\x7E\u0600-\u06FF\s]/g, ' ');
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

// تنظيف النص
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // توحيد المسافات
    .replace(/[^\w\s\u0600-\u06FF.,!?;:()\-]/g, '') // إزالة الرموز غير المرغوبة
    .trim();
}

// حساب SHA-256 hash
async function calculateHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// حساب عدد الكلمات
function countWords(text: string): number {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}
