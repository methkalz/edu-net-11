import React from 'react';
import { useStudentPresenceUpdater } from '@/hooks/useStudentPresenceUpdater';

interface StudentPresenceProviderProps {
  children: React.ReactNode;
}

/**
 * Provider لتتبع حضور الطلاب تلقائيا
 */
export const StudentPresenceProvider: React.FC<StudentPresenceProviderProps> = ({ children }) => {
  // تفعيل تتبع الحضور للطلاب
  useStudentPresenceUpdater();

  return <>{children}</>;
};