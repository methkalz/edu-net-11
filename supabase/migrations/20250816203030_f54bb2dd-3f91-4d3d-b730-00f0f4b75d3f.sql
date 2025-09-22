-- إنشاء جدول grade_levels (أنواع الصفوف الثابتة)
CREATE TABLE public.grade_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL UNIQUE,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- تعبئة البيانات الأولية لأنواع الصفوف
INSERT INTO public.grade_levels (label) VALUES 
    ('الصف العاشر'),
    ('الصف الحادي عشر'),
    ('الصف الثاني عشر');

-- إنشاء جدول class_names (أسماء الصفوف المخصصة)
CREATE TABLE public.class_names (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(school_id, name)
);

-- إنشاء جدول classes (الصفوف الفعلية)
CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    grade_level_id UUID NOT NULL REFERENCES public.grade_levels(id) ON DELETE CASCADE,
    class_name_id UUID NOT NULL REFERENCES public.class_names(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_by UUID NOT NULL,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(school_id, academic_year_id, grade_level_id, class_name_id)
);

-- إنشاء جدول students (إذا لم يكن موجوداً)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    phone TEXT,
    password_hash TEXT,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- إنشاء جدول class_students (ربط الطلاب بالصفوف)
CREATE TABLE public.class_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(class_id, student_id)
);

-- إنشاء الفهارس
CREATE INDEX idx_class_names_school_id ON public.class_names(school_id);
CREATE INDEX idx_classes_school_id ON public.classes(school_id);
CREATE INDEX idx_classes_academic_year_id ON public.classes(academic_year_id);
CREATE INDEX idx_classes_status ON public.classes(status);
CREATE INDEX idx_students_school_id ON public.students(school_id);
CREATE INDEX idx_class_students_class_id ON public.class_students(class_id);
CREATE INDEX idx_class_students_student_id ON public.class_students(student_id);

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.grade_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_names ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_students ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات RLS لجدول grade_levels
CREATE POLICY "Anyone can view grade levels" 
ON public.grade_levels 
FOR SELECT 
USING (true);

CREATE POLICY "Superadmins can manage grade levels" 
ON public.grade_levels 
FOR ALL 
USING (get_user_role() = 'superadmin'::app_role);

-- إنشاء سياسات RLS لجدول class_names
CREATE POLICY "School members can view their school class names" 
ON public.class_names 
FOR SELECT 
USING (school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role);

CREATE POLICY "School admins can manage their school class names" 
ON public.class_names 
FOR ALL 
USING ((school_id = get_user_school_id() AND get_user_role() = ANY(ARRAY['school_admin'::app_role, 'superadmin'::app_role])) OR get_user_role() = 'superadmin'::app_role);

-- إنشاء سياسات RLS لجدول classes
CREATE POLICY "School members can view their school classes" 
ON public.classes 
FOR SELECT 
USING (school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role);

CREATE POLICY "School admins can manage their school classes" 
ON public.classes 
FOR ALL 
USING ((school_id = get_user_school_id() AND get_user_role() = ANY(ARRAY['school_admin'::app_role, 'superadmin'::app_role])) OR get_user_role() = 'superadmin'::app_role);

-- إنشاء سياسات RLS لجدول students
CREATE POLICY "School members can view their school students" 
ON public.students 
FOR SELECT 
USING (school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role);

CREATE POLICY "School admins can manage their school students" 
ON public.students 
FOR ALL 
USING ((school_id = get_user_school_id() AND get_user_role() = ANY(ARRAY['school_admin'::app_role, 'superadmin'::app_role])) OR get_user_role() = 'superadmin'::app_role);

-- إنشاء سياسات RLS لجدول class_students
CREATE POLICY "School members can view their school class students" 
ON public.class_students 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.classes c 
    WHERE c.id = class_students.class_id 
    AND (c.school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
));

CREATE POLICY "School admins can manage their school class students" 
ON public.class_students 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.classes c 
    WHERE c.id = class_students.class_id 
    AND ((c.school_id = get_user_school_id() AND get_user_role() = ANY(ARRAY['school_admin'::app_role, 'superadmin'::app_role])) OR get_user_role() = 'superadmin'::app_role)
));

-- إنشاء تريجر للتحديث التلقائي لحقل updated_at
CREATE TRIGGER update_class_names_updated_at 
BEFORE UPDATE ON public.class_names 
FOR EACH ROW 
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_classes_updated_at 
BEFORE UPDATE ON public.classes 
FOR EACH ROW 
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at 
BEFORE UPDATE ON public.students 
FOR EACH ROW 
EXECUTE FUNCTION public.update_updated_at_column();