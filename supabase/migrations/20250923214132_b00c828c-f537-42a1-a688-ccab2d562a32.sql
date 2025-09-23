-- إضافة الصور المصغرة للفيديوهات
UPDATE public.grade11_videos SET 
  thumbnail_url = CASE id
    -- صور مصغرة مستخرجة من Google Drive (استخدام نفس المعرف مع تنسيق الصورة المصغرة)
    WHEN (SELECT id FROM public.grade11_videos WHERE title = '01- تبسيط OSI Models 7 Layers Introduction' LIMIT 1) 
    THEN 'https://drive.google.com/thumbnail?id=1FmwCY3FcBu91jOKLcSe0XgmXFpYSZcH_&sz=w320-h180'
    
    WHEN (SELECT id FROM public.grade11_videos WHERE title = '02- تبسيط OSI Models 7 Layers L7-6-5' LIMIT 1) 
    THEN 'https://drive.google.com/thumbnail?id=1tDEbNPyioqxxL-lJwsCg-Da8YNrLES1a&sz=w320-h180'
    
    WHEN (SELECT id FROM public.grade11_videos WHERE title = '03- تبسيط OSI Models 7 Layers L3-2-1' LIMIT 1) 
    THEN 'https://drive.google.com/thumbnail?id=1FABjqUb0c_iU8gmv_tla8k3cdsp5TApJ&sz=w320-h180'
    
    WHEN (SELECT id FROM public.grade11_videos WHERE title = '04- تبسيط OSI Models 7 Layers L4' LIMIT 1) 
    THEN 'https://drive.google.com/thumbnail?id=1w8GdL33LqN8hNpDrQHXCTbWMswRoBRy0&sz=w320-h180'
    
    WHEN (SELECT id FROM public.grade11_videos WHERE title = '05- تبسيط OSI Models 7 Layers Examples' LIMIT 1) 
    THEN 'https://drive.google.com/thumbnail?id=1Rk7DcgFlPNypIq7JezbeB_8ihwCVupE6&sz=w320-h180'
    
    ELSE thumbnail_url
  END,

  updated_at = now()
WHERE title LIKE '0%- تبسيط OSI Models%';