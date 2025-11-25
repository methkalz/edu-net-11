-- تصحيح امتحانات أحمد حصادية: إضافة grade_levels للامتحانات المنشأة بصفوف محددة
UPDATE exams 
SET grade_levels = ARRAY['11']
WHERE id IN (
  'ffa0c3bc-739c-4233-b67f-3085a1a902a5', 
  '355e6ad4-6394-4732-9557-e4052ec85bbf'
);