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

    console.log(`📄 Extracting text from: ${bucket}/${filePath}`);

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
    const pdfBytes = new Uint8Array(arrayBuffer);
    console.log(`📦 PDF size: ${pdfBytes.length} bytes`);

    // استخراج النص من PDF
    const rawText = await extractTextFromPDF(pdfBytes);
    console.log(`✅ Raw text extracted: ${rawText.length} characters`);

    // تنظيف النص (المرحلة الأولى)
    const cleanedText = cleanText(rawText);
    console.log(`🧹 Cleaned text: ${cleanedText.length} characters`);

    // تطبيع النص العربي (المرحلة الثانية)
    const normalizedText = advancedArabicNormalization(cleanedText);
    console.log(`🔤 Normalized text: ${normalizedText.length} characters`);

    // حساب Hash على النص المُطبّع
    const textHash = await calculateHash(normalizedText);
    
    // حساب Simhash للكشف السريع
    const simhashValue = simhash(normalizedText);
    
    // حساب عدد الكلمات
    const wordCount = countWords(cleanedText);
    
    // توليد N-Grams (3-character)
    const ngrams3 = Array.from(generateNGrams(normalizedText, 3)).slice(0, 10000);
    
    console.log(`📊 Stats: ${wordCount} words, hash: ${textHash.substring(0, 16)}...`);
    console.log(`First 200 chars: ${cleanedText.substring(0, 200)}`);

    return new Response(
      JSON.stringify({
        success: true,
        rawText: rawText.substring(0, 5000), // للأرشفة فقط (5000 حرف)
        cleanedText, // النص النظيف للتخزين
        normalizedText, // النص المُطبّع للمقارنة
        text: cleanedText, // للتوافق مع الكود القديم
        hash: textHash,
        simhash: simhashValue.toString(),
        wordCount,
        ngrams3, // N-grams للبحث السريع
        metadata: {
          extraction_method: 'pdfjs-dist-v4',
          text_length: cleanedText.length,
          normalized_length: normalizedText.length,
          extractedAt: new Date().toISOString(),
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error in pdf-extract-text:', error);
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
          fullText += pageText + '\n\n';
          if (pageNum % 10 === 0) {
            console.log(`  ✓ Processed ${pageNum}/${numPages} pages`);
          }
        }
      } catch (pageError) {
        console.warn(`⚠️ Error on page ${pageNum}:`, pageError);
        continue;
      }
    }
    
    if (!fullText || fullText.trim().length === 0) {
      console.warn('⚠️ Primary extraction returned empty, trying fallback...');
      return extractTextFallback(pdfBytes);
    }
    
    console.log(`Total extracted text length: ${fullText.length} characters`);
    return fullText;
  } catch (error) {
    console.error('❌ PDF.js extraction failed:', error);
    return extractTextFallback(pdfBytes);
  }
}

// Fallback: استخراج نص بسيط من البايتات
function extractTextFallback(pdfBytes: Uint8Array): string {
  console.log('🔄 Using fallback text extraction...');
  
  try {
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const rawText = decoder.decode(pdfBytes);
    
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
  
  return '';
}

// تنظيف النص - المرحلة الأولى
function cleanText(text: string): string {
  const technicalKeywords = [
    'obj', 'endobj', 'stream', 'endstream',
    'Type', 'Font', 'Catalog', 'Pages', 'Page',
    'Parent', 'Resources', 'Contents', 'MediaBox',
    'TrueType', 'BaseFont', 'Encoding', 'ToUnicode',
    'Length', 'Filter', 'FlateDecode', 'Subtype',
    'FirstChar', 'LastChar', 'Widths', 'FontDescriptor'
  ];
  
  return text
    // تطبيع نهايات الأسطر
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // إزالة أحرف غير مرئية وخاصة
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
    .replace(/\u200B/g, '')
    .replace(/\uFEFF/g, '')
    // توحيد المسافات
    .replace(/\t/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    // إزالة الكلمات التقنية
    .replace(/\b(obj|endobj|stream|endstream|xref|trailer|startxref)\b/gi, '')
    // تقسيم وتصفية
    .split(/\s+/)
    .filter(word => {
      if (!word || word.length < 2) return false;
      if (technicalKeywords.includes(word)) return false;
      if (word.startsWith('/')) return false;
      if (/^\d+$/.test(word)) return false;
      return true;
    })
    .join(' ')
    .trim();
}

// تطبيع متقدم للنص العربي - المرحلة الثانية
function advancedArabicNormalization(text: string): string {
  return text
    .toLowerCase()
    // إزالة التشكيل الكامل
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    // توحيد الألف بجميع أشكالها
    .replace(/[آأإٱ]/g, 'ا')
    // توحيد الهمزة
    .replace(/[ؤئ]/g, 'ء')
    // توحيد الياء
    .replace(/[ىي]/g, 'ي')
    // توحيد التاء المربوطة والهاء
    .replace(/ة/g, 'ه')
    // إزالة الكشيدة
    .replace(/ـ/g, '')
    // توحيد الأرقام العربية والهندية إلى ASCII
    .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632 + 48))
    .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776 + 48))
    // إزالة الرموز والأحرف الخاصة
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, ' ')
    // توحيد المسافات
    .replace(/\s+/g, ' ')
    .trim();
}

// حساب SHA-256 Hash
async function calculateHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// حساب Simhash (للكشف السريع عن التطابق التام/شبه التام)
function simhash(text: string): bigint {
  const words = text.split(/\s+/).filter(w => w.length > 2);
  const vector = new Array(64).fill(0);
  
  for (const word of words) {
    const hash = hashString(word);
    for (let i = 0; i < 64; i++) {
      if (hash & (1n << BigInt(i))) {
        vector[i]++;
      } else {
        vector[i]--;
      }
    }
  }
  
  let result = 0n;
  for (let i = 0; i < 64; i++) {
    if (vector[i] > 0) {
      result |= (1n << BigInt(i));
    }
  }
  
  return result;
}

// FNV-1a Hash للنصوص
function hashString(str: string): bigint {
  const FNV_PRIME = 0x100000001b3n;
  let hash = 0xcbf29ce484222325n;
  
  for (let i = 0; i < str.length; i++) {
    hash ^= BigInt(str.charCodeAt(i));
    hash = BigInt.asUintN(64, hash * FNV_PRIME);
  }
  
  return hash;
}

// توليد Character N-Grams
function generateNGrams(text: string, n: number = 3): Set<string> {
  const ngrams = new Set<string>();
  const normalized = text.replace(/\s+/g, '');
  
  for (let i = 0; i <= normalized.length - n; i++) {
    ngrams.add(normalized.substring(i, i + n));
  }
  
  return ngrams;
}

// حساب عدد الكلمات
function countWords(text: string): number {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}
