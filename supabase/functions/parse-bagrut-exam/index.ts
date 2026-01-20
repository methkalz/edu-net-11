import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedQuestion {
  question_number: string;
  question_text: string;
  question_type: string;
  points: number;
  has_image: boolean;
  image_description?: string;
  image_url?: string;
  has_table: boolean;
  table_data?: any;
  has_code: boolean;
  code_content?: string;
  choices?: Array<{ id: string; text: string; is_correct: boolean }>;
  correct_answer?: string;
  answer_explanation?: string;
  sub_questions?: ParsedQuestion[];
  topic_tags?: string[];
}

// Generate an educational image using AI
async function generateImageFromDescription(
  apiKey: string,
  description: string,
  questionContext: string
): Promise<string | null> {
  try {
    const prompt = `Create a clear educational diagram for a Bagrut exam question in computer science:

Image Description: ${description}
Question Context: ${questionContext.substring(0, 300)}

Requirements:
- Simple, clear technical diagram or chart
- White or light background
- Professional exam-style design suitable for educational materials
- Use clean lines and shapes
- Labels should be clear and readable
- If showing code or data structures, use proper formatting
- Aspect ratio: 4:3 or 16:9 for better display`;

    console.log(`Generating image for: ${description.substring(0, 100)}...`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [{ role: 'user', content: prompt }],
        modalities: ['image', 'text']
      })
    });

    if (!response.ok) {
      console.error('Image generation failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (imageUrl) {
      console.log('Image generated successfully');
      return imageUrl;
    }
    
    console.log('No image in response');
    return null;
  } catch (error) {
    console.error('Image generation error:', error);
    return null;
  }
}

