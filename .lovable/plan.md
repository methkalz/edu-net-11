# خطة إصلاح إعادة تعيين كلمة المرور في لوحة السوبر أدمن

## سبب المشكلة الحالية

الرابط الذي يصل بالإيميل لا يعمل لأن الكود في `UserManagement.tsx` يوجّه المستخدم إلى `/auth` بعد الضغط على الرابط:
```
redirectTo: `${window.location.origin}/auth`
```
لكن `/auth` لا يعالج رمز الاستعادة (`type=recovery`) الموجود في الـ hash، فيتم تجاهله ويعود المستخدم لصفحة الدخول العادية دون أي نموذج لتغيير كلمة المرور. المطلوب صفحة مخصصة `/reset-password` تلتقط الرمز وتستدعي `supabase.auth.updateUser({ password })`.

## ما سيتم تنفيذه

### 1) إصلاح رابط "إرسال رابط إعادة التعيين"
- إنشاء صفحة جديدة `src/pages/ResetPassword.tsx`:
  - تتحقق من وجود `type=recovery` في الـ URL hash
  - نموذج بسيط: كلمة مرور جديدة + تأكيدها + شروط قوة كلمة المرور
  - تستدعي `supabase.auth.updateUser({ password })`
  - عند النجاح: توست + تحويل إلى `/auth`
  - مسار عام (خارج حماية تسجيل الدخول)
- إضافة المسار في `src/App.tsx`: `<Route path="/reset-password" ... />`
- تعديل `UserManagement.tsx` (السطر 304) ليصبح:
  ```
  redirectTo: `${window.location.origin}/reset-password`
  ```
- تعديل `redirectTo` في أي مكان آخر يستخدم `resetPasswordForEmail` (إن وُجد) لنفس المسار

### 2) إضافة: تعيين كلمة مرور جديدة مباشرة من السوبر أدمن (بدون إيميل)
- إنشاء Edge Function جديدة: `supabase/functions/admin-set-user-password/index.ts`
  - تتحقق من JWT وأن المستدعي `superadmin` (عبر جدول `profiles`)
  - تستقبل `{ user_id, new_password }` مع تحقق Zod (طول أدنى 8، تعقيد معقول)
  - تستخدم `supabaseAdmin.auth.admin.updateUserById(user_id, { password })`
  - تسجل الحدث في `audit_log`
  - CORS + معالجة أخطاء
- في `src/pages/UserManagement.tsx`:
  - إضافة خيار جديد في قائمة الإجراءات: **"تعيين كلمة مرور جديدة"**
  - Dialog يحتوي على: حقلَي كلمة مرور جديدة + تأكيد، مؤشر قوة، زر إظهار/إخفاء
  - عند الحفظ: `supabase.functions.invoke('admin-set-user-password', ...)`
  - توست نجاح + إغلاق الحوار (لا تحديث للقائمة مطلوب)
  - منع تطبيقها على حسابات `superadmin` أخرى (نفس منطق حماية الحذف)

### 3) اعتبارات أمنية
- Edge Function تستخدم `SUPABASE_SERVICE_ROLE_KEY` داخلياً فقط، لا تُمرَّر من العميل
- التحقق من دور السوبر أدمن على الخادم قبل تنفيذ التغيير
- تسجيل كامل في `audit_log` (من غيّر كلمة مرور مَن ومتى)
- عدم عرض كلمة المرور في اللوجز

## الملفات المتأثرة

| ملف | الإجراء |
|---|---|
| `src/pages/ResetPassword.tsx` | جديد |
| `src/App.tsx` | إضافة Route عام |
| `src/pages/UserManagement.tsx` | تعديل redirectTo + إضافة Dialog وخيار الإجراء |
| `supabase/functions/admin-set-user-password/index.ts` | جديد |
| `supabase/config.toml` | تسجيل الدالة الجديدة (verify_jwt=false مع تحقق داخلي) |

## ملاحظة للمستخدم

قد يكون قالب إيميل الاستعادة الحالي في Supabase يستخدم رابطاً افتراضياً — بعد التعديل ستحتاج التأكد من أن Site URL و Redirect URLs في إعدادات Auth تسمح بـ `/reset-password` (سأنبهك في الرسالة بعد التنفيذ مع رابط مباشر لإعدادات Supabase).
