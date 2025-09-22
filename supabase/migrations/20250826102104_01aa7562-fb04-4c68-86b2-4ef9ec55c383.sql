-- Update grade10_videos table to include missing columns for proper video management
ALTER TABLE public.grade10_videos 
ADD COLUMN IF NOT EXISTS category text DEFAULT 'general'::text,
ADD COLUMN IF NOT EXISTS is_visible boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS allowed_roles text[] DEFAULT ARRAY['all'::text],
ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS published_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS grade_level text DEFAULT '10'::text;