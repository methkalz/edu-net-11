-- تصحيح معرف القسم للأسئلة الثلاثين
-- نقل الأسئلة من القسم الخطأ إلى القسم الصحيح "أساسيات الاتصال"
UPDATE question_bank 
SET section_id = '0eaba634-48f2-4e7e-a8e4-e8593eee848b'
WHERE section_id = '677407de-9c20-43e1-a029-203764d992fd' 
  AND is_active = true;