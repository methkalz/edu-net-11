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
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold">الأحداث القادمة</span>
            <Badge variant="secondary" className="mr-auto">
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
            <div className="space-y-4">
              {upcomingEvents.map((event, index) => {
                const eventDate = new Date(event.date);
                const isToday = isSameDay(eventDate, new Date());
                const EventIcon = getIconComponent(event.icon);
                const eventColor = event.color || '#6366f1';
                
                return (
                  <div
                    key={event.id}
                    className="group relative bg-card rounded-2xl p-5 border border-border/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-fade-in overflow-hidden"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Decorative gradient accent */}
                    <div 
                      className="absolute top-0 right-0 w-32 h-32 opacity-10 blur-3xl rounded-full"
                      style={{ backgroundColor: eventColor }}
                    />
                    
                    <div className="relative flex gap-4">
                      {/* Icon with elegant styling */}
                      <div className="flex-shrink-0">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110"
                          style={{ backgroundColor: eventColor }}
                        >
                          <EventIcon className="w-6 h-6 text-white" strokeWidth={2} />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-3">
                        {/* Title and today badge */}
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-lg font-bold text-foreground leading-tight">
                            {event.title}
                          </h3>
                          {isToday && (
                            <span 
                              className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold text-white shadow-md"
                              style={{ backgroundColor: eventColor }}
                            >
                              اليوم
                            </span>
                          )}
                        </div>

                        {/* Date and time with elegant spacing */}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4" style={{ color: eventColor }} />
                            <span className="font-medium">
                              {format(eventDate, 'dd/MM/yyyy')}
                            </span>
                          </div>
                          {event.time && (
                            <>
                              <span className="text-border">•</span>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" style={{ color: eventColor }} />
                                <span className="font-medium">{event.time}</span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Type badge with subtle styling */}
                        <div>
                          <span 
                            className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold"
                            style={{ 
                              backgroundColor: `${eventColor}15`,
                              color: eventColor
                            }}
                          >
                            {event.type === 'exam' ? 'امتحان' :
                             event.type === 'deadline' ? 'موعد نهائي' :
                             event.type === 'holiday' ? 'عطلة' :
                             event.type === 'meeting' ? 'اجتماع' :
                             event.type === 'important' ? 'مهم' : 'حدث'}
                          </span>
                        </div>

                        {/* Description with better typography */}
                        {event.description && (
                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
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
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold">التقويم</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={ar}
              className="rounded-xl border-0 bg-background mx-auto"
              modifiers={{
                hasEvent: (date) => hasEventOnDate(date)
              }}
              modifiersClassNames={{
                hasEvent: 'font-bold text-primary relative after:content-[""] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-primary'
              }}
            />

            {/* Selected Date Events */}
            {selectedDateEvents.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" />
                  أحداث {format(selectedDate, 'dd/MM/yyyy')}
                </h4>
                <div className="space-y-2">
                  {selectedDateEvents.map((event) => {
                    const EventIcon = getIconComponent(event.icon);
                    const eventColor = event.color || '#6366f1';
                    return (
                      <div
                        key={event.id}
                        className="group flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 transition-all hover:shadow-md hover:-translate-y-0.5"
                      >
                        <div 
                          className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                          style={{ backgroundColor: eventColor }}
                        >
                          <EventIcon className="w-5 h-5 text-white" strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground">
                            {event.title}
                          </p>
                          {event.time && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
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
