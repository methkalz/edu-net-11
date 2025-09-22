import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { auditLogger, AUDIT_ACTIONS, AUDIT_ENTITIES } from '@/lib/audit-logger';
import { rateLimiters } from '@/lib/rate-limiter';
import { DataEncryption, sanitization } from '@/lib/encryption';
import { logError, logInfo } from '@/lib/logger';
import { StudentUpdateData, EncryptedStudentData } from '@/types/student';

export const useSecureOperations = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const executeSecureOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    operationInfo: {
      action: string;
      entity: string;
      entityId?: string;
      requiresEncryption?: boolean;
      rateLimitKey?: string;
    }
  ): Promise<T | null> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);

      // Rate limiting check
      if (operationInfo.rateLimitKey) {
        const rateCheck = rateLimiters.api.check(`${user.id}-${operationInfo.rateLimitKey}`);
        if (!rateCheck.allowed) {
          throw new Error(`Rate limit exceeded. Try again in ${rateCheck.retryAfter} seconds.`);
        }
      }

      // Log operation start
      await auditLogger.log({
        action: `${operationInfo.action}_start`,
        entity: operationInfo.entity,
        entity_id: operationInfo.entityId,
        actor_user_id: user.id,
        payload_json: {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        }
      });

      // Execute operation
      const result = await operation();

      // Log successful operation
      await auditLogger.log({
        action: `${operationInfo.action}_success`,
        entity: operationInfo.entity,
        entity_id: operationInfo.entityId,
        actor_user_id: user.id,
        payload_json: {
          timestamp: new Date().toISOString(),
          success: true
        }
      });

      logInfo(`Secure operation completed: ${operationInfo.action}`);
      return result;

    } catch (error) {
      // Log failed operation
      await auditLogger.logImmediate({
        action: `${operationInfo.action}_error`,
        entity: operationInfo.entity,
        entity_id: operationInfo.entityId,
        actor_user_id: user.id,
        payload_json: {
          timestamp: new Date().toISOString(),
          error: (error as Error).message,
          success: false
        }
      });

      logError(`Secure operation failed: ${operationInfo.action}`, error as Error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const encryptSensitiveData = useCallback((data: Record<string, unknown>) => {
    const encrypted: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        // Check if field contains sensitive data
        if (key.includes('password') || key.includes('secret') || key.includes('key')) {
          encrypted[key] = DataEncryption.encrypt(value);
        } else if (key.includes('email') || key.includes('phone') || key.includes('id')) {
          encrypted[key] = DataEncryption.encrypt(value);
        } else {
          encrypted[key] = sanitization.sanitizeHtml(value);
        }
      } else {
        encrypted[key] = value;
      }
    }
    
    return encrypted;
  }, []);

  const createSecureStudent = useCallback(async (studentData: StudentUpdateData) => {
    return executeSecureOperation(
      async () => {
        // Encrypt sensitive student data and ensure required fields
        const encryptedData = {
          full_name: studentData.full_name || '',
          email: studentData.email ? DataEncryption.encrypt(studentData.email) : undefined,
          phone: studentData.phone ? DataEncryption.encrypt(studentData.phone) : undefined,
          username: studentData.username || undefined,
          school_id: 'required-school-id', // This should come from context
          user_id: user.id,
          created_at_utc: new Date().toISOString()
        };
        
        const { data, error } = await supabase
          .from('students')
          .insert(encryptedData)
          .select()
          .single();

        if (error) throw error;
        return data;
      },
      {
        action: AUDIT_ACTIONS.STUDENT_CREATE,
        entity: AUDIT_ENTITIES.STUDENT,
        requiresEncryption: true,
        rateLimitKey: 'student_create'
      }
    );
  }, [executeSecureOperation]);

  const updateSecureStudent = useCallback(async (studentId: string, updateData: StudentUpdateData) => {
    return executeSecureOperation(
      async () => {
        // Encrypt sensitive update data
        const encryptedData: EncryptedStudentData = {};
        
        if (updateData.full_name) encryptedData.full_name = updateData.full_name;
        if (updateData.email) encryptedData.email = DataEncryption.encrypt(updateData.email);
        if (updateData.phone) encryptedData.phone = DataEncryption.encrypt(updateData.phone);
        if (updateData.username) encryptedData.username = updateData.username;
        
        const { data, error } = await supabase
          .from('students')
          .update(encryptedData)
          .eq('id', studentId)
          .select()
          .single();

        if (error) throw error;
        return data;
      },
      {
        action: AUDIT_ACTIONS.STUDENT_UPDATE,
        entity: AUDIT_ENTITIES.STUDENT,
        entityId: studentId,
        requiresEncryption: true,
        rateLimitKey: 'student_update'
      }
    );
  }, [executeSecureOperation]);

  const createSecureSchool = useCallback(async (schoolData: Record<string, unknown>) => {
    return executeSecureOperation(
      async () => {
        // Sanitize school data
        const sanitizedData = {
          ...schoolData,
          name: typeof schoolData.name === 'string' ? sanitization.sanitizeHtml(schoolData.name) : '',
          address: typeof schoolData.address === 'string' ? sanitization.sanitizeHtml(schoolData.address) : '',
          email: typeof schoolData.email === 'string' ? sanitization.sanitizeEmail(schoolData.email) : '',
          phone: typeof schoolData.phone === 'string' ? DataEncryption.encrypt(schoolData.phone) : null
        };
        
        const { data, error } = await supabase
          .from('schools')
          .insert(sanitizedData)
          .select()
          .single();

        if (error) throw error;
        return data;
      },
      {
        action: AUDIT_ACTIONS.SCHOOL_CREATE,
        entity: AUDIT_ENTITIES.SCHOOL,
        requiresEncryption: true,
        rateLimitKey: 'school_create'
      }
    );
  }, [executeSecureOperation]);

  const secureDeleteRecord = useCallback(async (tableType: 'students' | 'schools' | 'classes', id: string, entityType: string) => {
    return executeSecureOperation(
      async () => {
        let error;
        
        switch (tableType) {
          case 'students':
            ({ error } = await supabase.from('students').delete().eq('id', id));
            break;
          case 'schools':
            ({ error } = await supabase.from('schools').delete().eq('id', id));
            break;
          case 'classes':
            ({ error } = await supabase.from('classes').delete().eq('id', id));
            break;
          default:
            throw new Error('Unsupported table type');
        }

        if (error) throw error;
        return { success: true };
      },
      {
        action: `${entityType}_delete`,
        entity: entityType,
        entityId: id,
        rateLimitKey: `${entityType}_delete`
      }
    );
  }, [executeSecureOperation]);

  const logSecurityEvent = useCallback(async (eventType: string, details: Record<string, unknown>) => {
    if (!user) return;

    await auditLogger.logImmediate({
      action: eventType,
      entity: AUDIT_ENTITIES.SYSTEM,
      actor_user_id: user.id,
      payload_json: {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        ip: 'client-side', // Would be filled by server
        details
      }
    });
  }, [user]);

  return {
    loading,
    executeSecureOperation,
    encryptSensitiveData,
    createSecureStudent,
    updateSecureStudent,
    createSecureSchool,
    secureDeleteRecord,
    logSecurityEvent
  };
};