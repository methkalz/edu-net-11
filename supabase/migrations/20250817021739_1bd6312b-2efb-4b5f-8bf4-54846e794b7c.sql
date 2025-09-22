-- Add updated_at_utc column to classes table if it doesn't exist
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS updated_at_utc TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Create trigger to automatically update updated_at_utc column
DROP TRIGGER IF EXISTS update_classes_updated_at ON public.classes;

CREATE TRIGGER update_classes_updated_at
BEFORE UPDATE ON public.classes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();