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

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { auditLogger, AUDIT_ACTIONS, AUDIT_ENTITIES } from '@/lib/audit';
import { logger } from '@/lib/logger';

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

export const useLoginTracking = () => {
  const [loginData, setLoginData] = useState<LoginTrackingData[]>([]);
  const [stats, setStats] = useState<LoginStats>({
    totalUsers: 0,
    activeToday: 0,
    activeThisWeek: 0,
    activeThisMonth: 0,
    neverLoggedIn: 0
  });
  const [loading, setLoading] = useState(false);

  /**
   * Records a login timestamp for a user
   */
  const recordLogin = async (userId: string) => {
    try {
      const now = new Date().toISOString();
      
      // Get current login count - handle case where column might not exist yet
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('*')  // Select all columns to handle missing columns gracefully
        .eq('user_id', userId)
        .single();

      const currentCount = (currentProfile as any)?.login_count || 0;
      
      // Update last login and increment count - handle missing columns gracefully
      try {
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
      } catch (error) {
        logger.error('Error updating login tracking', error);
        return;
      }
    } catch (error) {
      logger.error('Error in recordLogin', error as Error);
    }
  };

  /**
   * Loads login tracking data for all users
   */
  const loadLoginData = async (schoolId?: string) => {
    setLoading(true);
    try {
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

      setLoginData(processedData);
      calculateStats(processedData);
    } catch (error) {
      logger.error('Error loading login data', error as Error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calculates login statistics
   */
  const calculateStats = (data: LoginTrackingData[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats: LoginStats = {
      totalUsers: data.length,
      activeToday: 0,
      activeThisWeek: 0,
      activeThisMonth: 0,
      neverLoggedIn: 0
    };

    data.forEach(user => {
      if (!user.last_login_at) {
        stats.neverLoggedIn++;
        return;
      }

      const lastLogin = new Date(user.last_login_at);
      
      if (lastLogin >= today) {
        stats.activeToday++;
      }
      
      if (lastLogin >= weekAgo) {
        stats.activeThisWeek++;
      }
      
      if (lastLogin >= monthAgo) {
        stats.activeThisMonth++;
      }
    });

    setStats(stats);
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
    loadLoginData,
    formatLastLogin,
    getNeverLoggedInUsers,
    getInactiveUsers
  };
};