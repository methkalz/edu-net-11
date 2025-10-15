import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useGrade10MiniProjects } from '@/hooks/useGrade10MiniProjects';
import { supabase } from '@/integrations/supabase/client';
import Grade10ProjectTasksManager from '@/components/content/Grade10ProjectTasksManager';
import { ProjectCommentsSection } from '@/components/content/ProjectCommentsSection';
import BackButton from '@/components/shared/BackButton';

import { 
  Save, 
  Clock, 
  FileText, 
  CheckCircle,
  Calendar,
  MessageCircle,
  Info,
  CheckSquare,
  Eye,
  EyeOff,
  User,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const Grade10ProjectEditor: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, userProfile } = useAuth();
  const { projects, updateProjectStatus, deleteProject } = useGrade10MiniProjects();
  
  const [project, setProject] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'editor');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Load project data
  useEffect(() => {
    if (projectId && projects.length > 0) {
      const foundProject = projects.find(p => p.id === projectId);
      if (foundProject) {
        setProject(foundProject);
      } else {
        toast({
          title: "خطأ",
          description: "لم يتم العثور على المشروع",
          variant: "destructive",
        });
        navigate(-1);
      }
    }
  }, [projectId, projects, navigate]);

  // حذف المشروع
  const handleDeleteProject = async () => {
    if (!project?.id) return;
    
    const success = await deleteProject(project.id);
    if (success) {
      navigate('/dashboard');
    }
    setShowDeleteDialog(false);
  };

  // تحديث حالة المشروع
  const handleMarkComplete = async () => {
    if (!project?.id) return;
    
    await updateProjectStatus(project.id, 'completed');
    toast({
      title: "تم التحديث",
      description: "تم تحديث حالة المشروع إلى مكتمل",
    });
  };

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل المشروع...</p>
        </div>
      </div>
    );
  }

  const isStudent = userProfile?.role === 'student';
  const isTeacher = userProfile?.role === 'teacher' || userProfile?.role === 'superadmin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/30">
      <div className="container mx-auto p-6 max-w-full">
        {/* Header مع معلومات المشروع الأساسية */}
        <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-card/90 to-card backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <BackButton />
                <div className="flex-1">
                  <h1 className="text-lg lg:text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    {project?.title || 'جاري التحميل...'}
                  </h1>
                  <div className="flex flex-wrap items-center gap-6 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 hover:text-foreground/80 transition-colors">
                      <User className="h-4 w-4 text-primary" />
                      <span>{project?.student_profile?.full_name || 'الطالب'}</span>
                    </div>
                    {project.due_date && (
                      <div className="flex items-center gap-2 hover:text-foreground/80 transition-colors">
                        <Calendar className="h-4 w-4 text-secondary" />
                        <span>الموعد النهائي: {format(new Date(project.due_date), 'dd/MM/yyyy', { locale: ar })}</span>
                      </div>
                    )}
                    <Badge
                      variant={
                        project?.status === 'completed' ? 'default' :
                        project?.status === 'in_progress' ? 'outline' : 'secondary'
                      }
                      className="shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      {project?.status === 'completed' ? 'مكتمل' :
                       project?.status === 'in_progress' ? 'قيد التنفيذ' : 'مسودة'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {project?.google_doc_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(project.google_doc_url, '_blank')}
                    className="gap-2 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <ExternalLink className="h-4 w-4" />
                    فتح في Google Docs
                  </Button>
                )}

                {isStudent && project?.status !== 'completed' && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleMarkComplete}
                    className="gap-2 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <CheckCircle className="h-4 w-4" />
                    تحديد كمكتمل
                  </Button>
                )}

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="gap-2 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <Trash2 className="h-4 w-4" />
                  حذف المشروع
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* نظام التابات الرئيسي */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 h-12 p-1 bg-muted/50 backdrop-blur-sm border shadow-sm">
            <TabsTrigger 
              value="editor" 
              className="gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md transition-all duration-200 hover:bg-background/50"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">محرر Google</span>
              <span className="sm:hidden">المحرر</span>
            </TabsTrigger>
            <TabsTrigger 
              value="tasks" 
              className="gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md transition-all duration-200 hover:bg-background/50"
            >
              <CheckSquare className="h-4 w-4" />
              <span className="hidden sm:inline">المهام والمتطلبات</span>
              <span className="sm:hidden">المهام</span>
            </TabsTrigger>
            <TabsTrigger 
              value="comments" 
              className="gap-2 relative data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md transition-all duration-200 hover:bg-background/50"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">التعليقات والملاحظات</span>
              <span className="sm:hidden">التعليقات</span>
            </TabsTrigger>
            <TabsTrigger 
              value="info" 
              className="gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md transition-all duration-200 hover:bg-background/50"
            >
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">معلومات المشروع</span>
              <span className="sm:hidden">المعلومات</span>
            </TabsTrigger>
          </TabsList>

          {/* محرر Google Docs */}
          <TabsContent value="editor" className="w-full animate-fade-in">
            <div className="mx-auto w-4/5">
              <Card className="shadow-lg border-0 bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-sm">
                <CardContent className="p-0">
                  <div className="h-[calc(100vh-200px)] min-h-[900px]">
                    {project?.google_doc_url ? (
                      <iframe
                        src={project.google_doc_url}
                        className="w-full h-full rounded-lg border-0"
                        title={project?.title || "مستند Google Docs"}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">لا يوجد مستند Google Docs</h3>
                        <p className="text-muted-foreground">
                          لم يتم ربط مستند Google Docs بهذا المشروع بعد
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* المهام والمتطلبات */}
          <TabsContent value="tasks" className="w-full animate-fade-in">
            <div className="mx-auto max-w-6xl">
              <Card className="shadow-lg border-0 bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <CheckSquare className="h-5 w-5 text-primary" />
                    </div>
                    المهام المطلوبة للمشروع
                  </CardTitle>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    المهام والمتطلبات الواجب إنجازها لإكمال المشروع المصغر
                  </p>
                </CardHeader>
                <CardContent className="pt-2">
                  <Grade10ProjectTasksManager 
                    projectId={projectId!}
                    isTeacher={isTeacher}
                    isStudent={isStudent}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* التعليقات والملاحظات */}
          <TabsContent value="comments" className="w-full animate-fade-in">
            <div className="mx-auto max-w-4xl">
              <Card className="shadow-lg border-0 bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="h-[calc(100vh-280px)] min-h-[700px] overflow-y-auto">
                    <ProjectCommentsSection 
                      projectId={projectId!}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* معلومات المشروع */}
          <TabsContent value="info" className="w-full animate-fade-in">
            <div className="mx-auto max-w-5xl">
              <Card className="shadow-lg border-0 bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="h-[calc(100vh-280px)] min-h-[700px] overflow-y-auto">
                    <div className="grid lg:grid-cols-2 gap-8">
                      {/* معلومات المشروع الأساسية */}
                      <div className="space-y-8">
                        <div className="p-6 rounded-xl bg-gradient-to-r from-muted/30 to-muted/10 border border-border/50">
                          <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Info className="h-5 w-5 text-primary" />
                            </div>
                            معلومات المشروع
                          </h3>
                          <div className="space-y-6">
                            <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                              <Label className="text-base font-semibold text-foreground block mb-2">العنوان</Label>
                              <p className="text-muted-foreground leading-relaxed">{project.title}</p>
                            </div>
                            
                            {project.description && (
                              <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                                <Label className="text-base font-semibold text-foreground block mb-2">الوصف</Label>
                                <p className="text-muted-foreground leading-relaxed">{project.description}</p>
                              </div>
                            )}

                            {project.due_date && (
                              <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                                <Label className="text-base font-semibold text-foreground block mb-2">الموعد النهائي</Label>
                                <p className="text-muted-foreground">{format(new Date(project.due_date), 'dd MMMM yyyy', { locale: ar })}</p>
                              </div>
                            )}

                            <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                              <Label className="text-base font-semibold text-foreground block mb-2">الحالة</Label>
                              <Badge
                                variant={
                                  project?.status === 'completed' ? 'default' :
                                  project?.status === 'in_progress' ? 'outline' : 'secondary'
                                }
                              >
                                {project?.status === 'completed' ? 'مكتمل' :
                                 project?.status === 'in_progress' ? 'قيد التنفيذ' : 'مسودة'}
                              </Badge>
                            </div>

                            <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                              <Label className="text-base font-semibold text-foreground block mb-2">التقدم</Label>
                              <div className="text-muted-foreground text-sm mb-2">{project.progress || 0}%</div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${project.progress || 0}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* التواريخ المهمة */}
                      <div className="space-y-8">
                        <div className="p-6 rounded-xl bg-gradient-to-r from-muted/30 to-muted/10 border border-border/50">
                          <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-secondary/10">
                              <Clock className="h-5 w-5 text-secondary" />
                            </div>
                            التواريخ المهمة
                          </h3>
                          <div className="space-y-6">
                            <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                              <Label className="text-base font-semibold text-foreground block mb-2">تاريخ الإنشاء</Label>
                              <p className="text-muted-foreground">{format(new Date(project.created_at), 'dd MMMM yyyy - hh:mm a', { locale: ar })}</p>
                            </div>

                            <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                              <Label className="text-base font-semibold text-foreground block mb-2">آخر تحديث</Label>
                              <p className="text-muted-foreground">{format(new Date(project.updated_at), 'dd MMMM yyyy - hh:mm a', { locale: ar })}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* حوار تأكيد الحذف */}
        {showDeleteDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4">
              <CardHeader>
                <CardTitle>تأكيد الحذف</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  هل أنت متأكد من حذف هذا المشروع؟ لا يمكن التراجع عن هذا الإجراء.
                </p>
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                    إلغاء
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteProject}>
                    حذف
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Grade10ProjectEditor;
