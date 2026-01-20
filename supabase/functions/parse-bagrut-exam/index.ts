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

    // Build AI request based on file type
    // Gemini only supports PDF for file uploads, for DOCX we need to extract text
    let userContent: any[];
    
    if (fileType === 'pdf') {
      // PDF can be sent directly as image
      userContent = [
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
    } else {
      // For DOCX, we need to inform the user that only PDF is supported for now
      // Or try to extract basic text from the docx (simplified approach)
      // Since DOCX is a zip file containing XML, we can try basic extraction
      
      // For now, return an error asking for PDF with helpful converter links
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

    // Call AI to parse the exam
    const systemPrompt = `أنت محلل متخصص في امتحانات البجروت الإسرائيلية. مهمتك تحليل ملف امتحان واستخراج جميع المعلومات بدقة عالية.

قواعد التحليل:
1. استخرج معلومات الامتحان الأساسية (العنوان، السنة، الموسم، المادة، المدة، مجموع العلامات)
2. حدد أقسام الامتحان:
   - القسم الإلزامي: يجب على جميع الطلاب الإجابة عليه
   - القسم الاختياري: الطالب يختار حسب تخصصه (مثل: شبكات أو جرافيكس)
3. لكل سؤال استخرج:
   - رقم السؤال (مثل: 1، 2.أ، 23.ב)
   - نص السؤال كاملاً
   - نوع السؤال (multiple_choice, true_false, true_false_multi, fill_blank, fill_table, matching, ordering, calculation, diagram_based, cli_command, open_ended, multi_part)
   - عدد النقاط
   - الخيارات (إن وجدت) مع تحديد الإجابة الصحيحة
   - الإجابة الصحيحة والشرح (إن وجدا)
   - وجود صورة أو جدول أو كود
4. للأسئلة المركبة (متعددة البنود) اجعلها أسئلة فرعية
5. حدد المواضيع لكل سؤال (topic_tags)

ملاحظات مهمة:
- إذا كان السؤال يتضمن صورة، اذكر وصفها في image_description
- إذا كان السؤال يتضمن جدول، حوّله لـ JSON في table_data
- إذا كان السؤال يتضمن كود أو أوامر CLI، ضعها في code_content`;

    console.log('Sending request to AI Gateway...');
    
    // Use gemini-2.5-flash for faster processing of large documents
    // Add AbortController with 120 second timeout for AI request
    const aiController = new AbortController();
    const aiTimeout = setTimeout(() => aiController.abort(), 120000);
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: userContent
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'parse_bagrut_exam',
              description: 'Parse a Bagrut exam document and extract all questions, sections, and metadata',
              parameters: {
                type: 'object',
                properties: {
                  title: { type: 'string', description: 'Exam title' },
                  exam_year: { type: 'number', description: 'Year of the exam' },
                  exam_season: { type: 'string', enum: ['summer', 'winter', 'spring'] },
                  exam_code: { type: 'string', description: 'Official exam code if available' },
                  subject: { type: 'string', description: 'Subject name' },
                  duration_minutes: { type: 'number', description: 'Exam duration in minutes' },
                  total_points: { type: 'number', description: 'Total exam points' },
                  instructions: { type: 'string', description: 'General exam instructions' },
                  sections: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        section_number: { type: 'number' },
                        section_title: { type: 'string' },
                        section_type: { type: 'string', enum: ['mandatory', 'elective'] },
                        total_points: { type: 'number' },
                        specialization: { type: 'string', description: 'For elective sections: networking, graphics, etc.' },
                        specialization_label: { type: 'string', description: 'Display label for specialization' },
                        instructions: { type: 'string' },
                        questions: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              question_number: { type: 'string' },
                              question_text: { type: 'string' },
                              question_type: { 
                                type: 'string', 
                                enum: ['multiple_choice', 'true_false', 'true_false_multi', 'fill_blank', 'fill_table', 'matching', 'ordering', 'calculation', 'diagram_based', 'cli_command', 'open_ended', 'multi_part']
                              },
                              points: { type: 'number' },
                              has_image: { type: 'boolean' },
                              image_description: { type: 'string' },
                              has_table: { type: 'boolean' },
                              table_data: { type: 'object' },
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
                                  },
                                  required: ['id', 'text', 'is_correct']
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
                                    correct_answer: { type: 'string' },
                                    answer_explanation: { type: 'string' }
                                  },
                                  required: ['question_number', 'question_text', 'question_type', 'points']
                                }
                              },
                              topic_tags: { type: 'array', items: { type: 'string' } }
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
          }
        ],
        tool_choice: { type: 'function', function: { name: 'parse_bagrut_exam' } }
      }),
      signal: aiController.signal,
    });
    
    clearTimeout(aiTimeout);

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    console.log('AI Response received');

    // Extract the parsed exam from tool call
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'parse_bagrut_exam') {
      console.error('Unexpected tool call:', JSON.stringify(aiResult.choices?.[0]?.message));
      throw new Error('AI did not return expected tool call');
    }

    console.log('Parsing tool call arguments...');
    const parsedExam: ParsedExam = JSON.parse(toolCall.function.arguments);
    console.log('Parsed exam successfully, sections:', parsedExam.sections?.length);
    
    // Calculate statistics
    let totalQuestions = 0;
    let questionsByType: Record<string, number> = {};
    
    for (const section of parsedExam.sections) {
      for (const question of section.questions) {
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

    console.log('Calculated statistics:', { totalSections: parsedExam.sections.length, totalQuestions });
    
    const responseData = {
      success: true,
      parsedExam,
      statistics: {
        totalSections: parsedExam.sections.length,
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
    
    // Check if it's an abort error from AI timeout
    if (error instanceof Error && error.name === 'AbortError') {
      return new Response(JSON.stringify({ 
        error: 'انتهت مهلة معالجة الذكاء الاصطناعي. الملف قد يكون معقداً جداً، يرجى المحاولة مرة أخرى.' 
      }), {
        status: 504,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to parse exam' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
