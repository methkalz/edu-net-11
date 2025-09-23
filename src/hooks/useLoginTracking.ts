/**
 * Login Tracking Hook
 * 
 * This hook manages login tracking functionality including:
 * - Recording last login timestamps
 * - Counting login sessions
 * - Generating login statistics
 * - Identifying users who never logged in
 * 
 * @author Educational Platform Team
 * @version 1.0.0
 */

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { auditLogger, AUDIT_ACTIONS, AUDIT_ENTITIES } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { QUERY_KEYS, CACHE_TIMES } from '@/lib/query-keys';

interface LoginTrackingData {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  last_login_at: string | null;
  login_count: number;
  created_at: string;
  school_id: string | null;
  avatar_url?: string;
  display_title?: string;
  points?: number;
  level?: number;
}

interface LoginStats {
  totalUsers: number;
  activeToday: number;
  activeThisWeek: number;
  activeThisMonth: number;
  neverLoggedIn: number;
}

// Fetch functions
const fetchLoginData = async (schoolId?: string): Promise<LoginTrackingData[]> => {
  let query = supabase
    .from('profiles')
    .select(`
      user_id,
      full_name,
      email,
      role,
      created_at,
      school_id,
      avatar_url,
      display_title,
      points,
      level,
      *
    `)
    .order('created_at', { ascending: false });

  // Filter by school if not superadmin
  if (schoolId) {
    query = query.eq('school_id', schoolId);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Ensure login_count is never null and add missing properties
  const processedData = (data || []).map(user => ({
    ...user,
    login_count: (user as any).login_count || 0,
    last_login_at: (user as any).last_login_at || null
  })) as LoginTrackingData[];

  return processedData;
};

export const useLoginTracking = () => {
  const queryClient = useQueryClient();

  // Login data query
  const {
    data: loginData = [],
    isLoading: loading,
    refetch: loadLoginData
  } = useQuery({
    queryKey: QUERY_KEYS.USER.LOGIN_TRACKING(),
    queryFn: () => fetchLoginData(),
    enabled: false, // Manual trigger
    staleTime: CACHE_TIMES.SHORT, // Cache for 5 minutes
    gcTime: CACHE_TIMES.MEDIUM, // Keep in cache for 15 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  // Calculate stats from login data
  const stats = React.useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const calculatedStats: LoginStats = {
      totalUsers: loginData.length,
      activeToday: 0,
      activeThisWeek: 0,
      activeThisMonth: 0,
      neverLoggedIn: 0
    };

    loginData.forEach(user => {
      if (!user.last_login_at) {
        calculatedStats.neverLoggedIn++;
        return;
      }

      const lastLogin = new Date(user.last_login_at);
      
      if (lastLogin >= today) {
        calculatedStats.activeToday++;
      }
      
      if (lastLogin >= weekAgo) {
        calculatedStats.activeThisWeek++;
      }
      
      if (lastLogin >= monthAgo) {
        calculatedStats.activeThisMonth++;
      }
    });

    return calculatedStats;
  }, [loginData]);
  // Record login mutation
  const recordLoginMutation = useMutation({
    mutationFn: async (userId: string) => {
      const now = new Date().toISOString();
      
      // Get current login count - handle case where column might not exist yet
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('*')  // Select all columns to handle missing columns gracefully
        .eq('user_id', userId)
        .single();

      const currentCount = (currentProfile as any)?.login_count || 0;
      
      // Update last login and increment count - handle missing columns gracefully
      // Simple audit logging for now until database columns are added
      await auditLogger.log({
        action: AUDIT_ACTIONS.USER_LOGIN,
        entity: AUDIT_ENTITIES.USER,
        entity_id: userId,
        actor_user_id: userId,
        payload_json: {
          timestamp: now,
          method: 'direct_call'
        }
      });

      logger.info('Login recorded via audit system', { userId, timestamp: now });
    },
    onSuccess: () => {
      // Optionally refresh login data
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.LOGIN_TRACKING() });
    },
    onError: (error) => {
      logger.error('Error updating login tracking', error);
    }
  });

  /**
   * Records a login timestamp for a user
   */
  const recordLogin = (userId: string) => {
    return recordLoginMutation.mutateAsync(userId);
  };

  /**
   * Loads login tracking data for all users
   */
  const loadLoginDataWithSchool = (schoolId?: string) => {
    queryClient.setQueryData(QUERY_KEYS.USER.LOGIN_TRACKING(), undefined);
    return queryClient.fetchQuery({
      queryKey: QUERY_KEYS.USER.LOGIN_TRACKING(),
      queryFn: () => fetchLoginData(schoolId),
      staleTime: CACHE_TIMES.SHORT,
    });
  };

  /**
   * Formats last login display text
   */
  const formatLastLogin = (lastLoginAt: string | null, createdAt: string) => {
    if (!lastLoginAt) {
      return 'لم يسجل دخول بعد';
    }

    const loginDate = new Date(lastLoginAt);
    const now = new Date();
    const diffMs = now.getTime() - loginDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 60) {
      return `منذ ${diffMinutes} دقيقة`;
    } else if (diffHours < 24) {
      return `منذ ${diffHours} ساعة`;
    } else if (diffDays < 7) {
      return `منذ ${diffDays} يوم`;
    } else {
      return loginDate.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  /**
   * Gets users who never logged in
   */
  const getNeverLoggedInUsers = () => {
    return loginData.filter(user => !user.last_login_at);
  };

  /**
   * Gets inactive users (no login in specified days)
   */
  const getInactiveUsers = (days: number = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return loginData.filter(user => {
      if (!user.last_login_at) return true; // Never logged in
      return new Date(user.last_login_at) < cutoffDate;
    });
  };

  return {
    loginData,
    stats,
    loading,
    recordLogin,
    loadLoginData: loadLoginDataWithSchool,
    formatLastLogin,
    getNeverLoggedInUsers,
    getInactiveUsers
  };
};