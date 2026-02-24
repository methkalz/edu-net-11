import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BATCH_SIZE = 20;
const DELAY_BETWEEN_BATCHES = 500;

interface QuestionRow {
  id: string;
  question_text: string;
  choices: any;
  correct_answer: string;
  question_type: string;
}

interface AIAnswer {
  question_id: string;
  correct_answer: "صح" | "خطأ";
  explanation: string;
  confidence: "high" | "medium" | "low";
}

interface FixResult {
  question_id: string;
  question_text: string;
  old_answer: string;
  new_answer: string;
  old_choices: any;
  status: "confirmed" | "corrected" | "normalized" | "skipped";
  explanation: string;
  confidence: "high" | "medium" | "low";
}

function getCurrentAnswerLabel(question: QuestionRow): string {
  const choices = question.choices;
  const correctAnswer = question.correct_answer;
  
  if (!choices || !Array.isArray(choices)) return "unknown";
  
  const matchedChoice = choices.find((c: any) => c.id === correctAnswer);
  if (matchedChoice) return matchedChoice.text || "unknown";
  
  // If correct_answer doesn't match any choice id
  if (correctAnswer === "choice_true") return "صح";
  if (correctAnswer === "choice_false") return "خطأ";
  return correctAnswer || "unknown";
}

function isQuestionBroken(question: QuestionRow): boolean {
  const choices = question.choices;
  const correctAnswer = question.correct_answer;
  
  if (!choices || !Array.isArray(choices)) return true;
  
  // Check if correct_answer ID exists in choices
  const matchExists = choices.some((c: any) => c.id === correctAnswer);
  if (!matchExists) return true;
  
  // Check if IDs are reversed (choice_true has text "خطأ")
  const trueChoice = choices.find((c: any) => c.id === "choice_true");
  if (trueChoice && trueChoice.text === "خطأ") return true;
  
  return false;
}

