-- إنشاء جدول تتبع الحد الأقصى للمكافآت لكل درس
CREATE TABLE public.grade11_lesson_completion_caps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id TEXT NOT NULL,
  total_coins_earned INTEGER NOT NULL DEFAULT 0,
  total_xp_earned INTEGER NOT NULL DEFAULT 0,
  max_coins_allowed INTEGER NOT NULL DEFAULT 100,
  max_xp_allowed INTEGER NOT NULL DEFAULT 200,
  first_completion_at TIMESTAMP WITH TIME ZONE,
  last_reward_at TIMESTAMP WITH TIME ZONE,
  completion_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, lesson_id)
);

-- تمكين RLS
ALTER TABLE public.grade11_lesson_completion_caps ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "Users can view their own lesson caps"
ON public.grade11_lesson_completion_caps
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own lesson caps"
ON public.grade11_lesson_completion_caps
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own lesson caps"
ON public.grade11_lesson_completion_caps
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Superadmins can manage all lesson caps"
ON public.grade11_lesson_completion_caps
FOR ALL
USING (get_user_role() = 'superadmin'::app_role);

CREATE POLICY "Service role can delete lesson caps"
ON public.grade11_lesson_completion_caps
FOR DELETE
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- إضافة فهرس للأداء
CREATE INDEX idx_lesson_caps_user_lesson ON public.grade11_lesson_completion_caps(user_id, lesson_id);

-- إضافة trigger للـ updated_at
CREATE TRIGGER update_lesson_caps_updated_at
  BEFORE UPDATE ON public.grade11_lesson_completion_caps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();