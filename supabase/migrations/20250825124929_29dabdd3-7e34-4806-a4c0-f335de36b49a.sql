-- Create grade11_lessons table
CREATE TABLE public.grade11_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on grade11_lessons
ALTER TABLE public.grade11_lessons ENABLE ROW LEVEL SECURITY;

-- Create policies for grade11_lessons
CREATE POLICY "Authenticated users can view grade11 lessons" 
ON public.grade11_lessons 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Superadmins can manage grade11 lessons" 
ON public.grade11_lessons 
FOR ALL 
USING (get_user_role() = 'superadmin'::app_role);

-- Rename grade11_topic_media to grade11_lesson_media and update structure
ALTER TABLE public.grade11_topic_media RENAME TO grade11_lesson_media;
ALTER TABLE public.grade11_lesson_media RENAME COLUMN topic_id TO lesson_id;

-- Update RLS policies for the renamed table
DROP POLICY IF EXISTS "Authenticated users can view grade11 topic media" ON public.grade11_lesson_media;
DROP POLICY IF EXISTS "Superadmins can manage grade11 topic media" ON public.grade11_lesson_media;

CREATE POLICY "Authenticated users can view grade11 lesson media" 
ON public.grade11_lesson_media 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Superadmins can manage grade11 lesson media" 
ON public.grade11_lesson_media 
FOR ALL 
USING (get_user_role() = 'superadmin'::app_role);

-- Add foreign key constraint for grade11_lessons
ALTER TABLE public.grade11_lessons 
ADD CONSTRAINT grade11_lessons_topic_id_fkey 
FOREIGN KEY (topic_id) REFERENCES public.grade11_topics(id) ON DELETE CASCADE;

-- Add foreign key constraint for grade11_lesson_media  
ALTER TABLE public.grade11_lesson_media 
ADD CONSTRAINT grade11_lesson_media_lesson_id_fkey 
FOREIGN KEY (lesson_id) REFERENCES public.grade11_lessons(id) ON DELETE CASCADE;

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_grade11_lessons_updated_at
BEFORE UPDATE ON public.grade11_lessons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();