import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, FileText, CheckSquare, Calendar, Edit3, Trash2, BookOpen, CheckCircle, Clock, Target, User, Trophy, FolderOpen } from 'lucide-react';
import { useGrade10MiniProjects } from '@/hooks/useGrade10MiniProjects';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { toDateTimeLocalString, fromDateTimeLocalString } from '@/utils/dateFormatting';
import type { ProjectFormData } from '@/types/grade10-projects';
import { LoadingSpinner } from '@/components/ui/LoadingComponents';
import { LottieLoader } from '@/components/ui/LottieLoader';
import loadingAnimation from '@/assets/loading-animation.json';
import { supabase } from '@/integrations/supabase/client';
import { toast as sonnerToast } from 'sonner';

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
  const [showCreationOverlay, setShowCreationOverlay] = useState(false);
  const [creationMessage, setCreationMessage] = useState('');
  const [messageKey, setMessageKey] = useState(0);
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

  const handleQuickCreateProject = async () => {
    try {
      setShowCreationOverlay(true);
      setMessageKey(0);
      
      // المرحلة 1: جارٍ إنشاء المشروع
      setCreationMessage('جارٍ إنشاء مشروعك المصغر..');
      setMessageKey(1);
      await new Promise(resolve => setTimeout(resolve, 1800));
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setShowCreationOverlay(false);
        sonnerToast.error('يجب تسجيل الدخول أولاً');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      const studentName = profile?.full_name || 'الطالب';
      const projectTitle = `مشروع ${studentName} المصغر`;

      // المرحلة 2: إنشاء ميني برويكت
      setCreationMessage('يتم إنشاء ميني برويكت الخاص بك..');
      setMessageKey(2);
      await new Promise(resolve => setTimeout(resolve, 1800));
      
      // إنشاء المشروع مع Google Doc
      await createProject({
        title: projectTitle,
        description: 'مشروعي المصغر للصف العاشر',
        due_date: '',
        createGoogleDoc: true
      });
      
      // المرحلة 3: اللمسات النهائية
      setCreationMessage('اللمسات النهائية..');
      setMessageKey(3);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // المرحلة 4: جاهز
      setCreationMessage('جاهز.. يمكنك أن تبدأ الآن');
      setMessageKey(4);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setShowCreationOverlay(false);
    } catch (error: any) {
      setShowCreationOverlay(false);
      sonnerToast.error(error.message || 'فشل في إنشاء المشروع');
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

  if (loading) {
    return <LoadingSpinner message="جاري تحميل المشاريع المصغرة..." size="lg" />;
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
          <div className="flex gap-2">
            {isStudent && (
              <Button 
                onClick={handleQuickCreateProject}
                className="gap-2 bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                بدء مشروع مصغر
              </Button>
            )}
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant={isStudent ? "outline" : "default"} className="gap-2">
                  <Plus className="h-4 w-4" />
                  {isTeacher ? 'إضافة مشروع جديد' : 'إنشاء مع خيارات متقدمة'}
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
          </div>
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

      {/* Projects List */}
      {projects.length === 0 ? (
        <Card className="border-none shadow-xl bg-gradient-to-br from-background/50 to-background backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-20 px-6">
            {/* Icon with gradient background */}
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-3xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-amber-500 to-orange-500 p-6 rounded-3xl shadow-2xl">
                <FolderOpen className="h-16 w-16 text-white" strokeWidth={1.5} />
              </div>
            </div>
            
            {/* Title and Description */}
            <div className="text-center space-y-3 mb-8 max-w-md">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {isTeacher ? 'لا توجد مشاريع حتى الآن' : 'لم تبدأ بمشروعك المصغر بعد'}
              </h3>
              <p className="text-muted-foreground leading-relaxed text-base">
                {isTeacher 
                  ? 'ابدأ بإضافة المشاريع المصغرة للطلاب وتابع تقدمهم'
                  : 'ابدأ المشروع النصي الآن وتابع المهام وتاريخ التسليم'
                }
              </p>
            </div>
            
            {/* Action Button */}
            {isStudent ? (
              <Button 
                onClick={handleQuickCreateProject}
                size="lg"
                className="gap-2 px-8 py-6 text-lg font-medium shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-0"
              >
                <Plus className="h-6 w-6" />
                ابدأ الآن
              </Button>
            ) : (
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                size="lg"
                className="gap-2 px-8 py-6 text-lg font-medium shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <Plus className="h-6 w-6" />
                إضافة مشروع جديد
              </Button>
            )}
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
                    
                    {isTeacher && project.student_id && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>الطالب: {project.student_id}</span>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
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
                      
                      {/* Delete Button - visible to project owner or admins */}
                      {((userProfile?.role === 'student' && project.student_id === userProfile?.user_id) ||
                        ['teacher', 'school_admin', 'superadmin'].includes(userProfile?.role || '')) && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="destructive"
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
                                  هذا الإجراء لا يمكن التراجع عنه وسيتم حذف جميع البيانات المرتبطة بالمشروع.
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
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Creation Overlay */}
      {showCreationOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md animate-fade-in">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-700/50 max-w-md w-full mx-4">
            <div className="flex flex-col items-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"></div>
                <LottieLoader 
                  animationData={loadingAnimation}
                  loop={true}
                  className="w-32 h-32 relative z-10"
                />
              </div>
              <div 
                key={messageKey}
                className="text-center animate-[slideUpFadeIn_0.6s_ease-out]"
              >
                <p className="text-xl font-semibold text-white mb-2">
                  {creationMessage}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Grade10MiniProjects;