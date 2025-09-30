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
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [students, setStudents] = useState<StudentTrackingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentTrackingData | null>(null);

  useEffect(() => {
    fetchStudentTracking();
  }, []);

  const fetchStudentTracking = async () => {
    try {
      setLoading(true);
      
      // جلب بيانات التقدم من جدول student_progress
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
        `);

      if (progressError) throw progressError;

      // جلب بيانات الأنشطة
      const { data: activityData, error: activityError } = await supabase
        .from('student_activity_log')
        .select('student_id, activity_type, duration_seconds, points_earned, created_at');

      if (activityError) throw activityError;

      // جلب معلومات الطلاب
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
        `);

      if (studentsError) throw studentsError;

      // دمج البيانات
      const combinedData: StudentTrackingData[] = (studentsData || []).map((student: any) => {
        const studentProgress = (progressData || []).filter(
          (p: any) => p.student_id === student.user_id
        );
        const studentActivity = (activityData || []).filter(
          (a: any) => a.student_id === student.user_id
        );

        const totalTimeFromProgress = studentProgress.reduce(
          (sum: number, p: any) => sum + (p.time_spent_minutes || 0), 0
        );
        const totalTimeFromActivity = studentActivity.reduce(
          (sum: number, a: any) => sum + (a.duration_seconds || 0) / 60, 0
        );

        const totalPoints = studentProgress.reduce(
          (sum: number, p: any) => sum + (p.points_earned || 0), 0
        ) + studentActivity.reduce(
          (sum: number, a: any) => sum + (a.points_earned || 0), 0
        );

        const lastActivity = studentActivity.length > 0
          ? studentActivity.sort((a: any, b: any) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0].created_at
          : null;

        const gradeLevel = student.class_students?.[0]?.classes?.grade_levels?.code || '11';

        return {
          student_id: student.id,
          student_name: student.full_name,
          student_email: student.email,
          student_grade: gradeLevel,
          total_time_minutes: Math.round(totalTimeFromProgress + totalTimeFromActivity),
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
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div className="h-12 bg-muted rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-16 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">تتبع تقدم الطلاب</h1>
          <p className="text-muted-foreground">متابعة نشاط الطلاب والمحتوى الذي تم استكماله</p>
        </div>
        <Button onClick={fetchStudentTracking} variant="outline">
          تحديث البيانات
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الطلاب</p>
                <p className="text-2xl font-bold">{students.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الوقت</p>
                <p className="text-2xl font-bold">
                  {formatTime(students.reduce((sum, s) => sum + s.total_time_minutes, 0))}
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي النقاط</p>
                <p className="text-2xl font-bold">
                  {students.reduce((sum, s) => sum + s.total_points, 0)}
                </p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">معدل المشاهدة</p>
                <p className="text-2xl font-bold">
                  {students.length > 0 
                    ? Math.round(students.reduce((sum, s) => 
                        sum + (s.progress_details?.content_progress?.length || 0), 0
                      ) / students.length)
                    : 0}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="البحث عن طالب..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Students List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredStudents.map((student) => (
          <Card key={student.student_id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {student.student_name.charAt(0)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{student.student_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{student.student_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">الصف {student.student_grade}</Badge>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedStudent(student)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    عرض التفاصيل
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">الوقت المقضي</p>
                    <p className="text-sm font-medium">{formatTime(student.total_time_minutes)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">النقاط</p>
                    <p className="text-sm font-medium">{student.total_points}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">المحتوى المكتمل</p>
                    <p className="text-sm font-medium">
                      {student.progress_details?.content_progress?.length || 0}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">آخر نشاط</p>
                    <p className="text-sm font-medium">
                      {student.last_activity 
                        ? new Date(student.last_activity).toLocaleDateString('ar-SA')
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
        <Card className="text-center p-12">
          <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">لا توجد نتائج</h3>
          <p className="text-muted-foreground">
            {searchQuery ? 'لم يتم العثور على طلاب' : 'لا يوجد طلاب مسجلين'}
          </p>
        </Card>
      )}

      {/* Student Details Dialog */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">
                  تفاصيل تقدم {selectedStudent.student_name}
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedStudent(null)}
                >
                  إغلاق
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
                                <p className="font-medium">{getContentTypeLabel(item.content_type)}</p>
                                <p className="text-sm text-muted-foreground">
                                  {item.time_spent_minutes} دقيقة • {item.points_earned} نقطة
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
  );
};

export default StudentTracking;
