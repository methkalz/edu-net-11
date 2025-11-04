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

    console.log(`Extracted ${wordCount} words, hash: ${textHash.substring(0, 8)}...`);

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
