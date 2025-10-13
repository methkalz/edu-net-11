import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudentContent } from '@/hooks/useStudentContent';
import { useStudentProgress } from '@/hooks/useStudentProgress';
import { useGrade10MiniProjects } from '@/hooks/useGrade10MiniProjects';
import { useGrade12Projects } from '@/hooks/useGrade12Projects';
import { useStudentGrade10Lessons } from '@/hooks/useStudentGrade10Lessons';
import { StudentGrade11Content } from './StudentGrade11Content';
import { StudentGrade10Lessons } from './StudentGrade10Lessons';
import { ComputerStructureLessons } from './ComputerStructureLessons';
import StudentGrade12Content from './StudentGrade12Content';
import KnowledgeAdventureRealContent from '../games/KnowledgeAdventureRealContent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { VideoViewer } from './viewers/VideoViewer';
import { DocumentViewer } from './viewers/DocumentViewer';
import { LessonViewer } from './viewers/LessonViewer';
import { ProjectViewer } from './viewers/ProjectViewer';
import { toDateTimeLocalString, fromDateTimeLocalString } from '@/utils/dateFormatting';
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
  Edit3,
  Monitor,
  Settings,
  Network,
  Phone,
  Radio,
  Gamepad2
} from 'lucide-react';
import { toast } from 'sonner';
import type { ProjectFormData } from '@/types/grade10-projects';

