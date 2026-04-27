# خطة التنفيذ — 4 تحسينات مؤكدة وآمنة

هذه التحسينات **آمنة** ولا تمس منطق التصحيح أو البجروت أو RLS. لا تغييرات في قاعدة البيانات.

---

## 1. تنظيف Console Logs الحساسة في `useAuth.tsx`

**المشكلة:** يتم طباعة `user.id` ومعلومات تسجيل الدخول في console المتصفح بشكل مكشوف (أسطر ~157-200) — تظهر حتى في الإنتاج.

**الإجراء:**
- إزالة جميع `console.log('🔵 ...')` و `console.error('🔴 ...')` من تتبع تسجيل الدخول.
- استبدال الأخطاء فقط بـ `logger.error(...)` من `@/lib/logger` (موجود بالفعل ولا يطبع IDs في الإنتاج).
- الإبقاء على المنطق الوظيفي (تحديث `login_count` و `last_login_at`) كما هو دون تغيير.

---

## 2. توحيد عرض HTML عبر `SafeHtml`

**المشكلة:** 18 ملف يستخدم `dangerouslySetInnerHTML` مباشرة بدل مكون `SafeHtml` الموجود (الذي يستخدم DOMPurify).

**الإجراء (دفعة آمنة فقط):** استبدال الاستخدامات في الملفات المتعلقة بعرض محتوى المستخدم/الدروس فقط:
- `src/components/content/Grade10LessonContentDisplay.tsx`
- `src/components/content/Grade11LessonContentDisplay.tsx`
- `src/components/student/ComputerStructureLessons.tsx`

**استثناءات (لا تُمس):**
- `chart.tsx` — ينتج CSS داخلي موثوق (shadcn).
- `HTMLEmbedWrapper.tsx`, `GammaEmbedWrapper.tsx` — تستخدم `srcdoc` ضمن iframes معزولة (سياسة الذاكرة الحالية).
- محررات Tiptap/A4 — تتعامل مع HTML أثناء التحرير وليس العرض فقط.
- `SafeHtml.tsx` نفسه.

---

## 3. حماية المسارات بـ `ErrorBoundary` على مستوى Suspense

**المشكلة:** `App.tsx` يحتوي على `ErrorBoundary` خارجي واحد فقط، فأي خطأ داخل صفحة lazy-loaded يُسقط الشاشة بأكملها.

**الإجراء:**
- لف `<Suspense>` الداخلي في `App.tsx` (السطر ~101) داخل `<ErrorBoundary>` إضافي مع `SimpleErrorBoundary` (موجود بالفعل في `src/lib/error-boundary.tsx`) حتى يبقى الـ Header/Providers يعمل عند فشل صفحة واحدة.
- لا تغييرات في `error-boundary.tsx` نفسه.

---

## 4. إصلاح warning الـ `forwardRef` في `BagrutSectionSelector`

**المشكلة (من console logs الحالية):** `Badge` يُستخدم داخل مكون يحاول تمرير `ref` إليه — يولّد warnings متكررة في console.

**الإجراء:**
- فحص `src/components/ui/badge.tsx` وإذا كان function component بدون `forwardRef`، تحويله إلى `React.forwardRef` (تغيير ميكانيكي بسيط، شائع في shadcn).
- لا تغيير في API الاستخدام.

> ملاحظة: الادعاء الأصلي في التقرير حول `JSON.stringify` في `useEffect` بـ `Grade11Content.tsx` لم يتأكد بدقة في الملف. استبدلته بإصلاح warning حقيقي ظاهر في console الآن وأكثر فائدة.

---

## ما لن يُنفّذ (وأسبابه)

- ❌ تعديل `AdminAccessBanner` URL params — RLS يحمي البيانات فعلاً.
- ❌ تعديل imports الخاصة بـ `lucide-react` — Vite يعالج tree-shaking تلقائياً.
- ❌ تقسيم `ExamsWidget.tsx` (3252 سطر) — refactor كبير ومخاطر عالية، يحتاج جلسة منفصلة.
- ❌ استبدال 586 `: any` — مشروع ضخم منفصل.
- ❌ أي تعديل على منطق التصحيح/البجروت/PDF comparison (قاعدة الذاكرة: precision critical).

---

## التحقق بعد التنفيذ

1. تسجيل دخول/خروج → التأكد من غياب IDs في console.
2. زيارة درس Grade 10/11 → التأكد من عرض المحتوى المنسق كما هو.
3. فتح `/student/bagrut-attempt/...` → غياب warning الـ Badge.
4. لا أخطاء جديدة في console.
