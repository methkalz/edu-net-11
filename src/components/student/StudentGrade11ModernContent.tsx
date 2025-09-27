import React, { useState, useEffect } from 'react';
import { useStudentGrade11Content } from '@/hooks/useStudentGrade11Content';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Play, 
  FileText, 
  FolderOpen, 
  Clock, 
  CheckCircle, 
  Star,
  BookOpen,
  Video,
  Search,
  ExternalLink,
  Trophy,
  Target,
  Sparkles,
  PlayCircle,
  Monitor,
  Network,
  Settings
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

  // Flatten lessons from sections for card display
  const getAllLessons = () => {
    const allLessons: any[] = [];
    (sections || []).forEach(section => {
      section.topics?.forEach(topic => {
        topic.lessons?.forEach(lesson => {
          allLessons.push({
            ...lesson,
            sectionTitle: section.title,
            topicTitle: topic.title,
            sectionId: section.id,
            topicId: topic.id
          });
        });
      });
    });
    return allLessons;
  };

  // Filter lessons based on search
  const filteredLessons = getAllLessons().filter(lesson => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      lesson.title.toLowerCase().includes(query) ||
      lesson.content?.toLowerCase().includes(query) ||
      lesson.sectionTitle.toLowerCase().includes(query) ||
      lesson.topicTitle.toLowerCase().includes(query)
    );
  });

  // Filter videos based on search
  const filteredVideos = (videos || []).filter(video => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      video.title.toLowerCase().includes(query) ||
      video.description?.toLowerCase().includes(query) ||
      video.category?.toLowerCase().includes(query)
    );
  });

  const ContentCard: React.FC<{ 
    item: any; 
    type: 'lesson' | 'video';
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
                onClick={() => setSelectedVideo(item)}
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

          {/* Content Section */}
          <div className="p-7">
            <div className="space-y-5">
              {/* Header with icon and title (for lesson content) */}
              {type !== 'video' && (
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${color} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground line-clamp-2 text-lg mb-2 group-hover:text-primary transition-colors duration-300">
                      {item.title}
                    </h3>
                    
                    {/* Section and Topic info for lessons */}
                    {item.sectionTitle && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          {item.sectionTitle}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          {item.topicTitle}
                        </Badge>
                      </div>
                    )}
                    
                    {item.content && (
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {item.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
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
                  {item.category && (
                    <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                      {item.category}
                    </Badge>
                  )}
                </div>
              )}

              {/* Progress bar */}
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

              {/* Bottom info and action */}
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {item.media?.length > 0 && type === 'lesson' && (
                    <div className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1">
                      <PlayCircle className="w-3 h-3" />
                      <span className="font-medium">{item.media.length} وسائط</span>
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
                  onClick={() => type === 'lesson' ? setSelectedLesson(item) : setSelectedVideo(item)}
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
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            محتوى الصف الحادي عشر
          </h2>
          <p className="text-muted-foreground text-lg">جاري تحميل المحتوى التعليمي...</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
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

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="text-center space-y-6">
        <div className="inline-flex items-center gap-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/50 rounded-2xl px-8 py-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              محتوى الصف الحادي عشر
            </h2>
            <p className="text-muted-foreground">
              استكشف الدروس والفيديوهات التعليمية المتقدمة
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200 hover:scale-105">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:shadow-lg transition-shadow">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-1">{stats.totalSections}</div>
            <div className="text-sm text-muted-foreground font-medium">أقسام</div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-green-200 hover:scale-105">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center group-hover:shadow-lg transition-shadow">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-1">{stats.totalTopics}</div>
            <div className="text-sm text-muted-foreground font-medium">مواضيع</div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-purple-200 hover:scale-105">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:shadow-lg transition-shadow">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-1">{stats.totalLessons}</div>
            <div className="text-sm text-muted-foreground font-medium">دروس</div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-orange-200 hover:scale-105">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:shadow-lg transition-shadow">
              <PlayCircle className="w-6 h-6 text-white" />
            </div>
            <div className="text-3xl font-bold text-orange-600 mb-1">{stats.totalMedia}</div>
            <div className="text-sm text-muted-foreground font-medium">وسائط</div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-red-200 hover:scale-105">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center group-hover:shadow-lg transition-shadow">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div className="text-3xl font-bold text-red-600 mb-1">{stats.totalVideos}</div>
            <div className="text-sm text-muted-foreground font-medium">فيديوهات</div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="ابحث في الدروس والفيديوهات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 py-3 text-base border-2 rounded-xl shadow-sm focus:shadow-md transition-shadow"
          />
        </div>
        {searchQuery && (
          <Button 
            variant="outline" 
            onClick={() => setSearchQuery('')} 
            className="px-6 py-3 rounded-xl"
          >
            مسح
          </Button>
        )}
      </div>

      {/* Enhanced Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 h-14 p-1 bg-muted/50 rounded-xl">
          <TabsTrigger 
            value="lessons" 
            className="flex items-center gap-3 text-base font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md"
          >
            <BookOpen className="w-5 h-5" />
            الدروس ({filteredLessons.length})
          </TabsTrigger>
          <TabsTrigger 
            value="videos" 
            className="flex items-center gap-3 text-base font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md"
          >
            <Video className="w-5 h-5" />
            الفيديوهات ({filteredVideos.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lessons" className="space-y-6 mt-8">
          {filteredLessons.length === 0 ? (
            <Card className="text-center p-12 border-2 border-dashed">
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold">لا توجد دروس</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? `لم يتم العثور على دروس تطابق "${searchQuery}"` : 'لا توجد دروس متاحة حالياً'}
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLessons.map((lesson) => (
                <ContentCard
                  key={lesson.id}
                  item={lesson}
                  type="lesson"
                  icon={BookOpen}
                  color="from-purple-500 to-purple-600"
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="videos" className="space-y-6 mt-8">
          {/* OSI Model Video Series Introduction */}
          <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200/50 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shrink-0">
                  <div className="text-white text-lg font-bold">OSI</div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-blue-900 mb-2">نموذج OSI - الطبقات السبع</h3>
                  <p className="text-blue-800 leading-relaxed">
                    أمامك سلسلة فيديوهات تشرح نموذج OSI بطبقاته السبع. مناسبة لك إذا أردت تقوية معلوماتك. نشرح خطوة بخطوة وظيفة كل طبقة والأجهزة التي تعمل فيها.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {filteredVideos.length === 0 ? (
            <Card className="text-center p-12 border-2 border-dashed">
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                  <Video className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold">لا توجد فيديوهات</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? `لم يتم العثور على فيديوهات تطابق "${searchQuery}"` : 'لا توجد فيديوهات متاحة حالياً'}
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map((video) => (
                <ContentCard
                  key={video.id}
                  item={video}
                  type="video"
                  icon={Video}
                  color="from-red-500 to-red-600"
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Lesson Modal */}
      <Dialog open={!!selectedLesson} onOpenChange={() => setSelectedLesson(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-primary" />
              {selectedLesson?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedLesson && (
            <Grade11LessonContentDisplay lesson={selectedLesson} />
          )}
        </DialogContent>
      </Dialog>

      {/* Video Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-3">
              <Video className="w-6 h-6 text-primary" />
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