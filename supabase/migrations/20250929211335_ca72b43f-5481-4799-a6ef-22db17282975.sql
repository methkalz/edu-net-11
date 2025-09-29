-- حذف البلاجن إذا كان موجوداً ثم إضافته من جديد
DELETE FROM public.plugins WHERE name = 'Digital Whiteboard';

-- إضافة البلاجن للألواح الرقمية
INSERT INTO public.plugins (
  name,
  name_ar,
  description,
  description_ar,
  category,
  icon,
  default_status
) VALUES (
  'Digital Whiteboard',
  'اللوح الرقمي',
  'Interactive digital whiteboard for teaching and collaboration',
  'لوح رقمي تفاعلي للشرح والتعاون مع إمكانية الرسم والكتابة والتصدير',
  'تعليمية',
  'Presentation',
  'enabled'
);