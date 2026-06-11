
WITH keep_section AS (
  SELECT id FROM public.grade10_ka_sections WHERE title LIKE '%أساسيات الاتصال%'
),
del_sections AS (
  SELECT id FROM public.grade10_ka_sections WHERE id NOT IN (SELECT id FROM keep_section)
),
del_topics AS (
  SELECT id FROM public.grade10_ka_topics WHERE section_id IN (SELECT id FROM del_sections)
),
del_lessons AS (
  SELECT id FROM public.grade10_ka_lessons WHERE topic_id IN (SELECT id FROM del_topics)
)
DELETE FROM public.grade10_ka_questions WHERE lesson_id IN (SELECT id FROM del_lessons);

DELETE FROM public.grade10_ka_lessons WHERE topic_id IN (
  SELECT t.id FROM public.grade10_ka_topics t
  JOIN public.grade10_ka_sections s ON s.id = t.section_id
  WHERE s.title NOT LIKE '%أساسيات الاتصال%'
);

DELETE FROM public.grade10_ka_topics WHERE section_id IN (
  SELECT id FROM public.grade10_ka_sections WHERE title NOT LIKE '%أساسيات الاتصال%'
);

DELETE FROM public.grade10_ka_sections WHERE title NOT LIKE '%أساسيات الاتصال%';
