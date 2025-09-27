import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStudentContent } from '@/hooks/useStudentContent';
import { useStudentProgress } from '@/hooks/useStudentProgress';
import { useGrade10MiniProjects } from '@/hooks/useGrade10MiniProjects';
import { useGrade12Projects } from '@/hooks/useGrade12Projects';
import { useGrade12Content } from '@/hooks/useGrade12Content';
import { useStudentGrade10Lessons } from '@/hooks/useStudentGrade10Lessons';
import { StudentGrade11Content } from '../student/StudentGrade11Content';
import { StudentGrade10Lessons } from '../student/StudentGrade10Lessons';
import { ComputerStructureLessons } from '../student/ComputerStructureLessons';
import KnowledgeAdventureRealContent from '../games/KnowledgeAdventureRealContent';
import WindowsBasicsContent from './WindowsBasicsContent';
import NetworkIntroContent from './NetworkIntroContent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VideoViewer } from '../student/viewers/VideoViewer';
import { DocumentViewer } from '../student/viewers/DocumentViewer';
import { LessonViewer } from '../student/viewers/LessonViewer';
import { ProjectViewer } from '../student/viewers/ProjectViewer';
import { Play, FileText, FolderOpen, Clock, CheckCircle, Star, BookOpen, Video, Download, ExternalLink, Trophy, Target, Sparkles, Monitor, Settings, Network, Phone, Radio, Gamepad2, GraduationCap, Users, Eye } from 'lucide-react';
import { toast } from 'sonner';
interface TeacherContentViewerProps {
  grade: '10' | '11' | '12';
}
export const TeacherContentViewer: React.FC<TeacherContentViewerProps> = ({
  grade
}) => {
  const {
    user
  } = useAuth();
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [viewerType, setViewerType] = useState<'video' | 'document' | 'lesson' | 'project' | null>(null);
  const [activeContentTab, setActiveContentTab] = useState(() => {
    if (grade === '12') return 'videos';
    return 'computer_structure';
  });

  // Mock the student context for the specific grade
  const mockStudentContent = {
    gradeContent: null,
    assignedGrade: grade,
    loading: false,
    error: null
  };

  // For Grade 10, use the lessons hook to get structured content
  const grade10LessonsResult = grade === '10' ? useStudentGrade10Lessons() : {
    sections: [],
    loading: false,
    error: null,
    getContentStats: () => ({
      totalLessons: 0
    })
  };

  // For Grade 12, use the grade12 content hook
  const grade12ContentResult = grade === '12' ? useGrade12Content() : {
    videos: [],
    documents: [],
    projects: [],
    loading: false
  };
  const handleContentClick = (content: any, contentType: 'video' | 'document' | 'lesson' | 'project') => {
    setSelectedContent(content);
    setViewerType(contentType);
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
  }> = ({
    item,
    type,
    icon: IconComponent,
    color
  }) => {
    const progress = item.progress?.progress_percentage || 0;
    const isCompleted = progress >= 100;
    return <Card className="group relative hover:shadow-xl transition-all duration-500 border-0 bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-md overflow-hidden hover:scale-[1.02] hover:-translate-y-1">
        {/* Animated Border */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
        
        <CardContent className="p-0 relative">
          {/* Video Thumbnail Section - Enhanced */}
          {type === 'video' && <div className="relative h-52 overflow-hidden">
              <img src={getVideoThumbnail(item)} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" onError={e => {
            (e.target as HTMLImageElement).src = '/placeholder.svg';
          }} />
              
              {/* Enhanced Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-all duration-500 flex items-center justify-center cursor-pointer" onClick={() => handleContentClick(item, type)}>
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
              
              {/* Teacher View Badge */}
              <div className="absolute top-4 left-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full px-3 py-1 text-xs font-medium shadow-lg border border-white/20">
                <Eye className="w-3 h-3 inline-block mr-1" />
                معاينة المعلم
              </div>
            </div>}

          {/* Content Section - Enhanced */}
          <div className="p-7">
            <div className="space-y-5">
              {/* Header with icon and title (for non-video content) */}
              {type !== 'video' && <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${color} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground line-clamp-2 text-lg mb-2 group-hover:text-primary transition-colors duration-300">
                      {item.title}
                    </h3>
                    {item.description && <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {item.description}
                      </p>}
                  </div>

                  {/* Teacher View Badge */}
                  <div className="flex items-center gap-1 text-blue-600 flex-shrink-0 bg-blue-50 rounded-full px-3 py-1">
                    <Eye className="w-4 h-4" />
                    <span className="text-xs font-medium">معاينة</span>
                  </div>
                </div>}

              {/* Video title and description */}
              {type === 'video' && <div className="space-y-3">
                  <h3 className="font-bold text-foreground line-clamp-2 text-lg group-hover:text-primary transition-colors duration-300">
                    {item.title}
                  </h3>
                  {item.description && <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {item.description}
                    </p>}
                </div>}

              {/* Enhanced Bottom info and action */}
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {item.duration && <div className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1">
                      <Clock className="w-3 h-3" />
                      <span className="font-medium">{item.duration}</span>
                    </div>}
                  <div className="flex items-center gap-2 text-blue-600 bg-blue-50 rounded-full px-3 py-1">
                    <Users className="w-3 h-3" />
                    <span className="font-medium text-xs">كما يراه الطلاب</span>
                  </div>
                </div>

                <Button size="sm" onClick={() => handleContentClick(item, type)} className="shrink-0 px-6 py-2 text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                  معاينة
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>;
  };

  // Grade 10 Content with Tabs
  if (grade === '10') {
    return <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">محتوى الصف العاشر</h2>
            
          </div>
        </div>

        <Tabs value={activeContentTab} onValueChange={setActiveContentTab} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="grid grid-cols-6 w-full h-auto p-1 gap-1 bg-background/80 border border-border/40 rounded-2xl shadow-lg backdrop-blur-md transition-all duration-300 hover:shadow-xl" style={{
            maxWidth: '1400px'
          }}>
              <TabsTrigger value="computer_structure" className="relative flex flex-col items-center justify-center gap-2 py-6 px-4 min-h-[120px] text-sm font-medium text-muted-foreground/80 bg-transparent border-0 rounded-xl transition-all duration-300 ease-out data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 data-[state=active]:scale-[1.02] hover:bg-background/50 hover:text-foreground/90 hover:shadow-sm hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 group overflow-hidden">
                <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 group-data-[state=active]:from-primary/10 group-data-[state=active]:to-primary/20 group-data-[state=active]:shadow-sm group-hover:from-primary/8 group-hover:to-primary/15 transition-all duration-300">
                  <Monitor className="w-6 h-6 transition-all duration-300 group-data-[state=active]:scale-110 group-data-[state=active]:text-primary" />
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-xs font-semibold leading-tight text-center px-1 group-data-[state=active]:text-sm transition-all duration-300">مبنى الحاسوب</span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger value="windows_basics" className="relative flex flex-col items-center justify-center gap-2 py-6 px-4 min-h-[120px] text-sm font-medium text-muted-foreground/80 bg-transparent border-0 rounded-xl transition-all duration-300 ease-out data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 data-[state=active]:scale-[1.02] hover:bg-background/50 hover:text-foreground/90 hover:shadow-sm hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 group overflow-hidden">
                <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 group-data-[state=active]:from-primary/10 group-data-[state=active]:to-primary/20 group-data-[state=active]:shadow-sm group-hover:from-primary/8 group-hover:to-primary/15 transition-all duration-300">
                  <Settings className="w-6 h-6 transition-all duration-300 group-data-[state=active]:scale-110 group-data-[state=active]:text-primary" />
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-xs font-semibold leading-tight text-center px-1 group-data-[state=active]:text-sm transition-all duration-300">أساسيات الويندوز</span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger value="network_intro" className="relative flex flex-col items-center justify-center gap-2 py-6 px-4 min-h-[120px] text-sm font-medium text-muted-foreground/80 bg-transparent border-0 rounded-xl transition-all duration-300 ease-out data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 data-[state=active]:scale-[1.02] hover:bg-background/50 hover:text-foreground/90 hover:shadow-sm hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 group overflow-hidden">
                <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 group-data-[state=active]:from-primary/10 group-data-[state=active]:to-primary/20 group-data-[state=active]:shadow-sm group-hover:from-primary/8 group-hover:to-primary/15 transition-all duration-300">
                  <Network className="w-6 h-6 transition-all duration-300 group-data-[state=active]:scale-110 group-data-[state=active]:text-primary" />
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-xs font-semibold leading-tight text-center px-1 group-data-[state=active]:text-sm transition-all duration-300">مقدمة عن الشبكات</span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger value="knowledge_adventure" className="relative flex flex-col items-center justify-center gap-2 py-6 px-4 min-h-[120px] text-sm font-medium text-muted-foreground/80 bg-transparent border-0 rounded-xl transition-all duration-300 ease-out data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 data-[state=active]:scale-[1.02] hover:bg-background/50 hover:text-foreground/90 hover:shadow-sm hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 group overflow-hidden">
                <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 group-data-[state=active]:from-primary/10 group-data-[state=active]:to-primary/20 group-data-[state=active]:shadow-sm group-hover:from-primary/8 group-hover:to-primary/15 transition-all duration-300">
                  <Gamepad2 className="w-6 h-6 transition-all duration-300 group-data-[state=active]:scale-110 group-data-[state=active]:text-primary" />
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-xs font-semibold leading-tight text-center px-1 group-data-[state=active]:text-sm transition-all duration-300">لعبة المعرفة</span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger value="communication_basics" className="relative flex flex-col items-center justify-center gap-2 py-6 px-4 min-h-[120px] text-sm font-medium text-muted-foreground/80 bg-transparent border-0 rounded-xl transition-all duration-300 ease-out data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 data-[state=active]:scale-[1.02] hover:bg-background/50 hover:text-foreground/90 hover:shadow-sm hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 group overflow-hidden">
                <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 group-data-[state=active]:from-primary/10 group-data-[state=active]:to-primary/20 group-data-[state=active]:shadow-sm group-hover:from-primary/8 group-hover:to-primary/15 transition-all duration-300">
                  <Radio className="w-6 h-6 transition-all duration-300 group-data-[state=active]:scale-110 group-data-[state=active]:text-primary" />
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-xs font-semibold leading-tight text-center px-1 group-data-[state=active]:text-sm transition-all duration-300">أساسيات الاتصال</span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger value="mini_projects" className="relative flex flex-col items-center justify-center gap-2 py-6 px-4 min-h-[120px] text-sm font-medium text-muted-foreground/80 bg-transparent border-0 rounded-xl transition-all duration-300 ease-out data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 data-[state=active]:scale-[1.02] hover:bg-background/50 hover:text-foreground/90 hover:shadow-sm hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 group overflow-hidden">
                <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 group-data-[state=active]:from-primary/10 group-data-[state=active]:to-primary/20 group-data-[state=active]:shadow-sm group-hover:from-primary/8 group-hover:to-primary/15 transition-all duration-300">
                  <FolderOpen className="w-6 h-6 transition-all duration-300 group-data-[state=active]:scale-110 group-data-[state=active]:text-primary" />
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-xs font-semibold leading-tight text-center px-1 group-data-[state=active]:text-sm transition-all duration-300">ميني بروجكت</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="computer_structure" className="mt-6">
            <ComputerStructureLessons />
          </TabsContent>

          <TabsContent value="windows_basics" className="mt-6">
            <WindowsBasicsContent />
          </TabsContent>

          <TabsContent value="network_intro" className="mt-6">
            <NetworkIntroContent />
          </TabsContent>

          <TabsContent value="knowledge_adventure" className="mt-6">
            <KnowledgeAdventureRealContent />
          </TabsContent>

          <TabsContent value="communication_basics" className="mt-6">
            <StudentGrade10Lessons />
          </TabsContent>

          <TabsContent value="mini_projects" className="mt-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">ميني بروجكت</h3>
              <p className="text-muted-foreground">سيتم عرض المشاريع الصغيرة هنا</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Viewer Dialogs */}
        {selectedContent && viewerType && <Dialog open={!!selectedContent} onOpenChange={() => closeViewer()}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  معاينة المحتوى - {selectedContent.title}
                </DialogTitle>
              </DialogHeader>
              
              {viewerType === 'video' && <VideoViewer isOpen={!!selectedContent} onClose={closeViewer} video={selectedContent} onProgress={() => {}} onComplete={() => {}} isTeacherPreview={true} />}
              
              {viewerType === 'document' && <DocumentViewer isOpen={!!selectedContent} onClose={closeViewer} document={selectedContent} onProgress={() => {}} onComplete={() => {}} />}
              
              {viewerType === 'lesson' && <LessonViewer isOpen={!!selectedContent} onClose={closeViewer} lesson={selectedContent} onProgress={() => {}} onComplete={() => {}} />}
              
              {viewerType === 'project' && <ProjectViewer isOpen={!!selectedContent} onClose={closeViewer} project={selectedContent} onProgress={() => {}} onComplete={() => {}} />}
            </DialogContent>
          </Dialog>}
      </div>;
  }

  // Grade 11 Content
  if (grade === '11') {
    return <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">محتوى الصف الحادي عشر</h2>
            <p className="text-muted-foreground">كما يراه الطلاب في لوحة تحكمهم</p>
          </div>
        </div>

        <StudentGrade11Content />
      </div>;
  }

  // Grade 12 Content
  if (grade === '12') {
    const {
      videos,
      documents,
      projects,
      loading
    } = grade12ContentResult;
    
    if (loading) {
      return <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">محتوى الصف الثاني عشر</h2>
              <p className="text-muted-foreground">جاري تحميل المحتوى...</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-muted/20 rounded-lg animate-pulse"></div>)}
          </div>
        </div>;
    }

    return <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">محتوى الصف الثاني عشر</h2>
            <p className="text-muted-foreground">
              {(videos?.length || 0) + (documents?.length || 0) + (projects?.length || 0) > 0 
                ? `${videos?.length || 0} فيديو، ${documents?.length || 0} مستند، ${projects?.length || 0} مشروع` 
                : 'لا يوجد محتوى متاح حالياً'}
            </p>
          </div>
        </div>

        <Tabs value={activeContentTab} onValueChange={setActiveContentTab} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="grid grid-cols-3 w-full h-auto p-1 gap-1 bg-background/80 border border-border/40 rounded-2xl shadow-lg backdrop-blur-md transition-all duration-300 hover:shadow-xl" style={{
            maxWidth: '900px'
          }}>
              <TabsTrigger value="videos" className="relative flex flex-col items-center justify-center gap-2 py-6 px-4 min-h-[120px] text-sm font-medium text-muted-foreground/80 bg-transparent border-0 rounded-xl transition-all duration-300 ease-out data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 data-[state=active]:scale-[1.02] hover:bg-background/50 hover:text-foreground/90 hover:shadow-sm hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 group overflow-hidden">
                <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 group-data-[state=active]:from-primary/10 group-data-[state=active]:to-primary/20 group-data-[state=active]:shadow-sm group-hover:from-primary/8 group-hover:to-primary/15 transition-all duration-300">
                  <Video className="w-6 h-6 transition-all duration-300 group-data-[state=active]:scale-110 group-data-[state=active]:text-primary" />
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-xs font-semibold leading-tight text-center px-1 group-data-[state=active]:text-sm transition-all duration-300">الفيديوهات التعليمية</span>
                  <span className="text-xs text-muted-foreground/70 bg-muted/30 rounded-full px-2 py-0.5 group-data-[state=active]:bg-primary/10 group-data-[state=active]:text-primary/80 transition-all duration-300">
                    {videos?.length || 0}
                  </span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger value="documents" className="relative flex flex-col items-center justify-center gap-2 py-6 px-4 min-h-[120px] text-sm font-medium text-muted-foreground/80 bg-transparent border-0 rounded-xl transition-all duration-300 ease-out data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 data-[state=active]:scale-[1.02] hover:bg-background/50 hover:text-foreground/90 hover:shadow-sm hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 group overflow-hidden">
                <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 group-data-[state=active]:from-primary/10 group-data-[state=active]:to-primary/20 group-data-[state=active]:shadow-sm group-hover:from-primary/8 group-hover:to-primary/15 transition-all duration-300">
                  <FileText className="w-6 h-6 transition-all duration-300 group-data-[state=active]:scale-110 group-data-[state=active]:text-primary" />
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-xs font-semibold leading-tight text-center px-1 group-data-[state=active]:text-sm transition-all duration-300">الملفات والمراجع</span>
                  <span className="text-xs text-muted-foreground/70 bg-muted/30 rounded-full px-2 py-0.5 group-data-[state=active]:bg-primary/10 group-data-[state=active]:text-primary/80 transition-all duration-300">
                    {documents?.length || 0}
                  </span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger value="projects" className="relative flex flex-col items-center justify-center gap-2 py-6 px-4 min-h-[120px] text-sm font-medium text-muted-foreground/80 bg-transparent border-0 rounded-xl transition-all duration-300 ease-out data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 data-[state=active]:scale-[1.02] hover:bg-background/50 hover:text-foreground/90 hover:shadow-sm hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 group overflow-hidden">
                <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 group-data-[state=active]:from-primary/10 group-data-[state=active]:to-primary/20 group-data-[state=active]:shadow-sm group-hover:from-primary/8 group-hover:to-primary/15 transition-all duration-300">
                  <Trophy className="w-6 h-6 transition-all duration-300 group-data-[state=active]:scale-110 group-data-[state=active]:text-primary" />
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-xs font-semibold leading-tight text-center px-1 group-data-[state=active]:text-sm transition-all duration-300">المشاريع النهائية</span>
                  <span className="text-xs text-muted-foreground/70 bg-muted/30 rounded-full px-2 py-0.5 group-data-[state=active]:bg-primary/10 group-data-[state=active]:text-primary/80 transition-all duration-300">
                    {projects?.length || 0}
                  </span>
                </div>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="videos" className="mt-6">
            {videos && videos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map(video => (
                  <ContentCard key={video.id} item={video} type="video" icon={Video} color="from-red-500 to-red-600" />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-red-500/10 to-red-600/10 flex items-center justify-center">
                  <Video className="h-8 w-8 text-red-500/50" />
                </div>
                <div>
                  <p className="font-medium text-foreground">لا توجد فيديوهات متاحة</p>
                  <p className="text-sm text-muted-foreground mt-1">سيتم عرض الفيديوهات التعليمية هنا</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            {documents && documents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documents.map(document => (
                  <ContentCard key={document.id} item={document} type="document" icon={FileText} color="from-blue-500 to-blue-600" />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-blue-500/10 to-blue-600/10 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-blue-500/50" />
                </div>
                <div>
                  <p className="font-medium text-foreground">لا توجد ملفات متاحة</p>
                  <p className="text-sm text-muted-foreground mt-1">سيتم عرض الملفات والمراجع هنا</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="projects" className="mt-6">
            {projects && projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(project => (
                  <ContentCard key={project.id} item={project} type="project" icon={Trophy} color="from-purple-500 to-purple-600" />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-purple-500/10 to-purple-600/10 flex items-center justify-center">
                  <Trophy className="h-8 w-8 text-purple-500/50" />
                </div>
                <div>
                  <p className="font-medium text-foreground">لا توجد مشاريع متاحة</p>
                  <p className="text-sm text-muted-foreground mt-1">سيتم عرض المشاريع النهائية هنا</p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Viewer Dialogs */}
        {selectedContent && viewerType && <Dialog open={!!selectedContent} onOpenChange={() => closeViewer()}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  معاينة المحتوى - {selectedContent.title}
                </DialogTitle>
              </DialogHeader>
              
              {viewerType === 'video' && <VideoViewer isOpen={!!selectedContent} onClose={closeViewer} video={selectedContent} onProgress={() => {}} onComplete={() => {}} isTeacherPreview={true} />}
              
              {viewerType === 'document' && <DocumentViewer isOpen={!!selectedContent} onClose={closeViewer} document={selectedContent} onProgress={() => {}} onComplete={() => {}} />}
              
              {viewerType === 'project' && <ProjectViewer isOpen={!!selectedContent} onClose={closeViewer} project={selectedContent} onProgress={() => {}} onComplete={() => {}} />}
            </DialogContent>
          </Dialog>}
      </div>;
  }
  return null;
};
export default TeacherContentViewer;