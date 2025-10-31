/**
 * صفحة التقارير - تصميم مينيماليست حديث مع رسوم بيانية فعلية
 */

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTeacherPresence } from '@/hooks/useTeacherPresence';
import { useStudentPresenceForReports } from '@/hooks/useStudentPresenceForReports';
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
  const { students: allStudentsData, loading: studentLoading } = useStudentPresenceForReports();
  
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
  const [usersDistribution, setUsersDistribution] = useState([
    { name: 'آخر أسبوع', value: 0, color: '#10B981', percentage: 0 },
    { name: 'آخر 30 يوم', value: 0, color: '#3B82F6', percentage: 0 },
    { name: 'أكثر من 30 يوم', value: 0, color: '#F59E0B', percentage: 0 },
    { name: 'لم يسجلوا أبداً', value: 0, color: '#EF4444', percentage: 0 }
  ]);

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

  // جلب بيانات النشاط الأسبوعي الفعلية من profiles
  useEffect(() => {
    const fetchWeeklyActivity = async () => {
      try {
        // جلب جميع المعلمين والمدراء من profiles (مصدر البيانات الصحيح)
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, role, last_login_at, full_name')
          .in('role', ['teacher', 'school_admin'])
          .not('last_login_at', 'is', null);

        if (profilesError) {
          console.error('خطأ في جلب بيانات profiles:', profilesError);
          return;
        }

        console.log('📦 Fetched profiles data:', {
          teachers: profilesData?.filter(p => p.role === 'teacher').length || 0,
          admins: profilesData?.filter(p => p.role === 'school_admin').length || 0
        });

        // أسماء أيام الأسبوع بالعربية (الأحد = 0)
        const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        
        // بناء بيانات آخر 7 أيام
        const weekData = [];
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setUTCDate(date.getUTCDate() - i);
          
          const dayStart = new Date(Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
            0, 0, 0, 0
          ));
          
          const nextDayStart = new Date(Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate() + 1,
            0, 0, 0, 0
          ));

          const dayName = dayNames[date.getUTCDay()];
          
          console.log(`\n📅 Processing ${dayName}:`, {
            start: dayStart.toISOString(),
            end: nextDayStart.toISOString()
          });

          // فلترة الطلاب لهذا اليوم
          const studentsInDay = allStudentsData.filter((s: any) => {
            const lastSeen = new Date(s.last_seen_at);
            const inRange = lastSeen >= dayStart && lastSeen < nextDayStart;
            return inRange;
          });
          
          const dayStudents = new Set(studentsInDay.map((s: any) => s.student_id));
          
          console.log(`  👨‍🎓 Students: ${dayStudents.size} unique (${studentsInDay.length} records)`);

          // فلترة المعلمين لهذا اليوم من profiles
          const teachersInDay = (profilesData || []).filter((p: any) => {
            if (!p.last_login_at || p.role !== 'teacher') return false;
            const lastLogin = new Date(p.last_login_at);
            const inRange = lastLogin >= dayStart && lastLogin < nextDayStart;
            return inRange;
          });
          
          const dayTeachers = new Set(teachersInDay.map((t: any) => t.user_id));
          
          console.log(`  👨‍🏫 Teachers: ${dayTeachers.size} unique (${teachersInDay.length} records)`);
          if (teachersInDay.length > 0) {
            console.log('    Names:', teachersInDay.slice(0, 5).map((t: any) => t.full_name));
          }

          // فلترة المدراء لهذا اليوم من profiles
          const adminsInDay = (profilesData || []).filter((p: any) => {
            if (!p.last_login_at || p.role !== 'school_admin') return false;
            const lastLogin = new Date(p.last_login_at);
            const inRange = lastLogin >= dayStart && lastLogin < nextDayStart;
            return inRange;
          });
          
          const dayAdmins = new Set(adminsInDay.map((t: any) => t.user_id));
          
          console.log(`  👔 Admins: ${dayAdmins.size} unique (${adminsInDay.length} records)`);
          if (adminsInDay.length > 0) {
            console.log('    Names:', adminsInDay.slice(0, 5).map((t: any) => t.full_name));
          }

          weekData.push({
            day: dayName,
            students: dayStudents.size,
            teachers: dayTeachers.size,
            admins: dayAdmins.size,
            total: dayStudents.size + dayTeachers.size + dayAdmins.size
          });
        }

        setWeeklyData(weekData);
        console.log('\n✅ Final weekly activity data:', weekData);
      } catch (error) {
        console.error('خطأ في جلب بيانات النشاط الأسبوعي:', error);
      }
    };

    // انتظر حتى يتم تحميل البيانات من hooks
    if (!studentLoading) {
      fetchWeeklyActivity();
    }
  }, [allStudentsData, studentLoading]);

  // جلب توزيع المستخدمين حسب آخر تسجيل دخول
  useEffect(() => {
    const fetchUsersDistribution = async () => {
      try {
        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // جلب جميع الطلاب
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('student_id, created_at');

        if (studentsError) {
          console.error('Error fetching students:', studentsError);
          return;
        }

        // جلب بيانات حضور الطلاب
        const { data: presenceData, error: presenceError } = await supabase
          .from('student_presence')
          .select('student_id, last_seen_at');

        if (presenceError) {
          console.error('Error fetching student presence:', presenceError);
        }

        // جلب جميع المعلمين والمدراء
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, role, last_login_at, created_at')
          .in('role', ['teacher', 'school_admin']);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          return;
        }

        let last7Days = 0;
        let last30Days = 0;
        let moreThan30 = 0;
        let never = 0;

        // معالجة الطلاب
        const studentPresenceMap = new Map();
        presenceData?.forEach((p: any) => {
          const existing = studentPresenceMap.get(p.student_id);
          if (!existing || new Date(p.last_seen_at) > new Date(existing.last_seen_at)) {
            studentPresenceMap.set(p.student_id, p);
          }
        });

        studentsData?.forEach((student: any) => {
          const presence = studentPresenceMap.get(student.student_id);
          
          if (!presence || !presence.last_seen_at) {
            never++;
          } else {
            const lastSeen = new Date(presence.last_seen_at);
            if (lastSeen >= sevenDaysAgo) {
              last7Days++;
            } else if (lastSeen >= thirtyDaysAgo) {
              last30Days++;
            } else {
              moreThan30++;
            }
          }
        });

        // معالجة المعلمين والمدراء
        profilesData?.forEach((profile: any) => {
          if (!profile.last_login_at) {
            never++;
          } else {
            const lastLogin = new Date(profile.last_login_at);
            if (lastLogin >= sevenDaysAgo) {
              last7Days++;
            } else if (lastLogin >= thirtyDaysAgo) {
              last30Days++;
            } else {
              moreThan30++;
            }
          }
        });

        const total = last7Days + last30Days + moreThan30 + never;

        setUsersDistribution([
          { 
            name: 'آخر أسبوع', 
            value: last7Days, 
            color: '#10B981',
            percentage: total > 0 ? Math.round((last7Days / total) * 100) : 0
          },
          { 
            name: 'آخر 30 يوم', 
            value: last30Days, 
            color: '#3B82F6',
            percentage: total > 0 ? Math.round((last30Days / total) * 100) : 0
          },
          { 
            name: 'أكثر من 30 يوم', 
            value: moreThan30, 
            color: '#F59E0B',
            percentage: total > 0 ? Math.round((moreThan30 / total) * 100) : 0
          },
          { 
            name: 'لم يسجلوا أبداً', 
            value: never, 
            color: '#EF4444',
            percentage: total > 0 ? Math.round((never / total) * 100) : 0
          }
        ]);

        console.log('✅ Users distribution:', { last7Days, last30Days, moreThan30, never, total });
      } catch (error) {
        console.error('خطأ في جلب توزيع المستخدمين:', error);
      }
    };

    fetchUsersDistribution();
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

          {/* Users Distribution by Activity */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                توزيع المستخدمين حسب النشاط
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={usersDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {usersDistribution.map((entry, index) => (
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
                    formatter={(value: any, name: any, props: any) => [
                      `${value} مستخدم (${props.payload.percentage}%)`,
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {usersDistribution.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm text-gray-600">{item.name}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {item.value} ({item.percentage}%)
                    </span>
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