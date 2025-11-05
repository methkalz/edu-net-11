import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import * as pdfjsLib from 'npm:pdfjs-dist@4.0.379/legacy/build/pdf.mjs';

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
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { filePath, bucket } = await req.json();

    if (!filePath || !bucket) {
      throw new Error('Missing required parameters: filePath and bucket');
    }

    console.log(`Extracting text from: ${bucket}/${filePath}`);

    // تحميل الملف من Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(filePath);

    if (downloadError) {
      console.error('Download error:', downloadError);
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    // تحويل Blob إلى ArrayBuffer
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // استخراج النص من PDF (نسخة بسيطة - في الإنتاج نستخدم مكتبة متقدمة)
    const extractedText = await extractTextFromPDF(uint8Array);

    // تنظيف النص
    const cleanedText = cleanText(extractedText);

    // حساب hash
    const textHash = await calculateHash(cleanedText);

    // حساب عدد الكلمات
    const wordCount = countWords(cleanedText);

    console.log(`Extracted ${wordCount} words from ${extractedText.length} characters, hash: ${textHash.substring(0, 8)}...`);
    console.log(`First 200 chars of cleaned text: ${cleanedText.substring(0, 200)}`);

    return new Response(
      JSON.stringify({
        success: true,
        text: cleanedText,
        hash: textHash,
        wordCount,
        metadata: {
          fileSize: uint8Array.length,
          extractedAt: new Date().toISOString(),
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in pdf-extract-text function:', error);
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

// استخراج النص من PDF باستخدام PDF.js
async function extractTextFromPDF(pdfBytes: Uint8Array): Promise<string> {
  try {
    console.log(`Starting PDF text extraction, file size: ${pdfBytes.length} bytes`);
    
    // تحميل ملف PDF
    const loadingTask = pdfjsLib.getDocument({
      data: pdfBytes,
      useSystemFonts: true,
      standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/standard_fonts/',
    });
    
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    console.log(`PDF loaded successfully, total pages: ${numPages}`);
    
    let fullText = '';
    
    // استخراج النص من كل صفحة
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // تجميع النص من كل عنصر في الصفحة
        const pageText = textContent.items
          .map((item: any) => {
            // التحقق من وجود النص
            if (item.str && typeof item.str === 'string') {
              return item.str;
            }
            return '';
          })
          .filter((text: string) => text.trim().length > 0)
          .join(' ');
        
        if (pageText.trim().length > 0) {
          fullText += pageText + '\n';
          console.log(`Page ${pageNum}: extracted ${pageText.length} characters`);
        }
      } catch (pageError) {
        console.error(`Error extracting text from page ${pageNum}:`, pageError);
        // نستمر في الصفحات الأخرى
      }
    }
    
    if (!fullText || fullText.trim().length === 0) {
      console.warn('No readable text found in PDF after processing all pages');
      return '';
    }
    
    console.log(`Total extracted text length: ${fullText.length} characters`);
    return fullText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    
    // Fallback: محاولة استخراج بسيط من البايتات
    try {
      console.log('Attempting fallback text extraction method...');
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const rawText = decoder.decode(pdfBytes);
      
      // البحث عن نصوص بين أقواس في PDF
      const textMatches = rawText.match(/\(([^)]+)\)/g);
      if (textMatches && textMatches.length > 0) {
        const extractedText = textMatches
          .map(match => match.slice(1, -1))
          .filter(text => text.length > 2)
          .join(' ');
        
        if (extractedText.trim().length > 0) {
          console.log(`Fallback extraction successful: ${extractedText.length} characters`);
          return extractedText;
        }
      }
    } catch (fallbackError) {
      console.error('Fallback extraction also failed:', fallbackError);
    }
    
    throw new Error('Failed to extract text from PDF');
  }
}

// تنظيف النص (محسّن للنصوص العربية والإنجليزية)
function cleanText(text: string): string {
  console.log(`Starting text cleaning, original length: ${text.length}`);
  
  // قائمة بالكلمات التقنية الشائعة التي يجب إزالتها
  const technicalKeywords = [
    'obj', 'endobj', 'stream', 'endstream',
    'Type', 'Font', 'Catalog', 'Pages', 'Page',
    'Parent', 'Resources', 'Contents', 'MediaBox',
    'TrueType', 'BaseFont', 'Encoding', 'ToUnicode',
    'Length', 'Filter', 'FlateDecode', 'Subtype',
    'FirstChar', 'LastChar', 'Widths', 'FontDescriptor'
  ];
  
  // تنظيف أولي
  let cleaned = text
    .replace(/\r\n/g, '\n') // توحيد نهايات الأسطر
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ') // تحويل tabs إلى مسافات
    .replace(/\s+/g, ' ') // توحيد المسافات المتعددة
    .replace(/\\[nrt]/g, ' ') // إزالة escape characters
    .trim();
  
  // إزالة الرموز غير المرغوبة مع الحفاظ على العربية والإنجليزية
  cleaned = cleaned.replace(/[^\w\s\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF.,!?;:()\-]/g, '');
  
  // تطبيع الحروف العربية
  cleaned = cleaned
    .replace(/[أإآ]/g, 'ا') // توحيد الألف
    .replace(/ى/g, 'ي') // توحيد الياء
    .replace(/ة/g, 'ه') // توحيد التاء المربوطة
    .replace(/[\u064B-\u065F]/g, ''); // إزالة التشكيل
  
  // تقسيم إلى كلمات وتصفية
  const words = cleaned.split(/\s+/);
  const filteredWords = words.filter(word => {
    // إزالة الكلمات الفارغة
    if (!word || word.length === 0) return false;
    
    // إزالة الكلمات التقنية
    if (technicalKeywords.includes(word)) return false;
    
    // إزالة الكلمات القصيرة جداً (أقل من حرفين)
    if (word.length < 2) return false;
    
    // إزالة الكلمات التي تبدأ بـ /
    if (word.startsWith('/')) return false;
    
    // إزالة الكلمات التي هي أرقام فقط
    if (/^\d+$/.test(word)) return false;
    
    return true;
  });
  
  const result = filteredWords.join(' ');
  console.log(`Text cleaning complete, cleaned length: ${result.length}, words: ${filteredWords.length}`);
  
  return result;
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
