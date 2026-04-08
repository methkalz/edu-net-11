

# تقرير الفحص الأمني الشامل — تحليل كل عملية وتأثيرها

---

## المنهجية

تم فحص جميع سياسات RLS، الدوال، الـ Views، و Edge Functions. لكل ثغرة مكتشفة، تم تتبع **كل مكان في الكود يتعامل معها** لضمان عدم تأثر أي عملية.

---

## الثغرة 1: تغيير الدور في جدول profiles (حرجة جداً)

### الوضع الحالي
سياسة `"Users can update their own profile"` تسمح لأي مستخدم بتعديل **كل الحقول** بما فيها `role`:
```text
FOR UPDATE USING (user_id = auth.uid())  -- بدون WITH CHECK
```

### العمليات التي تُحدّث profiles حالياً (11 مكان):

| الملف | ما يُحدّثه | من يستخدمه | هل يُحدّث role؟ |
|---|---|---|---|
| `useAuth.tsx` سطر 185 | `last_login_at`, `login_count` | كل مستخدم لنفسه | لا |
| `useAuth.tsx` سطر 413 | `last_login_at`, `login_count` | كل مستخدم لنفسه | لا |
| `useUserAvatar.ts` سطر 143 | `avatar_url` | كل مستخدم لنفسه | لا |
| `useUserAvatar.ts` سطر 260 | `avatar_url` | معلم/آدمن لنفسه | لا |
| `SchoolAdminManagement.tsx` سطر 155 | `full_name`, `phone`, `school_id` | سوبر آدمن لمدير مدرسة | لا |
| `SchoolManagement.tsx` سطر 453 | `role`, `full_name`, `school_id`, `is_primary_admin` | سوبر آدمن عند إنشاء مدرسة جديدة | **نعم** |
| `TeacherManagement.tsx` سطر 444 | `full_name`, `email`, `phone` | مدير مدرسة/سوبر آدمن لمعلم | لا |
| `UserRoleManager.tsx` سطر 142 | `role` | سوبر آدمن | **نعم** |
| `UserManagement.tsx` سطر 319 | `is_active` | سوبر آدمن | لا |
| `UserManagement.tsx` سطر 339 | `is_active` | سوبر آدمن | لا |
| `UserManagement.tsx` سطر 447 | `full_name`, `phone`, `role` | سوبر آدمن | **نعم** |

### التحليل
- **3 أماكن** تُحدّث حقل `role`: كلها تعمل بصلاحية **سوبر آدمن** (يملك سياسة `ALL` خاصة به)
- **8 أماكن** تُحدّث حقول أخرى (اسم، هاتف، صورة، آخر دخول): تعمل بسياسة `"Users can update their own profile"`
- المشكلة: سياسة `"Users can update their own profile"` بدون `WITH CHECK` **تسمح لأي طالب أو معلم بتغيير دوره**

### الإصلاح المقترح
```sql
DROP POLICY "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE 
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid() 
    AND role = (SELECT p.role FROM profiles p WHERE p.user_id = auth.uid())
  );
```

### تحليل التأثير
- المستخدم العادي: يستطيع تعديل `full_name`, `avatar_url`, `phone`, `last_login_at`, `login_count` — **لا يتأثر**
- المستخدم العادي يحاول تغيير `role`: **يُمنع** (هذا هو الهدف)
- السوبر آدمن يغيّر دور أي مستخدم: يستخدم سياسة `"Superadmins can manage all profiles"` (ALL) — **لا يتأثر**
- `SchoolManagement.tsx` سطر 453: يعمل بجلسة سوبر آدمن → يمر عبر سياسة Superadmin ALL → **لا يتأثر**

**ملاحظة تقنية**: الـ `WITH CHECK` يُقارن قيمة `role` في الصف **بعد التحديث** مع قيمته **الحالية**. إذا لم يتغير الـ `role`، الشرط يتحقق. إذا تغيّر، يُرفض. هذا نمط معتمد من Supabase.

**تحذير من Infinite Recursion**: هذا الشرط `SELECT p.role FROM profiles p WHERE p.user_id = auth.uid()` قد يسبب recursion لأنه يقرأ من نفس الجدول `profiles`. الحل: استخدام دالة `SECURITY DEFINER`:

```sql
CREATE OR REPLACE FUNCTION get_own_role()
RETURNS app_role
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE user_id = auth.uid()
$$;

-- ثم في السياسة:
WITH CHECK (user_id = auth.uid() AND role = get_own_role());
```

