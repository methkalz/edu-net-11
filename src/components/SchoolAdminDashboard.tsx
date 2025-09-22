import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { School, Users, BookOpen, Settings, Package, Calendar, TrendingUp, Shield, CreditCard, Clock, Activity, Globe, RefreshCw, AlertTriangle } from 'lucide-react';
import { SchoolCalendarWidget } from '@/components/calendar/SchoolCalendarWidget';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { TeacherManagement } from './TeacherManagement';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import EnhancedDashboardStats from '@/components/dashboard/EnhancedDashboardStats';
import PackageStatusCard from '@/components/dashboard/PackageStatusCard';
import { UniversalAvatar } from '@/components/shared/UniversalAvatar';
import { UserTitleBadge } from '@/components/shared/UserTitleBadge';
interface SchoolStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  activeClasses: number;
  archivedClasses: number;
  activePlugins: number;
  totalPlugins: number;
}
interface SchoolPackage {
  id: string;
  name: string;
  name_ar: string;
  description_ar: string;
  max_students: number;
  max_teachers: number;
  start_date: string;
  end_date: string;
  status: string;
  features: string[];
  price: number;
  currency: string;
  duration_days: number | null;
}
const SchoolAdminDashboard = () => {
  const navigate = useNavigate();
  const {
    userProfile
  } = useAuth();
  const [stats, setStats] = useState<SchoolStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    activeClasses: 0,
    archivedClasses: 0,
    activePlugins: 0,
    totalPlugins: 0
  });
  const [schoolPackage, setSchoolPackage] = useState<SchoolPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTeacherManagement, setShowTeacherManagement] = useState(false);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const { toast } = useToast();
  useEffect(() => {
    if (userProfile?.school_id) {
      fetchSchoolStats();
      fetchSchoolPackage();
      fetchRecentActivities();
    }
  }, [userProfile?.school_id]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (userProfile?.school_id && !loading) {
        refreshData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [userProfile?.school_id, loading]);
  const fetchSchoolStats = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const schoolId = userProfile?.school_id;
      if (!schoolId) return;

      // Enhanced error handling with individual queries
      let studentsCount = 0;
      let teachersCount = 0;
      let totalClassesCount = 0;
      let activeClassesCount = 0;
      let totalPluginsCount = 0;
      let activePluginsCount = 0;

      // Get students count
      try {
        const { count } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', schoolId);
        studentsCount = count || 0;
      } catch (error) {
        logger.warn('Error fetching students count', { error: (error as Error).message });
      }

      // Get teachers count
      try {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', schoolId)
          .eq('role', 'teacher');
        teachersCount = count || 0;
      } catch (error) {
        logger.warn('Error fetching teachers count', { error: (error as Error).message });
      }

      // Get classes stats
      try {
        const { count: totalCount } = await supabase
          .from('classes')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', schoolId);
        totalClassesCount = totalCount || 0;

        const { count: activeCount } = await supabase
          .from('classes')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', schoolId)
          .eq('status', 'active');
        activeClassesCount = activeCount || 0;
      } catch (error) {
        logger.warn('Error fetching classes count', { error: (error as Error).message });
      }

      // Get plugins count with fallback
      try {
        const { count: totalPlugins } = await supabase
          .from('plugins')
          .select('*', { count: 'exact', head: true });
        totalPluginsCount = totalPlugins || 0;

        const { count: activePlugins } = await supabase
          .from('school_plugins')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', schoolId)
          .eq('status', 'enabled');
        activePluginsCount = activePlugins || 0;
      } catch (error) {
        logger.warn('Plugins tables not available', { error: (error as Error).message });
        // Fallback values
        totalPluginsCount = 0;
        activePluginsCount = 0;
      }

      const newStats = {
        totalStudents: studentsCount,
        totalTeachers: teachersCount,
        totalClasses: totalClassesCount,
        activeClasses: activeClassesCount,
        archivedClasses: Math.max(totalClassesCount - activeClassesCount, 0),
        activePlugins: activePluginsCount,
        totalPlugins: totalPluginsCount
      };

      setStats(newStats);
      
      if (isRefresh) {
        toast({
          title: "تم التحديث بنجاح",
          description: "تم تحديث الإحصائيات بنجاح",
        });
      }

    } catch (error) {
      const errorMessage = 'خطأ في جلب إحصائيات المدرسة';
      setError(errorMessage);
      logger.error('Error fetching school stats', error as Error);
      
      toast({
        title: "خطأ في التحديث",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  const fetchSchoolPackage = async () => {
    try {
      const schoolId = userProfile?.school_id;
      if (!schoolId) return;

      // Use unified function to get school package with usage
      const { data: packageData, error: packageError } = await supabase
        .rpc('get_school_package_with_usage', { school_uuid: schoolId });

      if (packageError) {
        logger.error('Error fetching school package', packageError);
        return;
      }

      if (packageData) {
        const pkg = packageData as any;
        setSchoolPackage({
          id: pkg.id,
          name: pkg.name,
          name_ar: pkg.name_ar,
          description_ar: pkg.description_ar,
          max_students: pkg.max_students,
          max_teachers: pkg.max_teachers,
          start_date: pkg.start_date,
          end_date: pkg.end_date,
          status: pkg.status,
          features: Array.isArray(pkg.features) ? pkg.features.map(f => String(f)) : [],
          price: pkg.price,
          currency: pkg.currency || 'USD',
          duration_days: pkg.duration_days
        });
      }
    } catch (error) {
      logger.error('Error fetching school package', error as Error);
    }
  };
  const getUsagePercentage = (used: number, max: number) => {
    if (!max || max <= 0) return 0;
    if (used < 0) return 0;
    return Math.min((used / max) * 100, 100);
  };
  const getDaysRemaining = () => {
    if (!schoolPackage?.end_date) return null;
    
    try {
      const endDate = new Date(schoolPackage.end_date);
      const today = new Date();
      
      // Check for invalid dates
      if (isNaN(endDate.getTime()) || isNaN(today.getTime())) return null;
      
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(diffDays, 0);
    } catch {
      return null;
    }
  };
  const getDaysRemainingDisplay = () => {
    // إذا كانت الباقة بأيام غير محدودة (duration_days = null أو -1)
    if (!schoolPackage?.duration_days || schoolPackage.duration_days === -1) {
      return "غير محدود";
    }
    const days = getDaysRemaining();
    return days !== null ? days.toString() : "0";
  };
  const getSubscriptionEndDisplay = () => {
    if (!schoolPackage?.end_date) return "اشتراك دائم";
    const endDate = new Date(schoolPackage.end_date);
    const year = endDate.getFullYear();

    // إذا كان التاريخ 1970 أو قبله، فهو اشتراك دائم
    if (year <= 1970) {
      return "اشتراك دائم";
    }

    // إذا كانت الباقة بأيام غير محدودة
    if (!schoolPackage?.duration_days || schoolPackage.duration_days === -1) {
      return "اشتراك دائم";
    }
    return format(endDate, 'dd.M.yyyy', { locale: ar });
  };

  const fetchRecentActivities = async () => {
    try {
      const schoolId = userProfile?.school_id;
      if (!schoolId) return;

      // Get recent audit logs for activities
      const { data: auditLogs } = await supabase
        .from('audit_log')
        .select('action, created_at_utc, entity')
        .order('created_at_utc', { ascending: false })
        .limit(5);

      if (auditLogs) {
        const activities = auditLogs.map(log => ({
          title: getActionLabel(log.action),
          time: formatTimeAgo(log.created_at_utc),
          color: getActionColor(log.action),
          icon: getActionIcon(log.action)
        }));
        setRecentActivities(activities);
      }
    } catch (error) {
      logger.error('Error fetching recent activities', error as Error);
      // Fallback to mock data
      setRecentActivities([
        { title: 'تم إضافة طالب جديد', time: 'منذ 5 دقائق', color: 'green-neon', icon: Users },
        { title: 'تم إنشاء صف جديد', time: 'منذ 15 دقيقة', color: 'blue-electric', icon: BookOpen },
        { title: 'تم تحديث المحتوى', time: 'منذ ساعة', color: 'orange-fire', icon: Activity },
      ]);
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'USER_CREATED': 'تم إنشاء مستخدم جديد',
      'STUDENT_ENROLLED': 'تم تسجيل طالب جديد',
      'CLASS_CREATED': 'تم إنشاء صف جديد',
      'CONTENT_UPLOADED': 'تم رفع محتوى جديد',
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      'USER_CREATED': 'green-neon',
      'STUDENT_ENROLLED': 'blue-electric',
      'CLASS_CREATED': 'orange-fire',
      'CONTENT_UPLOADED': 'purple-mystic',
    };
    return colors[action] || 'green-neon';
  };

  const getActionIcon = (action: string) => {
    const icons: Record<string, any> = {
      'USER_CREATED': Users,
      'STUDENT_ENROLLED': Users,
      'CLASS_CREATED': BookOpen,
      'CONTENT_UPLOADED': Activity,
    };
    return icons[action] || Activity;
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'الآن';
      if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
      if (diffHours < 24) return `منذ ${diffHours} ساعة`;
      return `منذ ${diffDays} يوم`;
    } catch {
      return 'منذ وقت قريب';
    }
  };

  const refreshData = useCallback(() => {
    fetchSchoolStats(true);
    fetchSchoolPackage();
    fetchRecentActivities();
  }, [userProfile?.school_id]);

  const getPackageStatusColor = () => {
    if (!schoolPackage) return 'gray';
    
    const daysRemaining = getDaysRemaining();
    if (daysRemaining === null) return 'green'; // Unlimited
    if (daysRemaining <= 7) return 'red';
    if (daysRemaining <= 30) return 'yellow';
    return 'green';
  };
  const StatsLoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="glass-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-4 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background pattern-dots flex flex-col" dir="rtl">
        <div className="container mx-auto px-6 py-6 space-y-8">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-24" />
          </div>
          <StatsLoadingSkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <Skeleton className="h-64 w-full rounded-lg" />
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
            <div className="lg:col-span-2">
              <Skeleton className="h-96 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (showTeacherManagement) {
    return <TeacherManagement onBack={() => setShowTeacherManagement(false)} />;
  }
  return <div className="min-h-screen bg-background pattern-dots flex flex-col" dir="rtl">
      {/* Modern Header */}
      <header className="glass-card sticky top-0 z-50 soft-shadow backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <UniversalAvatar
                avatarUrl={userProfile?.avatar_url}
                userName={userProfile?.full_name}
                size="lg"
                className="border-2 border-white/20"
              />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg gradient-electric flex items-center justify-center">
                  <School className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-xl font-bold text-foreground">أهلاً {userProfile?.full_name}</h1>
                    <UserTitleBadge
                      role={userProfile?.role || 'school_admin'}
                      displayTitle={userProfile?.display_title}
                      size="md"
                      variant="outline"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">لوحة تحكم مدير المدرسة - إدارة شاملة للمؤسسة التعليمية</p>
                </div>
              </div>
            </div>
            
            {getPackageStatusColor() === 'red' && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 rounded-lg">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">الباقة تنتهي قريباً!</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6 space-y-8">
        {/* Enhanced Stats Section */}
        <EnhancedDashboardStats
          stats={stats}
          loading={loading}
          refreshing={refreshing}
          error={error}
          onRefresh={refreshData}
        />

        {/* Quick Actions */}
        <section className="animate-fade-in-up" style={{
        animationDelay: '200ms'
      }}>
          <div className="flex items-center mb-6">
            <h2 className="text-2xl font-bold font-cairo text-foreground">⚡ الإجراءات السريعة</h2>
            <div className="accent-dot mr-3"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[{
            name: 'إدارة الطلاب',
            icon: Users,
            path: '/students'
          }, {
            name: 'إدارة المعلمين',
            icon: Users,
            action: () => setShowTeacherManagement(true)
          }, {
            name: 'إدارة الصفوف',
            icon: BookOpen,
            path: '/school-classes'
          }, {
            name: 'المضامين التعليمية',
            icon: BookOpen,
            path: '/educational-content'
          }, {
            name: 'الإعدادات',
            icon: Settings,
            path: '/system-settings'
          }].map((action, index) => <Card key={action.name} className="glass-card card-hover animate-scale-hover cursor-pointer group" style={{
            animationDelay: `${index * 50}ms`
          }} onClick={() => action.path ? navigate(action.path) : action.action?.()}>
                <CardContent className="p-4 text-center flex flex-col items-center justify-center">
                  <action.icon className="h-8 w-8 text-primary mx-auto mb-3 icon-glow group-hover:animate-gentle-float transition-all" />
                  <p className="text-foreground font-medium text-sm">{action.name}</p>
                </CardContent>
              </Card>)}
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up" style={{
        animationDelay: '300ms'
      }}>
          {/* Right Column - Calendar and School Admin Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* School Calendar Widget */}
            <SchoolCalendarWidget />
            
            {/* School Admin Profile Card */}
            <Card className="glass-card soft-shadow card-hover">
              <CardHeader className="text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 mx-auto btn-elegant rounded-full flex items-center justify-center mb-4 animate-gentle-float">
                  <School className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="font-cairo text-lg text-gradient">
                  {userProfile?.full_name || 'مدير المدرسة'}
                </CardTitle>
                <CardDescription>
                  <span className="px-3 py-1 rounded-full text-xs btn-elegant text-white font-medium">
                    🎖️ مدير مدرسة
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">📧 البريد الإلكتروني</p>
                  <p className="font-medium text-xs glass-card rounded-lg p-2 break-all">{userProfile?.email}</p>
                </div>
                
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">🏫 المؤسسة التعليمية</p>
                  <p className="font-medium text-sm text-gradient">
                    🌟 مدرسة نشطة ومتصلة
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2 mt-6">
                  <Button size="sm" className="btn-elegant" onClick={() => navigate('/system-settings')}>
                    <Settings className="h-4 w-4 ml-1" />
                    إعدادات المدرسة
                  </Button>
                  <Button size="sm" variant="outline" className="card-hover" onClick={() => setShowTeacherManagement(true)}>
                    <Users className="h-4 w-4 ml-1" />
                    إدارة المعلمين
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Package Information */}
          {schoolPackage && <div className="lg:col-span-2">
              <Card className="glass-card soft-shadow border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-reverse space-x-3">
                      <Package className="w-6 h-6 text-primary" />
                      <div>
                        <CardTitle className="text-lg">باقة الاشتراك الحالية</CardTitle>
                        <CardDescription>تفاصيل الخطة والاستخدام</CardDescription>
                      </div>
                    </div>
                    
                    <Badge variant={schoolPackage.status === 'active' ? 'default' : 'secondary'} className={schoolPackage.status === 'active' ? 'gradient-electric text-white' : ''}>
                      {schoolPackage.status === 'active' ? 'نشطة' : 'غير نشطة'}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-semibold text-lg text-primary">{schoolPackage.name_ar}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{schoolPackage.description_ar}</p>
                    </div>
                    
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-center space-x-reverse space-x-2">
                        <CreditCard className="w-5 h-5 text-secondary" />
                        <span className="font-semibold text-lg">{schoolPackage.price} {schoolPackage.currency === 'ILS' ? '₪' : schoolPackage.currency}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 text-center">السعر السنوي</p>
                    </div>
                    
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-center space-x-reverse space-x-2">
                        <Clock className="w-5 h-5 text-orange-500" />
                        <span className="font-semibold text-lg">{getDaysRemainingDisplay()}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 text-center">
                        {getDaysRemainingDisplay() === "غير محدود" ? "مدة الاشتراك" : "يوم متبقي"}
                      </p>
                    </div>
                  </div>

                  {/* Usage Statistics */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-base">إحصائيات الاستخدام</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Students Usage */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>الطلاب</span>
                          <span>{stats.totalStudents} / {schoolPackage.max_students || '∞'}</span>
                        </div>
                        <Progress value={getUsagePercentage(stats.totalStudents, schoolPackage.max_students)} className="h-2" />
                      </div>
                      
                      {/* Teachers Usage */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>المعلمين</span>
                          <span>{stats.totalTeachers} / {schoolPackage.max_teachers || '∞'}</span>
                        </div>
                        <Progress value={getUsagePercentage(stats.totalTeachers, schoolPackage.max_teachers)} className="h-2" />
                      </div>
                    </div>
                  </div>

                  {/* Package Features */}
                  {schoolPackage.features && schoolPackage.features.length > 0 && <div className="space-y-3">
                      <h4 className="font-semibold text-base">مميزات الباقة</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {schoolPackage.features.map((feature, index) => <div key={index} className="flex items-center space-x-reverse space-x-2">
                            <div className="w-2 h-2 rounded-full gradient-primary"></div>
                            <span className="text-sm">{feature}</span>
                          </div>)}
                      </div>
                    </div>}

                  {/* Subscription Period */}
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 inline ml-1" />
                      بداية الاشتراك: {format(new Date(schoolPackage.start_date), 'dd.M.yyyy')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      انتهاء الاشتراك: {getSubscriptionEndDisplay()}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Recent Activities Card */}
              <Card className="glass-card soft-shadow mt-6">
                <CardHeader>
                  <div className="flex items-center mb-2">
                    <h3 className="text-xl font-bold font-cairo text-foreground">🔥 النشاطات الحديثة</h3>
                    <div className="accent-dot mr-3 animate-gentle-float"></div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[{
                  title: 'تم إضافة طالب جديد',
                  time: 'منذ دقيقتين',
                  icon: Users,
                  color: 'green-neon'
                }, {
                  title: 'تحديث في منهج الشبكات',
                  time: 'منذ 5 دقائق',
                  icon: BookOpen,
                  color: 'blue-electric'
                }, {
                  title: 'تم إنشاء فصل جديد',
                  time: 'منذ 10 دقائق',
                  icon: School,
                  color: 'orange-fire'
                }, {
                  title: 'تحديث الإعدادات',
                  time: 'منذ 15 دقيقة',
                  icon: Settings,
                  color: 'purple-mystic'
                }].map((activity, index) => <div key={index} className="flex items-center space-x-reverse space-x-3 p-4 glass-card card-hover group">
                      <div className="w-3 h-3 rounded-full bg-primary animate-gentle-float"></div>
                      <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <activity.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{activity.title}</p>
                        <p className="text-sm text-muted-foreground flex items-center mt-1">
                          <Clock className="h-3 w-3 ml-1" />
                          {activity.time}
                        </p>
                      </div>
                    </div>)}
                </CardContent>
              </Card>
            </div>}
        </div>
      </div>
    </div>;
};
export default SchoolAdminDashboard;