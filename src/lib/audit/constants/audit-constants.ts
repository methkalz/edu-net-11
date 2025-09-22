// ثوابت نظام المراجعة
export const AUDIT_ACTIONS = {
  // Authentication
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_SIGNUP: 'user_signup',
  PASSWORD_CHANGE: 'password_change',

  // School Management
  SCHOOL_CREATE: 'school_create',
  SCHOOL_UPDATE: 'school_update',
  SCHOOL_DELETE: 'school_delete',

  // Student Management
  STUDENT_CREATE: 'student_create',
  STUDENT_UPDATE: 'student_update',
  STUDENT_DELETE: 'student_delete',
  STUDENT_ENROLL: 'student_enroll',
  STUDENT_REMOVE: 'student_remove',

  // Admin Actions
  ADMIN_CREATE: 'admin_create',
  ADMIN_UPDATE: 'admin_update',
  ADMIN_DELETE: 'admin_delete',
  ROLE_CHANGE: 'role_change',

  // Content Management
  CONTENT_CREATE: 'content_create',
  CONTENT_UPDATE: 'content_update',
  CONTENT_DELETE: 'content_delete',
  CONTENT_PUBLISH: 'content_publish',

  // System Actions
  SETTING_CHANGE: 'setting_change',
  PLUGIN_ENABLE: 'plugin_enable',
  PLUGIN_DISABLE: 'plugin_disable',
  PACKAGE_ASSIGN: 'package_assign',
  PACKAGE_REMOVE: 'package_remove',

  // Security Events
  SECURITY_BREACH: 'security_breach',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  ACCESS_DENIED: 'access_denied',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded'
} as const;

export const AUDIT_ENTITIES = {
  USER: 'user',
  SCHOOL: 'school',
  STUDENT: 'student',
  ADMIN: 'admin',
  CONTENT: 'content',
  SETTING: 'setting',
  PLUGIN: 'plugin',
  PACKAGE: 'package',
  SESSION: 'session',
  SYSTEM: 'system'
} as const;

export const DEFAULT_AUDIT_CONFIG = {
  batchSize: 10,
  flushInterval: 5000, // 5 seconds
  enableBatching: true,
  maxRetries: 3
} as const;