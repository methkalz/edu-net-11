import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useGrade10Projects } from '@/hooks/useGrade10Projects';
import { useGrade10DefaultTasks } from '@/hooks/useGrade10DefaultTasks';
import { ProfessionalDocumentEditor } from '@/components/editor/ProfessionalDocumentEditor';
import Grade10ProjectTasksManager from '@/components/content/Grade10ProjectTasksManager';
import { ProjectCommentsSection } from '@/components/content/ProjectCommentsSection';
import Grade10DefaultTasks from '@/components/content/Grade10DefaultTasks';
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

const Grade10ProjectEditor: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, userProfile } = useAuth();
  const { projects, updateProject, saveRevision, addComment } = useGrade10Projects();
  const { phases, updateTaskCompletion, getOverallProgress } = useGrade10DefaultTasks();
  
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
        setContent(foundProject.content || '');
        // حساب عدد الكلمات الأولي
        if (foundProject.content) {
          try {
            const parsed = JSON.parse(foundProject.content);
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
          description: "لم يتم العثور على المشروع الصغير",
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
        content: JSON.stringify(newContent)
      });
      setLastSaved(new Date());
      toast({
        title: "تم الحفظ",
        description: "تم حفظ المشروع الصغير بنجاح",
      });
    } catch (error) {
      console.error('خطأ في الحفظ:', error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ المشروع الصغير",
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
        content: content
      });
      setLastSaved(new Date());
      toast({
        title: "تم الحفظ",
        description: "تم حفظ المشروع الصغير بنجاح",
      });
    } catch (error) {
      console.error('خطأ في الحفظ:', error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ المشروع الصغير",
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
          <p className="text-muted-foreground">جاري تحميل المشروع الصغير...</p>
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
                      initialContent={project?.content ? JSON.parse(project.content) : undefined}
                      onContentChange={handleContentChange}
                      onSave={handleEditorSave}
                      className="h-full rounded-lg"
                      showToolbar={true}
                      enableCollaboration={false}
                      autoSave={true}
                      title={project?.title || "المشروع الصغير"}
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
              {/* المهام الأساسية للمشروع الصغير */}
              <Card className="shadow-lg border-0 bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <CheckSquare className="h-5 w-5 text-primary" />
                    </div>
                    المهام الأساسية للمشروع الصغير
                  </CardTitle>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    المهام الخمس الأساسية اللازمة لإكمال المشروع الصغير للصف العاشر
                  </p>
                </CardHeader>
                <CardContent className="pt-2">
                  <Grade10DefaultTasks />
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
                    مهام مخصصة أضافها المعلم لهذا المشروع الصغير
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
                            معلومات المشروع الصغير
                          </h3>
                          <div className="space-y-6">
                            <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                              <Label className="text-sm font-medium text-muted-foreground">العنوان</Label>
                              <p className="text-base font-medium mt-1">{project?.title}</p>
                            </div>
                            
                            <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                              <Label className="text-sm font-medium text-muted-foreground">الوصف</Label>
                              <p className="text-sm mt-1 leading-relaxed">{project?.description || 'لا يوجد وصف'}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                                <Label className="text-sm font-medium text-muted-foreground">الحالة</Label>
                                <Badge className="mt-2 w-full justify-center" variant={
                                  project?.status === 'completed' ? 'default' :
                                  project?.status === 'submitted' ? 'secondary' :
                                  project?.status === 'in_progress' ? 'outline' : 'destructive'
                                }>
                                  {project?.status === 'completed' ? 'مكتمل' :
                                   project?.status === 'submitted' ? 'مُرسل' :
                                   project?.status === 'in_progress' ? 'قيد التنفيذ' : 'مسودة'}
                                </Badge>
                              </div>
                              
                              <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                                <Label className="text-sm font-medium text-muted-foreground">التقييم</Label>
                                <p className="text-lg font-bold mt-1">{project?.grade ? `${project.grade}/100` : 'لم يُقيم بعد'}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* إحصائيات المحتوى */}
                        <div className="p-6 rounded-xl bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20">
                          <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-accent/10">
                              <BarChart3 className="h-5 w-5 text-accent" />
                            </div>
                            إحصائيات المحتوى
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 rounded-lg bg-background/30 border border-border/30">
                              <div className="text-2xl font-bold text-primary">{wordCount}</div>
                              <div className="text-sm text-muted-foreground">كلمة</div>
                            </div>
                            <div className="text-center p-4 rounded-lg bg-background/30 border border-border/30">
                              <div className="text-2xl font-bold text-secondary">{characterCount}</div>
                              <div className="text-sm text-muted-foreground">حرف</div>
                            </div>
                          </div>
                          {lastSaved && (
                            <div className="mt-4 p-3 rounded-lg bg-background/50 border border-border/30 text-center">
                              <div className="text-xs text-muted-foreground">آخر حفظ</div>
                              <div className="text-sm font-medium">
                                {format(lastSaved, 'dd/MM/yyyy - HH:mm', { locale: ar })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* التواريخ والمعلومات الإضافية */}
                      <div className="space-y-8">
                        <div className="p-6 rounded-xl bg-gradient-to-r from-secondary/10 to-secondary/5 border border-secondary/20">
                          <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-secondary/10">
                              <Clock className="h-5 w-5 text-secondary" />
                            </div>
                            التواريخ المهمة
                          </h3>
                          <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-background/30 border border-border/30">
                              <Label className="text-sm font-medium text-muted-foreground">تاريخ الإنشاء</Label>
                              <p className="text-sm mt-1">{project?.created_at ? format(new Date(project.created_at), 'dd/MM/yyyy - HH:mm', { locale: ar }) : 'غير محدد'}</p>
                            </div>
                            
                            <div className="p-4 rounded-lg bg-background/30 border border-border/30">
                              <Label className="text-sm font-medium text-muted-foreground">آخر تحديث</Label>
                              <p className="text-sm mt-1">{project?.updated_at ? format(new Date(project.updated_at), 'dd/MM/yyyy - HH:mm', { locale: ar }) : 'غير محدد'}</p>
                            </div>
                            
                            <div className="p-4 rounded-lg bg-background/30 border border-border/30">
                              <Label className="text-sm font-medium text-muted-foreground">الموعد النهائي</Label>
                              <p className="text-sm mt-1">{project?.due_date ? format(new Date(project.due_date), 'dd/MM/yyyy', { locale: ar }) : 'غير محدد'}</p>
                            </div>
                            
                            {project?.submitted_at && (
                              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                                <Label className="text-sm font-medium text-green-700">تاريخ التقديم</Label>
                                <p className="text-sm mt-1 text-green-600">{format(new Date(project.submitted_at), 'dd/MM/yyyy - HH:mm', { locale: ar })}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* ملاحظات المعلم */}
                        {project?.teacher_feedback && (
                          <div className="p-6 rounded-xl bg-gradient-to-r from-blue-50 to-blue-25 border border-blue-200">
                            <h3 className="text-xl font-semibold mb-4 flex items-center gap-3 text-blue-700">
                              <div className="p-2 rounded-lg bg-blue-100">
                                <MessageSquare className="h-5 w-5 text-blue-600" />
                              </div>
                              ملاحظات المعلم
                            </h3>
                            <div className="p-4 rounded-lg bg-white border border-blue-100">
                              <p className="text-sm leading-relaxed text-blue-800">{project.teacher_feedback}</p>
                            </div>
                          </div>
                        )}
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

export default Grade10ProjectEditor;