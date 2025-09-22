/**
 * Main Dashboard Component
 * 
 * The central hub of the educational platform that displays role-based content.
 * Handles authentication redirection, statistics fetching, and renders different
 * dashboard views based on user roles (superadmin, school_admin, teacher).
 * 
 * Features:
 * - Role-based dashboard rendering (SuperAdmin, SchoolAdmin, Teacher)
 * - Real-time statistics from Supabase database
 * - Customizable header with settings persistence
 * - Quick action navigation
 * - Upcoming events display from localStorage
 * - Animated statistics cards with gradients
 * - Plugin statistics with navigation controls
 * 
 * @author Educational Platform Team
 * @version 1.0.0
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardStats, CalendarEvent } from '@/types/common';
import { logError, logInfo } from '@/lib/logger';
import SchoolAdminDashboard from '@/components/SchoolAdminDashboard';
import TeacherDashboard from '@/components/TeacherDashboard';
import StudentDashboard from '@/components/student/StudentDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Users,
  BarChart3, 
  Shield, 
  Settings, 
  Bell,
  Calendar,
  FileText,
  Video,
  Award,
  Target,
  TrendingUp,
  Activity,
  Clock,
  Star,
  Zap,
  Globe,
  Sparkles,
  Rocket,
  Package,
  UserCog,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import AppFooter from '@/components/shared/AppFooter';
import { PageLoading } from '@/components/ui/LoadingComponents';
import { AdminAccessBanner } from '@/components/admin/AdminAccessBanner';

/**
 * Dashboard Component Implementation
 * 
 * Main functional component that manages dashboard state and renders
 * appropriate views based on user authentication and role permissions.
 */
