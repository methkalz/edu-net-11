
-- Add missing useful columns

-- 1. Schools: contact info that admin UI tries to save
ALTER TABLE public.schools 
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Profiles: suspend/activate functionality
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