---

## الثغرة 2: سياسة `Service role bypass for students` (حرجة)

### الوضع الحالي
```text
"Service role bypass for students" — FOR ALL, USING (true), WITH CHECK (true)
```

### السياسات الأخرى الموجودة على `students`:
1. `"School admins can manage their school students"` — ALL — school_id = get_user_school_id() AND role IN (school_admin, superadmin)
2. `"School members can view their school students"` — SELECT — school_id = get_user_school_id() OR superadmin
3. `"Students can view their own record"` — SELECT — user_id = auth.uid()
4. `"Teachers can add and manage students in their school"` — ALL — school_id match + role IN (teacher, school_admin, superadmin)

### تحليل التأثير عند حذف السياسة الخطيرة
- **المعلم** يقرأ/يعدل/يحذف طلاب مدرسته: سياسة #4 تغطيه — **لا يتأثر**
- **مدير المدرسة** يدير طلاب مدرسته: سياسة #1 تغطيه — **لا يتأثر**
- **السوبر آدمن**: سياسة #1 تشمل superadmin — **لا يتأثر**
- **الطالب** يرى بياناته: سياسة #3 تغطيه — **لا يتأثر**
- **Edge Functions** (تستخدم service_role_key): تتجاوز RLS تلقائياً — **لا تتأثر**

**الخلاصة: الحذف آمن 100%**

---

## الثغرة 3: سياسة `Service role bypass for class_students` (حرجة)

### السياسات الأخرى الموجودة:
1. `"School members can view class enrollments"` — SELECT — class belongs to user's school OR superadmin
2. `"Students can view their own class enrollments"` — SELECT — student_id check
3. `"Teachers and admins can manage class enrollments"` — ALL — class in school + role IN (teacher, school_admin, superadmin)

### تحليل التأثير عند الحذف
- **المعلم** يضيف/يحذف طالب من صف: سياسة #3 — **لا يتأثر**
- **مدير المدرسة**: سياسة #3 — **لا يتأثر**
- **السوبر آدمن**: سياسة #3 تشمل superadmin — **لا يتأثر**
- **الطالب** يرى صفوفه: سياسة #2 — **لا يتأثر**

**الخلاصة: الحذف آمن 100%**

---

## الثغرة 4: سياسة `System can manage student points` (حرجة)

### الوضع الحالي
```text
FOR ALL, USING (true), WITH CHECK (true)
```
السياسة الأخرى: `"Students can view their own points"` — SELECT — student_id = auth.uid()

### من يكتب في هذا الجدول؟
- **لا يوجد أي كود في `src/`** يكتب مباشرة لهذا الجدول
- **لا توجد Edge Function** تكتب له
- الاستنتاج: يُكتب فيه عبر **Triggers** أو **Database Functions** وهذه تعمل بصلاحيات `SECURITY DEFINER` فتتجاوز RLS

### تحليل التأثير عند الحذف
- الطالب يقرأ نقاطه: سياسة SELECT موجودة — **لا يتأثر**
- الكتابة عبر الدوال/Triggers: تتجاوز RLS — **لا تتأثر**
- بدون هذه السياسة: أي هاكر كان يستطيع منح نفسه نقاط — **يُغلق**

**الخلاصة: الحذف آمن 100%. لكن نحتاج إضافة سياسة SELECT للمعلم/الآدمن:**
```sql
CREATE POLICY "School staff can view student points"
ON student_unified_points FOR SELECT
USING (get_user_role() IN ('teacher', 'school_admin', 'superadmin'));
```

---

## الثغرة 5: سياسة `System can manage activity stats` (حرجة)

### من يكتب في `daily_activity_stats`؟
- Edge Function `calculate-daily-stats`: تستخدم `service_role_key` → تتجاوز RLS تلقائياً
- Database Function `calculate_daily_activity_stats`: هي `SECURITY DEFINER` → تتجاوز RLS
- الكود في `src/`: فقط **قراءة** في `useAdvancedStudentStats.ts`

### السياسات الأخرى:
1. `"School members can view their school activity stats"` — SELECT — school_id match
2. `"السوبر أدمن يمكنه قراءة جميع الإحص..."` — SELECT — superadmin check