const Dashboard = () => {
  // Authentication hooks and navigation
  const { user, userProfile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  
  // Dashboard statistics state - tracks system-wide metrics for superadmin view
  const [stats, setStats] = useState<DashboardStats>({
    totalSchools: 0,
    totalAdmins: 0,
    totalStudents: 0,
    activeAdmins: 0,
    activePackages: 0,
    totalPackages: 0,
    enabledPlugins: 0,
    disabledPlugins: 0,
    totalPlugins: 0
  });
  
  // Calendar events state - displays upcoming events from localStorage
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);

  // Dashboard header customization settings
  // These settings are persisted in localStorage and allow customization of:
  // - Logo display and size
  // - Title text, color, and size
  // - Background colors and opacity
  // - Glass effect with blur intensity
  const [dashboardHeaderSettings, setDashboardHeaderSettings] = useState({
    logo_url: '/lovable-uploads/f942a38c-ddca-45fc-82fc-239e22268abe.png',
    logo_size: 'medium' as 'small' | 'medium' | 'large',
    title_text: 'لوحة التحكم',
    title_color: '#2563eb',
    title_size: '2xl' as 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl',
    show_logo: true,
    show_title: true,
    background_color: '#ffffff',
    text_color: '#1f2937',
    background_opacity: 0.95,
    blur_intensity: 10,
    enable_glass_effect: true
  });

  const [pluginStatsIndex, setPluginStatsIndex] = useState(0);

  useEffect(() => {
    // جلب إعدادات هيدر الصفحة الرئيسية
    const dashboardHeaderData = localStorage.getItem('dashboard_header_settings');
    if (dashboardHeaderData) {
      setDashboardHeaderSettings(JSON.parse(dashboardHeaderData));
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to appropriate auth page based on current path
      if (window.location.pathname.includes('super-admin')) {
        navigate('/super-admin-auth');
      } else {
        navigate('/auth');
      }
    }
  }, [user, loading, navigate]);

  // Fetch real statistics
  useEffect(() => {
    const fetchStats = async () => {
      if (!user || userProfile?.role !== 'superadmin') return;

      try {
        // Get total schools count
        const { count: schoolsCount } = await supabase
          .from('schools')
          .select('*', { count: 'exact', head: true });

        // Get total school admins count
        const { count: adminsCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'school_admin');

        // Get active packages count
        const { count: activePackagesCount } = await supabase
          .from('school_packages')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        // Get total packages count
        const { count: totalPackagesCount } = await supabase
          .from('school_packages')
          .select('*', { count: 'exact', head: true });

        // Get all available plugins count
        const { count: allPluginsCount } = await supabase
          .from('plugins')
          .select('*', { count: 'exact', head: true });

        // Get enabled plugins count (across all schools)
        const { count: enabledPluginsCount } = await supabase
          .from('school_plugins')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'enabled');

        // Get disabled plugins count (across all schools)
        const { count: disabledPluginsCount } = await supabase
          .from('school_plugins')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'disabled');

        // Get total school plugins instances (enabled + disabled)
        const { count: totalSchoolPluginsCount } = await supabase
          .from('school_plugins')
          .select('*', { count: 'exact', head: true });

        // Get total students count from all schools
        const { count: totalStudentsCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true });

        // Get active admins (assuming all admins are active for now)
        const activeAdmins = adminsCount || 0;

        setStats({
          totalSchools: schoolsCount || 0,
          totalAdmins: adminsCount || 0,
          totalStudents: totalStudentsCount || 0,
          activeAdmins,
          activePackages: activePackagesCount || 0,
          totalPackages: totalPackagesCount || 0,
          enabledPlugins: enabledPluginsCount || 0,
          disabledPlugins: disabledPluginsCount || 0,
          totalPlugins: allPluginsCount || 0
        });
      } catch (error) {
        logError('Error fetching dashboard stats', error as Error);
      }
    };

    fetchStats();
    fetchUpcomingEvents();
  }, [user, userProfile]);

  // جلب أحداث التقويم القادمة
  const fetchUpcomingEvents = async () => {
    try {
      const localEvents = localStorage.getItem('calendar_events');
      const events = localEvents ? JSON.parse(localEvents) : [];
      
      // فلترة الأحداث القادمة وترتيبها حسب التاريخ
      const today = new Date();
      const upcomingEvents = events
        .filter((event: CalendarEvent) => new Date(event.date) >= today && event.is_active)
        .sort((a: CalendarEvent, b: CalendarEvent) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3); // أقرب 3 أحداث
      
      setUpcomingEvents(upcomingEvents);
    } catch (error) {
      logError('Error fetching upcoming events', error as Error);
      setUpcomingEvents([]);
    }
  };

  if (loading) {
    return <PageLoading message="Loading..." />;
  }

  if (!user) return null;

  const dashboardStats = [
    {
      title: 'إجمالي المدارس',
      value: stats.totalSchools.toString(),
      change: stats.totalSchools > 0 ? `+${stats.totalSchools}` : '0',
      icon: Shield,
      gradient: 'gradient-electric',
      shadow: 'shadow-electric',
      color: 'text-white',
      animation: 'animate-bounce-slow'
    },
    {
      title: 'الطلاب المسجّلين',
      value: stats.totalStudents.toString(),
      change: stats.totalStudents > 0 ? `+${stats.totalStudents}` : '0',
      icon: Users,
      gradient: 'gradient-fire',
      shadow: 'shadow-fire',
      color: 'text-white',
      animation: 'animate-float'
    },
    {
      title: 'إجمالي مدراء المدارس',
      value: stats.totalAdmins.toString(),
      change: stats.totalAdmins > 0 ? `+${stats.totalAdmins}` : '0',
      icon: UserCog,
      gradient: 'gradient-sunset',
      shadow: 'shadow-purple',
      color: 'text-white',
      animation: 'animate-wiggle'
    },
    {
      title: 'المدراء النشطين',
      value: stats.activeAdmins.toString(),
      change: stats.activeAdmins > 0 ? `${Math.round((stats.activeAdmins / stats.totalAdmins) * 100) || 0}%` : '0%',
      icon: Award,
      gradient: 'gradient-neon',
      shadow: 'shadow-neon',
      color: 'text-white',
      animation: 'animate-glow'
    }
  ];

  // Plugin statistics with navigation - based on accurate database data
  const pluginStatsData = [
    {
      role: 'الإضافات المفعلة',
      count: stats.enabledPlugins.toString(),
      percentage: stats.totalPlugins > 0 ? `${Math.round((stats.enabledPlugins / stats.totalPlugins) * 100)}%` : '0%',
      icon: Settings,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      active: stats.enabledPlugins.toString(),
      inactive: (stats.totalPlugins - stats.enabledPlugins).toString(),
      description: 'الإضافات المفعلة حالياً في النظام'
    },
    {
      role: 'الإضافات المعطلة',
      count: stats.disabledPlugins.toString(),
      percentage: stats.totalPlugins > 0 ? `${Math.round((stats.disabledPlugins / stats.totalPlugins) * 100)}%` : '0%',
      icon: Settings,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      active: stats.disabledPlugins.toString(),
      inactive: (stats.totalPlugins - stats.disabledPlugins).toString(),
      description: 'الإضافات المعطلة في النظام'
    },
    {
      role: 'إجمالي الإضافات المتاحة',
      count: stats.totalPlugins.toString(),
      percentage: '100%',
      icon: Settings,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      active: stats.enabledPlugins.toString(),
      inactive: stats.disabledPlugins.toString(),
      description: 'جميع الإضافات المتاحة في النظام'
    },
    {
      role: 'الإضافات غير المستخدمة',
      count: (stats.totalPlugins - stats.enabledPlugins - stats.disabledPlugins).toString(),
      percentage: stats.totalPlugins > 0 ? `${Math.round(((stats.totalPlugins - stats.enabledPlugins - stats.disabledPlugins) / stats.totalPlugins) * 100)}%` : '0%',
      icon: Settings,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      active: '0',
      inactive: (stats.totalPlugins - stats.enabledPlugins - stats.disabledPlugins).toString(),
      description: 'الإضافات غير المعينة لأي مدرسة'
    }
  ];

  const currentPluginStats = pluginStatsData[pluginStatsIndex];

  const handlePreviousPlugin = () => {
    setPluginStatsIndex((prev) => prev === 0 ? pluginStatsData.length - 1 : prev - 1);
  };

  const handleNextPlugin = () => {
    setPluginStatsIndex((prev) => prev === pluginStatsData.length - 1 ? 0 : prev + 1);
  };

  // إحصائيات النظام المفصلة
  const userRoleStats = [
    {
      role: 'المدارس المسجلة',
      count: stats.totalSchools.toString(),
      percentage: '100%',
      icon: Shield,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      active: stats.totalSchools.toString(),
      inactive: '0'
    },
    {
      role: 'مدراء المدارس',
      count: stats.totalAdmins.toString(),
      percentage: stats.totalSchools > 0 ? `${Math.round((stats.totalAdmins / stats.totalSchools) * 100)}%` : '0%',
      icon: UserCog,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      active: stats.activeAdmins.toString(),
      inactive: (stats.totalAdmins - stats.activeAdmins).toString()
    },
    {
      role: 'الباقات النشطة',
      count: stats.activePackages.toString(),
      percentage: stats.totalPackages > 0 ? `${Math.round((stats.activePackages / stats.totalPackages) * 100)}%` : '0%',
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      active: stats.activePackages.toString(),
      inactive: (stats.totalPackages - stats.activePackages).toString()
    },
    // Plugin stats with navigation
    {
      ...currentPluginStats,
      role: currentPluginStats.role,
      count: currentPluginStats.count,
      percentage: currentPluginStats.percentage,
      icon: currentPluginStats.icon,
      color: currentPluginStats.color,
      bgColor: currentPluginStats.bgColor,
      active: currentPluginStats.active,
      inactive: currentPluginStats.inactive,
      hasNavigation: true
    }
  ];

  const quickActions = [
    { name: 'إدارة المستخدمين', icon: Users, path: '/users' },
    { name: 'التقارير', icon: BarChart3, path: '/reports' },
    { name: 'إعدادات النظام', icon: Settings, path: '/system-settings' },
    { name: 'الإشعارات', icon: Bell, path: '/notifications' },
    ...(userProfile?.role === 'superadmin' ? [
      { name: 'إدارة مضامين الصفوف', icon: BookOpen, path: '/content-management' }
    ] : [
      { name: 'المضامين التعليمية', icon: BookOpen, path: '/educational-content' }
    ]),
    ...(userProfile?.role === 'superadmin' ? [
      { name: 'إدارة المدارس', icon: Shield, path: '/school-management' },
      { name: 'إدارة مدراء المدارس', icon: UserCog, path: '/school-admin-management' },
      { name: 'إدارة بيانات الألعاب', icon: Activity, path: '/game-data-management' }
    ] : []),
    ...(userProfile?.role === 'superadmin' || userProfile?.role === 'school_admin' ? [
      { name: 'إدارة الإضافات', icon: Settings, path: '/plugin-management' }
    ] : []),
    ...(userProfile?.role === 'superadmin' ? [
      { name: 'إدارة الباقات', icon: Package, path: '/package-management' },
      { name: 'إدارة السنوات الدراسية', icon: Calendar, path: '/academic-years' },
      { name: 'إدارة التقويم والمناسبات', icon: CalendarIcon, path: '/calendar-management' }
    ] : [])
  ];

  const recentActivities = [
    { title: 'تم إضافة طالب جديد', time: 'منذ دقيقتين', color: 'green-neon', icon: Users },
    { title: 'اكتمال امتحان الشبكات', time: 'منذ 5 دقائق', color: 'blue-electric', icon: Award },
    { title: 'تحديث المنهج', time: 'منذ 10 دقائق', color: 'orange-fire', icon: BookOpen },
    { title: 'رسالة من ولي أمر', time: 'منذ 15 دقيقة', color: 'purple-mystic', icon: Bell }
  ];

  const performanceCards = [
    { title: 'مشاهدات الفيديو', value: '15.2K', icon: Video, color: 'blue-electric' },
    { title: 'المشاريع المكتملة', value: '847', icon: Rocket, color: 'orange-fire' },
    { title: 'التفاعل اليومي', value: '92%', icon: Zap, color: 'green-neon' },
    { title: 'معدل الرضا', value: '4.8', icon: Star, color: 'purple-mystic' }
  ];

  // Helper functions for header styling
  const getLogoSize = () => {
    switch (dashboardHeaderSettings.logo_size) {
      case 'small': return 'h-8 w-auto';
      case 'medium': return 'h-12 w-auto';
      case 'large': return 'h-16 w-auto';
      default: return 'h-12 w-auto';
    }
  };

  const getTitleSize = () => {
    return `text-${dashboardHeaderSettings.title_size}`;
  };

  return (
    <div className="min-h-screen bg-background pattern-dots flex flex-col" dir="rtl">
      {/* Admin Access Banner */}
      <AdminAccessBanner />
      
      {/* Modern Header مع الإعدادات المخصصة والتأثيرات */}
      <header 
        className={`glass-card sticky top-0 z-50 soft-shadow ${
          dashboardHeaderSettings.enable_glass_effect ? 'backdrop-blur supports-[backdrop-filter]:bg-background/60' : ''
        }`}
        style={{ 
          backgroundColor: dashboardHeaderSettings.enable_glass_effect 
            ? `${dashboardHeaderSettings.background_color}${Math.round(dashboardHeaderSettings.background_opacity * 255).toString(16).padStart(2, '0')}`
            : dashboardHeaderSettings.background_color,
          backdropFilter: dashboardHeaderSettings.enable_glass_effect ? `blur(${dashboardHeaderSettings.blur_intensity}px)` : 'none'
        }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="animate-fade-in-up">
              <h1 
                className={`font-bold font-cairo ${getTitleSize()} flex items-center gap-3`}
                style={{ color: dashboardHeaderSettings.title_color }}
              >
                {dashboardHeaderSettings.show_logo && (
                  <img 
                    src={dashboardHeaderSettings.logo_url} 
                    alt="شعار النظام" 
                    className={getLogoSize()}
                  />
                )}
                {dashboardHeaderSettings.show_title && dashboardHeaderSettings.title_text}
              </h1>
              <p 
                className="text-base mt-3 flex items-center"
                style={{ color: dashboardHeaderSettings.text_color }}
              >
                <div className="accent-dot ml-2"></div>
                أهلاً وسهلاً{' '}
                <span className="font-semibold mr-2" style={{ color: dashboardHeaderSettings.title_color }}>
                  {userProfile?.full_name || user.email}
                </span>
                <span className="mr-2 px-3 py-1 rounded-full text-xs btn-elegant text-white">
                  {userProfile?.role || 'user'}
                </span>
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="card-hover">
                <Bell className="h-4 w-4 ml-1 icon-glow" />
                الإشعارات
              </Button>
              <Button onClick={signOut} variant="outline" size="sm" className="card-hover">
                <Shield className="h-4 w-4 ml-1" />
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>
      </header>

        {userProfile?.role === 'teacher' ? (
          <TeacherDashboard />
        ) : userProfile?.role === 'superadmin' ? (
          <div className="container mx-auto px-6 py-6 space-y-8">
            {/* Stats Grid */}
            <section className="animate-fade-in-up">
              <div className="flex items-center mb-6">
                <h2 className="text-2xl font-bold font-cairo text-foreground">📊 الإحصائيات</h2>
                <div className="accent-dot mr-3 animate-gentle-float"></div>
              </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboardStats.map((stat, index) => (
              <Card key={stat.title} className="glass-card card-hover animate-scale-hover" style={{animationDelay: `${index * 100}ms`}}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <stat.icon className="h-8 w-8 text-primary icon-glow icon-bounce" />
                    <span className="text-sm text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-full soft-shadow">
                      {stat.change}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gradient mb-2">{stat.value}</div>
                  <p className="text-muted-foreground text-sm">{stat.title}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="animate-fade-in-up" style={{animationDelay: '200ms'}}>
          <div className="flex items-center mb-6">
            <h2 className="text-2xl font-bold font-cairo text-foreground">⚡ الإجراءات السريعة</h2>
            <div className="accent-dot mr-3"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((action, index) => (
              <Card 
                key={action.name} 
                className="glass-card card-hover animate-scale-hover cursor-pointer group" 
                style={{animationDelay: `${index * 50}ms`}}
                onClick={() => action.path && navigate(action.path)}
              >
                <CardContent className="p-4 text-center flex flex-col items-center justify-center">
                  <action.icon className="h-8 w-8 text-primary mx-auto mb-3 icon-glow group-hover:animate-gentle-float transition-all" />
                  <p className="text-foreground font-medium text-sm">{action.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up" style={{animationDelay: '400ms'}}>
          {/* Recent Activities */}
          <div className="lg:col-span-2">
            <Card className="glass-card soft-shadow">
              <CardHeader>
                <CardTitle className="text-xl font-cairo flex items-center">
                  <Activity className="h-6 w-6 ml-3 text-primary icon-glow" />
                  🔥 النشاطات الحديثة
                  <div className="accent-dot mr-auto"></div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-reverse space-x-3 p-4 glass-card card-hover group">
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
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Profile Card */}
          <div>
            <Card className="glass-card soft-shadow card-hover">
              <CardHeader className="text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 mx-auto btn-elegant rounded-full flex items-center justify-center mb-4 animate-gentle-float">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="font-cairo text-lg text-gradient">
                  {userProfile?.full_name || 'المستخدم المميز'}
                </CardTitle>
                <CardDescription>
                  <span className="px-3 py-1 rounded-full text-xs btn-elegant text-white font-medium">
                    🎖️ {userProfile?.role || 'user'}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">📧 البريد الإلكتروني</p>
                  <p className="font-medium text-xs glass-card rounded-lg p-2 break-all">{user.email}</p>
                </div>
                
                {userProfile?.school_id && (
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">🏫 المؤسسة التعليمية</p>
                    <p className="font-medium text-sm text-gradient">
                      🌟 مدرسة متصلة ونشطة
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 mt-6">
                  <Button size="sm" className="btn-elegant">
                    <Settings className="h-4 w-4 ml-1" />
                    الملف الشخصي
                  </Button>
                  <Button size="sm" variant="outline" className="card-hover">
                    <Globe className="h-4 w-4 ml-1" />
                    المساعدة
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* User Management Section */}
        <section className="animate-fade-in-up" style={{animationDelay: '500ms'}}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <h2 className="text-2xl font-bold font-cairo text-foreground">👥 إدارة المستخدمين</h2>
              <div className="accent-dot mr-3 animate-gentle-float"></div>
            </div>
            <Button 
              onClick={() => navigate('/users')}
              className="btn-elegant"
            >
              <Users className="h-4 w-4 ml-1" />
              عرض جميع المستخدمين
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {userRoleStats.map((rolestat, index) => (
              <Card key={`${rolestat.role}-${index}`} className="glass-card soft-shadow card-hover animate-scale-hover group relative" style={{animationDelay: `${index * 75}ms`}}>
                {(rolestat as any).hasNavigation && (
                  <>
                    <button
                      onClick={handlePreviousPlugin}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors z-10"
                    >
                      <ChevronLeft className="h-4 w-4 text-primary" />
                    </button>
                    <button
                      onClick={handleNextPlugin}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors z-10"
                    >
                      <ChevronRight className="h-4 w-4 text-primary" />
                    </button>
                  </>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${rolestat.bgColor} group-hover:scale-110 transition-transform`}>
                      <rolestat.icon className={`h-6 w-6 ${rolestat.color}`} />
                    </div>
                    <span className={`text-sm font-bold ${rolestat.color} bg-white px-2 py-1 rounded-full soft-shadow`}>
                      {rolestat.percentage}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gradient mb-1">{rolestat.count}</div>
                  <p className="text-muted-foreground text-sm mb-3">{rolestat.role}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-green-600 flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full ml-1"></div>
                        نشط: {rolestat.active}
                      </span>
                      <span className="text-gray-500 flex items-center">
                        <div className="w-2 h-2 bg-gray-400 rounded-full ml-1"></div>
                        غير نشط: {rolestat.inactive}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300" 
                        style={{width: `${(parseInt(rolestat.active) / parseInt(rolestat.count || '1')) * 100}%`}}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

        </section>

        {/* Calendar Events Section */}
        <section className="animate-fade-in-up" style={{animationDelay: '600ms'}}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <h2 className="text-2xl font-bold font-cairo text-foreground">📅 التقويم والمناسبات</h2>
              <div className="accent-dot mr-3 animate-gentle-float"></div>
            </div>
            <Button 
              onClick={() => navigate('/calendar-management')}
              className="btn-elegant"
            >
              <CalendarIcon className="h-4 w-4 ml-1" />
              إدارة التقويم
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event: CalendarEvent, index) => (
                <Card 
                  key={event.id} 
                  className="glass-card soft-shadow card-hover animate-scale-hover group border-0" 
                  style={{
                    animationDelay: `${index * 75}ms`,
                    background: `linear-gradient(135deg, ${event.color}08, ${event.color}15, ${event.color}08)`,
                    borderLeft: `2px solid ${event.color}40`
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div 
                        className="p-2 rounded-lg group-hover:scale-110 transition-transform"
                        style={{ 
                          backgroundColor: `${event.color}15`,
                          border: `1px solid ${event.color}25`
                        }}
                      >
                        <CalendarIcon 
                          className="h-6 w-6" 
                          style={{ color: event.color }}
                        />
                      </div>
                      <div 
                        className="w-4 h-4 rounded-full shadow-sm"
                        style={{ 
                          backgroundColor: event.color,
                          boxShadow: `0 0 8px ${event.color}40`
                        }}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold text-foreground mb-1">{event.title}</div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {format(new Date(event.date), 'dd.M.yyyy')}
                    </p>
                    {event.description && (
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{event.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600">
                        {event.type === 'holiday' && '🏖️ عطلة'}
                        {event.type === 'exam' && '📝 امتحان'}
                        {event.type === 'meeting' && '👥 اجتماع'}
                        {event.type === 'event' && '🎉 فعالية'}
                        {event.type === 'important' && '⚠️ مهم'}
                      </span>
                      <span className="text-xs text-green-600 flex items-center">
                        <Clock className="h-3 w-3 ml-1" />
                        {Math.ceil((new Date(event.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} يوم
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="glass-card soft-shadow col-span-full">
                <CardContent className="p-8 text-center">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">لا توجد أحداث قادمة حالياً</p>
                  <Button 
                    onClick={() => navigate('/calendar-management')}
                    variant="outline"
                    className="card-hover"
                  >
                    <CalendarIcon className="h-4 w-4 ml-1" />
                    إضافة حدث جديد
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Performance Metrics */}
        <section className="animate-fade-in-up" style={{animationDelay: '700ms'}}>
          <div className="flex items-center mb-6">
            <h2 className="text-2xl font-bold font-cairo text-foreground">📈 مؤشرات الأداء</h2>
            <div className="accent-dot mr-3 animate-gentle-float"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {performanceCards.map((card, index) => (
              <Card key={card.title} className="glass-card soft-shadow card-hover animate-scale-hover group" style={{animationDelay: `${index * 75}ms`}}>
                <CardContent className="p-4 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <card.icon className="h-6 w-6 text-primary icon-glow group-hover:animate-gentle-float transition-all" />
                  </div>
                  <div className="text-2xl font-bold text-gradient mb-1">{card.value}</div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        
      </div>
        ) : userProfile?.role === 'school_admin' ? (
          <SchoolAdminDashboard />
        ) : userProfile?.role === 'student' ? (
          <StudentDashboard />
        ) : (
          <div className="container mx-auto px-6 py-6 text-center">
            <h2 className="text-2xl font-bold mb-4">مرحباً بك</h2>
            <p className="text-muted-foreground">
              يتم تحديد لوحة التحكم الخاصة بك حسب نوع الحساب
            </p>
          </div>
        )}
      
      <AppFooter />
    </div>
  );
};

export default Dashboard;