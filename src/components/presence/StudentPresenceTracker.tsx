/**
 * Student Presence Tracker Component
 * 
 * A background component that tracks student presence and activity.
 * Should be included in the main app layout for authenticated students.
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStudentPresence } from '@/hooks/useStudentPresence';
import { supabase } from '@/integrations/supabase/client';

export const StudentPresenceTracker = () => {
  const { user } = useAuth();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);

  // Get student ID from the current user
  useEffect(() => {
    const fetchStudentId = async () => {
      if (!user) {
        setStudentId(null);
        setIsEnabled(false);
        return;
      }

      try {
        // Check if user is a student
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (profile?.role !== 'student') {
          console.log('User is not a student, presence tracking disabled');
          setIsEnabled(false);
          return;
        }

        // Get student record
        const { data: student, error } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching student data:', error);
          setIsEnabled(false);
          return;
        }

        if (student) {
          console.log('Student presence tracking enabled for student:', student.id);
          setStudentId(student.id);
          setIsEnabled(true);
        } else {
          console.log('No student record found for user:', user.id);
          setIsEnabled(false);
        }
      } catch (error) {
        console.error('Error initializing student presence tracking:', error);
        setIsEnabled(false);
      }
    };

    fetchStudentId();
  }, [user]);

  // Initialize presence tracking
  const { isOnline } = useStudentPresence({
    studentId: studentId || undefined,
    enabled: isEnabled,
    updateInterval: 30000 // 30 seconds
  });

  // Debug info (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && isEnabled && studentId) {
      console.log('StudentPresenceTracker Debug Info:', {
        userId: user?.id,
        studentId,
        isOnline,
        isEnabled
      });
    }
  }, [user?.id, studentId, isOnline, isEnabled]);

  // This component doesn't render anything visible
  return null;
};

export default StudentPresenceTracker;