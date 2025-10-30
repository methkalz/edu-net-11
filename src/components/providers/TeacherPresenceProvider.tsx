import React from 'react';
import { useTeacherPresenceUpdater } from '@/hooks/useTeacherPresenceUpdater';

interface TeacherPresenceProviderProps {
  children: React.ReactNode;
}

/**
 * Provider لتتبع حضور المعلمين ومدراء المدارس تلقائياً
 */
export const TeacherPresenceProvider: React.FC<TeacherPresenceProviderProps> = ({ children }) => {
  // تفعيل تتبع الحضور للمعلمين ومدراء المدارس
  useTeacherPresenceUpdater();

  return <>{children}</>;
};
