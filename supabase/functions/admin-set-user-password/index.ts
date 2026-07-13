import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !userData?.user?.id) {
      return json({ error: "Unauthorized" }, 401);
    }
    const callerId = userData.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Verify caller is superadmin
    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .select("role, full_name")
      .eq("user_id", callerId)
      .maybeSingle();

    if (profileErr || profile?.role !== "superadmin") {
      return json({ error: "Forbidden: superadmin only" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const { user_id, new_password } = body ?? {};

    if (typeof user_id !== "string" || !user_id) {
      return json({ error: "user_id مطلوب" }, 400);
    }
    if (typeof new_password !== "string" || new_password.length < 8 || new_password.length > 128) {
      return json({ error: "كلمة المرور يجب أن تكون بين 8 و 128 حرفًا" }, 400);
    }

    // Prevent changing another superadmin's password
    const { data: target } = await admin
      .from("profiles")
      .select("role, email, full_name")
      .eq("user_id", user_id)
      .maybeSingle();

    if (target?.role === "superadmin" && user_id !== callerId) {
      return json({ error: "لا يمكن تعديل كلمة مرور مدير نظام آخر" }, 403);
    }

    const { error: updErr } = await admin.auth.admin.updateUserById(user_id, {
      password: new_password,
    });
    if (updErr) {
      console.error("updateUserById failed:", updErr.message);
      return json({ error: updErr.message }, 500);
    }

    // Audit log (best-effort)
    try {
      await admin.from("audit_log").insert({
        action: "admin_set_password",
        entity: "user",
        entity_id: user_id,
        actor_user_id: callerId,
        payload_json: {
          timestamp: new Date().toISOString(),
          target_email: target?.email ?? null,
        },
      });
    } catch (e) {
      console.warn("audit_log insert failed", e);
    }

    return json({ success: true });
  } catch (e) {
    console.error("admin-set-user-password error:", e);
    return json({ error: (e as Error).message ?? "Internal error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
