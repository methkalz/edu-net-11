import { FC, useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTeacherPresence, TeacherPresenceData } from '@/hooks/useTeacherPresence';
import { TeacherActivityStats } from './TeacherActivityStats';
import { TeacherActivityTable } from './TeacherActivityTable';
import { SchoolActivityStats } from './SchoolActivityStats';
import { isWithinLast24Hours, isWithinLast30Days } from '@/lib/dateUtils';
import { Search, Download, RefreshCw, X, School, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TeacherActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TabValue = 'online' | 'last24h' | 'last30d' | 'all';

export const TeacherActivityDialog: FC<TeacherActivityDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { teachers, loading, refetch } = useTeacherPresence();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabValue>('online');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'teacher' | 'school_admin'>('all');
  const [schoolFilter, setSchoolFilter] = useState<string>('all');

  // استخراج قائمة المدارس الفريدة
  const schools = useMemo(() => {
    const uniqueSchools = new Map<string, string>();
    teachers.forEach(t => {
      if (!uniqueSchools.has(t.school_id)) {
        uniqueSchools.set(t.school_id, t.school_name);
      }
    });
    return Array.from(uniqueSchools.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  }, [teachers]);

  const filteredTeachers = useMemo(() => {
    let filtered = teachers;

    // تصفية حسب التاب النشط
    switch (activeTab) {
      case 'online':
        filtered = filtered.filter(t => t.is_online);
        break;
      case 'last24h':
        filtered = filtered.filter(t => {
          if (!t.last_login_at) return false;
          return isWithinLast24Hours(t.last_login_at);
        });
        break;
      case 'last30d':
        filtered = filtered.filter(t => {
          if (!t.last_login_at) return false;
          return isWithinLast30Days(t.last_login_at);
        });
        break;
      case 'all':
      default:
        break;
    }

    // تصفية حسب الدور
    if (roleFilter !== 'all') {
      filtered = filtered.filter(t => t.role === roleFilter);
    }

    // تصفية حسب المدرسة
    if (schoolFilter !== 'all') {
      filtered = filtered.filter(t => t.school_id === schoolFilter);
    }

    // تصفية حسب البحث
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        t =>
          t.full_name.toLowerCase().includes(query) ||
          t.email.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [teachers, activeTab, searchQuery, roleFilter, schoolFilter]);

  const handleExport = () => {
    try {
      const csvContent = [
        ['الاسم', 'البريد الإلكتروني', 'المدرسة', 'الدور', 'الحالة', 'آخر تواجد', 'إجمالي الوقت (دقيقة)', 'عدد التسجيلات'].join(','),
        ...filteredTeachers.map(t =>
          [
            t.full_name,
            t.email,
            t.school_name,
            t.role === 'teacher' ? 'معلم' : 'مدير مدرسة',
            t.is_online ? 'متصل' : 'غير متصل',
            t.last_seen_at,
            t.total_time_minutes,
            t.login_count,
          ].join(',')
        ),
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `teacher-activity-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast({
        title: 'تم التصدير بنجاح',
        description: 'تم تنزيل ملف CSV',
      });
    } catch (error) {
      toast({
        title: 'خطأ في التصدير',
        description: 'حدث خطأ أثناء تصدير البيانات',
        variant: 'destructive',
      });
    }
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: 'تم التحديث',
      description: 'تم تحديث البيانات بنجاح',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] backdrop-blur-2xl bg-background/95 border border-border/50 rounded-3xl overflow-hidden">
        <DialogHeader className="pb-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl backdrop-blur-sm bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 shadow-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-foreground/90">
                  إحصائيات المعلمين والمدراء
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  تتبع حضور ونشاط المعلمين والمدراء
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
                className="backdrop-blur-sm bg-background/50 border-border/50 hover:bg-background/80 rounded-xl"
              >
                <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={filteredTeachers.length === 0}
                className="backdrop-blur-sm bg-background/50 border-border/50 hover:bg-background/80 rounded-xl"
              >
                <Download className="h-4 w-4 ml-2" />
                تصدير
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 max-h-[calc(95vh-120px)] overflow-y-auto px-1">
          {/* الإحصائيات العامة */}
          <TeacherActivityStats teachers={schoolFilter === 'all' ? teachers : filteredTeachers} />

          {/* إحصائيات المدارس */}
          <SchoolActivityStats teachers={teachers} />

          {/* الفلاتر والبحث */}
          <div className="space-y-3">
            {/* شريط البحث */}
            <div className="relative">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground/60" />
              <Input
                placeholder="ابحث بالاسم أو البريد الإلكتروني..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-12 pl-12 h-12 backdrop-blur-xl bg-background/50 border border-border/50 rounded-2xl focus:border-primary/40 focus:bg-background/80 transition-all"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 rounded-xl"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3">
              <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                <SelectTrigger className="flex-1 h-11 backdrop-blur-xl bg-background/50 border border-border/50 rounded-xl">
                  <School className="h-4 w-4 ml-2 text-muted-foreground" />
                  <SelectValue placeholder="المدرسة" />
                </SelectTrigger>
                <SelectContent className="backdrop-blur-xl bg-background/95 border border-border/50 rounded-xl">
                  <SelectItem value="all">جميع المدارس</SelectItem>
                  {schools.map(school => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}>
                <SelectTrigger className="flex-1 h-11 backdrop-blur-xl bg-background/50 border border-border/50 rounded-xl">
                  <Users className="h-4 w-4 ml-2 text-muted-foreground" />
                  <SelectValue placeholder="الدور" />
                </SelectTrigger>
                <SelectContent className="backdrop-blur-xl bg-background/95 border border-border/50 rounded-xl">
                  <SelectItem value="all">جميع الأدوار</SelectItem>
                  <SelectItem value="teacher">معلم</SelectItem>
                  <SelectItem value="school_admin">مدير مدرسة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* التابات والجدول */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 h-12 backdrop-blur-xl bg-background/50 border border-border/50 rounded-2xl p-1">
              <TabsTrigger value="online" className="rounded-xl data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                المتواجدين ({teachers.filter(t => t.is_online).length})
              </TabsTrigger>
              <TabsTrigger value="last24h" className="rounded-xl data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                آخر 24 ساعة ({teachers.filter(t => t.last_login_at && isWithinLast24Hours(t.last_login_at)).length})
              </TabsTrigger>
              <TabsTrigger value="last30d" className="rounded-xl data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                آخر 30 يوم ({teachers.filter(t => t.last_login_at && isWithinLast30Days(t.last_login_at)).length})
              </TabsTrigger>
              <TabsTrigger value="all" className="rounded-xl data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                الكل ({teachers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="online">
              <TeacherActivityTable teachers={filteredTeachers} />
            </TabsContent>

            <TabsContent value="last24h">
              <TeacherActivityTable teachers={filteredTeachers} />
            </TabsContent>

            <TabsContent value="last30d">
              <TeacherActivityTable teachers={filteredTeachers} />
            </TabsContent>

            <TabsContent value="all">
              <TeacherActivityTable teachers={filteredTeachers} />
            </TabsContent>
          </Tabs>

          {/* معلومات إضافية */}
          <div className="text-sm text-muted-foreground text-center py-4">
            عرض {filteredTeachers.length} من أصل {teachers.length} معلم ومدير
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
