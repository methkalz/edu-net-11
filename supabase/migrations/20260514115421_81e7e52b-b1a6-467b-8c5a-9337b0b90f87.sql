CREATE OR REPLACE FUNCTION public._setup_pdf_cron(_url text, _headers text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  _cmd text;
  _schedule text;
BEGIN
  BEGIN PERFORM cron.unschedule('process-pdf-comparison-jobs'); EXCEPTION WHEN OTHERS THEN NULL; END;

  _cmd := format(
    $$SELECT net.http_post(url := %L, headers := %L::jsonb, body := '{}'::jsonb);$$,
    _url, _headers
  );

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
GRANT EXECUTE ON FUNCTION public._setup_pdf_cron(text, text) TO service_role;