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
import { isWithinLast24Hours, isWithinLast30Days } from '@/lib/dateUtils';
import { Search, Download, RefreshCw } from 'lucide-react';
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

  const filteredTeachers = useMemo(() => {
    let filtered = teachers;

    // تصفية حسب التاب النشط
    switch (activeTab) {
      case 'online':
        filtered = filtered.filter(t => t.is_online);
        break;
      case 'last24h':
        // نستخدم last_login_at للدقة - فقط من سجل دخول فعلياً
        filtered = filtered.filter(t => {
          if (!t.last_login_at) return false;
          return isWithinLast24Hours(t.last_login_at);
        });
        break;
      case 'last30d':
        // نستخدم last_login_at للدقة - فقط من سجل دخول فعلياً
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
  }, [teachers, activeTab, searchQuery, roleFilter]);

  const handleExport = () => {
    try {
      const csvContent = [
        ['الاسم', 'البريد الإلكتروني', 'الدور', 'الحالة', 'آخر تواجد', 'إجمالي الوقت (دقيقة)', 'عدد التسجيلات'].join(','),
        ...filteredTeachers.map(t =>
          [
            t.full_name,
            t.email,
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
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center justify-between">
            <span>إحصائيات المعلمين والمدراء</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={filteredTeachers.length === 0}
              >
                <Download className="h-4 w-4 ml-2" />
                تصدير CSV
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* الإحصائيات العامة */}
          <TeacherActivityStats teachers={teachers} />

          {/* الفلاتر والبحث */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث بالاسم أو البريد الإلكتروني..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="الدور" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأدوار</SelectItem>
                <SelectItem value="teacher">معلم</SelectItem>
                <SelectItem value="school_admin">مدير مدرسة</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* التابات والجدول */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="online">
                المتواجدين الآن ({teachers.filter(t => t.is_online).length})
              </TabsTrigger>
              <TabsTrigger value="last24h">
                آخر 24 ساعة ({teachers.filter(t => t.last_login_at && isWithinLast24Hours(t.last_login_at)).length})
              </TabsTrigger>
              <TabsTrigger value="last30d">
                آخر 30 يوم ({teachers.filter(t => t.last_login_at && isWithinLast30Days(t.last_login_at)).length})
              </TabsTrigger>
              <TabsTrigger value="all">
                الكل ({teachers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="online" className="mt-6">
              <TeacherActivityTable teachers={filteredTeachers} />
            </TabsContent>

            <TabsContent value="last24h" className="mt-6">
              <TeacherActivityTable teachers={filteredTeachers} />
            </TabsContent>

            <TabsContent value="last30d" className="mt-6">
              <TeacherActivityTable teachers={filteredTeachers} />
            </TabsContent>

            <TabsContent value="all" className="mt-6">
              <TeacherActivityTable teachers={filteredTeachers} />
            </TabsContent>
          </Tabs>

          {/* معلومات إضافية */}
          <div className="text-sm text-muted-foreground text-center pt-4 border-t">
            عرض {filteredTeachers.length} من أصل {teachers.length} معلم ومدير
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
