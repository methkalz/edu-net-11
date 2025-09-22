/**
 * Unified Audit System - Main Export Module
 * 
 * This module provides a comprehensive audit logging system for the Arabic Educational Platform.
 * It tracks all user actions, system events, and security-related activities for compliance
 * and monitoring purposes.
 * 
 * Features:
 * - Centralized audit logger with batch processing
 * - Standardized audit action and entity constants
 * - React hooks for component-level audit tracking
 * - Helper functions for common audit patterns
 * - Immediate and batched logging modes
 * - Comprehensive security event tracking
 * 
 * Usage:
 * ```typescript
 * import { auditLogger, AUDIT_ACTIONS, AUDIT_ENTITIES } from '@/lib/audit';
 * 
 * // Log user action
 * await auditLogger.log({
 *   action: AUDIT_ACTIONS.USER_LOGIN,
 *   entity: AUDIT_ENTITIES.USER,
 *   actor_user_id: user.id
 * });
 * ```
 * 
 * @author Educational Platform Team
 * @version 1.0.0
 */

// Export all audit system components
export * from './types/audit-types';
export * from './core/audit-logger';
export * from './constants/audit-constants';
export * from './helpers/audit-helpers';
export * from './hooks/use-audit';

// Create single application instance for consistent audit logging
import { AuditLogger } from './core/audit-logger';
export const auditLogger = AuditLogger.getInstance();

// Export helper utilities for common audit patterns
export { auditHelpers } from './helpers/audit-helpers';

// Export constants for direct use throughout the application
export { AUDIT_ACTIONS, AUDIT_ENTITIES } from './constants/audit-constants';