-- تحديث تواريخ إنشاء محتوى الصف الحادي عشر النصي
-- تعديل تاريخ الإنشاء ليكون قبل 55 يوم (شهر و25 يوم)

-- تحديث تواريخ الأقسام
UPDATE grade11_sections 
SET created_at = now() - interval '55 days',
    updated_at = now() - interval '55 days'
WHERE created_at IS NOT NULL;

-- تحديث تواريخ المواضيع
UPDATE grade11_topics 
SET created_at = now() - interval '55 days',
    updated_at = now() - interval '55 days'
WHERE created_at IS NOT NULL;

-- تحديث تواريخ الدروس
UPDATE grade11_lessons 
SET created_at = now() - interval '55 days',
    updated_at = now() - interval '55 days'
WHERE created_at IS NOT NULL;

-- تحديث تواريخ وسائط الدروس
UPDATE grade11_lesson_media 
SET created_at = now() - interval '55 days',
    updated_at = now() - interval '55 days'
WHERE created_at IS NOT NULL;