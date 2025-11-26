-- Create function to automatically update exam statuses based on dates
CREATE OR REPLACE FUNCTION update_exam_statuses()
RETURNS void AS $$
BEGIN
  -- Update scheduled exams to active when start time is reached
  UPDATE exams 
  SET status = 'active', updated_at = now()
  WHERE status = 'scheduled' 
    AND start_datetime <= now() 
    AND end_datetime > now();
  
  -- Update scheduled or active exams to ended when end time is passed
  UPDATE exams 
  SET status = 'ended', updated_at = now()
  WHERE status IN ('scheduled', 'active') 
    AND end_datetime <= now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;