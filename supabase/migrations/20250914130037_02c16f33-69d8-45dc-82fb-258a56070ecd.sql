-- Fix get_student_assigned_grade function to use correct column and return consistent grade codes
CREATE OR REPLACE FUNCTION public.get_student_assigned_grade(student_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  student_grade text;
BEGIN
  -- Get the grade level for the student based on their class enrollment
  SELECT 
    CASE 
      WHEN gl.label LIKE '%عاشر%' OR gl.code = '10' THEN '10'
      WHEN gl.label LIKE '%حادي عشر%' OR gl.code = '11' THEN '11'  
      WHEN gl.label LIKE '%ثاني عشر%' OR gl.code = '12' THEN '12'
      ELSE COALESCE(gl.code, '11')
    END INTO student_grade
  FROM public.students s
  JOIN public.class_students cs ON cs.student_id = s.id
  JOIN public.classes c ON c.id = cs.class_id
  JOIN public.grade_levels gl ON gl.id = c.grade_level_id
  WHERE s.user_id = student_user_id
  LIMIT 1;
  
  -- Return the grade level, default to '11' if not found
  RETURN COALESCE(student_grade, '11');
END;
$function$;

-- Add missing columns to grade11_videos table
ALTER TABLE public.grade11_videos 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS is_visible boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0;

-- Add missing column to grade11_lessons table  
ALTER TABLE public.grade11_lessons 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Update existing records to have proper default values
UPDATE public.grade11_videos 
SET 
  is_active = true, 
  is_visible = true,
  order_index = 0
WHERE is_active IS NULL OR is_visible IS NULL OR order_index IS NULL;

UPDATE public.grade11_lessons 
SET is_active = true 
WHERE is_active IS NULL;

-- Add sample content for grade 11 if table is empty
INSERT INTO public.grade11_videos (
  title, 
  description, 
  video_url, 
  category, 
  grade_level, 
  owner_user_id, 
  school_id,
  is_active,
  is_visible,
  order_index,
  source_type,
  duration
)
SELECT 
  'مقدمة في الشبكات', 
  'درس تمهيدي عن أساسيات الشبكات والاتصالات', 
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 
  'networks', 
  '11', 
  (SELECT id FROM public.profiles WHERE role = 'superadmin' LIMIT 1),
  (SELECT id FROM public.schools LIMIT 1),
  true,
  true,
  1,
  'youtube',
  '15:30'
WHERE NOT EXISTS (SELECT 1 FROM public.grade11_videos LIMIT 1);

INSERT INTO public.grade11_videos (
  title, 
  description, 
  video_url, 
  category, 
  grade_level, 
  owner_user_id, 
  school_id,
  is_active,
  is_visible,
  order_index,
  source_type,
  duration
)
SELECT 
  'بروتوكولات الشبكة', 
  'شرح مفصل لبروتوكولات الشبكة المختلفة', 
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 
  'protocols', 
  '11', 
  (SELECT id FROM public.profiles WHERE role = 'superadmin' LIMIT 1),
  (SELECT id FROM public.schools LIMIT 1),
  true,
  true,
  2,
  'youtube',
  '22:45'
WHERE (SELECT COUNT(*) FROM public.grade11_videos) < 2;