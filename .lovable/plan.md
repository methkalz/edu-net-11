## الهدف
تحويل نشر امتحانات البجروت من نشر مركزي (سوبر أدمن → طلاب مباشرة) إلى نظام طبقتين:
1. **السوبر أدمن** يُتيح الامتحان للمعلمين المؤهلين فقط (للمراجعة).
2. **المعلم** يراجع الامتحان والإجابات، ثم ينشره لكل صف من صفوفه بإعدادات مستقلة.
3. **الطالب** لا يرى الامتحان إلا عبر نشر معلمه لصفه.

---

## 1. تغييرات قاعدة البيانات

### إعادة دلالة الحقول الموجودة في `bagrut_exams`
- `is_published` → تعني الآن "مُتاح للمعلمين" فقط (لم يعد للطلاب).
- `available_for_grades` → يبقى كفلتر يحدد أي معلمين (حسب صفوف يدرّسونها) يحق لهم رؤية الامتحان.
- `available_from / available_until / show_answers_to_students / allow_review_after_submit / max_attempts` → **تُهمل** على مستوى الامتحان (تنتقل لطبقة المعلم) — تُحفظ كقيم افتراضية مقترحة فقط.

### جدول جديد: `bagrut_exam_publications`
نشر مستقل لكل (معلم × صف × امتحان):
- `exam_id`, `teacher_id`, `class_id` — `UNIQUE(exam_id, class_id)` لمنع نشرين متوازيين لنفس الصف.
- `available_from`, `available_until` (TIMESTAMPTZ)
- `max_attempts` (INT, افتراضي 1)
- `show_answers_to_students` (BOOL)
- `allow_review_after_submit` (BOOL)
- `is_active` (BOOL) — للإيقاف اليدوي بدون حذف
- `published_at`, `created_at`, `updated_at`, `notes`

### تعديل `bagrut_attempts`
- إضافة `publication_id UUID REFERENCES bagrut_exam_publications(id) ON DELETE SET NULL`.
- التحقق من `max_attempts` يصبح **لكل نشر** وليس لكل امتحان.

### تنظيف البيانات الموجودة (هجرة)
```sql
UPDATE bagrut_exams SET available_from = NULL, available_until = NULL;
-- المحاولات المنتهية تبقى محفوظة في bagrut_attempts كنتائج تاريخية.
```

### RLS الجديدة
- **`bagrut_exams` SELECT للمعلم**: `is_published=true` AND يوجد صف يدرّسه ضمن `available_for_grades`.
- **`bagrut_exam_publications`**:
  - معلم: `ALL` حيث `teacher_id = auth.uid()` ومالك للصف عبر `teacher_classes`.
  - طالب: `SELECT` فقط لنشر يضم صفه (عبر `class_students`) و`is_active=true` وضمن النافذة الزمنية.
  - سوبر أدمن/مدير مدرسة: قراءة كل النشرات في نطاقهم.
- **`bagrut_attempts` للطالب**: لا يستطيع البدء إلا إذا كان هناك نشر نشط ضمن النافذة الزمنية (دالة `security definer` تتحقق).
- **`bagrut_attempts` للمعلم**: قراءة المحاولات التي `publication_id` يخصه فقط.

### دوال `SECURITY DEFINER` (search_path=public)
- `can_student_access_bagrut_publication(_student uuid, _publication uuid) RETURNS boolean`
- `is_publication_owner(_teacher uuid, _publication uuid) RETURNS boolean`
- `teacher_can_view_bagrut_exam(_teacher uuid, _exam uuid) RETURNS boolean`

---

## 2. تغييرات الواجهة

### لوحة المعلم — صفحة "امتحانات البجروت"
أعمدة/أزرار لكل امتحان مُتاح:
- **مراجعة كاملة** (موجود) → نوسعه ليُظهر الأسئلة والإجابات والتفسيرات بوضع قراءة فقط مع تبويبات (أسئلة / إجابات نموذجية / إحصاءات).
- **زر "نشر/إدارة النشر"** → يفتح حواراً جديداً.

