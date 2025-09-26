-- إنشاء جدول لحفظ الإحصائيات اليومية
CREATE TABLE public.daily_activity_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  school_id UUID NOT NULL,
  total_active_students INTEGER NOT NULL DEFAULT 0,
  peak_hour INTEGER, -- الساعة من 0-23
  avg_session_duration INTEGER, -- بالدقائق
  class_distribution JSONB NOT NULL DEFAULT '{}',
  most_visited_pages JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date, school_id)
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX idx_daily_activity_stats_date ON public.daily_activity_stats(date);
CREATE INDEX idx_daily_activity_stats_school_date ON public.daily_activity_stats(school_id, date);

-- تمكين RLS
ALTER TABLE public.daily_activity_stats ENABLE ROW LEVEL SECURITY;

-- سياسات الوصول
CREATE POLICY "School members can view their school activity stats" 
ON public.daily_activity_stats 
FOR SELECT 
USING (school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role);

CREATE POLICY "System can manage activity stats" 
ON public.daily_activity_stats 
FOR ALL 
USING (true)
WITH CHECK (true);

-- إنشاء دالة لحساب الإحصائيات اليومية
CREATE OR REPLACE FUNCTION calculate_daily_activity_stats(target_date DATE, target_school_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  active_count INTEGER;
  peak_hour_val INTEGER;
  class_dist JSONB;
  page_stats JSONB;
BEGIN
  -- حساب عدد الطلاب النشطين في التاريخ المحدد
  SELECT COUNT(DISTINCT sp.student_id) INTO active_count
  FROM public.student_presence sp
  WHERE sp.school_id = target_school_id 
    AND sp.last_seen_at >= target_date::TIMESTAMP
    AND sp.last_seen_at < (target_date + INTERVAL '1 day')::TIMESTAMP;

  -- حساب ساعة الذروة
  SELECT EXTRACT(HOUR FROM sp.last_seen_at)::INTEGER INTO peak_hour_val
  FROM public.student_presence sp
  WHERE sp.school_id = target_school_id 
    AND sp.last_seen_at >= target_date::TIMESTAMP
    AND sp.last_seen_at < (target_date + INTERVAL '1 day')::TIMESTAMP
  GROUP BY EXTRACT(HOUR FROM sp.last_seen_at)
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- حساب توزيع الصفوف
  SELECT jsonb_object_agg(
    CASE 
      WHEN gl.label LIKE '%عاشر%' OR gl.code = '10' THEN '10'
      WHEN gl.label LIKE '%حادي عشر%' OR gl.code = '11' THEN '11'  
      WHEN gl.label LIKE '%ثاني عشر%' OR gl.code = '12' THEN '12'
      ELSE COALESCE(gl.code, 'غير محدد')
    END,
    student_count
  ) INTO class_dist
  FROM (
    SELECT c.grade_level_id, COUNT(DISTINCT sp.student_id) as student_count
    FROM public.student_presence sp
    JOIN public.students s ON s.id = sp.student_id
    JOIN public.class_students cs ON cs.student_id = s.id
    JOIN public.classes c ON c.id = cs.class_id
    JOIN public.grade_levels gl ON gl.id = c.grade_level_id
    WHERE sp.school_id = target_school_id 
      AND sp.last_seen_at >= target_date::TIMESTAMP
      AND sp.last_seen_at < (target_date + INTERVAL '1 day')::TIMESTAMP
    GROUP BY c.grade_level_id
  ) class_counts
  JOIN public.grade_levels gl ON gl.id = class_counts.grade_level_id;

  -- حساب أكثر الصفحات زيارة
  SELECT jsonb_object_agg(current_page, page_count) INTO page_stats
  FROM (
    SELECT 
      COALESCE(sp.current_page, 'غير محدد') as current_page,
      COUNT(*) as page_count
    FROM public.student_presence sp
    WHERE sp.school_id = target_school_id 
      AND sp.last_seen_at >= target_date::TIMESTAMP
      AND sp.last_seen_at < (target_date + INTERVAL '1 day')::TIMESTAMP
      AND sp.current_page IS NOT NULL
    GROUP BY sp.current_page
    ORDER BY COUNT(*) DESC
    LIMIT 10
  ) page_counts;

  -- إدراج أو تحديث الإحصائيات
  INSERT INTO public.daily_activity_stats (
    date, school_id, total_active_students, peak_hour, 
    avg_session_duration, class_distribution, most_visited_pages
  ) VALUES (
    target_date, target_school_id, COALESCE(active_count, 0), 
    peak_hour_val, 30, -- قيمة افتراضية مؤقتة
    COALESCE(class_dist, '{}'), COALESCE(page_stats, '{}')
  )
  ON CONFLICT (date, school_id) 
  DO UPDATE SET
    total_active_students = EXCLUDED.total_active_students,
    peak_hour = EXCLUDED.peak_hour,
    avg_session_duration = EXCLUDED.avg_session_duration,
    class_distribution = EXCLUDED.class_distribution,
    most_visited_pages = EXCLUDED.most_visited_pages,
    updated_at = now();
END;
$$;