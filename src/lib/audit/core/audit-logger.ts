// نظام المراجعة الأساسي
import type { AuditLogEntry, AuditConfig } from '../types/audit-types';
import { BatchProcessor } from '../processors/batch-processor';
import { DEFAULT_AUDIT_CONFIG } from '../constants/audit-constants';

export class AuditLogger {
  private static instance: AuditLogger;
  private batchProcessor: BatchProcessor;
  private config: AuditConfig;

  private constructor(config?: Partial<AuditConfig>) {
    this.config = { ...DEFAULT_AUDIT_CONFIG, ...config };
    this.batchProcessor = new BatchProcessor(this.config);
  }

  public static getInstance(config?: Partial<AuditConfig>): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger(config);
    }
    return AuditLogger.instance;
  }

  public async log(entry: Omit<AuditLogEntry, 'id' | 'created_at_utc'>): Promise<void> {
    const auditEntry: AuditLogEntry = {
      ...entry,
      created_at_utc: new Date().toISOString()
    };

    await this.batchProcessor.addToBatch(auditEntry);
  }

  // High-priority actions that should be logged immediately
  public async logImmediate(entry: Omit<AuditLogEntry, 'id' | 'created_at_utc'>): Promise<void> {
    const auditEntry: AuditLogEntry = {
      ...entry,
      created_at_utc: new Date().toISOString()
    };

    // Create a temporary processor for immediate processing
    const immediateProcessor = new BatchProcessor({
      ...this.config,
      enableBatching: false
    });

    await immediateProcessor.addToBatch(auditEntry);
  }

  // Get statistics
  public getStats() {
    return this.batchProcessor.getStats();
  }

  // Force flush all pending entries
  public async flush(): Promise<void> {
    await this.batchProcessor.forceFlush();
  }

  // Update configuration
  public updateConfig(newConfig: Partial<AuditConfig>): void {
    this.config = { ...this.config, ...newConfig };
    // Note: This doesn't recreate the processor, 
    // so some changes might require restart
  }

  // Destroy the logger (cleanup)
  public destroy(): void {
    this.batchProcessor.destroy();
  }
}