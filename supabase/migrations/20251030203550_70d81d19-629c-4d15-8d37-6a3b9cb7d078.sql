-- إضافة أعمدة تتبع تسجيل الدخول إلى profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;

-- إنشاء index لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_profiles_last_login_at ON public.profiles(last_login_at);
CREATE INDEX IF NOT EXISTS idx_profiles_role_login ON public.profiles(role, last_login_at);

-- تحديث القيم الافتراضية للمستخدمين الحاليين
UPDATE public.profiles 
SET login_count = 0 
WHERE login_count IS NULL;

-- إضافة تعليقات توضيحية
COMMENT ON COLUMN public.profiles.last_login_at IS 'آخر وقت تسجيل دخول للمستخدم';
COMMENT ON COLUMN public.profiles.login_count IS 'عدد مرات تسجيل الدخول الإجمالي';

-- ==========================================
-- إنشاء جدول teacher_presence لتتبع المعلمين ومدراء المدارس
-- ==========================================

CREATE TABLE IF NOT EXISTS public.teacher_presence (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    role app_role NOT NULL CHECK (role IN ('teacher', 'school_admin')),
    
    -- حالة الحضور
    is_online BOOLEAN NOT NULL DEFAULT false,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    current_page TEXT,
    
    -- معلومات الجلسة
    session_start_at TIMESTAMP WITH TIME ZONE,
    total_time_minutes INTEGER DEFAULT 0,
    
    -- معلومات إضافية
    device_info JSONB DEFAULT '{}'::JSONB,
    
    -- timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- constraint فريد لكل user
    CONSTRAINT unique_teacher_presence_user UNIQUE (user_id)
);

-- Indexes لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_teacher_presence_user_id ON public.teacher_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_presence_school_id ON public.teacher_presence(school_id);
CREATE INDEX IF NOT EXISTS idx_teacher_presence_is_online ON public.teacher_presence(is_online);
CREATE INDEX IF NOT EXISTS idx_teacher_presence_last_seen ON public.teacher_presence(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_teacher_presence_role ON public.teacher_presence(role);

-- ==========================================
-- RLS Policies لـ teacher_presence
-- ==========================================

ALTER TABLE public.teacher_presence ENABLE ROW LEVEL SECURITY;

-- السوبر أدمن: عرض الكل
CREATE POLICY "superadmin_view_all_teacher_presence" 
ON public.teacher_presence FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.user_id = auth.uid() 
        AND profiles.role = 'superadmin'
    )
);

-- المعلمون ومدراء المدارس: عرض وتحديث بياناتهم الخاصة
CREATE POLICY "teachers_view_own_presence" 
ON public.teacher_presence FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "teachers_update_own_presence" 
ON public.teacher_presence FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

-- مدير المدرسة: عرض معلمي مدرسته
CREATE POLICY "school_admin_view_school_teachers" 
ON public.teacher_presence FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.user_id = auth.uid() 
        AND profiles.role = 'school_admin'
        AND profiles.school_id = teacher_presence.school_id
    )
);

-- ==========================================
-- RPC Function لتحديث حالة حضور المعلمين
-- ==========================================

CREATE OR REPLACE FUNCTION public.update_teacher_presence(
    p_user_id UUID,
    p_is_online BOOLEAN DEFAULT true,
    p_current_page TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_session_minutes INTEGER;
BEGIN
    -- حساب الوقت إذا كانت الجلسة نشطة
    v_session_minutes := 0;
    
    IF p_is_online = false THEN
        -- حساب مدة الجلسة الحالية
        SELECT EXTRACT(EPOCH FROM (now() - session_start_at)) / 60
        INTO v_session_minutes
        FROM public.teacher_presence
        WHERE user_id = p_user_id AND session_start_at IS NOT NULL;
        
        v_session_minutes := COALESCE(v_session_minutes, 0);
    END IF;

    -- تحديث أو إدراج البيانات
    INSERT INTO public.teacher_presence (
        user_id,
        school_id,
        role,
        is_online,
        last_seen_at,
        current_page,
        session_start_at,
        total_time_minutes,
        created_at,
        updated_at
    )
    SELECT 
        p.user_id,
        p.school_id,
        p.role,
        p_is_online,
        now(),
        p_current_page,
        CASE WHEN p_is_online THEN now() ELSE NULL END,
        0,
        now(),
        now()
    FROM public.profiles p
    WHERE p.user_id = p_user_id
        AND p.role IN ('teacher', 'school_admin')
    ON CONFLICT (user_id) 
    DO UPDATE SET
        is_online = p_is_online,
        last_seen_at = now(),
        current_page = COALESCE(p_current_page, teacher_presence.current_page),
        session_start_at = CASE 
            WHEN p_is_online AND teacher_presence.session_start_at IS NULL THEN now()
            WHEN NOT p_is_online THEN NULL
            ELSE teacher_presence.session_start_at
        END,
        total_time_minutes = teacher_presence.total_time_minutes + v_session_minutes,
        updated_at = now();
        
END;
$$;

-- ==========================================
-- Trigger لإنشاء teacher_presence تلقائياً
-- ==========================================

CREATE OR REPLACE FUNCTION public.create_teacher_presence_for_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- إنشاء teacher_presence للمعلمين ومدراء المدارس فقط
    IF NEW.role IN ('teacher', 'school_admin') THEN
        INSERT INTO public.teacher_presence (
            user_id,
            school_id,
            role,
            is_online,
            last_seen_at,
            created_at,
            updated_at
        ) VALUES (
            NEW.user_id,
            NEW.school_id,
            NEW.role,
            false,
            now(),
            now(),
            now()
        )
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;

-- إنشاء الـ Trigger على profiles
DROP TRIGGER IF EXISTS trigger_create_teacher_presence ON public.profiles;
CREATE TRIGGER trigger_create_teacher_presence
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.create_teacher_presence_for_new_user();

-- ==========================================
-- Trigger لتحديث updated_at
-- ==========================================

CREATE OR REPLACE FUNCTION public.update_teacher_presence_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_teacher_presence_timestamp ON public.teacher_presence;
CREATE TRIGGER trigger_update_teacher_presence_timestamp
    BEFORE UPDATE ON public.teacher_presence
    FOR EACH ROW
    EXECUTE FUNCTION public.update_teacher_presence_updated_at();

-- ==========================================
-- إنشاء teacher_presence للمعلمين والمدراء الحاليين
-- ==========================================

INSERT INTO public.teacher_presence (
    user_id,
    school_id,
    role,
    is_online,
    last_seen_at,
    total_time_minutes,
    created_at,
    updated_at
)
SELECT 
    user_id,
    school_id,
    role,
    false,
    now(),
    0,
    now(),
    now()
FROM public.profiles
WHERE role IN ('teacher', 'school_admin')
ON CONFLICT (user_id) DO NOTHING;