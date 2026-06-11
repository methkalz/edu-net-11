
## أ) تأكيد إصلاح البجروت

تم سدّ الثغرة في **كل سيناريوهات البجروت**:

| السيناريو | المسار | الحالة بعد الإصلاح |
|---|---|---|
| النشر من السوبر آدمن | `bagrut_exams.is_published=true` | لم يكن مصدر المشكلة — الامتحانات منشورة كمكتبة عامة للصفين 11/12 |
| رؤية المعلم لمحاولات الطلاب | `bagrut_attempts` SELECT | RLS الآن مقيّد بـ `teacher_classes → class_students` |
| تصحيح المعلم | `bagrut_attempts` UPDATE + `bagrut_question_grades` ALL | RLS الآن مقيّد لطلاب صفوفه فقط |
| Widget البجروت في الداشبورد | `useTeacherBagrutStats` | يصفّي على `student_id ∈ طلاب صفوف المعلم` + RLS طبقة ثانية |
| صفحة `/teacher/bagrut-exams` | نفس الـ hook | ✓ |
| صفحة `/bagrut-grading/:id` | `useBagrutGrading` + RLS | ✓ |
| مدير المدرسة | سياسات منفصلة | يبقى يرى مدرسته كاملة كما يجب |
| السوبر آدمن والطالب | بدون تغيير | ✓ |

أي معلم جديد بلا صفوف → 0 محاولات، 0 بانتظار التصحيح، مهما كانت الامتحانات المنشورة.

---

## ب) مشكلة "المتواجدون الآن" — نفس النمط بالضبط

### التشخيص

ثغرتان متطابقتان للبجروت:

**1) RLS مفتوحة على مستوى المدرسة:**

`student_presence`:
```
"Teachers can view student presence in their school"
USING: school_id = get_user_school_id() AND role IN ('teacher','school_admin','superadmin')
```
→ أي معلم يرى حضور كل طلاب المدرسة.

`class_students`:
```
"School members can view class enrollments"
USING: classes.school_id = get_user_school_id() OR superadmin
```
→ أي معلم يرى تسجيلات كل صفوف المدرسة، لذلك تظهر الصفوف في فلتر الـ widget (حادي عشر ب، الثاني عشر ج، علمي ب، إلخ).

`classes`: مقيّدة بشكل صحيح بـ `is_teacher_assigned_to_class` ✓ — هذه ليست المشكلة.

**2) `useStudentPresence.ts` يجلب بدون تصفية:**

السطر 69–97: يستعلم `student_presence` و `class_students` دون قيد `teacher_id`، فيستلم كل ما تسمح به RLS (= كل المدرسة).

### الحل

**Migration RLS:**
- استبدال سياسة SELECT على `student_presence` للمعلم: يرى فقط حضور الطلاب المرتبطين بصفوفه عبر `teacher_classes → class_students → students.user_id = student_presence.user_id`. مدير المدرسة/السوبر آدمن: سياسة منفصلة على مستوى المدرسة.
- استبدال سياسة SELECT على `class_students` للمعلم: مقيّدة بـ `is_teacher_assigned_to_class(auth.uid(), class_id)`. سياسة منفصلة لمدير المدرسة/السوبر آدمن/الطالب.
- إنشاء security-definer function `teacher_can_view_student_presence(p_user_id uuid)` لتجنب التكرار.

**تعديل `src/hooks/useStudentPresence.ts`:**
- إضافة قيد على `class_students` بصفوف المعلم فقط (`teacher_classes`).
- التأكد من أن قائمة الصفوف الظاهرة في الفلتر هي صفوف المعلم فقط.

---

## الملفات

1. **Migration** (RLS + helper function): `student_presence` و `class_students`.
2. **`src/hooks/useStudentPresence.ts`**: تصفية بصفوف المعلم على مستوى التطبيق.

هل أنفّذ؟
