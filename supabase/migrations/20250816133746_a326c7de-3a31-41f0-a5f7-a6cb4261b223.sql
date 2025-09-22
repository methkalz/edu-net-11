-- مسح جميع مدراء المدارس
DELETE FROM public.profiles WHERE role = 'school_admin';

-- مسح جميع المدارس
DELETE FROM public.schools;