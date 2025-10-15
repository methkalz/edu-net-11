import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, FileText, CheckSquare, Calendar, Edit3, Trash2, BookOpen, CheckCircle, Clock, Target, User, Trophy } from 'lucide-react';
import { useGrade10MiniProjects } from '@/hooks/useGrade10MiniProjects';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { toDateTimeLocalString, fromDateTimeLocalString } from '@/utils/dateFormatting';
import type { ProjectFormData } from '@/types/grade10-projects';

const Grade10MiniProjects: React.FC = () => {
  const navigate = useNavigate();
  const { 
    projects, 
    tasks,
    loading, 
    createProject, 
    deleteProject 
  } = useGrade10MiniProjects();
  
  const { userProfile } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    description: '',
    due_date: ''
  });

  const isTeacher = userProfile?.role === 'teacher' || userProfile?.role === 'school_admin' || userProfile?.role === 'superadmin';
  const isStudent = userProfile?.role === 'student';

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "خطأ",
        description: "يجب إدخال عنوان المشروع",
        variant: "destructive"
      });
      return;
    }

    // تحويل التاريخ من datetime-local إلى ISO
    const projectData = {
      ...formData,
      due_date: formData.due_date ? fromDateTimeLocalString(formData.due_date) : ''
    };

    const result = await createProject(projectData);
    
    if (result) {
      setFormData({ title: '', description: '', due_date: '' });
      setIsCreateDialogOpen(false);
      toast({
        title: "نجح",
        description: "تم إنشاء المشروع بنجاح"
      });
    }
  };

  // التوجيه إلى صفحة المحرر المنفصلة
  const handleEditProject = (project: any) => {
    navigate(`/grade10-project-editor/${project.id}`);
  };

  // حساب نسبة التقدم للمشروع
  const calculateProjectProgress = (projectId: string): number => {
    const projectTasks = tasks.filter(task => task.project_id === projectId);
    if (projectTasks.length === 0) return 0;
    
    const completedTasks = projectTasks.filter(task => task.is_completed);
    return Math.round((completedTasks.length / projectTasks.length) * 100);
  };

  const handleDeleteProject = async (projectId: string, projectTitle: string) => {
    const success = await deleteProject(projectId);
    if (success) {
      toast({
        title: "تم الحذف",
        description: `تم حذف المشروع "${projectTitle}" بنجاح`
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'in_progress':
        return 'outline';
      case 'completed':
        return 'default';
      case 'reviewed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'مسودة';
      case 'in_progress':
        return 'قيد التنفيذ';
      case 'completed':
        return 'مكتمل';
      case 'reviewed':
        return 'تم المراجعة';
      default:
        return status;
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
          <h2 className="text-2xl font-bold text-foreground">المشاريع المصغرة</h2>
          <p className="text-muted-foreground">
            {isTeacher ? 'إدارة المشاريع المصغرة للطلاب' : 'مشاريعك المصغرة للصف العاشر'}
          </p>
        </div>
        
        {(isTeacher || (isStudent && projects.length === 0)) && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {isTeacher ? 'إضافة مشروع جديد' : 'بدء مشروعي المصغر'}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>إنشاء مشروع مصغر جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">عنوان المشروع *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="اكتب عنوان المشروع"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">وصف المشروع</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="وصف مختصر عن المشروع"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="due_date">موعد التسليم</Label>
                  <Input
                    id="due_date"
                    type="datetime-local"
                    value={toDateTimeLocalString(formData.due_date)}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">إنشاء المشروع</Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
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
                    {projects.filter(p => p.status === 'in_progress').length}
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
                  <p className="text-sm text-muted-foreground">متوسط التقدم</p>
                  <p className="text-2xl font-bold">
                    {projects.length > 0 
                      ? Math.round(projects.reduce((sum, p) => sum + p.progress_percentage, 0) / projects.length)
                      : 0
                    }%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Demo Notice for SuperAdmin */}
      {userProfile?.role === 'superadmin' && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <CardHeader className="pb-3">
            <CardTitle className="text-amber-800 dark:text-amber-200 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              عرض النموذج - للسوبر آدمن
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-700 dark:text-amber-300 text-sm mb-4">
              هذا عرض تجريبي لنظام المشاريع المصغرة. يمكن للطلاب إنشاء مشاريع نصية مع إمكانية رفع الصور، 
              وإدارة قائمة المهام، وتلقي التعليقات من المعلمين.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-amber-800 dark:text-amber-200">للطلاب:</h4>
                <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                  <li>• إنشاء مشاريع نصية</li>
                  <li>• رفع الصور والملفات</li>
                  <li>• إدارة قائمة المهام</li>
                  <li>• تتبع التقدم</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-amber-800 dark:text-amber-200">للمعلمين:</h4>
                <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                  <li>• متابعة تقدم الطلاب</li>
                  <li>• إضافة مهام جديدة</li>
                  <li>• إعطاء ملاحظات</li>
                  <li>• مراجعة المشاريع</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg line-clamp-1">{project.title}</CardTitle>
                <Badge variant={getStatusBadgeVariant(project.status)}>
                  {getStatusText(project.status)}
                </Badge>
              </div>
              {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
              )}
            </CardHeader>
            
            <CardContent className="space-y-3">
              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>التقدم</span>
                  <span>{project.progress_percentage}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${project.progress_percentage}%` }}
                  />
                </div>
              </div>

              {/* Project Actions */}
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 gap-2"
                  onClick={() => handleEditProject(project)}
                >
                  <Edit3 className="h-4 w-4" />
                  تحرير المشروع
                </Button>
                {/* Delete Button - visible to project owner or admins */}
                {((userProfile?.role === 'student' && project.student_id === userProfile?.user_id) ||
                  ['teacher', 'school_admin', 'superadmin'].includes(userProfile?.role || '')) && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد حذف المشروع</AlertDialogTitle>
                        <AlertDialogDescription>
                          هل أنت متأكد من حذف المشروع "{project.title}"؟
                          <br />
                          <strong className="text-destructive">
                            هذا الإجراء لا يمكن التراجع عنه وسيتم حذف جميع البيانات المرتبطة بالمشروع (المهام، التعليقات، الملفات).
                          </strong>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteProject(project.id, project.title)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          حذف المشروع
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>

              {/* Due Date */}
              {project.due_date && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>موعد التسليم: {new Date(project.due_date).toLocaleDateString('en-GB')}</span>
                </div>
              )}

              {/* Created Date */}
              <div className="text-xs text-muted-foreground pt-2 border-t">
                تم الإنشاء: {new Date(project.created_at).toLocaleDateString('en-GB')}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {projects.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {isTeacher ? 'لا توجد مشاريع حتى الآن' : 'لم تبدأ مشروعك المصغر بعد'}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {isTeacher 
                ? 'ابدأ بإضافة المشاريع المصغرة للطلاب'
                : 'ابدأ الآن في العمل على مشروعك المصغر'
              }
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              {isTeacher ? 'إضافة مشروع جديد' : 'بدء مشروعي المصغر'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Grade10MiniProjects;