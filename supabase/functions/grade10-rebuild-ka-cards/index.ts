// Rebuilds Knowledge Adventure cards & questions for Grade 10.
// - One card (synthetic lesson) per topic (skips "العاب" topics)
// - Card title = cleaned topic title
// - Questions generated strictly from aggregated topic content via Lovable AI Gateway
// - Strict validation: no empty choices, correct_answer must exactly match a choice
// Idempotent: wipes existing questions for the section before rebuild.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CARD_LESSON_ORDER = 9999;
const QUESTIONS_PER_CARD = 5;
const MIN_VALID = 4;
const MAX_CONTENT_CHARS = 18000;

function stripHtml(html: string): string {
  if (!html) return "";
  // Remove style/script blocks entirely
  let s = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ");
  // Remove base64 image src (huge, useless)
  s = s.replace(/<img[^>]*>/gi, " ");
  // Remove iframes
  s = s.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, " ");
  // Remove all tags
  s = s.replace(/<[^>]+>/g, " ");
  // Decode common entities
  s = s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
  // Collapse whitespace
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

function cleanTopicTitle(raw: string): string {
  if (!raw) return raw;
  let t = raw.trim();
  // Remove Hebrew portion if " - " separator present and Arabic exists
  const parts = t.split(" - ");
  if (parts.length > 1) {
    const arabic = parts.find((p) => /[\u0600-\u06FF]/.test(p));
    if (arabic) t = arabic.trim();
  }
  return t;
}

function isSkipTopic(title: string): boolean {
  const t = (title || "").trim().toLowerCase();
  return t === "العاب" || t === "العاب " || t.includes("لعبة") || t === "الالعاب";
}

async function generateQuestionsAI(topicTitle: string, content: string): Promise<any[]> {
  if (!LOVABLE_API_KEY) throw new Error("Missing LOVABLE_API_KEY");

  const truncated = content.slice(0, MAX_CONTENT_CHARS);

  const system = `أنت معلم خبير في الشبكات وأنظمة الاتصالات. مهمتك توليد أسئلة اختيار من متعدد للطلاب باللغة العربية الفصحى السهلة.
قواعد صارمة:
1) كل سؤال مبني حصراً من المضمون المقدّم. ممنوع اختراع معلومات خارج النص.
2) كل سؤال 4 خيارات نصّية واضحة وغير فارغة وغير متطابقة.
3) الإجابة الصحيحة يجب أن تطابق نص أحد الخيارات حرفياً.
4) أعد JSON فقط دون أي تعليق.`;

  const user = `الموضوع: ${topicTitle}

المضمون (مرجع وحيد):
"""
${truncated}
"""

أنشئ ${QUESTIONS_PER_CARD} أسئلة اختيار من متعدد. أعد JSON بالشكل التالي بالضبط:
{
  "questions": [
    {
      "question_text": "نص السؤال؟",
      "choices": ["خيار1", "خيار2", "خيار3", "خيار4"],
      "correct_answer": "نص الخيار الصحيح كما يظهر بالضبط",
      "explanation": "شرح موجز",
      "difficulty_level": "easy"
    }
  ]
}
ملاحظات: difficulty_level من {easy, medium, hard}. وزّع: 2 easy, 2 medium, 1 hard.`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI gateway ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = await res.json();
  const raw = json.choices?.[0]?.message?.content ?? "{}";
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    parsed = m ? JSON.parse(m[0]) : { questions: [] };
  }
  return Array.isArray(parsed.questions) ? parsed.questions : [];
}

