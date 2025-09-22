import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, FileText, CheckSquare, MessageSquare, Calendar, Eye, Edit3, Clock, Trash2 } from 'lucide-react';
import { useGrade10MiniProjects } from '@/hooks/useGrade10MiniProjects';
import { useAuth } from '@/hooks/useAuth';
import { ModernLoader } from '@/components/ui/ModernLoader';
import { toast } from '@/hooks/use-toast';
import Grade10MiniProjectEditor from './Grade10MiniProjectEditor';
import type { ProjectFormData } from '@/types/grade10-projects';

const Grade10MiniProjects: React.FC = () => {
  const { 
    projects, 
    loading, 
    createProject, 
    fetchProject,
    currentProject,
    setCurrentProject,
    deleteProject 
  } = useGrade10MiniProjects();
  
  const { userProfile } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isProjectEditorOpen, setIsProjectEditorOpen] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    description: '',
    due_date: ''
  });

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

    const result = await createProject(formData);
    
    if (result) {
      setFormData({ title: '', description: '', due_date: '' });
      setIsCreateDialogOpen(false);
      toast({
        title: "نجح",
        description: "تم إنشاء المشروع بنجاح"
      });
    }
  };

  const handleProjectClick = async (project: any) => {
    setCurrentProject(project);
    await fetchProject(project.id);
    setIsProjectEditorOpen(true);
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
      <div className="flex justify-center items-center h-64">
        <ModernLoader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">المشاريع المصغرة</h2>
          <p className="text-muted-foreground">إدارة المشاريع الصغيرة للصف العاشر</p>
        </div>
        
        {userProfile?.role === 'student' && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                إنشاء مشروع جديد
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
                    value={formData.due_date}
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
                  onClick={() => handleProjectClick(project)}
                >
                  <Eye className="h-4 w-4" />
                  عرض
                </Button>
                {(userProfile?.role === 'student' && project.student_id === userProfile?.user_id) && (
                  <Button 
                    size="sm" 
                    className="flex-1 gap-2"
                    onClick={() => handleProjectClick(project)}
                  >
                    <Edit3 className="h-4 w-4" />
                    تحرير
                  </Button>
                )}
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
                        حذف
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
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">لا توجد مشاريع</h3>
            <p className="text-muted-foreground mb-4">
              {userProfile?.role === 'student' 
                ? 'ابدأ بإنشاء مشروعك الأول' 
                : 'لم يتم إنشاء أي مشاريع بعد'}
            </p>
            {userProfile?.role === 'student' && (
              <Button 
                className="gap-2"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                إنشاء مشروع جديد
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mini Project Editor Dialog */}
      {currentProject && (
        <Grade10MiniProjectEditor 
          project={currentProject}
          isOpen={isProjectEditorOpen}
          onClose={() => {
            setIsProjectEditorOpen(false);
            setCurrentProject(null);
          }}
          onSave={() => {
            // Refresh projects list if needed
          }}
        />
      )}
    </div>
  );
};

export default Grade10MiniProjects;