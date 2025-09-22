// React Hook للـ Logger
import { logger } from '../index';

export const useLogger = () => {
  return {
    debug: (message: string, context?: Record<string, unknown>) => 
      logger.debug(message, context),
    info: (message: string, context?: Record<string, unknown>) => 
      logger.info(message, context),
    warn: (message: string, context?: Record<string, unknown>) => 
      logger.warn(message, context),
    error: (message: string, error?: Error, context?: Record<string, unknown>) => 
      logger.error(message, error, context),
    getLogs: () => logger.getLogs(),
    clearLogs: () => logger.clearLogs(),
    exportLogs: () => logger.exportLogs()
  };
};