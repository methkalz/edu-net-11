-- Create table to track badge celebrations
CREATE TABLE IF NOT EXISTS public.student_badge_celebrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  celebrated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.student_badge_celebrations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Students can view their own celebrations
CREATE POLICY "Students can view their own badge celebrations"
ON public.student_badge_celebrations
FOR SELECT
USING (student_id = auth.uid());

-- RLS Policy: Students can insert their own celebrations
CREATE POLICY "Students can insert their own badge celebrations"
ON public.student_badge_celebrations
FOR INSERT
WITH CHECK (student_id = auth.uid());

-- RLS Policy: Admins can view all celebrations
CREATE POLICY "Admins can view all badge celebrations"
ON public.student_badge_celebrations
FOR SELECT
USING (get_user_role() = ANY(ARRAY['school_admin'::app_role, 'superadmin'::app_role]));

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_student_badge_celebrations_student_id 
ON public.student_badge_celebrations(student_id);

CREATE INDEX IF NOT EXISTS idx_student_badge_celebrations_badge_id 
ON public.student_badge_celebrations(badge_id);

-- Function to check if badge celebration was already shown
CREATE OR REPLACE FUNCTION public.has_celebrated_badge(
  p_student_id UUID,
  p_badge_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.student_badge_celebrations
    WHERE student_id = p_student_id
      AND badge_id = p_badge_id
  );
END;
$$;

-- Function to record a new badge celebration
CREATE OR REPLACE FUNCTION public.record_badge_celebration(
  p_student_id UUID,
  p_badge_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.student_badge_celebrations (student_id, badge_id)
  VALUES (p_student_id, p_badge_id)
  ON CONFLICT (student_id, badge_id) DO NOTHING;
END;
$$;