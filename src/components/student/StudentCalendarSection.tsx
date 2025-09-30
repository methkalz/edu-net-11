import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { format, isSameDay, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Info,
  Bell,
  CheckCircle2
} from 'lucide-react';

export const StudentCalendarSection: React.FC = () => {
  const { events, loading } = useCalendarEvents();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const getEventTypeColor = (type?: string) => {
    const colors = {
      exam: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', border: 'border-red-200' },
      deadline: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200' },
      holiday: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-200' },
      event: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200' },
      meeting: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200' },
      important: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-200' },
      other: { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200' }
    };
    return colors[type as keyof typeof colors] || colors.event;
  };

  const getEventTypeIcon = (type?: string) => {
    switch (type) {
      case 'exam': return '📝';
      case 'deadline': return '📚';
      case 'holiday': return '🎉';
      case 'meeting': return '👥';
      case 'important': return '⭐';
      default: return '📅';
    }
  };

  const upcomingEvents = events
    .filter(event => new Date(event.date) >= new Date())
    .slice(0, 5);

  const eventDates = events.map(event => parseISO(event.date));

  const hasEventOnDate = (date: Date) => {
    return eventDates.some(eventDate => isSameDay(eventDate, date));
  };

  const selectedDateEvents = events.filter(event => 
    isSameDay(parseISO(event.date), selectedDate)
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-64 bg-muted rounded"></div>
          </CardContent>
        </Card>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-64 bg-muted rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Upcoming Events List */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Bell className="w-5 h-5" />
            الأحداث القادمة
            <Badge variant="secondary" className="mr-auto bg-blue-100 text-blue-700">
              {upcomingEvents.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-20" />
              <p className="text-muted-foreground text-sm">لا توجد أحداث قادمة</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {upcomingEvents.map((event, index) => {
                const colors = getEventTypeColor(event.type);
                const eventDate = new Date(event.date);
                const isToday = isSameDay(eventDate, new Date());
                
                return (
                  <div
                    key={event.id}
                    className={`group relative flex items-start gap-3 p-4 rounded-lg border-2 ${colors.border} ${colors.bg} transition-all duration-300 hover:shadow-lg hover:scale-[1.02] animate-fade-in`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Event Icon */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-md flex items-center justify-center text-2xl">
                      {getEventTypeIcon(event.type)}
                    </div>

                    {/* Event Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className={`font-bold text-base ${colors.text}`}>
                          {event.title}
                        </h4>
                        {isToday && (
                          <Badge className="bg-red-500 text-white flex-shrink-0">
                            اليوم
                          </Badge>
                        )}
                      </div>

                      {/* Date & Time */}
                      <div className="flex flex-wrap gap-2 mb-2">
                        <div className="flex items-center gap-1 text-xs bg-white/70 dark:bg-gray-800/70 px-2 py-1 rounded">
                          <CalendarIcon className="w-3 h-3" />
                          <span>{format(eventDate, 'dd MMMM yyyy', { locale: ar })}</span>
                        </div>
                        {event.time && (
                          <div className="flex items-center gap-1 text-xs bg-white/70 dark:bg-gray-800/70 px-2 py-1 rounded">
                            <Clock className="w-3 h-3" />
                            <span>{event.time}</span>
                          </div>
                        )}
                      </div>

                      {/* Type Badge */}
                      <Badge variant="outline" className={`${colors.text} border-current`}>
                        {event.type === 'exam' ? 'امتحان' :
                         event.type === 'deadline' ? 'موعد نهائي' :
                         event.type === 'holiday' ? 'عطلة' :
                         event.type === 'meeting' ? 'اجتماع' :
                         event.type === 'important' ? 'مهم' : 'حدث'}
                      </Badge>

                      {/* Description */}
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visual Calendar */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
            <CalendarIcon className="w-5 h-5" />
            التقويم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={ar}
              className="rounded-md border bg-white dark:bg-gray-900 shadow-sm mx-auto"
              modifiers={{
                hasEvent: (date) => hasEventOnDate(date)
              }}
              modifiersClassNames={{
                hasEvent: 'font-bold text-purple-600 dark:text-purple-400'
              }}
            />

            {/* Selected Date Events */}
            {selectedDateEvents.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-purple-700 dark:text-purple-300 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  أحداث {format(selectedDate, 'dd MMMM', { locale: ar })}
                </h4>
                <div className="space-y-2">
                  {selectedDateEvents.map((event) => {
                    const colors = getEventTypeColor(event.type);
                    return (
                      <div
                        key={event.id}
                        className={`flex items-center gap-2 p-2 rounded-lg ${colors.bg} border ${colors.border}`}
                      >
                        <span className="text-lg">{getEventTypeIcon(event.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm ${colors.text}`}>
                            {event.title}
                          </p>
                          {event.time && (
                            <p className="text-xs text-muted-foreground">
                              {event.time}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
