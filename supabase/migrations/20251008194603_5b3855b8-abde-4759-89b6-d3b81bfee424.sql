-- حذف جميع القوالب الموجودة حالياً
DELETE FROM exam_templates;

-- التأكد من أن جدول exam_templates يسمح للمعلمين بإنشاء قوالبهم الخاصة
-- (RLS policies موجودة بالفعل، هذا فقط للتوضيح)
COMMENT ON TABLE exam_templates IS 'كل معلم يمكنه إنشاء قوالبه الخاصة - لا توجد قوالب افتراضية';