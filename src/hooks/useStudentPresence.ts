/**
 * Student Presence Hook
 * 
 * Manages student presence tracking and updates.
 * Automatically tracks user activity and sends presence updates to the server.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseStudentPresenceOptions {
  studentId?: string;
  updateInterval?: number; // in milliseconds, default 30 seconds
  enabled?: boolean;
}

export const useStudentPresence = ({
  studentId,
  updateInterval = 30000, // 30 seconds
  enabled = true
}: UseStudentPresenceOptions = {}) => {
  const location = useLocation();
  const { toast } = useToast();
  
  const lastActivityRef = useRef<number>(Date.now());
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isOnlineRef = useRef<boolean>(true);

  // Update presence function
  const updatePresence = useCallback(async (isOnline: boolean = true, currentPage?: string) => {
    if (!studentId || !enabled) return;

    try {
      const { error } = await supabase.rpc('update_student_presence_safe', {
        p_student_id: studentId,
        p_is_online: isOnline,
        p_current_page: currentPage || location.pathname
      });

      if (error) {
        console.error('Error updating student presence:', error);
      } else {
        console.log('Student presence updated:', { studentId, isOnline, currentPage: currentPage || location.pathname });
      }
    } catch (error) {
      console.error('Failed to update student presence:', error);
    }
  }, [studentId, enabled, location.pathname]);

  // Track user activity
  const trackActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    // If user was inactive and now active, update presence
    if (!isOnlineRef.current) {
      isOnlineRef.current = true;
      updatePresence(true);
    }
  }, [updatePresence]);

  // Check if user is still active
  const checkActivityStatus = useCallback(() => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    const isActive = timeSinceLastActivity < 60000; // 1 minute threshold

    if (isActive !== isOnlineRef.current) {
      isOnlineRef.current = isActive;
      updatePresence(isActive);
    } else if (isActive) {
      // Send heartbeat for active users
      updatePresence(true);
    }
  }, [updatePresence]);

  // Handle page visibility change
  const handleVisibilityChange = useCallback(() => {
    const isVisible = !document.hidden;
    
    if (isVisible) {
      trackActivity();
    } else {
      // User switched away, mark as potentially inactive
      setTimeout(() => {
        if (document.hidden) {
          isOnlineRef.current = false;
          updatePresence(false);
        }
      }, 5000); // 5 seconds grace period
    }
  }, [trackActivity, updatePresence]);

  // Handle online/offline events
  const handleOnlineStatus = useCallback(() => {
    const isOnline = navigator.onLine;
    isOnlineRef.current = isOnline;
    
    if (isOnline) {
      trackActivity();
    } else {
      updatePresence(false);
    }
  }, [trackActivity, updatePresence]);

  // Initialize presence tracking
  useEffect(() => {
    if (!enabled || !studentId) return;

    console.log('Initializing student presence tracking for:', studentId);

    // Initial presence update
    updatePresence(true);

    // Set up activity tracking
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, trackActivity, { passive: true });
    });

    // Set up visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Set up online/offline listeners
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    // Set up periodic presence updates
    updateIntervalRef.current = setInterval(checkActivityStatus, updateInterval);

    // Cleanup function
    return () => {
      console.log('Cleaning up student presence tracking for:', studentId);

      // Remove event listeners
      activityEvents.forEach(event => {
        document.removeEventListener(event, trackActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);

      // Clear interval
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }

      // Mark as offline on cleanup
      updatePresence(false);
    };
  }, [enabled, studentId, updateInterval, trackActivity, handleVisibilityChange, handleOnlineStatus, checkActivityStatus, updatePresence]);

  // Update presence when route changes
  useEffect(() => {
    if (enabled && studentId && isOnlineRef.current) {
      console.log('Page changed to:', location.pathname);
      updatePresence(true, location.pathname);
    }
  }, [location.pathname, enabled, studentId, updatePresence]);

  // Handle page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (studentId && enabled) {
        // Use sendBeacon for reliable offline status update
        const data = new FormData();
        data.append('student_id', studentId);
        data.append('is_online', 'false');
        
        // Fallback: synchronous request as last resort
        try {
          navigator.sendBeacon('/api/update-presence-offline', data);
        } catch (error) {
          console.warn('SendBeacon failed, using synchronous update');
          updatePresence(false);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [studentId, enabled, updatePresence]);

  return {
    updatePresence,
    trackActivity,
    isOnline: isOnlineRef.current
  };
};