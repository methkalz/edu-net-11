import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useStudentPresence } from '@/hooks/useStudentPresence';
import { supabase } from '@/integrations/supabase/client';
import { FormattedStudent } from '@/types/student';
import { GradeContentsData } from '@/types/content';
import { logger } from '@/lib/logger';
import { handleError } from '@/lib/error-handler';
import { 
  Calendar,
  Users,
  BookOpen,
  Video,
  FileText,
  GraduationCap,
  Clock,
  Star,
  Plus,
  Eye,
  BookMarked,
  School,
  CalendarDays,
  UserCheck,
  PlayCircle,
  FileIcon,
  TrendingUp,
  Award,
  Target,
  Activity,
  Bell,
  Sparkles,
  RefreshCw,
  Box,
  Play,
  Monitor,
  Settings,
  Rocket,
  FolderOpen,
  ChevronDown,
  Trophy
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import GradeContentViewer from '@/components/content/GradeContentViewer';
import { TeacherDashboardStats } from '@/components/dashboard/TeacherDashboardStats';
import { toast } from '@/hooks/use-toast';
import { useTeacherContentAccess } from '@/hooks/useTeacherContentAccess';
import { ContentFilterBadge } from '@/components/teacher/ContentFilterBadge';
import Grade12ProjectsWidget from '@/components/teacher/Grade12ProjectsWidget';
import ProjectNotifications from '@/components/teacher/ProjectNotifications';
import Grade10ProjectsWidget from '@/components/teacher/Grade10ProjectsWidget';
import ModernHeader from '@/components/shared/ModernHeader';
import { StudentPresenceWidget } from '@/components/teacher/StudentPresenceWidget';
import { OnlineStudentsStats } from '@/components/dashboard/OnlineStudentsStats';
import TeacherContentViewer from './teacher/TeacherContentViewer';
import { useGrade10Content } from '@/hooks/useGrade10Content';
import { useGrade11Files } from '@/hooks/useGrade11Files';
import { useGrade12Content } from '@/hooks/useGrade12Content';

interface TeacherClass {
  id: string;
  grade_level: string;
  class_name: string;
  student_count: number;
  academic_year: string;
}

interface TeacherStudent {
  id: string;
  full_name: string;
  username: string;
  created_at_utc: string;
}

interface SchoolCalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  description?: string;
  color: string;
  type: string;
}

interface GradeContent {
  id: string;
  title: string;
  description?: string;
  type: 'video' | 'document';
  created_at: string;
  thumbnail_url?: string;
  duration?: string;
  file_type?: string;
}

interface TeacherStats {
  totalClasses: number;
  totalStudents: number;
  availableContents: number;
  upcomingEvents: number;
  onlineStudents?: number;
}

