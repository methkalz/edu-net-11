
ALTER FUNCTION public.submit_exam_attempt(p_attempt_id uuid) SET search_path = public;
ALTER FUNCTION public.submit_exam_attempt(p_attempt_id uuid, p_answers jsonb) SET search_path = public;
