import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

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

    console.log('Generating questions for:', { gradeLevel, sectionName, topicName, lessonId, questionCount });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build system prompt with strict count enforcement
    const systemPrompt = `أنت خبير في تصميم أسئلة الامتحانات التعليمية للمناهج العربية.
مهمتك: توليد أسئلة عالية الجودة بناءً على محتوى الدرس المقدم.

⚠️ قاعدة أساسية حاسمة: يجب توليد العدد المطلوب بالضبط من الأسئلة - لا أكثر ولا أقل.
إذا طُلب منك 9 أسئلة، يجب أن تولد 9 أسئلة بالضبط. إذا طُلب 15، يجب 15 بالضبط.

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

⚠️ مهم جداً: يجب توليد بالضبط ${questionCount} سؤال (لا أكثر ولا أقل).

توليد ${questionCount} سؤال بالتوزيع التالي:
- سهل: ${difficultyDistribution.easy} سؤال
- متوسط: ${difficultyDistribution.medium} سؤال
- صعب: ${difficultyDistribution.hard} سؤال

المجموع الكلي يجب أن يكون = ${questionCount} سؤال بالضبط

أنواع الأسئلة المطلوبة: ${questionTypes.join('، ')}

تأكد من:
1. التنوع في المواضيع المغطاة
2. دقة الإجابات الصحيحة
3. وضوح الصياغة
4. ملاءمة مستوى الصعوبة للطلاب
5. توليد العدد المطلوب بالضبط (${questionCount} سؤال)`;

    // Call Lovable AI Gateway with Tool Calling
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
                    minItems: questionCount,
                    maxItems: questionCount,
                    description: `يجب أن تحتوي على ${questionCount} سؤال بالضبط`,
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
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'rate_limit_exceeded',
            message: 'تم تجاوز حد الطلبات. يرجى الانتظار قليلاً والمحاولة مرة أخرى.' 
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: 'payment_required',
            message: 'نفد رصيد Lovable AI. يرجى إضافة رصيد من الإعدادات.',
            settingsUrl: 'https://lovable.dev/settings'
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI Response:', JSON.stringify(data, null, 2));

    // Extract questions from tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'generate_questions') {
      throw new Error('No valid tool call in response');
    }

    const questionsData = JSON.parse(toolCall.function.arguments);
    let questions = questionsData.questions || [];

    console.log(`Initial generation: requested ${questionCount}, got ${questions.length}`);

    // Auto-Retry mechanism: if count is less than 80% of requested
    if (questions.length < questionCount * 0.8) {
      console.log(`⚠️ Insufficient questions (${questions.length}/${questionCount}). Attempting retry...`);
      
      const remainingCount = questionCount - questions.length;
      const retryPrompt = `⚠️ تحذير: لم يتم توليد العدد الكافي من الأسئلة.
المطلوب: ${questionCount} سؤال
المولّد حتى الآن: ${questions.length} سؤال
الناقص: ${remainingCount} سؤال

يجب توليد ${remainingCount} سؤال إضافي بنفس المعايير السابقة.

محتوى الدرس:
${lessonContent.substring(0, 8000)}

توزيع الصعوبة للأسئلة الإضافية (حسب التناسب):
- استخدم توزيع مشابه للمطلوب الأصلي
- نوّع في الأسئلة
- تأكد من جودة الأسئلة`;

      const retryResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: retryPrompt }
          ],
          tools: [
            {
              type: 'function',
              function: {
                name: 'generate_questions',
                description: 'Generate additional exam questions',
                parameters: {
                  type: 'object',
                  properties: {
                    questions: {
                      type: 'array',
                      minItems: remainingCount,
                      maxItems: remainingCount,
                      description: `يجب أن تحتوي على ${remainingCount} سؤال بالضبط`,
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

      if (retryResponse.ok) {
        const retryData = await retryResponse.json();
        const retryToolCall = retryData.choices?.[0]?.message?.tool_calls?.[0];
        if (retryToolCall && retryToolCall.function.name === 'generate_questions') {
          const retryQuestionsData = JSON.parse(retryToolCall.function.arguments);
          const additionalQuestions = retryQuestionsData.questions || [];
          console.log(`✅ Retry successful: got ${additionalQuestions.length} additional questions`);
          questions = [...questions, ...additionalQuestions];
        }
      } else {
        console.log('⚠️ Retry failed, continuing with initial questions');
      }
    }

    console.log(`Final count: ${questions.length}/${questionCount} questions`);

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
