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

// استخراج النص من PDF - محسّن لتجاهل بيانات الصور
async function extractTextFromPDF(pdfBytes: Uint8Array): Promise<{
  text: string;
  pageCount: number;
  extractionMethod: string;
}> {
  try {
    console.log('[EXTRACT] Starting PDF text extraction...');
    
    // تحويل إلى نص بترميز UTF-8
    const decoder = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true });
    const rawText = decoder.decode(pdfBytes);
    
    // تقدير عدد الصفحات من PDF structure
    const pageMatches = rawText.match(/\/Type\s*\/Page[^s]/g);
    const pageCount = pageMatches ? pageMatches.length : 1;
    
    console.log(`[EXTRACT] Estimated pages: ${pageCount}`);
    
    let extractedText = '';
    let textFragments: string[] = [];
    
    // Method 1: استخراج النص من BT...ET blocks (Text objects فقط)
    const textObjectMatches = rawText.match(/BT\s+([\s\S]*?)\s+ET/g);
    
    if (textObjectMatches && textObjectMatches.length > 0) {
      console.log(`[EXTRACT] Found ${textObjectMatches.length} text objects`);
      
      for (const textBlock of textObjectMatches) {
        // تجاهل blocks التي تحتوي على image markers
        if (textBlock.includes('/Image') || textBlock.includes('/XObject') || 
            textBlock.includes('stream') || textBlock.includes('endstream')) {
          continue;
        }
        
        // استخراج النص من بين الأقواس () فقط
        const textInParentheses = textBlock.match(/\(([^)]*)\)/g);
        
        if (textInParentheses) {
          for (const match of textInParentheses) {
            const text = match.slice(1, -1); // إزالة الأقواس
            
            // تجاهل النص إذا كان يحتوي على binary data
            if (text.includes('\x00') || /[\x01-\x08\x0B-\x1F\x7F-\xFF]{10,}/.test(text)) {
              continue;
            }
            
            // فك ترميز escape sequences
            const decoded = text
              .replace(/\\n/g, '\n')
              .replace(/\\r/g, '\r')
              .replace(/\\t/g, '\t')
              .replace(/\\\(/g, '(')
              .replace(/\\\)/g, ')')
              .replace(/\\\\/g, '\\');
            
            // فقط إضافة النص إذا كان يحتوي على أحرف حقيقية
            const hasRealText = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077Fa-zA-Z0-9]{2,}/.test(decoded);
            if (hasRealText) {
              textFragments.push(decoded);
            }
          }
        }
      }
      
      extractedText = textFragments.join(' ');
      console.log(`[EXTRACT] Extracted ${textFragments.length} text fragments`);
    }
    
    // Method 2: استخراج النص من TJ arrays (طريقة بديلة)
    if (extractedText.length < 100) {
      console.log('[EXTRACT] Using TJ array extraction method');
      
      const tjMatches = rawText.match(/TJ\s*$/gm);
      if (tjMatches) {
        const tjBlocks = rawText.match(/\[([\s\S]*?)\]\s*TJ/g);
        if (tjBlocks) {
          for (const block of tjBlocks) {
            const texts = block.match(/\(([^)]*)\)/g);
            if (texts) {
              for (const text of texts) {
                const clean = text.slice(1, -1);
                const hasRealText = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077Fa-zA-Z0-9]{2,}/.test(clean);
                if (hasRealText && !clean.includes('\x00')) {
                  textFragments.push(clean);
                }
              }
            }
          }
          extractedText = textFragments.join(' ');
        }
      }
    }
    
    console.log(`[EXTRACT] Raw extracted length: ${extractedText.length} characters`);
    
    // تنظيف نهائي: إزالة أي رموز غير مرغوبة متبقية
    extractedText = extractedText
      .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ') // إزالة control characters
      .replace(/\s+/g, ' ') // توحيد المسافات
      .trim();
    
    console.log(`[EXTRACT] Cleaned length: ${extractedText.length} characters`);
    
    // إذا لم نجد نص كافٍ، نعتبرها PDF فيه صور فقط أو محمي
    if (extractedText.length < 50) {
      throw new Error('No readable text found - PDF may contain only images or is protected');
    }
    
    return {
      text: extractedText,
      pageCount,
      extractionMethod: 'enhanced-regex-v2'
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

// حساب عدد الكلمات - دعم متعدد اللغات مع فلترة محسّنة
function countWords(text: string): number {
  // استخراج الكلمات التي تحتوي على أحرف حقيقية فقط:
  // \u0600-\u06FF: Arabic (عربي)
  // \u0750-\u077F: Arabic Supplement
  // \u0590-\u05FF: Hebrew (עברית)
  // a-zA-Z: English letters
  const words = text.match(/[\u0600-\u06FF\u0750-\u077F\u0590-\u05FFa-zA-Z]+/g);
  
  if (!words) return 0;
  
  // فلترة إضافية: فقط الكلمات التي طولها >= 2 حرف
  const validWords = words.filter(word => {
    // التأكد من أن الكلمة تحتوي على أحرف حقيقية وليست رموز فقط
    return word.length >= 2 && /[\u0600-\u06FF\u0750-\u077F\u0590-\u05FFa-zA-Z]{2,}/.test(word);
  });
  
  return validWords.length;
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
