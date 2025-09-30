import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Edit, 
  Trash2, 
  Settings, 
  Eye,
  AlertCircle,
  Palette,
  Clock,
  Bell,
  Target,
  CheckCircle,
  XCircle,
  ArrowLeft,
  FileText
} from 'lucide-react';
import AppHeader from '@/components/shared/AppHeader';
import AppFooter from '@/components/shared/AppFooter';
import { PageLoading } from '@/components/ui/LoadingComponents';
import { TimeInput } from '@/components/ui/time-input';

// استخدام CalendarEvent من types/common.ts

interface CalendarSettings {
  id: string;
  show_in_header: boolean;
  header_duration: number;
  header_color: string;
  auto_show_before_days: number;
  is_active: boolean;
}

const eventFormSchema = z.object({
  title: z.string().min(1, 'عنوان الحدث مطلوب'),
  description: z.string().optional(),
  date: z.date({
    message: 'تاريخ الحدث مطلوب',
  }),
  end_date: z.date().optional(),
  time: z.string().optional(),
  end_time: z.string().optional(),
  all_day: z.boolean().default(true),
  color: z.string().min(1, 'لون الحدث مطلوب'),
  type: z.enum(['holiday', 'exam', 'meeting', 'event', 'important']),
  is_active: z.boolean().default(true),
  target_grade_levels: z.array(z.string()).optional(),
  target_class_ids: z.array(z.string()).optional(),
  is_for_all: z.boolean().default(true),
}).refine((data) => {
  // إذا لم يكن طوال اليوم وتم تحديد وقت النهاية، يجب أن يكون هناك وقت بداية
  if (!data.all_day && data.end_time && !data.time) {
    return false;
  }
  // إذا تم تحديد تاريخ نهاية، يجب أن يكون بعد أو يساوي تاريخ البداية
  if (data.end_date && data.date && data.end_date < data.date) {
    return false;
  }
  return true;
}, {
  message: "تحقق من صحة التواريخ والأوقات",
  path: ["end_time"],
});

const settingsFormSchema = z.object({
  show_in_header: z.boolean(),
  header_duration: z.number().min(1).max(60),
  header_color: z.string(),
  auto_show_before_days: z.number().min(0).max(30),
  is_active: z.boolean(),
});

