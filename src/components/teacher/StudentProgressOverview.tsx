import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, Clock, Video, BookOpen, FileText, 
  Gamepad2, Trophy, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';
import { useTeacherStudentTracking, StudentTrackingData } from '@/hooks/useTeacherStudentTracking';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const StudentDetailsCard: React.FC<{ student: StudentTrackingData }> = ({ student }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours} ساعة و ${mins} دقيقة`;
    return `${mins} دقيقة`;
  };

  const getActivityLabel = (type: string) => {
    const labels: Record<string, string> = {
      login: 'تسجيل دخول',
      video_watch: 'مشاهدة فيديو',
      document_read: 'قراءة مستند',
      lesson_study: 'دراسة درس',
      project_work: 'عمل مشروع',
      game_play: 'لعب لعبة',
    };
    return labels[type] || type;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{student.student_name}</CardTitle>
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

        {/* المحتوى المنجز */}
        <div className="space-y-2">
          <p className="text-sm font-medium">المحتوى المنجز:</p>
          <div className="flex flex-wrap gap-2">
            {student.videos_watched > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Video className="w-3 h-3" />
                {student.videos_watched} فيديو
              </Badge>
            )}
            {student.documents_read > 0 && (
              <Badge variant="secondary" className="gap-1">
                <FileText className="w-3 h-3" />
                {student.documents_read} مستند
              </Badge>
            )}
            {student.lessons_completed > 0 && (
              <Badge variant="secondary" className="gap-1">
                <BookOpen className="w-3 h-3" />
                {student.lessons_completed} درس
              </Badge>
            )}
            {student.projects_completed > 0 && (
              <Badge variant="secondary" className="gap-1">
                <FileText className="w-3 h-3" />
                {student.projects_completed} مشروع
              </Badge>
            )}
            {student.games_played > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Gamepad2 className="w-3 h-3" />
                {student.games_played} لعبة
              </Badge>
            )}
          </div>
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
          <div className="space-y-3 pt-3 border-t">
            <div>
              <p className="text-sm font-medium mb-2">آخر الأنشطة:</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {student.activities.length > 0 ? (
                  student.activities.map((activity, idx) => (
                    <div key={idx} className="text-xs p-2 bg-muted/30 rounded flex justify-between">
                      <span>{getActivityLabel(activity.activity_type)}</span>
                      <span className="text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.created_at), { 
                          addSuffix: true, 
                          locale: ar 
                        })}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">لا توجد أنشطة مسجلة</p>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">التقدم التفصيلي:</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {student.progress.length > 0 ? (
                  student.progress
                    .filter(p => p.progress_percentage > 0)
                    .slice(0, 5)
                    .map((prog, idx) => (
                      <div key={idx} className="text-xs p-2 bg-muted/30 rounded flex justify-between">
                        <span>{prog.content_type}</span>
                        <Badge variant={prog.progress_percentage === 100 ? 'default' : 'secondary'}>
                          {prog.progress_percentage}%
                        </Badge>
                      </div>
                    ))
                ) : (
                  <p className="text-xs text-muted-foreground">لا يوجد تقدم مسجل</p>
                )}
              </div>
            </div>
          </div>
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
        <h3 className="text-lg font-semibold mb-4">تفاصيل الطلاب</h3>
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
