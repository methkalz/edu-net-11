

# خطة تنفيذ الفحص الأمني 13.4.2026

## ملخص العمليات

3 مراحل: migration واحد لقاعدة البيانات + تعديل ملفين في الكود + حذف مكتبة

---

## المرحلة 1: Migration قاعدة البيانات

### التغيير 1 — حذف سياسة USING(true) من bagrut_parsing_jobs
- **الوضع الحالي**: سياسة `"Service role can update all jobs"` — UPDATE — `USING(true), WITH CHECK(true)`
- **الإجراء**: `DROP POLICY`
- **للتراجع**: `CREATE POLICY "Service role can update all jobs" ON bagrut_parsing_jobs FOR UPDATE USING (true) WITH CHECK (true);`

### التغيير 2 — حذف سياسة WITH CHECK(true) من teacher_notifications
- **الوضع الحالي**: سياسة `"Allow insert from triggers and functions"` — INSERT — `WITH CHECK(true)`
- **الإجراء**: `DROP POLICY`
- **للتراجع**: `CREATE POLICY "Allow insert from triggers and functions" ON teacher_notifications FOR INSERT WITH CHECK (true);`

### التغيير 3 — تقييد Materialized View: superadmin_school_stats
- **الوضع الحالي**: لا توجد صلاحيات ممنوحة صراحة، لكنها مكشوفة عبر PostgREST API
- **الإجراء**: `REVOKE ALL` من PUBLIC/anon/authenticated + `GRANT SELECT` لـ service_role فقط
- **للتراجع**: `GRANT SELECT ON public.superadmin_school_stats TO authenticated;`

### التغيير 4 — تقييد Materialized View: student_current_streaks
- **الوضع الحالي**: مكشوفة عبر API، تُستخدم فقط من دالة `get_student_dashboard_stats` (SECURITY DEFINER)
- **الإجراء**: `REVOKE ALL` + `GRANT SELECT` لـ service_role فقط
- **للتراجع**: `GRANT SELECT ON public.student_current_streaks TO authenticated;`

### التغيير 5 — إنشاء secure_schools_view
- **الوضع الحالي**: جدول schools يكشف أعمدة Stripe (`stripe_customer_id`, `stripe_subscription_id`, `subscription_status`)
- **الإجراء**: إنشاء View يحتوي فقط على `id, name, city, plan, created_at, updated_at_utc` مع `security_invoker = on`
- **للتراجع**: `DROP VIEW IF EXISTS public.secure_schools_view;`

---

## المرحلة 2: تعديل الكود (ملفان)

### التغيير 6 — useGrade12Projects.ts (سطر 263)
- **الحالي**: `from('schools').select('name')`
- **الجديد**: `from('secure_schools_view').select('name')`
- **للتراجع**: إعادة `'schools'`

### التغيير 7 — useGrade10MiniProjects.ts (سطر 124)
- **الحالي**: `from('schools').select('name')`
- **الجديد**: `from('secure_schools_view').select('name')`
- **للتراجع**: إعادة `'schools'`

---

## المرحلة 3: حذف مكتبة jspdf

### التغيير 8 — package.json (سطر 85)
- **الحالي**: `"jspdf": "^3.0.1"` موجودة في dependencies
- **الإجراء**: حذف السطر
- **للتراجع**: إعادة إضافة `"jspdf": "^3.0.1"` إلى dependencies

---

## ملاحظات أمان

- الملفات التي تبقى تقرأ من `schools` مباشرة (SchoolManagement, SchoolAdminManagement, Dashboard, PackageManagement, TeacherContentSettingsForm, useTeacherPresence, useSecureOperations) — كلها تعمل بصلاحية **سوبر آدمن** حصراً ومحمية بسياسات RLS خاصة
- الـ View الآمن يرث RLS من الجدول الأصلي بفضل `security_invoker = on`

## التقنية

- Migration واحد يشمل التغييرات 1-5
- تعديل ملفين للتغييرات 6-7
- حذف سطر من package.json للتغيير 8
- سيتم إنشاء تقرير موثق في `/mnt/documents/`