// Upload base64 image to Supabase Storage
async function uploadImageToStorage(
  supabaseClient: any,
  base64Image: string,
  questionNumber: string,
  examCode: string
): Promise<string | null> {
  try {
    // Remove the data URL prefix if present
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    
    // Decode base64 to binary
    const binaryString = atob(base64Data);
    const imageBuffer = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      imageBuffer[i] = binaryString.charCodeAt(i);
    }
    
    // Create unique filename
    const timestamp = Date.now();
    const safeExamCode = (examCode || 'exam').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `generated/${safeExamCode}/q${questionNumber}_${timestamp}.png`;
    
    console.log(`Uploading image to: ${fileName}`);
    
    const { data, error } = await supabaseClient.storage
      .from('bagrut-exam-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (error) {
      console.error('Storage upload error:', error);
      return null;
    }
    
    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('bagrut-exam-images')
      .getPublicUrl(fileName);
    
    console.log(`Image uploaded: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Upload error:', error);
    return null;
  }
}

// Process images for all questions that need them
async function processQuestionsImages(
  parsedExam: ParsedExam,
  apiKey: string,
  supabaseClient: any
): Promise<void> {
  console.log('Starting image generation for questions with has_image=true...');
  
  for (const section of parsedExam.sections) {
    for (const question of section.questions) {
      // Process main question
      if (question.has_image && question.image_description && !question.image_url) {
        console.log(`Processing image for question ${question.question_number}...`);
        
        const generatedImage = await generateImageFromDescription(
          apiKey,
          question.image_description,
          question.question_text
        );
        
        if (generatedImage) {
          const publicUrl = await uploadImageToStorage(
            supabaseClient,
            generatedImage,
            question.question_number,
            parsedExam.exam_code || `${parsedExam.exam_year}`
          );
          
          if (publicUrl) {
            question.image_url = publicUrl;
            console.log(`✓ Image ready for question ${question.question_number}`);
          }
        }
      }
      
      // Process sub-questions
      if (question.sub_questions) {
        for (const subQ of question.sub_questions) {
          if ((subQ as any).has_image && (subQ as any).image_description && !(subQ as any).image_url) {
            console.log(`Processing image for sub-question ${subQ.question_number}...`);
            
            const generatedImage = await generateImageFromDescription(
              apiKey,
              (subQ as any).image_description,
              subQ.question_text
            );
            
            if (generatedImage) {
              const publicUrl = await uploadImageToStorage(
                supabaseClient,
                generatedImage,
                subQ.question_number,
                parsedExam.exam_code || `${parsedExam.exam_year}`
              );
              
              if (publicUrl) {
                (subQ as any).image_url = publicUrl;
                console.log(`✓ Image ready for sub-question ${subQ.question_number}`);
              }
            }
          }
        }
      }
    }
  }
  
  console.log('Image generation completed');
}

interface ParsedSection {
  section_number: number;
  section_title: string;
  section_type: 'mandatory' | 'elective';
  total_points: number;
  specialization?: string;
  specialization_label?: string;
  instructions?: string;
  questions: ParsedQuestion[];
}

interface ParsedExam {
  title: string;
  exam_year: number;
  exam_season: string;
  exam_code?: string;
  subject: string;
  duration_minutes: number;
  total_points: number;
  instructions?: string;
  sections: ParsedSection[];
}

// Models to try in order (from most capable to fallback)
const AI_MODELS = [
  'google/gemini-2.5-pro',      // Most capable, handles large responses
  'openai/gpt-5-mini',          // Good fallback
  'google/gemini-2.5-flash',    // Faster but may truncate
];

// Attempt to repair truncated JSON by closing open brackets
function repairTruncatedJSON(jsonString: string): ParsedExam | null {
  if (!jsonString || jsonString.length < 10) return null;
  
  let repaired = jsonString.trim();
  
  // Remove trailing incomplete property or value
  // Find last complete structure
  const lastCompleteComma = repaired.lastIndexOf(',');
  const lastCloseBracket = repaired.lastIndexOf(']');
  const lastCloseBrace = repaired.lastIndexOf('}');
  
  // If we're in the middle of a string, try to close it
  const openQuotes = (repaired.match(/(?<!\\)"/g) || []).length;
  if (openQuotes % 2 !== 0) {
    repaired += '"';
  }
  
  // Count open/close brackets and braces
  let openBrackets = 0;
  let openBraces = 0;
  let inString = false;
  
  for (let i = 0; i < repaired.length; i++) {
    const char = repaired[i];
    const prevChar = i > 0 ? repaired[i-1] : '';
    
    if (char === '"' && prevChar !== '\\') {
      inString = !inString;
    } else if (!inString) {
      if (char === '[') openBrackets++;
      else if (char === ']') openBrackets--;
      else if (char === '{') openBraces++;
      else if (char === '}') openBraces--;
    }
  }
  
  // Remove any trailing comma before closing
  repaired = repaired.replace(/,\s*$/, '');
  
  // Add missing closures
  repaired += ']'.repeat(Math.max(0, openBrackets));
  repaired += '}'.repeat(Math.max(0, openBraces));
  
  try {
    const parsed = JSON.parse(repaired);
    console.log('JSON repair successful');
    return parsed as ParsedExam;
  } catch (e) {
    console.log('JSON repair failed:', e);
    return null;
  }
}

// Call AI with a specific model
async function callAIWithModel(
  model: string,
  apiKey: string,
  systemPrompt: string,
  userContent: any[],
  toolSchema: any,
  timeoutMs: number = 180000
): Promise<{ success: boolean; parsedExam?: ParsedExam; error?: string }> {
  
  console.log(`Trying model: ${model}`);
  
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        tools: [toolSchema],
        tool_choice: { type: 'function', function: { name: 'parse_bagrut_exam' } }
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Model ${model} error:`, response.status, errorText);
      
      if (response.status === 429) {
        return { success: false, error: 'rate_limit' };
      }
      if (response.status === 402) {
        return { success: false, error: 'credits_exhausted' };
      }
      return { success: false, error: `API error: ${response.status}` };
    }
    
    const responseText = await response.text();
    console.log(`Model ${model} response length: ${responseText.length}`);
    
    // Parse outer JSON
    let aiResult;
    try {
      aiResult = JSON.parse(responseText);
    } catch (e) {
      console.error(`Model ${model}: Failed to parse response JSON`);
      return { success: false, error: 'response_json_invalid' };
    }
    
    // Extract tool call
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'parse_bagrut_exam') {
      console.error(`Model ${model}: No valid tool call found`);
      return { success: false, error: 'no_tool_call' };
    }
    
    const args = toolCall.function.arguments;
    console.log(`Tool call arguments length: ${args?.length || 0}`);
    
    // Try to parse tool call arguments
    let parsedExam: ParsedExam;
    try {
      parsedExam = JSON.parse(args);
      console.log(`Model ${model}: Parsed successfully, sections: ${parsedExam.sections?.length}`);
      return { success: true, parsedExam };
    } catch (e) {
      console.log(`Model ${model}: Arguments JSON invalid, attempting repair...`);
      
      // Try to repair truncated JSON
      const repaired = repairTruncatedJSON(args);
      if (repaired && repaired.sections && repaired.sections.length > 0) {
        console.log(`Model ${model}: Repair successful, sections: ${repaired.sections.length}`);
        return { success: true, parsedExam: repaired };
      }
      
      return { success: false, error: 'arguments_truncated' };
    }
    
  } catch (e) {
    clearTimeout(timeout);
    
    if (e instanceof Error && e.name === 'AbortError') {
      console.error(`Model ${model}: Request timeout`);
      return { success: false, error: 'timeout' };
    }
    
    console.error(`Model ${model}: Unexpected error:`, e);
    return { success: false, error: 'unexpected_error' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Verify user is superadmin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'superadmin') {
      return new Response(JSON.stringify({ error: 'Access denied. Superadmin only.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('fileType') as string;
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing file: ${file.name}, type: ${fileType}, size: ${file.size}`);

    // Convert file to base64 for AI processing (chunked to avoid stack overflow)
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const chunkSize = 32768; // 32KB chunks
    let base64Content = '';
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      base64Content += String.fromCharCode.apply(null, chunk as unknown as number[]);
    }
    base64Content = btoa(base64Content);

    // Only PDF is supported
    if (fileType !== 'pdf') {
      return new Response(JSON.stringify({ 
        error: 'حالياً يُدعم فقط ملفات PDF. الرجاء تحويل ملف Word إلى PDF ثم إعادة الرفع.',
        suggestion: 'يمكنك تحويل الملف مجاناً من أحد هذه المواقع:',
        converterLinks: [
          { name: 'iLovePDF', url: 'https://www.ilovepdf.com/word_to_pdf' },
          { name: 'SmallPDF', url: 'https://smallpdf.com/word-to-pdf' },
          { name: 'PDF24', url: 'https://tools.pdf24.org/ar/word-to-pdf' }
        ]
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userContent = [
      {
        type: 'text',
        text: 'حلل هذا الامتحان واستخرج جميع المعلومات بالتنسيق المطلوب. الملف المرفق هو امتحان بجروت.'
      },
      {
        type: 'image_url',
        image_url: {
          url: `data:application/pdf;base64,${base64Content}`
        }
      }
    ];

    // Simplified and clearer system prompt with table extraction instructions
    const systemPrompt = `أنت محلل متخصص في امتحانات البجروت. حلل الامتحان واستخرج:

1. معلومات الامتحان: العنوان، السنة، الموسم (summer/winter/spring)، المادة، المدة بالدقائق، مجموع العلامات
2. الأقسام: رقم القسم، العنوان، النوع (mandatory/elective)، التخصص إن وجد
3. الأسئلة: الرقم، النص، النوع، النقاط، الخيارات والإجابة الصحيحة

**مهم جداً - استخراج الجداول:**
- إذا احتوى السؤال على جدول، يجب استخراجه بالكامل في table_data
- table_data يحتوي على: headers (عناوين الأعمدة) و rows (صفوف البيانات)
- الخلايا الفارغة أو التي يجب على الطالب ملؤها ضعها كـ "?" 
- إذا كان هناك "مخزن كلمات" أو خيارات مساعدة، ضعها في word_bank كمصفوفة نصية
- استخدم نوع السؤال fill_table إذا كان السؤال يطلب إكمال جدول

أنواع الأسئلة المتاحة:
- multiple_choice: اختيار من متعدد
- true_false: صح/خطأ
- open_ended: سؤال مفتوح
- multi_part: سؤال متعدد الأجزاء
- fill_blank: ملء الفراغ
- fill_table: إكمال جدول
- matching: مطابقة
- calculation: حساب

مهم جداً: أكمل جميع البيانات ولا تقطع الإجابة في المنتصف. استخرج جميع الجداول بدقة.`;

    // Simplified tool schema for better completion rates
    const toolSchema = {
      type: 'function',
      function: {
        name: 'parse_bagrut_exam',
        description: 'Parse a Bagrut exam and extract all data',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            exam_year: { type: 'number' },
            exam_season: { type: 'string', enum: ['summer', 'winter', 'spring'] },
            exam_code: { type: 'string' },
            subject: { type: 'string' },
            duration_minutes: { type: 'number' },
            total_points: { type: 'number' },
            instructions: { type: 'string' },
            sections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  section_number: { type: 'number' },
                  section_title: { type: 'string' },
                  section_type: { type: 'string', enum: ['mandatory', 'elective'] },
                  total_points: { type: 'number' },
                  specialization: { type: 'string' },
                  specialization_label: { type: 'string' },
                  instructions: { type: 'string' },
                  questions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        question_number: { type: 'string' },
                        question_text: { type: 'string' },
                        question_type: { type: 'string' },
                        points: { type: 'number' },
                        has_image: { type: 'boolean' },
                        image_description: { type: 'string' },
                        has_table: { type: 'boolean' },
                        table_data: {
                          type: 'object',
                          description: 'بيانات الجدول إذا كان السؤال يحتوي على جدول',
                          properties: {
                            headers: {
                              type: 'array',
                              items: { type: 'string' },
                              description: 'عناوين أعمدة الجدول'
                            },
                            rows: {
                              type: 'array',
                              items: {
                                type: 'array',
                                items: { type: 'string' }
                              },
                              description: 'صفوف الجدول - كل صف هو مصفوفة من القيم، الخلايا الفارغة تكون ?'
                            }
                          }
                        },
                        word_bank: {
                          type: 'array',
                          items: { type: 'string' },
                          description: 'مخزن الكلمات المساعدة للطالب إن وجد'
                        },
                        has_code: { type: 'boolean' },
                        code_content: { type: 'string' },
                        choices: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              text: { type: 'string' },
                              is_correct: { type: 'boolean' }
                            }
                          }
                        },
                        correct_answer: { type: 'string' },
                        answer_explanation: { type: 'string' },
                        sub_questions: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              question_number: { type: 'string' },
                              question_text: { type: 'string' },
                              question_type: { type: 'string' },
                              points: { type: 'number' },
                              correct_answer: { type: 'string' }
                            }
                          }
                        }
                      },
                      required: ['question_number', 'question_text', 'question_type', 'points']
                    }
                  }
                },
                required: ['section_number', 'section_title', 'section_type', 'total_points', 'questions']
              }
            }
          },
          required: ['title', 'exam_year', 'exam_season', 'subject', 'duration_minutes', 'total_points', 'sections']
        }
      }
    };

    // Try each model until one succeeds
    let lastError = '';
    let parsedExam: ParsedExam | null = null;
    
    for (const model of AI_MODELS) {
      console.log(`\n=== Attempting with ${model} ===`);
      
      const result = await callAIWithModel(
        model,
        LOVABLE_API_KEY,
        systemPrompt,
        userContent,
        toolSchema,
        180000 // 3 minutes timeout
      );
      
      if (result.success && result.parsedExam) {
        parsedExam = result.parsedExam;
        console.log(`Success with ${model}!`);
        break;
      }
      
      lastError = result.error || 'Unknown error';
      console.log(`Model ${model} failed: ${lastError}`);
      
      // Don't continue if rate limited or credits exhausted
      if (result.error === 'rate_limit') {
        return new Response(JSON.stringify({ error: 'تم تجاوز حد الطلبات. الرجاء المحاولة لاحقاً.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (result.error === 'credits_exhausted') {
        return new Response(JSON.stringify({ error: 'نفدت رصيد AI. الرجاء إضافة رصيد.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    if (!parsedExam) {
      console.error('All models failed. Last error:', lastError);
      return new Response(JSON.stringify({ 
        error: 'فشل في تحليل الامتحان بعد عدة محاولات. الرجاء المحاولة مرة أخرى أو استخدام ملف أصغر.',
        details: lastError
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Generate images for questions that need them
    try {
      await processQuestionsImages(parsedExam, LOVABLE_API_KEY, supabase);
    } catch (imgError) {
      console.error('Image processing error (non-fatal):', imgError);
      // Continue even if image generation fails - images can be added manually
    }
    
    // Calculate statistics
    let totalQuestions = 0;
    let questionsByType: Record<string, number> = {};
    
    for (const section of parsedExam.sections || []) {
      for (const question of section.questions || []) {
        totalQuestions++;
        questionsByType[question.question_type] = (questionsByType[question.question_type] || 0) + 1;
        
        if (question.sub_questions) {
          totalQuestions += question.sub_questions.length;
          for (const sub of question.sub_questions) {
            questionsByType[sub.question_type] = (questionsByType[sub.question_type] || 0) + 1;
          }
        }
      }
    }

    console.log('Calculated statistics:', { totalSections: parsedExam.sections?.length, totalQuestions });
    
    const responseData = {
      success: true,
      parsedExam,
      statistics: {
        totalSections: parsedExam.sections?.length || 0,
        totalQuestions,
        questionsByType,
        totalPoints: parsedExam.total_points
      }
    };
    
    console.log('Sending response, size:', JSON.stringify(responseData).length, 'bytes');

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error parsing exam:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return new Response(JSON.stringify({ 
        error: 'انتهت مهلة المعالجة. الملف كبير جداً، يرجى المحاولة بملف أصغر.',
      }), {
        status: 504,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
