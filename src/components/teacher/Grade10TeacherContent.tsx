import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useGrade10Files } from '@/hooks/useGrade10Files';
import { useGrade10MiniProjects } from '@/hooks/useGrade10MiniProjects';
import { useStudentGrade10Lessons } from '@/hooks/useStudentGrade10Lessons';
import { StudentGrade10Lessons } from '../student/StudentGrade10Lessons';
import { ComputerStructureLessons } from '../student/ComputerStructureLessons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { VideoViewer } from '../student/viewers/VideoViewer';
import { DocumentViewer } from '../student/viewers/DocumentViewer';
import { LessonViewer } from '../student/viewers/LessonViewer';
import { ProjectViewer } from '../student/viewers/ProjectViewer';
import { toDateTimeLocalString, fromDateTimeLocalString } from '@/utils/dateFormatting';
import GradeContentHeader from '@/components/shared/GradeContentHeader';

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
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import type { ProjectFormData } from '@/types/grade10-projects';

const Grade10TeacherContent = () => {
  // Get user profile to check role
  const { userProfile } = useAuth();
  const isTeacher = userProfile?.role === 'teacher';
  
  // Use Grade 10 specific hooks instead of general student content
  const { videos, documents, loading: filesLoading, refetch } = useGrade10Files();
  const { projects: miniProjects, loading: projectsLoading, createProject } = useGrade10MiniProjects();
  const grade10LessonsResult = useStudentGrade10Lessons();

  // State management (same as student view)
  const [activeContentTab, setActiveContentTab] = useState('computer_structure');
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false);
  const [projectFormData, setProjectFormData] = useState<ProjectFormData>({
    title: '',
    description: '',
    due_date: ''
  });

  const allProjects = miniProjects || [];
  const loading = filesLoading || projectsLoading;

  // Helper functions (same as student view)
  const extractYouTubeId = (url: string): string | null => {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const extractGoogleDriveId = (url: string): string | null => {
    const regex = /\/file\/d\/([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const getVideoThumbnail = (video: any): string => {
    if (!video.video_url) return '/placeholder.svg';

    const youtubeId = extractYouTubeId(video.video_url);
    if (youtubeId) {
      return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
    }

    if (video.video_url.includes('drive.google.com')) {
      const fileId = extractGoogleDriveId(video.video_url);
      if (fileId) {
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h300`;
      }
    }

    return video.thumbnail_url || '/placeholder.svg';
  };

  // Filter functions using direct data from useGrade10Files
  const getFilteredVideos = (category?: string) => {
    if (!videos) return [];
    
    return videos.filter((video: any) => {
      if (category === 'educational_explanations' && video.video_category !== 'educational_explanations') return false;
      if (category === 'windows_basics' && video.video_category !== 'windows_basics') return false;
      return video.is_visible !== false; // Include videos that are visible or have no visibility set
    });
  };

  const getFilteredDocuments = () => {
    if (!documents) return [];
    return documents.filter((doc: any) => doc.is_visible !== false);
  };

  // Handle content interactions (adapted for teacher - preview instead of start)
  const handleContentClick = (item: any, type: 'video' | 'document' | 'lesson' | 'project') => {
    switch (type) {
      case 'video':
        setSelectedVideo(item);
        break;
      case 'document':
        setSelectedDocument(item);
        break;
      case 'lesson':
        setSelectedLesson(item);
        break;
      case 'project':
        setSelectedProject(item);
        break;
    }
  };

  const handleCreateMiniProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectFormData.title.trim()) {
      toast.error('يرجى إدخال عنوان المشروع');
      return;
    }

    try {
      await createProject(projectFormData);
      toast.success('تم إنشاء المشروع بنجاح');
      setIsCreateProjectDialogOpen(false);
      setProjectFormData({ title: '', description: '', due_date: '' });
      refetch();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('حدث خطأ في إنشاء المشروع');
    }
  };

  // Teacher-adapted ContentCard with student analytics
  const TeacherContentCard: React.FC<{ 
    item: any; 
    type: 'video' | 'document' | 'lesson' | 'project';
    icon: any;
    color: string;
  }> = ({ item, type, icon: IconComponent, color }) => {
    // Mock teacher analytics data
    const totalStudents = 25;
    const completedStudents = Math.floor(Math.random() * totalStudents);

    return (
      <Card className="group relative hover:shadow-md transition-all duration-300 border border-border/30 bg-background">
        <CardContent className="p-0 relative">
          {/* Video Thumbnail Section - Simplified */}
          {type === 'video' && (
            <div className="relative h-48 overflow-hidden rounded-t-lg">
              <img
                src={getVideoThumbnail(item)}
                alt={item.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
              
              {/* Simple Overlay */}
              <div 
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center cursor-pointer"
                onClick={() => handleContentClick(item, type)}
              >
                <div className="bg-white rounded-full p-3">
                  <Play className="w-6 h-6 text-gray-900 fill-gray-900" />
                </div>
              </div>
              
              {/* Simple Analytics Badge */}
              <div className="absolute top-3 right-3 bg-white/90 text-gray-700 rounded-lg px-2 py-1 text-xs font-medium">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {completedStudents}/{totalStudents}
                </div>
              </div>
              
              {/* Duration Badge */}
              {item.duration && (
                <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {item.duration}
                </div>
              )}
            </div>
          )}

          {/* Content Section - Minimalist */}
          <div className="p-5">
            <div className="space-y-4">
              {/* Header with icon and title (for non-video content) */}
              {type !== 'video' && (
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
                </div>
              )}

              {/* Video title and description */}
              {type === 'video' && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground line-clamp-2 text-base">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>
              )}

              {/* Simple Bottom info and action */}
              <div className="flex items-center justify-between pt-3 border-t border-border/30">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  {item.duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{item.duration}</span>
                    </div>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleContentClick(item, type)}
                  className="text-sm"
                >
                  معاينة
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

  // Define content tabs with updated data sources
  const contentTabs = [
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
      id: 'communication_basics',
      label: 'أساسيات الاتصال',
      icon: Radio,
      count: grade10LessonsResult.getContentStats().totalLessons,
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
    },
    {
      id: 'documents',
      label: 'المستندات',
      icon: FileText,
      count: getFilteredDocuments().length,
      items: getFilteredDocuments(),
      color: 'from-indigo-500 to-purple-500'
    }
  ];

  return (
    <div className="container mx-auto px-6 py-12 space-y-12">
      {/* Modern Grade Header */}
      <GradeContentHeader
        gradeTitle="محتوى الصف العاشر"
        gradeDescription="عرض وإدارة محتوى الصف العاشر مع إحصائيات الطلاب"
        gradeNumber={10}
        studentsCount={125}
        contentCount={getFilteredVideos().length + getFilteredDocuments().length + allProjects.length}
        
        isTeacherView={true}
        
        
      />

      {/* Content Tabs - Exact same design as student view */}
      <Tabs value={activeContentTab} onValueChange={setActiveContentTab} className="w-full">
        <div className="flex justify-center mb-8">
          <TabsList className="grid grid-cols-6 w-full h-auto p-1 gap-1 bg-background/80 border border-border/40 rounded-2xl shadow-lg backdrop-blur-md transition-all duration-300 hover:shadow-xl" style={{ maxWidth: '1400px' }}>
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
            {/* Special handling for Grade 10 Communication Basics */}
            {tab.id === 'communication_basics' ? (
              <StudentGrade10Lessons />
            ) : tab.id === 'computer_structure' ? (
              <ComputerStructureLessons />
            ) : (
              <>
                {/* Enhanced Development Notice for Grade 10 Mini Projects */}
                {tab.id === 'mini_projects' && (
                  <div className="mb-8">
                    <Alert className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200/60 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                          <Settings className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <AlertDescription className="text-base font-medium text-amber-800">
                            عرض المعلم - يمكنك معاينة محتوى الطلاب وإحصائياتهم
                          </AlertDescription>
                          <p className="text-sm text-amber-700 mt-1">
                            هذا المحتوى يظهر بنفس الطريقة للطلاب مع إضافة الإحصائيات
                          </p>
                        </div>
                      </div>
                    </Alert>
                  </div>
                )}

                {/* Add Create Project Button for Grade 10 Mini Projects Tab */}
                {tab.id === 'mini_projects' && (
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
                            {tab.id === 'mini_projects' 
                              ? 'لا يوجد مشاريع مصغرة' 
                              : `لا يوجد ${tab.label} متاح`
                            }
                          </h3>
                          <p className="text-muted-foreground leading-relaxed">
                            {tab.id === 'mini_projects'
                              ? 'يمكن للطلاب إنشاء مشاريعهم الأولى'
                              : `سيتم إضافة ${tab.label} قريباً للصف العاشر`
                            }
                          </p>
                        </div>
                        
                        {/* Action Buttons */}
                        {tab.id === 'mini_projects' && (
                          <Button 
                            className="gap-2 px-6 py-3 text-base font-medium shadow-md hover:shadow-lg transition-all duration-300"
                            onClick={() => setIsCreateProjectDialogOpen(true)}
                            size="lg"
                          >
                            <Plus className="h-5 w-5" />
                            إنشاء مشروع جديد
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
                        <TeacherContentCard
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

      {/* Modals - Same as student view but with teacher-specific behavior */}
      {selectedVideo && (
        <VideoViewer
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          video={selectedVideo}
          onProgress={isTeacher ? () => {} : undefined}
          onComplete={isTeacher ? () => {} : undefined}
          isTeacherPreview={isTeacher}
        />
      )}

      {selectedDocument && (
        <DocumentViewer
          isOpen={!!selectedDocument}
          onClose={() => setSelectedDocument(null)}
          document={selectedDocument}
          onProgress={isTeacher ? () => {} : undefined}
          onComplete={isTeacher ? () => {} : undefined}
          isTeacherPreview={isTeacher}
        />
      )}

      {selectedLesson && (
        <LessonViewer
          isOpen={!!selectedLesson}
          onClose={() => setSelectedLesson(null)}
          lesson={selectedLesson}
          onProgress={isTeacher ? () => {} : undefined}
          onComplete={isTeacher ? () => {} : undefined}
          isTeacherPreview={isTeacher}
        />
      )}

      {selectedProject && (
        <ProjectViewer
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          project={selectedProject}
          onProgress={isTeacher ? () => {} : undefined}
          onComplete={isTeacher ? () => {} : undefined}
        />
      )}
    </div>
  );
};

export default Grade10TeacherContent;