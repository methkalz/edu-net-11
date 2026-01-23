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
  // Structured blanks for fill_blank questions
  blanks?: Array<{ id: string; placeholder?: string; correct_answer: string }>;
  // Generic structured answers for complex question types
  correct_answer_data?: any;
  sub_questions?: ParsedQuestion[];
  topic_tags?: string[];
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

// Convert Arabic question number to English for safe file naming
function arabicToEnglishNumber(questionNumber: string): string {
  const map: Record<string, string> = {
    'أ': 'a', 'ب': 'b', 'ج': 'c', 'د': 'd', 
    'ه': 'e', 'هـ': 'e', 'و': 'f', 'ز': 'g', 
    'ح': 'h', 'ط': 'i', 'ي': 'j', 'ى': 'j',
    'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
    'س': 's', 'ع': 'aa', 'ف': 'ff', 'ص': 'ss',
    'ق': 'q', 'ر': 'r', 'ش': 'sh', 'ت': 't',
    'ث': 'th', 'خ': 'kh', 'ذ': 'z', 'ض': 'dd',
    'ظ': 'zz', 'غ': 'gh'
  };
  
  let result = questionNumber;
  for (const [arabic, english] of Object.entries(map)) {
    result = result.replace(new RegExp(arabic, 'g'), english);
  }
  // Remove any remaining non-ASCII characters
  return result.replace(/[^a-zA-Z0-9_-]/g, '');
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
    
    // Create unique filename with safe question number
    const timestamp = Date.now();
    const safeExamCode = (examCode || 'exam').replace(/[^a-zA-Z0-9]/g, '_');
    const safeQuestionNumber = arabicToEnglishNumber(questionNumber);
    const fileName = `generated/${safeExamCode}/q${safeQuestionNumber}_${timestamp}.png`;
    
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

// Call AI with a specific model (supports different tool names)
async function callAIWithModel(
  model: string,
  apiKey: string,
  systemPrompt: string,
  userContent: any[],
  toolSchema: any,
  toolName: string = 'parse_bagrut_exam',
  timeoutMs: number = 180000
): Promise<{ success: boolean; parsedExam?: ParsedExam; toolArgs?: any; error?: string }> {
  
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
        tool_choice: { type: 'function', function: { name: toolName } }
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
    if (!toolCall || toolCall.function.name !== toolName) {
      console.error(`Model ${model}: No valid tool call found`);
      return { success: false, error: 'no_tool_call' };
    }
    
    const args = toolCall.function.arguments;
    console.log(`Tool call arguments length: ${args?.length || 0}`);
    
    // Try to parse tool call arguments
    try {
      const parsed = JSON.parse(args);
      // For main parser tool, keep legacy return shape
      if (toolName === 'parse_bagrut_exam') {
        const parsedExam = parsed as ParsedExam;
        console.log(`Model ${model}: Parsed successfully, sections: ${parsedExam.sections?.length}`);
        return { success: true, parsedExam };
      }

      return { success: true, toolArgs: parsed };
    } catch (e) {
      if (toolName !== 'parse_bagrut_exam') {
        return { success: false, error: 'arguments_truncated' };
      }

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

// -----------------------------
// Post-processing helpers (table reliability)
// -----------------------------

const TABLE_INPUT_INDICATORS = ['?', '؟', '', '_', '___', '...', '....', '---', '____', '…'];

const isLikelyInputCellValue = (value: any) => {
  const trimmed = (typeof value === 'string' ? value : String(value ?? '')).trim();
  if (TABLE_INPUT_INDICATORS.includes(trimmed)) return true;
  if (/^[\?\؟\.\_\-\s…]+$/.test(trimmed)) return true;
  return false;
};

const normalizeTableRows = (tableData: any) => {
  if (!tableData || !Array.isArray(tableData.rows)) return tableData;

  const normalizedRows = tableData.rows.map((row: any[]) => {
    if (!Array.isArray(row)) return row;
    return row.map((cell) => {
      const str = typeof cell === 'string' ? cell : String(cell ?? '');
      const trimmed = str.trim();
      // Convert empty / placeholders to ? for consistent input detection
      if (isLikelyInputCellValue(trimmed)) return '?';
      return str;
    });
  });

  return {
    ...tableData,
    rows: normalizedRows,
    input_columns: Array.isArray(tableData.input_columns) ? tableData.input_columns : undefined,
    correct_answers: tableData.correct_answers && typeof tableData.correct_answers === 'object' ? tableData.correct_answers : undefined
  };
};

const visitQuestions = (
  parsedExam: ParsedExam,
  visitor: (q: any) => void
) => {
  for (const section of parsedExam.sections || []) {
    for (const q of section.questions || []) {
      visitor(q);
      if (Array.isArray(q.sub_questions)) {
        for (const sub of q.sub_questions) visitor(sub);
      }
    }
  }
};

const normalizeExamForReliability = (parsedExam: ParsedExam) => {
  visitQuestions(parsedExam, (q) => {
    // Normalize booleans (AI sometimes omits them)
    q.has_image = !!q.has_image;
    q.has_code = !!q.has_code;

    if (q.table_data) {
      q.table_data = normalizeTableRows(q.table_data);
      q.has_table = true;
      // Ensure type aligns with table questions
      if (!q.question_type || q.question_type === 'unknown') {
        q.question_type = 'fill_table';
      }
    } else {
      q.has_table = !!q.has_table;
    }
  });
};

// Distribute points automatically to questions with 0 points
const distributePoints = (parsedExam: ParsedExam) => {
  for (const section of parsedExam.sections || []) {
    const questions = section.questions || [];
    const sectionPoints = section.total_points || 0;
    
    // 1. Calculate main questions without points
    const mainQuestionsWithZero = questions.filter(q => !q.points || q.points === 0);
    const assignedMainPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);
    
    // 2. Distribute remaining points to main questions equally
    if (mainQuestionsWithZero.length > 0) {
      const remaining = sectionPoints - assignedMainPoints;
      if (remaining > 0) {
        const perQuestion = Math.floor(remaining / mainQuestionsWithZero.length);
        mainQuestionsWithZero.forEach(q => { q.points = perQuestion; });
      }
    }
    
    // 3. Handle sub-questions - distribute parent points to children
    for (const q of questions) {
      if (q.sub_questions && q.sub_questions.length > 0) {
        const parentPoints = q.points || 0;
        const subWithZero = q.sub_questions.filter(s => !s.points || s.points === 0);
        const assignedSubPoints = q.sub_questions.reduce((sum, s) => sum + (s.points || 0), 0);
        
        if (subWithZero.length > 0) {
          const remainingSub = parentPoints - assignedSubPoints;
          if (remainingSub > 0) {
            const perSub = Math.floor(remainingSub / subWithZero.length);
            subWithZero.forEach(s => { s.points = perSub; });
          }
        }
        
        // Handle deeper nested sub_questions
        for (const sub of q.sub_questions) {
          if (sub.sub_questions && sub.sub_questions.length > 0) {
            const subParentPoints = sub.points || 0;
            const deepWithZero = sub.sub_questions.filter(d => !d.points || d.points === 0);
            const assignedDeep = sub.sub_questions.reduce((sum, d) => sum + (d.points || 0), 0);
            
            if (deepWithZero.length > 0) {
              const remainingDeep = subParentPoints - assignedDeep;
              if (remainingDeep > 0) {
                const perDeep = Math.floor(remainingDeep / deepWithZero.length);
                deepWithZero.forEach(d => { d.points = perDeep; });
              }
            }
          }
        }
      }
    }
  }
};

const tableHasCorrectAnswers = (tableData: any) => {
  return !!(tableData?.correct_answers && typeof tableData.correct_answers === 'object' && Object.keys(tableData.correct_answers).length > 0);
};

async function extractTableCorrectAnswersFromPdf(args: {
  apiKey: string;
  base64Content: string;
  questionNumber: string;
  questionText: string;
  tableData: any;
}): Promise<any | null> {
  const { apiKey, base64Content, questionNumber, questionText, tableData } = args;

  const toolName = 'extract_table_answers';
  const toolSchema = {
    type: 'function',
    function: {
      name: toolName,
      description: 'Extract explicit correct answers for table input cells from the PDF (no guessing).',
      parameters: {
        type: 'object',
        properties: {
          correct_answers: {
            type: 'object',
            description: 'Map of rowIndex -> colIndex -> answer, ONLY when explicitly present in the PDF',
            additionalProperties: true
          }
        },
        required: ['correct_answers']
      }
    }
  };

  const systemPrompt = `أنت مساعد متخصص في استخراج إجابات من PDF.

ممنوع التخمين.
- استخرج الإجابة فقط إذا كانت مكتوبة صراحة داخل ملف الـ PDF (صفحة حلول/نموذج إجابة/سلم تصحيح/مكتوبة بجانب الجدول).
- إذا لم تجد إجابة صريحة: اترك correct_answers فارغة أو بدون مفاتيح لتلك الخانة.

المطلوب: إعطاء correct_answers فقط لخلايا الإدخال في الجدول الخاص بالسؤال.`;

  const userContent = [
    {
      type: 'text',
      text: `ابحث في ملف الـ PDF عن إجابات صريحة لسؤال رقم ${questionNumber} (جدول).

نص السؤال:\n${questionText}\n
بيانات الجدول الحالية (للمساعدة على تحديد الخلايا):\n${JSON.stringify(tableData)}\n
أعد فقط correct_answers بخريطة {rowIndex: {colIndex: "answer"}}.`
    },
    {
      type: 'image_url',
      image_url: {
        url: `data:application/pdf;base64,${base64Content}`
      }
    }
  ];

  // Accuracy-first: try strongest model only to avoid inconsistent merging
  const result = await callAIWithModel(
    'google/gemini-2.5-pro',
    apiKey,
    systemPrompt,
    userContent,
    toolSchema,
    toolName,
    120000
  );

  if (!result.success || !result.toolArgs) return null;
  const extracted = result.toolArgs;
  if (!extracted?.correct_answers || typeof extracted.correct_answers !== 'object') return null;
  return extracted.correct_answers;
}

// Update job status helper
async function updateJobStatus(
  supabase: any, 
  jobId: string, 
  status: string, 
  progress: number, 
  currentStep: string,
  result?: any,
  errorMessage?: string
) {
  const updateData: any = { 
    status, 
    progress, 
    current_step: currentStep,
    updated_at: new Date().toISOString()
  };
  
  if (result) updateData.result = result;
  if (errorMessage) updateData.error_message = errorMessage;
  
  await supabase
    .from('bagrut_parsing_jobs')
    .update(updateData)
    .eq('id', jobId);
}

// Main background processing function
async function processJobInBackground(
  jobId: string, 
  fileData: { base64Content: string; fileName: string; fileType: string },
  supabase: any,
  apiKey: string
) {
  try {
    console.log(`[Job ${jobId}] Starting background processing...`);
    
    await updateJobStatus(supabase, jobId, 'processing', 10, 'جاري قراءة ملف PDF...');

    const { base64Content, fileType } = fileData;

    // Only PDF is supported
    if (fileType !== 'pdf') {
      await updateJobStatus(supabase, jobId, 'failed', 0, '', null, 
        'حالياً يُدعم فقط ملفات PDF. الرجاء تحويل ملف Word إلى PDF ثم إعادة الرفع.');
      return;
    }

    await updateJobStatus(supabase, jobId, 'processing', 20, 'جاري التعرف على هيكل الامتحان...');

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

    // Enhanced system prompt with answer extraction support (ONLY when explicitly present in the PDF)
    const systemPrompt = `أنت محلل متخصص في امتحانات البجروت. حلل الامتحان واستخرج:

1. معلومات الامتحان: العنوان، السنة، الموسم (summer/winter/spring)، المادة، المدة بالدقائق، مجموع العلامات
2. الأقسام: رقم القسم، العنوان، النوع (mandatory/elective)، التخصص إن وجد
3. الأسئلة: الرقم، النص، النوع، العلامات، الخيارات

**قواعد استخراج العلامات (مهم جداً - لا تترك علامات السؤال = 0):**
1. ابحث عن توزيع العلامات في الملف - عادة يكون مذكوراً في:
   - بداية كل قسم (مثل: "60 علامة" أو "40 علامة")
   - بجانب كل سؤال رئيسي (مثل: "سؤال 1 (20 علامات)")
   - في جدول توزيع العلامات
   - بين قوسين بجانب رقم السؤال

2. إذا كانت العلامات مذكورة للقسم فقط وليس للأسئلة الفردية:
   - قسّم علامات القسم بالتساوي على الأسئلة الرئيسية
   - مثال: قسم 60 علامة فيه 3 أسئلة = 20 علامة لكل سؤال

3. للأسئلة الفرعية:
   - العلامات الفرعية يجب أن تجمع = علامات السؤال الأم
   - إذا لم تكن محددة، وزعها بالتساوي

4. تأكد أن مجموع علامات جميع الأسئلة = total_points للامتحان

5. **للقسم الاختياري (التخصص):**
   - كل تخصص يُعامل كقسم منفصل (section_type = 'elective')
   - ضع اسم التخصص في specialization ووصفه في specialization_label
   - علامات التخصص توزع على أسئلته فقط

**قواعد استخراج الإجابات (مهم جداً):**
- لا تخمّن الإجابات ولا تستنتجها من معرفتك.
- استخرج الإجابة فقط إذا كانت موجودة صراحة داخل ملف الـ PDF (مثلاً: "الإجابة:" / "الحل:" / "نموذج الإجابة" / "سلم التصحيح" / أو مكتوبة مباشرة تحت السؤال أو داخل جدول الإجابات).
- إذا لم تكن الإجابة موجودة أو غير واضحة: اتركها فارغة.
- الهدف: تمكين السوبر آدمن من رؤية الإجابات الموجودة في الملف قبل نشر الامتحان، وتمكين المعلم لاحقاً من التصحيح.

**قواعد صارمة جداً لاستخراج الجداول التفاعلية:**

هذا امتحان، لكن قد يحتوي أحياناً على صفحة/قسم إجابات أو حلول.
إذا كان الملف يحتوي على إجابات صريحة: استخرجها وخزنها في الحقول المناسبة (بدون أي تخمين).

1. **جداول التحويل بين الأنظمة العددية (ثنائي/عشري/هيكساديسيمالي):**
   - عادة عمود واحد فقط يحتوي على المعطيات (القيمة المعطاة)
   - جميع الأعمدة الأخرى يجب أن تكون "?" لأنها المطلوب من الطالب
   - مثال: إذا كان السؤال "حول من العشري إلى الثنائي والهيكساديسيمالي"
     - المعطى: 205 في العمود العشري
     - المطلوب: "?" في عمود الثنائي و "?" في عمود الهيكساديسيمالي
   - استخدم input_columns لتحديد أرقام الأعمدة التي هي خانات إدخال (0-based)
   - **إذا كان هناك نموذج إجابة داخل نفس الملف:** لا تملأ rows بالإجابات، بل ضعها داخل table_data.correct_answers

2. **جداول الإكمال العامة:**
   - إذا كان السؤال يطلب "أكمل" أو "احسب" أو "حول" = الخلايا المقابلة للمطلوب تكون "?"
   - إذا كان هناك صف واحد يحتوي على قيم والباقي فارغ = الخلايا الفارغة تكون "?"
   - إذا رأيت في الجدول خلايا فارغة أو تحتوي على "..." = تصبح "?"

3. **في حالة الشك:** اجعل الخلية "?" - من الأفضل أن يكتب الطالب بدلاً من إعطائه الإجابة

4. **مخزن الكلمات (word_bank):**
   - إذا كان هناك قائمة كلمات أو خيارات مساعدة للطالب، ضعها في word_bank

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
                              description: 'صفوف الجدول - كل صف هو مصفوفة من القيم، الخلايا الفارغة أو المطلوبة من الطالب تكون ?'
                            },
                            input_columns: {
                              type: 'array',
                              items: { type: 'number' },
                              description: 'أرقام الأعمدة (0-based) التي يجب أن تكون خانات إدخال للطالب'
                            },
                            correct_answers: {
                              type: 'object',
                              description: 'الإجابات الصحيحة (إن كانت موجودة صراحة في الملف) لكل خلية إدخال: { rowIndex: { colIndex: "answer" } }',
                              additionalProperties: true
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
                        blanks: {
                          type: 'array',
                          description: 'تعريف الفراغات لأسئلة fill_blank إن وُجدت إجابات صريحة في الملف',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              placeholder: { type: 'string' },
                              correct_answer: { type: 'string' }
                            },
                            required: ['id', 'correct_answer']
                          }
                        },
                        correct_answer_data: {
                          type: 'object',
                          description: 'إجابات منظمة لأنواع الأسئلة المركبة (matching/ordering/...) عند وجودها صراحة في الملف',
                          additionalProperties: true
                        },
                        sub_questions: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              question_number: { type: 'string' },
                              question_text: { type: 'string' },
                              question_type: { type: 'string' },
                              points: { type: 'number' },
                              correct_answer: { type: 'string' },
                              answer_explanation: { type: 'string' },
                              blanks: {
                                type: 'array',
                                items: {
                                  type: 'object',
                                  properties: {
                                    id: { type: 'string' },
                                    placeholder: { type: 'string' },
                                    correct_answer: { type: 'string' }
                                  },
                                  required: ['id', 'correct_answer']
                                }
                              },
                              correct_answer_data: {
                                type: 'object',
                                additionalProperties: true
                              },
                              table_data: {
                                type: 'object',
                                additionalProperties: true
                              },
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
                              }
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

    await updateJobStatus(supabase, jobId, 'processing', 30, 'تم اكتشاف الأقسام، جاري تحليلها...');

    // Try each model until one succeeds
    let lastError = '';
    let parsedExam: ParsedExam | null = null;
    let modelIndex = 0;
    
    for (const model of AI_MODELS) {
      modelIndex++;
      const progressStep = 30 + (modelIndex * 15);
      await updateJobStatus(supabase, jobId, 'processing', Math.min(progressStep, 60), `جاري التحليل باستخدام ${model}...`);
      
      console.log(`[Job ${jobId}] Attempting with ${model}`);
      
       const result = await callAIWithModel(
         model,
         apiKey,
         systemPrompt,
         userContent,
         toolSchema,
         'parse_bagrut_exam',
         180000 // 3 minutes timeout
       );
      
      if (result.success && result.parsedExam) {
        parsedExam = result.parsedExam;
        console.log(`[Job ${jobId}] Success with ${model}!`);
        break;
      }
      
      lastError = result.error || 'Unknown error';
      console.log(`[Job ${jobId}] Model ${model} failed: ${lastError}`);
      
      // Don't continue if rate limited or credits exhausted
      if (result.error === 'rate_limit') {
        await updateJobStatus(supabase, jobId, 'failed', 0, '', null, 'تم تجاوز حد الطلبات. الرجاء المحاولة لاحقاً.');
        return;
      }
      if (result.error === 'credits_exhausted') {
        await updateJobStatus(supabase, jobId, 'failed', 0, '', null, 'نفدت رصيد AI. الرجاء إضافة رصيد.');
        return;
      }
    }
    
    if (!parsedExam) {
      console.error(`[Job ${jobId}] All models failed. Last error:`, lastError);
      await updateJobStatus(supabase, jobId, 'failed', 0, '', null, 
        'فشل في تحليل الامتحان بعد عدة محاولات. الرجاء المحاولة مرة أخرى أو استخدام ملف أصغر.');
      return;
    }
    
    // Normalize exam structure to avoid UI/DB regressions (e.g., missing has_table)
    await updateJobStatus(supabase, jobId, 'processing', 65, 'جاري تحسين استخراج الجداول...');
    try {
      normalizeExamForReliability(parsedExam);
    } catch (e) {
      console.error(`[Job ${jobId}] normalizeExamForReliability failed (non-fatal):`, e);
    }

    // Distribute points automatically to questions with 0 points
    await updateJobStatus(supabase, jobId, 'processing', 67, 'جاري توزيع العلامات...');
    try {
      distributePoints(parsedExam);
      console.log(`[Job ${jobId}] Points distribution completed`);
    } catch (e) {
      console.error(`[Job ${jobId}] distributePoints failed (non-fatal):`, e);
    }

    // Accuracy-first: attempt to extract explicit correct answers for table input cells (when present in the PDF)
    try {
      const candidates: Array<any> = [];
      visitQuestions(parsedExam, (q) => {
        if (!q?.table_data) return;
        const isTable = q.question_type === 'fill_table' || q.has_table;
        if (!isTable) return;
        if (tableHasCorrectAnswers(q.table_data)) return;
        candidates.push(q);
      });

      // Avoid long runtimes
      const MAX_TABLES_TO_ENRICH = 6;
      const tablesToEnrich = candidates.slice(0, MAX_TABLES_TO_ENRICH);

      for (const q of tablesToEnrich) {
        const correctAnswers = await extractTableCorrectAnswersFromPdf({
          apiKey,
          base64Content,
          questionNumber: q.question_number,
          questionText: q.question_text,
          tableData: q.table_data
        });

        if (correctAnswers && Object.keys(correctAnswers).length > 0) {
          q.table_data = {
            ...(q.table_data || {}),
            correct_answers: correctAnswers
          };
        }
      }
    } catch (e) {
      console.error(`[Job ${jobId}] table correct_answers enrichment failed (non-fatal):`, e);
    }

    await updateJobStatus(supabase, jobId, 'processing', 70, 'جاري معالجة الصور...');
    
    // Generate images for questions that need them
    try {
      await processQuestionsImages(parsedExam, apiKey, supabase);
    } catch (imgError) {
      console.error(`[Job ${jobId}] Image processing error (non-fatal):`, imgError);
      // Continue even if image generation fails - images can be added manually
    }
    
    await updateJobStatus(supabase, jobId, 'processing', 90, 'جاري حساب الإحصائيات...');
    
    // Calculate statistics
    let totalQuestions = 0;
    let questionsByType: Record<string, number> = {};

    // Answers report (which questions have explicit answers in the PDF)
    const unansweredList: Array<{ question_number: string; question_type: string; reason: string }> = [];
    let answeredCount = 0;

    const hasExplicitAnswer = (q: any): boolean => {
      if (!q) return false;

      // MCQ: any choice marked correct OR correct_answer provided
      if (Array.isArray(q.choices) && q.choices.some((c: any) => c?.is_correct)) return true;
      if (typeof q.correct_answer === 'string' && q.correct_answer.trim()) return true;

      // fill_blank: blanks with correct_answer
      if (Array.isArray(q.blanks) && q.blanks.some((b: any) => typeof b?.correct_answer === 'string' && b.correct_answer.trim())) {
        return true;
      }

      // fill_table: table_data.correct_answers
      if (q.table_data?.correct_answers && Object.keys(q.table_data.correct_answers).length > 0) return true;

      // generic structured
      if (q.correct_answer_data && Object.keys(q.correct_answer_data).length > 0) return true;

      return false;
    };

    const collectAnswerReport = (q: any) => {
      if (hasExplicitAnswer(q)) {
        answeredCount++;
      } else {
        // Only report for question types that typically have a correct answer
        const type = q?.question_type || 'unknown';
        const shouldHaveAnswer = [
          'multiple_choice',
          'true_false',
          'true_false_multi',
          'fill_blank',
          'fill_table',
          'matching',
          'ordering',
          'calculation',
          'open_ended',
          'cli_command',
          'diagram_based'
        ].includes(type);

        if (shouldHaveAnswer) {
          unansweredList.push({
            question_number: q?.question_number || '',
            question_type: type,
            reason: 'no_explicit_answer_detected'
          });
        }
      }
    };
    
    for (const section of parsedExam.sections || []) {
      for (const question of section.questions || []) {
        totalQuestions++;
        questionsByType[question.question_type] = (questionsByType[question.question_type] || 0) + 1;

        collectAnswerReport(question);
        
        if (question.sub_questions) {
          totalQuestions += question.sub_questions.length;
          for (const sub of question.sub_questions) {
            questionsByType[sub.question_type] = (questionsByType[sub.question_type] || 0) + 1;
            collectAnswerReport(sub);
          }
        }
      }
    }

    console.log(`[Job ${jobId}] Calculated statistics:`, { totalSections: parsedExam.sections?.length, totalQuestions });
    
    // Calculate points report for validation
    // Helper to round points to avoid floating-point issues
    const roundPoints = (points: number | undefined): number => {
      if (!points) return 0;
      return Math.round(points);
    };

    // Helper to count questions in a section (including sub-questions)
    const countSectionQuestions = (section: ParsedSection): number => {
      let count = 0;
      for (const q of section.questions || []) {
        if (q.sub_questions?.length) {
          count += q.sub_questions.length;
        } else {
          count += 1;
        }
      }
      return count;
    };

    // Helper to calculate section points from leaf questions only (rounded)
    const calculateSectionPoints = (section: ParsedSection): number => {
      let sectionTotal = 0;
      for (const q of section.questions || []) {
        if (q.sub_questions?.length) {
          for (const sub of q.sub_questions) {
            sectionTotal += roundPoints(sub.points);
          }
        } else {
          sectionTotal += roundPoints(q.points);
        }
      }
      return roundPoints(sectionTotal);
    };

    // Calculate actual points considering that student picks ONE elective section only
    const calculateActualPointsWithBreakdown = (): { 
      total: number; 
      mandatoryTotal: number;
      electiveSections: Array<{ name: string; points: number; specialization?: string; questionCount: number }>;
      selectedElective: number;
      mandatoryQuestionCount: number;
    } => {
      let mandatoryTotal = 0;
      let mandatoryQuestionCount = 0;
      const electiveSections: Array<{ name: string; points: number; specialization?: string; questionCount: number }> = [];
      
      for (const section of parsedExam.sections || []) {
        const sectionPoints = calculateSectionPoints(section);
        const questionCount = countSectionQuestions(section);
        
        if (section.section_type === 'mandatory') {
          mandatoryTotal += sectionPoints;
          mandatoryQuestionCount += questionCount;
        } else if (section.section_type === 'elective') {
          electiveSections.push({
            name: section.specialization_label || section.specialization || section.section_title,
            points: roundPoints(sectionPoints),
            specialization: section.specialization,
            questionCount
          });
        }
      }
      
      // Round mandatory total
      mandatoryTotal = roundPoints(mandatoryTotal);
      
      // Student picks ONE elective section - use the highest for validation
      // (All elective sections should ideally have equal points)
      const selectedElective = electiveSections.length > 0 
        ? Math.max(...electiveSections.map(e => e.points))
        : 0;
      
      return {
        total: roundPoints(mandatoryTotal + selectedElective),
        mandatoryTotal,
        electiveSections,
        selectedElective: roundPoints(selectedElective),
        mandatoryQuestionCount
      };
    };

    const declaredPoints = parsedExam.total_points || 100;
    const pointsBreakdown = calculateActualPointsWithBreakdown();
    const actualPoints = pointsBreakdown.total;
    const pointsDifference = declaredPoints - actualPoints;

    // Find questions with zero points
    const questionsWithZeroPoints: Array<{ section: string; question: string }> = [];
    for (const section of parsedExam.sections || []) {
      for (const q of section.questions || []) {
        if (!q.sub_questions?.length && (!q.points || q.points === 0)) {
          questionsWithZeroPoints.push({
            section: section.section_title,
            question: q.question_number
          });
        }
        if (q.sub_questions) {
          for (const sub of q.sub_questions) {
            if (!sub.points || sub.points === 0) {
              questionsWithZeroPoints.push({
                section: section.section_title,
                question: sub.question_number
              });
            }
          }
        }
      }
    }

    // Build points issues list
    const pointsIssues: Array<{
      type: 'missing_points' | 'excess_points' | 'zero_points_question';
      description: string;
      section?: string;
      question?: string;
      suggestedFix?: string;
    }> = [];

    if (pointsDifference > 0) {
      pointsIssues.push({
        type: 'missing_points',
        description: `يوجد نقص ${pointsDifference} علامة`,
        suggestedFix: `قد يكون هناك سؤال لم يتم التعرف عليه أو علاماته ناقصة`
      });
    }

    if (pointsDifference < 0) {
      pointsIssues.push({
        type: 'excess_points',
        description: `المجموع يتجاوز ${declaredPoints} بـ ${Math.abs(pointsDifference)} علامة`,
        suggestedFix: `راجع توزيع العلامات على الأسئلة`
      });
    }

    for (const zq of questionsWithZeroPoints) {
      pointsIssues.push({
        type: 'zero_points_question',
        section: zq.section,
        question: zq.question,
        description: `السؤال ${zq.question} بدون علامات`
      });
    }

    const pointsReport = {
      declaredTotal: roundPoints(declaredPoints),
      actualTotal: roundPoints(actualPoints),
      difference: roundPoints(pointsDifference),
      isValid: Math.abs(pointsDifference) <= 2 && questionsWithZeroPoints.length === 0, // Allow ±2 tolerance for rounding
      breakdown: {
        mandatory: pointsBreakdown.mandatoryTotal,
        electiveSections: pointsBreakdown.electiveSections,
        selectedElective: pointsBreakdown.selectedElective,
        questionCounts: {
          mandatory: pointsBreakdown.mandatoryQuestionCount,
          elective: pointsBreakdown.electiveSections.map(e => ({
            name: e.name,
            count: e.questionCount
          }))
        }
      },
      issues: pointsIssues
    };

    console.log(`[Job ${jobId}] Points validation:`, { declaredPoints, actualPoints, difference: pointsDifference, zeroPointsQuestions: questionsWithZeroPoints.length });

    const resultData = {
      parsedExam,
      statistics: {
        totalSections: parsedExam.sections?.length || 0,
        totalQuestions,
        questionsByType,
        totalPoints: parsedExam.total_points
      },
      answersReport: {
        totalQuestions,
        answeredCount,
        unansweredCount: unansweredList.length,
        unansweredList
      },
      pointsReport
    };
    
    await updateJobStatus(supabase, jobId, 'completed', 100, 'تم التحليل بنجاح!', resultData);
    console.log(`[Job ${jobId}] Processing completed successfully`);

  } catch (error) {
    console.error(`[Job ${jobId}] Error:`, error);
    await updateJobStatus(supabase, jobId, 'failed', 0, '', null, 
      error instanceof Error ? error.message : 'حدث خطأ غير متوقع');
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

    // Create a job record
    const { data: jobData, error: jobError } = await supabase
      .from('bagrut_parsing_jobs')
      .insert({
        user_id: user.id,
        file_name: file.name,
        status: 'pending',
        progress: 0,
        current_step: 'جاري بدء المعالجة...'
      })
      .select()
      .single();

    if (jobError || !jobData) {
      console.error('Failed to create job:', jobError);
      return new Response(JSON.stringify({ error: 'فشل في إنشاء مهمة المعالجة' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Created job: ${jobData.id}`);

    // Return immediately with job ID
    const response = new Response(
      JSON.stringify({ 
        success: true, 
        jobId: jobData.id,
        message: 'تم بدء معالجة الملف. يمكنك متابعة التقدم.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

    // Start background processing using EdgeRuntime.waitUntil
    // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(
        processJobInBackground(
          jobData.id,
          { base64Content, fileName: file.name, fileType },
          supabase,
          LOVABLE_API_KEY
        )
      );
    } else {
      // Fallback: process inline (for local testing)
      processJobInBackground(
        jobData.id,
        { base64Content, fileName: file.name, fileType },
        supabase,
        LOVABLE_API_KEY
      );
    }

    return response;

  } catch (error) {
    console.error('Error starting job:', error);
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
