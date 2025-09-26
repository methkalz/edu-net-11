-- المرحلة الأولى: إصلاح البيانات الأساسية (مبسط)

-- 1. إضافة student_presence للطلاب المفقودين الذين لديهم user_id فقط
INSERT INTO public.student_presence (
    student_id, 
    user_id, 
    school_id, 
    is_online, 
    last_seen_at,
    created_at,
    updated_at
)
SELECT DISTINCT
    s.id as student_id,
    s.user_id,
    s.school_id,
    false as is_online,
    now() - interval '1 day' as last_seen_at,
    now() as created_at,
    now() as updated_at
FROM public.students s
LEFT JOIN public.student_presence sp ON s.id = sp.student_id
WHERE sp.student_id IS NULL 
  AND s.user_id IS NOT NULL;

-- 2. إنشاء function لإنشاء student_presence تلقائياً
CREATE OR REPLACE FUNCTION public.create_student_presence_for_new_student()
RETURNS TRIGGER AS $$
BEGIN
    -- إنشاء student_presence فقط إذا كان الطالب لديه user_id
    IF NEW.user_id IS NOT NULL THEN
        INSERT INTO public.student_presence (
            student_id,
            user_id,
            school_id,
            is_online,
            last_seen_at,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            NEW.user_id,
            NEW.school_id,
            false,
            now(),
            now(),
            now()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. إنشاء trigger على جدول students
DROP TRIGGER IF EXISTS trigger_create_student_presence ON public.students;
CREATE TRIGGER trigger_create_student_presence
    AFTER INSERT ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION public.create_student_presence_for_new_student();

-- 4. إنشاء function للتحقق من student_presence عند ربط طالب بصف
CREATE OR REPLACE FUNCTION public.ensure_student_presence_on_class_enrollment()
RETURNS TRIGGER AS $$
BEGIN
    -- التحقق من وجود student_presence للطالب الذي لديه user_id
    IF NOT EXISTS (
        SELECT 1 FROM public.student_presence 
        WHERE student_id = NEW.student_id
    ) THEN
        -- إنشاء student_presence إذا لم يكن موجوداً وكان الطالب لديه user_id
        INSERT INTO public.student_presence (
            student_id,
            user_id,
            school_id,
            is_online,
            last_seen_at,
            created_at,
            updated_at
        )
        SELECT 
            NEW.student_id,
            s.user_id,
            s.school_id,
            false,
            now(),
            now(),
            now()
        FROM public.students s
        WHERE s.id = NEW.student_id 
          AND s.user_id IS NOT NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. إنشاء trigger على جدول class_students
DROP TRIGGER IF EXISTS trigger_ensure_student_presence_on_enrollment ON public.class_students;
CREATE TRIGGER trigger_ensure_student_presence_on_enrollment
    AFTER INSERT ON public.class_students
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_student_presence_on_class_enrollment();

-- 6. إنشاء function مساعدة لتحديث student_presence
CREATE OR REPLACE FUNCTION public.update_student_presence_safe(
    p_student_id uuid, 
    p_is_online boolean DEFAULT true, 
    p_current_page text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.student_presence (
        student_id,
        user_id,
        school_id,
        is_online,
        last_seen_at,
        current_page,
        created_at,
        updated_at
    )
    SELECT 
        s.id,
        s.user_id,
        s.school_id,
        p_is_online,
        now(),
        p_current_page,
        now(),
        now()
    FROM public.students s
    WHERE s.id = p_student_id 
      AND s.user_id IS NOT NULL
    ON CONFLICT (student_id) 
    DO UPDATE SET
        is_online = p_is_online,
        last_seen_at = now(),
        current_page = COALESCE(p_current_page, student_presence.current_page),
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;