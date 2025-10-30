/**
 * صفحة التقارير - تصميم مينيماليست حديث مع رسوم بيانية فعلية
 */

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTeacherPresence } from '@/hooks/useTeacherPresence';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  BookOpen,
  Activity,
  Star,
  Calendar,
  Download,
  Filter,
  ArrowUp,
  ArrowDown,
  Minus,
  Shield,
  GraduationCap
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import BackButton from '@/components/shared/BackButton';
import AppFooter from '@/components/shared/AppFooter';
import { TeacherActivityDialog } from '@/components/reports/TeacherActivityDialog';
import { StudentActivityDialog } from '@/components/reports/StudentActivityDialog';

const Reports = () => {
  const { userProfile } = useAuth();
  const { teachers, loading: teacherLoading } = useTeacherPresence();
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalContent: 0,
    averageScore: 0,
    engagementRate: 0,
    weeklyGrowth: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [activeUsersStats, setActiveUsersStats] = useState({
    activeTeachers: 0,
    activeSchoolAdmins: 0
  });
  const [teacherDialogOpen, setTeacherDialogOpen] = useState(false);
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);

  // بيانات النشاط الأسبوعي الفعلية
  const [weeklyData, setWeeklyData] = useState([
    { day: 'السبت', students: 0, teachers: 0, admins: 0, total: 0 },
    { day: 'الأحد', students: 0, teachers: 0, admins: 0, total: 0 },
    { day: 'الاثنين', students: 0, teachers: 0, admins: 0, total: 0 },
    { day: 'الثلاثاء', students: 0, teachers: 0, admins: 0, total: 0 },
    { day: 'الأربعاء', students: 0, teachers: 0, admins: 0, total: 0 },
    { day: 'الخميس', students: 0, teachers: 0, admins: 0, total: 0 },
    { day: 'الجمعة', students: 0, teachers: 0, admins: 0, total: 0 }
  ]);

  const contentDistribution = [
    { name: 'الفيديوهات', value: 35, color: '#3B82F6' },
    { name: 'المستندات', value: 28, color: '#10B981' },
    { name: 'المشاريع', value: 20, color: '#F59E0B' },
    { name: 'الألعاب', value: 17, color: '#EF4444' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (userProfile?.role === 'superadmin') {
          const [usersResult, studentsResult, activeStudentsResult] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact' }),
            supabase.rpc('get_students_for_school_admin'),
            supabase.rpc('count_active_students_last_30_days')
          ]);

          const total = (usersResult.count || 0) + (studentsResult.data?.length || 0);
          const activeStudentsLast30Days = activeStudentsResult.data || 0;
          
          setStats({
            totalUsers: total,
            activeUsers: activeStudentsLast30Days,
            totalContent: 156,
            averageScore: 87.3,
            engagementRate: 92.1,
            weeklyGrowth: 12.5
          });
        } else {
          setStats({
            totalUsers: 45,
            activeUsers: 38,
            totalContent: 78,
            averageScore: 89.2,
            engagementRate: 88.7,
            weeklyGrowth: 8.3
          });
        }
      } catch (error) {
        console.error('خطأ في جلب البيانات:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userProfile]);

  // جلب المعلمين والمدراء النشطين بناءً على تسجيلات الدخول الفعلية
  useEffect(() => {
    const fetchActiveUsers = async () => {
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // جلب المعلمين النشطين
        const { data: teachers, error: teachersError } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('role', 'teacher')
          .gt('login_count', 0)
          .gte('last_login_at', thirtyDaysAgo.toISOString());
        
        if (teachersError) {
          console.error('🔴 Error fetching active teachers:', teachersError);
        } else {
          console.log('✅ Active teachers:', teachers);
        }
        
        // جلب المدراء النشطين
        const { data: admins, error: adminsError } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('role', 'school_admin')
          .gt('login_count', 0)
          .gte('last_login_at', thirtyDaysAgo.toISOString());
        
        if (adminsError) {
          console.error('🔴 Error fetching active admins:', adminsError);
        } else {
          console.log('✅ Active admins:', admins);
        }
        
        setActiveUsersStats({
          activeTeachers: teachers?.length || 0,
          activeSchoolAdmins: admins?.length || 0
        });
      } catch (error) {
        console.error('خطأ في جلب المستخدمين النشطين:', error);
      }
    };
    
    fetchActiveUsers();
  }, []);

  // جلب بيانات النشاط الأسبوعي الفعلية
  useEffect(() => {
    const fetchWeeklyActivity = async () => {
      try {
        const daysOfWeek = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
        const today = new Date();
        const weekData = [];

        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dayStart = new Date(date.setHours(0, 0, 0, 0));
          const dayEnd = new Date(date.setHours(23, 59, 59, 999));
          
          // جلب نشاط الطلاب
          const { data: students } = await supabase
            .from('student_presence')
            .select('student_id')
            .gte('last_seen_at', dayStart.toISOString())
            .lte('last_seen_at', dayEnd.toISOString());

          // جلب نشاط المعلمين
          const { data: teachersData } = await supabase
            .from('teacher_presence')
            .select('user_id, role')
            .eq('role', 'teacher')
            .gte('last_seen_at', dayStart.toISOString())
            .lte('last_seen_at', dayEnd.toISOString());

          // جلب نشاط المدراء
          const { data: adminsData } = await supabase
            .from('teacher_presence')
            .select('user_id, role')
            .eq('role', 'school_admin')
            .gte('last_seen_at', dayStart.toISOString())
            .lte('last_seen_at', dayEnd.toISOString());

          const studentsCount = new Set(students?.map(s => s.student_id) || []).size;
          const teachersCount = new Set(teachersData?.map(t => t.user_id) || []).size;
          const adminsCount = new Set(adminsData?.map(a => a.user_id) || []).size;

          weekData.push({
            day: daysOfWeek[date.getDay()],
            students: studentsCount,
            teachers: teachersCount,
            admins: adminsCount,
            total: studentsCount + teachersCount + adminsCount
          });
        }

        setWeeklyData(weekData);
        console.log('✅ Weekly activity data:', weekData);
      } catch (error) {
        console.error('خطأ في جلب بيانات النشاط الأسبوعي:', error);
      }
    };

    fetchWeeklyActivity();
  }, []);

  // مكون الإحصائية المبسطة
  const StatCard = ({ title, value, change, icon: Icon, trend = 'up', color = 'blue' }) => {
    const getTrendIcon = () => {
      if (trend === 'up') return <ArrowUp className="h-3 w-3 text-green-500" />;
      if (trend === 'down') return <ArrowDown className="h-3 w-3 text-red-500" />;
      return <Minus className="h-3 w-3 text-gray-500" />;
    };

    const getTrendColor = () => {
      if (trend === 'up') return 'text-green-600';
      if (trend === 'down') return 'text-red-600';
      return 'text-gray-600';
    };

    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      purple: 'bg-purple-50 text-purple-600',
      orange: 'bg-orange-50 text-orange-600',
    };

    return (
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className={`flex items-center gap-1 text-xs ${getTrendColor()}`}>
                {getTrendIcon()}
                <span>{change}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading || teacherLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border-0">
          <BackButton />
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">التقارير والإحصائيات</h1>
              <p className="text-gray-600 mt-1">نظرة شاملة على أداء المنصة</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                تصفية
              </Button>
              <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Download className="h-4 w-4" />
                تصدير
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <StatCard
            title="إجمالي المستخدمين"
            value={stats.totalUsers.toLocaleString()}
            change="+12%"
            icon={Users}
            trend="up"
            color="blue"
          />
          <div onClick={() => setStudentDialogOpen(true)} className="cursor-pointer">
            <StatCard
              title="الطلاب النشطين"
              value={stats.activeUsers.toLocaleString()}
              change="+8%"
              icon={GraduationCap}
              trend="up"
              color="blue"
            />
          </div>
          <div onClick={() => setTeacherDialogOpen(true)} className="cursor-pointer">
            <StatCard
              title="المعلمين النشطين"
              value={activeUsersStats.activeTeachers}
              change={activeUsersStats.activeTeachers > 0 ? '+5%' : '0%'}
              icon={Users}
              trend={activeUsersStats.activeTeachers > 0 ? 'up' : 'neutral'}
              color="green"
            />
          </div>
          <div onClick={() => setTeacherDialogOpen(true)} className="cursor-pointer">
            <StatCard
              title="المدراء النشطين"
              value={activeUsersStats.activeSchoolAdmins}
              change={activeUsersStats.activeSchoolAdmins > 0 ? '+2%' : '0%'}
              icon={Shield}
              trend={activeUsersStats.activeSchoolAdmins > 0 ? 'up' : 'neutral'}
              color="purple"
            />
          </div>
          <StatCard
            title="المحتوى التعليمي"
            value={stats.totalContent.toLocaleString()}
            change="+15%"
            icon={BookOpen}
            trend="up"
            color="orange"
          />
          <StatCard
            title="متوسط الدرجات"
            value={`${stats.averageScore}%`}
            change="+2%"
            icon={Star}
            trend="up"
            color="blue"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Weekly Activity Chart */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                النشاط الأسبوعي (طلاب، معلمين، مدراء)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="students" fill="#3b82f6" radius={[4, 4, 0, 0]} name="الطلاب" />
                  <Bar dataKey="teachers" fill="#10b981" radius={[4, 4, 0, 0]} name="المعلمين" />
                  <Bar dataKey="admins" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="المدراء" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Content Distribution */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                توزيع المحتوى
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={contentDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {contentDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {contentDistribution.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm text-gray-600">{item.name}</span>
                    <span className="text-sm font-medium text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Trends */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              اتجاهات الأداء
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="students" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  name="الطلاب"
                />
                <Line 
                  type="monotone" 
                  dataKey="teachers" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  name="المعلمين"
                />
                <Line 
                  type="monotone" 
                  dataKey="admins" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                  name="المدراء"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats.engagementRate}%
              </div>
              <div className="text-sm text-gray-600">معدل التفاعل اليومي</div>
              <Badge className="mt-2 bg-green-50 text-green-700 border-green-200">
                ممتاز
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                +{stats.weeklyGrowth}%
              </div>
              <div className="text-sm text-gray-600">النمو الأسبوعي</div>
              <Badge className="mt-2 bg-blue-50 text-blue-700 border-blue-200">
                متزايد
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                24/7
              </div>
              <div className="text-sm text-gray-600">النظام متاح</div>
              <Badge className="mt-2 bg-purple-50 text-purple-700 border-purple-200">
                مستقر
              </Badge>
            </CardContent>
          </Card>
        </div>

      </div>
      <AppFooter />
      
      <TeacherActivityDialog 
        open={teacherDialogOpen} 
        onOpenChange={setTeacherDialogOpen} 
      />
      <StudentActivityDialog 
        open={studentDialogOpen} 
        onOpenChange={setStudentDialogOpen} 
      />
    </div>
  );
};

export default Reports;