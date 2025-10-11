-- تحديث اسم القسم للأسئلة المستوردة ليطابق القسم الموجود في grade11_sections
UPDATE question_bank 
SET section_name = 'יסודות התקשורת - أساسيات الاتصال'
WHERE section_name = 'أساسيات الاتصال' 
  AND grade_level = '11'
  AND is_active = true;