async function callAI(questions: QuestionRow[], apiKey: string): Promise<AIAnswer[]> {
  const questionsForAI = questions.map((q) => ({
    id: q.id,
    text: q.question_text,
  }));

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `أنت مدقق أسئلة تعليمية متخصص في مادة الحاسوب والتكنولوجيا للمرحلة الثانوية.
لكل سؤال صح/خطأ مُعطى، حدد الإجابة الصحيحة بدقة علمية.
أجب فقط باستخدام الأداة المتاحة.
كن دقيقاً جداً - إجاباتك ستُستخدم لتصحيح قاعدة بيانات امتحانات حقيقية.`,
        },
        {
          role: "user",
          content: `حدد الإجابة الصحيحة (صح أو خطأ) لكل سؤال من الأسئلة التالية:\n\n${questionsForAI
            .map((q, i) => `${i + 1}. [ID: ${q.id}] ${q.text}`)
            .join("\n")}`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "submit_answers",
            description: "تقديم إجابات أسئلة صح/خطأ مع التفسير ومستوى الثقة",
            parameters: {
              type: "object",
              properties: {
                answers: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question_id: { type: "string", description: "معرّف السؤال" },
                      correct_answer: {
                        type: "string",
                        enum: ["صح", "خطأ"],
                        description: "الإجابة الصحيحة",
                      },
                      explanation: { type: "string", description: "تفسير مختصر للإجابة" },
                      confidence: {
                        type: "string",
                        enum: ["high", "medium", "low"],
                        description: "مستوى الثقة بالإجابة",
                      },
                    },
                    required: ["question_id", "correct_answer", "explanation", "confidence"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["answers"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "submit_answers" } },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI Gateway error:", response.status, errorText);
    throw new Error(`AI Gateway error: ${response.status}`);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  
  if (!toolCall) {
    throw new Error("No tool call in AI response");
  }

  const parsed = JSON.parse(toolCall.function.arguments);
  return parsed.answers as AIAnswer[];
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body for options
    let dryRun = false;
    try {
      const body = await req.json();
      dryRun = body?.dryRun === true;
    } catch {
      // No body is fine
    }

    // Fetch all true/false questions
    const { data: questions, error: fetchError } = await supabase
      .from("question_bank")
      .select("id, question_text, choices, correct_answer, question_type")
      .eq("question_type", "true_false")
      .eq("is_active", true);

    if (fetchError) throw new Error(`Fetch error: ${fetchError.message}`);
    if (!questions || questions.length === 0) {
      return new Response(JSON.stringify({ message: "No true/false questions found", results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${questions.length} true/false questions to process`);

    const allResults: FixResult[] = [];
    const batches: QuestionRow[][] = [];

    // Split into batches
    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      batches.push(questions.slice(i, i + BATCH_SIZE) as QuestionRow[]);
    }

    console.log(`Processing ${batches.length} batches of ${BATCH_SIZE}`);

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} questions)`);

      let aiAnswers: AIAnswer[];
      try {
        aiAnswers = await callAI(batch, LOVABLE_API_KEY);
      } catch (err) {
        console.error(`Batch ${batchIndex + 1} AI error:`, err);
        // Mark all questions in this batch as skipped
        for (const q of batch) {
          allResults.push({
            question_id: q.id,
            question_text: q.question_text,
            old_answer: getCurrentAnswerLabel(q),
            new_answer: getCurrentAnswerLabel(q),
            old_choices: q.choices,
            status: "skipped",
            explanation: `خطأ في معالجة الدفعة: ${err instanceof Error ? err.message : "unknown"}`,
            confidence: "low",
          });
        }
        if (batchIndex < batches.length - 1) await delay(DELAY_BETWEEN_BATCHES);
        continue;
      }

      // Process each answer
      for (const q of batch) {
        const aiAnswer = aiAnswers.find((a) => a.question_id === q.id);
        
        if (!aiAnswer) {
          allResults.push({
            question_id: q.id,
            question_text: q.question_text,
            old_answer: getCurrentAnswerLabel(q),
            new_answer: getCurrentAnswerLabel(q),
            old_choices: q.choices,
            status: "skipped",
            explanation: "لم يجد الذكاء الاصطناعي إجابة لهذا السؤال",
            confidence: "low",
          });
          continue;
        }

        const oldAnswerLabel = getCurrentAnswerLabel(q);
        const isBroken = isQuestionBroken(q);
        const newCorrectAnswerId = aiAnswer.correct_answer === "صح" ? "choice_true" : "choice_false";
        const standardChoices = [
          { id: "choice_true", text: "صح" },
          { id: "choice_false", text: "خطأ" },
        ];

        // Determine status
        let status: FixResult["status"];
        if (aiAnswer.confidence === "low") {
          status = "skipped";
        } else if (isBroken) {
          status = "normalized";
        } else if (oldAnswerLabel === aiAnswer.correct_answer) {
          status = "confirmed";
        } else {
          status = "corrected";
        }

        const result: FixResult = {
          question_id: q.id,
          question_text: q.question_text,
          old_answer: oldAnswerLabel,
          new_answer: aiAnswer.correct_answer,
          old_choices: q.choices,
          status,
          explanation: aiAnswer.explanation,
          confidence: aiAnswer.confidence,
        };

        // Update database if not dry run and not skipped
        if (!dryRun && status !== "skipped" && status !== "confirmed") {
          const { error: updateError } = await supabase
            .from("question_bank")
            .update({
              choices: standardChoices,
              correct_answer: newCorrectAnswerId,
            })
            .eq("id", q.id);

          if (updateError) {
            console.error(`Update error for ${q.id}:`, updateError);
            result.status = "skipped";
            result.explanation = `خطأ في التحديث: ${updateError.message}`;
          }
        }

        // For confirmed questions, still normalize choices if broken
        if (!dryRun && status === "confirmed" && isBroken) {
          const { error: updateError } = await supabase
            .from("question_bank")
            .update({
              choices: standardChoices,
              correct_answer: newCorrectAnswerId,
            })
            .eq("id", q.id);

          if (updateError) {
            console.error(`Normalize error for ${q.id}:`, updateError);
          } else {
            result.status = "normalized";
          }
        }

        allResults.push(result);
      }

      // Delay between batches
      if (batchIndex < batches.length - 1) {
        await delay(DELAY_BETWEEN_BATCHES);
      }
    }

    // Summary
    const summary = {
      total: allResults.length,
      confirmed: allResults.filter((r) => r.status === "confirmed").length,
      corrected: allResults.filter((r) => r.status === "corrected").length,
      normalized: allResults.filter((r) => r.status === "normalized").length,
      skipped: allResults.filter((r) => r.status === "skipped").length,
      dryRun,
    };

    console.log("Fix complete:", summary);

    return new Response(
      JSON.stringify({ summary, results: allResults }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("fix-true-false-questions error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
