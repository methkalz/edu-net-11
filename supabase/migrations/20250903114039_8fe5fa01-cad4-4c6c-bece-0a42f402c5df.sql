-- حذف جداول المشاريع المصغرة للصف العاشر نهائياً

-- حذف الجداول المترابطة أولاً
DROP TABLE IF EXISTS public.grade10_project_comments CASCADE;
DROP TABLE IF EXISTS public.grade10_project_revisions CASCADE;
DROP TABLE IF EXISTS public.grade10_project_tasks CASCADE;

-- حذف الجدول الرئيسي
DROP TABLE IF EXISTS public.grade10_projects CASCADE;

-- تنظيف أي دوال أو مراجع متعلقة (إذا وجدت)
-- لا توجد دوال محددة للمشاريع المصغرة في القائمة الحالية