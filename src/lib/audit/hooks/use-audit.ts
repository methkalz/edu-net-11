// React Hook لنظام المراجعة
import { useCallback } from 'react';
import { auditLogger, auditHelpers } from '../index';
import { useAuth } from '@/hooks/useAuth';

export const useAudit = () => {
  const { userProfile } = useAuth();
  const currentUserId = userProfile?.user_id || 'unknown';

  const logAction = useCallback(async (
    action: string,
    entity: string,
    entityId?: string,
    payload?: Record<string, unknown>
  ) => {
    await auditHelpers.logUserAction(currentUserId, action, entity, entityId, payload);
  }, [currentUserId]);

  const logSecurityEvent = useCallback(async (
    action: string,
    payload?: Record<string, unknown>
  ) => {
    await auditHelpers.logSecurityEvent(currentUserId, action, payload);
  }, [currentUserId]);

  const logSystemChange = useCallback(async (
    action: string,
    entity: string,
    entityId?: string,
    payload?: Record<string, unknown>
  ) => {
    await auditHelpers.logSystemChange(currentUserId, action, entity, entityId, payload);
  }, [currentUserId]);

  // Specific action helpers
  const logLogin = useCallback(async (payload?: Record<string, unknown>) => {
    await auditHelpers.logLogin(currentUserId, payload);
  }, [currentUserId]);

  const logLogout = useCallback(async (payload?: Record<string, unknown>) => {
    await auditHelpers.logLogout(currentUserId, payload);
  }, [currentUserId]);

  const logSchoolAction = useCallback(async (
    action: 'create' | 'update' | 'delete',
    schoolId: string,
    payload?: Record<string, unknown>
  ) => {
    switch (action) {
      case 'create':
        await auditHelpers.logSchoolCreate(currentUserId, schoolId, payload);
        break;
      case 'update':
        await auditHelpers.logSchoolUpdate(currentUserId, schoolId, payload);
        break;
      case 'delete':
        await auditHelpers.logSchoolDelete(currentUserId, schoolId, payload);
        break;
    }
  }, [currentUserId]);

  const logStudentAction = useCallback(async (
    action: 'create' | 'update' | 'delete',
    studentId: string,
    payload?: Record<string, unknown>
  ) => {
    switch (action) {
      case 'create':
        await auditHelpers.logStudentCreate(currentUserId, studentId, payload);
        break;
      case 'update':
        await auditHelpers.logStudentUpdate(currentUserId, studentId, payload);
        break;
      case 'delete':
        await auditHelpers.logStudentDelete(currentUserId, studentId, payload);
        break;
    }
  }, [currentUserId]);

  const logContentAction = useCallback(async (
    action: 'create' | 'update' | 'delete',
    contentId: string,
    payload?: Record<string, unknown>
  ) => {
    switch (action) {
      case 'create':
        await auditHelpers.logContentCreate(currentUserId, contentId, payload);
        break;
      case 'update':
        await auditHelpers.logContentUpdate(currentUserId, contentId, payload);
        break;
      case 'delete':
        await auditHelpers.logContentDelete(currentUserId, contentId, payload);
        break;
    }
  }, [currentUserId]);

  // Statistics and control
  const getStats = useCallback(() => {
    return auditLogger.getStats();
  }, []);

  const flush = useCallback(async () => {
    await auditLogger.flush();
  }, []);

  return {
    // General logging
    logAction,
    logSecurityEvent,
    logSystemChange,

    // Specific actions
    logLogin,
    logLogout,
    logSchoolAction,
    logStudentAction,
    logContentAction,

    // Control
    getStats,
    flush,

    // Current user info
    currentUserId
  };
};