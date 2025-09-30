import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, Clock, Trophy, RefreshCw, ChevronDown, ChevronUp,
  Video, FileText, BookOpen, Gamepad2, CheckCircle
} from 'lucide-react';
import { useTeacherStudentTracking, StudentTrackingData } from '@/hooks/useTeacherStudentTracking';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const StudentDetailsCard: React.FC<{ student: StudentTrackingData }> = ({ student }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours} ساعة و ${mins} دقيقة`;
    return `${mins} دقيقة`;
  };

  const getContentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      video: 'فيديو',
      document: 'مستند',
      lesson: 'درس',
      project: 'مشروع',
      game: 'لعبة',
    };
    return labels[type] || type;
  };

  const contentProgress = student.progress_details.content_progress || [];
  const videos = contentProgress.filter(c => c.content_type === 'video');
  const documents = contentProgress.filter(c => c.content_type === 'document');
  const lessons = contentProgress.filter(c => c.content_type === 'lesson');
  
  const grade10Projects = student.progress_details.grade10_projects || [];
  const grade12Projects = student.progress_details.grade12_projects || [];
  const gameProgress = student.progress_details.game_progress || [];

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{student.student_name}</CardTitle>
              <Badge variant="outline">الصف {student.student_grade}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{student.student_email}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* الإحصائيات الأساسية */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Clock className="w-4 h-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">الوقت الإجمالي</p>
              <p className="text-sm font-medium">{formatTime(student.total_time_minutes)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Trophy className="w-4 h-4 text-yellow-600" />
            <div>
              <p className="text-xs text-muted-foreground">النقاط</p>
              <p className="text-sm font-medium">{student.total_points}</p>
            </div>
          </div>
        </div>

        {/* ملخص المحتوى */}
        <div className="grid grid-cols-3 gap-2">
          {videos.length > 0 && (
            <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/30 rounded">
              <Video className="w-4 h-4 mx-auto mb-1 text-blue-600" />
              <p className="text-xs font-medium">{videos.filter(v => v.progress_percentage === 100).length}/{videos.length}</p>
              <p className="text-xs text-muted-foreground">فيديو</p>
            </div>
          )}
          {documents.length > 0 && (
            <div className="text-center p-2 bg-green-50 dark:bg-green-950/30 rounded">
              <FileText className="w-4 h-4 mx-auto mb-1 text-green-600" />
              <p className="text-xs font-medium">{documents.filter(d => d.progress_percentage === 100).length}/{documents.length}</p>
              <p className="text-xs text-muted-foreground">مستند</p>
            </div>
          )}
          {lessons.length > 0 && (
            <div className="text-center p-2 bg-purple-50 dark:bg-purple-950/30 rounded">
              <BookOpen className="w-4 h-4 mx-auto mb-1 text-purple-600" />
              <p className="text-xs font-medium">{lessons.filter(l => l.progress_percentage === 100).length}/{lessons.length}</p>
              <p className="text-xs text-muted-foreground">درس</p>
            </div>
          )}
        </div>

        {/* آخر نشاط */}
        {student.last_activity && (
          <p className="text-xs text-muted-foreground">
            آخر نشاط: {formatDistanceToNow(new Date(student.last_activity), { 
              addSuffix: true, 
              locale: ar 
            })}
          </p>
        )}

        {/* التفاصيل الموسعة */}
        {isExpanded && (
          <Tabs defaultValue="content" className="pt-3 border-t">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">المحتوى</TabsTrigger>
              <TabsTrigger value="projects">المشاريع</TabsTrigger>
              <TabsTrigger value="games">الألعاب</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-2 mt-4">
              {contentProgress.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {contentProgress.slice(0, 10).map((item, idx) => (
                    <div key={idx} className="p-2 bg-muted/30 rounded space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{getContentTypeLabel(item.content_type)}</span>
                        <Badge variant={item.progress_percentage === 100 ? 'default' : 'secondary'} className="h-5">
                          {item.progress_percentage}%
                        </Badge>
                      </div>
                      <Progress value={item.progress_percentage} className="h-1" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{item.time_spent_minutes} دقيقة</span>
                        {item.completed_at && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            مكتمل
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">لا يوجد محتوى مسجل</p>
              )}
            </TabsContent>

            <TabsContent value="projects" className="space-y-2 mt-4">
              {(grade10Projects.length > 0 || grade12Projects.length > 0) ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {grade10Projects.map((project, idx) => (
                    <div key={`g10-${idx}`} className="p-3 bg-muted/30 rounded space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{project.title}</span>
                        <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
                          {project.status === 'completed' ? 'مكتمل' : 'قيد العمل'}
                        </Badge>
                      </div>
                      <Progress value={project.progress_percentage} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{project.progress_percentage}%</span>
                        <span>
                          آخر تحديث: {formatDistanceToNow(new Date(project.updated_at), { 
                            addSuffix: true, 
                            locale: ar 
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                  {grade12Projects.map((project, idx) => (
                    <div key={`g12-${idx}`} className="p-3 bg-muted/30 rounded space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{project.title}</span>
                        <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
                          {project.status === 'completed' ? 'مكتمل' : 'قيد العمل'}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        {project.grade !== null && <span>العلامة: {project.grade}/100</span>}
                        <span>
                          آخر تحديث: {formatDistanceToNow(new Date(project.updated_at), { 
                            addSuffix: true, 
                            locale: ar 
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">لا توجد مشاريع مسجلة</p>
              )}
            </TabsContent>

            <TabsContent value="games" className="space-y-2 mt-4">
              {gameProgress.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {gameProgress.map((game, idx) => (
                    <div key={idx} className="p-2 bg-muted/30 rounded">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Gamepad2 className="w-4 h-4" />
                          <span className="font-medium">{game.game_title}</span>
                        </div>
                        <Badge variant={game.is_completed ? 'default' : 'secondary'}>
                          {game.is_completed ? 'مكتمل' : 'قيد اللعب'}
                        </Badge>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground flex justify-between">
                        <span>المستوى {game.level} - المرحلة {game.stage}</span>
                        <span>أفضل نتيجة: {game.best_score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">لا توجد ألعاب مسجلة</p>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export const StudentProgressOverview: React.FC = () => {
  const { students, loading, error, refetch } = useTeacherStudentTracking();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-destructive">
          <p>حدث خطأ في جلب البيانات: {error}</p>
          <Button onClick={() => refetch()} className="mt-4">
            إعادة المحاولة
          </Button>
        </CardContent>
      </Card>
    );
  }

  const totalStudents = students.length;
  const totalTime = students.reduce((sum, s) => sum + s.total_time_minutes, 0);
  const totalPoints = students.reduce((sum, s) => sum + s.total_points, 0);
  const activeStudents = students.filter(s => s.last_activity).length;

  return (
    <div className="space-y-6">
      {/* ملخص عام */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              إجمالي الطلاب
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalStudents}</p>
            <p className="text-xs text-muted-foreground">{activeStudents} نشط</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              الوقت الإجمالي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{Math.floor(totalTime / 60)}</p>
            <p className="text-xs text-muted-foreground">ساعة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              النقاط الإجمالية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalPoints}</p>
            <p className="text-xs text-muted-foreground">نقطة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">إجراءات</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetch()} size="sm" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              تحديث البيانات
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* قائمة الطلاب */}
      <div>
        <h3 className="text-lg font-semibold mb-4">تفاصيل تقدم الطلاب</h3>
        {students.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map(student => (
              <StudentDetailsCard key={student.student_id} student={student} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا يوجد طلاب مسجلون حالياً</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
