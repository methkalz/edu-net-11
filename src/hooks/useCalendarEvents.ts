import { useState, useEffect } from 'react';
import { CalendarEvent } from '@/types/common';
import { supabase } from '@/integrations/supabase/client';
import { logError, logInfo } from '@/lib/logger';

export const useCalendarEvents = (limit = 3, schoolId?: string) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUpcomingEvents = async () => {
    try {
      setLoading(true);
      setError(null);

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
        
        setEvents(upcomingEvents);
        logError('Error fetching events from DB', dbError);
      } else {
        // تحويل البيانات للنوع الصحيح
        const eventsWithCorrectType = (dbEvents || []).map(event => ({
          ...event,
          type: event.type as 'exam' | 'holiday' | 'meeting' | 'deadline' | 'other' | 'event' | 'important'
        }));
        setEvents(eventsWithCorrectType);
        // احفظ في localStorage كنسخة احتياطية
        localStorage.setItem('calendar_events', JSON.stringify(eventsWithCorrectType));
      }
      
      logInfo('Calendar events fetched successfully', { count: (dbEvents || []).length });
    } catch (err) {
      const errorMessage = 'Failed to fetch calendar events';
      logError(errorMessage, err as Error);
      setError(errorMessage);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpcomingEvents();
  }, [limit, schoolId]);

  const addEvent = async (event: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>) => {
    try {
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
        await fetchUpcomingEvents();
        return newEvent;
      } else {
        await fetchUpcomingEvents();
        logInfo('Calendar event added successfully', { eventId: data.id });
        return data;
      }
    } catch (err) {
      logError('Failed to add calendar event', err as Error);
      throw err;
    }
  };

  const updateEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    try {
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
        await fetchUpcomingEvents();
        return allEvents[eventIndex];
      } else {
        await fetchUpcomingEvents();
        logInfo('Calendar event updated successfully', { eventId: id });
        return data;
      }
    } catch (err) {
      logError('Failed to update calendar event', err as Error);
      throw err;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
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
      
      await fetchUpcomingEvents();
      logInfo('Calendar event deleted successfully', { eventId: id });
    } catch (err) {
      logError('Failed to delete calendar event', err as Error);
      throw err;
    }
  };

  return {
    events,
    loading,
    error,
    refetch: fetchUpcomingEvents,
    addEvent,
    updateEvent,
    deleteEvent
  };
};