-- إضافة لعبة Pair Matching إلى جدول الألعاب العامة
INSERT INTO public.games (name, description, grade_level, subject, is_active)
VALUES (
  'مطابقة الأزواج',
  'لعبة تفاعلية لمطابقة المصطلحات بتعريفاتها لتعزيز الفهم والترابط المعرفي',
  '11',
  'matching',
  true
);