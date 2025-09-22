-- Create email_logs table for tracking email sending status
CREATE TABLE public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL DEFAULT 'welcome', -- 'welcome', 'reminder', etc.
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'sent', 'failed', 'pending'
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  error_message TEXT,
  resend_id TEXT, -- ID from Resend for tracking
  school_id UUID NOT NULL,
  created_at_utc TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at_utc TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for email_logs
CREATE POLICY "School admins can manage their school email logs" 
ON public.email_logs 
FOR ALL 
USING (((school_id = get_user_school_id()) AND (get_user_role() = ANY (ARRAY['school_admin'::app_role, 'superadmin'::app_role]))) OR (get_user_role() = 'superadmin'::app_role));

CREATE POLICY "School members can view their school email logs" 
ON public.email_logs 
FOR SELECT 
USING ((school_id = get_user_school_id()) OR (get_user_role() = 'superadmin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_email_logs_updated_at
BEFORE UPDATE ON public.email_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();