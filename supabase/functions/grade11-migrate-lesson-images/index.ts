import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const BUCKET = "grade11-documents";
// single base64 image occurrence
const BASE64_IMG_RE = /data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)/;
const BASE64_IMG_RE_G = /data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)/g;

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/bmp": "bmp",
};

function b64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/\s/g, "");
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // --- auth: superadmin only ---
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (profile?.role !== "superadmin") return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const action: string = body?.action ?? "migrate";
    const topicId: string | undefined = body?.topic_id;
    const lessonId: string | undefined = body?.lesson_id;
    const lessonIds: string[] | undefined = body?.lesson_ids;
    const maxImages: number = Math.min(Number(body?.max_images) || 5, 12);

    // ---------- SCAN (per topic, no heavy payload) ----------
    if (action === "scan") {
      if (!topicId) return json({ error: "topic_id is required" }, 400);
      const { data: lessons, error } = await admin
        .from("grade11_lessons")
        .select("id, title, content, order_index")
        .eq("topic_id", topicId)
        .order("order_index");
      if (error) throw error;

      const items = (lessons ?? []).map((l: any) => {
        const c: string = l.content ?? "";
        return {
          lesson_id: l.id,
          title: l.title,
          pending: (c.match(BASE64_IMG_RE_G) ?? []).length,
          size: c.length,
        };
      });

      return json({
        success: true,
        action: "scan",
        lessons: items.length,
        pending_images: items.reduce((s, i) => s + i.pending, 0),
        total_bytes: items.reduce((s, i) => s + i.size, 0),
        items,
      });
    }

    // ---------- RESTORE ----------
    if (action === "restore") {
      if (!topicId && !lessonIds?.length && !lessonId) {
        return json({ error: "topic_id or lesson_ids is required" }, 400);
      }
      let ids = lessonIds ?? (lessonId ? [lessonId] : []);
      if (!ids.length) {
        const { data: lessons } = await admin
          .from("grade11_lessons")
          .select("id")
          .eq("topic_id", topicId!);
        ids = (lessons ?? []).map((l: any) => l.id);
      }

      const { data: backups, error: bErr } = await admin
        .from("grade11_lesson_content_backup")
        .select("id, lesson_id, original_content")
        .in("lesson_id", ids)
        .is("restored_at", null)
        .order("created_at", { ascending: true });
      if (bErr) throw bErr;

      const seen = new Set<string>();
      let restored = 0;
      for (const b of backups ?? []) {
        if (seen.has(b.lesson_id)) continue;
        seen.add(b.lesson_id);
        const { error: uErr } = await admin
          .from("grade11_lessons")
          .update({ content: b.original_content })
          .eq("id", b.lesson_id);
        if (uErr) continue;
        await admin
          .from("grade11_lesson_content_backup")
          .update({ restored_at: new Date().toISOString() })
          .eq("lesson_id", b.lesson_id)
          .is("restored_at", null);
        restored++;
      }
      return json({ success: true, action: "restore", restored });
    }

    // ---------- MIGRATE (one lesson, small batch, resumable) ----------
    if (!lessonId) return json({ error: "lesson_id is required" }, 400);

    const { data: lesson, error: lErr } = await admin
      .from("grade11_lessons")
      .select("id, title, content")
      .eq("id", lessonId)
      .maybeSingle();
    if (lErr) throw lErr;
    if (!lesson) return json({ error: "lesson not found" }, 404);

    const original: string = lesson.content ?? "";
    const sizeBefore = original.length;

    // one-time backup of the truly original content
    const { data: existingBackup } = await admin
      .from("grade11_lesson_content_backup")
      .select("id")
      .eq("lesson_id", lesson.id)
      .is("restored_at", null)
      .maybeSingle();

    if (!existingBackup) {
      const { error: bkErr } = await admin.from("grade11_lesson_content_backup").insert({
        lesson_id: lesson.id,
        original_content: original,
        migrated_content: null,
        images_migrated: 0,
      });
      if (bkErr) return json({ error: `backup_failed: ${bkErr.message}` }, 500);
    }

    let updated = original;
    let migrated = 0;
    let failed = 0;
    let lastError = "";

    for (let i = 0; i < maxImages; i++) {
      const m = updated.match(BASE64_IMG_RE);
      if (!m) break;
      const full = m[0];
      const mime = m[1];
      const b64 = m[2];

      try {
        const bytes = b64ToBytes(b64);
        const ext = EXT[mime] ?? "png";
        const path = `grade11-lesson-images/${lesson.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await admin.storage
          .from(BUCKET)
          .upload(path, bytes, { contentType: mime, upsert: true, cacheControl: "31536000" });
        if (upErr) throw upErr;

        const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
        updated = updated.split(full).join(pub.publicUrl);
        migrated++;
      } catch (e) {
        lastError = String((e as Error)?.message ?? e);
        // neutralize unreadable payload so the loop can progress, but keep original intact:
        // stop instead of corrupting content
        failed++;
        break;
      }
    }

    if (migrated > 0) {
      const { error: updErr } = await admin
        .from("grade11_lessons")
        .update({ content: updated })
        .eq("id", lesson.id);
      if (updErr) return json({ error: `update_failed: ${updErr.message}` }, 500);

      await admin
        .from("grade11_lesson_content_backup")
        .update({ migrated_content: updated })
        .eq("lesson_id", lesson.id)
        .is("restored_at", null);
    }

    const remaining = (updated.match(BASE64_IMG_RE_G) ?? []).length;

    return json({
      success: true,
      action: "migrate",
      lesson_id: lesson.id,
      title: lesson.title,
      images_migrated: migrated,
      failed,
      last_error: lastError,
      remaining,
      size_before: sizeBefore,
      size_after: updated.length,
    });
  } catch (e) {
    console.error("grade11-migrate-lesson-images error", e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
