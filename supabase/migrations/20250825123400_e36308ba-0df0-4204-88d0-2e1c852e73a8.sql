-- Create grade11_sections table
CREATE TABLE public.grade11_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create grade11_topics table
CREATE TABLE public.grade11_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES public.grade11_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create enum for media types
CREATE TYPE media_type AS ENUM ('video', 'lottie', 'image');

-- Create grade11_topic_media table
CREATE TABLE public.grade11_topic_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES public.grade11_topics(id) ON DELETE CASCADE,
  media_type media_type NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.grade11_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade11_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade11_topic_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies for grade11_sections
CREATE POLICY "Superadmins can manage grade11 sections" 
ON public.grade11_sections 
FOR ALL 
USING (get_user_role() = 'superadmin'::app_role);

CREATE POLICY "Authenticated users can view grade11 sections" 
ON public.grade11_sections 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

-- RLS Policies for grade11_topics
CREATE POLICY "Superadmins can manage grade11 topics" 
ON public.grade11_topics 
FOR ALL 
USING (get_user_role() = 'superadmin'::app_role);

CREATE POLICY "Authenticated users can view grade11 topics" 
ON public.grade11_topics 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

-- RLS Policies for grade11_topic_media
CREATE POLICY "Superadmins can manage grade11 topic media" 
ON public.grade11_topic_media 
FOR ALL 
USING (get_user_role() = 'superadmin'::app_role);

CREATE POLICY "Authenticated users can view grade11 topic media" 
ON public.grade11_topic_media 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

-- Create indexes for better performance
CREATE INDEX idx_grade11_topics_section_id ON public.grade11_topics(section_id);
CREATE INDEX idx_grade11_topics_order ON public.grade11_topics(section_id, order_index);
CREATE INDEX idx_grade11_topic_media_topic_id ON public.grade11_topic_media(topic_id);
CREATE INDEX idx_grade11_topic_media_order ON public.grade11_topic_media(topic_id, order_index);
CREATE INDEX idx_grade11_sections_order ON public.grade11_sections(order_index);

-- Create trigger for updated_at columns
CREATE TRIGGER update_grade11_sections_updated_at
  BEFORE UPDATE ON public.grade11_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grade11_topics_updated_at
  BEFORE UPDATE ON public.grade11_topics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();