const CalendarManagement = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [settings, setSettings] = useState<CalendarSettings | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);

  const eventForm = useForm<z.infer<typeof eventFormSchema>>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: '',
      description: '',
      color: '#3b82f6',
      type: 'event',
      is_active: true,
      target_grade_levels: [],
      target_class_ids: [],
      is_for_all: true,
      all_day: true,
      time: undefined,
      end_time: undefined,
      end_date: undefined,
    },
  });

  const settingsForm = useForm<z.infer<typeof settingsFormSchema>>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      show_in_header: false,
      header_duration: 10,
      header_color: '#3b82f6',
      auto_show_before_days: 3,
      is_active: true,
    },
  });

  const colorOptions = [
    { value: '#3b82f6', label: 'أزرق', class: 'bg-blue-500' },
    { value: '#ef4444', label: 'أحمر', class: 'bg-red-500' },
    { value: '#10b981', label: 'أخضر', class: 'bg-green-500' },
    { value: '#f59e0b', label: 'برتقالي', class: 'bg-orange-500' },
    { value: '#8b5cf6', label: 'بنفسجي', class: 'bg-purple-500' },
    { value: '#06b6d4', label: 'سماوي', class: 'bg-cyan-500' },
    { value: '#ec4899', label: 'وردي', class: 'bg-pink-500' },
    { value: '#84cc16', label: 'ليموني', class: 'bg-lime-500' },
  ];

  const typeOptions = [
    { value: 'holiday', label: 'عطلة', icon: '🏖️' },
    { value: 'exam', label: 'امتحان', icon: '📝' },
    { value: 'meeting', label: 'اجتماع', icon: '👥' },
    { value: 'event', label: 'فعالية', icon: '🎉' },
    { value: 'important', label: 'مهم', icon: '⚠️' },
  ];

  const gradeOptions = [
    { value: '10', label: 'الصف العاشر' },
    { value: '11', label: 'الصف الحادي عشر' },
    { value: '12', label: 'الصف الثاني عشر' },
  ];

  // جلب البيانات
  useEffect(() => {
    fetchEvents();
    fetchSettings();
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          id,
          class_name_id,
          grade_level_id,
          class_names(name),
          grade_levels(label, code)
        `)
        .eq('school_id', userProfile?.school_id)
        .eq('status', 'active');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      logger.error('Error fetching classes', error as Error);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      // جلب الأحداث من قاعدة البيانات
      let query = supabase
        .from('calendar_events')
        .select('*')
        .order('date', { ascending: true });

      // المعلمون يرون أحداثهم فقط
      if (userProfile?.role === 'teacher') {
        query = query.eq('created_by', userProfile.user_id);
      }
      // مدراء المدارس يرون أحداث مدرستهم
      else if (userProfile?.role === 'school_admin') {
        query = query.eq('school_id', userProfile.school_id);
      }
      // السوبر أدمن يرى كل الأحداث

      const { data: dbEvents, error } = await query;

      if (error) {
        // في حالة الخطأ، استخدم localStorage كبديل
        const localEvents = localStorage.getItem('calendar_events');
        const parsedEvents = localEvents ? JSON.parse(localEvents) : [];
        // تصفية الأحداث حسب الدور
        const filteredEvents = userProfile?.role === 'teacher'
          ? parsedEvents.filter((e: any) => e.created_by === userProfile.user_id)
          : parsedEvents;
        setEvents(filteredEvents);
        logger.error('Error fetching events from DB', error);
      } else {
        setEvents(dbEvents || []);
        // احفظ في localStorage كنسخة احتياطية
        localStorage.setItem('calendar_events', JSON.stringify(dbEvents || []));
      }
    } catch (error) {
      logger.error('Error fetching events', error as Error);
      // استخدم localStorage في حالة فشل الاتصال بقاعدة البيانات
      const localEvents = localStorage.getItem('calendar_events');
      setEvents(localEvents ? JSON.parse(localEvents) : []);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      // جلب الإعدادات من قاعدة البيانات
      const { data: dbSettings, error } = await supabase
        .from('calendar_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        // في حالة الخطأ، استخدم localStorage كبديل
        const localSettings = localStorage.getItem('calendar_settings');
        if (localSettings) {
          const parsedSettings = JSON.parse(localSettings);
          setSettings(parsedSettings);
          settingsForm.reset(parsedSettings);
        } else {
          await createDefaultSettings();
        }
        logger.error('Error fetching settings from DB', error);
      } else if (dbSettings) {
        setSettings(dbSettings);
        settingsForm.reset(dbSettings);
        // احفظ في localStorage كنسخة احتياطية
        localStorage.setItem('calendar_settings', JSON.stringify(dbSettings));
      } else {
        await createDefaultSettings();
      }
    } catch (error) {
      logger.error('Error fetching settings', error as Error);
      // استخدم localStorage في حالة فشل الاتصال بقاعدة البيانات
      const localSettings = localStorage.getItem('calendar_settings');
      if (localSettings) {
        const parsedSettings = JSON.parse(localSettings);
        setSettings(parsedSettings);
        settingsForm.reset(parsedSettings);
      } else {
        await createDefaultSettings();
      }
    }
  };

  const createDefaultSettings = async () => {
    const defaultSettings = {
      show_in_header: false,
      header_duration: 10,
      header_color: '#3b82f6',
      auto_show_before_days: 3,
      is_active: true,
    };

    try {
      // محاولة إضافة الإعدادات الافتراضية في قاعدة البيانات
      const { data, error } = await supabase
        .from('calendar_settings')
        .insert(defaultSettings)
        .select()
        .single();

      if (error) {
        // في حالة الخطأ، استخدم localStorage
        const settingsWithId = { ...defaultSettings, id: crypto.randomUUID() };
        localStorage.setItem('calendar_settings', JSON.stringify(settingsWithId));
        setSettings(settingsWithId);
        settingsForm.reset(settingsWithId);
      } else {
        setSettings(data);
        settingsForm.reset(data);
        localStorage.setItem('calendar_settings', JSON.stringify(data));
      }
    } catch (error) {
      logger.error('Error creating default settings', error as Error);
      const settingsWithId = { ...defaultSettings, id: crypto.randomUUID() };
      localStorage.setItem('calendar_settings', JSON.stringify(settingsWithId));
      setSettings(settingsWithId);
      settingsForm.reset(settingsWithId);
    }
  };

  const onEventSubmit = async (values: z.infer<typeof eventFormSchema>) => {
    try {
      const eventData = {
        title: values.title,
        description: values.description,
        date: format(values.date, 'yyyy-MM-dd'),
        end_date: values.end_date ? format(values.end_date, 'yyyy-MM-dd') : null,
        time: !values.all_day && values.time ? values.time : null,
        end_time: !values.all_day && values.end_time ? values.end_time : null,
        color: values.color,
        type: values.type as 'exam' | 'holiday' | 'meeting' | 'deadline' | 'other' | 'event' | 'important',
        is_active: values.is_active,
        created_by: userProfile?.user_id,
        school_id: userProfile?.school_id,
        created_by_role: userProfile?.role,
        target_grade_levels: values.is_for_all ? null : (values.target_grade_levels || null),
        target_class_ids: values.is_for_all ? null : (values.target_class_ids || null),
      };

      if (editingEvent) {
        // تحديث حدث موجود
        const { error } = await supabase
          .from('calendar_events')
          .update(eventData)
          .eq('id', editingEvent.id);

        if (error) {
          // في حالة الخطأ، استخدم localStorage
          const localEvents = JSON.parse(localStorage.getItem('calendar_events') || '[]');
          const updatedEvents = localEvents.map((e: any) => 
            e.id === editingEvent.id ? { ...editingEvent, ...eventData } : e
          );
          localStorage.setItem('calendar_events', JSON.stringify(updatedEvents));
          setEvents(updatedEvents);
        } else {
          fetchEvents(); // إعادة تحميل الأحداث من قاعدة البيانات
        }
        
        toast({
          title: 'تم التحديث',
          description: 'تم تحديث الحدث بنجاح',
        });
      } else {
        // إضافة حدث جديد
        const { error } = await supabase
          .from('calendar_events')
          .insert(eventData);

        if (error) {
          // في حالة الخطأ، استخدم localStorage
          const localEvents = JSON.parse(localStorage.getItem('calendar_events') || '[]');
          const newEvent = { ...eventData, id: crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
          localEvents.push(newEvent);
          localStorage.setItem('calendar_events', JSON.stringify(localEvents));
          setEvents(localEvents);
        } else {
          fetchEvents(); // إعادة تحميل الأحداث من قاعدة البيانات
        }
        
        toast({
          title: 'تم الإضافة',
          description: 'تم إضافة الحدث بنجاح',
        });
      }

      setIsEventDialogOpen(false);
      setEditingEvent(null);
      eventForm.reset();
    } catch (error) {
      logger.error('Error saving event', error as Error);
      toast({
        title: 'خطأ',
        description: 'فشل في حفظ الحدث',
        variant: 'destructive',
      });
    }
  };

  const onSettingsSubmit = async (values: z.infer<typeof settingsFormSchema>) => {
    try {
      if (settings?.id) {
        // تحديث الإعدادات الموجودة
        const { error } = await supabase
          .from('calendar_settings')
          .update(values)
          .eq('id', settings.id);

        if (error) {
          // في حالة الخطأ، استخدم localStorage
          const settingsData = { ...values, id: settings.id };
          localStorage.setItem('calendar_settings', JSON.stringify(settingsData));
          setSettings(settingsData);
        } else {
          fetchSettings(); // إعادة تحميل الإعدادات من قاعدة البيانات
        }
      } else {
        // إنشاء إعدادات جديدة
        const { data, error } = await supabase
          .from('calendar_settings')
          .insert(values)
          .select()
          .single();

        if (error) {
          // في حالة الخطأ، استخدم localStorage
          const settingsData = { ...values, id: crypto.randomUUID() };
          localStorage.setItem('calendar_settings', JSON.stringify(settingsData));
          setSettings(settingsData);
        } else {
          setSettings(data);
          localStorage.setItem('calendar_settings', JSON.stringify(data));
        }
      }
      
      toast({
        title: 'تم الحفظ',
        description: 'تم حفظ الإعدادات بنجاح',
      });
    } catch (error) {
      logger.error('Error saving settings', error as Error);
      toast({
        title: 'خطأ',
        description: 'فشل في حفظ الإعدادات',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) {
        // في حالة الخطأ، استخدم localStorage
        const localEvents = JSON.parse(localStorage.getItem('calendar_events') || '[]');
        const filteredEvents = localEvents.filter((e: any) => e.id !== eventId);
        localStorage.setItem('calendar_events', JSON.stringify(filteredEvents));
        setEvents(filteredEvents);
      } else {
        fetchEvents(); // إعادة تحميل الأحداث من قاعدة البيانات
      }

      toast({
        title: 'تم الحذف',
        description: 'تم حذف الحدث بنجاح',
      });
    } catch (error) {
      logger.error('Error deleting event', error as Error);
      toast({
        title: 'خطأ',
        description: 'فشل في حذف الحدث',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (event: any) => {
    setEditingEvent(event);
    eventForm.reset({
      title: event.title,
      description: event.description || '',
      date: new Date(event.date),
      color: event.color || '#3b82f6',
      type: (event.type || event.event_type) as 'holiday' | 'exam' | 'meeting' | 'event' | 'important',
      is_active: event.is_active,
      target_grade_levels: event.target_grade_levels || [],
      target_class_ids: event.target_class_ids || [],
      is_for_all: !event.target_grade_levels && !event.target_class_ids,
    });
    setIsEventDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingEvent(null);
    eventForm.reset({
      title: '',
      description: '',
      date: selectedDate || new Date(),
      color: '#3b82f6',
      type: 'event',
      is_active: true,
      target_grade_levels: [],
      target_class_ids: [],
      is_for_all: true,
    });
    setIsEventDialogOpen(true);
  };

  // التحقق من الصلاحيات - المعلمون ومدراء المدارس والسوبر أدمن يمكنهم الوصول
  if (userProfile?.role !== 'superadmin' && userProfile?.role !== 'school_admin' && userProfile?.role !== 'teacher') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            ليس لديك صلاحية للوصول إلى هذه الصفحة
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return <PageLoading message="Loading..." />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <AppHeader 
        title="إدارة التقويم" 
        showBackButton={true} 
        showLogout={true} 
      />
      
      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className={`grid w-full ${userProfile?.role === 'teacher' ? 'grid-cols-2' : 'grid-cols-3'}`}>
            <TabsTrigger value="events" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              الأحداث
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <Eye className="h-4 w-4" />
              عرض التقويم
            </TabsTrigger>
            {/* إعدادات الشريط متاحة فقط للمدراء والسوبر أدمن */}
            {(userProfile?.role === 'superadmin' || userProfile?.role === 'school_admin') && (
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" />
                إعدادات الشريط
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="events" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">إدارة الأحداث</h2>
                <p className="text-muted-foreground">إضافة وتعديل أحداث التقويم</p>
              </div>
              <Button onClick={openAddDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                إضافة حدث جديد
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>قائمة الأحداث</CardTitle>
                  <CardDescription>جميع الأحداث والمناسبات المضافة</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: event.color || '#3b82f6' }}
                        />
                        <div>
                          <h3 className="font-medium">{event.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(event.date), 'dd.M.yyyy')}
                          </p>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                           <Badge variant={event.is_active ? "default" : "secondary"}>
                            {typeOptions.find(t => t.value === event.type || t.value === event.event_type)?.icon} {typeOptions.find(t => t.value === event.type || t.value === event.event_type)?.label}
                          </Badge>
                          {event.is_active ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                      {/* المعلمون يمكنهم تعديل أحداثهم فقط، المدراء والسوبر أدمن يمكنهم تعديل كل الأحداث */}
                      {(userProfile?.role === 'superadmin' || 
                        userProfile?.role === 'school_admin' || 
                        (userProfile?.role === 'teacher' && event.created_by === userProfile.user_id)) && (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(event)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteEvent(event.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  {events.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>لا توجد أحداث مضافة حتى الآن</p>
                      <Button variant="outline" onClick={openAddDialog} className="mt-4">
                        إضافة الحدث الأول
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>إحصائيات الأحداث</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{events.length}</div>
                      <div className="text-sm text-blue-600">إجمالي الأحداث</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {events.filter(e => e.is_active).length}
                      </div>
                      <div className="text-sm text-green-600">أحداث نشطة</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                     {typeOptions.map((type) => {
                       const count = events.filter(e => e.type === type.value || e.event_type === type.value).length;
                      return (
                        <div key={type.value} className="flex justify-between">
                          <span className="text-sm">{type.icon} {type.label}</span>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>عرض التقويم</CardTitle>
                <CardDescription>معاينة التقويم كما سيظهر للمستخدمين</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md border"
                      locale={ar}
                    />
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-medium">أحداث اليوم المحدد</h3>
                    {selectedDate && (
                      <div className="space-y-2">
                        {events
                          .filter(event => 
                            format(new Date(event.date), 'yyyy-MM-dd') === 
                            format(selectedDate, 'yyyy-MM-dd')
                          )
                          .map((event) => (
                            <div key={event.id} className="flex items-center gap-3 p-3 border rounded-lg">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: event.color || '#3b82f6' }}
                              />
                              <div>
                                <div className="font-medium">{event.title}</div>
                                <div className="text-sm text-muted-foreground">{event.description}</div>
                              </div>
                            </div>
                          ))}
                        {events.filter(event => 
                          format(new Date(event.date), 'yyyy-MM-dd') === 
                          format(selectedDate, 'yyyy-MM-dd')
                        ).length === 0 && (
                          <p className="text-muted-foreground">لا توجد أحداث في هذا اليوم</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات شريط الإعلان</CardTitle>
                <CardDescription>تحكم في كيفية ظهور الأحداث في الهيدر</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...settingsForm}>
                  <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-6">
                    <FormField
                      control={settingsForm.control}
                      name="show_in_header"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">عرض في الهيدر</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              إظهار الأحداث القادمة في شريط في أعلى الصفحة
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={settingsForm.control}
                        name="header_duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>مدة الظهور (بالثواني)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                max="60"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={settingsForm.control}
                        name="auto_show_before_days"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>عرض قبل الحدث بـ (أيام)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="30"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={settingsForm.control}
                      name="header_color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>لون الشريط</FormLabel>
                          <div className="grid grid-cols-4 gap-2">
                            {colorOptions.map((color) => (
                              <Button
                                key={color.value}
                                type="button"
                                variant={field.value === color.value ? "default" : "outline"}
                                className={cn(
                                  "h-12 flex flex-col gap-1",
                                  field.value === color.value && "ring-2 ring-offset-2"
                                )}
                                onClick={() => field.onChange(color.value)}
                              >
                                <div className={cn("w-6 h-6 rounded", color.class)} />
                                <span className="text-xs">{color.label}</span>
                              </Button>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={settingsForm.control}
                      name="is_active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">تفعيل النظام</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              تفعيل أو إلغاء تفعيل نظام التقويم بالكامل
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full">
                      حفظ الإعدادات
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {settings?.show_in_header && (
              <Card>
                <CardHeader>
                  <CardTitle>معاينة الشريط</CardTitle>
                  <CardDescription>كيف سيظهر الشريط في الهيدر</CardDescription>
                </CardHeader>
                <CardContent>
                  <div 
                    className="p-3 rounded-lg text-white text-center font-medium animate-pulse"
                    style={{ backgroundColor: settings.header_color }}
                  >
                    🎉 يوجد أحداث قادمة في التقويم - اضغط لعرض التفاصيل
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    سيظهر هذا الشريط لمدة {settings.header_duration} ثانية قبل {settings.auto_show_before_days} أيام من كل حدث
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-6 border-b">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <CalendarIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-2xl">
                    {editingEvent ? 'تعديل الحدث' : 'إضافة حدث جديد'}
                  </DialogTitle>
                  <DialogDescription className="text-base mt-1">
                    {editingEvent ? 'تعديل تفاصيل الحدث في التقويم' : 'أضف حدثاً جديداً إلى تقويم المدرسة'}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <Form {...eventForm}>
              <form onSubmit={eventForm.handleSubmit(onEventSubmit)} className="space-y-6 pt-6">
                {/* معلومات أساسية */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    المعلومات الأساسية
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={eventForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">عنوان الحدث *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="مثال: يوم المعلم" 
                              {...field}
                              className="h-11"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={eventForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">نوع الحدث *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="اختر نوع الحدث" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="z-50" align="start" dir="rtl">
                              {typeOptions.map((type) => (
                                <SelectItem key={type.value} value={type.value} className="text-right">
                                  <span className="flex items-center gap-2">
                                    <span>{type.icon}</span>
                                    <span>{type.label}</span>
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={eventForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">وصف الحدث</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="أضف وصفاً تفصيلياً للحدث (اختياري)"
                            className="resize-none min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* التاريخ والوقت */}
                <div className="space-y-6 pt-4 border-t">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    التوقيت والمدة
                  </h3>

                  {/* طوال اليوم */}
                  <FormField
                    control={eventForm.control}
                    name="all_day"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-xl border-2 p-4 bg-gradient-to-r from-blue-500/5 to-transparent">
                        <div className="space-y-1">
                          <FormLabel className="text-base font-semibold flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-600" />
                            حدث طوال اليوم
                          </FormLabel>
                          <FormDescription className="text-sm">
                            إذا كان الحدث لا يتطلب وقتاً محدداً
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-blue-600"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* تاريخ البداية */}
                    <FormField
                      control={eventForm.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-sm font-medium mb-2">تاريخ البداية *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full h-11 pl-3 text-right font-normal justify-between",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                                  {field.value ? (
                                    format(field.value, "dd MMMM yyyy", { locale: ar })
                                  ) : (
                                    <span>اختر التاريخ</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 z-50" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date("1900-01-01")}
                                initialFocus
                                className={cn("p-3 pointer-events-auto")}
                                locale={ar}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* تاريخ النهاية */}
                    <FormField
                      control={eventForm.control}
                      name="end_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-sm font-medium mb-2">
                            تاريخ النهاية (اختياري)
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full h-11 pl-3 text-right font-normal justify-between",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                                  {field.value ? (
                                    format(field.value, "dd MMMM yyyy", { locale: ar })
                                  ) : (
                                    <span>اختر تاريخ النهاية</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 z-50" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => {
                                  const startDate = eventForm.watch('date');
                                  return date < new Date("1900-01-01") || (startDate && date < startDate);
                                }}
                                initialFocus
                                className={cn("p-3 pointer-events-auto")}
                                locale={ar}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription className="text-xs mt-1">
                            للأحداث متعددة الأيام (مثل: إجازات، مؤتمرات)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* الأوقات - تظهر فقط إذا لم يكن طوال اليوم */}
                  {!eventForm.watch('all_day') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                      <FormField
                        control={eventForm.control}
                        name="time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">وقت البداية</FormLabel>
                            <FormControl>
                              <TimeInput
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="اختر وقت البداية"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={eventForm.control}
                        name="end_time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">وقت النهاية (اختياري)</FormLabel>
                            <FormControl>
                              <TimeInput
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="اختر وقت النهاية"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>

                {/* اللون */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-pink-500/20 to-orange-500/20 flex items-center justify-center">
                      <Palette className="h-4 w-4 text-primary" />
                    </div>
                    المظهر
                  </h3>

                  <FormField
                    control={eventForm.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium mb-2">لون الحدث *</FormLabel>
                        <div className="grid grid-cols-4 gap-2">
                          {colorOptions.map((color) => (
                            <Button
                              key={color.value}
                              type="button"
                              variant={field.value === color.value ? "default" : "outline"}
                              size="sm"
                              className={cn(
                                "h-12 flex flex-col items-center justify-center gap-1 transition-all",
                                field.value === color.value && "ring-2 ring-primary ring-offset-2 scale-105"
                              )}
                              onClick={() => field.onChange(color.value)}
                            >
                              <div className={cn("w-6 h-6 rounded-full shadow-sm", color.class)} />
                              <span className="text-[10px]">{color.label}</span>
                            </Button>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>


                {/* تحديد الفئة المستهدفة */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Target className="h-4 w-4 text-primary" />
                    </div>
                    الجمهور المستهدف
                  </h3>

                  <FormField
                    control={eventForm.control}
                    name="is_for_all"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-xl border-2 p-4 bg-gradient-to-r from-primary/5 to-transparent">
                        <div className="space-y-1">
                          <FormLabel className="text-base font-semibold">حدث عام للجميع</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            سيكون الحدث مرئياً لجميع الطلاب في المدرسة
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-primary"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {!eventForm.watch('is_for_all') && (
                  <div className="space-y-4 rounded-xl border-2 border-dashed p-6 bg-muted/30 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 pb-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Target className="h-4 w-4 text-primary" />
                      </div>
                      <h4 className="text-base font-semibold">تحديد الصفوف المستهدفة</h4>
                    </div>
                    
                    <FormField
                      control={eventForm.control}
                      name="target_grade_levels"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-sm font-medium">الصفوف الدراسية</FormLabel>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {gradeOptions.map((grade) => (
                              <div 
                                key={grade.value} 
                                className={cn(
                                  "flex items-center space-x-3 space-x-reverse p-3 rounded-lg border-2 transition-all cursor-pointer hover:bg-accent",
                                  field.value?.includes(grade.value) && "bg-primary/5 border-primary"
                                )}
                                onClick={() => {
                                  const newValue = field.value?.includes(grade.value)
                                    ? (field.value || []).filter((v) => v !== grade.value)
                                    : [...(field.value || []), grade.value];
                                  field.onChange(newValue);
                                }}
                              >
                                <input
                                  type="checkbox"
                                  id={`grade-${grade.value}`}
                                  checked={field.value?.includes(grade.value)}
                                  onChange={() => {}}
                                  className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label
                                  htmlFor={`grade-${grade.value}`}
                                  className="text-sm font-medium cursor-pointer flex-1"
                                >
                                  {grade.label}
                                </Label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={eventForm.control}
                      name="target_class_ids"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-sm font-medium">صفوف محددة (اختياري)</FormLabel>
                          <div className="space-y-2 max-h-48 overflow-y-auto p-2 rounded-lg border bg-background/50">
                            {classes.length > 0 ? (
                              classes.map((classItem: any) => (
                                <div 
                                  key={classItem.id} 
                                  className={cn(
                                    "flex items-center space-x-3 space-x-reverse p-2.5 rounded-md border transition-all cursor-pointer hover:bg-accent",
                                    field.value?.includes(classItem.id) && "bg-primary/5 border-primary"
                                  )}
                                  onClick={() => {
                                    const newValue = field.value?.includes(classItem.id)
                                      ? (field.value || []).filter((v) => v !== classItem.id)
                                      : [...(field.value || []), classItem.id];
                                    field.onChange(newValue);
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    id={`class-${classItem.id}`}
                                    checked={field.value?.includes(classItem.id)}
                                    onChange={() => {}}
                                    className="h-4 w-4 rounded border-gray-300 text-primary"
                                  />
                                  <Label
                                    htmlFor={`class-${classItem.id}`}
                                    className="text-sm cursor-pointer flex-1"
                                  >
                                    {classItem.class_names?.name} - {classItem.grade_levels?.label}
                                  </Label>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                لا توجد صفوف متاحة
                              </p>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* حالة الحدث */}
                <div className="pt-4 border-t">
                  <FormField
                    control={eventForm.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-xl border-2 p-4 bg-gradient-to-r from-green-500/5 to-transparent">
                        <div className="space-y-1">
                          <FormLabel className="text-base font-semibold flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            حدث نشط
                          </FormLabel>
                          <div className="text-sm text-muted-foreground">
                            سيظهر الحدث للمستخدمين فقط إذا كان نشطاً
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-green-600"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* أزرار الإجراءات */}
                <div className="flex justify-end gap-3 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEventDialogOpen(false);
                      setEditingEvent(null);
                      eventForm.reset();
                    }}
                    className="min-w-[100px]"
                  >
                    إلغاء
                  </Button>
                  <Button 
                    type="submit" 
                    className="min-w-[120px] bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  >
                    {editingEvent ? 'تحديث الحدث' : 'إضافة الحدث'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <AppFooter />
    </div>
  );
};

export default CalendarManagement;