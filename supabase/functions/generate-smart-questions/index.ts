import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Define optimal batch size for AI requests
const BATCH_SIZE = 10;

// Helper function to generate a single batch of questions
async function generateBatch(
  count: number,
  difficulty: { easy: number; medium: number; hard: number },
  lessonContent: string,
  gradeLevel: string,
  sectionName: string,
  topicName: string,
  questionTypes: string[],
  existingQuestionsText: string,
  previousQuestions: any[],
  batchNum: number,
  totalBatches: number,
  LOVABLE_API_KEY: string
): Promise<any[]> {
  
  // Build previous questions text to avoid duplicates within generation
  const previousQuestionsText = previousQuestions.length > 0
    ? `\n\n⚠️ الأسئلة المولّدة سابقاً (تجنب تكرارها):\n${previousQuestions.map((q, i) => `${i + 1}. ${q.question_text}`).join('\n')}`
    : '';

  const systemPrompt = `أنت خبير في تصميم أسئلة الامتحانات التعليمية للمناهج العربية.
مهمتك: توليد أسئلة عالية الجودة بناءً على محتوى الدرس المقدم.

⚠️ قاعدة أساسية حاسمة: يجب توليد العدد المطلوب بالضبط من الأسئلة - لا أكثر ولا أقل.
هذه الدفعة ${batchNum} من ${totalBatches} - يجب توليد ${count} سؤال بالضبط.

المتطلبات:
- اجعل الأسئلة واضحة ومباشرة ومرتبطة بالمحتوى
- تأكد من أن كل سؤال له إجابة صحيحة واحدة فقط
- اجعل الخيارات الخاطئة معقولة لكن خاطئة بوضوح
- قدم تفسيرات مختصرة وواضحة (1-2 جملة)
- استخدم اللغة العربية الفصحى الواضحة
- التزم بالعدد المطلوب بدقة تامة`;

  const userPrompt = `الصف: ${gradeLevel}
القسم: ${sectionName}
الموضوع: ${topicName}

محتوى الدرس:
${lessonContent.substring(0, 8000)}
${existingQuestionsText}
${previousQuestionsText}

⚠️ مهم جداً: يجب توليد بالضبط ${count} سؤال (لا أكثر ولا أقل).
هذه الدفعة ${batchNum} من ${totalBatches}

توليد ${count} سؤال بالتوزيع التالي:
- سهل: ${difficulty.easy} سؤال
- متوسط: ${difficulty.medium} سؤال
- صعب: ${difficulty.hard} سؤال

المجموع الكلي يجب أن يكون = ${count} سؤال بالضبط

أنواع الأسئلة المطلوبة: ${questionTypes.join('، ')}

تأكد من:
1. التنوع في المواضيع المغطاة
2. دقة الإجابات الصحيحة
3. وضوح الصياغة
4. ملاءمة مستوى الصعوبة للطلاب
5. توليد العدد المطلوب بالضبط (${count} سؤال)`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'generate_questions',
            description: 'Generate structured exam questions',
            parameters: {
              type: 'object',
              properties: {
                questions: {
                  type: 'array',
                  description: `يجب أن تحتوي على ${count} سؤال بالضبط`,
                  items: {
                    type: 'object',
                    properties: {
                      question_text: { type: 'string', description: 'نص السؤال' },
                      question_type: { 
                        type: 'string', 
                        enum: ['multiple_choice', 'true_false'],
                        description: 'نوع السؤال'
                      },
                      difficulty_level: { 
                        type: 'string', 
                        enum: ['easy', 'medium', 'hard'],
                        description: 'مستوى الصعوبة'
                      },
                      choices: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            text: { type: 'string', description: 'نص الخيار' }
                          },
                          required: ['text']
                        },
                        description: 'قائمة الخيارات'
                      },
                      correct_answer_text: { type: 'string', description: 'نص الإجابة الصحيحة' },
                      explanation: { type: 'string', description: 'تفسير الإجابة' }
                    },
                    required: ['question_text', 'question_type', 'difficulty_level', 'choices', 'correct_answer_text', 'explanation']
                  }
                }
              },
              required: ['questions']
            }
          }
        }
      ],
      tool_choice: { type: 'function', function: { name: 'generate_questions' } }
    })
  });

  if (!response.ok) {
    throw new Error(`AI Gateway error for batch ${batchNum}: ${response.status}`);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall || toolCall.function.name !== 'generate_questions') {
    throw new Error(`No valid tool call in batch ${batchNum}`);
  }

  const questionsData = JSON.parse(toolCall.function.arguments);
  return questionsData.questions || [];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      gradeLevel, 
      sectionName, 
      topicName, 
      lessonId,
      lessonContent,
      questionCount, 
      difficultyDistribution,
      questionTypes 
    } = await req.json();

    console.log('🚀 Generating questions for:', { gradeLevel, sectionName, topicName, lessonId, questionCount });

    // Create Supabase client for fetching existing questions
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch existing questions to avoid duplicates
    console.log('🔍 Fetching existing questions to avoid duplicates...');
    const { data: existingQuestions } = await supabase
      .from('question_bank')
      .select('question_text')
      .eq('grade_level', gradeLevel)
      .eq('section_name', sectionName)
      .eq('is_active', true)
      .limit(100);

    console.log(`📚 Found ${existingQuestions?.length || 0} existing questions in the bank`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Prepare existing questions text for AI prompt
    const existingQuestionsText = existingQuestions && existingQuestions.length > 0
      ? `

⚠️ تجنب توليد أسئلة مشابهة لهذه الأسئلة الموجودة في بنك الأسئلة:
${existingQuestions.map((q, i) => `${i + 1}. ${q.question_text}`).join('\n')}

يجب أن تكون الأسئلة الجديدة مختلفة تماماً في الفكرة والصياغة.`
      : '';

    // ============= BATCHING SYSTEM =============
    // If questionCount > BATCH_SIZE, split into batches
    let questions: any[] = [];
    
    if (questionCount > BATCH_SIZE) {
      const totalBatches = Math.ceil(questionCount / BATCH_SIZE);
      console.log(`📦 Using batching system: ${questionCount} questions → ${totalBatches} batches of ~${BATCH_SIZE} questions`);
      
      for (let i = 0; i < totalBatches; i++) {
        const questionsInBatch = Math.min(BATCH_SIZE, questionCount - questions.length);
        
        // Calculate proportional difficulty distribution for this batch
        const batchDifficulty = {
          easy: Math.round((difficultyDistribution.easy / questionCount) * questionsInBatch),
          medium: Math.round((difficultyDistribution.medium / questionCount) * questionsInBatch),
          hard: 0
        };
        batchDifficulty.hard = questionsInBatch - batchDifficulty.easy - batchDifficulty.medium;
        
        console.log(`🔄 Batch ${i + 1}/${totalBatches}: requesting ${questionsInBatch} questions`, batchDifficulty);
        
        try {
          const batchQuestions = await generateBatch(
            questionsInBatch,
            batchDifficulty,
            lessonContent,
            gradeLevel,
            sectionName,
            topicName,
            questionTypes,
            existingQuestionsText,
            questions, // Pass previously generated questions
            i + 1,
            totalBatches,
            LOVABLE_API_KEY
          );
          
          console.log(`✅ Batch ${i + 1}/${totalBatches}: got ${batchQuestions.length} questions`);
          questions = [...questions, ...batchQuestions];
          
          // Delay between batches to avoid rate limiting (except for last batch)
          if (i < totalBatches - 1) {
            console.log('⏳ Waiting 500ms before next batch...');
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error(`❌ Batch ${i + 1}/${totalBatches} failed:`, error);
          // Continue with other batches instead of failing completely
        }
      }
      
      console.log(`✅ Batching complete: generated ${questions.length}/${questionCount} questions`);
    } else {
      // Single request for small counts (≤ BATCH_SIZE)
      console.log(`📝 Single request: ${questionCount} questions (no batching needed)`);
      
      try {
        questions = await generateBatch(
          questionCount,
          difficultyDistribution,
          lessonContent,
          gradeLevel,
          sectionName,
          topicName,
          questionTypes,
          existingQuestionsText,
          [],
          1,
          1,
          LOVABLE_API_KEY
        );
        
        console.log(`✅ Generated ${questions.length}/${questionCount} questions`);
      } catch (error) {
        console.error('❌ Generation failed:', error);
        
        // Handle specific errors
        if (error instanceof Error && error.message.includes('429')) {
          return new Response(
            JSON.stringify({ 
              error: 'rate_limit_exceeded',
              message: 'تم تجاوز حد الطلبات. يرجى الانتظار قليلاً والمحاولة مرة أخرى.' 
            }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        if (error instanceof Error && error.message.includes('402')) {
          return new Response(
            JSON.stringify({ 
              error: 'payment_required',
              message: 'نفد رصيد Lovable AI. يرجى إضافة رصيد من الإعدادات.',
              settingsUrl: 'https://lovable.dev/settings'
            }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        throw error;
      }
    }

    console.log(`📊 Final count: ${questions.length}/${questionCount} questions`);

    // Process questions: add IDs to choices and map correct_answer
    const processedQuestions = questions.map((q: any) => {
      const choicesWithIds = q.choices.map((choice: any, idx: number) => ({
        id: `choice_${idx + 1}`,
        text: choice.text
      }));

      // Find correct answer ID by matching text
      const correctChoice = choicesWithIds.find((c: any) => 
        c.text.trim().toLowerCase() === q.correct_answer_text.trim().toLowerCase()
      );

      return {
        question_text: q.question_text,
        question_type: q.question_type,
        difficulty_level: q.difficulty_level,
        choices: choicesWithIds,
        correct_answer: correctChoice?.id || choicesWithIds[0].id, // Fallback to first choice
        explanation: q.explanation,
        section_name: sectionName,
        topic_name: topicName,
        grade_level: gradeLevel,
        points: 1
      };
    });

    console.log('Generated questions:', processedQuestions.length);

    return new Response(
      JSON.stringify({ questions: processedQuestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-smart-questions:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
