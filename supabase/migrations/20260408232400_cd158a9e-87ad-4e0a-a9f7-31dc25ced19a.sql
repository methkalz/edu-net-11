
-- PHASE 1: get_own_role() helper
CREATE OR REPLACE FUNCTION public.get_own_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM profiles WHERE user_id = auth.uid()
$$;

-- PHASE 2: Protect role in profiles
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND role::text = get_own_role());

-- PHASE 3: Drop USING(true) policies
DROP POLICY IF EXISTS "Service role bypass for students" ON students;
DROP POLICY IF EXISTS "Service role bypass for class_students" ON class_students;
DROP POLICY IF EXISTS "System can manage student points" ON student_unified_points;
DROP POLICY IF EXISTS "System can manage activity stats" ON daily_activity_stats;

-- PHASE 4: Staff SELECT on points
CREATE POLICY "School staff can view student points"
ON student_unified_points FOR SELECT
USING ((SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('teacher', 'school_admin', 'superadmin'));

-- PHASE 5: Drop debug policies
DROP POLICY IF EXISTS "simple_select_test" ON grade12_project_comments;
DROP POLICY IF EXISTS "simple_insert_test" ON grade12_project_comments;
DROP POLICY IF EXISTS "simple_update_test" ON grade12_project_comments;

-- PHASE 6: Views to SECURITY INVOKER
ALTER VIEW public.grade11_content_stats SET (security_invoker = on);
ALTER VIEW public.grade11_student_content_summary SET (security_invoker = on);
ALTER VIEW public.teacher_assigned_grades SET (security_invoker = on);
ALTER VIEW public.teacher_projects_view SET (security_invoker = on);

-- PHASE 7: search_path for custom functions (excluding submit_exam_attempt already done)
ALTER FUNCTION public.calculate_daily_stats_for_superadmin SET search_path = public;
ALTER FUNCTION public.calculate_student_title SET search_path = public;
ALTER FUNCTION public.get_school_activity_trends SET search_path = public;
ALTER FUNCTION public.get_superadmin_overview_stats SET search_path = public;
ALTER FUNCTION public.log_pdf_settings_change SET search_path = public;
ALTER FUNCTION public.refresh_superadmin_view SET search_path = public;
ALTER FUNCTION public.update_document_stats SET search_path = public;
ALTER FUNCTION public.update_document_updated_at SET search_path = public;
ALTER FUNCTION public.update_drive_folders_updated_at SET search_path = public;
ALTER FUNCTION public.update_exam_statuses SET search_path = public;
ALTER FUNCTION public.update_google_documents_updated_at SET search_path = public;
ALTER FUNCTION public.update_grade10_projects_updated_at SET search_path = public;
ALTER FUNCTION public.update_grade11_topic_lessons_count SET search_path = public;
ALTER FUNCTION public.update_grade12_videos_updated_at SET search_path = public;
ALTER FUNCTION public.update_pair_matching_games_updated_at SET search_path = public;
ALTER FUNCTION public.update_pdf_comparison_repository_updated_at SET search_path = public;
ALTER FUNCTION public.update_pdf_comparison_updated_at SET search_path = public;
ALTER FUNCTION public.update_student_presence_updated_at SET search_path = public;
ALTER FUNCTION public.update_student_title SET search_path = public;
ALTER FUNCTION public.update_teacher_presence_updated_at SET search_path = public;
ALTER FUNCTION public.update_zoho_integrations_updated_at SET search_path = public;
