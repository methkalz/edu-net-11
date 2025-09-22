-- إضافة حقول جديدة لجدول profiles لدعم نظام الأفاتار والمُسميات
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS display_title TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 100, -- للطلاب فقط
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1; -- للطلاب فقط

-- إنشاء جدول avatar_images لتخزين الأفاتار المتاحة
CREATE TABLE IF NOT EXISTS public.avatar_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'student', 'teacher', 'admin', 'universal'
    file_path TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- تمكين RLS على جدول avatar_images
ALTER TABLE public.avatar_images ENABLE ROW LEVEL SECURITY;

-- سياسة عرض الأفاتار المتاحة للجميع
CREATE POLICY "Anyone can view active avatar images" 
ON public.avatar_images 
FOR SELECT 
USING (is_active = true);

-- سياسة إدارة الأفاتار للمديرين فقط
CREATE POLICY "Superadmins can manage avatar images" 
ON public.avatar_images 
FOR ALL 
USING (get_user_role() = 'superadmin'::app_role);

-- إدراج الأفاتار الافتراضية (15 صورة)
INSERT INTO public.avatar_images (filename, display_name, category, file_path, order_index) VALUES
-- أفاتار الطلاب (5)
('student-boy-1.png', 'طالب - نمط 1', 'student', '/avatars/student-boy-1.png', 1),
('student-girl-1.png', 'طالبة - نمط 1', 'student', '/avatars/student-girl-1.png', 2),
('student-boy-2.png', 'طالب - نمط 2', 'student', '/avatars/student-boy-2.png', 3),
('student-girl-2.png', 'طالبة - نمط 2', 'student', '/avatars/student-girl-2.png', 4),
('student-creative.png', 'طالب مبدع', 'student', '/avatars/student-creative.png', 5),

-- أفاتار المعلمين (4)
('teacher-male-1.png', 'معلم - كلاسيكي', 'teacher', '/avatars/teacher-male-1.png', 6),
('teacher-female-1.png', 'معلمة - مهنية', 'teacher', '/avatars/teacher-female-1.png', 7),
('teacher-male-2.png', 'معلم - عصري', 'teacher', '/avatars/teacher-male-2.png', 8),
('teacher-female-2.png', 'معلمة - ودودة', 'teacher', '/avatars/teacher-female-2.png', 9),

-- أفاتار مديري المدارس (3)
('admin-school-male.png', 'مدير مدرسة', 'school_admin', '/avatars/admin-school-male.png', 10),
('admin-school-female.png', 'مديرة مدرسة', 'school_admin', '/avatars/admin-school-female.png', 11),
('admin-school-formal.png', 'إداري رسمي', 'school_admin', '/avatars/admin-school-formal.png', 12),

-- أفاتار المديرين العامين (3)
('superadmin-1.png', 'مدير النظام - 1', 'superadmin', '/avatars/superadmin-1.png', 13),
('superadmin-2.png', 'مدير النظام - 2', 'superadmin', '/avatars/superadmin-2.png', 14),
('universal-default.png', 'افتراضي', 'universal', '/avatars/universal-default.png', 15);

-- تحديث المُسميات الافتراضية للمستخدمين الموجودين
UPDATE public.profiles 
SET display_title = CASE 
    WHEN role = 'teacher' THEN 'معلم'
    WHEN role = 'school_admin' THEN 'مدير مدرسة'
    WHEN role = 'superadmin' THEN 'مدير النظام'
    WHEN role = 'student' THEN 'طالب جديد'
    WHEN role = 'parent' THEN 'ولي أمر'
    ELSE 'مستخدم'
END
WHERE display_title IS NULL;

-- تعيين أفاتار افتراضي للمستخدمين الجدد
UPDATE public.profiles 
SET avatar_url = '/avatars/universal-default.png'
WHERE avatar_url IS NULL;

-- تحديث النقاط والمستوى للطلاب الموجودين
UPDATE public.profiles 
SET points = 100, level = 1
WHERE role = 'student' AND (points IS NULL OR level IS NULL);

-- دالة لحساب المُسمى بناءً على النقاط (للطلاب)
CREATE OR REPLACE FUNCTION public.calculate_student_title(user_points INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    -- حالياً نظام بسيط، سنطوره لاحقاً
    IF user_points >= 1000 THEN
        RETURN 'طالب متميز';
    ELSIF user_points >= 500 THEN
        RETURN 'طالب نشط';
    ELSE
        RETURN 'طالب جديد';
    END IF;
END;
$$;

-- دالة لتحديث مُسمى الطالب عند تغيير النقاط
CREATE OR REPLACE FUNCTION public.update_student_title()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.role = 'student' AND NEW.points != OLD.points THEN
        NEW.display_title = calculate_student_title(NEW.points);
    END IF;
    RETURN NEW;
END;
$$;

-- إنشاء trigger لتحديث مُسمى الطالب تلقائياً
DROP TRIGGER IF EXISTS update_student_title_trigger ON public.profiles;
CREATE TRIGGER update_student_title_trigger
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_student_title();