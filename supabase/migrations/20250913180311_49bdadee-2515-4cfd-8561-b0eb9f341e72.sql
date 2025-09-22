-- إزالة الـ trigger المُشكِل
DROP TRIGGER IF EXISTS update_students_updated_at ON public.students;

-- إضافة cascade delete من students إلى class_students
ALTER TABLE public.class_students 
DROP CONSTRAINT IF EXISTS class_students_student_id_fkey;

ALTER TABLE public.class_students 
ADD CONSTRAINT class_students_student_id_fkey 
FOREIGN KEY (student_id) 
REFERENCES public.students(id) 
ON DELETE CASCADE;

-- إضافة unique constraint لمنع duplicate emails في نفس المدرسة
ALTER TABLE public.students 
ADD CONSTRAINT unique_email_per_school 
UNIQUE (email, school_id);