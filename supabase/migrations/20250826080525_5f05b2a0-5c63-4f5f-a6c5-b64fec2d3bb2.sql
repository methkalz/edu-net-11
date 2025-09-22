-- إنشاء قسم "أساسيات الاتصال" في جدول question_bank_sections إذا لم يكن موجوداً
INSERT INTO question_bank_sections (id, title, description, created_at, updated_at)
VALUES (
    '0eaba634-48f2-4e7e-a8e4-e8593eee848b',
    'יסודות התקשורת - أساسيات الاتصال',
    'قسم أساسيات الاتصال للصف الحادي عشر',
    now(),
    now()
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    updated_at = now();

-- تحديث معرف القسم للأسئلة
UPDATE question_bank 
SET section_id = '0eaba634-48f2-4e7e-a8e4-e8593eee848b'
WHERE section_id = '677407de-9c20-43e1-a029-203764d992fd' 
  AND is_active = true;