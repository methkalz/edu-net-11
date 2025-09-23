-- تحديث روابط الصور المصغرة لتنسيق أفضل من Google Drive
UPDATE public.grade11_videos SET 
  thumbnail_url = CASE id
    -- استخدام تنسيق مختلف للصور المصغرة من Google Drive
    WHEN (SELECT id FROM public.grade11_videos WHERE title = '01- تبسيط OSI Models 7 Layers Introduction' LIMIT 1) 
    THEN 'https://lh3.googleusercontent.com/d/1FmwCY3FcBu91jOKLcSe0XgmXFpYSZcH_'
    
    WHEN (SELECT id FROM public.grade11_videos WHERE title = '02- تبسيط OSI Models 7 Layers L7-6-5' LIMIT 1) 
    THEN 'https://lh3.googleusercontent.com/d/1tDEbNPyioqxxL-lJwsCg-Da8YNrLES1a'
    
    WHEN (SELECT id FROM public.grade11_videos WHERE title = '03- تبسيط OSI Models 7 Layers L3-2-1' LIMIT 1) 
    THEN 'https://lh3.googleusercontent.com/d/1FABjqUb0c_iU8gmv_tla8k3cdsp5TApJ'
    
    WHEN (SELECT id FROM public.grade11_videos WHERE title = '04- تبسيط OSI Models 7 Layers L4' LIMIT 1) 
    THEN 'https://lh3.googleusercontent.com/d/1w8GdL33LqN8hNpDrQHXCTbWMswRoBRy0'
    
    WHEN (SELECT id FROM public.grade11_videos WHERE title = '05- تبسيط OSI Models 7 Layers Examples' LIMIT 1) 
    THEN 'https://lh3.googleusercontent.com/d/1Rk7DcgFlPNypIq7JezbeB_8ihwCVupE6'
    
    ELSE thumbnail_url
  END,

  updated_at = now()
WHERE title LIKE '0%- تبسيط OSI Models%';