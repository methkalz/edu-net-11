-- حذف النقاط الحالية للطالب محمد السالم
DELETE FROM student_unified_points 
WHERE student_id = '17b3f5b1-5c3f-432c-abe8-5ef7bbe6d324';

-- إضافة 299 نقطة لاختبار الانتقال إلى 300
INSERT INTO student_unified_points (student_id, points_value, source_type, source_id, content_type, description)
VALUES ('17b3f5b1-5c3f-432c-abe8-5ef7bbe6d324', 299, 'manual', gen_random_uuid(), 'adjustment', 'اختبار الاحتفال - تعيين 299 نقطة');