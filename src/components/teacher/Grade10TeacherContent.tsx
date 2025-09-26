import React, { useState } from 'react';
import { useGrade10Files } from '@/hooks/useGrade10Files';
import { useGrade10MiniProjects } from '@/hooks/useGrade10MiniProjects';
import { useStudentGrade10Lessons } from '@/hooks/useStudentGrade10Lessons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Play, 
  FileText, 
  FolderOpen, 
  Clock, 
  CheckCircle, 
  Star,
  BookOpen,
  Video,
  Monitor,
  Settings,
  Network,
  Phone,
  Search,
  Users,
  TrendingUp
} from 'lucide-react';

const Grade10TeacherContent: React.FC = () => {
  const { videos, documents, loading } = useGrade10Files();
  const { projects: miniProjects, loading: projectsLoading } = useGrade10MiniProjects();
  const { sections: lessonSections, loading: lessonsLoading } = useStudentGrade10Lessons();
  
  const [activeTab, setActiveTab] = useState('computer_structure');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Content filtering
  const getFilteredVideos = (category: string) => {
    if (!videos) return [];
    return videos
      .filter(video => (video.video_category || 'educational_explanations') === category)
      .filter(video =>
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (video.description && video.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
  };

  const getFilteredLessons = (sectionId: string) => {
    if (!lessonSections) return [];
    const section = lessonSections.find(s => s.id === sectionId);
    if (!section) return [];
    
    // Collect all lessons from all topics in the section
    const allLessons = section.topics.reduce((acc, topic) => {
      return [...acc, ...topic.lessons];
    }, [] as any[]);
    
    return allLessons.filter(lesson =>
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lesson.description && lesson.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const getFilteredDocuments = () => {
    if (!documents) return [];
    return documents.filter(doc =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const getFilteredProjects = () => {
    if (!miniProjects) return [];
    return miniProjects.filter(project =>
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  // Teacher-specific content card with analytics
  const TeacherContentCard: React.FC<{ 
    item: any; 
    type: 'video' | 'document' | 'lesson' | 'project';
    icon: any;
    color: string;
  }> = ({ item, type, icon: IconComponent, color }) => {
    // Mock student engagement data
    const totalStudents = 25;
    const completedStudents = Math.floor(Math.random() * totalStudents);
    const avgProgress = Math.floor(Math.random() * 100);

    return (
      <Card className="group relative hover:shadow-xl transition-all duration-500 border-0 bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-md overflow-hidden hover:scale-[1.02] hover:-translate-y-1">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
        
        <CardContent className="p-0 relative">
          {/* Video Thumbnail Section */}
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
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-all duration-500 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110">
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/20 rounded-full blur-xl"></div>
                    <div className="relative bg-white/15 hover:bg-white/25 rounded-full p-4 backdrop-blur-md border border-white/20 shadow-2xl">
                      <Play className="w-8 h-8 text-white fill-white drop-shadow-lg" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Teacher Analytics Overlay */}
              <div className="absolute top-4 left-4 space-y-2">
                <div className="bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                  <Users className="w-3 h-3 inline mr-1" />
                  {completedStudents}/{totalStudents} مكتمل
                </div>
                <div className="bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  {avgProgress}% متوسط التقدم
                </div>
              </div>
              
              {item.duration && (
                <div className="absolute bottom-4 left-4 bg-black/60 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm border border-white/20">
                  {item.duration}
                </div>
              )}
            </div>
          )}

          {/* Content Section */}
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

              {/* Teacher Analytics */}
              <div className="space-y-3 bg-muted/30 rounded-lg p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium">إحصائيات الطلاب</span>
                  <span className="font-bold text-primary">{completedStudents}/{totalStudents}</span>
                </div>
                <Progress value={(completedStudents / totalStudents) * 100} className="h-2 bg-muted/50" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>معدل الإكمال: {Math.round((completedStudents / totalStudents) * 100)}%</span>
                  <span>متوسط التقدم: {avgProgress}%</span>
                </div>
              </div>

              {/* Bottom info and action */}
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {item.duration && (
                    <div className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1">
                      <Clock className="w-3 h-3" />
                      <span className="font-medium">{item.duration}</span>
                    </div>
                  )}
                </div>

                <Button
                  size="sm"
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

  if (loading || projectsLoading || lessonsLoading) {
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

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">محتوى الصف العاشر</CardTitle>
              <p className="text-sm text-muted-foreground">عرض ومتابعة محتوى طلاب الصف العاشر</p>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="البحث في المحتوى..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="computer_structure" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              مبنى الحاسوب
            </TabsTrigger>
            <TabsTrigger value="windows_basics" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              أساسيات الويندوز  
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              المستندات
            </TabsTrigger>
            <TabsTrigger value="mini_projects" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              ميني برويكت
            </TabsTrigger>
          </TabsList>

          {/* Computer Structure Tab */}
          <TabsContent value="computer_structure" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">مبنى الحاسوب - فيديوهات تعليمية</h3>
                <Badge variant="secondary">
                  {getFilteredVideos('educational_explanations').length} فيديو
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredVideos('educational_explanations').map((video) => (
                  <TeacherContentCard
                    key={video.id}
                    item={video}
                    type="video"
                    icon={Video}
                    color="from-blue-500 to-indigo-600"
                  />
                ))}
              </div>
              
              {getFilteredVideos('educational_explanations').length === 0 && (
                <div className="text-center py-12">
                  <Monitor className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">لا توجد فيديوهات في مبنى الحاسوب</h3>
                  <p className="text-muted-foreground">لم يتم إضافة أي فيديوهات في هذا القسم بعد</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Windows Basics Tab */}
          <TabsContent value="windows_basics" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">أساسيات الويندوز</h3>
                <Badge variant="secondary">
                  {getFilteredVideos('windows_basics').length} فيديو
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredVideos('windows_basics').map((video) => (
                  <TeacherContentCard
                    key={video.id}
                    item={video}
                    type="video"
                    icon={Settings}
                    color="from-green-500 to-emerald-600"
                  />
                ))}
              </div>
              
              {getFilteredVideos('windows_basics').length === 0 && (
                <div className="text-center py-12">
                  <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">لا توجد فيديوهات في أساسيات الويندوز</h3>
                  <p className="text-muted-foreground">لم يتم إضافة أي فيديوهات في هذا القسم بعد</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">المستندات والملفات</h3>
                <Badge variant="secondary">
                  {getFilteredDocuments().length} مستند
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredDocuments().map((document) => (
                  <TeacherContentCard
                    key={document.id}
                    item={document}
                    type="document"
                    icon={FileText}
                    color="from-purple-500 to-violet-600"
                  />
                ))}
              </div>
              
              {getFilteredDocuments().length === 0 && (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">لا توجد مستندات</h3>
                  <p className="text-muted-foreground">لم يتم إضافة أي مستندات في هذا القسم بعد</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Mini Projects Tab */}
          <TabsContent value="mini_projects" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">ميني برويكت</h3>
                <Badge variant="secondary">
                  {getFilteredProjects().length} مشروع
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredProjects().map((project) => (
                  <TeacherContentCard
                    key={project.id}
                    item={project}
                    type="project"
                    icon={FolderOpen}
                    color="from-teal-500 to-cyan-600"
                  />
                ))}
              </div>
              
              {getFilteredProjects().length === 0 && (
                <div className="text-center py-12">
                  <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">لا توجد مشاريع صغيرة</h3>
                  <p className="text-muted-foreground">لم يتم إنشاء أي مشاريع صغيرة بعد</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default Grade10TeacherContent;