

# خطة التنفيذ المصححة — تأمين جدول students

## المرحلة 1: تعديل RLS على جدول students (بدون تغيير)

```sql
-- حذف السياسة الواسعة الخطيرة
DROP POLICY "School members can view their school students" ON public.students;

-- حذف السياسة المكررة
DROP POLICY "Users can view their own student record" ON public.students;

-- سياسة للطاقم فقط
CREATE POLICY "Staff can view school students" ON public.students
FOR SELECT TO authenticated
USING (
  (school_id = get_user_school_id() 
   AND get_user_role() IN ('teacher'::app_role, 'school_admin'::app_role))
  OR get_user_role() = 'superadmin'::app_role
);

-- "Students can view their own record" تبقى كما هي
```

## المرحلة 2: إنشاء View آمن (مصحح حسب ملاحظة الخبير)

```sql
-- View بدون security_invoker — يتجاوز RLS لكن مقيد بـ WHERE
CREATE OR REPLACE VIEW public.secure_students_view AS 
SELECT id, full_name, school_id, created_at_utc 
FROM public.students
WHERE school_id = get_user_school_id();

GRANT SELECT ON public.secure_students_view TO authenticated;
```

**لماذا هذا أفضل**: الـ View يعمل بصلاحيات مالكه (يتجاوز RLS)، لكن `WHERE school_id = get_user_school_id()` يضمن أن كل مستخدم يرى فقط طلاب مدرسته. لا يوجد email أو phone في الأعمدة المختارة. جاهز للوحة متصدرين مستقبلية.

## المرحلة 3: لا تغييرات في الكود

لا يوجد أي مكون طلابي يقرأ بيانات طلاب آخرين حالياً.

## الملفات المتأثرة
- Migration جديد واحد فقط (SQL)
- صفر تغييرات في ملفات TypeScript

## التأثير
- سوبر آدمن / مدير / معلم: بدون تغيير
- طالب: يرى سجله فقط من `students`، يرى أسماء زملاء مدرسته من `secure_students_view` (بدون PII)

