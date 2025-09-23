import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarEvent } from '@/types/common';
import { supabase } from '@/integrations/supabase/client';
import { logError, logInfo } from '@/lib/logger';
import { QUERY_KEYS, CACHE_TIMES } from '@/lib/query-keys';

// Fetch function
const fetchUpcomingEvents = async (limit: number, schoolId?: string): Promise<CalendarEvent[]> => {
  // جلب الأحداث من قاعدة البيانات
  let query = supabase
    .from('calendar_events')
    .select('*')
    .eq('is_active', true)
    .gte('date', new Date().toISOString().split('T')[0])
    .order('date', { ascending: true });

  // إذا كان schoolId محدد، جلب أحداث المدرسة فقط
  if (schoolId) {
    query = query.eq('school_id', schoolId);
  }

  const { data: dbEvents, error: dbError } = await query.limit(limit);

  if (dbError) {
    // في حالة الخطأ، استخدم localStorage كبديل
    const localEvents = localStorage.getItem('calendar_events');
    const allEvents: CalendarEvent[] = localEvents ? JSON.parse(localEvents) : [];
    
    const today = new Date();
    const upcomingEvents = allEvents
      .filter(event => new Date(event.date) >= today && event.is_active)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, limit);
    
    logError('Error fetching events from DB', dbError);
    return upcomingEvents;
  }

  // تحويل البيانات للنوع الصحيح
  const eventsWithCorrectType = (dbEvents || []).map(event => ({
    ...event,
    type: event.type as 'exam' | 'holiday' | 'meeting' | 'deadline' | 'other' | 'event' | 'important'
  }));
  
  // احفظ في localStorage كنسخة احتياطية
  localStorage.setItem('calendar_events', JSON.stringify(eventsWithCorrectType));
  
  logInfo('Calendar events fetched successfully', { count: eventsWithCorrectType.length });
  return eventsWithCorrectType;
};

export const useCalendarEvents = (limit = 3, schoolId?: string) => {
  const queryClient = useQueryClient();

  const {
    data: events = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.CALENDAR.EVENTS(schoolId || 'global', limit),
    queryFn: () => fetchUpcomingEvents(limit, schoolId),
    staleTime: CACHE_TIMES.SHORT, // Cache for 5 minutes - events may change
    gcTime: CACHE_TIMES.MEDIUM, // Keep in cache for 15 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) return false;
      return failureCount < 2;
    },
  });

  // Add event mutation
  const addEventMutation = useMutation({
    mutationFn: async (event: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>) => {
      const eventData = {
        ...event,
        date: new Date(event.date).toISOString().split('T')[0]
      };

      const { data, error } = await supabase
        .from('calendar_events')
        .insert(eventData)
        .select()
        .single();

      if (error) {
        // في حالة الخطأ، استخدم localStorage
        const newEvent: CalendarEvent = {
          ...event,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const localEvents = localStorage.getItem('calendar_events');
        const allEvents: CalendarEvent[] = localEvents ? JSON.parse(localEvents) : [];
        allEvents.push(newEvent);
        
        localStorage.setItem('calendar_events', JSON.stringify(allEvents));
        logError('Failed to add event to DB, saved locally', error);
        return newEvent;
      }
      
      logInfo('Calendar event added successfully', { eventId: data.id });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CALENDAR.EVENTS(schoolId || 'global', limit) });
    },
    onError: (error) => {
      logError('Failed to add calendar event', error as Error);
    }
  });

  const addEvent = (event: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>) => {
    return addEventMutation.mutateAsync(event);
  };

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CalendarEvent> }) => {
      const updateData = {
        ...updates,
        date: updates.date ? new Date(updates.date).toISOString().split('T')[0] : undefined
      };

      const { data, error } = await supabase
        .from('calendar_events')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        // في حالة الخطأ، استخدم localStorage
        const localEvents = localStorage.getItem('calendar_events');
        const allEvents: CalendarEvent[] = localEvents ? JSON.parse(localEvents) : [];
        
        const eventIndex = allEvents.findIndex(event => event.id === id);
        if (eventIndex === -1) {
          throw new Error('Event not found');
        }

        allEvents[eventIndex] = {
          ...allEvents[eventIndex],
          ...updates,
          updated_at: new Date().toISOString()
        };
        
        localStorage.setItem('calendar_events', JSON.stringify(allEvents));
        logError('Failed to update event in DB, updated locally', error);
        return allEvents[eventIndex];
      }
      
      logInfo('Calendar event updated successfully', { eventId: id });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CALENDAR.EVENTS(schoolId || 'global', limit) });
    },
    onError: (error) => {
      logError('Failed to update calendar event', error as Error);
    }
  });

  const updateEvent = (id: string, updates: Partial<CalendarEvent>) => {
    return updateEventMutation.mutateAsync({ id, updates });
  };

  // Delete event mutation  
  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id);

      if (error) {
        // في حالة الخطأ، استخدم localStorage
        const localEvents = localStorage.getItem('calendar_events');
        const allEvents: CalendarEvent[] = localEvents ? JSON.parse(localEvents) : [];
        
        const filteredEvents = allEvents.filter(event => event.id !== id);
        localStorage.setItem('calendar_events', JSON.stringify(filteredEvents));
        logError('Failed to delete event from DB, deleted locally', error);
      }
      
      logInfo('Calendar event deleted successfully', { eventId: id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CALENDAR.EVENTS(schoolId || 'global', limit) });
    },
    onError: (error) => {
      logError('Failed to delete calendar event', error as Error);
    }
  });

  const deleteEvent = (id: string) => {
    return deleteEventMutation.mutateAsync(id);
  };

  return {
    events,
    loading,
    error: error?.message || null,
    refetch,
    addEvent,
    updateEvent,
    deleteEvent
  };
};