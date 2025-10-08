-- تنظيف المحاولات المعطوبة التي لا تحتوي على أسئلة
DELETE FROM exam_attempts 
WHERE id IN (
  '8d65ca12-7e3f-4fd1-b9a3-f25f056b1390',
  '84755237-ce0f-4027-8060-af24a35c5108'
);

-- تنظيف أي محاولات أخرى معطوبة (in_progress بدون أسئلة)
DELETE FROM exam_attempts
WHERE status = 'in_progress'
AND id NOT IN (
  SELECT DISTINCT attempt_id 
  FROM exam_attempt_questions
);