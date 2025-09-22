// معالج الدفعات لسجلات المراجعة
import { supabase } from '@/integrations/supabase/client';
import { logger } from '../../logger';
import type { AuditLogEntry, AuditConfig } from '../types/audit-types';

export class BatchProcessor {
  private batchQueue: AuditLogEntry[] = [];
  private timer: NodeJS.Timeout | null = null;
  private config: AuditConfig;
  private stats = {
    totalProcessed: 0,
    failedAttempts: 0,
    lastFlushTime: undefined as string | undefined
  };

  constructor(config: AuditConfig) {
    this.config = config;
    if (config.enableBatching) {
      this.startBatchProcessor();
    }
  }

  private startBatchProcessor(): void {
    this.timer = setInterval(() => {
      this.flushBatch();
    }, this.config.flushInterval);
  }

  public async addToBatch(entry: AuditLogEntry): Promise<void> {
    if (!this.config.enableBatching) {
      // Process immediately if batching is disabled
      await this.processSingle(entry);
      return;
    }

    // Add to batch queue
    this.batchQueue.push(entry);

    // Flush immediately if batch is full
    if (this.batchQueue.length >= this.config.batchSize) {
      await this.flushBatch();
    }
  }

  public async flushBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return;

    const batch = [...this.batchQueue];
    this.batchQueue = [];

    let retryCount = 0;
    while (retryCount <= this.config.maxRetries) {
      try {
        const { error } = await supabase
          .from('audit_log')
          .insert(batch);

        if (error) {
          throw error;
        }

        // Success
        this.stats.totalProcessed += batch.length;
        this.stats.lastFlushTime = new Date().toISOString();
        
        logger.info('Audit log batch inserted successfully', { 
          count: batch.length,
          totalProcessed: this.stats.totalProcessed
        });
        
        return;

      } catch (error) {
        retryCount++;
        this.stats.failedAttempts++;
        
        if (retryCount > this.config.maxRetries) {
          logger.error('Failed to insert audit log batch after all retries', error as Error, {
            batchSize: batch.length,
            retryCount,
            maxRetries: this.config.maxRetries
          });

          // Re-queue the failed batch to front for next attempt
          this.batchQueue.unshift(...batch);
          return;
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      }
    }
  }

  private async processSingle(entry: AuditLogEntry): Promise<void> {
    try {
      const { error } = await supabase
        .from('audit_log')
        .insert([entry]);

      if (error) {
        throw error;
      }

      this.stats.totalProcessed++;
      logger.info('Immediate audit log inserted', { action: entry.action });

    } catch (error) {
      this.stats.failedAttempts++;
      logger.error('Failed to insert immediate audit log', error as Error);
      
      // Add to batch queue as fallback
      if (this.config.enableBatching) {
        this.batchQueue.push(entry);
      }
    }
  }

  public getStats() {
    return {
      queueSize: this.batchQueue.length,
      ...this.stats
    };
  }

  public async forceFlush(): Promise<void> {
    if (this.batchQueue.length > 0) {
      await this.flushBatch();
    }
  }

  public destroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    // Flush remaining entries
    this.flushBatch();
  }
}