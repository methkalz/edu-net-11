import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useGrade12Projects } from '@/hooks/useGrade12Projects';
import { useGrade12DefaultTasks } from '@/hooks/useGrade12DefaultTasks';
import { ProfessionalDocumentEditor } from '@/components/editor/ProfessionalDocumentEditor';
import ProjectTasksManager from '@/components/content/ProjectTasksManager';
import { ProjectCommentsSection } from '@/components/content/ProjectCommentsSection';
import Grade12DefaultTasks from '@/components/content/Grade12DefaultTasks';
import BackButton from '@/components/shared/BackButton';

import { 
  Save, 
  Clock, 
  FileText, 
  Users,
  CheckCircle,
  Calendar,
  Upload,
  Download,
  Trophy,
  MessageSquare,
  History,
  Info,
  BarChart3,
  CheckSquare,
  MessageCircle,
  Eye,
  EyeOff,
  User
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const Grade12ProjectEditor: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, userProfile } = useAuth();
  const { projects, updateProject, saveRevision, addComment } = useGrade12Projects();
  const { phases, updateTaskCompletion, getOverallProgress } = useGrade12DefaultTasks();
  
  const [project, setProject] = useState<any>(null);
  const [content, setContent] = useState('');
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [newCommentsCount, setNewCommentsCount] = useState(0);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'editor');

  // Load project data
  useEffect(() => {
    if (projectId && projects.length > 0) {
      const foundProject = projects.find(p => p.id === projectId);
      if (foundProject) {
        setProject(foundProject);
        setContent(foundProject.project_content || '');
        // حساب عدد الكلمات الأولي
        if (foundProject.project_content) {
          try {
            const parsed = JSON.parse(foundProject.project_content);
            const text = extractTextFromTiptapContent(parsed);
            setWordCount(text.split(/\s+/).filter(word => word.length > 0).length);
            setCharacterCount(text.length);
          } catch {
            setWordCount(0);
            setCharacterCount(0);
          }
        }
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

  // دالة لاستخراج النص من محتوى TipTap
  const extractTextFromTiptapContent = (content: any): string => {
    if (!content || !content.content) return '';
    
    let text = '';
    const traverse = (node: any) => {
      if (node.type === 'text') {
        text += node.text;
      }
      if (node.content) {
        node.content.forEach(traverse);
      }
    };
    
    content.content.forEach(traverse);
    return text;
  };

  // معالجة تغيير المحتوى من المحرر
  const handleContentChange = (newContent: any, html: string, plainText: string) => {
    setContent(JSON.stringify(newContent));
    setWordCount(plainText.split(/\s+/).filter(word => word.length > 0).length);
    setCharacterCount(plainText.length);
  };

  // حفظ المحرر
  const handleEditorSave = async (newContent: any) => {
    if (!project?.id) return;
    
    setIsSaving(true);
    try {
      await updateProject(project.id, { 
        project_content: JSON.stringify(newContent)
      });
      setLastSaved(new Date());
      toast({
        title: "تم الحفظ",
        description: "تم حفظ المشروع بنجاح",
      });
    } catch (error) {
      console.error('خطأ في الحفظ:', error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ المشروع",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // حفظ يدوي
  const handleSave = async () => {
    if (!project?.id) return;
    
    setIsSaving(true);
    try {
      await updateProject(project.id, { 
        project_content: content
      });
      setLastSaved(new Date());
      toast({
        title: "تم الحفظ",
        description: "تم حفظ المشروع بنجاح",
      });
    } catch (error) {
      console.error('خطأ في الحفظ:', error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ المشروع",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
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
  const canEdit = isStudent || isTeacher;

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
                  <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    {project?.title || 'جاري التحميل...'}
                  </h1>
                  <div className="flex flex-wrap items-center gap-6 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 hover:text-foreground/80 transition-colors">
                      <User className="h-4 w-4 text-primary" />
                      <span>{project?.student_profile?.full_name || 'الطالب'}</span>
                    </div>
                    <div className="flex items-center gap-2 hover:text-foreground/80 transition-colors">
                      <Calendar className="h-4 w-4 text-secondary" />
                      <span>الموعد النهائي: {project.due_date ? format(new Date(project.due_date), 'dd/MM/yyyy', { locale: ar }) : 'غير محدد'}</span>
                    </div>
                    <div className="flex items-center gap-2 hover:text-foreground/80 transition-colors">
                      <FileText className="h-4 w-4 text-accent" />
                      <span className="font-medium">{wordCount} كلمة • {characterCount} حرف</span>
                    </div>
                    <Badge 
                      variant={
                        project?.status === 'completed' ? 'default' :
                        project?.status === 'submitted' ? 'secondary' :
                        project?.status === 'in_progress' ? 'outline' : 'destructive'
                      }
                      className="shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      {project?.status === 'completed' ? 'مكتمل' :
                       project?.status === 'submitted' ? 'مُرسل' :
                       project?.status === 'in_progress' ? 'قيد التنفيذ' : 'مسودة'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant={isPreviewMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className="gap-2 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  {isPreviewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {isPreviewMode ? 'إخفاء المعاينة' : 'معاينة'}
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  disabled={!project || isSaving}
                  className="gap-2 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? 'جاري الحفظ...' : 'حفظ'}
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
              <span className="hidden sm:inline">محرر النص</span>
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
              {newCommentsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse shadow-lg">
                  {newCommentsCount}
                </span>
              )}
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

          {/* محرر النص - مساحة مناسبة */}
          <TabsContent value="editor" className="w-full animate-fade-in">
            <div className="mx-auto max-w-5xl">
              <Card className="shadow-lg border-0 bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-sm">
                <CardContent className="p-0">
                  <div className="h-[calc(100vh-280px)] min-h-[700px]">
                    <ProfessionalDocumentEditor
                      documentId={projectId}
                      initialContent={project?.project_content ? JSON.parse(project.project_content) : undefined}
                      onContentChange={handleContentChange}
                      onSave={handleEditorSave}
                      className="h-full rounded-lg"
                      showToolbar={true}
                      enableCollaboration={false}
                      autoSave={true}
                      title={project?.title || "مشروع التخرج"}
                      wordCount={wordCount}
                      enableImagePasting={true}
                      enableImageResizing={true}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* المهام والمتطلبات */}
          <TabsContent value="tasks" className="w-full animate-fade-in">
            <div className="mx-auto max-w-6xl space-y-6">
              {/* المهام الأساسية للمشروع */}
              <Card className="shadow-lg border-0 bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <CheckSquare className="h-5 w-5 text-primary" />
                    </div>
                    المهام الأساسية للمشروع النهائي
                  </CardTitle>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    مهام أساسية يجب إنجازها لإكمال المشروع النهائي بنجاح
                  </p>
                </CardHeader>
                <CardContent className="pt-2">
                  <Grade12DefaultTasks />
                </CardContent>
              </Card>

              {/* المهام الإضافية من المعلم */}
              <Card className="shadow-lg border-0 bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 rounded-lg bg-secondary/10">
                      <Users className="h-5 w-5 text-secondary" />
                    </div>
                    مهام إضافية من المعلم
                  </CardTitle>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    مهام مخصصة أضافها المعلم لهذا المشروع
                  </p>
                </CardHeader>
                <CardContent className="pt-2">
                  <ProjectTasksManager 
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
                              <p className="text-muted-foreground text-lg leading-relaxed">{project.title}</p>
                            </div>
                            <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                              <Label className="text-base font-semibold text-foreground block mb-2">الوصف</Label>
                              <p className="text-muted-foreground leading-relaxed">{project.description || 'لا يوجد وصف'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                                <Label className="text-sm font-semibold text-foreground block mb-2">تاريخ الإنشاء</Label>
                                <p className="text-muted-foreground text-sm">
                                  {project.created_at ? format(new Date(project.created_at), 'dd/MM/yyyy HH:mm', { locale: ar }) : 'غير متاح'}
                                </p>
                              </div>
                              {project.due_date && (
                                <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                                  <Label className="text-sm font-semibold text-foreground block mb-2">تاريخ التسليم</Label>
                                  <p className="text-muted-foreground text-sm">
                                    {format(new Date(project.due_date), 'dd/MM/yyyy', { locale: ar })}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* إحصائيات المشروع */}
                      <div className="space-y-8">
                        <div className="p-6 rounded-xl bg-gradient-to-r from-muted/30 to-muted/10 border border-border/50">
                          <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-secondary/10">
                              <BarChart3 className="h-5 w-5 text-secondary" />
                            </div>
                            إحصائيات المشروع
                          </h3>
                          <div className="grid grid-cols-2 gap-4 mb-6">
                            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:shadow-md transition-all duration-200">
                              <CardContent className="p-6 text-center">
                                <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">{wordCount}</div>
                                <Label className="text-sm text-muted-foreground">عدد الكلمات</Label>
                              </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20 hover:shadow-md transition-all duration-200">
                              <CardContent className="p-6 text-center">
                                <div className="text-3xl font-bold bg-gradient-to-r from-secondary to-secondary/70 bg-clip-text text-transparent">{characterCount}</div>
                                <Label className="text-sm text-muted-foreground">عدد الأحرف</Label>
                              </CardContent>
                            </Card>
                          </div>
                          
                          {lastSaved && (
                            <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 shadow-sm">
                              <div className="flex items-center gap-3 text-sm">
                                <div className="p-1.5 rounded-full bg-green-100">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </div>
                                <span className="text-muted-foreground">آخر حفظ:</span>
                                <span className="font-medium text-green-600">
                                  {format(lastSaved, 'HH:mm:ss', { locale: ar })}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Grade12ProjectEditor;