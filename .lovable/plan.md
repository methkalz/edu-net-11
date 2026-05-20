## السبب

عند فحص قاعدة البيانات تبيّن أن جداول `grade10_ka_lessons` / `grade10_ka_topics` / `grade10_ka_sections` / `grade10_ka_questions` تم إنشاؤها **بدون مفاتيح خارجية (Foreign Keys)**.

الـ Hook `useGrade10Game` يستخدم استعلام PostgREST بصيغة embedded join:
```ts
.select(`..., grade10_ka_topics!inner ( ..., grade10_ka_sections!inner (...) )`)
```
هذه الصيغة تتطلّب وجود علاقات FK مُعرَّفة في القاعدة. لعدم وجودها، يُرجع PostgREST خطأ، فيُعرض للطالبة "حدث خطأ في تحميل الدروس".

البيانات نفسها موجودة (426 درس، 280 سؤال، 88 موضوع، 17 قسم) و RLS صحيحة (قراءة مفتوحة للموثَّقين).

## الإصلاح

### 1) Migration: إضافة Foreign Keys

```sql
ALTER TABLE public.grade10_ka_topics
  ADD CONSTRAINT grade10_ka_topics_section_id_fkey
  FOREIGN KEY (section_id) REFERENCES public.grade10_ka_sections(id) ON DELETE CASCADE;

ALTER TABLE public.grade10_ka_lessons
  ADD CONSTRAINT grade10_ka_lessons_topic_id_fkey
  FOREIGN KEY (topic_id) REFERENCES public.grade10_ka_topics(id) ON DELETE CASCADE;

ALTER TABLE public.grade10_ka_questions
  ADD CONSTRAINT grade10_ka_questions_lesson_id_fkey
  FOREIGN KEY (lesson_id) REFERENCES public.grade10_ka_lessons(id) ON DELETE CASCADE;

ALTER TABLE public.grade10_ka_questions
  ADD CONSTRAINT grade10_ka_questions_topic_id_fkey
  FOREIGN KEY (topic_id) REFERENCES public.grade10_ka_topics(id) ON DELETE CASCADE;

ALTER TABLE public.grade10_ka_questions
  ADD CONSTRAINT grade10_ka_questions_section_id_fkey
  FOREIGN KEY (section_id) REFERENCES public.grade10_ka_sections(id) ON DELETE CASCADE;
```

### 2) تنظيف أيتام محتملين قبل إضافة الـ FK (إن وُجدت) — استعلام تحقّق أولاً.

### 3) إعادة تحميل أنواع Supabase تلقائياً بعد الـ migration.

لا حاجة لتغيير كود الواجهة — الـ hook صحيح وسيعمل فور إضافة العلاقات.

## التحقّق بعد التطبيق

- الدخول بحساب الطالبة ندية كبها → فتح لعبة المعرفة → يجب أن تظهر 24 بطاقة مرتّبة هرمياً.
- مراقبة Console: لا أخطاء PGRST.