function validateAndShape(qs: any[]): any[] {
  const valid: any[] = [];
  for (const q of qs) {
    const text = typeof q?.question_text === "string" ? q.question_text.trim() : "";
    const correct = typeof q?.correct_answer === "string" ? q.correct_answer.trim() : "";
    const choicesRaw = Array.isArray(q?.choices) ? q.choices : [];
    const choices = choicesRaw.map((c: any) => (typeof c === "string" ? c.trim() : "")).filter((c: string) => c.length > 0);
    const unique = Array.from(new Set(choices));
    if (!text || unique.length < 3 || !correct) continue;
    if (!unique.some((c) => c === correct)) continue;
    const diff = ["easy", "medium", "hard"].includes(q?.difficulty_level) ? q.difficulty_level : "medium";
    const points = diff === "easy" ? 10 : diff === "medium" ? 15 : 20;
    valid.push({
      question_text: text,
      choices: unique, // store as JSONB array of strings
      correct_answer: correct,
      explanation: typeof q?.explanation === "string" ? q.explanation.trim() : "",
      difficulty_level: diff,
      question_type: "multiple_choice",
      points,
    });
  }
  return valid;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Auth: only superadmin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: prof } = await supabase.from("profiles").select("role").eq("user_id", userData.user.id).maybeSingle();
    if (prof?.role !== "superadmin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { section_id, dry_run } = await req.json().catch(() => ({}));
    if (!section_id) return new Response(JSON.stringify({ error: "section_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const results: any[] = [];

    // 1) Wipe ALL existing questions for this section (to start clean)
    if (!dry_run) {
      const { error: delErr } = await supabase.from("grade10_ka_questions").delete().eq("section_id", section_id);
      if (delErr) throw new Error(`Wipe questions failed: ${delErr.message}`);
    }

    // 2) Get topics for this section (from grade10_ka_topics)
    const { data: topics, error: tErr } = await supabase
      .from("grade10_ka_topics")
      .select("id, title, order_index")
      .eq("section_id", section_id)
      .order("order_index");
    if (tErr) throw new Error(`Fetch topics: ${tErr.message}`);

    for (const topic of topics || []) {
      const cleanTitle = cleanTopicTitle(topic.title);
      if (isSkipTopic(topic.title) || isSkipTopic(cleanTitle)) {
        results.push({ topic_id: topic.id, topic: cleanTitle, skipped: true, reason: "games-topic" });
        continue;
      }

      // 3) Aggregate content from grade11_lessons under same topic_id
      // (grade10 topics share IDs with grade11 topics; grade11_lessons holds the rich content)
      const { data: lessons } = await supabase
        .from("grade11_lessons")
        .select("content")
        .eq("topic_id", topic.id);

      let bag = "";
      for (const l of lessons || []) {
        const c = stripHtml(l.content || "");
        if (c.length < 500) continue;
        bag += "\n\n" + c;
        if (bag.length > MAX_CONTENT_CHARS) break;
      }
      bag = bag.trim();
      if (bag.length < 600) {
        results.push({ topic_id: topic.id, topic: cleanTitle, skipped: true, reason: "insufficient-content", chars: bag.length });
        continue;
      }

      // 4) Find or create the synthetic "card lesson" in grade10_ka_lessons
      const { data: existingCard } = await supabase
        .from("grade10_ka_lessons")
        .select("id")
        .eq("topic_id", topic.id)
        .eq("order_index", CARD_LESSON_ORDER)
        .maybeSingle();

      let cardLessonId = existingCard?.id;
      if (!cardLessonId) {
        const { data: created, error: cErr } = await supabase
          .from("grade10_ka_lessons")
          .insert({
            topic_id: topic.id,
            title: cleanTitle,
            content: bag.slice(0, 2000),
            order_index: CARD_LESSON_ORDER,
            is_active: true,
          })
          .select("id")
          .single();
        if (cErr) {
          results.push({ topic_id: topic.id, topic: cleanTitle, error: `create-card: ${cErr.message}` });
          continue;
        }
        cardLessonId = created.id;
      } else {
        // refresh title to cleaned version
        await supabase.from("grade10_ka_lessons").update({ title: cleanTitle, is_active: true }).eq("id", cardLessonId);
      }

      // 5) Generate questions (with one retry)
      let validQs: any[] = [];
      let lastErr = "";
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const raw = await generateQuestionsAI(cleanTitle, bag);
          validQs = validateAndShape(raw);
          if (validQs.length >= MIN_VALID) break;
          lastErr = `only ${validQs.length} valid`;
        } catch (e: any) {
          lastErr = e?.message || String(e);
        }
        await new Promise((r) => setTimeout(r, 800));
      }
      if (validQs.length < MIN_VALID) {
        results.push({ topic_id: topic.id, topic: cleanTitle, error: `generation-failed: ${lastErr}` });
        continue;
      }

      if (dry_run) {
        results.push({ topic_id: topic.id, topic: cleanTitle, generated: validQs.length, dry_run: true });
        continue;
      }

      // 6) Insert
      const rows = validQs.map((q) => ({
        section_id,
        topic_id: topic.id,
        lesson_id: cardLessonId,
        question_text: q.question_text,
        question_type: q.question_type,
        choices: q.choices,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        difficulty_level: q.difficulty_level,
        points: q.points,
        created_by: userData.user.id,
      }));
      const { error: insErr } = await supabase.from("grade10_ka_questions").insert(rows);
      if (insErr) {
        results.push({ topic_id: topic.id, topic: cleanTitle, error: `insert: ${insErr.message}` });
        continue;
      }
      results.push({ topic_id: topic.id, topic: cleanTitle, inserted: rows.length });
    }

    return new Response(JSON.stringify({ section_id, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
