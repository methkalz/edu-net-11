-- تنظيف الأسئلة الوهمية (تصحيح أسماء الأعمدة)
DELETE FROM grade11_game_questions 
WHERE question_text LIKE '%خطأ الأول%' 
   OR question_text LIKE '%خطأ الثاني%' 
   OR question_text LIKE '%خطأ الثالث%'
   OR correct_answer LIKE '%خطأ%'
   OR (choices::text LIKE '%خطأ الأول%');

-- حذف المفاهيم الوهمية
DELETE FROM grade11_content_concepts 
WHERE concept_text LIKE '%خطأ%' 
   OR concept_text LIKE '%dummy%';

-- حذف الأسئلة المولدة الوهمية (تصحيح اسم العمود)
DELETE FROM grade11_generated_questions 
WHERE question_text LIKE '%خطأ%' 
   OR correct_answer LIKE '%خطأ%';