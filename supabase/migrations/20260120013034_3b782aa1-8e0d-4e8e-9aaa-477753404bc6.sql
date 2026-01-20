-- Create table for tracking PDF parsing jobs
CREATE TABLE public.bagrut_parsing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  file_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0,
  current_step TEXT,
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bagrut_parsing_jobs ENABLE ROW LEVEL SECURITY;

-- Users can view their own jobs
CREATE POLICY "Users can view own parsing jobs" 
  ON public.bagrut_parsing_jobs 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can create their own jobs
CREATE POLICY "Users can create own parsing jobs" 
  ON public.bagrut_parsing_jobs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own jobs (for service role updates, we'll use service key)
CREATE POLICY "Service role can update all jobs"
  ON public.bagrut_parsing_jobs
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_bagrut_parsing_jobs_user_id ON public.bagrut_parsing_jobs(user_id);
CREATE INDEX idx_bagrut_parsing_jobs_status ON public.bagrut_parsing_jobs(status);

-- Add trigger for updated_at
CREATE TRIGGER update_bagrut_parsing_jobs_updated_at
  BEFORE UPDATE ON public.bagrut_parsing_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();