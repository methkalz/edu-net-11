CREATE TABLE public.grade11_lesson_content_backup (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL,
  original_content text,
  migrated_content text,
  images_migrated integer NOT NULL DEFAULT 0,
  restored_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_g11_lesson_content_backup_lesson ON public.grade11_lesson_content_backup(lesson_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.grade11_lesson_content_backup TO authenticated;
GRANT ALL ON public.grade11_lesson_content_backup TO service_role;

ALTER TABLE public.grade11_lesson_content_backup ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins manage lesson content backups"
ON public.grade11_lesson_content_backup
FOR ALL
TO authenticated
USING (public.get_current_user_role_safe() = 'superadmin')
WITH CHECK (public.get_current_user_role_safe() = 'superadmin');