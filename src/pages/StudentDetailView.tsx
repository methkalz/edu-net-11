/**
 * Student Detail View Page
 * صفحة تفاصيل تقدم الطالب الشاملة
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  ArrowRight,
  User,
  Trophy,
  Activity,
  Video,
  FileText,
  Gamepad2,
  FolderKanban,
  Award,
  Clock,
  TrendingUp,
  CircleDot,
  Calendar,
  Target,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { logger } from '@/lib/logger';
import { toast } from '@/hooks/use-toast';

interface StudentDetailData {
  id: string;
  full_name: string;
  username: string;
  email: string;
  class_name?: string;
  grade_level?: string;
  total_points: number;
  is_online: boolean;
  last_seen_at?: string;
}

const StudentDetailView: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<StudentDetailData | null>(null);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [progress, setProgress] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);

  useEffect(() => {
    if (studentId) {
      fetchStudentDetails();
    }
  }, [studentId]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);

      // جلب معلومات الطالب الأساسية
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select(`
          id,
          full_name,
          username,
          email,
          user_id
        `)
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;

      // جلب معلومات الصف
      const { data: classInfo } = await supabase
        .from('class_students')
        .select(`
          classes!inner(
            grade_levels!inner(label),
            class_names!inner(name)
          )
        `)
        .eq('student_id', studentId)
        .single();

      // جلب حالة الحضور
      const { data: presence } = await supabase
        .from('student_presence')
        .select('*')
        .eq('student_id', studentId)
        .single();

      // جلب إحصائيات Dashboard
      const { data: statsRaw } = await supabase.rpc('get_student_dashboard_stats', {
        student_uuid: studentId
      });
      const stats = statsRaw as any;

      // جلب التقدم
      const { data: progressData } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', studentId)
        .order('last_accessed_at', { ascending: false });

      // جلب الأنشطة
      const { data: activitiesData } = await supabase
        .from('student_activity_log')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(50);

      // جلب الإنجازات
      const { data: achievementsData } = await supabase
        .from('student_achievements')
        .select('*')
        .eq('student_id', studentId)
        .order('earned_at', { ascending: false });

      setStudentData({
        ...student,
        class_name: classInfo?.classes?.class_names?.name,
        grade_level: classInfo?.classes?.grade_levels?.label,
        total_points: stats?.total_points || 0,
        is_online: presence?.is_online || false,
        last_seen_at: presence?.last_seen_at
      });

      setDashboardStats(stats);
      setProgress(progressData || []);
      setActivities(activitiesData || []);
      setAchievements(achievementsData || []);

      logger.info('Student details loaded', { studentId });
    } catch (error) {
      logger.error('Error fetching student details', error as Error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في جلب بيانات الطالب',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
              <span className="mr-4 text-lg">جاري تحميل البيانات...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg text-muted-foreground">لم يتم العثور على بيانات الطالب</p>
            <Button className="mt-4" onClick={() => navigate('/dashboard')}>
              العودة للوحة التحكم
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // تصنيف التقدم حسب النوع
  const videoProgress = progress.filter(p => p.content_type === 'video');
  const documentProgress = progress.filter(p => p.content_type === 'document');
  const gameProgress = progress.filter(p => p.content_type === 'game');
  const projectProgress = progress.filter(p => p.content_type === 'project');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{studentData.full_name}</h1>
            <p className="text-muted-foreground">@{studentData.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {studentData.is_online ? (
            <Badge variant="default" className="gap-2">
              <CircleDot className="h-4 w-4" />
              متصل الآن
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-2">
              <CircleDot className="h-4 w-4" />
              غير متصل
            </Badge>
          )}
        </div>
      </div>

      {/* معلومات سريعة */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي النقاط</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {studentData.total_points.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الفيديوهات المكتملة</CardTitle>
            <Video className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {dashboardStats?.completed_videos || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المشاريع المكتملة</CardTitle>
            <FolderKanban className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {dashboardStats?.completed_projects || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الإنجازات</CardTitle>
            <Award className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {dashboardStats?.achievements_count || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* التفاصيل */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="videos">الفيديوهات</TabsTrigger>
          <TabsTrigger value="documents">المستندات</TabsTrigger>
          <TabsTrigger value="games">الألعاب</TabsTrigger>
          <TabsTrigger value="activities">سجل الأنشطة</TabsTrigger>
          <TabsTrigger value="achievements">الإنجازات</TabsTrigger>
        </TabsList>

        {/* نظرة عامة */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* معلومات الطالب */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  معلومات الطالب
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الصف:</span>
                  <span className="font-medium">{studentData.grade_level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الشعبة:</span>
                  <span className="font-medium">{studentData.class_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">البريد الإلكتروني:</span>
                  <span className="font-medium text-sm">{studentData.email}</span>
                </div>
                {studentData.last_seen_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">آخر ظهور:</span>
                    <span className="font-medium text-sm">
                      {format(new Date(studentData.last_seen_at), 'PPp', { locale: ar })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* إحصائيات سريعة */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  إحصائيات الأداء
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">إجمالي الأنشطة:</span>
                  <span className="font-bold">{dashboardStats?.total_activities || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">أيام النشاط المتواصل:</span>
                  <span className="font-bold">{dashboardStats?.current_streak || 0}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">نسبة الإنجاز الإجمالية:</span>
                    <span className="font-bold">
                      {Math.round((progress.filter(p => p.progress_percentage === 100).length / (progress.length || 1)) * 100)}%
                    </span>
                  </div>
                  <Progress
                    value={Math.round((progress.filter(p => p.progress_percentage === 100).length / (progress.length || 1)) * 100)}
                    className="h-3"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* الفيديوهات */}
        <TabsContent value="videos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                تقدم الفيديوهات ({videoProgress.length})
              </CardTitle>
              <CardDescription>
                قائمة الفيديوهات التي شاهدها الطالب
              </CardDescription>
            </CardHeader>
            <CardContent>
              {videoProgress.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>لم يشاهد الطالب أي فيديوهات بعد</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {videoProgress.map(video => (
                    <div key={video.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">محتوى رقم: {video.content_id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">
                            الوقت المستغرق: {video.time_spent_minutes} دقيقة
                          </p>
                        </div>
                        <Badge>{video.progress_percentage}%</Badge>
                      </div>
                      <Progress value={video.progress_percentage} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>نقاط مكتسبة: {video.points_earned}</span>
                        <span>آخر وصول: {format(new Date(video.last_accessed_at), 'PPp', { locale: ar })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* المستندات */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                تقدم المستندات ({documentProgress.length})
              </CardTitle>
              <CardDescription>
                قائمة المستندات التي قرأها الطالب
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documentProgress.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>لم يقرأ الطالب أي مستندات بعد</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documentProgress.map(doc => (
                    <div key={doc.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">محتوى رقم: {doc.content_id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">
                            الوقت المستغرق: {doc.time_spent_minutes} دقيقة
                          </p>
                        </div>
                        <Badge>{doc.progress_percentage}%</Badge>
                      </div>
                      <Progress value={doc.progress_percentage} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>نقاط مكتسبة: {doc.points_earned}</span>
                        <span>آخر وصول: {format(new Date(doc.last_accessed_at), 'PPp', { locale: ar })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* الألعاب */}
        <TabsContent value="games">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5" />
                تقدم الألعاب ({gameProgress.length})
              </CardTitle>
              <CardDescription>
                قائمة الألعاب التي لعبها الطالب
              </CardDescription>
            </CardHeader>
            <CardContent>
              {gameProgress.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Gamepad2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>لم يلعب الطالب أي ألعاب بعد</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {gameProgress.map(game => (
                    <div key={game.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">لعبة رقم: {game.content_id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">
                            الوقت المستغرق: {game.time_spent_minutes} دقيقة
                          </p>
                        </div>
                        <Badge>{game.progress_percentage}%</Badge>
                      </div>
                      <Progress value={game.progress_percentage} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>نقاط مكتسبة: {game.points_earned}</span>
                        <span>آخر لعب: {format(new Date(game.last_accessed_at), 'PPp', { locale: ar })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* سجل الأنشطة */}
        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                سجل الأنشطة ({activities.length})
              </CardTitle>
              <CardDescription>
                Timeline تفصيلي لجميع أنشطة الطالب
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>لا يوجد سجل أنشطة للطالب</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map(activity => (
                    <div key={activity.id} className="flex gap-4 border-r-4 border-primary/30 pr-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline">{activity.activity_type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(activity.created_at), 'PPp', { locale: ar })}
                          </span>
                        </div>
                        {activity.content_id && (
                          <p className="text-sm text-muted-foreground">
                            محتوى: {activity.content_id.slice(0, 8)}
                          </p>
                        )}
                        {activity.duration_seconds && (
                          <p className="text-sm">
                            المدة: {Math.round(activity.duration_seconds / 60)} دقيقة
                          </p>
                        )}
                        {activity.points_earned > 0 && (
                          <p className="text-sm text-green-600 font-medium">
                            +{activity.points_earned} نقطة
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* الإنجازات */}
        <TabsContent value="achievements">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                الإنجازات ({achievements.length})
              </CardTitle>
              <CardDescription>
                الأوسمة والجوائز التي حصل عليها الطالب
              </CardDescription>
            </CardHeader>
            <CardContent>
              {achievements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>لم يحصل الطالب على أي إنجازات بعد</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {achievements.map(achievement => (
                    <div
                      key={achievement.id}
                      className="border rounded-lg p-4 space-y-2 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg">{achievement.achievement_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {achievement.achievement_description}
                          </p>
                        </div>
                        <Trophy className="h-8 w-8 text-yellow-500" />
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <Badge variant="secondary">{achievement.achievement_type}</Badge>
                        <span className="text-sm font-bold text-yellow-600">
                          +{achievement.points_value} نقطة
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        حصل عليه: {format(new Date(achievement.earned_at), 'PPp', { locale: ar })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentDetailView;
