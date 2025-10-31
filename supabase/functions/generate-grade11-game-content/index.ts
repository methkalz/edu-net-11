import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sectionIds, batchNumber = 1 } = await req.json();
    
    if (!sectionIds || !Array.isArray(sectionIds) || sectionIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'يجب تقديم معرفات الأقسام (sectionIds)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const generatedCards = [];
    const generatedQuestions = [];

    // معالجة كل قسم
    for (const sectionId of sectionIds) {
      // جلب معلومات القسم والمواضيع
      const { data: sectionData, error: sectionError } = await supabase
        .from('grade11_sections')
        .select(`
          id,
          title,
          order_index,
          grade11_topics!inner (
            id,
            title,
            description,
            order_index
          )
        `)
        .eq('id', sectionId)
        .single();

      if (sectionError || !sectionData) {
        console.error(`خطأ في جلب القسم ${sectionId}:`, sectionError);
        continue;
      }

      const topics = sectionData.grade11_topics as any[];
      const topicCount = topics.length;
      
      // تقسيم المواضيع إلى مجموعتين
      const midPoint = Math.ceil(topicCount / 2);
      const firstHalfTopics = topics.slice(0, midPoint);
      const secondHalfTopics = topics.slice(midPoint);

      // إنشاء بطاقتين لكل قسم
      const cards = [
        {
          topics: firstHalfTopics,
          cardNumber: 1,
          difficulty: 'easy'
        },
        {
          topics: secondHalfTopics,
          cardNumber: 2,
          difficulty: 'medium'
        }
      ];

      for (const cardData of cards) {
        // تسجيل في جدول التوليد
        await supabase
          .from('grade11_generation_log')
          .insert({
            batch_number: batchNumber,
            section_id: sectionId,
            status: 'processing'
          });

        try {
          // إنشاء prompt للذكاء الاصطناعي
          const topicsInfo = cardData.topics
            .map((t: any) => `- ${t.title}: ${t.description || ''}`)
            .join('\n');

          const prompt = `أنت خبير في إنشاء أسئلة تعليمية للصف الحادي عشر في مادة الشبكات والاتصالات.

**القسم**: ${sectionData.title}
**البطاقة**: ${cardData.cardNumber} من 2
**المواضيع المغطاة**:
${topicsInfo}

**المطلوب**:
1. اقترح عنوان جذاب للبطاقة (20-40 حرف)
2. اكتب وصف مختصر للبطاقة (50-100 حرف)
3. أنشئ 10 أسئلة متنوعة:
   - 7 أسئلة اختيار من متعدد (4 خيارات لكل سؤال)
   - 2 سؤال صح/خطأ
   - 1 سؤال إكمال فراغ

**توزيع الصعوبة**:
- 4 أسئلة سهلة (easy)
- 4 أسئلة متوسطة (medium)
- 2 أسئلة صعبة (hard)

**ملاحظات**:
- الأسئلة يجب أن تكون واضحة ومباشرة
- الخيارات يجب أن تكون معقولة وليست واضحة الخطأ
- قدم شرح مختصر لكل إجابة صحيحة
- استخدم مصطلحات تقنية دقيقة

أجب بتنسيق JSON فقط دون أي نص إضافي.`;

          // استدعاء Lovable AI
          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                {
                  role: 'system',
                  content: 'أنت خبير في إنشاء محتوى تعليمي عالي الجودة. أجب دائماً بتنسيق JSON.'
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              tools: [
                {
                  type: 'function',
                  function: {
                    name: 'create_game_card',
                    description: 'إنشاء بطاقة لعبة مع أسئلة',
                    parameters: {
                      type: 'object',
                      properties: {
                        card: {
                          type: 'object',
                          properties: {
                            title: { type: 'string', description: 'عنوان البطاقة' },
                            description: { type: 'string', description: 'وصف البطاقة' }
                          },
                          required: ['title', 'description']
                        },
                        questions: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              question_text: { type: 'string', description: 'نص السؤال' },
                              question_type: { 
                                type: 'string', 
                                enum: ['multiple_choice', 'true_false', 'fill_blank'],
                                description: 'نوع السؤال'
                              },
                              choices: { 
                                type: 'array', 
                                items: { type: 'string' },
                                description: 'الخيارات (فارغة لأسئلة إكمال الفراغ)'
                              },
                              correct_answer: { type: 'string', description: 'الإجابة الصحيحة' },
                              explanation: { type: 'string', description: 'شرح الإجابة' },
                              difficulty_level: { 
                                type: 'string', 
                                enum: ['easy', 'medium', 'hard'],
                                description: 'مستوى الصعوبة'
                              }
                            },
                            required: ['question_text', 'question_type', 'correct_answer', 'explanation', 'difficulty_level']
                          }
                        }
                      },
                      required: ['card', 'questions']
                    }
                  }
                }
              ],
              tool_choice: { type: 'function', function: { name: 'create_game_card' } }
            }),
          });

          if (!aiResponse.ok) {
            const errorText = await aiResponse.text();
            throw new Error(`Lovable AI error: ${aiResponse.status} - ${errorText}`);
          }

          const aiData = await aiResponse.json();
          const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
          
          if (!toolCall) {
            throw new Error('No tool call in AI response');
          }

          const generatedData = JSON.parse(toolCall.function.arguments);

          // حساب order_index للبطاقة
          const cardOrderIndex = (sectionData.order_index * 2) + cardData.cardNumber - 1;

          // إدراج البطاقة
          const { data: insertedCard, error: cardError } = await supabase
            .from('grade11_video_info_cards')
            .insert({
              section_id: sectionId,
              topic_ids: cardData.topics.map((t: any) => t.id),
              title: generatedData.card.title,
              description: generatedData.card.description,
              card_type: 'quiz',
              difficulty_level: cardData.difficulty,
              questions_count: 10,
              order_index: cardOrderIndex,
              is_active: true,
              video_url: '', // مطلوب لكن فارغ
            })
            .select()
            .single();

          if (cardError) {
            throw new Error(`خطأ في إدراج البطاقة: ${cardError.message}`);
          }

          generatedCards.push(insertedCard);

          // إدراج الأسئلة
          const questionsToInsert = generatedData.questions.map((q: any, index: number) => ({
            section_id: sectionId,
            lesson_id: null,
            question_text: q.question_text,
            question_type: q.question_type,
            choices: q.choices || null,
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            difficulty_level: q.difficulty_level,
            points: 10,
            order_index: index + 1
          }));

          const { data: insertedQuestions, error: questionsError } = await supabase
            .from('grade11_game_questions')
            .insert(questionsToInsert)
            .select();

          if (questionsError) {
            throw new Error(`خطأ في إدراج الأسئلة: ${questionsError.message}`);
          }

          generatedQuestions.push(...(insertedQuestions || []));

          // تحديث حالة التوليد
          await supabase
            .from('grade11_generation_log')
            .update({
              cards_generated: 1,
              questions_generated: 10,
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('batch_number', batchNumber)
            .eq('section_id', sectionId)
            .eq('status', 'processing');

          console.log(`✅ تم إنشاء البطاقة ${cardData.cardNumber} للقسم ${sectionData.title}`);

        } catch (error) {
          console.error(`❌ خطأ في إنشاء البطاقة ${cardData.cardNumber} للقسم ${sectionId}:`, error);
          
          await supabase
            .from('grade11_generation_log')
            .update({
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error',
              completed_at: new Date().toISOString()
            })
            .eq('batch_number', batchNumber)
            .eq('section_id', sectionId)
            .eq('status', 'processing');
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `تم إنشاء ${generatedCards.length} بطاقة و ${generatedQuestions.length} سؤال`,
        data: {
          cards: generatedCards.length,
          questions: generatedQuestions.length,
          batch_number: batchNumber
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in generate-grade11-game-content:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
