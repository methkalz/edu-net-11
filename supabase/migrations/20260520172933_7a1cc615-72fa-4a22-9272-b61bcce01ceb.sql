UPDATE public.grade10_ka_lessons
SET title = REPLACE(title, '—', '-')
WHERE title LIKE '%—%';