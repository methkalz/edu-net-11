-- ===== نقل محتوى "أساسيات الاتصال" من الصف الحادي عشر إلى العاشر =====

-- الخطوة 1: حذف البيانات القديمة من الصف العاشر
DELETE FROM grade10_lesson_media 
WHERE lesson_id IN (
  SELECT l.id FROM grade10_lessons l
  JOIN grade10_topics t ON t.id = l.topic_id
  WHERE t.section_id = '0c1a9fe8-bb9b-4c73-b026-76f96ac7a227'
);

DELETE FROM grade10_lessons 
WHERE topic_id IN (
  SELECT id FROM grade10_topics 
  WHERE section_id = '0c1a9fe8-bb9b-4c73-b026-76f96ac7a227'
);

DELETE FROM grade10_topics 
WHERE section_id = '0c1a9fe8-bb9b-4c73-b026-76f96ac7a227';

-- الخطوة 2: نسخ البيانات من الصف الحادي عشر مع الحفاظ على العلاقات
DO $$
DECLARE
  topic_rec RECORD;
  lesson_rec RECORD;
  new_topic_id UUID;
  new_lesson_id UUID;
BEGIN
  -- نسخ المواضيع مع تتبع الـ IDs
  FOR topic_rec IN 
    SELECT id as old_id, title, content, order_index
    FROM grade11_topics 
    WHERE section_id = '0eaba634-48f2-4e7e-a8e4-e8593eee848b'
    ORDER BY order_index
  LOOP
    new_topic_id := gen_random_uuid();
    
    -- إدراج الموضوع الجديد
    INSERT INTO grade10_topics (id, section_id, title, content, order_index, created_at, updated_at)
    VALUES (
      new_topic_id,
      '0c1a9fe8-bb9b-4c73-b026-76f96ac7a227',
      topic_rec.title,
      topic_rec.content,
      topic_rec.order_index,
      NOW(),
      NOW()
    );
    
    -- نسخ الدروس لهذا الموضوع
    FOR lesson_rec IN
      SELECT id as old_id, title, content, order_index, is_active
      FROM grade11_lessons
      WHERE topic_id = topic_rec.old_id
      ORDER BY order_index
    LOOP
      new_lesson_id := gen_random_uuid();
      
      -- إدراج الدرس الجديد
      INSERT INTO grade10_lessons (id, topic_id, title, content, order_index, is_active, created_at, updated_at)
      VALUES (
        new_lesson_id,
        new_topic_id,
        lesson_rec.title,
        lesson_rec.content,
        lesson_rec.order_index,
        COALESCE(lesson_rec.is_active, true),
        NOW(),
        NOW()
      );
      
      -- نسخ الوسائط لهذا الدرس
      INSERT INTO grade10_lesson_media (id, lesson_id, media_type, file_path, file_name, order_index, metadata, created_at)
      SELECT 
        gen_random_uuid(),
        new_lesson_id,
        media_type,
        file_path,
        file_name,
        order_index,
        metadata,
        NOW()
      FROM grade11_lesson_media
      WHERE lesson_id = lesson_rec.old_id
      ORDER BY order_index;
    END LOOP;
  END LOOP;
END $$;