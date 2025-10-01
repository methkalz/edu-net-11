import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';
import { QUERY_KEYS, CACHE_TIMES } from '@/lib/query-keys';

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

// Fetch functions
const fetchStudentStats = async (userId: string): Promise<StudentStats> => {
  // Temporarily return default stats to avoid database function errors
  logger.info('Returning default student stats (temporary fix)');
  return {
    total_points: 0,
    completed_videos: 0,
    completed_projects: 0,
    current_streak: 0,
    total_activities: 0,
    achievements_count: 0
  };
};

const fetchStudentProgress = async (userId: string): Promise<StudentProgress[]> => {
  const { data, error } = await supabase
    .from('student_progress')
    .select('*')
    .eq('student_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    logger.error('Error fetching student progress', error);
    throw error;
  }

  return (data || []) as StudentProgress[];
};

const fetchStudentAchievements = async (userId: string): Promise<Achievement[]> => {
  const { data, error } = await supabase
    .from('student_achievements')
    .select('*')
    .eq('student_id', userId)
    .order('earned_at', { ascending: false });

  if (error) {
    logger.error('Error fetching student achievements', error);
    throw error;
  }

  return data || [];
};

export const useStudentProgress = () => {
  const { user, userProfile } = useAuth();
  const queryClient = useQueryClient();

  // Stats query
  const {
    data: stats = {
      total_points: 0,
      completed_videos: 0,
      completed_projects: 0,
      current_streak: 0,
      total_activities: 0,
      achievements_count: 0
    },
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useQuery({
    queryKey: QUERY_KEYS.STUDENT.STATS(user?.id || ''),
    queryFn: () => fetchStudentStats(user!.id),
    enabled: Boolean(user && userProfile?.role === 'student'),
    staleTime: CACHE_TIMES.SHORT,
    gcTime: CACHE_TIMES.MEDIUM,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  // Progress query
  const {
    data: progress = [],
    isLoading: progressLoading,
    error: progressError
  } = useQuery({
    queryKey: QUERY_KEYS.STUDENT.PROGRESS(user?.id || ''),
    queryFn: () => fetchStudentProgress(user!.id),
    enabled: Boolean(user && userProfile?.role === 'student'),
    staleTime: CACHE_TIMES.SHORT,
    gcTime: CACHE_TIMES.MEDIUM,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  // Achievements query
  const {
    data: achievements = [],
    isLoading: achievementsLoading,
    error: achievementsError
  } = useQuery({
    queryKey: QUERY_KEYS.STUDENT.ACHIEVEMENTS(user?.id || ''),
    queryFn: () => fetchStudentAchievements(user!.id),
    enabled: Boolean(user && userProfile?.role === 'student'),
    staleTime: CACHE_TIMES.MEDIUM,
    gcTime: CACHE_TIMES.LONG,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  const loading = statsLoading || progressLoading || achievementsLoading;
  const error = statsError?.message || progressError?.message || achievementsError?.message || null;

  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async ({
      contentId,
      contentType,
      progressPercentage,
      timeSpentMinutes = 0,
      pointsEarned = 0
    }: {
      contentId: string;
      contentType: 'video' | 'document' | 'lesson' | 'project' | 'game';
      progressPercentage: number;
      timeSpentMinutes?: number;
      pointsEarned?: number;
    }) => {
      if (!user || !userProfile?.school_id) throw new Error('User not authenticated');

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
      await logActivityMutation.mutateAsync({
        activityType: contentType === 'video' ? 'video_watch' : 
                     contentType === 'project' ? 'project_submit' :
                     contentType === 'game' ? 'game_play' : 'document_read',
        contentId,
        durationSeconds: timeSpentMinutes * 60,
        pointsEarned
      });

      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STUDENT.PROGRESS(user?.id || '') });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STUDENT.STATS(user?.id || '') });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STUDENT.CONTENT(user?.id || '', '') });
    },
    onError: (error) => {
      logger.error('Error updating progress', error);
    }
  });

  const updateProgress = (
    contentId: string,
    contentType: 'video' | 'document' | 'lesson' | 'project' | 'game',
    progressPercentage: number,
    timeSpentMinutes: number = 0,
    pointsEarned: number = 0
  ) => {
    return updateProgressMutation.mutateAsync({
      contentId,
      contentType,
      progressPercentage,
      timeSpentMinutes,
      pointsEarned
    });
  };

  // Log activity mutation
  const logActivityMutation = useMutation({
    mutationFn: async ({
      activityType,
      contentId,
      durationSeconds = 0,
      pointsEarned = 0
    }: {
      activityType: 'login' | 'video_watch' | 'document_read' | 'project_submit' | 'game_play' | 'quiz_complete';
      contentId?: string;
      durationSeconds?: number;
      pointsEarned?: number;
    }) => {
      if (!user || !userProfile?.school_id) throw new Error('User not authenticated');

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
    },
    onError: (error) => {
      logger.error('Error logging activity', error);
    }
  });

  const logActivity = (
    activityType: 'login' | 'video_watch' | 'document_read' | 'project_submit' | 'game_play' | 'quiz_complete',
    contentId?: string,
    durationSeconds: number = 0,
    pointsEarned: number = 0
  ) => {
    return logActivityMutation.mutateAsync({
      activityType,
      contentId,
      durationSeconds,
      pointsEarned
    });
  };

  // Award achievement mutation
  const awardAchievementMutation = useMutation({
    mutationFn: async ({
      achievementType,
      achievementName,
      achievementDescription,
      pointsValue,
      metadata = {}
    }: {
      achievementType: string;
      achievementName: string;
      achievementDescription: string;
      pointsValue: number;
      metadata?: any;
    }) => {
      if (!user || !userProfile?.school_id) throw new Error('User not authenticated');

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
      return data;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STUDENT.ACHIEVEMENTS(user?.id || '') });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STUDENT.STATS(user?.id || '') });
    },
    onError: (error) => {
      logger.error('Error awarding achievement', error);
    }
  });

  const awardAchievement = (
    achievementType: string,
    achievementName: string,
    achievementDescription: string,
    pointsValue: number,
    metadata: any = {}
  ) => {
    return awardAchievementMutation.mutateAsync({
      achievementType,
      achievementName,
      achievementDescription,
      pointsValue,
      metadata
    });
  };

  // Log login activity on first load
  const { mutate: logLoginActivity } = useMutation({
    mutationFn: () => logActivity('login'),
    onError: (error) => {
      logger.error('Error logging login activity', error);
    }
  });

  // Effect to log login when user becomes available
  React.useEffect(() => {
    if (user && userProfile?.role === 'student') {
      logLoginActivity();
    }
  }, [user, userProfile, logLoginActivity]);

  const refetch = () => {
    refetchStats();
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STUDENT.PROGRESS(user?.id || '') });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STUDENT.ACHIEVEMENTS(user?.id || '') });
  };

  return {
    stats,
    progress,
    achievements,
    loading,
    error,
    updateProgress,
    logActivity,
    awardAchievement,
    refetch
  };
};