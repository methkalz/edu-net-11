-- Add city column to schools table
ALTER TABLE public.schools ADD COLUMN city TEXT;

-- Create cities table for managing city list
CREATE TABLE public.cities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for cities table
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- Insert the predefined cities
INSERT INTO public.cities (name) VALUES
  ('أبو سنان'),
  ('أبو غوش'),
  ('أم الفحم'),
  ('إبطن'),
  ('إعبلين'),
  ('إكسال'),
  ('البعينة'),
  ('البقيعة'),
  ('الجش'),
  ('الدحي'),
  ('الشبلي - أم الغنم'),
  ('الشيخ دنون'),
  ('الرامة'),
  ('الرينة'),
  ('الطيبة الزعبية'),
  ('العزير'),
  ('الفريديس'),
  ('الكمانة'),
  ('المغار'),
  ('المشهد'),
  ('البعنة'),
  ('بئر المكسور'),
  ('برطعة'),
  ('بسمة طبعون'),
  ('بيت جن'),
  ('جت'),
  ('جديدة - المكر'),
  ('جسر الزرقاء'),
  ('جلجولية'),
  ('جولس'),
  ('حرفيش'),
  ('دبورية'),
  ('دير الأسد'),
  ('دير حنا'),
  ('زلفة'),
  ('سالم'),
  ('سولم'),
  ('شعب'),
  ('شقيب السلام'),
  ('طرعان'),
  ('طوبا الزنغرية'),
  ('عارة'),
  ('عرب العرامشة'),
  ('عرعرة'),
  ('عرعرة النقب'),
  ('عيلوط'),
  ('عين السهلة'),
  ('عين ماهل'),
  ('كابول'),
  ('كسرى-كفرسميع'),
  ('كسيفة'),
  ('كفر برا'),
  ('كفر قرع'),
  ('كفر كنا'),
  ('كفر مندا'),
  ('كفرياسيف'),
  ('كوكب أبو الهيجاء'),
  ('مجد الكروم'),
  ('مشيرفة'),
  ('مصمص'),
  ('معاوية'),
  ('معليا'),
  ('منشية زبدة'),
  ('مقيبلة'),
  ('ميسر'),
  ('نحف'),
  ('نين'),
  ('وادي الحمام'),
  ('وادي سلامة'),
  ('يمه');

-- RLS policies for cities
CREATE POLICY "Anyone can view cities" 
ON public.cities 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Superadmins can manage cities" 
ON public.cities 
FOR ALL 
TO authenticated
USING (get_user_role() = 'superadmin'::app_role);