// مساعدات نظام المراجعة
import { auditLogger } from '../index';
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from '../constants/audit-constants';

export const auditHelpers = {
  // User actions
  async logUserAction(
    userId: string, 
    action: string, 
    entity: string, 
    entityId?: string, 
    payload?: Record<string, unknown>
  ): Promise<void> {
    await auditLogger.log({
      action,
      entity,
      entity_id: entityId,
      actor_user_id: userId,
      payload_json: payload
    });
  },

  // Security events (high priority)
  async logSecurityEvent(
    userId: string, 
    action: string, 
    payload?: Record<string, unknown>
  ): Promise<void> {
    await auditLogger.logImmediate({
      action,
      entity: AUDIT_ENTITIES.SYSTEM,
      actor_user_id: userId,
      payload_json: payload
    });
  },

  // System changes (high priority)
  async logSystemChange(
    userId: string, 
    action: string, 
    entity: string, 
    entityId?: string, 
    payload?: Record<string, unknown>
  ): Promise<void> {
    await auditLogger.logImmediate({
      action,
      entity,
      entity_id: entityId,
      actor_user_id: userId,
      payload_json: payload
    });
  },

  // Authentication events
  async logLogin(userId: string, payload?: Record<string, unknown>): Promise<void> {
    await this.logUserAction(userId, AUDIT_ACTIONS.USER_LOGIN, AUDIT_ENTITIES.USER, userId, payload);
  },

  async logLogout(userId: string, payload?: Record<string, unknown>): Promise<void> {
    await this.logUserAction(userId, AUDIT_ACTIONS.USER_LOGOUT, AUDIT_ENTITIES.USER, userId, payload);
  },

  // School management
  async logSchoolCreate(userId: string, schoolId: string, payload?: Record<string, unknown>): Promise<void> {
    await this.logSystemChange(userId, AUDIT_ACTIONS.SCHOOL_CREATE, AUDIT_ENTITIES.SCHOOL, schoolId, payload);
  },

  async logSchoolUpdate(userId: string, schoolId: string, payload?: Record<string, unknown>): Promise<void> {
    await this.logUserAction(userId, AUDIT_ACTIONS.SCHOOL_UPDATE, AUDIT_ENTITIES.SCHOOL, schoolId, payload);
  },

  async logSchoolDelete(userId: string, schoolId: string, payload?: Record<string, unknown>): Promise<void> {
    await this.logSystemChange(userId, AUDIT_ACTIONS.SCHOOL_DELETE, AUDIT_ENTITIES.SCHOOL, schoolId, payload);
  },

  // Student management
  async logStudentCreate(userId: string, studentId: string, payload?: Record<string, unknown>): Promise<void> {
    await this.logUserAction(userId, AUDIT_ACTIONS.STUDENT_CREATE, AUDIT_ENTITIES.STUDENT, studentId, payload);
  },

  async logStudentUpdate(userId: string, studentId: string, payload?: Record<string, unknown>): Promise<void> {
    await this.logUserAction(userId, AUDIT_ACTIONS.STUDENT_UPDATE, AUDIT_ENTITIES.STUDENT, studentId, payload);
  },

  async logStudentDelete(userId: string, studentId: string, payload?: Record<string, unknown>): Promise<void> {
    await this.logSystemChange(userId, AUDIT_ACTIONS.STUDENT_DELETE, AUDIT_ENTITIES.STUDENT, studentId, payload);
  },

  // Content management
  async logContentCreate(userId: string, contentId: string, payload?: Record<string, unknown>): Promise<void> {
    await this.logUserAction(userId, AUDIT_ACTIONS.CONTENT_CREATE, AUDIT_ENTITIES.CONTENT, contentId, payload);
  },

  async logContentUpdate(userId: string, contentId: string, payload?: Record<string, unknown>): Promise<void> {
    await this.logUserAction(userId, AUDIT_ACTIONS.CONTENT_UPDATE, AUDIT_ENTITIES.CONTENT, contentId, payload);
  },

  async logContentDelete(userId: string, contentId: string, payload?: Record<string, unknown>): Promise<void> {
    await this.logUserAction(userId, AUDIT_ACTIONS.CONTENT_DELETE, AUDIT_ENTITIES.CONTENT, contentId, payload);
  },

  // Access control
  async logAccessDenied(userId: string, resource: string, payload?: Record<string, unknown>): Promise<void> {
    await this.logSecurityEvent(userId, AUDIT_ACTIONS.ACCESS_DENIED, {
      resource,
      ...payload
    });
  },

  async logSuspiciousActivity(userId: string, activity: string, payload?: Record<string, unknown>): Promise<void> {
    await this.logSecurityEvent(userId, AUDIT_ACTIONS.SUSPICIOUS_ACTIVITY, {
      activity,
      ...payload
    });
  }
};