### تحليل التأثير عند الحذف
- القراءة: مغطاة بالسياستين 1 و 2 — **لا تتأثر**
- الكتابة عبر Edge Function/DB Function: تتجاوز RLS — **لا تتأثر**

**الخلاصة: الحذف آمن 100%**

---

## الثغرة 6: سياسات Debug على `grade12_project_comments`

### السياسات المكتشفة:
- `simple_select_test` — SELECT — أي مستخدم مصادق
- `simple_insert_test` — INSERT — أي مستخدم مصادق
- `simple_update_test` — UPDATE — أي مستخدم مصادق

### السياسات الحقيقية الموجودة:
سياسة `"Teachers can view project comments in their authorized scope"` تغطي القراءة والكتابة حسب الدور.

### تحليل التأثير عند الحذف
هذه سياسات اختبار فقط. حذفها يترك السياسة الحقيقية تعمل — **لا يتأثر شيء**

---

## الثغرة 7: الـ Views الأربعة (SECURITY DEFINER)

### الاستخدام في الكود:
- `grade11_content_stats`: **غير مستخدم** في أي ملف تطبيق
- `grade11_student_content_summary`: **غير مستخدم**
- `teacher_assigned_grades`: **غير مستخدم** مباشرة (يظهر فقط في `types.ts` كعلاقة)
- `teacher_projects_view`: **غير مستخدم** مباشرة

### تحليل التأثير عند التحويل لـ SECURITY INVOKER
بما أنها غير مستخدمة مباشرة، التحويل آمن 100%. إذا استُخدمت مستقبلاً، ستحترم RLS تلقائياً.

---

## الثغرة 8: Edge Functions بدون JWT (5 دوال)

| الدالة | `verify_jwt` | من يستدعيها |
|---|---|---|
| `parse-bagrut-exam` | false | سوبر آدمن فقط (من BagrutManagement) |
| `fix-true-false-questions` | false | سوبر آدمن فقط (من TrueFalseFixPage) |
| `check-bagrut-job` | false | سوبر آدمن (بعد parse) |
| `track-login` | false | useAuth عند تسجيل الدخول |
| `create-google-doc` | false | المعلمين |

### تحليل التأثير عند تفعيل JWT
- `track-login`: يحتاج إضافة Authorization header في `useAuth.tsx` — **تغيير بسيط**
- الباقي: `supabase.functions.invoke()` يُرسل الـ JWT تلقائياً — **لا حاجة لتعديل الكود**

---

## الثغرة 9: دوال بدون `search_path` (~20 دالة)

إضافة `SET search_path = public` هو تغيير بنيوي لا يؤثر على أي منطق. يُنفذ بـ `ALTER FUNCTION`.

---

## ملخص القرار النهائي

| التغيير | آمن؟ | يؤثر على عملية؟ | ملاحظة |
|---|---|---|---|
| حماية `role` في profiles | نعم | لا | سوبر آدمن يمر عبر سياسته الخاصة |
| حذف bypass students | نعم | لا | 4 سياسات أخرى تغطي الجميع |
| حذف bypass class_students | نعم | لا | 3 سياسات أخرى تغطي الجميع |
| حذف bypass student_points | نعم | لا | الكتابة عبر triggers فقط |
| حذف bypass daily_stats | نعم | لا | الكتابة عبر Edge/DB functions |
| حذف debug policies | نعم | لا | سياسات اختبار غير مطلوبة |
| تحويل Views | نعم | لا | غير مستخدمة مباشرة |
| تفعيل JWT على Edge Functions | نعم | `track-login` يحتاج header | تغيير سطر واحد |
| إضافة search_path | نعم | لا | لا يغير المنطق |

### خطة التنفيذ (مرحلتين)

**المرحلة 1 — Migration واحد** (قاعدة البيانات):
1. إنشاء دالة `get_own_role()` بـ SECURITY DEFINER
2. استبدال سياسة تعديل profiles بسياسة تمنع تغيير الدور
3. حذف 4 سياسات `USING (true)`
4. حذف 3 سياسات debug
5. تحويل 4 Views إلى SECURITY INVOKER
6. إضافة `search_path = public` للدوال المكشوفة
7. إضافة سياسة SELECT على `student_unified_points` للمعلمين/المدراء

**المرحلة 2 — ملفات الكود**:
8. تعديل `supabase/config.toml` لتفعيل JWT
9. إضافة Auth header في `track-login` invocation

**إجمالي: migration واحد + تعديل ملفين**

