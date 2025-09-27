import React, { useState } from 'react';
import { useStudentGrade11Content } from '@/hooks/useStudentGrade11Content';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Search,
  FolderOpen,
  PlayCircle,
  Clock,
  Star,
  FileText,
  Target,
  Trophy,
  Video,
  Calendar,
  Play,
  CheckCircle,
  Eye,
  Users
} from 'lucide-react';
import Grade11LessonContentDisplay from '../content/Grade11LessonContentDisplay';
import { Grade11VideoViewer } from '@/components/content/Grade11VideoViewer';

export const StudentGrade11ModernContent: React.FC = () => {
  const { sections, videos, loading, error, getContentStats } = useStudentGrade11Content();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('lessons');

  const stats = getContentStats();

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

  // Filter functions
  const filteredLessons = (sections || []).flatMap(section => 
    section.topics?.flatMap(topic => 
      topic.lessons?.map(lesson => ({
        ...lesson,
        sectionTitle: section.title,
        topicTitle: topic.title
      })) || []
    ) || []
  ).filter(lesson => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      lesson.title.toLowerCase().includes(query) ||
      lesson.content?.toLowerCase().includes(query) ||
      lesson.sectionTitle.toLowerCase().includes(query) ||
      lesson.topicTitle.toLowerCase().includes(query)
    );
  });

  const filteredVideos = (videos || []).filter(video => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      video.title.toLowerCase().includes(query) ||
      video.description?.toLowerCase().includes(query) ||
      video.category.toLowerCase().includes(query)
    );
  });

  // Content Card Component
  const ContentCard: React.FC<{ 
    item: any; 
    type: 'lesson' | 'video';
    icon: any;
    color: string;
    onClick: () => void;
  }> = ({ item, type, icon: IconComponent, color, onClick }) => {
    const progress = Math.floor(Math.random() * 100); // Mock progress
    const isCompleted = progress >= 100;

    return (
      <Card className="group relative hover:shadow-xl transition-all duration-500 border-0 bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-md overflow-hidden hover:scale-[1.02] hover:-translate-y-1">
        {/* Animated Border */}
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
              
              {/* Enhanced Overlay */}
              <div 
                className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-all duration-500 flex items-center justify-center cursor-pointer"
                onClick={onClick}
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
              
              {/* Completion Badge */}
              {isCompleted && (
                <div className="absolute top-4 right-4 bg-green-500 text-white rounded-full p-2 shadow-lg">
                  <CheckCircle className="w-4 h-4" />
                </div>
              )}
              
              {/* Duration Badge */}
              {item.duration && (
                <div className="absolute bottom-4 left-4 bg-black/70 text-white text-sm px-3 py-1 rounded-full backdrop-blur-sm">
                  <Clock className="w-3 h-3 inline-block mr-1" />
                  {item.duration}
                </div>
              )}
            </div>
          )}

          {/* Content Section */}
          <div className="p-7">
            <div className="space-y-5">
              {/* Header with icon and title (for lessons) */}
              {type === 'lesson' && (
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${color} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground line-clamp-2 text-lg mb-2 group-hover:text-primary transition-colors duration-300">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {item.sectionTitle}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {item.topicTitle}
                      </Badge>
                    </div>
                    {item.content && (
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {item.content}
                      </p>
                    )}
                  </div>

                  {/* Completion Badge */}
                  {isCompleted && (
                    <div className="flex items-center gap-1 text-green-600 flex-shrink-0 bg-green-50 rounded-full px-3 py-1">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">مكتمل</span>
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
                  <Badge variant="secondary" className="text-xs">
                    {item.category}
                  </Badge>
                </div>
              )}

              {/* Progress Bar */}
              {progress > 0 && progress < 100 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">التقدم</span>
                    <span className="font-medium text-primary">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {/* Bottom info and action */}
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {item.media && item.media.length > 0 && (
                    <div className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1">
                      <PlayCircle className="w-3 h-3" />
                      <span className="font-medium">{item.media.length} ملف</span>
                    </div>
                  )}
                  {item.duration && (
                    <div className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1">
                      <Clock className="w-3 h-3" />
                      <span className="font-medium">{item.duration}</span>
                    </div>
                  )}
                </div>

                <Button
                  size="sm"
                  onClick={onClick}
                  className="shrink-0 px-6 py-2 text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300 group-hover:scale-105"
                >
                  {type === 'lesson' ? 'دراسة' : 'مشاهدة'}
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
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-r from-primary to-primary/60 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              محتوى الصف الحادي عشر
            </h2>
            <p className="text-muted-foreground mt-2">جاري تحميل المحتوى التعليمي...</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-8 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-0">
                <div className="h-48 bg-muted rounded-t-lg"></div>
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="text-center p-12">
        <div className="space-y-6">
          <div className="w-20 h-20 mx-auto bg-gradient-to-r from-red-100 to-red-200 rounded-2xl flex items-center justify-center">
            <FileText className="w-10 h-10 text-red-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground mb-2">حدث خطأ في تحميل المحتوى</h3>
            <p className="text-muted-foreground text-lg">{error}</p>
          </div>
          <Button onClick={() => window.location.reload()} size="lg" className="px-8">
            إعادة المحاولة
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-primary to-primary/60 rounded-2xl shadow-lg mb-4">
          <BookOpen className="w-10 h-10 text-white" />
        </div>
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
            محتوى الصف الحادي عشر
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            استكشف المحتوى التعليمي المنظم في دروس وفيديوهات تفاعلية
          </p>
        </div>
      </div>

      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="group hover:shadow-xl transition-all duration-500 hover:-translate-y-2 bg-gradient-to-br from-blue-50 via-blue-50 to-blue-100/50 border-blue-200/60 hover:border-blue-300/60">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-1 group-hover:scale-110 transition-transform">{stats.totalSections}</div>
            <div className="text-sm text-blue-600/70 font-medium">أقسام</div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-500 hover:-translate-y-2 bg-gradient-to-br from-green-50 via-green-50 to-green-100/50 border-green-200/60 hover:border-green-300/60">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-1 group-hover:scale-110 transition-transform">{stats.totalLessons}</div>
            <div className="text-sm text-green-600/70 font-medium">دروس</div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-500 hover:-translate-y-2 bg-gradient-to-br from-purple-50 via-purple-50 to-purple-100/50 border-purple-200/60 hover:border-purple-300/60">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
              <PlayCircle className="w-6 h-6 text-white" />
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-1 group-hover:scale-110 transition-transform">{stats.totalMedia}</div>
            <div className="text-sm text-purple-600/70 font-medium">وسائط</div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-500 hover:-translate-y-2 bg-gradient-to-br from-red-50 via-red-50 to-red-100/50 border-red-200/60 hover:border-red-300/60">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div className="text-3xl font-bold text-red-600 mb-1 group-hover:scale-110 transition-transform">{stats.totalVideos}</div>
            <div className="text-sm text-red-600/70 font-medium">فيديوهات</div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Search */}
      <div className="flex gap-4 max-w-2xl mx-auto">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="ابحث في الدروس والفيديوهات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 py-4 text-base border-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow focus:border-primary"
          />
        </div>
        {searchQuery && (
          <Button variant="outline" onClick={() => setSearchQuery('')} className="px-8 py-4 rounded-2xl">
            مسح
          </Button>
        )}
      </div>

      {/* Enhanced Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-center mb-8">
          <TabsList className="grid grid-cols-2 h-16 p-1 bg-background/80 border border-border/40 rounded-2xl shadow-lg backdrop-blur-md transition-all duration-300 hover:shadow-xl">
            <TabsTrigger 
              value="lessons" 
              className="flex items-center gap-3 text-base font-medium h-14 px-8 rounded-xl transition-all duration-300 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:scale-[1.02]"
            >
              <BookOpen className="w-5 h-5" />
              الدروس ({filteredLessons.length})
            </TabsTrigger>
            <TabsTrigger 
              value="videos" 
              className="flex items-center gap-3 text-base font-medium h-14 px-8 rounded-xl transition-all duration-300 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:scale-[1.02]"
            >
              <Video className="w-5 h-5" />
              الفيديوهات ({filteredVideos.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="lessons" className="mt-8">
          {filteredLessons.length === 0 ? (
            <Card className="text-center p-12">
              <div className="space-y-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-r from-muted to-muted/50 rounded-2xl flex items-center justify-center">
                  <Search className="w-10 h-10 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">لا توجد دروس</h3>
                  <p className="text-muted-foreground text-lg">
                    {searchQuery ? `لم يتم العثور على دروس تطابق البحث "${searchQuery}"` : 'لا توجد دروس متاحة حالياً'}
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredLessons.map((lesson) => (
                <ContentCard
                  key={lesson.id}
                  item={lesson}
                  type="lesson"
                  icon={BookOpen}
                  color="from-blue-500 to-cyan-500"
                  onClick={() => setSelectedLesson(lesson)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="videos" className="mt-8">
          {filteredVideos.length === 0 ? (
            <Card className="text-center p-12">
              <div className="space-y-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-r from-muted to-muted/50 rounded-2xl flex items-center justify-center">
                  <Video className="w-10 h-10 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">لا توجد فيديوهات</h3>
                  <p className="text-muted-foreground text-lg">
                    {searchQuery ? `لم يتم العثور على فيديوهات تطابق البحث "${searchQuery}"` : 'لا توجد فيديوهات متاحة حالياً'}
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredVideos.map((video) => (
                <ContentCard
                  key={video.id}
                  item={video}
                  type="video"
                  icon={Video}
                  color="from-red-500 to-pink-500"
                  onClick={() => setSelectedVideo(video)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Lesson Dialog */}
      <Dialog open={!!selectedLesson} onOpenChange={() => setSelectedLesson(null)}>
        <DialogContent className="max-w-6xl h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-right">
              {selectedLesson?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedLesson && (
            <Grade11LessonContentDisplay lesson={selectedLesson} />
          )}
        </DialogContent>
      </Dialog>

      {/* Video Dialog */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-6xl h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-right">
              {selectedVideo?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedVideo && (
            <Grade11VideoViewer video={selectedVideo} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentGrade11ModernContent;