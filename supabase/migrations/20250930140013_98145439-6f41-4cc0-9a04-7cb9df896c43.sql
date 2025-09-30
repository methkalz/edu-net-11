-- Add icon column to calendar_events table
ALTER TABLE public.calendar_events 
ADD COLUMN IF NOT EXISTS icon text DEFAULT 'calendar';

-- Add comment
COMMENT ON COLUMN public.calendar_events.icon IS 'Icon name from lucide-react library';