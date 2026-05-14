// One-shot setup function: schedules the pg_cron job that drives the
// PDF comparison queue. Safe to call multiple times (idempotent).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const cronUrl = `${supabaseUrl}/functions/v1/pdf-process-jobs`;
    const headersJson = JSON.stringify({
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    });

    // Build the SQL. We try '10 seconds' first; if not supported, fall back to '* * * * *'.
    // Use a SECURITY DEFINER helper executed via a single rpc-like call using `query` is not exposed,
    // so we ship the SQL as a migration-style call through pg_net? No — simplest path: create a temporary
    // SECURITY DEFINER setup function in DB on first call, then invoke it.

    const setupSql = `
      CREATE OR REPLACE FUNCTION public._setup_pdf_cron(_url text, _headers text)
      RETURNS text
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $fn$
      DECLARE
        _schedule text;
        _cmd text;
      BEGIN
        -- Drop existing schedule if present
        BEGIN PERFORM cron.unschedule('process-pdf-comparison-jobs'); EXCEPTION WHEN OTHERS THEN NULL; END;

        _cmd := format(
          $$SELECT net.http_post(url := %L, headers := %L::jsonb, body := '{}'::jsonb);$$,
          _url, _headers
        );

        -- Try 10-second schedule, fall back to per-minute
        BEGIN
          PERFORM cron.schedule('process-pdf-comparison-jobs', '10 seconds', _cmd);
          _schedule := '10 seconds';
        EXCEPTION WHEN OTHERS THEN
          PERFORM cron.schedule('process-pdf-comparison-jobs', '* * * * *', _cmd);
          _schedule := '* * * * *';
        END;

        RETURN _schedule;
      END;
      $fn$;
      REVOKE ALL ON FUNCTION public._setup_pdf_cron(text, text) FROM PUBLIC;
    `;

    // Execute the DDL via PostgREST is not possible directly; use pg_net workaround through a simple
    // anonymous SQL endpoint. Supabase exposes `pg-meta` only on dashboard. Instead, we rely on the
    // fact that a previous migration may already define the helper. Try to call it; if missing, error
    // tells us to install via SQL Editor.
    // Strategy: First attempt rpc; on PGRST202 (function not found) we return an instructive error.

    let rpcRes = await admin.rpc('_setup_pdf_cron', {
      _url: cronUrl,
      _headers: headersJson,
    });

    if (rpcRes.error && (rpcRes.error.code === 'PGRST202' || /not find|does not exist/i.test(rpcRes.error.message))) {
      return new Response(
        JSON.stringify({
          success: false,
          needsManualSetup: true,
          message: 'Helper function _setup_pdf_cron is missing. Run the bootstrap SQL once in the SQL Editor.',
          bootstrapSql: setupSql,
          afterBootstrapAction: 'Then invoke this function again (POST /setup-pdf-cron) to schedule the cron.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (rpcRes.error) throw rpcRes.error;

    return new Response(
      JSON.stringify({
        success: true,
        scheduled: 'process-pdf-comparison-jobs',
        interval: rpcRes.data,
        url: cronUrl,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
