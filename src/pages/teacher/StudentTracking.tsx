import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  X,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import ModernHeader from '@/components/shared/ModernHeader';

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

type GradeFilter = 'all' | '10' | '11';

const StudentTracking: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentTrackingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentTrackingData | null>(null);
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>('all');
  const [contentCounts, setContentCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (user) {
      fetchStudentTracking();
    }
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStudentTracking();
    setRefreshing(false);
  };

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

      // جلب إجمالي المحتوى المتاح لكل صف
      const contentCounts: Record<string, number> = {};
      
      // حساب محتوى الصف العاشر
      const { count: grade10LessonsCount } = await supabase
        .from('grade10_lessons')
        .select('*', { count: 'exact', head: true });
      const { count: grade10VideosCount } = await supabase
        .from('grade10_videos')
        .select('*', { count: 'exact', head: true });
      contentCounts['10'] = (grade10LessonsCount || 0) + (grade10VideosCount || 0);

      // حساب محتوى الصف الحادي عشر
      const { count: grade11LessonsCount } = await supabase
        .from('grade11_lessons')
        .select('*', { count: 'exact', head: true });
      const { count: grade11VideosCount } = await supabase
        .from('grade11_videos')
        .select('*', { count: 'exact', head: true });
      contentCounts['11'] = (grade11LessonsCount || 0) + (grade11VideosCount || 0);

      // حساب محتوى الصف الثاني عشر
      const { count: grade12VideosCount } = await supabase
        .from('grade12_videos')
        .select('*', { count: 'exact', head: true });
      contentCounts['12'] = grade12VideosCount || 0;

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

      // 6.5 جلب النقاط الإجمالية الصحيحة لكل طالب
      const studentPointsMap = new Map<string, number>();
      for (const userId of userIds) {
        const { data: pointsData } = await supabase.rpc('get_student_total_points', {
          student_uuid: userId
        });
        if (pointsData !== null) {
          studentPointsMap.set(userId, pointsData);
        }
      }

      // 7. جلب بيانات ألعاب الصف الحادي عشر
      const { data: gamesProgressData, error: gamesError } = await supabase
        .from('player_game_progress')
        .select(`
          player_id,
          game_id,
          is_completed,
          best_score,
          completion_count,
          updated_at,
          pair_matching_games(title, level_number, stage_number)
        `)
        .in('player_id', userIds);

      if (gamesError) console.error('Error fetching grade11 games:', gamesError);

      // 8. جلب بيانات ألعاب الصف العاشر
      const { data: grade10GamesData, error: grade10GamesError } = await supabase
        .from('grade10_game_progress')
        .select(`
          player_id,
          lesson_id,
          question_id,
          is_completed,
          score,
          best_score,
          attempts,
          time_spent_seconds,
          last_attempt_at
        `)
        .not('player_id', 'is', null);

      if (grade10GamesError) console.error('Error fetching grade10 games:', grade10GamesError);

      // جلب بيانات grade10_player_profiles للربط
      const { data: grade10PlayersData, error: grade10PlayersError } = await supabase
        .from('grade10_player_profiles')
        .select('id, user_id, player_name');

      if (grade10PlayersError) console.error('Error fetching grade10 players:', grade10PlayersError);

      // جلب عناوين دروس الصف العاشر للألعاب
      const grade10LessonIds = (grade10GamesData || []).map((g: any) => g.lesson_id).filter(Boolean);
      const grade10LessonsMap = new Map<string, string>();
      
      if (grade10LessonIds.length > 0) {
        const { data: grade10LessonsData } = await supabase
          .from('grade10_lessons')
          .select('id, title')
          .in('id', grade10LessonIds);
        
        if (grade10LessonsData) {
          grade10LessonsData.forEach((lesson: any) => {
            grade10LessonsMap.set(lesson.id, lesson.title);
          });
        }
      }

      // 9. جلب عناوين الدروس والفيديوهات بطريقة آمنة
      const contentIds = (progressData || []).map((p: any) => p.content_id).filter(Boolean);
      const contentTitlesMap = new Map<string, string>();
      
      if (contentIds.length > 0) {
        // محاولة جلب من جداول مختلفة
        try {
          const tables = [
            { name: 'grade10_lessons', idCol: 'id', titleCol: 'title' },
            { name: 'grade10_videos', idCol: 'id', titleCol: 'title' },
            { name: 'grade11_lessons', idCol: 'id', titleCol: 'title' },
            { name: 'grade11_videos', idCol: 'id', titleCol: 'title' },
            { name: 'grade12_lessons', idCol: 'id', titleCol: 'title' },
            { name: 'grade12_videos', idCol: 'id', titleCol: 'title' }
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

      // 9. دمج البيانات
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
        
        const studentGames = (gamesProgressData || []).filter(
          (g: any) => g.player_id === student.user_id
        );

        // جلب ألعاب الصف العاشر
        const grade10PlayerProfile = (grade10PlayersData || []).find(
          (p: any) => p.user_id === student.user_id
        );
        
        const studentGrade10Games = grade10PlayerProfile 
          ? (grade10GamesData || [])
              .filter((g: any) => g.player_id === grade10PlayerProfile.id)
              .map((g: any) => ({
                ...g,
                pair_matching_games: {
                  title: grade10LessonsMap.get(g.lesson_id) || 'لعبة الصف العاشر',
                  level_number: 1,
                  stage_number: 1
                },
                completion_count: g.attempts,
                is_completed: g.is_completed,
                best_score: g.best_score || g.score || 0
              }))
          : [];

        // دمج الألعاب من الصفين
        const allGames = [...studentGames, ...studentGrade10Games];

        // حساب الوقت الكلي من student_presence + الجلسة الحالية إن وجدت
        let totalTimeMinutes = studentPresence?.total_time_minutes || 0;
        
        // إذا كان الطالب online حالياً، أضف وقت الجلسة الحالية
        if (studentPresence?.is_online && studentPresence?.session_start_at) {
          const sessionStartTime = new Date(studentPresence.session_start_at).getTime();
          const currentTime = new Date().getTime();
          const currentSessionMinutes = Math.floor((currentTime - sessionStartTime) / (1000 * 60));
          totalTimeMinutes += currentSessionMinutes;
        }

        // استخدام النقاط المحسوبة من الدالة
        const totalPoints = studentPointsMap.get(student.user_id) || 0;

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
            game_progress: allGames
          }
        };
      });

      setStudents(combinedData);
      setContentCounts(contentCounts);
    } catch (error) {
      console.error('Error fetching student tracking:', error);
      toast.error('حدث خطأ في تحميل بيانات الطلاب');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.student_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.student_grade.includes(searchQuery);
    const matchesGrade = gradeFilter === 'all' || student.student_grade === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  const grade10Students = filteredStudents.filter(s => s.student_grade === '10');
  const grade11Students = filteredStudents.filter(s => s.student_grade === '11');

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} د`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')} س`;
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

  const calculateContentProgress = (student: StudentTrackingData, totalContent: Record<string, number>): number => {
    const contentProgress = student.progress_details?.content_progress || [];
    const studentGrade = student.student_grade;
    const totalAvailable = totalContent[studentGrade] || 1;
    
    // حساب عدد العناصر المكتملة (100%)
    const completedItems = contentProgress.filter(
      item => item.progress_percentage === 100
    ).length;
    
    // النسبة المئوية = (العناصر المكتملة / إجمالي المحتوى المتاح للصف) × 100
    return Math.round((completedItems / totalAvailable) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        <ModernHeader 
          title="تتبع تقدم الطلاب"
          showBackButton={true}
          backPath="/dashboard"
        />
        <div className="container mx-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted/30 rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="h-96 bg-muted/30 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5" style={{ direction: 'rtl' }}>
      <ModernHeader 
        title="تتبع تقدم الطلاب"
        showBackButton={true}
        backPath="/dashboard"
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />
      
      <div className="container mx-auto p-6 space-y-8 animate-fade-in"
           style={{ direction: 'rtl' }}>

        {/* Statistics Cards with Gradients */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
            <CardContent className="p-6 relative">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 rounded-xl bg-primary/10 backdrop-blur-sm">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">إجمالي الطلاب</p>
                  <p className="text-3xl font-bold bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-transparent text-center">
                    {students.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-50" />
            <CardContent className="p-6 relative">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 rounded-xl bg-green-500/10 backdrop-blur-sm">
                  <Clock className="h-7 w-7 text-green-500" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">إجمالي الوقت</p>
                  <p className="text-2xl font-bold bg-gradient-to-br from-green-500 to-green-400 bg-clip-text text-transparent">
                    {formatTime(students.reduce((sum, s) => sum + s.total_time_minutes, 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-yellow-500/10 via-yellow-500/5 to-transparent backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-50" />
            <CardContent className="p-6 relative">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 rounded-xl bg-yellow-500/10 backdrop-blur-sm">
                  <Trophy className="h-7 w-7 text-yellow-500" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">إجمالي النقاط</p>
                  <p className="text-3xl font-bold bg-gradient-to-br from-yellow-500 to-yellow-400 bg-clip-text text-transparent">
                    {students.reduce((sum, s) => sum + s.total_points, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-50" />
            <CardContent className="p-6 relative">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 rounded-xl bg-purple-500/10 backdrop-blur-sm">
                  <TrendingUp className="h-7 w-7 text-purple-500" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">معدل المشاهدة</p>
                  <p className="text-3xl font-bold bg-gradient-to-br from-purple-500 to-purple-400 bg-clip-text text-transparent">
                    {students.length > 0 
                      ? Math.round(students.reduce((sum, s) => 
                          sum + (s.progress_details?.content_progress?.length || 0), 0
                        ) / students.length)
                      : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Section */}
        <Card className="p-6 border-0 bg-card/50 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="ابحث عن طالب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-12 h-12 rounded-xl bg-background/50 border-muted focus:border-primary transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={gradeFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setGradeFilter('all')}
                className="min-w-24"
              >
                الكل
              </Button>
              <Button
                variant={gradeFilter === '10' ? 'default' : 'outline'}
                onClick={() => setGradeFilter('10')}
                className="min-w-24"
              >
                الصف العاشر
              </Button>
              <Button
                variant={gradeFilter === '11' ? 'default' : 'outline'}
                onClick={() => setGradeFilter('11')}
                className="min-w-24"
              >
                الصف الحادي عشر
              </Button>
            </div>
          </div>
        </Card>

        {/* Students List by Grade */}
        {filteredStudents.length === 0 ? (
          <Card className="p-12 text-center border-0 bg-card/50 backdrop-blur-sm">
            <Users className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">لا يوجد طلاب</h3>
            <p className="text-muted-foreground">
              {searchQuery ? 'لم يتم العثور على نتائج للبحث' : 'لم يتم تسجيل أي طلاب بعد'}
            </p>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Grade 11 Students */}
            {(gradeFilter === 'all' || gradeFilter === '11') && grade11Students.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-8 w-1.5 bg-gradient-to-b from-primary to-primary/30 rounded-full" />
                  <h2 className="text-2xl font-bold">الصف الحادي عشر</h2>
                  <Badge variant="secondary" className="px-3 py-1.5">
                    {grade11Students.length}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {grade11Students.map((student) => (
                    <Card key={student.student_id} className="group hover:shadow-2xl transition-all duration-500 border-0 bg-card/60 backdrop-blur-lg overflow-hidden hover:scale-[1.01]">
                      <div className="absolute inset-0 bg-gradient-to-l from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                      <CardContent className="p-6 relative">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          {/* Student Info */}
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-500">
                              {student.student_name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold">{student.student_name}</h3>
                              <p className="text-sm text-muted-foreground">{student.student_email}</p>
                            </div>
                          </div>

                          {/* Stats Grid */}
                          <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40">
                              <Clock className="h-4 w-4 text-primary" />
                              <span className="text-sm font-semibold">{formatTime(student.total_time_minutes)}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40">
                              <Trophy className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm font-semibold">{student.total_points}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40">
                              <Activity className="h-4 w-4 text-purple-500" />
                              <span className="text-sm font-semibold">{student.progress_details?.content_progress?.length || 0}</span>
                            </div>
                            <div className="flex flex-col gap-1.5 min-w-[120px] px-3 py-2 rounded-lg bg-muted/40">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">التقدم</span>
                                <span className="text-xs font-bold text-primary">{calculateContentProgress(student, contentCounts)}%</span>
                              </div>
                              <Progress value={calculateContentProgress(student, contentCounts)} className="h-1.5" />
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedStudent(student)}
                              className="gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300 h-9"
                            >
                              <Eye className="h-4 w-4" />
                              التفاصيل
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Grade 10 Students */}
            {(gradeFilter === 'all' || gradeFilter === '10') && grade10Students.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-8 w-1.5 bg-gradient-to-b from-secondary to-secondary/30 rounded-full" />
                  <h2 className="text-2xl font-bold">الصف العاشر</h2>
                  <Badge variant="secondary" className="px-3 py-1.5">
                    {grade10Students.length}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {grade10Students.map((student) => (
                    <Card key={student.student_id} className="group hover:shadow-2xl transition-all duration-500 border-0 bg-card/60 backdrop-blur-lg overflow-hidden hover:scale-[1.01]">
                      <div className="absolute inset-0 bg-gradient-to-l from-secondary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                      <CardContent className="p-6 relative">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          {/* Student Info */}
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-secondary to-secondary/60 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-500">
                              {student.student_name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold">{student.student_name}</h3>
                              <p className="text-sm text-muted-foreground">{student.student_email}</p>
                            </div>
                          </div>

                          {/* Stats Grid */}
                          <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40">
                              <Clock className="h-4 w-4 text-primary" />
                              <span className="text-sm font-semibold">{formatTime(student.total_time_minutes)}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40">
                              <Trophy className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm font-semibold">{student.total_points}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40">
                              <Activity className="h-4 w-4 text-purple-500" />
                              <span className="text-sm font-semibold">{student.progress_details?.content_progress?.length || 0}</span>
                            </div>
                            <div className="flex flex-col gap-1.5 min-w-[120px] px-3 py-2 rounded-lg bg-muted/40">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">التقدم</span>
                                <span className="text-xs font-bold text-secondary">{calculateContentProgress(student, contentCounts)}%</span>
                              </div>
                              <Progress value={calculateContentProgress(student, contentCounts)} className="h-1.5" />
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedStudent(student)}
                              className="gap-2 hover:bg-secondary hover:text-secondary-foreground transition-all duration-300 h-9"
                            >
                              <Eye className="h-4 w-4" />
                              التفاصيل
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Student Details Dialog */}
      {selectedStudent && (
        <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center text-white font-bold">
                  {selectedStudent.student_name.charAt(0)}
                </div>
                تفاصيل تقدم {selectedStudent.student_name}
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content">المحتوى</TabsTrigger>
                <TabsTrigger value="projects">المشاريع</TabsTrigger>
                <TabsTrigger value="games">الألعاب</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4 mt-4">
                {selectedStudent.progress_details?.content_progress?.length > 0 ? (
                  selectedStudent.progress_details.content_progress.map((item, index) => (
                    <Card key={index} className="border-0 bg-muted/30">
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

              <TabsContent value="projects" className="space-y-4 mt-4">
                {(selectedStudent.progress_details?.grade10_projects?.length > 0 ||
                  selectedStudent.progress_details?.grade12_projects?.length > 0) ? (
                  <>
                    {selectedStudent.progress_details.grade10_projects?.map((project, index) => (
                      <Card key={index} className="border-0 bg-muted/30">
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
                      <Card key={index} className="border-0 bg-muted/30">
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

              <TabsContent value="games" className="space-y-4 mt-4">
                {selectedStudent.progress_details?.game_progress?.length > 0 ? (
                  selectedStudent.progress_details.game_progress.map((game: any, index: number) => (
                    <Card key={index} className="border-0 bg-muted/30">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {game.pair_matching_games?.title || 'لعبة مطابقة'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              المستوى {game.pair_matching_games?.level_number || 1} • 
                              المرحلة {game.pair_matching_games?.stage_number || 1} • 
                              لعبها {game.completion_count || 0} مرة
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={game.is_completed ? 'default' : 'secondary'}>
                              {game.is_completed ? 'مكتمل ✓' : 'قيد التقدم'}
                            </Badge>
                            <Badge variant="outline">{game.best_score || 0} نقطة</Badge>
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
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default StudentTracking;
