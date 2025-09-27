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
    <Card className="border-0 bg-gradient-to-br from-surface-light to-card shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-secondary/5 to-secondary/10 flex items-center justify-center border border-secondary/10">
              <FileText className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <CardTitle className="text-lg font-medium text-foreground">
                مشاريع الثاني عشر
              </CardTitle>
              <CardDescription className="text-sm text-text-soft">
                متابعة مشاريع الطلاب وآخر التحديثات
              </CardDescription>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/grade12-management')}
            className="text-sm border-divider hover:bg-surface-hover"
          >
            عرض الكل
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-5 bg-gradient-to-br from-blue-50/30 to-blue-50/10 rounded-2xl border border-blue-100/30">
            <div className="flex items-center justify-center mb-3">
              <div className="w-8 h-8 rounded-xl bg-blue-100/40 flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600/70" />
              </div>
            </div>
            <div className="text-2xl font-semibold text-foreground mb-1">
              {quickStats.totalProjects}
            </div>
            <div className="text-xs text-text-soft font-medium">
              إجمالي المشاريع
            </div>
          </div>
          
          <div className="text-center p-5 bg-gradient-to-br from-emerald-50/30 to-emerald-50/10 rounded-2xl border border-emerald-100/30">
            <div className="flex items-center justify-center mb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100/40 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-emerald-600/70" />
              </div>
            </div>
            <div className="text-2xl font-semibold text-foreground mb-1">
              {quickStats.completedProjects}
            </div>
            <div className="text-xs text-text-soft font-medium">
              مكتملة
            </div>
          </div>
          
          <div className="text-center p-5 bg-gradient-to-br from-orange-50/30 to-orange-50/10 rounded-2xl border border-orange-100/30">
            <div className="flex items-center justify-center mb-3">
              <div className="w-8 h-8 rounded-xl bg-orange-100/40 flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-orange-600/70" />
              </div>
            </div>
            <div className="text-2xl font-semibold text-foreground mb-1">
              {quickStats.unreadCommentsTotal}
            </div>
            <div className="text-xs text-text-soft font-medium">
              تعليقات جديدة
            </div>
          </div>
          
          <div className="text-center p-5 bg-gradient-to-br from-violet-50/30 to-violet-50/10 rounded-2xl border border-violet-100/30">
            <div className="flex items-center justify-center mb-3">
              <div className="w-8 h-8 rounded-xl bg-violet-100/40 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-violet-600/70" />
              </div>
            </div>
            <div className="text-2xl font-semibold text-foreground mb-1">
              {quickStats.averageCompletion}%
            </div>
            <div className="text-xs text-text-soft font-medium">
              متوسط الإنجاز
            </div>
          </div>
        </div>

        <Separator />

        {/* قائمة المشاريع الحديثة */}
        <div>
          <h4 className="text-sm font-medium text-text-soft mb-5 flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Clock className="h-3 w-3 text-secondary" />
            </div>
            آخر المشاريع المحدّثة
          </h4>
          
          {projects.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-gradient-to-br from-secondary/5 to-secondary/10 flex items-center justify-center">
                <FileText className="h-8 w-8 text-secondary/40" />
              </div>
              <h3 className="font-medium text-foreground mb-2">لا توجد مشاريع بعد</h3>
              <p className="text-sm text-text-soft">
                سيظهر هنا آخر المشاريع عند إنشائها من قبل الطلاب
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 5).map((project) => (
                <div
                  key={project.id}
                  className="p-5 border border-divider rounded-2xl hover:bg-surface-hover hover:border-secondary/20 transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-7 h-7 rounded-xl bg-surface-light flex items-center justify-center">
                          {getStatusIcon(project.status)}
                        </div>
                        <h5 className="font-medium text-foreground truncate flex-1">
                          {project.title}
                        </h5>
                        <Badge 
                          variant="outline" 
                          className="text-xs px-2 py-1"
                        >
                          {getStatusText(project.status)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-text-soft mb-4">
                        <span className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          {project.student_name}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDistanceToNow(new Date(project.updated_at), { 
                            addSuffix: true, 
                            locale: ar 
                          })}
                        </span>
                        {project.grade && (
                          <span className="flex items-center gap-1.5">
                            <BarChart3 className="h-3.5 w-3.5" />
                            الدرجة: {project.grade}
                          </span>
                        )}
                      </div>

                      {/* شريط التقدم */}
                      <div className="flex items-center gap-3 mb-3">
                        <Progress 
                          value={project.completion_percentage} 
                          className="flex-1 h-2 bg-surface-light"
                        />
                        <span className="text-xs text-text-soft font-semibold min-w-[35px]">
                          {project.completion_percentage}%
                        </span>
                      </div>

                      {/* التعليقات */}
                      <div className="flex items-center gap-4 text-xs text-text-soft">
                        <span className="flex items-center gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {project.total_comments_count} تعليق
                        </span>
                        {project.unread_comments_count > 0 && (
                          <Badge variant="destructive" className="text-xs px-2 py-0 bg-red-500/10 text-red-600 border-red-200">
                            {project.unread_comments_count} جديد
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/grade12-project-editor/${project.id}`)}
                      className="h-9 w-9 p-0 ml-4 hover:bg-secondary/10 rounded-xl"
                    >
                      <Eye className="h-4 w-4 text-secondary" />
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