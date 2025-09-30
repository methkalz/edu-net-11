-- إنشاء جدول إعدادات توزيع النقاط للصف الحادي عشر
CREATE TABLE IF NOT EXISTS public.grade11_points_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_max_points INTEGER NOT NULL DEFAULT 1000,
  initial_points INTEGER NOT NULL DEFAULT 100,
  lessons_percentage INTEGER NOT NULL DEFAULT 50,
  videos_percentage INTEGER NOT NULL DEFAULT 10,
  games_percentage INTEGER NOT NULL DEFAULT 30,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  CONSTRAINT valid_percentages CHECK (
    lessons_percentage + videos_percentage + games_percentage + (initial_points * 100 / total_max_points) = 100
  ),
  CONSTRAINT positive_values CHECK (
    total_max_points > 0 AND 
    initial_points >= 0 AND 
    lessons_percentage >= 0 AND 
    videos_percentage >= 0 AND 
    games_percentage >= 0
  )
);

-- إنشاء جدول تفصيل نقاط الطلاب
CREATE TABLE IF NOT EXISTS public.grade11_student_points_breakdown (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lessons_points INTEGER NOT NULL DEFAULT 0,
  videos_points INTEGER NOT NULL DEFAULT 0,
  games_points INTEGER NOT NULL DEFAULT 0,
  initial_points INTEGER NOT NULL DEFAULT 100,
  lessons_completed INTEGER NOT NULL DEFAULT 0,
  videos_completed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id),
  CONSTRAINT non_negative_points CHECK (
    lessons_points >= 0 AND 
    videos_points >= 0 AND 
    games_points >= 0 AND
    initial_points >= 0 AND
    lessons_completed >= 0 AND
    videos_completed >= 0
  )
);

-- تفعيل RLS
ALTER TABLE public.grade11_points_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade11_student_points_breakdown ENABLE ROW LEVEL SECURITY;

-- سياسات RLS لجدول grade11_points_config
CREATE POLICY "الجميع يمكنهم قراءة إعدادات النقاط النشطة"
  ON public.grade11_points_config
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "السوبر أدمن فقط يمكنه إدارة إعدادات النقاط"
  ON public.grade11_points_config
  FOR ALL
  USING (get_user_role() = 'superadmin'::app_role)
  WITH CHECK (get_user_role() = 'superadmin'::app_role);

-- سياسات RLS لجدول grade11_student_points_breakdown
CREATE POLICY "الطلاب يمكنهم قراءة نقاطهم الخاصة"
  ON public.grade11_student_points_breakdown
  FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "المعلمون والإداريون يمكنهم قراءة نقاط طلابهم"
  ON public.grade11_student_points_breakdown
  FOR SELECT
  USING (
    get_user_role() IN ('teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role) AND
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = grade11_student_points_breakdown.student_id
      AND (p.school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
    )
  );

CREATE POLICY "النظام يمكنه إدارة نقاط الطلاب"
  ON public.grade11_student_points_breakdown
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- إنشاء دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_grade11_points_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إضافة triggers لتحديث updated_at
CREATE TRIGGER update_grade11_points_config_updated_at
  BEFORE UPDATE ON public.grade11_points_config
  FOR EACH ROW
  EXECUTE FUNCTION update_grade11_points_updated_at();

CREATE TRIGGER update_grade11_student_points_breakdown_updated_at
  BEFORE UPDATE ON public.grade11_student_points_breakdown
  FOR EACH ROW
  EXECUTE FUNCTION update_grade11_points_updated_at();

-- إدراج إعدادات افتراضية
INSERT INTO public.grade11_points_config (
  total_max_points,
  initial_points,
  lessons_percentage,
  videos_percentage,
  games_percentage,
  is_active
) VALUES (
  1000,
  100,
  50,
  10,
  30,
  true
) ON CONFLICT DO NOTHING;

-- إنشاء دالة لحساب إجمالي النقاط
CREATE OR REPLACE FUNCTION get_grade11_student_total_points(p_student_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    initial_points + lessons_points + videos_points + games_points,
    0
  )
  FROM grade11_student_points_breakdown
  WHERE student_id = p_student_id;
$$;

-- إنشاء view لعرض النقاط الإجمالية
CREATE OR REPLACE VIEW grade11_student_points_summary AS
SELECT 
  spb.student_id,
  spb.initial_points,
  spb.lessons_points,
  spb.videos_points,
  spb.games_points,
  spb.lessons_completed,
  spb.videos_completed,
  (spb.initial_points + spb.lessons_points + spb.videos_points + spb.games_points) as total_points,
  pc.total_max_points,
  pc.lessons_percentage,
  pc.videos_percentage,
  pc.games_percentage,
  spb.updated_at
FROM grade11_student_points_breakdown spb
CROSS JOIN LATERAL (
  SELECT * FROM grade11_points_config 
  WHERE is_active = true 
  ORDER BY created_at DESC 
  LIMIT 1
) pc;