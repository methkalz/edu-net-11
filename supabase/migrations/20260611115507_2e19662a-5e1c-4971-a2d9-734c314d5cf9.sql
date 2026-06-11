
-- 1) Publications table
CREATE TABLE public.bagrut_exam_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.bagrut_exams(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  school_id UUID,
  available_from TIMESTAMPTZ NOT NULL,
  available_until TIMESTAMPTZ NOT NULL,
  max_attempts INT NOT NULL DEFAULT 1,
  show_answers_to_students BOOLEAN NOT NULL DEFAULT false,
  allow_review_after_submit BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bagrut_exam_publications_unique UNIQUE (exam_id, class_id),
  CONSTRAINT bagrut_exam_publications_dates CHECK (available_until > available_from),
  CONSTRAINT bagrut_exam_publications_attempts CHECK (max_attempts BETWEEN 1 AND 20)
);

CREATE INDEX idx_bagrut_pub_exam ON public.bagrut_exam_publications(exam_id);
CREATE INDEX idx_bagrut_pub_teacher ON public.bagrut_exam_publications(teacher_id);
CREATE INDEX idx_bagrut_pub_class ON public.bagrut_exam_publications(class_id);
CREATE INDEX idx_bagrut_pub_active_window ON public.bagrut_exam_publications(class_id, is_active, available_from, available_until);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bagrut_exam_publications TO authenticated;
GRANT ALL ON public.bagrut_exam_publications TO service_role;

-- 2) Add publication_id BEFORE creating functions that reference it
ALTER TABLE public.bagrut_attempts
  ADD COLUMN IF NOT EXISTS publication_id UUID REFERENCES public.bagrut_exam_publications(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_bagrut_attempts_publication ON public.bagrut_attempts(publication_id);

-- 3) updated_at trigger
CREATE OR REPLACE FUNCTION public.bagrut_pub_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_bagrut_pub_updated_at
BEFORE UPDATE ON public.bagrut_exam_publications
FOR EACH ROW EXECUTE FUNCTION public.bagrut_pub_set_updated_at();

-- 4) auto-fill school_id
CREATE OR REPLACE FUNCTION public.bagrut_pub_set_school_id()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.school_id IS NULL THEN
    SELECT school_id INTO NEW.school_id FROM public.profiles WHERE user_id = NEW.teacher_id LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_bagrut_pub_school
BEFORE INSERT ON public.bagrut_exam_publications
FOR EACH ROW EXECUTE FUNCTION public.bagrut_pub_set_school_id();

-- 5) Enable RLS
ALTER TABLE public.bagrut_exam_publications ENABLE ROW LEVEL SECURITY;

-- 6) Helpers
CREATE OR REPLACE FUNCTION public.teacher_owns_class(_teacher UUID, _class UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.teacher_classes WHERE teacher_id = _teacher AND class_id = _class);
$$;

CREATE OR REPLACE FUNCTION public.student_in_publication_class(_student_user UUID, _publication UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bagrut_exam_publications p
    JOIN public.class_students cs ON cs.class_id = p.class_id
    JOIN public.students s ON s.id = cs.student_id
    WHERE p.id = _publication AND s.user_id = _student_user
  );
$$;

-- 7) Updated teacher access function (now publication_id exists)
CREATE OR REPLACE FUNCTION public.teacher_can_access_bagrut_attempt(p_attempt_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bagrut_attempts ba
    JOIN public.bagrut_exam_publications p ON p.id = ba.publication_id
    WHERE ba.id = p_attempt_id AND p.teacher_id = auth.uid()
  ) OR EXISTS (
    SELECT 1
    FROM public.bagrut_attempts ba
    JOIN public.students s            ON s.user_id   = ba.student_id
    JOIN public.class_students cs     ON cs.student_id = s.id
    JOIN public.teacher_classes tc    ON tc.class_id   = cs.class_id
    WHERE ba.id = p_attempt_id
      AND tc.teacher_id = auth.uid()
      AND ba.student_id IS NOT NULL
      AND s.id IS NOT NULL
      AND cs.class_id IS NOT NULL
  );
$$;

-- 8) Policies
CREATE POLICY "Superadmins manage all bagrut publications"
ON public.bagrut_exam_publications FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'superadmin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "School admins read school bagrut publications"
ON public.bagrut_exam_publications FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE p.user_id = auth.uid() AND p.role = 'school_admin'
    AND p.school_id = bagrut_exam_publications.school_id
));

CREATE POLICY "Teachers manage their own bagrut publications"
ON public.bagrut_exam_publications FOR ALL
USING (teacher_id = auth.uid() AND public.teacher_owns_class(auth.uid(), class_id))
WITH CHECK (
  teacher_id = auth.uid()
  AND public.teacher_owns_class(auth.uid(), class_id)
  AND EXISTS (SELECT 1 FROM public.bagrut_exams be WHERE be.id = exam_id AND be.is_published = true)
);

CREATE POLICY "Students read their class bagrut publications"
ON public.bagrut_exam_publications FOR SELECT
USING (
  is_active = true
  AND EXISTS (
    SELECT 1
    FROM public.class_students cs
    JOIN public.students s ON s.id = cs.student_id
    WHERE cs.class_id = bagrut_exam_publications.class_id
      AND s.user_id = auth.uid()
  )
);

-- 9) Cleanup legacy direct-publishing windows
UPDATE public.bagrut_exams SET available_from = NULL, available_until = NULL;

-- 10) Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.bagrut_exam_publications;
