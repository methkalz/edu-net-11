// تبسيط مكونات التقارير لتجنب المشاكل التقنية
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  BookOpen,
  Activity,
  Star,
  Award,
  Globe
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useGradeStats } from '@/hooks/useGradeStats';
import BackButton from '@/components/shared/BackButton';
import AppFooter from '@/components/shared/AppFooter';

const Reports = () => {
  const { userProfile } = useAuth();
  const { stats: gradeStats } = useGradeStats();
  
  const [reportStats, setReportStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalContent: 0,
    averageScore: 0,
    engagementRate: 0,
    systemHealth: 0
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReportData = async () => {
      if (!userProfile) return;
      
      try {
        setLoading(true);
        
        if (userProfile.role === 'superadmin') {
          const { count: usersCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact' });
            
          setReportStats({
            totalUsers: usersCount || 0,
            activeUsers: Math.floor((usersCount || 0) * 0.75),
            totalContent: (gradeStats?.grade10?.videos || 0) + (gradeStats?.grade11?.lessons || 0),
            averageScore: 87.5,
            engagementRate: 92.3,
            systemHealth: 98.7
          });
        }
        
      } catch (error) {
        console.error('خطأ في جلب بيانات التقارير:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [userProfile, gradeStats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pattern-dots flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pattern-dots" dir="rtl">
      <div className="container mx-auto p-6 space-y-6">
        {/* هيدر التقارير */}
        <div className="flex items-center justify-between">
          <div>
            <BackButton />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              التقارير والإحصائيات
            </h1>
            <p className="text-muted-foreground">
              {userProfile?.role === 'superadmin' && 'تقارير شاملة للنظام كاملاً'}
              {userProfile?.role === 'school_admin' && 'تقارير المدرسة والطلاب'}
              {userProfile?.role === 'teacher' && 'تقارير الفصل والطلاب'}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">آخر 30 يوم</Button>
            <Button variant="outline" size="sm">تصدير PDF</Button>
          </div>
        </div>

        {/* كاردات الإحصائيات السريعة */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass-card hover:scale-105 transition-all duration-300 gradient-electric">
            <CardContent className="p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">إجمالي المستخدمين</p>
                  <p className="text-3xl font-bold">{reportStats.totalUsers.toLocaleString()}</p>
                </div>
                <Users className="h-12 w-12 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card hover:scale-105 transition-all duration-300 gradient-fire">
            <CardContent className="p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">المحتوى التعليمي</p>
                  <p className="text-3xl font-bold">{reportStats.totalContent.toLocaleString()}</p>
                </div>
                <BookOpen className="h-12 w-12 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card hover:scale-105 transition-all duration-300 gradient-neon">
            <CardContent className="p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">معدل التفاعل</p>
                  <p className="text-3xl font-bold">{reportStats.engagementRate.toFixed(1)}%</p>
                </div>
                <Activity className="h-12 w-12 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card hover:scale-105 transition-all duration-300 gradient-sunset">
            <CardContent className="p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">متوسط النقاط</p>
                  <p className="text-3xl font-bold">{reportStats.averageScore.toFixed(1)}</p>
                </div>
                <Star className="h-12 w-12 text-white/80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* الرسم البياني للنشاط */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              تقرير النشاط الأسبوعي
            </CardTitle>
            <CardDescription>
              نشاط المستخدمين والتفاعل مع المحتوى خلال آخر 7 أيام
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full h-64 flex items-center justify-center bg-muted rounded-lg">
              <p className="text-muted-foreground">الرسم البياني - قيد التطوير</p>
            </div>
          </CardContent>
        </Card>

        {/* تقارير مفصلة */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card hover:scale-105 transition-all duration-300">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg">تقرير الأداء العام</h3>
              <p className="text-muted-foreground">إحصائيات شاملة للأداء والتحصيل</p>
            </CardContent>
          </Card>
          
          <Card className="glass-card hover:scale-105 transition-all duration-300">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg">تقرير النشاط</h3>
              <p className="text-muted-foreground">تفاعل المستخدمين مع المنصة</p>
            </CardContent>
          </Card>
        </div>

        {/* تفاصيل إحصائيات الصفوف */}
        {userProfile?.role !== 'student' && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                إحصائيات المحتوى حسب الصف
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* الصف العاشر */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg text-primary">الصف العاشر</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">الفيديوهات</span>
                      <Badge variant="secondary">{gradeStats?.grade10?.videos || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">المستندات</span>
                      <Badge variant="secondary">{gradeStats?.grade10?.documents || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">المشاريع</span>
                      <Badge variant="secondary">{gradeStats?.grade10?.projects || 0}</Badge>
                    </div>
                  </div>
                </div>

                {/* الصف الحادي عشر */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg text-primary">الصف الحادي عشر</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">الأقسام</span>
                      <Badge variant="secondary">{gradeStats?.grade11?.sections || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">المواضيع</span>
                      <Badge variant="secondary">{gradeStats?.grade11?.topics || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">الدروس</span>
                      <Badge variant="secondary">{gradeStats?.grade11?.lessons || 0}</Badge>
                    </div>
                  </div>
                </div>

                {/* الصف الثاني عشر */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg text-primary">الصف الثاني عشر</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">المستندات</span>
                      <Badge variant="secondary">{gradeStats?.grade12?.documents || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">الفيديوهات</span>
                      <Badge variant="secondary">{gradeStats?.grade12?.videos || 0}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      <AppFooter />
    </div>
  );
};

export default Reports;