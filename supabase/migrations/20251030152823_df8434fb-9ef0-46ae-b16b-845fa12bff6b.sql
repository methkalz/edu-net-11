
-- Helper function لتحديث materialized view
CREATE OR REPLACE FUNCTION public.refresh_superadmin_view()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.superadmin_school_stats;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_superadmin_view TO authenticated;