### حوار جديد `BagrutTeacherPublishDialog`
- يعرض قائمة صفوف المعلم المؤهلة (التي مستواها ضمن `available_for_grades`).
- لكل صف يختاره يفتح بطاقة إعدادات مستقلة:
  - تاريخ ووقت بداية/نهاية الإتاحة.
  - عدد المحاولات.
  - إظهار الإجابات للطلاب بعد التسليم.
  - السماح بمراجعة الأسئلة بعد التسليم.
  - ملاحظات (اختياري).
- زر "تطبيق على كل الصفوف المختارة" لنسخ الإعدادات.
- يعرض النشرات السابقة لنفس الامتحان بإمكانية تعديل/إيقاف/تمديد/حذف.

### في صفحة المعلم — تبويب جديد "النشرات النشطة"
جدول يبين: الامتحان | الصف | النافذة الزمنية | المحاولات المُقدّمة / المتبقية | بانتظار التصحيح | حالة (نشط/منتهي/متوقف) + إجراءات (تمديد/إيقاف/إعادة فتح).

### لوحة الطالب
- `useStudentBagrutExams` يُعاد بناؤه ليستعلم من `bagrut_exam_publications` بدلاً من `bagrut_exams` مباشرة.
- يربط كل بدء محاولة بـ `publication_id`.

### لوحة السوبر أدمن
- زر "نشر للطلاب" → يُغيّر إلى **"إتاحة للمعلمين"** مع توضيح أن الطلاب لا يرون الامتحان إلا بعد نشر المعلم.
- إزالة حقول التاريخ والمحاولات من حوار النشر (تنتقل للمعلم).
- يبقى اختيار الصفوف المستهدفة (`available_for_grades`).

---

## 3. سيناريوهات حرجة وكيفية التعامل

| السيناريو | السلوك |
|---|---|
| السوبر أدمن يُلغي إتاحة امتحان | كل النشرات تبقى لكن `bagrut_exams.is_published=false` يُعطّل وصول الطلاب (تحقق في الـRLS عبر JOIN). |
| المعلم يحذف نشراً | إن وُجدت محاولات → منع الحذف (تأكيد عبر **حوار التطبيق**، لا alert) واقتراح "إيقاف" بدلاً منه. المحاولات تُحفظ كنتائج تاريخية. |
| الطالب بدأ محاولة ثم انتهت النافذة الزمنية | يُسمح بإتمام المحاولة الجارية، يُمنع بدء محاولات جديدة. |
| تمديد التاريخ بعد انتهائه | يفتح المحاولات مجدداً ضمن `max_attempts`. |
| نقل طالب بين صفوف | يرى نشر صفه الحالي فقط؛ نتائجه السابقة تبقى مرتبطة بـ `publication_id` الأصلي. |
| نفس الامتحان لصفين مختلفين عند نفس المعلم | نشران منفصلان بإعدادات مستقلة. |
| التصحيح | المعلم يرى فقط محاولات نشراته (RLS عبر `publication_id`). |
| الإحصاءات في `useTeacherBagrutStats` و`BagrutWidget` | تُحسب على مستوى `publication_id` لا `exam_id`. |

---

## 4. ملفات ستتغيّر (تقدير)
- **DB**: مهجرة واحدة تنشئ الجدول، الفهارس، RLS، الدوال، والتنظيف.
- **Frontend**:
  - جديد: `src/components/bagrut/BagrutTeacherPublishDialog.tsx`, `src/components/bagrut/TeacherExamFullReview.tsx`, `src/components/bagrut/TeacherPublicationsList.tsx`, `src/hooks/useBagrutPublications.ts`.
  - تعديل: `BagrutPublishDialog.tsx` (للسوبر أدمن — تبسيط), `useStudentBagrutExams.ts`, `useBagrutAttempt.ts`, `useTeacherBagrutStats.ts`, `BagrutWidget.tsx`, `pages/teacher/TeacherBagrutExams.tsx`, `pages/StudentBagrutExams.tsx`, `pages/BagrutGradingPage.tsx`, `TeacherExamPreviewDialog.tsx`.
- **Edge function** (إن لزم): تحديث `check-bagrut-job` لا شيء؛ لا حاجة لدوال جديدة (المنطق RLS + Postgres functions).

---

## 5. الذاكرة
عند الإتمام: تحديث `mem://features/bagrut-management/publication-system` لتعكس النموذج الجديد ثنائي الطبقات.

---

هل أبدأ التنفيذ بهذا التصميم؟