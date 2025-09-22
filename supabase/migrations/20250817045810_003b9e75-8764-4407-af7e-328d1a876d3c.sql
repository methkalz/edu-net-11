-- Fix the schools table by adding missing updated_at_utc column and fixing the trigger

-- First, add the missing updated_at_utc column to schools table
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS updated_at_utc timestamp with time zone NOT NULL DEFAULT now();

-- Update existing records to have the current timestamp
UPDATE public.schools SET updated_at_utc = created_at WHERE updated_at_utc IS NULL;

-- Create or replace the update trigger function to be more robust
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the table has updated_at_utc column
    IF TG_TABLE_NAME = 'schools' AND pg_catalog.has_column_privilege(TG_TABLE_SCHEMA||'.'||TG_TABLE_NAME, 'updated_at_utc', 'UPDATE') THEN
        NEW.updated_at_utc = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_schools_updated_at ON public.schools;

-- Create the trigger for schools table
CREATE TRIGGER update_schools_updated_at
    BEFORE UPDATE ON public.schools
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();