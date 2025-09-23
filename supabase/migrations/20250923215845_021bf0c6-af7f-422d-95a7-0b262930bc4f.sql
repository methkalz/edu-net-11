-- تحديث الصور المصغرة لفيديوهات الصف الحادي عشر
UPDATE public.grade11_videos 
SET thumbnail_url = 'https://drive.google.com/thumbnail?id=1FmwCY3FcBu91jOKLcSe0XgmXFpYSZcH_'
WHERE title LIKE '%01%' AND title LIKE '%OSI Models 7 Layers Introduction%';

UPDATE public.grade11_videos 
SET thumbnail_url = 'https://drive.google.com/thumbnail?id=1tDEbNPyioqxxL-lJwsCg-Da8YNrLES1a'
WHERE title LIKE '%02%' AND title LIKE '%OSI Models 7 Layers L7-6-5%';

UPDATE public.grade11_videos 
SET thumbnail_url = 'https://drive.google.com/thumbnail?id=1FABjqUb0c_iU8gmv_tla8k3cdsp5TApJ'
WHERE title LIKE '%03%' AND title LIKE '%OSI Models 7 Layers L3-2-1%';

UPDATE public.grade11_videos 
SET thumbnail_url = 'https://drive.google.com/thumbnail?id=1w8GdL33LqN8hNpDrQHXCTbWMswRoBRy0'
WHERE title LIKE '%04%' AND title LIKE '%OSI Models 7 Layers L4%';

UPDATE public.grade11_videos 
SET thumbnail_url = 'https://drive.google.com/thumbnail?id=1Rk7DcgFlPNypIq7JezbeB_8ihwCVupE6'
WHERE title LIKE '%05%' AND title LIKE '%OSI Models 7 Layers Examples%';