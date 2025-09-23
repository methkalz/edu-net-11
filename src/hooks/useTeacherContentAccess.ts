/**
 * Teacher Content Access Hook
 * 
 * Custom React hook for managing teacher access to educational content
 * based on their assigned classes and school settings.
 * 
 * Features:
 * - Fetches teacher assigned grade levels
 * - Applies school content settings
 * - Filters content based on package restrictions
 * - Provides flexible content access control
 * 
 * @example
 * const { 
 *   allowedGrades, 
 *   contentSettings, 
 *   canAccessGrade, 
 *   loading 
 * } = useTeacherContentAccess();
 * 
 * @author Educational Platform Team
 * @version 1.0.0
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';
import { QUERY_KEYS, CACHE_TIMES } from '@/lib/query-keys';

interface TeacherContentSettings {
  restrict_to_assigned_grades: boolean;
  allow_cross_grade_access: boolean;
  show_all_package_content: boolean;
}

interface PackageContent {
  available_grade_contents: string[];
}

// Fetch functions
const fetchTeacherContentAccess = async (userProfile: any) => {
  if (!userProfile?.user_id || !userProfile?.school_id) {
    throw new Error('Missing user profile data');
  }

  logger.debug('Fetching teacher content access', { 
    teacherId: userProfile.user_id,
    role: userProfile.role 
  });

  // If not a teacher, allow all content based on package
  if (userProfile.role !== 'teacher') {
    // Fetch school package content using unified function
    const { data: packageData, error: packageError } = await supabase
      .rpc('get_school_active_package', { school_uuid: userProfile.school_id });

    if (packageError) {
      logger.error('Error fetching school package', packageError);
    }

    const availableGrades = (packageData as any)?.available_grade_contents || [];
    
    return {
      allowedGrades: availableGrades,
      contentSettings: {
        restrict_to_assigned_grades: false,
        allow_cross_grade_access: true,
        show_all_package_content: true
      },
      packageGrades: availableGrades
    };
  }

  // Fetch school content settings
  const { data: settingsData, error: settingsError } = await supabase
    .rpc('get_school_content_settings', { school_uuid: userProfile.school_id });

  if (settingsError) {
    logger.error('Error fetching content settings', settingsError);
  }

  const settings: TeacherContentSettings = (settingsData as any) || {
    restrict_to_assigned_grades: true,
    allow_cross_grade_access: false,
    show_all_package_content: false
  };

  // Fetch school package content using unified function
  const { data: packageData, error: packageError } = await supabase
    .rpc('get_school_active_package', { school_uuid: userProfile.school_id });

  if (packageError) {
    logger.error('Error fetching school package', packageError);
  }

  const availableGrades = (packageData as any)?.available_grade_contents || [];

  // If settings allow all package content, return all grades
  if (settings.show_all_package_content) {
    return {
      allowedGrades: availableGrades,
      contentSettings: settings,
      packageGrades: availableGrades
    };
  }

  // Fetch teacher assigned grades
  const { data: assignedGrades, error: gradesError } = await supabase
    .rpc('get_teacher_assigned_grade_levels', { teacher_user_id: userProfile.user_id });

  if (gradesError) {
    logger.error('Error fetching teacher assigned grades', gradesError);
    return {
      allowedGrades: availableGrades, // Fallback to all package grades
      contentSettings: settings,
      packageGrades: availableGrades
    };
  }

  // Filter grades based on settings
  let finalGrades: string[] = [];

  if (settings.restrict_to_assigned_grades) {
    // Only show assigned grades that are also in the package
    finalGrades = (assignedGrades || []).filter(grade => 
      availableGrades.includes(grade)
    );
  } else {
    // Show all package grades regardless of assignment
    finalGrades = availableGrades;
  }

  logger.info('Teacher content access loaded', {
    assignedGrades,
    packageGrades: availableGrades,
    finalGrades,
    settings
  });

  return {
    allowedGrades: finalGrades,
    contentSettings: settings,
    packageGrades: availableGrades
  };
};

export const useTeacherContentAccess = () => {
  const { userProfile } = useAuth();

  const {
    data: accessData = {
      allowedGrades: [],
      contentSettings: {
        restrict_to_assigned_grades: true,
        allow_cross_grade_access: false,
        show_all_package_content: false
      },
      packageGrades: []
    },
    isLoading: loading,
    error,
    refetch: refreshAccess,
  } = useQuery({
    queryKey: QUERY_KEYS.TEACHER.CONTENT_ACCESS(userProfile?.user_id || '', userProfile?.school_id || ''),
    queryFn: () => fetchTeacherContentAccess(userProfile),
    enabled: Boolean(userProfile?.user_id && userProfile?.school_id),
    staleTime: CACHE_TIMES.MEDIUM, // Cache for 15 minutes
    gcTime: CACHE_TIMES.LONG, // Keep in cache for 1 hour
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) return false;
      return failureCount < 2;
    },
  });

  const { allowedGrades, contentSettings, packageGrades } = accessData;

  const canAccessGrade = (grade: string): boolean => {
    return allowedGrades.includes(grade);
  };

  const getAccessibleContentForGrade = (grade: string) => {
    if (!canAccessGrade(grade)) {
      return { videos: [], documents: [] };
    }
    return { canAccess: true };
  };

  return {
    allowedGrades,
    contentSettings,
    packageGrades,
    canAccessGrade,
    getAccessibleContentForGrade,
    loading,
    refreshAccess
  };
};