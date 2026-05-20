
UPDATE public.grade10_ka_lessons l
SET title = 'مقدمة — ' || trim(t.title)
FROM public.grade10_ka_topics t
WHERE l.topic_id = t.id
  AND trim(l.title) IN ('مقدمة','مقدمه','مقدمه افاتار','مقدمه  افاتار','افاتار','مقدمه افتراضيه');
