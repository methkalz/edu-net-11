import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Clock, 
  Trophy, 
  Video, 
  BookOpen, 
  FileText,
  Calendar,
  TrendingUp,
  Users,
  Eye,
  ArrowRight,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface StudentTrackingData {
  student_id: string;
  student_name: string;
  student_email: string;
  student_grade: string;
  total_time_minutes: number;
  total_points: number;
  last_activity: string;
  progress_details: {
    content_progress: Array<{
      content_id: string;
      content_type: string;
      content_title?: string;
      progress_percentage: number;
      time_spent_minutes: number;
      points_earned: number;
      completed_at: string;
      updated_at: string;
    }>;
    grade10_projects: any[];
    grade12_projects: any[];
    game_progress: any[];
  };
}

const StudentTracking: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentTrackingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentTrackingData | null>(null);

  useEffect(() => {
    if (user) {
      fetchStudentTracking();
    }
  }, [user]);

  const fetchStudentTracking = async () => {
    try {
      setLoading(true);
      
      // 1. جلب الصفوف التي يدرسها المعلم
      const { data: teacherClasses, error: teacherClassesError } = await supabase
        .from('teacher_classes')
        .select('class_id')
        .eq('teacher_id', user?.id);

      if (teacherClassesError) throw teacherClassesError;

      if (!teacherClasses || teacherClasses.length === 0) {
        setStudents([]);
        setLoading(false);
        toast.info('لا توجد صفوف مسندة إليك بعد');
        return;
      }

      const classIds = teacherClasses.map(tc => tc.class_id);

      // 2. جلب الطلاب المسجلين في هذه الصفوف
      const { data: classStudents, error: classStudentsError } = await supabase
        .from('class_students')
        .select('student_id')
        .in('class_id', classIds);

      if (classStudentsError) throw classStudentsError;

      if (!classStudents || classStudents.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      const studentIds = classStudents.map(cs => cs.student_id);

      // 3. جلب معلومات الطلاب
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          user_id,
          full_name,
          email,
          class_students(
            classes(
              grade_level_id,
              grade_levels(code, label)
            )
          )
        `)
        .in('id', studentIds);

      if (studentsError) throw studentsError;

      // 4. جلب بيانات التقدم لطلاب المعلم فقط
      const userIds = (studentsData || []).map((s: any) => s.user_id).filter(Boolean);

      const { data: progressData, error: progressError } = await supabase
        .from('student_progress')
        .select(`
          student_id,
          content_id,
          content_type,
          progress_percentage,
          time_spent_minutes,
          points_earned,
          completed_at,
          updated_at
        `)
        .in('student_id', userIds);

      if (progressError) throw progressError;

      // 5. جلب بيانات الأنشطة لطلاب المعلم فقط
      const { data: activityData, error: activityError } = await supabase
        .from('student_activity_log')
        .select('student_id, activity_type, duration_seconds, points_earned, created_at')
        .in('student_id', userIds);

      if (activityError) throw activityError;

      // 6. جلب بيانات الحضور والوقت من student_presence
      const { data: presenceData, error: presenceError } = await supabase
        .from('student_presence')
        .select('user_id, is_online, last_seen_at, total_time_minutes, session_start_at')
        .in('user_id', userIds);

      if (presenceError) throw presenceError;

      // 7. جلب عناوين الدروس والفيديوهات بطريقة آمنة
      const contentIds = (progressData || []).map((p: any) => p.content_id).filter(Boolean);
      const contentTitlesMap = new Map<string, string>();
      
      if (contentIds.length > 0) {
        // محاولة جلب من جداول مختلفة
        try {
          const tables = [
            { name: 'grade11_lessons', idCol: 'id', titleCol: 'title' },
            { name: 'grade11_videos', idCol: 'id', titleCol: 'title' },
            { name: 'grade12_lessons', idCol: 'id', titleCol: 'title' },
            { name: 'grade12_videos', idCol: 'id', titleCol: 'title' },
            { name: 'grade10_lessons', idCol: 'id', titleCol: 'title' }
          ];

          for (const table of tables) {
            try {
              const { data } = await supabase
                .from(table.name as any)
                .select(`${table.idCol}, ${table.titleCol}`)
                .in(table.idCol, contentIds);
              
              if (data) {
                data.forEach((item: any) => {
                  contentTitlesMap.set(item[table.idCol], item[table.titleCol]);
                });
              }
            } catch (e) {
              // تجاهل الأخطاء للجداول غير الموجودة
              console.log(`Table ${table.name} not accessible`);
            }
          }
        } catch (error) {
          console.error('Error fetching content titles:', error);
        }
      }

      // 8. دمج البيانات
      const combinedData: StudentTrackingData[] = (studentsData || []).map((student: any) => {
        const studentProgress = (progressData || []).filter(
          (p: any) => p.student_id === student.user_id
        ).map((p: any) => ({
          ...p,
          content_title: contentTitlesMap.get(p.content_id) || 'بدون عنوان'
        }));
        
        const studentActivity = (activityData || []).filter(
          (a: any) => a.student_id === student.user_id
        );
        const studentPresence = (presenceData || []).find(
          (p: any) => p.user_id === student.user_id
        );

        // حساب الوقت الكلي من student_presence + الجلسة الحالية إن وجدت
        let totalTimeMinutes = studentPresence?.total_time_minutes || 0;
        
        // إذا كان الطالب online حالياً، أضف وقت الجلسة الحالية
        if (studentPresence?.is_online && studentPresence?.session_start_at) {
          const sessionStartTime = new Date(studentPresence.session_start_at).getTime();
          const currentTime = new Date().getTime();
          const currentSessionMinutes = Math.floor((currentTime - sessionStartTime) / (1000 * 60));
          totalTimeMinutes += currentSessionMinutes;
        }

        const totalPoints = studentProgress.reduce(
          (sum: number, p: any) => sum + (p.points_earned || 0), 0
        ) + studentActivity.reduce(
          (sum: number, a: any) => sum + (a.points_earned || 0), 0
        );

        const lastActivity = studentPresence?.last_seen_at || (
          studentActivity.length > 0
            ? studentActivity.sort((a: any, b: any) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )[0].created_at
            : null
        );

        const gradeLevel = student.class_students?.[0]?.classes?.grade_levels?.code || '11';

        return {
          student_id: student.id,
          student_name: student.full_name,
          student_email: student.email,
          student_grade: gradeLevel,
          total_time_minutes: Math.round(totalTimeMinutes),
          total_points: totalPoints,
          last_activity: lastActivity,
          progress_details: {
            content_progress: studentProgress,
            grade10_projects: [],
            grade12_projects: [],
            game_progress: []
          }
        };
      });

      setStudents(combinedData);
    } catch (error) {
      console.error('Error fetching student tracking:', error);
      toast.error('حدث خطأ في تحميل بيانات الطلاب');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.student_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.student_grade.includes(searchQuery)
  );

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} ساعة${mins > 0 ? ` و ${mins} دقيقة` : ''}`;
  };

  const getContentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      video: 'فيديو',
      lesson: 'درس',
      document: 'مستند',
      project: 'مشروع',
      game: 'لعبة'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="space-y-8">
            <div className="h-24 bg-muted/50 rounded-2xl animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-muted/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-6 max-w-7xl space-y-8">
        {/* Modern Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-8">
          <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.02] pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <Button 
                onClick={() => navigate('/teacher')} 
                variant="ghost" 
                size="sm"
                className="gap-2 hover:bg-primary/10"
              >
                <ArrowRight className="h-4 w-4" />
                رجوع
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary/10 backdrop-blur-sm">
                    <Activity className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-l from-primary to-primary/60 bg-clip-text text-transparent">
                      تتبع تقدم الطلاب
                    </h1>
                    <p className="text-muted-foreground mt-1">متابعة نشاط الطلاب والمحتوى المكتمل</p>
                  </div>
                </div>
              </div>
              <Button 
                onClick={fetchStudentTracking} 
                variant="outline"
                className="gap-2 bg-background/50 backdrop-blur-sm hover:bg-background/80"
              >
                <TrendingUp className="h-4 w-4" />
                تحديث البيانات
              </Button>
            </div>
          </div>
        </div>

        {/* Modern Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 hover:shadow-lg transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">إجمالي الطلاب</p>
                  <p className="text-3xl font-bold bg-gradient-to-l from-primary to-primary/60 bg-clip-text text-transparent">
                    {students.length}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10 backdrop-blur-sm">
                  <Users className="h-7 w-7 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-green-500/20 bg-gradient-to-br from-card via-card to-green-500/5 hover:shadow-lg transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">إجمالي الوقت</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatTime(students.reduce((sum, s) => sum + s.total_time_minutes, 0))}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-green-500/10 backdrop-blur-sm">
                  <Clock className="h-7 w-7 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-yellow-500/20 bg-gradient-to-br from-card via-card to-yellow-500/5 hover:shadow-lg transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">إجمالي النقاط</p>
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                    {students.reduce((sum, s) => sum + s.total_points, 0)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-yellow-500/10 backdrop-blur-sm">
                  <Trophy className="h-7 w-7 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-purple-500/20 bg-gradient-to-br from-card via-card to-purple-500/5 hover:shadow-lg transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">معدل المشاهدة</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {students.length > 0 
                      ? Math.round(students.reduce((sum, s) => 
                          sum + (s.progress_details?.content_progress?.length || 0), 0
                        ) / students.length)
                      : 0}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/10 backdrop-blur-sm">
                  <TrendingUp className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modern Search */}
        <div className="relative max-w-md">
          <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            placeholder="البحث عن طالب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-12 h-12 rounded-xl border-primary/20 bg-background/50 backdrop-blur-sm focus:bg-background transition-colors"
          />
        </div>

        {/* Modern Students List */}
        <div className="grid grid-cols-1 gap-6">
          {filteredStudents.map((student) => (
            <Card key={student.student_id} className="group hover:shadow-xl transition-all duration-300 border-primary/10 hover:border-primary/30 bg-card/50 backdrop-blur-sm overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-l from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <CardHeader className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-14 h-14 bg-gradient-to-br from-primary via-primary/80 to-primary/60 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        {student.student_name.charAt(0)}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">{student.student_name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{student.student_email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-sm px-3 py-1 bg-primary/5 border-primary/20">
                      الصف {student.student_grade}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedStudent(student)}
                      className="gap-2 hover:bg-primary/10 hover:border-primary/30 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      عرض التفاصيل
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="p-2 rounded-lg bg-background shadow-sm">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground font-medium mb-1">الوقت المقضي</p>
                      <p className="text-base font-bold">{formatTime(student.total_time_minutes)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="p-2 rounded-lg bg-background shadow-sm">
                      <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground font-medium mb-1">النقاط</p>
                      <p className="text-base font-bold">{student.total_points}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="p-2 rounded-lg bg-background shadow-sm">
                      <Video className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground font-medium mb-1">المحتوى المكتمل</p>
                      <p className="text-base font-bold">
                        {student.progress_details?.content_progress?.length || 0}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="p-2 rounded-lg bg-background shadow-sm">
                      <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground font-medium mb-1">آخر نشاط</p>
                      <p className="text-sm font-bold">
                        {student.last_activity 
                          ? new Date(student.last_activity).toLocaleString('en-GB', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false
                            }).replace(',', ' -')
                          : 'لا يوجد'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
          </Card>
        ))}
      </div>

        {filteredStudents.length === 0 && (
          <Card className="text-center p-16 bg-card/50 backdrop-blur-sm border-primary/10">
            <div className="inline-flex p-6 rounded-2xl bg-muted/50 mb-6">
              <Users className="h-16 w-16 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-3">لا توجد نتائج</h3>
            <p className="text-muted-foreground text-lg">
              {searchQuery ? 'لم يتم العثور على طلاب' : 'لا يوجد طلاب مسجلين'}
            </p>
          </Card>
        )}

        {/* Modern Student Details Dialog */}
        {selectedStudent && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-primary/20 bg-background/95 backdrop-blur-xl">
              <CardHeader className="border-b border-primary/10 bg-gradient-to-br from-primary/5 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary via-primary/80 to-primary/60 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                      {selectedStudent.student_name.charAt(0)}
                    </div>
                    <CardTitle className="text-3xl font-bold">
                      تفاصيل تقدم {selectedStudent.student_name}
                    </CardTitle>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedStudent(null)}
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    إغلاق ✕
                  </Button>
                </div>
              </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="content">المحتوى</TabsTrigger>
                  <TabsTrigger value="projects">المشاريع</TabsTrigger>
                  <TabsTrigger value="games">الألعاب</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-4">
                  {selectedStudent.progress_details?.content_progress?.length > 0 ? (
                    selectedStudent.progress_details.content_progress.map((item, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {item.content_type === 'video' ? (
                                <Video className="h-5 w-5 text-blue-500" />
                              ) : item.content_type === 'lesson' ? (
                                <BookOpen className="h-5 w-5 text-green-500" />
                              ) : (
                                <FileText className="h-5 w-5 text-purple-500" />
                              )}
                              <div>
                                <p className="font-medium">{item.content_title || getContentTypeLabel(item.content_type)}</p>
                                <p className="text-sm text-muted-foreground">
                                  {getContentTypeLabel(item.content_type)} • {item.time_spent_minutes} دقيقة • {item.points_earned} نقطة
                                </p>
                              </div>
                            </div>
                            <Badge variant={item.progress_percentage === 100 ? 'default' : 'secondary'}>
                              {item.progress_percentage}%
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      لم يكمل الطالب أي محتوى بعد
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="projects" className="space-y-4">
                  {(selectedStudent.progress_details?.grade10_projects?.length > 0 ||
                    selectedStudent.progress_details?.grade12_projects?.length > 0) ? (
                    <>
                      {selectedStudent.progress_details.grade10_projects?.map((project, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{project.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  مشروع صف عاشر • {project.status}
                                </p>
                              </div>
                              <Badge>{project.progress_percentage}%</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {selectedStudent.progress_details.grade12_projects?.map((project, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{project.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  مشروع صف ثاني عشر • {project.status}
                                </p>
                              </div>
                              <Badge>{project.grade || 'لم يُقيّم بعد'}</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      لا توجد مشاريع للطالب
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="games" className="space-y-4">
                  {selectedStudent.progress_details?.game_progress?.length > 0 ? (
                    selectedStudent.progress_details.game_progress.map((game, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{game.game_title}</p>
                              <p className="text-sm text-muted-foreground">
                                المستوى {game.level} • المرحلة {game.stage}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={game.is_completed ? 'default' : 'secondary'}>
                                {game.is_completed ? 'مكتمل' : 'قيد التقدم'}
                              </Badge>
                              <Badge variant="outline">{game.best_score} نقطة</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      لم يلعب الطالب أي ألعاب بعد
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </div>
  );
};

export default StudentTracking;
