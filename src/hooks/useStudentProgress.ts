import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';

export interface StudentStats {
  total_points: number;
  completed_videos: number;
  completed_projects: number;
  current_streak: number;
  total_activities: number;
  achievements_count: number;
}

export interface StudentProgress {
  id: string;
  content_id: string;
  content_type: 'video' | 'document' | 'lesson' | 'project' | 'game';
  progress_percentage: number;
  points_earned: number;
  time_spent_minutes: number;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  achievement_type: string;
  achievement_name: string;
  achievement_description?: string;
  points_value: number;
  earned_at: string;
  metadata: any;
}

export const useStudentProgress = () => {
  const { user, userProfile } = useAuth();
  const [stats, setStats] = useState<StudentStats>({
    total_points: 0,
    completed_videos: 0,
    completed_projects: 0,
    current_streak: 0,
    total_activities: 0,
    achievements_count: 0
  });
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudentStats = async () => {
    if (!user || userProfile?.role !== 'student') return;

    try {
      setLoading(true);
      setError(null);

      // Get dashboard stats
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_student_dashboard_stats', { student_uuid: user.id });

      if (statsError) throw statsError;

      if (statsData) {
        setStats(statsData as unknown as StudentStats);
      }

      // Get progress data
      const { data: progressData, error: progressError } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', user.id)
        .order('updated_at', { ascending: false });

      if (progressError) throw progressError;
      setProgress((progressData || []) as StudentProgress[]);

      // Get achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('student_achievements')
        .select('*')
        .eq('student_id', user.id)
        .order('earned_at', { ascending: false });

      if (achievementsError) throw achievementsError;
      setAchievements(achievementsData || []);

      logger.info('Student stats loaded successfully', { stats: statsData });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في تحميل إحصائيات الطالب';
      setError(errorMessage);
      logger.error('Error fetching student stats', err as Error);
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (
    contentId: string,
    contentType: 'video' | 'document' | 'lesson' | 'project' | 'game',
    progressPercentage: number,
    timeSpentMinutes: number = 0,
    pointsEarned: number = 0
  ) => {
    if (!user || !userProfile?.school_id) return;

    try {
      const updateData = {
        student_id: user.id,
        content_id: contentId,
        content_type: contentType,
        progress_percentage: Math.min(100, Math.max(0, progressPercentage)),
        points_earned: pointsEarned,
        time_spent_minutes: timeSpentMinutes,
        school_id: userProfile.school_id,
        completed_at: progressPercentage >= 100 ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('student_progress')
        .upsert(updateData, {
          onConflict: 'student_id,content_id,content_type'
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await logActivity(contentType === 'video' ? 'video_watch' : 
                       contentType === 'project' ? 'project_submit' :
                       contentType === 'game' ? 'game_play' : 'document_read',
                       contentId, timeSpentMinutes * 60, pointsEarned);

      // Refresh stats
      await fetchStudentStats();

      logger.info('Progress updated successfully', { contentId, progressPercentage });
      return data;
    } catch (err) {
      logger.error('Error updating progress', err as Error);
      throw err;
    }
  };

  const logActivity = async (
    activityType: 'login' | 'video_watch' | 'document_read' | 'project_submit' | 'game_play' | 'quiz_complete',
    contentId?: string,
    durationSeconds: number = 0,
    pointsEarned: number = 0
  ) => {
    if (!user || !userProfile?.school_id) return;

    try {
      const { error } = await supabase
        .from('student_activity_log')
        .insert({
          student_id: user.id,
          activity_type: activityType,
          content_id: contentId,
          duration_seconds: durationSeconds,
          points_earned: pointsEarned,
          school_id: userProfile.school_id
        });

      if (error) throw error;

      logger.info('Activity logged successfully', { activityType, contentId });
    } catch (err) {
      logger.error('Error logging activity', err as Error);
    }
  };

  const awardAchievement = async (
    achievementType: string,
    achievementName: string,
    achievementDescription: string,
    pointsValue: number,
    metadata: any = {}
  ) => {
    if (!user || !userProfile?.school_id) return;

    try {
      const { data, error } = await supabase
        .from('student_achievements')
        .insert({
          student_id: user.id,
          achievement_type: achievementType,
          achievement_name: achievementName,
          achievement_description: achievementDescription,
          points_value: pointsValue,
          school_id: userProfile.school_id,
          metadata
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh stats and achievements
      await fetchStudentStats();

      logger.info('Achievement awarded successfully', { achievementType, pointsValue });
      return data;
    } catch (err) {
      logger.error('Error awarding achievement', err as Error);
      throw err;
    }
  };

  useEffect(() => {
    if (user && userProfile?.role === 'student') {
      fetchStudentStats();
      
      // Log login activity
      logActivity('login');
    }
  }, [user, userProfile]);

  return {
    stats,
    progress,
    achievements,
    loading,
    error,
    updateProgress,
    logActivity,
    awardAchievement,
    refetch: fetchStudentStats
  };
};