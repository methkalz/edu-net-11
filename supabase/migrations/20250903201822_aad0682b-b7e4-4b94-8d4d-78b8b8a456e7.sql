-- إنشاء جدول لتتبع مكافآت الدروس الذكية
CREATE TABLE public.grade11_lesson_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL,
  reward_type TEXT NOT NULL, -- 'first_completion', 'improvement', 'perfect_score', 'speed_bonus', 'no_mistakes', 'daily_limit'
  reward_date DATE NOT NULL DEFAULT CURRENT_DATE,
  score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  completion_time INTEGER, -- بالثواني
  mistakes_count INTEGER DEFAULT 0,
  coins_earned INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  previous_best_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- فهرسة لتحسين الأداء
CREATE INDEX idx_lesson_rewards_user_lesson ON public.grade11_lesson_rewards(user_id, lesson_id);
CREATE INDEX idx_lesson_rewards_date ON public.grade11_lesson_rewards(reward_date);
CREATE INDEX idx_lesson_rewards_type ON public.grade11_lesson_rewards(reward_type);

-- إنشاء trigger لتحديث updated_at
CREATE TRIGGER update_lesson_rewards_updated_at
  BEFORE UPDATE ON public.grade11_lesson_rewards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS policies
ALTER TABLE public.grade11_lesson_rewards ENABLE ROW LEVEL SECURITY;

-- السماح للمستخدمين بإدارة مكافآتهم الخاصة
CREATE POLICY "Users can manage their own lesson rewards"
  ON public.grade11_lesson_rewards
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- السماح للمدراء بعرض جميع المكافآت
CREATE POLICY "Admins can view all lesson rewards"
  ON public.grade11_lesson_rewards
  FOR SELECT
  USING (get_user_role() IN ('school_admin', 'superadmin'));