/**
 * Unified Error Handling System - Main Export Module
 * 
 * This module provides a comprehensive error handling system for the Arabic Educational Platform.
 * It exports all error-handling functionality including types, handlers, factories,
 * and utility functions for graceful error management.
 * 
 * Features:
 * - Centralized error handler with multiple notification channels
 * - Error factory for creating standardized error objects
 * - React hooks for component-level error handling
 * - Async utilities with retry mechanisms and safe execution
 * - Translation support for user-friendly error messages
 * 
 * Usage:
 * ```typescript
 * import { handleError, withRetry, useErrorHandler } from '@/lib/error-handling';
 * 
 * // Handle any error with context
 * handleError(error, { userId: '123', action: 'fetchData' });
 * 
 * // Retry failed operations
 * const result = await withRetry(() => fetchUserData(), { maxRetries: 3 });
 * ```
 * 
 * @author Educational Platform Team
 * @version 1.0.0
 */

// Export all error handling system components
export * from './types/error-types';
export * from './core/error-handler';
export * from './factory/error-factory';
export * from './hooks/use-error-handler';
export * from './utils/async-helpers';

// Create single application instance for consistent error handling
import { AppErrorHandler } from './core/error-handler';
export const errorHandler = AppErrorHandler.getInstance();

// Utility functions for convenient error handling across the application
export const handleError = (error: unknown, context?: Record<string, unknown>) =>
  errorHandler.handleError(error, context);

// Re-export async utilities for direct access
export { handleAsyncError, withRetry, safeExecute } from './utils/async-helpers';