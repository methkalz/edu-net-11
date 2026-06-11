
## التشخيص الدقيق — من أين تنبع المشكلة؟

المشكلة **ليست** من لحظة النشر من السوبر آدمن، ولا من إعداد امتحانات البجروت نفسها. النشر يضع الامتحان `is_published=true` ويربطه بصفوف (11/12) كما هو متوقع.

المشكلة الحقيقية في **مكانين** يعرضان بيانات على مستوى المدرسة كاملة بدون تقييد بصفوف المعلم:

### 1) خلل في سياسات RLS على `bagrut_attempts` و `bagrut_question_grades` (السبب الجذري)

السياسة الحالية على `bagrut_attempts`:
```
"Teachers can view student attempts from their school"
USING: profiles.role IN ('teacher','school_admin') AND profiles.school_id = bagrut_attempts.school_id
```

→ هذا يعني **أي معلم في المدرسة يرى كل محاولات كل الطلاب في المدرسة**، حتى لو لم يكن مرتبطاً بأي صف. نفس الخلل بالضبط على `bagrut_question_grades` (سياسة "Teachers can manage question grades from their school"). وهذا يخالف القاعدة الأساسية للمشروع: "Teacher class visibility: teachers see only assigned/created classes".

### 2) الاستعلام في الواجهة لا يصفّي حسب صفوف المعلم

`src/hooks/useTeacherBagrutStats.ts` (السطر 82–86):
```ts
.from('bagrut_attempts')
.eq('school_id', userProfile.school_id)
.in('exam_id', examIds);
```
ومثلها `src/hooks/useBagrutGrading.ts` (السطر 53–62): تصفّي بـ `exam_id` و `school_id` فقط.

نتيجة الخللين معاً: المعلم اشرف أبو الهيجا الجديد يفتح لوحته فيرى جميع محاولات طلاب المدرسة لكل امتحانات البجروت المنشورة لصف 11/12، ويرى "بانتظار التصحيح" حتى وإن لم يكن مسؤولاً عن أي صف.

ملاحظة: `bagrut_exams` ليست المشكلة — سياستها تعرض الامتحانات المنشورة لأي معلم وهذا مقبول كمكتبة عامة، لكن "إحصائيات المحاولات/التصحيح" يجب أن تُحسب من طلاب صفوف المعلم فقط.

---

## الحل

### أ) إصلاح RLS (الطبقة الأمنية الحقيقية)

استبدال السياستين على `bagrut_attempts` و `bagrut_question_grades` بحيث:

- **Teacher**: يرى/يصحّح فقط محاولات الطلاب المسجلين في صفوف مرتبطة به في `teacher_classes` (عبر `students.user_id = bagrut_attempts.student_id` → `class_students` → `teacher_classes.teacher_id = auth.uid()`).
- **School Admin**: يبقى على مستوى المدرسة كاملة (إشراف إداري).
- **Superadmin**: يبقى كما هو.
- **Student**: يبقى كما هو (`student_id = auth.uid()`).

سيتم إنشاء security-definer function (تجنّباً للوقوع في تكرار RLS) باسم:
```
public.teacher_can_access_bagrut_attempt(p_attempt_id uuid) RETURNS boolean
```
يفحص أن `auth.uid()` معلم مرتبط بأحد صفوف الطالب صاحب المحاولة، مع `SET search_path = public` وفلترة nulls.

### ب) إصلاح الاستعلامات في الواجهة

- `useTeacherBagrutStats.ts`: قبل جلب `bagrut_attempts`، احصل على قائمة `student_ids` الخاصة بصفوف المعلم (عبر RPC `get_students_for_teacher` الموجود مسبقاً، أو استعلام مباشر `teacher_classes` → `class_students` → `students.user_id`)، ثم أضف `.in('student_id', teacherStudentIds)` للاستعلام. للمعلم بدون صفوف: إرجاع stats فارغة فوراً.
- `useBagrutGrading.ts`: نفس التصفية بالإضافة إلى `school_id`. للـ school_admin لا نضيف هذا الفلتر (نميّز عبر `userProfile.role`).

### ج) (اختياري لاحقاً) "الامتحانات المتاحة" في الكروت

بقاء العدد يعكس المكتبة العامة المنشورة للصفين 11/12 مقبول. أما "إجمالي المحاولات / بانتظار التصحيح / متوسط العلامات" فستصبح صفراً تلقائياً للمعلم الجديد بعد التصفية أعلاه — وهو السلوك المطلوب.

---

## الملفات والتغييرات

1. **Migration جديدة** (RLS + helper function):
   - `CREATE OR REPLACE FUNCTION public.teacher_can_access_bagrut_attempt(...)` (SECURITY DEFINER, STABLE, search_path=public)
   - `DROP POLICY` ثم `CREATE POLICY` للسياستين على `bagrut_attempts` (SELECT + UPDATE) و `bagrut_question_grades` (ALL)، تفرّق بين teacher (مقيّد) و school_admin (مدرسة كاملة).

2. **`src/hooks/useTeacherBagrutStats.ts`**: إضافة تصفية بـ `student_id` ضمن طلاب صفوف المعلم.

3. **`src/hooks/useBagrutGrading.ts`**: إضافة نفس التصفية مع تمييز دور `school_admin`.

هل أنفّذ الإصلاح؟
