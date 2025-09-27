import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Users,
  BarChart3,
  Eye,
  MessageSquare,
  Calendar
} from 'lucide-react';
import { useTeacherProjects } from '@/hooks/useTeacherProjects';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const Grade12ProjectsWidget: React.FC = () => {
  const navigate = useNavigate();
  const { projects, quickStats, loading } = useTeacherProjects();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-muted-foreground" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'draft':
        return <FileText className="h-4 w-4 text-muted-foreground" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'مكتمل';
      case 'in_progress':
        return 'قيد التنفيذ';
      case 'draft':
        return 'مسودة';
      default:
        return 'غير محدد';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 text-green-700';
      case 'in_progress':
        return 'border-blue-200 text-blue-700';
      case 'draft':
        return 'border-gray-200 text-gray-700';
      default:
        return 'border-yellow-200 text-yellow-700';
    }
  };

  if (loading) {
    return (
      <Card className="border-0 bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            مشاريع الثاني عشر
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-card shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-medium text-foreground">
                مشاريع الثاني عشر
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                متابعة مشاريع الطلاب وآخر التحديثات
              </CardDescription>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/grade12-management')}
            className="text-sm"
          >
            عرض الكل
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-semibold text-foreground">
              {quickStats.totalProjects}
            </div>
            <div className="text-sm text-muted-foreground">
              إجمالي المشاريع
            </div>
          </div>
          
          <div className="text-center p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-semibold text-foreground">
              {quickStats.completedProjects}
            </div>
            <div className="text-sm text-muted-foreground">
              مكتملة
            </div>
          </div>
          
          <div className="text-center p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center justify-center mb-2">
              <MessageCircle className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-semibold text-foreground">
              {quickStats.unreadCommentsTotal}
            </div>
            <div className="text-sm text-muted-foreground">
              تعليقات جديدة
            </div>
          </div>
          
          <div className="text-center p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-semibold text-foreground">
              {quickStats.averageCompletion}%
            </div>
            <div className="text-sm text-muted-foreground">
              متوسط الإنجاز
            </div>
          </div>
        </div>

        <Separator />

        {/* قائمة المشاريع الحديثة */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            آخر المشاريع المحدّثة
          </h4>
          
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-muted flex items-center justify-center">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground mb-2">لا توجد مشاريع بعد</h3>
              <p className="text-sm text-muted-foreground">
                سيظهر هنا آخر المشاريع عند إنشائها من قبل الطلاب
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 5).map((project) => (
                <div
                  key={project.id}
                  className="p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(project.status)}
                        <h5 className="font-medium text-foreground truncate">
                          {project.title}
                        </h5>
                        <Badge 
                          variant="outline" 
                          className="text-xs"
                        >
                          {getStatusText(project.status)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {project.student_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(project.updated_at), { 
                            addSuffix: true, 
                            locale: ar 
                          })}
                        </span>
                        {project.grade && (
                          <span className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            الدرجة: {project.grade}
                          </span>
                        )}
                      </div>

                      {/* شريط التقدم */}
                      <div className="flex items-center gap-2 mb-2">
                        <Progress 
                          value={project.completion_percentage} 
                          className="flex-1 h-2"
                        />
                        <span className="text-xs text-muted-foreground font-medium">
                          {project.completion_percentage}%
                        </span>
                      </div>

                      {/* التعليقات */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {project.total_comments_count} تعليق
                        </span>
                        {project.unread_comments_count > 0 && (
                          <Badge variant="destructive" className="text-xs px-2 py-0">
                            {project.unread_comments_count} جديد
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/grade12-project-editor/${project.id}`)}
                      className="h-8 w-8 p-0 ml-3"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* رابط عرض المزيد */}
        {projects.length > 5 && (
          <div className="text-center pt-4">
            <Button 
              variant="link" 
              onClick={() => navigate('/grade12-management')}
              className="text-primary"
            >
              عرض جميع المشاريع ({projects.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Grade12ProjectsWidget;