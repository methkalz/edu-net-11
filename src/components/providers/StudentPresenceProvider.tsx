import React from 'react';
import { useStudentPresenceUpdater } from '@/hooks/useStudentPresenceUpdater';
import { useTeacherPresenceUpdater } from '@/hooks/useTeacherPresenceUpdater';

interface StudentPresenceProviderProps {
  children: React.ReactNode;
}

/**
 * Provider لتتبع حضور الطلاب والمعلمين ومدراء المدارس تلقائياً
 */
export const StudentPresenceProvider: React.FC<StudentPresenceProviderProps> = ({ children }) => {
  // تفعيل تتبع الحضور للطلاب
  useStudentPresenceUpdater();
  
  // تفعيل تتبع الحضور للمعلمين ومدراء المدارس
  useTeacherPresenceUpdater();

  return <>{children}</>;
};