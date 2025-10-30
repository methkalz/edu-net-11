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
import { useStudentPresenceForReports, StudentPresenceReportData } from '@/hooks/useStudentPresenceForReports';
import { StudentActivityStats } from './StudentActivityStats';
import { StudentActivityTable } from './StudentActivityTable';
import { SchoolStudentActivityStats } from './SchoolStudentActivityStats';
import { isWithinLast24Hours, isWithinLast30Days } from '@/lib/dateUtils';
import { Search, Download, RefreshCw, X, School, GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface StudentActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TabValue = 'online' | 'last24h' | 'last30d' | 'all';

export const StudentActivityDialog: FC<StudentActivityDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { students, loading, refetch } = useStudentPresenceForReports();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabValue>('online');
  const [searchQuery, setSearchQuery] = useState('');
  const [schoolFilter, setSchoolFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');

  // استخراج قائمة المدارس الفريدة
  const schools = useMemo(() => {
    const uniqueSchools = new Map<string, string>();
    students.forEach(s => {
      if (!uniqueSchools.has(s.school_id)) {
        uniqueSchools.set(s.school_id, s.school_name);
      }
    });
    return Array.from(uniqueSchools.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  }, [students]);

  // استخراج قائمة الصفوف الفريدة
  const grades = useMemo(() => {
    const uniqueGrades = new Set<string>();
    students.forEach(s => {
      if (s.grade_level) uniqueGrades.add(s.grade_level);
    });
    return Array.from(uniqueGrades).sort();
  }, [students]);

  // الطلاب بعد فلترة المدرسة والصف فقط (قبل فلترة التاب والبحث)
  const baseFilteredStudents = useMemo(() => {
    let filtered = students;

    // تصفية حسب المدرسة
    if (schoolFilter !== 'all') {
      filtered = filtered.filter(s => s.school_id === schoolFilter);
    }

    // تصفية حسب الصف
    if (gradeFilter !== 'all') {
      filtered = filtered.filter(s => s.grade_level === gradeFilter);
    }

    return filtered;
  }, [students, schoolFilter, gradeFilter]);

  // حساب الأعداد للتابات بناءً على الفلترة الأساسية
  const tabCounts = useMemo(() => {
    return {
      online: baseFilteredStudents.filter(s => s.is_online).length,
      last24h: baseFilteredStudents.filter(s => isWithinLast24Hours(s.last_seen_at)).length,
      last30d: baseFilteredStudents.filter(s => isWithinLast30Days(s.last_seen_at)).length,
      all: baseFilteredStudents.length,
    };
  }, [baseFilteredStudents]);

  // الطلاب بعد جميع الفلاتر (بما فيها التاب والبحث)
  const filteredStudents = useMemo(() => {
    let filtered = baseFilteredStudents;

    // تصفية حسب التاب النشط
    switch (activeTab) {
      case 'online':
        filtered = filtered.filter(s => s.is_online);
        break;
      case 'last24h':
        filtered = filtered.filter(s => isWithinLast24Hours(s.last_seen_at));
        break;
      case 'last30d':
        filtered = filtered.filter(s => isWithinLast30Days(s.last_seen_at));
        break;
      case 'all':
      default:
        break;
    }

    // تصفية حسب البحث
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        s =>
          s.full_name.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query) ||
          s.username.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [baseFilteredStudents, activeTab, searchQuery]);

  const handleExport = () => {
    try {
      const csvContent = [
        ['الاسم', 'البريد الإلكتروني', 'المدرسة', 'الصف', 'الحالة', 'آخر تواجد'].join(','),
        ...filteredStudents.map(s =>
          [
            s.full_name,
            s.email || s.username,
            s.school_name,
            s.grade_level || s.class_name || 'غير محدد',
            s.is_online ? 'متصل' : 'غير متصل',
            s.last_seen_at,
          ].join(',')
        ),
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `student-activity-${new Date().toISOString().split('T')[0]}.csv`;
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
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-foreground/90">
                  إحصائيات الطلاب النشطين
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  تتبع حضور ونشاط الطلاب عبر المدارس
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
                disabled={filteredStudents.length === 0}
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
          <StudentActivityStats students={schoolFilter === 'all' ? students : filteredStudents} />

          {/* إحصائيات المدارس */}
          <SchoolStudentActivityStats students={students} />

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
              
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="flex-1 h-11 backdrop-blur-xl bg-background/50 border border-border/50 rounded-xl">
                  <GraduationCap className="h-4 w-4 ml-2 text-muted-foreground" />
                  <SelectValue placeholder="الصف" />
                </SelectTrigger>
                <SelectContent className="backdrop-blur-xl bg-background/95 border border-border/50 rounded-xl">
                  <SelectItem value="all">جميع الصفوف</SelectItem>
                  {grades.map(grade => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* التابات والجدول */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 h-12 backdrop-blur-xl bg-background/50 border border-border/50 rounded-2xl p-1">
              <TabsTrigger value="online" className="rounded-xl data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                المتواجدين ({tabCounts.online})
              </TabsTrigger>
              <TabsTrigger value="last24h" className="rounded-xl data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                آخر 24 ساعة ({tabCounts.last24h})
              </TabsTrigger>
              <TabsTrigger value="last30d" className="rounded-xl data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                آخر 30 يوم ({tabCounts.last30d})
              </TabsTrigger>
              <TabsTrigger value="all" className="rounded-xl data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                الكل ({tabCounts.all})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="online">
              <StudentActivityTable students={filteredStudents} />
            </TabsContent>

            <TabsContent value="last24h">
              <StudentActivityTable students={filteredStudents} />
            </TabsContent>

            <TabsContent value="last30d">
              <StudentActivityTable students={filteredStudents} />
            </TabsContent>

            <TabsContent value="all">
              <StudentActivityTable students={filteredStudents} />
            </TabsContent>
          </Tabs>

          {/* معلومات إضافية */}
          <div className="text-sm text-muted-foreground text-center py-4">
            عرض {filteredStudents.length} من أصل {students.length} طالب
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
