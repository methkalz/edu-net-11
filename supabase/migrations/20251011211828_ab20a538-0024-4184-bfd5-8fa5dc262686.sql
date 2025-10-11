-- حذف الأسئلة القديمة التي تحتوي على القسم بالعبري والعربي
DELETE FROM question_bank
WHERE section_name LIKE '%כתובות רשת%'
  AND grade_level = '11';

-- حذف القسم من جدول grade11_sections إذا كان موجوداً
DELETE FROM grade11_sections
WHERE title LIKE '%כתובות רשת%'
  OR title = 'כתובות רשת - עناוין الشبكة وטرق תמثيל الأرقام';