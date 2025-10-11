-- حذف جداول نظام الاختبارات الإلكترونية بالكامل

-- حذف الجداول بالترتيب الصحيح (من التابع إلى الأساسي)
DROP TABLE IF EXISTS public.exam_attempt_questions CASCADE;
DROP TABLE IF EXISTS public.exam_attempts CASCADE;
DROP TABLE IF EXISTS public.exam_questions CASCADE;
DROP TABLE IF EXISTS public.teacher_exams CASCADE;
DROP TABLE IF EXISTS public.question_bank CASCADE;
DROP TABLE IF EXISTS public.exams CASCADE;
DROP TABLE IF EXISTS public.exam_templates CASCADE;
DROP TABLE IF EXISTS public.exercise_attempts CASCADE;
DROP TABLE IF EXISTS public.exercises CASCADE;

-- حذف الأنواع المخصصة إذا كانت موجودة
DROP TYPE IF EXISTS public.question_type CASCADE;
DROP TYPE IF EXISTS public.question_difficulty CASCADE;