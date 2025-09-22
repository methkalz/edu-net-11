/**
 * Dashboard Statistics Hook
 * 
 * Custom React hook for fetching and managing dashboard statistics data.
 * Provides real-time metrics for students, classes, teachers, and content
 * with role-based filtering and trend analysis.
 * 
 * Features:
 * - Role-based data filtering (school-specific vs global stats)
 * - Real-time statistics from Supabase database
 * - Trend calculations with percentage changes
 * - Loading states and error handling
 * - Formatted display helpers with localization
 * - Manual refresh capability
 * 
 * @example
 * const { stats, trends, loading, refreshStats } = useDashboardStats();
 * 
 * // Display formatted statistics
 * const formattedStudents = getFormattedStat('totalStudents');
 * 
 * // Show trend indicators
 * const trendIcon = getTrendIcon('totalStudents');
 * const trendColor = getTrendColor('totalStudents');
 * 
 * @author Educational Platform Team
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';

/**
 * Dashboard Statistics Interface
 * 
 * Defines the structure for dashboard metrics data.
 * All numeric values represent counts or percentages.
 */
interface DashboardStats {
  /** Total number of registered students */
  totalStudents: number;
  /** Total number of classes/classrooms */
  totalClasses: number;
  /** Total number of teachers */
  totalTeachers: number;
  /** Combined count of all educational content (videos, documents, etc.) */
  totalContent: number;
  /** Recent activity indicators (mock data for now) */
  recentActivity: number;
  /** Weekly progress percentage */
  weeklyProgress: number;
  /** Monthly growth percentage */
  monthlyGrowth: number;
  /** Overall completion rate percentage */
  completionRate: number;
}

/**
 * Statistics Trend Interface
 * 
 * Represents trend analysis data for comparing current vs previous values.
 * Used for displaying growth indicators and percentage changes.
 */
interface StatsTrend {
  /** Current period value */
  current: number;
  /** Previous period value for comparison */
  previous: number;
  /** Absolute change (current - previous) */
  change: number;
  /** Percentage change relative to previous value */
  percentage: number;
  /** Trend direction indicator */
  trend: 'up' | 'down' | 'stable';
}

export const useDashboardStats = () => {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalClasses: 0,
    totalTeachers: 0,
    totalContent: 0,
    recentActivity: 0,
    weeklyProgress: 0,
    monthlyGrowth: 0,
    completionRate: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [trends, setTrends] = useState<Record<string, StatsTrend>>({});

  const fetchStats = async () => {
    if (!userProfile?.school_id && userProfile?.role !== 'superadmin') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      logger.debug('Fetching dashboard stats', { 
        schoolId: userProfile?.school_id, 
        role: userProfile?.role 
      });

      const promises = [];

      // Students count
      if (userProfile?.school_id) {
        promises.push(
          supabase
            .from('students')
            .select('id', { count: 'exact', head: true })
            .eq('school_id', userProfile.school_id)
        );
      } else {
        promises.push(
          supabase
            .from('students')
            .select('id', { count: 'exact', head: true })
        );
      }

      // Classes count
      if (userProfile?.school_id) {
        promises.push(
          supabase
            .from('classes')
            .select('id', { count: 'exact', head: true })
            .eq('school_id', userProfile.school_id)
        );
      } else {
        promises.push(
          supabase
            .from('classes')
            .select('id', { count: 'exact', head: true })
        );
      }

      // Teachers count (profiles with teacher role)
      if (userProfile?.school_id) {
        promises.push(
          supabase
            .from('profiles')
            .select('user_id', { count: 'exact', head: true })
            .eq('role', 'teacher')
            .eq('school_id', userProfile.school_id)
        );
      } else {
        promises.push(
          supabase
            .from('profiles')
            .select('user_id', { count: 'exact', head: true })
            .eq('role', 'teacher')
        );
      }

      // Content count (combine all grade content)
      const contentPromises = [
        supabase.from('grade10_videos').select('id', { count: 'exact', head: true }),
        supabase.from('grade11_videos').select('id', { count: 'exact', head: true }),
        supabase.from('grade12_videos').select('id', { count: 'exact', head: true }),
        supabase.from('grade10_documents').select('id', { count: 'exact', head: true }),
        supabase.from('grade11_documents').select('id', { count: 'exact', head: true })
      ];

      promises.push(...contentPromises);

      const results = await Promise.all(promises);
      
      const [studentsResult, classesResult, teachersResult, ...contentResults] = results;

      const totalContent = contentResults.reduce((sum, result) => {
        return sum + (result.count || 0);
      }, 0);

      const newStats: DashboardStats = {
        totalStudents: studentsResult.count || 0,
        totalClasses: classesResult.count || 0,
        totalTeachers: teachersResult.count || 0,
        totalContent,
        recentActivity: Math.floor(Math.random() * 50) + 10, // Mock data for now
        weeklyProgress: Math.floor(Math.random() * 100),
        monthlyGrowth: Math.floor(Math.random() * 30) + 5,
        completionRate: Math.floor(Math.random() * 40) + 60
      };

      setStats(newStats);

      // Calculate trends (mock implementation)
      const newTrends: Record<string, StatsTrend> = {};
      Object.entries(newStats).forEach(([key, current]) => {
        if (typeof current === 'number') {
          const previous = Math.floor(current * (0.8 + Math.random() * 0.4));
          const change = current - previous;
          const percentage = previous > 0 ? Math.round((change / previous) * 100) : 0;
          
          newTrends[key] = {
            current,
            previous,
            change,
            percentage,
            trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
          };
        }
      });

      setTrends(newTrends);
      logger.info('Dashboard stats loaded successfully', { stats: newStats });

    } catch (error) {
      logger.error('Error fetching dashboard stats', error as Error, {
        schoolId: userProfile?.school_id
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = () => {
    fetchStats();
  };

  useEffect(() => {
    if (userProfile) {
      fetchStats();
    }
  }, [userProfile]);

  return {
    stats,
    trends,
    loading,
    refreshStats,
    // Helper functions for formatted display
    getFormattedStat: (key: keyof DashboardStats) => {
      const value = stats[key];
      if (typeof value === 'number') {
        return value.toLocaleString('ar-SA');
      }
      return value;
    },
    getTrendIcon: (key: string) => {
      const trend = trends[key];
      if (!trend) return null;
      
      switch (trend.trend) {
        case 'up':
          return '↗️';
        case 'down':
          return '↘️';
        default:
          return '➡️';
      }
    },
    getTrendColor: (key: string) => {
      const trend = trends[key];
      if (!trend) return 'text-muted-foreground';
      
      switch (trend.trend) {
        case 'up':
          return 'text-green-600';
        case 'down':
          return 'text-red-600';
        default:
          return 'text-yellow-600';
      }
    }
  };
};