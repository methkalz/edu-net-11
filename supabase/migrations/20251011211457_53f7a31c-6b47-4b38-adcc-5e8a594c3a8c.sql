-- تحديث section_name للأسئلة المستوردة سابقاً لتطابق القسم الصحيح
UPDATE question_bank
SET section_name = 'عناوين الشبكة وطرق تمثيل الأرقام في الشبكة'
WHERE grade_level = '11'
  AND section_name LIKE '%כתובות רשת%'
  AND (
    question_text LIKE '%IPv4%' 
    OR question_text LIKE '%MAC%'
    OR question_text LIKE '%النظام%'
    OR question_text LIKE '%Subnet%'
    OR question_text LIKE '%CIDR%'
    OR question_text LIKE '%IPv6%'
  );