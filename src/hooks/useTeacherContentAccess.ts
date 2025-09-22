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

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';

interface TeacherContentSettings {
  restrict_to_assigned_grades: boolean;
  allow_cross_grade_access: boolean;
  show_all_package_content: boolean;
}

interface PackageContent {
  available_grade_contents: string[];
}

export const useTeacherContentAccess = () => {
  const { userProfile } = useAuth();
  const [allowedGrades, setAllowedGrades] = useState<string[]>([]);
  const [contentSettings, setContentSettings] = useState<TeacherContentSettings>({
    restrict_to_assigned_grades: true,
    allow_cross_grade_access: false,
    show_all_package_content: false
  });
  const [packageGrades, setPackageGrades] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeacherContentAccess = async () => {
    if (!userProfile?.user_id || !userProfile?.school_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
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
        
        setAllowedGrades(availableGrades);
        setPackageGrades(availableGrades);
        setContentSettings({
          restrict_to_assigned_grades: false,
          allow_cross_grade_access: true,
          show_all_package_content: true
        });
        return;
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
      setContentSettings(settings);

      // Fetch school package content using unified function
      const { data: packageData, error: packageError } = await supabase
        .rpc('get_school_active_package', { school_uuid: userProfile.school_id });

      if (packageError) {
        logger.error('Error fetching school package', packageError);
      }

      const availableGrades = (packageData as any)?.available_grade_contents || [];
      setPackageGrades(availableGrades);

      // If settings allow all package content, return all grades
      if (settings.show_all_package_content) {
        setAllowedGrades(availableGrades);
        return;
      }

      // Fetch teacher assigned grades
      const { data: assignedGrades, error: gradesError } = await supabase
        .rpc('get_teacher_assigned_grade_levels', { teacher_user_id: userProfile.user_id });

      if (gradesError) {
        logger.error('Error fetching teacher assigned grades', gradesError);
        setAllowedGrades(availableGrades); // Fallback to all package grades
        return;
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

      setAllowedGrades(finalGrades);

      logger.info('Teacher content access loaded', {
        assignedGrades,
        packageGrades: availableGrades,
        finalGrades,
        settings
      });

    } catch (error) {
      logger.error('Error fetching teacher content access', error as Error);
      // Fallback: allow all grades if there's an error
      setAllowedGrades(['10', '11', '12']);
    } finally {
      setLoading(false);
    }
  };

  const canAccessGrade = (grade: string): boolean => {
    return allowedGrades.includes(grade);
  };

  const getAccessibleContentForGrade = (grade: string) => {
    if (!canAccessGrade(grade)) {
      return { videos: [], documents: [] };
    }
    return { canAccess: true };
  };

  useEffect(() => {
    if (userProfile) {
      fetchTeacherContentAccess();
    }
  }, [userProfile]);

  return {
    allowedGrades,
    contentSettings,
    packageGrades,
    canAccessGrade,
    getAccessibleContentForGrade,
    loading,
    refreshAccess: fetchTeacherContentAccess
  };
};