import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const BUCKET = "lesson-media";
const BASE64_IMG_RE = /data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)/g;

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
    const lessonIds: string[] | undefined = body?.lesson_ids;
    const dryRun: boolean = body?.dry_run === true;

    if (!topicId && (!lessonIds || lessonIds.length === 0)) {
      return json({ error: "topic_id or lesson_ids is required" }, 400);
    }

    // ---------- RESTORE ----------
    if (action === "restore") {
      let q = admin
        .from("grade11_lesson_content_backup")
        .select("id, lesson_id, original_content")
        .is("restored_at", null)
        .order("created_at", { ascending: false });

      if (lessonIds?.length) {
        q = q.in("lesson_id", lessonIds);
      } else {
        const { data: lessons } = await admin
          .from("grade11_lessons")
          .select("id")
          .eq("topic_id", topicId);
        q = q.in("lesson_id", (lessons ?? []).map((l) => l.id));
      }

      const { data: backups, error: bErr } = await q;
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
          .eq("id", b.id);
        restored++;
      }
      return json({ success: true, action: "restore", restored });
    }

    // ---------- MIGRATE ----------
    let lq = admin.from("grade11_lessons").select("id, title, content");
    lq = lessonIds?.length ? lq.in("id", lessonIds) : lq.eq("topic_id", topicId!);
    const { data: lessons, error: lErr } = await lq;
    if (lErr) throw lErr;

    const results: any[] = [];
    let totalImages = 0;
    let bytesBefore = 0;
    let bytesAfter = 0;

    for (const lesson of lessons ?? []) {
      const original: string = lesson.content ?? "";
      bytesBefore += original.length;

      const matches = [...original.matchAll(BASE64_IMG_RE)];
      if (matches.length === 0) {
        bytesAfter += original.length;
        results.push({ lesson_id: lesson.id, title: lesson.title, images: 0, skipped: true });
        continue;
      }

      if (dryRun) {
        totalImages += matches.length;
        bytesAfter += original.length;
        results.push({ lesson_id: lesson.id, title: lesson.title, images: matches.length, dry_run: true });
        continue;
      }

      let updated = original;
      let migrated = 0;
      let failed = 0;

      for (let i = 0; i < matches.length; i++) {
        const full = matches[i][0];
        const mime = matches[i][1];
        const b64 = matches[i][2];
        if (updated.indexOf(full) === -1) continue; // already replaced (duplicate image)

        try {
          const bytes = b64ToBytes(b64);
          const ext = EXT[mime] ?? "png";
          const path = `grade11-lessons/${lesson.id}/${Date.now()}-${i}.${ext}`;
          const { error: upErr } = await admin.storage
            .from(BUCKET)
            .upload(path, bytes, { contentType: mime, upsert: true, cacheControl: "31536000" });
          if (upErr) throw upErr;

          const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
          // replace ALL occurrences of this exact base64 payload
          updated = updated.split(full).join(pub.publicUrl);
          migrated++;
        } catch (_e) {
          failed++; // leave the base64 image untouched
        }
      }

      if (migrated > 0) {
        const { error: bkErr } = await admin.from("grade11_lesson_content_backup").insert({
          lesson_id: lesson.id,
          original_content: original,
          migrated_content: updated,
          images_migrated: migrated,
        });
        if (bkErr) {
          results.push({ lesson_id: lesson.id, title: lesson.title, error: "backup_failed", images: 0 });
          bytesAfter += original.length;
          continue;
        }

        const { error: updErr } = await admin
          .from("grade11_lessons")
          .update({ content: updated })
          .eq("id", lesson.id);
        if (updErr) {
          results.push({ lesson_id: lesson.id, title: lesson.title, error: "update_failed", images: 0 });
          bytesAfter += original.length;
          continue;
        }
      }

      totalImages += migrated;
      bytesAfter += updated.length;
      results.push({
        lesson_id: lesson.id,
        title: lesson.title,
        images: migrated,
        failed,
        size_before: original.length,
        size_after: updated.length,
      });
    }

    return json({
      success: true,
      action: dryRun ? "dry_run" : "migrate",
      lessons: (lessons ?? []).length,
      images_migrated: totalImages,
      bytes_before: bytesBefore,
      bytes_after: bytesAfter,
      reduction_percent: bytesBefore ? Math.round((1 - bytesAfter / bytesBefore) * 100) : 0,
      results,
    });
  } catch (e) {
    console.error("grade11-migrate-lesson-images error", e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
