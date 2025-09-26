import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
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
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import GradeContentViewer from '@/components/content/GradeContentViewer';
import { TeacherDashboardStats } from '@/components/dashboard/TeacherDashboardStats';
import { toast } from '@/hooks/use-toast';
import { useTeacherContentAccess } from '@/hooks/useTeacherContentAccess';
import { ContentFilterBadge } from '@/components/teacher/ContentFilterBadge';
import Grade12ProjectsWidget from '@/components/teacher/Grade12ProjectsWidget';
import ProjectNotifications from '@/components/teacher/ProjectNotifications';
import { UniversalAvatar } from '@/components/shared/UniversalAvatar';
import { UserTitleBadge } from '@/components/shared/UserTitleBadge';

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
    upcomingEvents: 0
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

  useEffect(() => {
    if (user && userProfile?.role === 'teacher') {
      fetchTeacherData();
    }
  }, [user, userProfile]);

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
    { name: 'مضامين الصفوف', icon: BookOpen, path: '/educational-content', color: 'green' },
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
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* الترحيب المحسن */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 rounded-2xl -z-10"></div>
          <div className="glass-card p-8 rounded-2xl backdrop-blur-sm border-0 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <UniversalAvatar
                    avatarUrl={userProfile?.avatar_url}
                    userName={userProfile?.full_name}
                    size="xl"
                    className="border-4 border-white/20 shadow-xl"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent">
                        أهلاً وسهلاً {userProfile?.full_name}
                      </h1>
                      <UserTitleBadge
                        role={userProfile?.role || 'teacher'}
                        displayTitle={userProfile?.display_title}
                        size="lg"
                        variant="secondary"
                      />
                    </div>
                    <p className="text-muted-foreground text-lg">
                      مرحباً بك في لوحة تحكم المعلم - إدارة صفوفك وطلابك بسهولة
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => fetchTeacherData(true)}
                  disabled={refreshing}
                  className="glass-card hover:shadow-lg transition-all duration-300"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'جاري التحديث...' : 'تحديث'}
                </Button>
                <Button className="bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg transition-all duration-300">
                  <Bell className="h-4 w-4 mr-2" />
                  الإشعارات
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* الإحصائيات المحسنة */}
        <TeacherDashboardStats 
          stats={stats}
          loading={loading}
          refreshing={refreshing}
          onRefresh={() => fetchTeacherData(true)}
        />

        {/* Grade 12 Projects and Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Grade12ProjectsWidget />
          </div>
          <div className="lg:col-span-1">
            <ProjectNotifications />
          </div>
        </div>

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

        {/* المضامين المتاحة المحسنة */}
        {schoolPackageContents.length > 0 && (
          <div className="space-y-8 animate-fade-in-up">
            <div className="glass-card p-6 rounded-2xl border-0 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
                    <BookMarked className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
                      المضامين التعليمية المتاحة
                    </h2>
                    <p className="text-muted-foreground">استكشف المواد التعليمية المتاحة لمدرستك</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200 px-4 py-2">
                  <span className="font-semibold">{stats.availableContents}</span>
                  <span className="mr-1">عنصر متاح</span>
                </Badge>
              </div>
            </div>
            
            {schoolPackageContents.includes('grade10') && availableContents.grade10.length > 0 && (
              <GradeContentViewer
                grade="grade10"
                gradeLabel="الصف العاشر"
                contents={availableContents.grade10}
                onViewMore={() => navigate('/grade10-management')}
              />
            )}

            {schoolPackageContents.includes('grade11') && availableContents.grade11.length > 0 && (
              <GradeContentViewer
                grade="grade11"
                gradeLabel="الصف الحادي عشر"
                contents={availableContents.grade11}
                onViewMore={() => navigate('/grade11-management')}
              />
            )}

            {schoolPackageContents.includes('grade12') && availableContents.grade12.length > 0 && (
              <GradeContentViewer
                grade="grade12"
                gradeLabel="الصف الثاني عشر"
                contents={availableContents.grade12}
                onViewMore={() => navigate('/grade12-management')}
              />
            )}

            {schoolPackageContents.length > 0 && 
             (availableContents.grade10.length === 0 && 
              availableContents.grade11.length === 0 && 
              availableContents.grade12.length === 0) && (
              <Card className="text-center py-12">
                <CardContent>
                  <BookMarked className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">لا توجد مضامين متاحة حالياً</h3>
                  <p className="text-muted-foreground mb-4">
                    لم يتم إضافة مضامين تعليمية لباقة مدرستك بعد
                  </p>
                  <Button variant="outline" onClick={() => navigate('/content-management')}>
                    استكشاف إدارة المضامين
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;