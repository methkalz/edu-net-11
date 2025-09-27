import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Calendar,
  Zap,
  RefreshCw
} from 'lucide-react';
import { useGrade10Projects } from '@/hooks/useGrade10Projects';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const Grade10ProjectsWidget: React.FC = () => {
  const navigate = useNavigate();
  const { projects, loading, fetchProjects } = useGrade10Projects();

  // Calculate quick stats with memoization for performance
  const quickStats = useMemo(() => ({
    totalProjects: projects.length,
    completedProjects: projects.filter(p => p.status === 'completed').length,
    inProgressProjects: projects.filter(p => p.status === 'in_progress').length,
    averageCompletion: projects.length > 0 
      ? Math.round(projects.reduce((acc, p) => acc + (p.progress_percentage || 0), 0) / projects.length)
      : 0
  }), [projects]);

  const handleRefresh = () => {
    fetchProjects();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'draft':
        return <FileText className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
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
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      default:
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    }
  };

  if (loading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            مشاريع العاشر المصغرة
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
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              مشاريع العاشر المصغرة
            </CardTitle>
            <CardDescription>
              متابعة مشاريع الطلاب المصغرة وآخر التحديثات
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/grade10-management')}
          >
            عرض جميع المشاريع
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {quickStats.totalProjects}
            </div>
            <div className="text-sm text-muted-foreground">
              إجمالي المشاريع
            </div>
          </div>
          
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {quickStats.completedProjects}
            </div>
            <div className="text-sm text-muted-foreground">
              مكتملة
            </div>
          </div>
          
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {quickStats.inProgressProjects}
            </div>
            <div className="text-sm text-muted-foreground">
              قيد التنفيذ
            </div>
          </div>
          
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">
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
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد مشاريع بعد</p>
              <p className="text-sm">سيظهر هنا آخر المشاريع المصغرة عند إنشائها من قبل الطلاب</p>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.slice(0, 5).map((project) => (
                <div
                  key={project.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(project.status)}
                      <h5 className="font-medium text-foreground truncate">
                        {project.title}
                      </h5>
                      <Badge 
                        variant="secondary" 
                        className={getStatusColor(project.status)}
                      >
                        {getStatusText(project.status)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        طالب الصف العاشر
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(project.updated_at), { 
                          addSuffix: true, 
                          locale: ar 
                        })}
                      </span>
                    </div>

                    {/* شريط التقدم */}
                    <div className="flex items-center gap-2 mb-2">
                      <Progress 
                        value={project.progress_percentage} 
                        className="flex-1 h-2"
                      />
                      <span className="text-xs text-muted-foreground">
                        {project.progress_percentage}%
                      </span>
                    </div>

                    {/* معلومات إضافية */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        مشروع مصغر
                      </span>
                      {project.due_date && (
                        <span className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" />
                          موعد التسليم: {new Date(project.due_date).toLocaleDateString('ar')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/grade10-project-editor/${project.id}`)}
                      className="h-8 px-3"
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
              onClick={() => navigate('/grade10-management')}
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

export default Grade10ProjectsWidget;