/**
 * Realtime Presence Hook
 * 
 * Subscribes to real-time updates for student presence data.
 * Used by teachers and admins to monitor online students.
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface StudentPresence {
  student_id: string;
  user_id: string;
  school_id: string;
  is_online: boolean;
  last_seen_at: string;
  current_page?: string;
  updated_at: string;
  // Joined from students table
  full_name?: string;
  email?: string;
  username?: string;
}

interface UseRealtimePresenceOptions {
  schoolId?: string;
  classIds?: string[];
  enabled?: boolean;
}

interface UseRealtimePresenceReturn {
  onlineStudents: StudentPresence[];
  allStudents: StudentPresence[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export const useRealtimePresence = ({
  schoolId,
  classIds = [],
  enabled = true
}: UseRealtimePresenceOptions = {}): UseRealtimePresenceReturn => {
  const [onlineStudents, setOnlineStudents] = useState<StudentPresence[]>([]);
  const [allStudents, setAllStudents] = useState<StudentPresence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Fetch initial presence data
  const fetchPresenceData = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('student_presence')
        .select(`
          *,
          students!inner (
            id,
            full_name,
            email,
            username,
            school_id
          )
        `);

      // Filter by school if provided
      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }

      // If specific class IDs are provided, filter by them
      if (classIds.length > 0) {
        const { data: classStudents } = await supabase
          .from('class_students')
          .select('student_id')
          .in('class_id', classIds);

        if (classStudents && classStudents.length > 0) {
          const studentIds = classStudents.map(cs => cs.student_id);
          query = query.in('student_id', studentIds);
        }
      }

      const { data, error: fetchError } = await query.order('last_seen_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching presence data:', fetchError);
        setError(fetchError.message);
        return;
      }

      // Transform the data to match our interface
      const transformedData: StudentPresence[] = (data || []).map(item => ({
        student_id: item.student_id,
        user_id: item.user_id,
        school_id: item.school_id,
        is_online: item.is_online,
        last_seen_at: item.last_seen_at,
        current_page: item.current_page,
        updated_at: item.updated_at,
        full_name: item.students?.full_name,
        email: item.students?.email,
        username: item.students?.username
      }));

      setAllStudents(transformedData);
      setOnlineStudents(transformedData.filter(student => student.is_online));

      console.log('Fetched presence data:', {
        total: transformedData.length,
        online: transformedData.filter(s => s.is_online).length
      });

    } catch (err) {
      console.error('Error in fetchPresenceData:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [enabled, schoolId, classIds]);

  // Handle real-time updates
  const handlePresenceUpdate = useCallback((payload: any) => {
    console.log('Received presence update:', payload);

    const updateStudentPresence = (students: StudentPresence[]) => {
      const updatedStudents = [...students];
      const existingIndex = updatedStudents.findIndex(s => s.student_id === payload.new.student_id);

      if (existingIndex >= 0) {
        // Update existing student
        updatedStudents[existingIndex] = {
          ...updatedStudents[existingIndex],
          ...payload.new
        };
      } else {
        // Add new student (this might happen if student was just created)
        updatedStudents.push({
          student_id: payload.new.student_id,
          user_id: payload.new.user_id,
          school_id: payload.new.school_id,
          is_online: payload.new.is_online,
          last_seen_at: payload.new.last_seen_at,
          current_page: payload.new.current_page,
          updated_at: payload.new.updated_at
        });
      }

      return updatedStudents;
    };

    if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
      setAllStudents(prev => updateStudentPresence(prev));
      setOnlineStudents(prev => updateStudentPresence(prev).filter(s => s.is_online));
    } else if (payload.eventType === 'DELETE') {
      setAllStudents(prev => prev.filter(s => s.student_id !== payload.old.student_id));
      setOnlineStudents(prev => prev.filter(s => s.student_id !== payload.old.student_id));
    }
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    if (!enabled) return;

    // Fetch initial data
    fetchPresenceData();

    // Set up real-time subscription
    const presenceChannel = supabase
      .channel('student-presence-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_presence',
          filter: schoolId ? `school_id=eq.${schoolId}` : undefined
        },
        handlePresenceUpdate
      )
      .subscribe((status) => {
        console.log('Presence channel subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to presence updates');
        }
      });

    setChannel(presenceChannel);

    return () => {
      console.log('Cleaning up presence subscription');
      if (presenceChannel) {
        supabase.removeChannel(presenceChannel);
      }
    };
  }, [enabled, schoolId, classIds.join(','), fetchPresenceData, handlePresenceUpdate]);

  const refreshData = useCallback(async () => {
    await fetchPresenceData();
  }, [fetchPresenceData]);

  return {
    onlineStudents,
    allStudents,
    loading,
    error,
    refreshData
  };
};