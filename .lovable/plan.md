# خطة تنفيذ لعبة المعرفة للصف العاشر

## الهدف
فصل لعبة المعرفة للصف العاشر عن الحادي عشر بنسخة مستقلة كاملة، مع:
- استبعاد بطاقات "حذف" والبطاقات الوهمية (placeholders)
- إصلاح العناوين المكررة/الناقصة مثل "مقدمة" و"مقدمه افتار"
- ترتيب صحيح: قسم ← موضوع ← درس
- فتح البطاقات واحدة تلو الأخرى حسب التسلسل (نفس سيستم الحادي عشر)

## الأرقام المتوقعة
- الحادي عشر: 28 بطاقة (بدون تغيير)
- العاشر بعد التنفيذ: 17 بطاقة نظيفة ومرتبة

---

## المرحلة 1 — Migration: تجهيز جداول الصف العاشر

استخدام `supabase--migration` لـ:

1. مطابقة `grade10_sections` / `grade10_topics` / `grade10_lessons` مع نظيراتها بالحادي عشر (إضافة أعمدة ناقصة مثل `media`, `media_metadata`, `order_index` إذا لزم).
2. مطابقة `grade10_game_questions` مع `grade11_game_questions` (نفس الأعمدة: `lesson_id`, `question_text`, `choices`, `correct_answer`, `difficulty_level`, `points`, `explanation`).
3. إنشاء `grade10_content_games` (لربط الألعاب لاحقاً إن لزم).
4. سياسات RLS: قراءة عامة للطلاب، تعديل لـ Superadmin/School Admin/Teacher حسب النمط المتبع في الحادي عشر.

> ملاحظة: لا أي تغيير على جداول الحادي عشر.

---

## المرحلة 2 — نسخ المحتوى (SQL Data Migration)

ضمن نفس الـ migration أو insert tool، نسخ مرتب باستخدام جدول mapping (old_id → new_id):

1. **Sections**: نسخ كل `grade11_sections` → `grade10_sections` بحفظ `order_index`.
2. **Topics**: نسخ كل `grade11_topics` → `grade10_topics` مع ربط `section_id` الجديد، حفظ `order_index`.
3. **Lessons**: نسخ من `grade11_lessons` → `grade10_lessons` مع:
   - استبعاد: `WHERE TRIM(title) NOT ILIKE 'حذف%'`
   - استبعاد UUIDs الوهمية (`aaaaaaaa-...`, `bbbbbbbb-...`, إلخ)
   - إصلاح العنوان: إذا كان `title IN ('مقدمة','مقدمه','مقدمه افتار','مقدمة افاتار')` → `'مقدمة — ' || topic.title`
   - الحفاظ على `order_index` الأصلي
4. **Questions**: نسخ `grade11_game_questions` → `grade10_game_questions` فقط للدروس التي تم نسخها، مع ترتيب `difficulty_level` (easy → medium → hard).

البطاقات في الحادي عشر تبقى كما هي تماماً (بطاقات "حذف" لا تُحذف منها).

---

## المرحلة 3 — كود: hook ومكونات مخصصة للعاشر

نسخ الملفات (بدون لمس نسخ الحادي عشر):

| الأصل (Grade 11) | النسخة الجديدة (Grade 10) |
|---|---|
| `src/hooks/useGrade11Game.ts` | `src/hooks/useGrade10Game.ts` |
| `src/components/games/KnowledgeAdventureRealContent.tsx` | `src/components/games/KnowledgeAdventureGrade10Content.tsx` |
| `src/components/games/GameMapReal.tsx` | `src/components/games/GameMapGrade10.tsx` |

تعديلات داخل النسخة الجديدة:
- استبدال أسماء الجداول: `grade11_*` → `grade10_*`
- `KnowledgeAdventureGrade10Content` يستخدم `useGrade10Game` و `GameMapGrade10`
- `Grade10Content.tsx`: استبدال `KnowledgeAdventureRealContent` بـ `KnowledgeAdventureGrade10Content`

> `usePlayerProfile`, `useStudentGameStats`, `useAchievements`, `ShuffledQuizChallenge` تبقى مشتركة (لا تحتاج فصل).

---

## المرحلة 4 — الترتيب الصحيح والفتح التسلسلي

داخل `useGrade10Game.ts`:

1. **ترتيب الدروس** عند الـ flatten:
   ```ts
   ORDER BY section.order_index, topic.order_index, lesson.order_index
   ```
2. **`isLessonUnlocked(index)`**:
   - الدرس الأول (index = 0) مفتوح دائماً
   - أي درس آخر مفتوح فقط إذا الدرس السابق في القائمة المرتبة `completed_at IS NOT NULL` ونسبته ≥ 70%
   - هذا يضمن فتح بطاقة تلو الأخرى عبر حدود المواضيع والأقسام بشكل طبيعي
3. **ترتيب الأسئلة داخل الدرس**: `easy → medium → hard` ثم `order_index`.
4. **عرض الفلتر**: إبقاء فلتر `lessonQuestions.length > 0` (لا تظهر دروس بلا أسئلة).

---

## المرحلة 5 — التحقق

1. فتح تبويب الصف العاشر → "لعبة المعرفة" والتأكد:
   - 17 بطاقة نظيفة بدون "حذف" ولا "مقدمه افتار"
   - الترتيب: قسم 1 → مواضيعه → دروسه، ثم قسم 2 …
   - فقط البطاقة الأولى مفتوحة، الباقي مقفل
   - بعد إكمال درس بنسبة ≥ 70% يفتح التالي
2. فتح تبويب الصف الحادي عشر والتأكد أن 28 بطاقة بلا تغيير.
3. تحقق DB عبر `supabase--read_query` على `grade10_lessons` / `grade10_game_questions`.

---

## التفاصيل التقنية

- لا تغييرات على Edge Functions.
- جميع التعديلات في `public` schema.
- استخدام `gen_random_uuid()` للـ IDs الجديدة مع mapping table مؤقت داخل CTE في الـ migration.
- `grade10_player_profiles` و `grade10_game_achievements` موجودة مسبقاً وستُستخدم.
- بعد الموافقة: المرحلة 1+2 عبر `supabase--migration` (خطوة واحدة)، ثم المرحلتان 3+4 عبر كود، ثم تحقق المرحلة 5.

هل أبدأ التنفيذ؟