const TeacherDashboard: React.FC = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<TeacherStats>({
    totalClasses: 0,
    totalStudents: 0,
    availableContents: 0,
    upcomingEvents: 0,
    onlineStudents: 0
  });
  const [myClasses, setMyClasses] = useState<TeacherClass[]>([]);
  const [recentStudents, setRecentStudents] = useState<TeacherStudent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<SchoolCalendarEvent[]>([]);
  const [availableContents, setAvailableContents] = useState<{
    grade10: GradeContent[];
    grade11: GradeContent[];
    grade12: GradeContent[];
  }>({
    grade10: [],
    grade11: [],
    grade12: []
  });
  const [schoolPackageContents, setSchoolPackageContents] = useState<string[]>([]);
  const [showPresenceWidget, setShowPresenceWidget] = useState(false);
  const [isOnlineStatsOpen, setIsOnlineStatsOpen] = useState(false);

  // استخدام هوك صلاحيات المحتوى للمعلم
  const { canAccessGrade, allowedGrades, loading: accessLoading } = useTeacherContentAccess();
  
  // استخدام هوك حضور الطلاب
  const { actualOnlineCount } = useStudentPresence();

  // استخدام هوكات المحتوى للحصول على البيانات
  const { videos: grade10Videos, documents: grade10Documents } = useGrade10Content();
  const { documents: grade11Documents, videos: grade11Videos } = useGrade11Files();
  const { projects, documents: grade12Documents } = useGrade12Content();

  useEffect(() => {
    if (user && userProfile?.role === 'teacher') {
      fetchTeacherData();
    }
  }, [user, userProfile]);

  // تحديث إحصائية الطلاب المتواجدين
  useEffect(() => {
    setStats(prev => ({
      ...prev,
      onlineStudents: actualOnlineCount
    }));
  }, [actualOnlineCount]);

  const fetchTeacherData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // الحصول على معرف المدرسة للمعلم
      const schoolId = userProfile?.school_id;
      if (!schoolId) {
        toast({
          title: "خطأ",
          description: "لم يتم العثور على معرف المدرسة",
          variant: "destructive"
        });
        return;
      }

      // جلب الصفوف المخصصة للمعلم
      await fetchTeacherClasses(schoolId);
      
      // جلب الطلاب الحديثين
      await fetchRecentStudents();
      
      // جلب أحداث التقويم
      await fetchSchoolEvents(schoolId);
      
      // جلب المضامين المتاحة حسب باقة المدرسة
      await fetchAvailableContents(schoolId);

      if (isRefresh) {
        toast({
          title: "تم التحديث بنجاح",
          description: "تم تحديث البيانات بنجاح",
        });
      }
      
    } catch (error) {
      logger.error('Error fetching teacher data', error as Error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في جلب البيانات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTeacherClasses = async (schoolId: string) => {
    try {
      // جلب الصفوف المخصصة للمعلم مع تفاصيل أكثر
      const { data: teacherClasses, error } = await supabase
        .from('teacher_classes')
        .select('class_id')
        .eq('teacher_id', user?.id);

      if (error) throw error;

      if (!teacherClasses || teacherClasses.length === 0) {
        setMyClasses([]);
        setStats(prev => ({ ...prev, totalClasses: 0, totalStudents: 0 }));
        return;
      }

      // جلب تفاصيل كل صف
      const classesWithDetails = await Promise.all(
        teacherClasses.map(async (tc) => {
          // جلب تفاصيل الصف
          const { data: classInfo, error: classError } = await supabase
            .from('classes')
            .select(`
              id,
              grade_level_id,
              class_name_id,
              academic_year_id,
              grade_levels!grade_level_id(label),
              class_names!class_name_id(name),
              academic_years!academic_year_id(name)
            `)
            .eq('id', tc.class_id)
            .single();

          if (classError || !classInfo) {
            return null;
          }

          // عدد الطلاب في الصف
          const { count: studentCount } = await supabase
            .from('class_students')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', tc.class_id);

          return {
            id: tc.class_id,
            grade_level: classInfo.grade_levels?.label || 'غير محدد',
            class_name: classInfo.class_names?.name || 'غير محدد',
            student_count: studentCount || 0,
            academic_year: classInfo.academic_years?.name || 'غير محدد'
          };
        })
      );

      const validClasses = classesWithDetails.filter(cls => cls !== null) as TeacherClass[];
      setMyClasses(validClasses);
      
      // حساب إجمالي الطلاب
      const totalStudents = validClasses.reduce((sum, cls) => sum + cls.student_count, 0);
      
      setStats(prev => ({
        ...prev,
        totalClasses: validClasses.length,
        totalStudents
      }));

    } catch (error) {
      logger.error('Error fetching teacher classes', error as Error);
    }
  };

  const fetchRecentStudents = async () => {
    try {
      // جلب آخر الطلاب المسجلين في صفوف المعلم
      const { data: students, error } = await supabase
        .rpc('get_students_for_teacher')
        .order('created_at_utc', { ascending: false })
        .limit(5);

      if (error) throw error;

      // تحويل البيانات للشكل المطلوب
      const formattedStudents: TeacherStudent[] = (students || []).map((student: TeacherStudent) => ({
        id: student.id,
        full_name: student.full_name,
        username: student.username,
        created_at_utc: student.created_at_utc
      }));

      setRecentStudents(formattedStudents);
    } catch (error) {
      logger.error('Error fetching recent students', error as Error);
    }
  };

  const fetchSchoolEvents = async (schoolId: string) => {
    try {
      const today = new Date();
      const { data: events, error } = await supabase
        .from('calendar_events')
        .select('*')
        .or(`school_id.eq.${schoolId},school_id.is.null`)
        .eq('is_active', true)
        .gte('date', today.toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(3);

      if (error) throw error;

      setUpcomingEvents(events || []);
      setStats(prev => ({
        ...prev,
        upcomingEvents: (events || []).length
      }));
    } catch (error) {
      logger.error('Error fetching school events', error as Error);
    }
  };

  const fetchAvailableContents = async (schoolId: string) => {
    try {
      // جلب باقة المدرسة لمعرفة المضامين المتاحة
      const { data: schoolPackage, error: packageError } = await supabase
        .from('school_packages')
        .select('package_id')
        .eq('school_id', schoolId)
        .eq('status', 'active')
        .single();

      if (packageError || !schoolPackage) {
        logger.warn('لم يتم العثور على باقة نشطة للمدرسة', { 
          schoolId, 
          error: packageError?.message 
        });
        return;
      }

      // جلب تفاصيل الباقة
      const { data: packageInfo, error: packageInfoError } = await supabase
        .from('packages')
        .select('available_grade_contents')
        .eq('id', schoolPackage.package_id)
        .single();

      if (packageInfoError || !packageInfo) {
        logger.warn('لم يتم العثور على معلومات الباقة', { 
          packageId: schoolPackage.package_id,
          error: packageInfoError?.message 
        });
        return;
      }

      const availableGrades = Array.isArray(packageInfo.available_grade_contents) 
        ? packageInfo.available_grade_contents 
        : [];
      setSchoolPackageContents(availableGrades as string[]);

      // جلب المضامين حسب الصفوف المتاحة
      let totalContents = 0;
      const contentsData = {
        grade10: [],
        grade11: [],
        grade12: []
      };

      if (availableGrades.includes('grade10')) {
        // جلب مضامين الصف العاشر
        const [videosResult, documentsResult] = await Promise.all([
          supabase.from('grade10_videos').select('*').order('created_at', { ascending: false }).limit(3),
          supabase.from('grade10_documents').select('*').order('created_at', { ascending: false }).limit(3)
        ]);

        const videos = (videosResult.data || []).map(v => ({
          id: v.id,
          title: v.title,
          description: v.description,
          type: 'video' as const,
          created_at: v.created_at,
          thumbnail_url: v.thumbnail_url,
          duration: v.duration
        }));

        const documents = (documentsResult.data || []).map(d => ({
          id: d.id,
          title: d.title,
          description: d.description,
          type: 'document' as const,
          created_at: d.created_at,
          file_type: d.file_type
        }));

        contentsData.grade10 = [...videos, ...documents];
        totalContents += videos.length + documents.length;
      }

      if (availableGrades.includes('grade11')) {
        // جلب مضامين الصف الحادي عشر (الدروس والامتحانات)
        const [lessonsResult, examsResult] = await Promise.all([
          supabase.from('lessons').select('*').order('created_at', { ascending: false }).limit(3),
          supabase.from('exams').select('*').order('created_at', { ascending: false }).limit(3)
        ]);

        const lessons = (lessonsResult.data || []).map(l => ({
          id: l.id,
          title: l.title,
          description: l.description,
          type: 'document' as const,
          created_at: l.created_at
        }));

        const exams = (examsResult.data || []).map(e => ({
          id: e.id,
          title: e.title,
          description: e.description,
          type: 'document' as const,
          created_at: e.created_at
        }));

        contentsData.grade11 = [...lessons, ...exams];
        totalContents += lessons.length + exams.length;
      }

      if (availableGrades.includes('grade12')) {
        // جلب مضامين الصف الثاني عشر
        const [videosResult, documentsResult] = await Promise.all([
          supabase.from('grade12_videos').select('*').order('created_at', { ascending: false }).limit(3),
          supabase.from('grade12_documents').select('*').order('created_at', { ascending: false }).limit(3)
        ]);

        const videos = (videosResult.data || []).map(v => ({
          id: v.id,
          title: v.title,
          description: v.description,
          type: 'video' as const,
          created_at: v.created_at,
          thumbnail_url: v.thumbnail_url,
          duration: v.duration
        }));

        const documents = (documentsResult.data || []).map(d => ({
          id: d.id,
          title: d.title,
          description: d.description,
          type: 'document' as const,
          created_at: d.created_at,
          file_type: d.file_type
        }));

        contentsData.grade12 = [...videos, ...documents];
        totalContents += videos.length + documents.length;
      }

      setAvailableContents(contentsData);
      setStats(prev => ({
        ...prev,
        availableContents: totalContents
      }));

    } catch (error) {
      handleError(error, {
        context: 'teacher_dashboard',
        action: 'fetch_school_package_info',
        schoolId
      });
    }
  };

  const quickActions = [
    { name: 'إدارة الطلاب', icon: Users, path: '/students', color: 'blue' },
    { name: 'تتبع تقدم الطلاب', icon: TrendingUp, path: '/student-tracking', color: 'green' },
    { name: 'التقويم والأحداث', icon: Calendar, path: '/calendar-management', color: 'purple' },
    { name: 'إدارة الصفوف', icon: School, path: '/school-classes', color: 'orange' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-transparent animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              جاري تحميل لوحة تحكم المعلم...
            </p>
            <p className="text-sm text-muted-foreground">يرجى الانتظار قليلاً</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5" dir="rtl">
      <ModernHeader 
        title="لوحة تحكم المعلم"
        onRefresh={() => fetchTeacherData(true)}
        refreshing={refreshing}
        notificationCount={0}
        onNotificationClick={() => {
          toast({
            title: "الإشعارات",
            description: "لا توجد إشعارات جديدة",
          });
        }}
      />
      
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* تم نقل الترحيب إلى الهيدر الموحد */}

        {/* الإحصائيات المحسنة */}
        <TeacherDashboardStats 
          stats={stats}
          loading={loading}
          refreshing={refreshing}
          onRefresh={() => fetchTeacherData(true)}
          onOnlineStudentsClick={() => setIsOnlineStatsOpen(true)}
        />

        {/* كارت تتبع تقدم الطلاب الجديد */}
        <Card className="glass-card border-0 shadow-xl animate-fade-in-up bg-gradient-to-br from-card to-card/80">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <span className="bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
                تتبع تقدم الطلاب
              </span>
            </CardTitle>
            <CardDescription className="text-base">
              راقب أداء طلابك وتقدمهم الدراسي بالتفصيل
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* معلومات سريعة */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                  <div className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">إجمالي الطلاب</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.totalStudents}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                  <div className="flex items-center gap-3">
                    <Activity className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">الطلاب النشطون</p>
                      <p className="text-2xl font-bold text-green-600">{stats.onlineStudents}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* الإجراءات */}
              <div className="flex flex-col gap-3 justify-center">
                <Button
                  size="lg"
                  className="w-full gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  onClick={() => navigate('/student-tracking')}
                >
                  <TrendingUp className="h-5 w-5" />
                  عرض تقرير التتبع الشامل
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => navigate('/students')}
                >
                  <Users className="h-5 w-5" />
                  إدارة الطلاب
                </Button>
                <div className="text-sm text-muted-foreground text-center mt-2">
                  💡 تابع تقدم كل طالب في الفيديوهات، المستندات، الألعاب والمشاريع
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* الإجراءات السريعة المحسنة */}
        <Card className="glass-card border-0 shadow-xl animate-fade-in-up">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-primary/70 flex items-center justify-center">
                <Target className="h-4 w-4 text-white" />
              </div>
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                الإجراءات السريعة
              </span>
            </CardTitle>
            <CardDescription className="text-base">
              الوصول السريع للأدوات والوظائف الأساسية
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-3 glass-card hover:shadow-lg hover:scale-105 transition-all duration-300 group"
                  onClick={() => navigate(action.path)}
                >
                  <action.icon className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
                  <span className="text-sm font-medium">{action.name}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Grade-specific Projects and Notifications */}
        {canAccessGrade('12') && canAccessGrade('10') ? (
          // Teacher responsible for both grades - show both blocks
          <div className="space-y-8">
            {/* Grade 12 Projects and Notifications */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Grade12ProjectsWidget />
              </div>
              <div className="lg:col-span-1">
                <ProjectNotifications gradeFilter="12" title="إشعارات الصف الثاني عشر" />
              </div>
            </div>
            
            {/* Grade 10 Projects and Notifications */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Grade10ProjectsWidget />
              </div>
              <div className="lg:col-span-1">
                <ProjectNotifications gradeFilter="10" title="إشعارات الصف العاشر" />
              </div>
            </div>
          </div>
        ) : canAccessGrade('12') ? (
          // Teacher responsible for grade 12 only
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Grade12ProjectsWidget />
            </div>
            <div className="lg:col-span-1">
              <ProjectNotifications gradeFilter="12" title="إشعارات الصف الثاني عشر" />
            </div>
          </div>
        ) : canAccessGrade('10') ? (
          // Teacher responsible for grade 10 only
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Grade10ProjectsWidget />
            </div>
            <div className="lg:col-span-1">
              <ProjectNotifications gradeFilter="10" title="إشعارات الصف العاشر" />
            </div>
          </div>
        ) : null}

        {/* المضامين التعليمية المتاحة - عرض كامل كما يراها الطلاب */}
        {schoolPackageContents.length > 0 && (
          <Card className="glass-card border-0 shadow-xl animate-fade-in-up">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
                  <BookMarked className="h-4 w-4 text-white" />
                </div>
                <span className="bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
                  المضامين التعليمية
                </span>
              </CardTitle>
              <CardDescription className="text-base">
                استكشف وأدر المحتوى التعليمي للصفوف المختلفة تماماً كما يراه الطلاب
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Grade 10 Content */}
              {schoolPackageContents.includes('grade10') && canAccessGrade('10') && (
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between text-lg h-14 hover:bg-blue-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Video className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="text-right">
                          <div className="font-bold">الصف العاشر</div>
                          <div className="text-sm text-muted-foreground">
                            {grade10Videos.length} فيديو • {grade10Documents.length} مستند
                          </div>
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <div className="border rounded-lg p-4 bg-muted/20">
                      <TeacherContentViewer grade="10" />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Grade 11 Content */}
              {schoolPackageContents.includes('grade11') && canAccessGrade('11') && (
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between text-lg h-14 hover:bg-green-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="text-right">
                          <div className="font-bold">الصف الحادي عشر</div>
                          <div className="text-sm text-muted-foreground">
                            {grade11Documents.length} مستند • {grade11Videos.length} فيديو
                          </div>
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <div className="border rounded-lg p-4 bg-muted/20">
                      <TeacherContentViewer grade="11" />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Grade 12 Content */}
              {schoolPackageContents.includes('grade12') && canAccessGrade('12') && (
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between text-lg h-14 hover:bg-purple-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Trophy className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="text-right">
                          <div className="font-bold">الصف الثاني عشر</div>
                          <div className="text-sm text-muted-foreground">
                            {projects.length} مشروع نهائي • {grade12Documents.length} مستند
                          </div>
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <div className="border rounded-lg p-4 bg-muted/20">
                      <TeacherContentViewer grade="12" />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* رسالة عند عدم وجود صفوف مخصصة للمعلم */}
              {schoolPackageContents.length > 0 && allowedGrades.length === 0 && !accessLoading && (
                <div className="text-center py-12 border border-amber-200 bg-amber-50 rounded-lg">
                  <School className="h-16 w-16 mx-auto mb-4 text-amber-500" />
                  <h3 className="text-lg font-semibold mb-2 text-amber-800">لم يتم تخصيص صفوف لك بعد</h3>
                  <p className="text-amber-700 mb-4">
                    يرجى التواصل مع إدارة المدرسة لتخصيص الصفوف التي ستدرسها
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-amber-600">
                    <Award className="h-4 w-4" />
                    <span>سيتم عرض المحتوى هنا بمجرد تخصيص الصفوف</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* صفوفي الدراسية المحسنة */}
          <Card className="glass-card border-0 shadow-xl animate-fade-in-up">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                  <GraduationCap className="h-4 w-4 text-white" />
                </div>
                <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                  صفوفي الدراسية
                </span>
              </CardTitle>
              <CardDescription className="text-base">
                الصفوف المخصصة لك والطلاب المسجلين فيها
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {myClasses.length > 0 ? (
                myClasses.map((cls, index) => (
                  <div 
                    key={cls.id} 
                    className="glass-card p-4 rounded-xl hover:shadow-lg transition-all duration-300 group animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {cls.grade_level} - {cls.class_name}
                        </h4>
                        <p className="text-sm text-muted-foreground">{cls.academic_year}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                          <Users className="h-3 w-3 mr-1" />
                          {cls.student_count} طالب
                        </Badge>
                        <Button size="sm" variant="outline" className="hover:shadow-md transition-all duration-200">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-primary/10 to-primary/5 flex items-center justify-center">
                    <GraduationCap className="h-8 w-8 text-primary/50" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">لم يتم تخصيص صفوف لك بعد</p>
                    <p className="text-sm text-muted-foreground mt-1">سيتم إشعارك عند تخصيص صفوف دراسية لك</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* الأحداث القادمة المحسنة */}
          <Card className="glass-card border-0 shadow-xl animate-fade-in-up">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center">
                  <CalendarDays className="h-4 w-4 text-white" />
                </div>
                <span className="bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                  الأحداث القادمة
                </span>
              </CardTitle>
              <CardDescription className="text-base">
                فعاليات ومناسبات المدرسة القادمة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event, index) => (
                  <div 
                    key={event.id} 
                    className="glass-card p-4 rounded-xl hover:shadow-lg transition-all duration-300 animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <div 
                        className="w-4 h-4 rounded-full mt-2 shadow-lg" 
                        style={{ backgroundColor: event.color }}
                      ></div>
                      <div className="flex-1 space-y-1">
                        <h4 className="font-semibold text-foreground">{event.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(event.date), 'dd MMMM yyyy', { locale: ar })}
                          {event.time && ` - ${event.time}`}
                        </p>
                        {event.description && (
                          <p className="text-sm text-muted-foreground/80">{event.description}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="bg-secondary/50 border-secondary">
                        {event.type}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-orange-500/10 to-orange-500/5 flex items-center justify-center">
                    <Calendar className="h-8 w-8 text-orange-500/50" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">لا توجد أحداث قادمة</p>
                    <p className="text-sm text-muted-foreground mt-1">سيتم إضافة الأحداث الجديدة هنا</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* الطلاب الجدد المحسن */}
        <Card className="glass-card border-0 shadow-xl animate-fade-in-up">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
                <UserCheck className="h-4 w-4 text-white" />
              </div>
              <span className="bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
                آخر الطلاب المسجلين
              </span>
            </CardTitle>
            <CardDescription className="text-base">
              الطلاب الذين تم تسجيلهم مؤخراً في صفوفك
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentStudents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentStudents.map((student, index) => (
                  <div 
                    key={student.id} 
                    className="glass-card p-4 rounded-xl hover:shadow-lg transition-all duration-300 group animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {student.full_name}
                        </h4>
                        <p className="text-sm text-muted-foreground">@{student.username}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-green-500/10 to-green-500/5 flex items-center justify-center">
                  <Users className="h-8 w-8 text-green-500/50" />
                </div>
                <div>
                  <p className="font-medium text-foreground">لا توجد طلاب مسجلين في صفوفك</p>
                  <p className="text-sm text-muted-foreground mt-1">سيظهر الطلاب الجدد هنا عند تسجيلهم</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* إزالة القسم المكرر للمضامين التعليمية من الأسفل */}
      </div>

      {/* Student Presence Widget */}
      <StudentPresenceWidget 
        isOpen={showPresenceWidget}
        onToggle={() => setShowPresenceWidget(!showPresenceWidget)}
      />

      {/* Online Students Stats Modal */}
      <OnlineStudentsStats
        isOpen={isOnlineStatsOpen}
        onClose={() => setIsOnlineStatsOpen(false)}
      />
    </div>
  );
};

export default TeacherDashboard;