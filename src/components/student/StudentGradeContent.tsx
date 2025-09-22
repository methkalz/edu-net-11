import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudentContent } from '@/hooks/useStudentContent';
import { useStudentProgress } from '@/hooks/useStudentProgress';
import { useGrade10MiniProjects } from '@/hooks/useGrade10MiniProjects';
import { useGrade12Projects } from '@/hooks/useGrade12Projects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { VideoViewer } from './viewers/VideoViewer';
import { DocumentViewer } from './viewers/DocumentViewer';
import { LessonViewer } from './viewers/LessonViewer';
import { ProjectViewer } from './viewers/ProjectViewer';
import AdvancedProjectEditor from '../content/AdvancedProjectEditor';
import { 
  Play, 
  FileText, 
  FolderOpen, 
  Clock, 
  CheckCircle, 
  Star,
  BookOpen,
  Video,
  Download,
  ExternalLink,
  Trophy,
  Target,
  Sparkles,
  Plus,
  Edit3
} from 'lucide-react';
import { toast } from 'sonner';
import type { ProjectFormData } from '@/types/grade10-projects';

export const StudentGradeContent: React.FC = () => {
  const { 
    gradeContent, 
    assignedGrade, 
    loading,
    error
  } = useStudentContent();
  const { updateProgress } = useStudentProgress();
  const { 
    projects: miniProjects,
    createProject,
    fetchProject,
    currentProject,
    setCurrentProject,
    loading: projectsLoading
  } = useGrade10MiniProjects();
  
  const { 
    projects: finalProjects,
    createProject: createFinalProject,
    currentProject: currentFinalProject,
    setCurrentProject: setCurrentFinalProject,
    loading: finalProjectsLoading
  } = useGrade12Projects();
  
  const [activeContentTab, setActiveContentTab] = useState('videos');
  
  // Viewer states
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [viewerType, setViewerType] = useState<'video' | 'document' | 'lesson' | 'project' | null>(null);
  
  // Mini Project states
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false);
  const [isProjectEditorOpen, setIsProjectEditorOpen] = useState(false);
  const [projectFormData, setProjectFormData] = useState<ProjectFormData>({
    title: '',
    description: '',
    due_date: ''
  });

  // Final Project states for Grade 12
  const [isCreateFinalProjectDialogOpen, setIsCreateFinalProjectDialogOpen] = useState(false);
  const [finalProjectFormData, setFinalProjectFormData] = useState({
    title: '',
    description: '',
    due_date: ''
  });

  const navigate = useNavigate();

  const currentContent = gradeContent;

  const handleContentClick = (content: any, contentType: 'video' | 'document' | 'lesson' | 'project') => {
    if (contentType === 'project' && assignedGrade === '10') {
      // Handle mini project differently
      handleMiniProjectClick(content);
    } else if (contentType === 'project' && assignedGrade === '12') {
      // Handle final project differently
      handleFinalProjectClick(content);
    } else {
      setSelectedContent(content);
      setViewerType(contentType);
    }
  };

  const handleContentProgress = async (contentId: string, contentType: any, progress: number, timeSpent: number) => {
    try {
      await updateProgress(contentId, contentType, progress, timeSpent, 0);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleContentComplete = async (contentId: string, contentType: any, timeSpent: number) => {
    try {
      const pointsMap = {
        video: 10,
        document: 5,
        lesson: 15,
        project: 25
      };

      const points = pointsMap[contentType] || 5;
      
      await updateProgress(contentId, contentType, 100, timeSpent, points);
      
      toast.success(`تم إكمال ${selectedContent?.title} بنجاح! +${points} نقطة`, {
        description: 'تم تسجيل تقدمك في النظام'
      });
    } catch (error) {
      toast.error('حدث خطأ في تسجيل التقدم');
    }
  };

  
  // Handle mini project creation
  const handleCreateMiniProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectFormData.title.trim()) {
      toast.error('يجب إدخال عنوان المشروع');
      return;
    }

    const result = await createProject(projectFormData);
    
    if (result) {
      setProjectFormData({ title: '', description: '', due_date: '' });
      setIsCreateProjectDialogOpen(false);
      toast.success('تم إنشاء المشروع بنجاح');
    }
  };

  // Handle mini project click
  const handleMiniProjectClick = async (project: any) => {
    setCurrentProject(project);
    await fetchProject(project.id);
    setIsProjectEditorOpen(true);
  };

  // Handle final project creation for Grade 12
  const handleCreateFinalProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!finalProjectFormData.title.trim()) {
      toast.error('يجب إدخال عنوان المشروع النهائي');
      return;
    }

    const result = await createFinalProject({
      ...finalProjectFormData,
      project_content: '',
      status: 'draft'
    });
    
    if (result) {
      setFinalProjectFormData({ title: '', description: '', due_date: '' });
      setIsCreateFinalProjectDialogOpen(false);
      toast.success('تم إنشاء المشروع النهائي بنجاح');
    }
  };

  // Handle final project click - navigate to full page editor
  const handleFinalProjectClick = async (project: any) => {
    navigate(`/grade12-project-editor/${project.id}`);
  };

  const closeViewer = () => {
    setSelectedContent(null);
    setViewerType(null);
  };

  const ContentCard: React.FC<{ 
    item: any; 
    type: 'video' | 'document' | 'lesson' | 'project';
    icon: any;
    color: string;
  }> = ({ item, type, icon: IconComponent, color }) => {
    const progress = item.progress?.progress_percentage || 0;
    const isCompleted = progress >= 100;

    return (
      <Card className="group hover:shadow-lg transition-all duration-300 border border-border/50 overflow-hidden">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header with icon and title */}
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${color} flex items-center justify-center flex-shrink-0`}>
                <IconComponent className="w-5 h-5 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground line-clamp-2 text-base mb-1">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>

              {isCompleted && (
                <div className="flex items-center gap-1 text-green-600 flex-shrink-0">
                  <CheckCircle className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Progress bar (only if there's progress) */}
            {progress > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">التقدم</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Bottom info and action */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                {item.duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{item.duration}</span>
                  </div>
                )}
                {item.progress?.points_earned && (
                  <div className="flex items-center gap-1 text-yellow-600">
                    <Star className="w-3 h-3" />
                    <span>{item.progress.points_earned}</span>
                  </div>
                )}
              </div>

              <Button
                size="sm"
                onClick={() => handleContentClick(item, type)}
                className="shrink-0"
              >
                {isCompleted ? 'مراجعة' : 'ابدأ'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-6 bg-muted rounded mb-2"></div>
                <div className="h-8 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="text-center p-8">
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <ExternalLink className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold">حدث خطأ في تحميل المحتوى</h3>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => window.location.reload()}>
            إعادة المحاولة
          </Button>
        </div>
      </Card>
    );
  }

  if (!currentContent) {
    return (
      <Card className="text-center p-8">
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
            <FolderOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">لا يوجد محتوى متاح</h3>
          <p className="text-muted-foreground">
            لا يوجد محتوى متاح للصف {assignedGrade} حالياً
          </p>
        </div>
      </Card>
    );
  }

  // Merge projects based on grade
  const allProjects = assignedGrade === '10' 
    ? [...(currentContent?.projects || []), ...(miniProjects || [])]
    : assignedGrade === '12'
    ? [...(currentContent?.projects || []), ...(finalProjects || [])]
    : currentContent?.projects || [];

  const contentTabs = [
    {
      id: 'videos',
      label: 'الفيديوهات',
      icon: Video,
      count: currentContent?.videos?.length || 0,
      items: currentContent?.videos || [],
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'documents',
      label: 'المستندات',
      icon: FileText,
      count: currentContent?.documents?.length || 0,
      items: currentContent?.documents || [],
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'lessons',
      label: 'الدروس',
      icon: BookOpen,
      count: currentContent?.lessons?.length || 0,
      items: currentContent?.lessons || [],
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'projects',
      label: assignedGrade === '10' ? 'ميني بروجكت' : assignedGrade === '12' ? 'المشروع النهائي' : 'المشاريع',
      icon: Trophy,
      count: allProjects.length,
      items: allProjects,
      color: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <>
      <div className="space-y-8 px-4">
        {/* Simple Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            محتوى الصف {assignedGrade}
          </h1>
          <p className="text-muted-foreground text-base">
            تصفح المواد التعليمية واكتسب النقاط
          </p>
        </div>

      {/* Content Tabs */}
      <Tabs value={activeContentTab} onValueChange={setActiveContentTab} className="w-full">
        <div className="flex justify-center mb-8">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl h-12 bg-muted/50">
            {contentTabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id} 
                  className="flex items-center gap-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <Badge variant="secondary" className="text-xs ml-1 bg-primary/10 text-primary">
                    {tab.count}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {contentTabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-8">
            {/* Add Create Project Button for Grade 10 Projects Tab */}
            {tab.id === 'projects' && assignedGrade === '10' && (
              <div className="mb-6 flex justify-center">
                <Dialog open={isCreateProjectDialogOpen} onOpenChange={setIsCreateProjectDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2" size="lg">
                      <Plus className="h-5 w-5" />
                      إنشاء ميني بروجكت جديد
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>إنشاء ميني بروجكت جديد</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateMiniProject} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">عنوان المشروع *</Label>
                        <Input
                          id="title"
                          value={projectFormData.title}
                          onChange={(e) => setProjectFormData(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="مثال: تقرير عن الشبكات الحاسوبية"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="description">وصف المشروع</Label>
                        <Textarea
                          id="description"
                          value={projectFormData.description}
                          onChange={(e) => setProjectFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="وصف مختصر عن محتوى المشروع وأهدافه"
                          rows={3}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="due_date">موعد التسليم (اختياري)</Label>
                        <Input
                          id="due_date"
                          type="datetime-local"
                          value={projectFormData.due_date}
                          onChange={(e) => setProjectFormData(prev => ({ ...prev, due_date: e.target.value }))}
                        />
                      </div>
                      
                      <div className="flex gap-2 pt-4">
                        <Button type="submit" className="flex-1">إنشاء المشروع</Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsCreateProjectDialogOpen(false)}
                        >
                          إلغاء
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* Add Create Final Project Button for Grade 12 Projects Tab */}
            {tab.id === 'projects' && assignedGrade === '12' && (
              <div className="mb-6 flex justify-center">
                <Dialog open={isCreateFinalProjectDialogOpen} onOpenChange={setIsCreateFinalProjectDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2" size="lg" variant="default">
                      <Plus className="h-5 w-5" />
                      إنشاء مشروع نهائي جديد
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>إنشاء مشروع نهائي جديد</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateFinalProject} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="final-title">عنوان المشروع النهائي *</Label>
                        <Input
                          id="final-title"
                          value={finalProjectFormData.title}
                          onChange={(e) => setFinalProjectFormData(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="مثال: نظام إدارة قواعد البيانات"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="final-description">وصف المشروع</Label>
                        <Textarea
                          id="final-description"
                          value={finalProjectFormData.description}
                          onChange={(e) => setFinalProjectFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="وصف شامل عن المشروع النهائي وأهدافه ومتطلباته"
                          rows={3}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="final-due-date">موعد التسليم (اختياري)</Label>
                        <Input
                          id="final-due-date"
                          type="datetime-local"
                          value={finalProjectFormData.due_date}
                          onChange={(e) => setFinalProjectFormData(prev => ({ ...prev, due_date: e.target.value }))}
                        />
                      </div>
                      
                      <div className="flex gap-2 pt-4">
                        <Button type="submit" className="flex-1">إنشاء المشروع النهائي</Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsCreateFinalProjectDialogOpen(false)}
                        >
                          إلغاء
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}
            
            {tab.items.length === 0 ? (
              <Card className="text-center p-12 bg-muted/20">
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                    <tab.icon className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-muted-foreground">
                    {tab.id === 'projects' && assignedGrade === '10' 
                      ? 'لا يوجد مشاريع مصغرة' 
                      : tab.id === 'projects' && assignedGrade === '12'
                      ? 'لا يوجد مشاريع نهائية'
                      : `لا يوجد ${tab.label} متاح`
                    }
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {tab.id === 'projects' && assignedGrade === '10'
                      ? 'ابدأ بإنشاء مشروعك الأول باستخدام الزر أعلاه'
                      : tab.id === 'projects' && assignedGrade === '12'
                      ? 'ابدأ بإنشاء مشروعك النهائي باستخدام الزر أعلاه'
                      : `لم يتم إضافة أي ${tab.label} للصف ${assignedGrade} بعد`
                    }
                  </p>
                  {tab.id === 'projects' && assignedGrade === '10' && (
                    <Button 
                      className="gap-2 mt-4"
                      onClick={() => setIsCreateProjectDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      إنشاء مشروع جديد
                    </Button>
                  )}
                  {tab.id === 'projects' && assignedGrade === '12' && (
                    <Button 
                      className="gap-2 mt-4"
                      onClick={() => setIsCreateFinalProjectDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      إنشاء مشروع نهائي
                    </Button>
                  )}
                </div>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {tab.items.map((item: any) => (
                  <ContentCard
                    key={item.id}
                    item={item}
                    type={tab.id.slice(0, -1) as any}
                    icon={tab.icon}
                    color={tab.color}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
      </div>

      {/* Content Viewers */}
      {viewerType === 'video' && selectedContent && (
        <VideoViewer
          isOpen={true}
          onClose={closeViewer}
          video={selectedContent}
          onProgress={(progress, watchTime) => 
            handleContentProgress(selectedContent.id, 'video', progress, watchTime)
          }
          onComplete={() => 
            handleContentComplete(selectedContent.id, 'video', 0)
          }
        />
      )}

      {viewerType === 'document' && selectedContent && (
        <DocumentViewer
          isOpen={true}
          onClose={closeViewer}
          document={selectedContent}
          onProgress={(progress, readTime) => 
            handleContentProgress(selectedContent.id, 'document', progress, readTime)
          }
          onComplete={() => 
            handleContentComplete(selectedContent.id, 'document', 0)
          }
        />
      )}

      {viewerType === 'lesson' && selectedContent && (
        <LessonViewer
          isOpen={true}
          onClose={closeViewer}
          lesson={selectedContent}
          onProgress={(progress, studyTime) => 
            handleContentProgress(selectedContent.id, 'lesson', progress, studyTime)
          }
          onComplete={() => 
            handleContentComplete(selectedContent.id, 'lesson', 0)
          }
        />
      )}

      {viewerType === 'project' && selectedContent && (
        <ProjectViewer
          isOpen={true}
          onClose={closeViewer}
          project={selectedContent}
          onProgress={(progress, workTime) => 
            handleContentProgress(selectedContent.id, 'project', progress, workTime)
          }
          onComplete={() => 
            handleContentComplete(selectedContent.id, 'project', 0)
          }
        />
      )}

      {/* Mini Project Editor for Grade 10 */}
      {currentProject && isProjectEditorOpen && assignedGrade === '10' && (
        <AdvancedProjectEditor 
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

    </>
  );
};