export const StudentGradeContent: React.FC<{ defaultTab?: string }> = ({ defaultTab }) => {
  const { 
    gradeContent, 
    assignedGrade, 
    loading,
    error
  } = useStudentContent();
  const { updateProgress } = useStudentProgress();
  
  // استخدام conditional hooks لتجنب أخطاء الجلب غير الضرورية
  const grade10HooksResult = assignedGrade === '10' ? useGrade10MiniProjects() : {
    projects: [],
    createProject: async () => null,
    fetchProject: async () => null,
    currentProject: null,
    setCurrentProject: () => {},
    loading: false
  };
  
  const grade10LessonsResult = assignedGrade === '10' ? useStudentGrade10Lessons() : {
    sections: [],
    loading: false,
    error: null,
    getContentStats: () => ({ totalLessons: 0 }),
    getCommunicationBasicsLessonsCount: () => 0
  };
  
  const grade12HooksResult = assignedGrade === '12' ? useGrade12Projects() : {
    projects: [],
    createProject: async () => null,
    currentProject: null,
    setCurrentProject: () => {},
    loading: false
  };
  
  const { 
    projects: miniProjects,
    createProject,
    fetchProject,
    currentProject,
    setCurrentProject,
    loading: projectsLoading
  } = grade10HooksResult;
  
  const { 
    projects: finalProjects,
    createProject: createFinalProject,
    currentProject: currentFinalProject,
    setCurrentProject: setCurrentFinalProject,
    loading: finalProjectsLoading
  } = grade12HooksResult;
  
  const [activeContentTab, setActiveContentTab] = useState('computer_structure');
  
  // Viewer states
  // Debug logging for Grade 10 video categories
  useEffect(() => {
    if (assignedGrade === '10' && gradeContent?.videos?.length > 0) {
      console.log('[DEBUG] Grade 10 Videos loaded:', gradeContent.videos.length);
      console.log('[DEBUG] Videos data:', gradeContent.videos);
      console.log('[DEBUG] Educational videos:', gradeContent.videos.filter(v => v.video_category === 'educational_explanations'));
      console.log('[DEBUG] Windows videos:', gradeContent.videos.filter(v => v.video_category === 'windows_basics'));
    }
  }, [assignedGrade, gradeContent]);

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

    // تحويل التاريخ من datetime-local إلى ISO
    const projectData = {
      ...projectFormData,
      due_date: projectFormData.due_date ? fromDateTimeLocalString(projectFormData.due_date) : ''
    };

    const result = await createProject(projectData);
    
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

    // تحويل التاريخ من datetime-local إلى ISO
    const projectData = {
      ...finalProjectFormData,
      due_date: finalProjectFormData.due_date ? fromDateTimeLocalString(finalProjectFormData.due_date) : undefined
    };

    const result = await createFinalProject(projectData);
    
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

  // Helper functions for video thumbnails
  const extractYouTubeId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const extractGoogleDriveId = (url: string): string | null => {
    const regex = /(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|docs\.google\.com\/file\/d\/)([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const getVideoThumbnail = (video: any): string => {
    if (video.thumbnail_url) {
      return video.thumbnail_url;
    }

    if (video.source_type === 'youtube' || video.video_url?.includes('youtube.com') || video.video_url?.includes('youtu.be')) {
      const videoId = extractYouTubeId(video.video_url);
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }
    }

    if (video.source_type === 'google_drive' || video.video_url?.includes('drive.google.com/file/d/')) {
      const fileId = extractGoogleDriveId(video.video_url);
      if (fileId) {
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h300`;
      }
    }

    return '/placeholder.svg';
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
      <Card className="group relative hover:shadow-xl transition-all duration-500 border-0 bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-md overflow-hidden hover:scale-[1.02] hover:-translate-y-1">
        {/* Animated Border */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
        
        <CardContent className="p-0 relative">
          {/* Video Thumbnail Section - Enhanced */}
          {type === 'video' && (
            <div className="relative h-52 overflow-hidden">
              <img
                src={getVideoThumbnail(item)}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
              
              {/* Enhanced Overlay */}
              <div 
                className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-all duration-500 flex items-center justify-center cursor-pointer"
                onClick={() => handleContentClick(item, type)}
              >
                {/* Play Button with Glow Effect */}
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110">
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/20 rounded-full blur-xl"></div>
                    <div className="relative bg-white/15 hover:bg-white/25 rounded-full p-4 backdrop-blur-md border border-white/20 shadow-2xl">
                      <Play className="w-8 h-8 text-white fill-white drop-shadow-lg" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Completion Badge - Enhanced */}
              {isCompleted && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-full p-2 shadow-lg border-2 border-white/20">
                  <CheckCircle className="w-4 h-4" />
                </div>
              )}
              
              {/* Duration Badge */}
              {item.duration && (
                <div className="absolute bottom-4 left-4 bg-black/60 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm border border-white/20">
                  {item.duration}
                </div>
              )}
            </div>
          )}

          {/* Content Section - Enhanced */}
          <div className="p-7">
            <div className="space-y-5">
              {/* Header with icon and title (for non-video content) */}
              {type !== 'video' && (
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${color} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground line-clamp-2 text-lg mb-2 group-hover:text-primary transition-colors duration-300">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {isCompleted && (
                    <div className="flex items-center gap-1 text-emerald-600 flex-shrink-0 bg-emerald-50 rounded-full p-2">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  )}
                </div>
              )}

              {/* Video title and description */}
              {type === 'video' && (
                <div className="space-y-3">
                  <h3 className="font-bold text-foreground line-clamp-2 text-lg group-hover:text-primary transition-colors duration-300">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
              )}

              {/* Enhanced Progress bar */}
              {progress > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-medium">التقدم</span>
                    <span className="font-bold text-primary">{progress}%</span>
                  </div>
                  <div className="relative">
                    <Progress value={progress} className="h-3 bg-muted/50" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full"></div>
                  </div>
                </div>
              )}

              {/* Enhanced Bottom info and action */}
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {item.duration && (
                    <div className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1">
                      <Clock className="w-3 h-3" />
                      <span className="font-medium">{item.duration}</span>
                    </div>
                  )}
                  {item.progress?.points_earned && (
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 rounded-full px-3 py-1">
                      <Star className="w-3 h-3" />
                      <span className="font-bold">{item.progress.points_earned}</span>
                    </div>
                  )}
                </div>

                <Button
                  size="sm"
                  onClick={() => handleContentClick(item, type)}
                  className="shrink-0 px-6 py-2 text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300 group-hover:scale-105"
                >
                  {isCompleted ? 'مراجعة' : 'ابدأ'}
                </Button>
              </div>
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

  // Special handling for Grade 11 - show structured content
  if (assignedGrade === '11') {
    return <StudentGrade11Content />;
  }

  // Special handling for Grade 12 - show grade 12 specific content
  if (assignedGrade === '12') {
    return <StudentGrade12Content defaultTab={defaultTab} />;
  }

  if (!currentContent) {
    console.log(`[DEBUG] No content found for grade ${assignedGrade}`);
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

  console.log(`[DEBUG] Grade ${assignedGrade} content:`, currentContent);
  console.log(`[DEBUG] Grade ${assignedGrade} videos count:`, currentContent?.videos?.length);
  console.log(`[DEBUG] Grade ${assignedGrade} videos data:`, currentContent?.videos);

  // Merge projects based on grade
  const allProjects = assignedGrade === '10' 
    ? [...(currentContent?.projects || []), ...(miniProjects || [])]
    : assignedGrade === '12'
    ? [...(currentContent?.projects || []), ...(finalProjects || [])]
    : currentContent?.projects || [];

  // Filter content for Grade 10 tabs
  const getFilteredVideos = (category: string) => {
    if (assignedGrade === '10') {
      return (currentContent?.videos || []).filter((video: any) => video.video_category === category);
    }
    return [];
  };

  const contentTabs = assignedGrade === '10' ? [
    {
      id: 'computer_structure',
      label: 'مبنى الحاسوب',
      icon: Monitor,
      count: getFilteredVideos('educational_explanations').length,
      items: getFilteredVideos('educational_explanations'),
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'windows_basics',
      label: 'أساسيات الويندوز', 
      icon: Settings,
      count: getFilteredVideos('windows_basics').length,
      items: getFilteredVideos('windows_basics'),
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'network_intro',
      label: 'مقدمة عن الشبكات',
      icon: Network,
      count: getFilteredVideos('educational_explanations').length,
      items: getFilteredVideos('educational_explanations'),
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'knowledge_adventure',
      label: 'لعبة المعرفة',
      icon: Gamepad2,
      count: 0, // سيتم حساب الإحصائيات لاحقاً
      items: [],
      color: 'from-violet-500 to-purple-500'
    },
    {
      id: 'communication_basics',
      label: 'أساسيات الاتصال',
      icon: Radio,
      count: grade10LessonsResult.getCommunicationBasicsLessonsCount(),
      items: [],
      color: 'from-orange-500 to-red-500'
    },
    {
      id: 'mini_projects',
      label: 'ميني برويكت',
      icon: FolderOpen,
      count: allProjects.length,
      items: allProjects,
      color: 'from-amber-500 to-orange-500'
    }
  ] : [
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
      label: 'الملفات',
      icon: FileText,
      count: currentContent?.documents?.length || 0,
      items: currentContent?.documents || [],
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'projects',
      label: 'المشاريع',
      icon: FolderOpen,
      count: allProjects.length,
      items: allProjects,
      color: 'from-amber-500 to-orange-500'
    }
  ];

  return (
    <div className="container mx-auto px-6 py-12 space-y-12">
      {/* Enhanced Header Section */}

      {/* Content Tabs - Minimalist Design */}
      <Tabs value={activeContentTab} onValueChange={setActiveContentTab} className="w-full">
        <div className="flex justify-center mb-8">
          <TabsList className={`
            grid ${assignedGrade === '10' ? 'grid-cols-6' : assignedGrade === '11' ? 'grid-cols-2' : 'grid-cols-3'} 
            w-full h-auto p-1 gap-1
            bg-background/80 border border-border/40 
            rounded-2xl shadow-lg backdrop-blur-md
            transition-all duration-300 hover:shadow-xl
          `} style={{ maxWidth: '1400px' }}>
            {contentTabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id} 
                  className="
                    relative flex flex-col items-center justify-center gap-2 
                    py-6 px-4 min-h-[120px]
                    text-sm font-medium text-muted-foreground/80
                    bg-transparent border-0 rounded-xl
                    transition-all duration-300 ease-out
                    data-[state=active]:bg-background 
                    data-[state=active]:text-foreground
                    data-[state=active]:shadow-md
                    data-[state=active]:shadow-primary/20
                    data-[state=active]:scale-[1.02]
                    hover:bg-background/50 hover:text-foreground/90
                    hover:shadow-sm hover:scale-[1.01]
                    focus-visible:outline-none focus-visible:ring-2 
                    focus-visible:ring-primary/30 focus-visible:ring-offset-2
                    group overflow-hidden
                  "
                >
                  {/* Icon Container */}
                  <div className="
                    relative flex items-center justify-center w-12 h-12 
                    rounded-xl bg-gradient-to-br from-primary/5 to-primary/10
                    group-data-[state=active]:from-primary/10 group-data-[state=active]:to-primary/20
                    group-data-[state=active]:shadow-sm
                    group-hover:from-primary/8 group-hover:to-primary/15
                    transition-all duration-300
                  ">
                    <IconComponent className="w-6 h-6 transition-all duration-300 group-data-[state=active]:scale-110 group-data-[state=active]:text-primary" />
                  </div>
                  
                  {/* Label */}
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-xs font-semibold leading-tight text-center px-1 group-data-[state=active]:text-sm transition-all duration-300">
                      {tab.label}
                    </span>
                    
                    {/* Count Badge */}
                    <div className="
                      flex items-center justify-center min-w-[24px] h-6 px-2
                      bg-muted/50 text-muted-foreground 
                      group-data-[state=active]:bg-primary group-data-[state=active]:text-primary-foreground
                      group-data-[state=active]:shadow-sm
                      rounded-full text-xs font-bold
                      transition-all duration-300
                    ">
                      {tab.count}
                    </div>
                  </div>
                  
                  {/* Active Indicator - Bottom Bar */}
                  <div className="
                    absolute bottom-0 left-1/2 -translate-x-1/2 
                    w-12 h-1 bg-gradient-to-r from-primary to-primary/80
                    rounded-t-full transition-all duration-300
                    opacity-0 scale-x-0 translate-y-1
                    group-data-[state=active]:opacity-100 group-data-[state=active]:scale-x-100 group-data-[state=active]:translate-y-0
                  " />
                  
                  {/* Hover Effect Background */}
                  <div className="
                    absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent
                    opacity-0 group-hover:opacity-100 group-data-[state=active]:opacity-20
                    transition-opacity duration-300 -z-10
                  " />
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {contentTabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-8">
            {/* Special handling for Grade 10 sections */}
            {tab.id === 'knowledge_adventure' && assignedGrade === '10' ? (
              <KnowledgeAdventureRealContent />
            ) : tab.id === 'communication_basics' && assignedGrade === '10' ? (
              <StudentGrade10Lessons />
            ) : tab.id === 'computer_structure' && assignedGrade === '10' ? (
              <ComputerStructureLessons />
            ) : (
              <>
                {/* Enhanced Development Notice for Grade 10 Mini Projects */}
                {tab.id === 'mini_projects' && assignedGrade === '10' && (
                  <div className="mb-8">
                    <Alert className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200/60 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                          <Settings className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <AlertDescription className="text-base font-medium text-amber-800">
                            جارٍ أعمال تطويرية.. سيعمل قريباً
                          </AlertDescription>
                          <p className="text-sm text-amber-700 mt-1">
                            نعمل على إضافة المزيد من المشاريع المثيرة قريباً
                          </p>
                        </div>
                      </div>
                    </Alert>
                  </div>
                )}

                {/* Enhanced Development Notice for Grade 12 Final Projects */}
                {tab.id === 'projects' && assignedGrade === '12' && (
                  <div className="mb-8">
                    <Alert className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200/60 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                          <Settings className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <AlertDescription className="text-base font-medium text-amber-800">
                            جارٍ أعمال تطويرية.. سيعمل قريباً
                          </AlertDescription>
                          <p className="text-sm text-amber-700 mt-1">
                            المشاريع النهائية ستكون متاحة قريباً مع أدوات متقدمة
                          </p>
                        </div>
                      </div>
                    </Alert>
                  </div>
                )}

                {/* Add Create Project Button for Grade 10 Mini Projects Tab */}
                {tab.id === 'mini_projects' && assignedGrade === '10' && (
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
                              value={toDateTimeLocalString(projectFormData.due_date)}
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
                              value={toDateTimeLocalString(finalProjectFormData.due_date)}
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
                  <div className="flex items-center justify-center min-h-[400px]">
                    <Card className="text-center p-16 bg-gradient-to-br from-background/50 to-muted/20 border-border/40 shadow-lg backdrop-blur-sm max-w-md mx-auto">
                      <div className="space-y-6">
                        {/* Enhanced Icon Container */}
                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-muted/30 to-muted/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-border/20">
                          <tab.icon className="w-10 h-10 text-muted-foreground/70" />
                        </div>
                        
                        {/* Title and Description */}
                        <div className="space-y-3">
                          <h3 className="text-xl font-semibold text-foreground">
                            {tab.id === 'mini_projects' && assignedGrade === '10' 
                              ? 'لا يوجد مشاريع مصغرة' 
                              : tab.id === 'projects' && assignedGrade === '12'
                              ? 'لا يوجد مشاريع نهائية'
                              : `لا يوجد ${tab.label} متاح`
                            }
                          </h3>
                          <p className="text-muted-foreground leading-relaxed">
                            {tab.id === 'mini_projects' && assignedGrade === '10'
                              ? 'ابدأ رحلتك التعليمية بإنشاء مشروعك الأول'
                              : tab.id === 'projects' && assignedGrade === '12'
                              ? 'أنشئ مشروعك النهائي وأظهر مهاراتك المتقدمة'
                              : `سيتم إضافة ${tab.label} قريباً للصف ${assignedGrade}`
                            }
                          </p>
                        </div>
                        
                        {/* Action Buttons */}
                        {tab.id === 'mini_projects' && assignedGrade === '10' && (
                          <Button 
                            className="gap-2 px-6 py-3 text-base font-medium shadow-md hover:shadow-lg transition-all duration-300"
                            onClick={() => setIsCreateProjectDialogOpen(true)}
                            size="lg"
                          >
                            <Plus className="h-5 w-5" />
                            إنشاء مشروع جديد
                          </Button>
                        )}
                        {tab.id === 'projects' && assignedGrade === '12' && (
                          <Button 
                            className="gap-2 px-6 py-3 text-base font-medium shadow-md hover:shadow-lg transition-all duration-300"
                            onClick={() => setIsCreateFinalProjectDialogOpen(true)}
                            size="lg"
                          >
                            <Plus className="h-5 w-5" />
                            إنشاء مشروع نهائي
                          </Button>
                        )}
                      </div>
                    </Card>
                  </div>
                ) : (
                  <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {tab.items.map((item: any) => {
                      // Determine the correct content type
                      let contentType: 'video' | 'document' | 'lesson' | 'project' = 'video';
                      if (tab.id === 'mini_projects') {
                        contentType = 'project';
                      } else if (['windows_basics', 'computer_structure', 'network_intro'].includes(tab.id)) {
                        contentType = 'video';
                      } else if (tab.id === 'documents') {
                        contentType = 'document';
                      } else if (tab.id === 'lessons') {
                        contentType = 'lesson';
                      }

                      return (
                        <ContentCard
                          key={item.id}
                          item={item}
                          type={contentType}
                          icon={tab.icon}
                          color={tab.color}
                        />
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>

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

      {/* Mini Project Editor */}
      {currentProject && isProjectEditorOpen && (
        <AdvancedProjectEditor
          isOpen={isProjectEditorOpen}
          onClose={() => {
            setIsProjectEditorOpen(false);
            setCurrentProject(null);
          }}
          project={currentProject}
        />
      )}
    </div>
  );
};