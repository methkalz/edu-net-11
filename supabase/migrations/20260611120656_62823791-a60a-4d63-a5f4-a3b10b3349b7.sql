
-- ===========================================================
-- Fix: tighten RLS so students require an active publication
-- from their teacher for the bagrut exam
-- ===========================================================

-- 1) Helper: does student have an active publication for this exam?
CREATE OR REPLACE FUNCTION public.student_has_active_bagrut_publication(_student_user UUID, _exam_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bagrut_exam_publications p
    JOIN public.class_students cs ON cs.class_id = p.class_id
    JOIN public.students s        ON s.id = cs.student_id
    WHERE p.exam_id = _exam_id
      AND s.user_id = _student_user
      AND p.is_active = true
      AND (p.available_from IS NULL OR p.available_from <= now())
      AND (p.available_until IS NULL OR p.available_until >= now())
  );
$$;

-- 2) Helper: pick the active publication id for a student+exam (most recent window)
CREATE OR REPLACE FUNCTION public.get_active_bagrut_publication_for_student(_student_user UUID, _exam_id UUID)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id
  FROM public.bagrut_exam_publications p
  JOIN public.class_students cs ON cs.class_id = p.class_id
  JOIN public.students s        ON s.id = cs.student_id
  WHERE p.exam_id = _exam_id
    AND s.user_id = _student_user
    AND p.is_active = true
    AND (p.available_from IS NULL OR p.available_from <= now())
    AND (p.available_until IS NULL OR p.available_until >= now())
  ORDER BY p.published_at DESC
  LIMIT 1;
$$;

-- 3) bagrut_attempts: replace student INSERT policy
DROP POLICY IF EXISTS "Students can create their own attempts" ON public.bagrut_attempts;
CREATE POLICY "Students can create their own attempts"
ON public.bagrut_attempts FOR INSERT
WITH CHECK (
  student_id = auth.uid()
  AND publication_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.bagrut_exam_publications p
    JOIN public.class_students cs ON cs.class_id = p.class_id
    JOIN public.students s        ON s.id = cs.student_id
    WHERE p.id = bagrut_attempts.publication_id
      AND p.exam_id = bagrut_attempts.exam_id
      AND s.user_id = auth.uid()
      AND p.is_active = true
      AND (p.available_from IS NULL OR p.available_from <= now())
      AND (p.available_until IS NULL OR p.available_until >= now())
  )
);

-- 4) bagrut_attempts: enforce max_attempts at INSERT time via trigger
CREATE OR REPLACE FUNCTION public.enforce_bagrut_max_attempts()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_max INT;
  v_used INT;
BEGIN
  IF NEW.publication_id IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT max_attempts INTO v_max FROM public.bagrut_exam_publications WHERE id = NEW.publication_id;
  IF v_max IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT COUNT(*) INTO v_used
  FROM public.bagrut_attempts
  WHERE publication_id = NEW.publication_id
    AND student_id     = NEW.student_id
    AND status IN ('submitted','graded');
  IF v_used >= v_max THEN
    RAISE EXCEPTION 'لقد استنفدت عدد المحاولات المسموحة لهذا الامتحان' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_bagrut_enforce_max_attempts ON public.bagrut_attempts;
CREATE TRIGGER trg_bagrut_enforce_max_attempts
BEFORE INSERT ON public.bagrut_attempts
FOR EACH ROW EXECUTE FUNCTION public.enforce_bagrut_max_attempts();

-- 5) bagrut_exams: tighten student SELECT (require active publication)
DROP POLICY IF EXISTS "Students can view available published bagrut exams" ON public.bagrut_exams;
CREATE POLICY "Students can view published bagrut exams via publication"
ON public.bagrut_exams FOR SELECT
USING (
  is_published = true
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'student')
  AND public.student_has_active_bagrut_publication(auth.uid(), id)
);

-- 6) Realtime for bagrut_attempts (helpful for live status updates) — idempotent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'bagrut_attempts'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.bagrut_attempts';
  END IF;
END $$;
