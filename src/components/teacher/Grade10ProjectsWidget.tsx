import React, { useMemo, useEffect, useState } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const Grade10ProjectsWidget: React.FC = () => {
  const navigate = useNavigate();
  const { projects, loading, fetchProjects } = useGrade10Projects();
  const [projectsWithProgress, setProjectsWithProgress] = useState<any[]>([]);

  // جلب المهام وحساب التقدم لكل مشروع
  useEffect(() => {
    const fetchTasksAndCalculateProgress = async () => {
      if (projects.length === 0) return;

      const projectsData = await Promise.all(
        projects.map(async (project) => {
          try {
            const { data: tasks, error } = await supabase
              .from('grade10_project_tasks')
              .select('*')
              .eq('project_id', project.id);

            if (error) throw error;

            const completedTasks = tasks?.filter(task => task.is_completed).length || 0;
            const totalTasks = tasks?.length || 0;
            const calculatedProgress = totalTasks > 0 
              ? Math.round((completedTasks / totalTasks) * 100) 
              : 0;

            return {
              ...project,
              calculated_progress: calculatedProgress
            };
          } catch (error) {
            console.error('Error fetching tasks for project:', project.id, error);
            return {
              ...project,
              calculated_progress: 0
            };
          }
        })
      );

      setProjectsWithProgress(projectsData);
    };

    fetchTasksAndCalculateProgress();
  }, [projects]);

  // Calculate quick stats with memoization for performance
  const quickStats = useMemo(() => ({
    totalProjects: projectsWithProgress.length,
    completedProjects: projectsWithProgress.filter(p => p.status === 'completed').length,
    inProgressProjects: projectsWithProgress.filter(p => p.status === 'in_progress').length,
    averageCompletion: projectsWithProgress.length > 0 
      ? Math.round(projectsWithProgress.reduce((acc, p) => acc + (p.calculated_progress || 0), 0) / projectsWithProgress.length)
      : 0
  }), [projectsWithProgress]);

  const handleRefresh = () => {
    fetchProjects();
  };

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
    <Card className="border border-divider/60 bg-gradient-to-br from-surface-light to-card shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center border-2 border-primary/15 cursor-pointer hover:scale-105 transition-all duration-200"
              onClick={() => navigate('/grade10-projects-management')}
            >
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-medium text-foreground cursor-pointer hover:text-primary transition-colors"
                onClick={() => navigate('/grade10-projects-management')}
              >
                مشاريع العاشر المصغرة
              </CardTitle>
              <CardDescription className="text-sm text-text-soft">
                متابعة مشاريع الطلاب المصغرة وآخر التحديثات
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-5 bg-gradient-to-br from-blue-50/30 to-blue-50/10 rounded-2xl border-2 border-blue-100/40">
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
          
          <div className="text-center p-5 bg-gradient-to-br from-emerald-50/30 to-emerald-50/10 rounded-2xl border-2 border-emerald-100/40">
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
          
          <div className="text-center p-5 bg-gradient-to-br from-amber-50/30 to-amber-50/10 rounded-2xl border-2 border-amber-100/40">
            <div className="flex items-center justify-center mb-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100/40 flex items-center justify-center">
                <Clock className="h-4 w-4 text-amber-600/70" />
              </div>
            </div>
            <div className="text-2xl font-semibold text-foreground mb-1">
              {quickStats.inProgressProjects}
            </div>
            <div className="text-xs text-text-soft font-medium">
              قيد التنفيذ
            </div>
          </div>
          
          <div className="text-center p-5 bg-gradient-to-br from-violet-50/30 to-violet-50/10 rounded-2xl border-2 border-violet-100/40">
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
            <div className="w-5 h-5 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="h-3 w-3 text-primary" />
            </div>
            آخر المشاريع المحدّثة
          </h4>
          
          {projectsWithProgress.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
                <Zap className="h-8 w-8 text-primary/40" />
              </div>
              <h3 className="font-medium text-foreground mb-2">لا توجد مشاريع بعد</h3>
              <p className="text-sm text-text-soft">
                سيظهر هنا آخر المشاريع المصغرة عند إنشائها من قبل الطلاب
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {projectsWithProgress.slice(0, 5).map((project) => (
                <div
                  key={project.id}
                  className="p-5 border-2 border-divider/50 rounded-2xl hover:bg-surface-hover hover:border-primary/30 transition-all duration-200"
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
                          className={`text-xs px-2 py-1 ${getStatusColor(project.status)}`}
                        >
                          {getStatusText(project.status)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-text-soft mb-4">
                        <span className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          طالب الصف العاشر
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDistanceToNow(new Date(project.updated_at), { 
                            addSuffix: true, 
                            locale: ar 
                          })}
                        </span>
                      </div>

                      {/* شريط التقدم */}
                      <div className="flex items-center gap-3 mb-3">
                        <Progress 
                          value={project.calculated_progress || 0} 
                          className="flex-1 h-2 bg-surface-light"
                        />
                        <span className="text-xs text-text-soft font-semibold min-w-[35px]">
                          {project.calculated_progress || 0}%
                        </span>
                      </div>

                      {/* معلومات إضافية */}
                      <div className="flex items-center gap-4 text-xs text-text-soft">
                        <span className="flex items-center gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5" />
                          مشروع مصغر
                        </span>
                        {project.due_date && (
                          <span className="flex items-center gap-1.5">
                            <BarChart3 className="h-3.5 w-3.5" />
                            موعد التسليم: {new Date(project.due_date).toLocaleDateString('ar')}
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/grade10-project-editor/${project.id}`)}
                      className="h-9 w-9 p-0 ml-4 hover:bg-primary/10 rounded-xl"
                    >
                      <Eye className="h-4 w-4 text-primary" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* رابط عرض المزيد */}
        {projectsWithProgress.length > 5 && (
          <div className="text-center pt-4">
            <Button 
              variant="link" 
              onClick={() => navigate('/grade10-projects-management')}
              className="text-primary"
            >
              عرض جميع المشاريع ({projectsWithProgress.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Grade10ProjectsWidget;