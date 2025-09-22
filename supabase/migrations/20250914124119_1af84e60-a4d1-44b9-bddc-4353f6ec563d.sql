-- Create student progress tracking table
CREATE TABLE public.student_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL,
  content_id uuid NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('video', 'document', 'lesson', 'project', 'game')),
  progress_percentage integer NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  completed_at timestamp with time zone,
  points_earned integer NOT NULL DEFAULT 0,
  time_spent_minutes integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  school_id uuid NOT NULL,
  UNIQUE(student_id, content_id, content_type)
);

-- Create student achievements table
CREATE TABLE public.student_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL,
  achievement_type text NOT NULL CHECK (achievement_type IN ('first_video', 'video_marathon', 'project_master', 'quiz_champion', 'daily_streak', 'weekly_goal', 'monthly_star', 'content_explorer')),
  achievement_name text NOT NULL,
  achievement_description text,
  points_value integer NOT NULL DEFAULT 0,
  earned_at timestamp with time zone NOT NULL DEFAULT now(),
  school_id uuid NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create student activity log table
CREATE TABLE public.student_activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('login', 'video_watch', 'document_read', 'project_submit', 'game_play', 'quiz_complete')),
  content_id uuid,
  duration_seconds integer DEFAULT 0,
  points_earned integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  school_id uuid NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create student daily challenges table
CREATE TABLE public.student_daily_challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL,
  challenge_date date NOT NULL DEFAULT CURRENT_DATE,
  challenge_type text NOT NULL CHECK (challenge_type IN ('watch_videos', 'complete_project', 'play_games', 'study_time')),
  challenge_title text NOT NULL,
  challenge_description text,
  target_value integer NOT NULL,
  current_progress integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  points_reward integer NOT NULL DEFAULT 0,
  school_id uuid NOT NULL,
  UNIQUE(student_id, challenge_date, challenge_type)
);

-- Enable Row Level Security
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_daily_challenges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_progress
CREATE POLICY "Students can view their own progress" 
ON public.student_progress 
FOR SELECT 
USING (student_id = auth.uid());

CREATE POLICY "Students can update their own progress" 
ON public.student_progress 
FOR INSERT 
WITH CHECK (student_id = auth.uid() AND school_id = get_user_school_id());

CREATE POLICY "Students can modify their own progress" 
ON public.student_progress 
FOR UPDATE 
USING (student_id = auth.uid());

CREATE POLICY "Teachers can view school student progress" 
ON public.student_progress 
FOR SELECT 
USING (
  (get_user_role() = ANY (ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role])) 
  AND (school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
);

-- RLS Policies for student_achievements
CREATE POLICY "Students can view their own achievements" 
ON public.student_achievements 
FOR SELECT 
USING (student_id = auth.uid());

CREATE POLICY "System can create achievements" 
ON public.student_achievements 
FOR INSERT 
WITH CHECK (school_id = get_user_school_id());

CREATE POLICY "Teachers can view school achievements" 
ON public.student_achievements 
FOR SELECT 
USING (
  (get_user_role() = ANY (ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role])) 
  AND (school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
);

-- RLS Policies for student_activity_log
CREATE POLICY "Students can view their own activity" 
ON public.student_activity_log 
FOR SELECT 
USING (student_id = auth.uid());

CREATE POLICY "Students can log their own activity" 
ON public.student_activity_log 
FOR INSERT 
WITH CHECK (student_id = auth.uid() AND school_id = get_user_school_id());

CREATE POLICY "Teachers can view school activity logs" 
ON public.student_activity_log 
FOR SELECT 
USING (
  (get_user_role() = ANY (ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role])) 
  AND (school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
);

-- RLS Policies for student_daily_challenges
CREATE POLICY "Students can manage their own challenges" 
ON public.student_daily_challenges 
FOR ALL 
USING (student_id = auth.uid());

CREATE POLICY "Teachers can view school challenges" 
ON public.student_daily_challenges 
FOR SELECT 
USING (
  (get_user_role() = ANY (ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role])) 
  AND (school_id = get_user_school_id() OR get_user_role() = 'superadmin'::app_role)
);

-- Create indexes for better performance
CREATE INDEX idx_student_progress_student_id ON public.student_progress(student_id);
CREATE INDEX idx_student_progress_content ON public.student_progress(content_id, content_type);
CREATE INDEX idx_student_achievements_student_id ON public.student_achievements(student_id);
CREATE INDEX idx_student_activity_student_id ON public.student_activity_log(student_id);
CREATE INDEX idx_student_activity_date ON public.student_activity_log(created_at);
CREATE INDEX idx_student_challenges_student_date ON public.student_daily_challenges(student_id, challenge_date);

-- Create trigger for updated_at column
CREATE TRIGGER update_student_progress_updated_at
  BEFORE UPDATE ON public.student_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate student total points
CREATE OR REPLACE FUNCTION public.get_student_total_points(student_uuid uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT SUM(points_earned) FROM public.student_progress WHERE student_id = student_uuid) +
    (SELECT SUM(points_value) FROM public.student_achievements WHERE student_id = student_uuid) +
    (SELECT SUM(points_earned) FROM public.student_activity_log WHERE student_id = student_uuid),
    0
  );
$$;

-- Function to get student stats
CREATE OR REPLACE FUNCTION public.get_student_dashboard_stats(student_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_points integer;
  completed_videos integer;
  completed_projects integer;
  current_streak integer;
  total_activities integer;
  achievements_count integer;
BEGIN
  -- Get total points
  SELECT get_student_total_points(student_uuid) INTO total_points;
  
  -- Get completed content counts
  SELECT 
    COUNT(*) FILTER (WHERE content_type = 'video' AND progress_percentage = 100),
    COUNT(*) FILTER (WHERE content_type = 'project' AND progress_percentage = 100)
  INTO completed_videos, completed_projects
  FROM public.student_progress 
  WHERE student_id = student_uuid;
  
  -- Get total activities
  SELECT COUNT(*) INTO total_activities
  FROM public.student_activity_log 
  WHERE student_id = student_uuid;
  
  -- Get achievements count
  SELECT COUNT(*) INTO achievements_count
  FROM public.student_achievements 
  WHERE student_id = student_uuid;
  
  -- Calculate current streak (simplified - days with activity)
  SELECT COUNT(DISTINCT DATE(created_at)) INTO current_streak
  FROM public.student_activity_log 
  WHERE student_id = student_uuid 
    AND created_at >= CURRENT_DATE - INTERVAL '7 days';
  
  RETURN jsonb_build_object(
    'total_points', COALESCE(total_points, 0),
    'completed_videos', COALESCE(completed_videos, 0),
    'completed_projects', COALESCE(completed_projects, 0),
    'current_streak', COALESCE(current_streak, 0),
    'total_activities', COALESCE(total_activities, 0),
    'achievements_count', COALESCE(achievements_count, 0)
  );
END;
$$;