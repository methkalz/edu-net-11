import { useAuth } from '@/hooks/useAuth';

export type ContentAccessLevel = 'VIEW_ONLY' | 'REVIEW' | 'MANAGE' | 'CUSTOM';

export interface ContentPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canCreate: boolean;
  canReview: boolean;
  canSave: boolean;
  canComment: boolean;
  accessLevel: ContentAccessLevel;
  allowedGrades: string[];
}

export const useContentPermissions = () => {
  const { userProfile } = useAuth();

  const getPermissions = (): ContentPermissions => {
    if (!userProfile) {
      return {
        canView: false,
        canEdit: false,
        canDelete: false,
        canCreate: false,
        canReview: false,
        canSave: false,
        canComment: false,
        accessLevel: 'VIEW_ONLY',
        allowedGrades: []
      };
    }

    switch (userProfile.role) {
      case 'superadmin':
        return {
          canView: true,
          canEdit: true,
          canDelete: true,
          canCreate: true,
          canReview: true,
          canSave: true,
          canComment: true,
          accessLevel: 'MANAGE',
          allowedGrades: ['grade10', 'grade11', 'grade12']
        };

      case 'school_admin':
        return {
          canView: true,
          canEdit: false,
          canDelete: false,
          canCreate: false,
          canReview: true,
          canSave: true,
          canComment: true,
          accessLevel: 'REVIEW',
          allowedGrades: ['grade10', 'grade11', 'grade12']
        };

      case 'teacher':
        return {
          canView: true,
          canEdit: false,
          canDelete: false,
          canCreate: false,
          canReview: true,
          canSave: true,
          canComment: true,
          accessLevel: 'CUSTOM',
          allowedGrades: ['grade10', 'grade11', 'grade12'] // سيتم تحديدها لاحقاً حسب الصفوف المخصصة
        };

      case 'student':
        return {
          canView: true,
          canEdit: false,
          canDelete: false,
          canCreate: false,
          canReview: false,
          canSave: false,
          canComment: false,
          accessLevel: 'VIEW_ONLY',
          allowedGrades: ['grade10', 'grade11', 'grade12'] // سيتم تحديدها حسب صف الطالب
        };

      default:
        return {
          canView: false,
          canEdit: false,
          canDelete: false,
          canCreate: false,
          canReview: false,
          canSave: false,
          canComment: false,
          accessLevel: 'VIEW_ONLY',
          allowedGrades: []
        };
    }
  };

  const permissions = getPermissions();

  return {
    ...permissions,
    isManager: permissions.accessLevel === 'MANAGE',
    isReviewer: permissions.accessLevel === 'REVIEW',
    isViewer: permissions.accessLevel === 'VIEW_ONLY',
    hasCustomAccess: permissions.accessLevel === 'CUSTOM'
  };
};