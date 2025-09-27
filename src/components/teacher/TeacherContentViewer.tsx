import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStudentContent } from '@/hooks/useStudentContent';
import { useStudentProgress } from '@/hooks/useStudentProgress';
import { useGrade10MiniProjects } from '@/hooks/useGrade10MiniProjects';
import { useGrade12Projects } from '@/hooks/useGrade12Projects';
import { useStudentGrade10Lessons } from '@/hooks/useStudentGrade10Lessons';
import { StudentGrade11Content } from '../student/StudentGrade11Content';
import { StudentGrade10Lessons } from '../student/StudentGrade10Lessons';
import { ComputerStructureLessons } from '../student/ComputerStructureLessons';
import KnowledgeAdventureRealContent from '../games/KnowledgeAdventureRealContent';
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
  Monitor,
  Settings,
  Network,
  Phone,
  Gamepad2,
  GraduationCap,
  Users,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface TeacherContentViewerProps {
  grade: '10' | '11' | '12';
}

export const TeacherContentViewer: React.FC<TeacherContentViewerProps> = ({ grade }) => {
  const { user } = useAuth();
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [viewerType, setViewerType] = useState<'video' | 'document' | 'lesson' | 'project' | null>(null);
  const [activeContentTab, setActiveContentTab] = useState('computer_structure');

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
    getContentStats: () => ({ totalLessons: 0 })
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
              
              {/* Teacher View Badge */}
              <div className="absolute top-4 left-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full px-3 py-1 text-xs font-medium shadow-lg border border-white/20">
                <Eye className="w-3 h-3 inline-block mr-1" />
                معاينة المعلم
              </div>
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

                  {/* Teacher View Badge */}
                  <div className="flex items-center gap-1 text-blue-600 flex-shrink-0 bg-blue-50 rounded-full px-3 py-1">
                    <Eye className="w-4 h-4" />
                    <span className="text-xs font-medium">معاينة</span>
                  </div>
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

              {/* Enhanced Bottom info and action */}
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {item.duration && (
                    <div className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1">
                      <Clock className="w-3 h-3" />
                      <span className="font-medium">{item.duration}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-blue-600 bg-blue-50 rounded-full px-3 py-1">
                    <Users className="w-3 h-3" />
                    <span className="font-medium text-xs">كما يراه الطلاب</span>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => handleContentClick(item, type)}
                  className="shrink-0 px-6 py-2 text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300 group-hover:scale-105"
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

  // Grade 10 Content with Tabs
  if (grade === '10') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">محتوى الصف العاشر</h2>
            <p className="text-muted-foreground">كما يراه الطلاب في لوحة تحكمهم</p>
          </div>
        </div>

        <Tabs value={activeContentTab} onValueChange={setActiveContentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-muted/50 rounded-xl p-1">
            <TabsTrigger value="computer_structure" className="flex items-center gap-2 text-sm">
              <Monitor className="h-4 w-4" />
              بنية الحاسوب
            </TabsTrigger>
            <TabsTrigger value="educational_explanations" className="flex items-center gap-2 text-sm">
              <BookOpen className="h-4 w-4" />
              شروحات تعليمية
            </TabsTrigger>
            <TabsTrigger value="windows_basics" className="flex items-center gap-2 text-sm">
              <Settings className="h-4 w-4" />
              أساسيات ويندوز
            </TabsTrigger>
            <TabsTrigger value="networks" className="flex items-center gap-2 text-sm">
              <Network className="h-4 w-4" />
              الشبكات
            </TabsTrigger>
            <TabsTrigger value="mobile_devices" className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4" />
              الأجهزة المحمولة
            </TabsTrigger>
            <TabsTrigger value="knowledge_adventure" className="flex items-center gap-2 text-sm">
              <Gamepad2 className="h-4 w-4" />
              لعبة المعرفة
            </TabsTrigger>
          </TabsList>

          <TabsContent value="computer_structure" className="mt-6">
            <ComputerStructureLessons />
          </TabsContent>

          <TabsContent value="educational_explanations" className="mt-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">الشروحات التعليمية</h3>
              <p className="text-muted-foreground">سيتم عرض الفيديوهات التعليمية هنا</p>
            </div>
          </TabsContent>

          <TabsContent value="windows_basics" className="mt-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">أساسيات ويندوز</h3>
              <p className="text-muted-foreground">سيتم عرض دروس ويندوز هنا</p>
            </div>
          </TabsContent>

          <TabsContent value="networks" className="mt-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">الشبكات</h3>
              <p className="text-muted-foreground">سيتم عرض دروس الشبكات هنا</p>
            </div>
          </TabsContent>

          <TabsContent value="mobile_devices" className="mt-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">الأجهزة المحمولة</h3>
              <p className="text-muted-foreground">سيتم عرض دروس الأجهزة المحمولة هنا</p>
            </div>
          </TabsContent>

          <TabsContent value="knowledge_adventure" className="mt-6">
            <KnowledgeAdventureRealContent />
          </TabsContent>
        </Tabs>

        {/* Viewer Dialogs */}
        {selectedContent && viewerType && (
          <Dialog open={!!selectedContent} onOpenChange={() => closeViewer()}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  معاينة المحتوى - {selectedContent.title}
                </DialogTitle>
              </DialogHeader>
              
              {viewerType === 'video' && (
                <VideoViewer 
                  isOpen={!!selectedContent}
                  onClose={closeViewer}
                  video={selectedContent}
                  onProgress={() => {}}
                  onComplete={() => {}}
                  isTeacherPreview={true}
                />
              )}
              
              {viewerType === 'document' && (
                <DocumentViewer 
                  isOpen={!!selectedContent}
                  onClose={closeViewer}
                  document={selectedContent}
                  onProgress={() => {}}
                  onComplete={() => {}}
                />
              )}
              
              {viewerType === 'lesson' && (
                <LessonViewer 
                  isOpen={!!selectedContent}
                  onClose={closeViewer}
                  lesson={selectedContent}
                  onProgress={() => {}}
                  onComplete={() => {}}
                />
              )}
              
              {viewerType === 'project' && (
                <ProjectViewer 
                  isOpen={!!selectedContent}
                  onClose={closeViewer}
                  project={selectedContent}
                  onProgress={() => {}}
                  onComplete={() => {}}
                />
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }

  // Grade 11 Content
  if (grade === '11') {
    return (
      <div className="space-y-6">
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
      </div>
    );
  }

  // Grade 12 Content
  if (grade === '12') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">محتوى الصف الثاني عشر</h2>
            <p className="text-muted-foreground">كما يراه الطلاب في لوحة تحكمهم</p>
          </div>
        </div>

        <div className="text-center py-8">
          <h3 className="text-lg font-semibold mb-2">محتوى الصف الثاني عشر</h3>
          <p className="text-muted-foreground">سيتم عرض محتوى الصف الثاني عشر هنا</p>
        </div>
      </div>
    );
  }

  return null;
};

export default TeacherContentViewer;