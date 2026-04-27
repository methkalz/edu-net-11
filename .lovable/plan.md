# خطة إصلاح الثغرات الأمنية المتعلقة بالآدمن

## الثغرات المؤكدة بعد الفحص

### 🔴 1. ثغرة حرجة — `impersonate-user` Edge Function
**الملف:** `supabase/functions/impersonate-user/index.ts`

- لا يتحقق إطلاقاً من JWT المُرسل، يقرأ `adminUserId` من **body الطلب**.
- أي مستخدم مسجّل (طالب/معلم) يستطيع إرسال `adminUserId` لأي superadmin معروف، فيقوم Edge Function بإصدار **magic link جاهز للدخول** كأي مستخدم في النظام.
- نتيجة الاستغلال: استيلاء كامل على أي حساب (سيناريو privilege escalation كامل).

### 🟠 2. ثغرة متوسطة — `login-with-pin` Edge Function
**الملف:** `supabase/functions/login-with-pin/index.ts`

- نقطة عامة بلا أي rate-limiting.
- PIN من 6 أرقام (مليون احتمال) صالح 15 دقيقة → عرضة لـ brute force عبر سكربت بسيط.

### 🟠 3. مشكلة معمارية — ثقة بـ URL parameters للحالة الإدارية
**الملفات:** `AdminAccessBanner.tsx` (نسختان), `useImpersonation.ts`, `ImpersonationBanner.tsx`

- `?admin_access=true&impersonated=true` تستخدم لتحديد حالة "تصفح كمستخدم آخر"، لكن هذه قيم تجميلية فقط. الحماية الحقيقية على RLS موجودة، لكن البانر يمكن إخفاؤه بإزالة الـ query string.
- البديل الموجود `useImpersonation` يقرأ من `localStorage` ويُسبّب **حالة UI متضاربة** (الـ hook يعرض بيانات وهمية لمستخدم منتحَل بينما الجلسة الفعلية في Supabase تخص حساب الآدمن أو حساب الضحية).

### 🟡 4. حساسية في Audit log
- جميع الـ edge functions تستخدم `console.log` لطباعة معرفات المستخدمين. تفصيل بسيط لكن نُنظفه ضمن نفس التغيير.

---

## ما سيُنفّذ

### تغيير 1: تحصين `impersonate-user`
- إزالة `adminUserId` من الـ body بالكامل.
- استخراج المستدعي من `Authorization` header عبر `supabase.auth.getClaims(token)`.
- التحقق أن `claims.sub` يعود لمستخدم بـ `role = 'superadmin'` في `profiles` (مع `search_path` آمن).
- منع انتحال superadmin آخر (`targetUser.role !== 'superadmin'` أو على الأقل تسجيل المحاولة بمستوى CRITICAL).
- إبقاء واجهة الاستدعاء من العميل كما هي (نُحدّث `useImpersonation`/زر الانتحال ليستخدم session token تلقائياً عبر `supabase.functions.invoke` بدون تمرير `adminUserId`).

### تغيير 2: تحصين `login-with-pin` ضد brute force
- إضافة rate-limiting بسيط داخل الفانكشن: محاولة فاشلة تُسجَّل في جدول `pin_login_attempts` (نُنشئه عبر migration) مع `ip` و`attempted_at`.
- بعد 5 محاولات خاطئة من نفس IP خلال 10 دقائق → 429.
- إبقاء التدفق الناجح كما هو 100% (نفس الـ magic link، نفس الـ redirect).

### تغيير 3: إزالة الاعتماد على query params كمصدر حقيقة
- `AdminAccessBanner` (في `src/components/admin/` و`src/components/shared/`): تحويلها لقراءة الحالة من `useImpersonation` فقط، وإلغاء التحقق من `?admin_access=true` كـ "دليل" على الجلسة الإدارية. يُبقى البانر يظهر بصرياً فقط لأن RLS هو الحامي الفعلي.
- توحيد المنطق: حذف نسخة `src/components/shared/AdminAccessBanner.tsx` المكررة والإبقاء على نسخة `src/components/admin/` (موحّدة مع `ImpersonationBanner`).

### تغيير 4: تنظيف console.log من معرفات
- إزالة `console.log` التي تطبع `userId`/`pinCode` من الفانكشنز الثلاث، استبدال بسجلات عامة بدون PII.
- الاحتفاظ بـ `audit_log` كما هو (هذا الجدول هو السجل الرسمي).

---

## ما لن يُنفّذ (وأسبابه)

- ❌ تغيير منطق التصحيح/البجروت/PDF — لا علاقة لها بالأمان الإداري (قاعدة الذاكرة: precision critical).
- ❌ تعديل RLS policies الحالية على `profiles` — لا توجد ثغرة فيها (تم تأمينها سابقاً عبر `get_own_role()`).
- ❌ إزالة ميزة الانتحال — مطلوبة وظيفياً للسوبرآدمن.
- ❌ تعديل الـ build errors في Tiptap (`HTMLEmbed`/`GammaEmbed`) — موجودة قبل هذا الطلب وخارج نطاقه.

---

## التحقق بعد التنفيذ

1. **اختبار حقيقي للثغرة الأولى:** محاولة استدعاء `impersonate-user` بحساب طالب ممرّراً `adminUserId` لسوبرآدمن → يجب أن يعيد 401/403.
2. **اختبار PIN:** 6 محاولات خاطئة متتالية من نفس الجهاز → 429.
3. **تدفق ناجح:** سوبرآدمن يولّد PIN ويستخدمه/يدخل كمستخدم → يعمل بدون أي تغيير ظاهر.
4. **بانر الانتحال:** يظهر فقط أثناء جلسة انتحال حقيقية، ولا يظهر بإضافة `?admin_access=true` يدوياً.

---

## Migration مطلوبة (تغيير 2)

جدول واحد جديد:
```sql
CREATE TABLE public.pin_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  success boolean NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pin_attempts_ip_time ON public.pin_login_attempts(ip_address, attempted_at DESC);
ALTER TABLE public.pin_login_attempts ENABLE ROW LEVEL SECURITY;
-- لا policies = لا أحد يقرأ/يكتب من العميل، فقط service role من الفانكشن.
```

بدون أي تعديل على جداول الأعمال أو RLS الحالية.
