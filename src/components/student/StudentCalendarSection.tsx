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
  Info,
  Bell,
  icons
} from 'lucide-react';

export const StudentCalendarSection: React.FC = () => {
  const { events, loading } = useCalendarEvents();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const getIconComponent = (iconName?: string) => {
    if (!iconName) return CalendarIcon;
    const IconComponent = icons[iconName as keyof typeof icons];
    return IconComponent || CalendarIcon;
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
            <div className="space-y-3">
              {upcomingEvents.map((event, index) => {
                const eventDate = new Date(event.date);
                const isToday = isSameDay(eventDate, new Date());
                const EventIcon = getIconComponent(event.icon);
                const eventColor = event.color || '#3b82f6';
                
                return (
                  <div
                    key={event.id}
                    className="group relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] animate-fade-in"
                    style={{ 
                      animationDelay: `${index * 0.1}s`,
                      borderColor: eventColor,
                      background: `linear-gradient(135deg, ${eventColor}15 0%, ${eventColor}08 100%)`
                    }}
                  >
                    {/* Gradient Overlay */}
                    <div 
                      className="absolute top-0 left-0 w-full h-1"
                      style={{ background: `linear-gradient(90deg, ${eventColor} 0%, ${eventColor}80 100%)` }}
                    />
                    
                    <div className="flex items-start gap-4 p-4">
                      {/* Event Icon */}
                      <div 
                        className="flex-shrink-0 w-14 h-14 rounded-xl shadow-lg flex items-center justify-center relative overflow-hidden"
                        style={{ 
                          background: `linear-gradient(135deg, ${eventColor} 0%, ${eventColor}cc 100%)`
                        }}
                      >
                        <EventIcon className="w-7 h-7 text-white relative z-10" />
                        <div 
                          className="absolute inset-0 opacity-20"
                          style={{ background: `radial-gradient(circle at 30% 30%, white 0%, transparent 70%)` }}
                        />
                      </div>

                      {/* Event Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h4 className="font-bold text-lg text-foreground leading-tight">
                            {event.title}
                          </h4>
                          {isToday && (
                            <Badge 
                              className="flex-shrink-0 text-white border-0 shadow-md"
                              style={{ backgroundColor: eventColor }}
                            >
                              اليوم
                            </Badge>
                          )}
                        </div>

                        {/* Date & Time */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          <div 
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium backdrop-blur-sm"
                            style={{ 
                              backgroundColor: `${eventColor}20`,
                              color: eventColor
                            }}
                          >
                            <CalendarIcon className="w-3.5 h-3.5" />
                            <span>{format(eventDate, 'dd MMMM yyyy', { locale: ar })}</span>
                          </div>
                          {event.time && (
                            <div 
                              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium backdrop-blur-sm"
                              style={{ 
                                backgroundColor: `${eventColor}20`,
                                color: eventColor
                              }}
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>{event.time}</span>
                            </div>
                          )}
                        </div>

                        {/* Type Badge */}
                        <Badge 
                          variant="outline" 
                          className="border-2 font-semibold"
                          style={{ 
                            borderColor: eventColor,
                            color: eventColor
                          }}
                        >
                          {event.type === 'exam' ? 'امتحان' :
                           event.type === 'deadline' ? 'موعد نهائي' :
                           event.type === 'holiday' ? 'عطلة' :
                           event.type === 'meeting' ? 'اجتماع' :
                           event.type === 'important' ? 'مهم' : 'حدث'}
                        </Badge>

                        {/* Description */}
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-3 line-clamp-2 leading-relaxed">
                            {event.description}
                          </p>
                        )}
                      </div>
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
                    const EventIcon = getIconComponent(event.icon);
                    const eventColor = event.color || '#3b82f6';
                    return (
                      <div
                        key={event.id}
                        className="flex items-center gap-3 p-3 rounded-lg border-2 transition-all hover:shadow-md"
                        style={{ 
                          borderColor: eventColor,
                          background: `linear-gradient(135deg, ${eventColor}15 0%, ${eventColor}08 100%)`
                        }}
                      >
                        <div 
                          className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center shadow-sm"
                          style={{ 
                            background: `linear-gradient(135deg, ${eventColor} 0%, ${eventColor}cc 100%)`
                          }}
                        >
                          <EventIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground">
                            {event.title}
                          </p>
                          {event.time && (
                            <p className="text-xs text-muted-foreground mt-0.5">
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
