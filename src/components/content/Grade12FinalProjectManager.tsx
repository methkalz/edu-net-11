import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useGrade12Projects } from '@/hooks/useGrade12Projects';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  Edit3,
  Eye,
  FileText,
  MessageSquare,
  Plus,
  Target,
  User,
  AlertCircle,
  Trophy,
  Download
} from 'lucide-react';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import Grade12FinalProjectForm from './Grade12FinalProjectForm';

const Grade12FinalProjectManager: React.FC = () => {
  const { userProfile } = useAuth();
  const {
    projects,
    tasks,
    loading,
    fetchProjects,
    fetchTasks,
    createProject,
    updateProject,
  } = useGrade12Projects();

  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);

  const isTeacher = userProfile?.role === 'teacher' || userProfile?.role === 'school_admin' || userProfile?.role === 'superadmin';

  useEffect(() => {
    if (userProfile) {
      fetchProjects();
    }
  }, [userProfile]);

  // حساب نسبة التقدم للمشروع
  const calculateProjectProgress = (projectId: string): number => {
    const projectTasks = tasks.filter(task => task.project_id === projectId);
    if (projectTasks.length === 0) return 0;
    
    const completedTasks = projectTasks.filter(task => task.is_completed);
    return Math.round((completedTasks.length / projectTasks.length) * 100);
  };

  // الحصول على لون الحالة
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'submitted': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'reviewed': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // الحصول على نص الحالة
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'draft': return 'مسودة';
      case 'in_progress': return 'قيد التنفيذ';
      case 'submitted': return 'تم التسليم';
      case 'completed': return 'مكتمل';
      case 'reviewed': return 'تم المراجعة';
      default: return 'غير محدد';
    }
  };

  // إنشاء مشروع جديد
  const handleCreateProject = async (projectData: any) => {
    try {
      logger.debug('Manager creating project', { projectData, userId: userProfile?.user_id });
      await createProject(projectData);
      setShowProjectForm(false);
      toast.success('تم إنشاء المشروع النهائي بنجاح');
      logger.info('Project created successfully in manager');
    } catch (error: any) {
      logger.error('Error creating project in manager', error);
      toast.error(error.message || 'فشل في إنشاء المشروع');
    }
  };

  // تحرير المشروع - التوجيه إلى الصفحة المنفصلة
  const navigate = useNavigate();
  const handleEditProject = (project: any) => {
    navigate(`/grade12-project-editor/${project.id}`);
  };

  // تحديث حالة المشروع
  const handleUpdateProjectStatus = async (projectId: string, status: string) => {
    try {
      await updateProject(projectId, { status });
      toast.success('تم تحديث حالة المشروع');
    } catch (error) {
      logger.error('Error updating project status', error as Error);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-5/6"></div>
                <div className="h-8 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">المشاريع النهائية</h2>
          <p className="text-muted-foreground">
            {isTeacher ? 'إدارة مشاريع الطلاب النهائية' : 'مشروعك النهائي للتخرج'}
          </p>
        </div>
        
        {(isTeacher || projects.length === 0) && (
          <Button onClick={() => setShowProjectForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {isTeacher ? 'إضافة مشروع جديد' : 'بدء مشروعي النهائي'}
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      {isTeacher && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي المشاريع</p>
                  <p className="text-2xl font-bold">{projects.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">مكتملة</p>
                  <p className="text-2xl font-bold">
                    {projects.filter(p => p.status === 'completed' || p.status === 'reviewed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">قيد التنفيذ</p>
                  <p className="text-2xl font-bold">
                    {projects.filter(p => p.status === 'in_progress' || p.status === 'submitted').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Trophy className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">متوسط الدرجات</p>
                  <p className="text-2xl font-bold">
                    {projects.filter(p => p.grade).length > 0 
                      ? Math.round(projects.reduce((sum, p) => sum + (p.grade || 0), 0) / projects.filter(p => p.grade).length)
                      : '-'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Projects List */}
      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {isTeacher ? 'لا توجد مشاريع حتى الآن' : 'لم تبدأ مشروعك النهائي بعد'}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {isTeacher 
                ? 'ابدأ بإضافة المشاريع النهائية للطلاب'
                : 'ابدأ الآن في العمل على مشروعك النهائي للتخرج'
              }
            </p>
            <Button onClick={() => setShowProjectForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              {isTeacher ? 'إضافة مشروع جديد' : 'بدء مشروعي النهائي'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((project) => {
            const progress = calculateProjectProgress(project.id);
            
            return (
              <Card key={project.id} className="hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{project.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {project.description || 'لا يوجد وصف'}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(project.status)}>
                      {getStatusText(project.status)}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">التقدم</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  
                  <Separator />
                  
                  {/* Project Info */}
                  <div className="space-y-2 text-sm">
                    {project.due_date && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          موعد التسليم: {format(new Date(project.due_date), 'dd MMM yyyy', { locale: ar })}
                        </span>
                      </div>
                    )}
                    
                    {project.grade && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Target className="h-4 w-4" />
                        <span>الدرجة: {project.grade}</span>
                      </div>
                    )}
                    
                    {isTeacher && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>الطالب: {project.student_id}</span>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditProject(project)}
                      className="flex-1 gap-2"
                    >
                      <Edit3 className="h-4 w-4" />
                      تحرير المشروع
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Project Form Modal */}
      {showProjectForm && (
        <Grade12FinalProjectForm
          onSave={handleCreateProject}
          onClose={() => setShowProjectForm(false)}
          initialData={editingProject}
        />
      )}
    </div>
  );
};

export default Grade12FinalProjectManager;