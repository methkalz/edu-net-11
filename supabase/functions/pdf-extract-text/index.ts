import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getDocument } from 'https://esm.sh/pdfjs-dist@4.0.379/legacy/build/pdf.mjs';
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
    
    let extractionResult;
    try {
      extractionResult = await extractTextFromPDF(uint8Array);
      console.log(`[EXTRACT] Extraction method: ${extractionResult.extractionMethod}`);
      console.log(`[EXTRACT] Pages: ${extractionResult.pageCount}`);
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
    const cleanedText = cleanText(extractionResult.text);
    const extractionTime = Date.now() - extractionStart;

    // حساب عدد الكلمات
    const wordCount = countWords(cleanedText);
    
    // التحقق من صحة النص المستخرج
    const validation = validateExtractedText(cleanedText, wordCount);
    
    console.log(`[EXTRACT] Word count: ${wordCount.toLocaleString()}`);
    console.log(`[EXTRACT] Character count: ${cleanedText.length.toLocaleString()}`);
    console.log(`[EXTRACT] Average word length: ${(cleanedText.length / wordCount).toFixed(2)}`);
    console.log(`[EXTRACT] First 200 chars: ${cleanedText.substring(0, 200)}`);

    // إذا فشل التحقق
    if (!validation.valid) {
      console.error('[EXTRACT] Validation failed:', validation.error || validation.warning);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'INVALID_TEXT',
            message: validation.error || validation.warning || 'النص المستخرج غير صحيح',
            message_en: 'Invalid extracted text',
            details: {
              wordCount,
              charCount: cleanedText.length,
              pageCount: extractionResult.pageCount,
              avgWordLength: (cleanedText.length / wordCount).toFixed(2),
            },
            suggestions: [
              'تأكد من أن الملف يحتوي على نص وليس صور فقط',
              'إذا كان الملف scanned، استخدم برنامج OCR لتحويله لنص',
              'جرب تصدير الملف من جديد كـ PDF نصي'
            ]
          }
        }),
        {
          status: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // حساب hash
    const textHash = await calculateHash(cleanedText);

    console.log(`[EXTRACT] Completed - Words: ${wordCount.toLocaleString()}, Time: ${extractionTime}ms, Hash: ${textHash.substring(0, 8)}...`);
    
    // تحذيرات للملفات الكبيرة
    const warnings = [];
    if (validation.warning) {
      warnings.push(validation.warning);
    }
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
          fileName: filePath,
          fileSize: uint8Array.length,
          fileSizeMB: parseFloat(fileSizeInMB),
          pageCount: extractionResult.pageCount,
          charCount: cleanedText.length,
          avgWordLength: (cleanedText.length / wordCount).toFixed(2),
          extractionMethod: extractionResult.extractionMethod,
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

// استخراج النص من PDF باستخدام pdfjs-dist
async function extractTextFromPDF(pdfBytes: Uint8Array): Promise<{
  text: string;
  pageCount: number;
  extractionMethod: string;
}> {
  try {
    console.log('[EXTRACT] Loading PDF with pdfjs-dist...');
    
    // تحميل المستند
    const loadingTask = getDocument({
      data: pdfBytes,
      useSystemFonts: true,
      standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/standard_fonts/',
    });
    
    const pdfDocument = await loadingTask.promise;
    const pageCount = pdfDocument.numPages;
    
    console.log(`[EXTRACT] PDF loaded successfully. Pages: ${pageCount}`);
    
    let fullText = '';
    
    // استخراج النص من كل صفحة
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      try {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // دمج النص من كل العناصر في الصفحة
        const pageText = textContent.items
          .map((item: any) => {
            // التعامل مع TextItem و TextMarkedContent
            if ('str' in item) {
              return item.str || '';
            }
            return '';
          })
          .join(' ');
        
        fullText += pageText + '\n';
        
        if (pageNum % 10 === 0) {
          console.log(`[EXTRACT] Processed ${pageNum}/${pageCount} pages...`);
        }
      } catch (pageError) {
        console.error(`[EXTRACT] Error processing page ${pageNum}:`, pageError);
        // نستمر في معالجة الصفحات الأخرى
      }
    }
    
    console.log(`[EXTRACT] Extraction complete. Total characters: ${fullText.length.toLocaleString()}`);
    
    return {
      text: fullText,
      pageCount,
      extractionMethod: 'pdfjs-dist'
    };
    
  } catch (error) {
    console.error('[EXTRACT] PDF extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// تنظيف النص - دعم متعدد اللغات (عربي، عبري، إنجليزي)
function cleanText(text: string): string {
  return text
    // توحيد المسافات
    .replace(/\s+/g, ' ')
    // إزالة الرموز غير المرغوبة مع الحفاظ على:
    // - العربية: \u0600-\u06FF
    // - العبرية: \u0590-\u05FF
    // - الإنجليزية والأرقام: \w
    // - علامات الترقيم: .,!?;:()\-
    .replace(/[^\w\s\u0600-\u06FF\u0590-\u05FF.,!?;:()\-]/g, '')
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

// حساب عدد الكلمات - دعم متعدد اللغات
function countWords(text: string): number {
  // فقط الكلمات التي تحتوي على أحرف حقيقية:
  // \u0600-\u06FF: Arabic (عربي)
  // \u0590-\u05FF: Hebrew (עברית)
  // \w: English letters, numbers, and underscore
  const words = text.match(/[\u0600-\u06FF\u0590-\u05FF\w]+/g);
  return words ? words.length : 0;
}

// التحقق من صحة النص المستخرج
function validateExtractedText(text: string, wordCount: number): {
  valid: boolean;
  warning?: string;
  error?: string;
} {
  const totalChars = text.length;
  
  // إذا كان النص فارغاً أو قصيراً جداً
  if (wordCount === 0 || totalChars < 10) {
    return {
      valid: false,
      error: 'لم يتم استخراج أي نص من الملف. قد يكون الملف عبارة عن صور فقط (Scanned PDF).'
    };
  }
  
  // حساب متوسط طول الكلمة
  const avgWordLength = totalChars / wordCount;
  
  // إذا كان متوسط طول الكلمة غير طبيعي (قصير جداً)
  if (avgWordLength < 2) {
    return {
      valid: false,
      error: 'النص المستخرج غير صحيح. قد يكون الملف تالفاً أو مشفراً.'
    };
  }
  
  // إذا كان متوسط طول الكلمة طويل جداً
  if (avgWordLength > 20) {
    return {
      valid: false,
      warning: 'النص المستخرج قد يحتوي على بيانات غير صحيحة. متوسط طول الكلمة غير طبيعي.'
    };
  }
  
  return { valid: true };
}
