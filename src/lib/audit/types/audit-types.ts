// أنواع نظام المراجعة
export interface AuditLogEntry {
  id?: string;
  action: string;
  entity: string;
  entity_id?: string;
  actor_user_id: string;
  payload_json?: any;
  created_at_utc?: string;
}

export interface AuditConfig {
  batchSize: number;
  flushInterval: number;
  enableBatching: boolean;
  maxRetries: number;
}

export interface AuditStats {
  queueSize: number;
  totalProcessed: number;
  failedAttempts: number;
  lastFlushTime?: string;
}