-- حذف جميع الفيديوهات الموجودة للصف الحادي عشر 
DELETE FROM public.grade11_videos;

-- إضافة الفيديوهات الجديدة للصف الحادي عشر بترتيب OSI Models
-- نستخدم UUID افتراضي كـ owner_user_id و source_type = 'direct'
INSERT INTO public.grade11_videos (
  title,
  description,
  video_url,
  source_type,
  category,
  grade_level,
  is_visible,
  order_index,
  owner_user_id,
  created_at,
  updated_at
) VALUES 
(
  '01- تبسيط OSI Models 7 Layers Introduction',
  'مقدمة شاملة عن طبقات نموذج OSI السبع',
  'https://drive.google.com/file/d/1FmwCY3FcBu91jOKLcSe0XgmXFpYSZcH_/preview',
  'direct',
  'OSI Models',
  'grade11',
  true,
  1,
  '00000000-0000-0000-0000-000000000000',
  now(),
  now()
),
(
  '02- تبسيط OSI Models 7 Layers L7-6-5',
  'شرح تفصيلي للطبقات العليا (الطبقة 7، 6، 5) في نموذج OSI',
  'https://drive.google.com/file/d/1tDEbNPyioqxxL-lJwsCg-Da8YNrLES1a/preview',
  'direct',
  'OSI Models',
  'grade11',
  true,
  2,
  '00000000-0000-0000-0000-000000000000',
  now(),
  now()
),
(
  '03- تبسيط OSI Models 7 Layers L3-2-1',
  'شرح تفصيلي للطبقات السفلى (الطبقة 3، 2، 1) في نموذج OSI',
  'https://drive.google.com/file/d/1FABjqUb0c_iU8gmv_tla8k3cdsp5TApJ/preview',
  'direct',
  'OSI Models',
  'grade11',
  true,
  3,
  '00000000-0000-0000-0000-000000000000',
  now(),
  now()
),
(
  '04- تبسيط OSI Models 7 Layers L4',
  'شرح مفصل للطبقة الرابعة (Transport Layer) في نموذج OSI',
  'https://drive.google.com/file/d/1w8GdL33LqN8hNpDrQHXCTbWMswRoBRy0/preview',
  'direct',
  'OSI Models',
  'grade11',
  true,
  4,
  '00000000-0000-0000-0000-000000000000',
  now(),
  now()
),
(
  '05- تبسيط OSI Models 7 Layers Examples',
  'أمثلة عملية وتطبيقية على طبقات نموذج OSI السبع',
  'https://drive.google.com/file/d/1Rk7DcgFlPNypIq7JezbeB_8ihwCVupE6/preview',
  'direct',
  'OSI Models',
  'grade11',
  true,
  5,
  '00000000-0000-0000-0000-000000000000',
  now(),
  now()
);