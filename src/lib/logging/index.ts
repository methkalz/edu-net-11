/**
 * Unified Logging System - Main Export Module
 * 
 * This module provides a centralized logging system for the Arabic Educational Platform.
 * It exports all logging-related functionality including types, core logger, hooks,
 * and performance tracking utilities.
 * 
 * Features:
 * - Centralized logger instance with multiple severity levels
 * - Performance tracking and monitoring
 * - Storage adapters for different environments
 * - Utility functions for easy integration
 * - React hooks for component-level logging
 * 
 * Usage:
 * ```typescript
 * import { logger, logInfo, logError } from '@/lib/logging';
 * 
 * // Using the logger instance
 * logger.info('User action completed', { userId: '123' });
 * 
 * // Using utility functions
 * logError('Database connection failed', error, { retryCount: 3 });
 * ```
 * 
 * @author Educational Platform Team
 * @version 1.0.0
 */

// Export all logging system components
export * from './types/log-types';
export * from './core/logger';
export * from './hooks/use-logger';
export * from './utils/performance-tracker';

// Create single application instance for consistent logging
import { Logger } from './core/logger';
import { PerformanceTracker } from './utils/performance-tracker';

export const logger = new Logger();

// Utility functions for convenient logging across the application
export const logDebug = (message: string, context?: Record<string, unknown>) => 
  logger.debug(message, context);

export const logInfo = (message: string, context?: Record<string, unknown>) => 
  logger.info(message, context);

export const logWarn = (message: string, context?: Record<string, unknown>) => 
  logger.warn(message, context);

export const logError = (message: string, error?: Error, context?: Record<string, unknown>) => 
  logger.error(message, error, context);

// Performance monitoring decorator for function execution tracking
export const withPerformanceLogging = PerformanceTracker.withPerformanceLogging;