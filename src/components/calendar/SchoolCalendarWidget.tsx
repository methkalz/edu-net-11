import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Plus, Edit, Trash2, Clock, X } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
interface EventForm {
  title: string;
  description: string;
  date: Date | undefined;
  endDate: Date | undefined;
  time: string;
  type: string;
  color: string;
}
export const SchoolCalendarWidget: React.FC = () => {
  const {
    userProfile
  } = useAuth();
  const {
    toast
  } = useToast();
  const {
    events,
    loading,
    addEvent,
    updateEvent,
    deleteEvent
  } = useCalendarEvents(5, userProfile?.school_id);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<{ id: string; title: string } | null>(null);
  const [editingEvent, setEditingEvent] = useState<{ id: string; title: string; date: string; description?: string } | null>(null);
  const [eventForm, setEventForm] = useState<EventForm>({
    title: '',
    description: '',
    date: undefined,
    endDate: undefined,
    time: '',
    type: 'event',
    color: '#3b82f6'
  });
  const eventTypes = [{
    value: 'event',
    label: 'فعالية',
    icon: '🎉'
  }, {
    value: 'exam',
    label: 'امتحان',
    icon: '📝'
  }, {
    value: 'holiday',
    label: 'عطلة',
    icon: '🏖️'
  }, {
    value: 'meeting',
    label: 'اجتماع',
    icon: '👥'
  }, {
    value: 'important',
    label: 'مهم',
    icon: '⚠️'
  }];
  const colorOptions = [{
    value: '#3b82f6',
    label: 'أزرق',
    class: 'bg-blue-500'
  }, {
    value: '#ef4444',
    label: 'أحمر',
    class: 'bg-red-500'
  }, {
    value: '#10b981',
    label: 'أخضر',
    class: 'bg-green-500'
  }, {
    value: '#f59e0b',
    label: 'برتقالي',
    class: 'bg-orange-500'
  }, {
    value: '#8b5cf6',
    label: 'بنفسجي',
    class: 'bg-purple-500'
  }, {
    value: '#ec4899',
    label: 'وردي',
    class: 'bg-pink-500'
  }];
  const getEventTypeColor = (type?: string) => {
    switch (type) {
      case 'exam':
        return 'bg-red-100 text-red-800';
      case 'holiday':
        return 'bg-green-100 text-green-800';
      case 'meeting':
        return 'bg-blue-100 text-blue-800';
      case 'important':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const getEventTypeIcon = (type?: string) => {
    return eventTypes.find(t => t.value === type)?.icon || '📅';
  };
  const resetForm = () => {
    setEventForm({
      title: '',
      description: '',
      date: undefined,
      endDate: undefined,
      time: '',
      type: 'event',
      color: '#3b82f6'
    });
    setEditingEvent(null);
  };
  const handleAddEvent = () => {
    resetForm();
    setShowAddDialog(true);
  };
  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description || '',
      date: new Date(event.date),
      endDate: event.end_date ? new Date(event.end_date) : new Date(event.date),
      time: event.time || '',
      type: event.type || 'event',
      color: event.color || '#3b82f6'
    });
    setShowAddDialog(true);
  };
  const handleSubmit = async () => {
    if (!eventForm.title || !eventForm.date) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء العنوان وتاريخ البداية',
        variant: 'destructive'
      });
      return;
    }

    // إذا لم يتم تحديد تاريخ النهاية، استخدم تاريخ البداية
    const endDate = eventForm.endDate || eventForm.date;

    // التحقق من أن تاريخ النهاية لا يأتي قبل تاريخ البداية
    if (endDate < eventForm.date) {
      toast({
        title: 'خطأ',
        description: 'تاريخ النهاية لا يمكن أن يكون قبل تاريخ البداية',
        variant: 'destructive'
      });
      return;
    }

    try {
      const eventData = {
        title: eventForm.title,
        description: eventForm.description,
        date: eventForm.date.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        time: eventForm.time || null,
        type: eventForm.type as 'exam' | 'holiday' | 'meeting' | 'deadline' | 'other' | 'event' | 'important',
        color: eventForm.color,
        is_active: true,
        school_id: userProfile?.school_id,
        created_by: userProfile?.user_id
      };
      if (editingEvent) {
        await updateEvent(editingEvent.id, eventData);
        toast({
          title: 'تم التحديث',
          description: 'تم تحديث الحدث بنجاح'
        });
      } else {
        await addEvent(eventData);
        toast({
          title: 'تم الإضافة',
          description: 'تم إضافة الحدث بنجاح'
        });
      }
      setShowAddDialog(false);
      resetForm();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في حفظ الحدث',
        variant: 'destructive'
      });
    }
  };
  const handleDeleteClick = (event: any) => {
    setEventToDelete(event);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;
    
    try {
      await deleteEvent(eventToDelete.id);
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الحدث بنجاح'
      });
      setShowDeleteDialog(false);
      setEventToDelete(null);
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في حذف الحدث',
        variant: 'destructive'
      });
    }
  };

  // التحقق من صلاحيات الكتابة
  const canManageEvents = userProfile?.role === 'school_admin' || userProfile?.role === 'superadmin';
  if (loading) {
    return <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-blue-500" />
            التقويم والأحداث
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>)}
          </div>
        </CardContent>
      </Card>;
  }
  return <>
      <Card className="glass-card card-hover animate-scale-hover">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
             <CardTitle className="flex items-center gap-2 text-base">
              <CalendarIcon className="h-5 w-5 text-blue-500 icon-glow" />
              التقويم والأحداث
            </CardTitle>
            {canManageEvents && <Button size="sm" variant="outline" onClick={handleAddEvent} className="flex items-center gap-1">
                <Plus className="h-3 w-3" />
                إضافة
              </Button>}
          </div>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? <div className="text-center py-6 text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm text-center">لا توجد أحداث قادمة</p>
              {canManageEvents}
            </div> : <div className="space-y-3">
              {events.map(event => {
                // تحويل اللون إلى gradiant ناعم
                const hexColor = event.color || '#3b82f6';
                const rgb = hexColor.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16));
                const gradientStyle = rgb ? {
                  background: `linear-gradient(135deg, ${hexColor}15, ${hexColor}08)`,
                  borderLeft: `3px solid ${hexColor}`,
                  borderColor: `${hexColor}30`
                } : {};
                
                return (
                  <div 
                    key={event.id} 
                    className="flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-sm"
                    style={gradientStyle}
                  >
                    <div className="text-lg">
                      {getEventTypeIcon(event.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">
                          {event.title}
                        </h4>
                        <Badge 
                          className="text-xs border-0"
                          style={{
                            backgroundColor: `${hexColor}20`,
                            color: hexColor
                          }}
                        >
                          {eventTypes.find(t => t.value === event.type)?.label || 'حدث'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          <span>
                            {(event as any).end_date && (event as any).end_date !== event.date 
                              ? `${format(new Date(event.date), 'dd/MM/yyyy', { locale: ar })} - ${format(new Date((event as any).end_date), 'dd/MM/yyyy', { locale: ar })}`
                              : format(new Date(event.date), 'dd/MM/yyyy', { locale: ar })
                            }
                          </span>
                        </div>
                        
                        {event.time && <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{event.time}</span>
                          </div>}
                      </div>
                      
                      {event.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {event.description}
                        </p>}
                    </div>

                    {canManageEvents && <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleEditEvent(event)} className="h-6 w-6 p-0">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteClick(event)} className="h-6 w-6 p-0 text-red-600 hover:text-red-700">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>}
                  </div>
                );
              })}
              
              {events.length >= 5 && <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => window.location.href = '/calendar-management'}>
                  عرض جميع الأحداث
                </Button>}
            </div>}
        </CardContent>
      </Card>

      {/* Dialog لإضافة/تعديل الأحداث */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[425px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? 'تعديل الحدث' : 'إضافة حدث جديد'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">عنوان الحدث *</Label>
              <Input id="title" value={eventForm.title} onChange={e => setEventForm(prev => ({
              ...prev,
              title: e.target.value
            }))} placeholder="أدخل عنوان الحدث" />
            </div>

            <div>
              <Label htmlFor="description">الوصف</Label>
              <Textarea id="description" value={eventForm.description} onChange={e => setEventForm(prev => ({
              ...prev,
              description: e.target.value
            }))} placeholder="أدخل وصف الحدث (اختياري)" rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>تاريخ البداية *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !eventForm.date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {eventForm.date ? format(eventForm.date, "dd/MM/yyyy") : "اختر التاريخ"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={eventForm.date} onSelect={date => setEventForm(prev => ({
                    ...prev,
                    date
                  }))} initialFocus className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>تاريخ النهاية (اختياري)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !eventForm.endDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {eventForm.endDate ? format(eventForm.endDate, "dd/MM/yyyy") : "اختر التاريخ"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={eventForm.endDate} onSelect={date => setEventForm(prev => ({
                    ...prev,
                    endDate: date
                  }))} initialFocus className="pointer-events-auto" disabled={(date) => eventForm.date ? date < eventForm.date : false} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label htmlFor="time">الوقت</Label>
              <Input id="time" type="time" value={eventForm.time} onChange={e => setEventForm(prev => ({
              ...prev,
              time: e.target.value
            }))} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>نوع الحدث</Label>
                <Select value={eventForm.type} onValueChange={value => setEventForm(prev => ({
                ...prev,
                type: value
              }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map(type => <SelectItem key={type.value} value={type.value}>
                        <span className="flex items-center gap-2">
                          <span>{type.icon}</span>
                          {type.label}
                        </span>
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>اللون</Label>
                <Select value={eventForm.color} onValueChange={value => setEventForm(prev => ({
                ...prev,
                color: value
              }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map(color => <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded ${color.class}`}></div>
                          {color.label}
                        </div>
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => {
              setShowAddDialog(false);
              resetForm();
            }}>
                إلغاء
              </Button>
              <Button onClick={handleSubmit}>
                {editingEvent ? 'تحديث' : 'إضافة'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AlertDialog لتأكيد حذف الحدث */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">تأكيد حذف الحدث</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              هل أنت متأكد من حذف الحدث "{eventToDelete?.title}"؟ 
              هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-start gap-2">
            <AlertDialogCancel className="ml-2">إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>;
};