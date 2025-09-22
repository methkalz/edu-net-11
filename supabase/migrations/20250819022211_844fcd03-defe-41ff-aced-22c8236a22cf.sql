-- Add grade content selection to packages table
ALTER TABLE public.packages 
ADD COLUMN available_grade_contents jsonb DEFAULT '[]'::jsonb;

-- Add comment for clarity
COMMENT ON COLUMN public.packages.available_grade_contents IS 'Array of grade content IDs that are available with this package (grade10, grade11, grade12)';