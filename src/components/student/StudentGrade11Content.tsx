import React, { useState } from 'react';
import { useStudentGrade11Content } from '@/hooks/useStudentGrade11Content';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  BookOpen, 
  ChevronDown, 
  ChevronRight,
  Search,
  FolderOpen,
  PlayCircle,
  Clock,
  Star,
  FileText,
  BookMarked,
  Target,
  Trophy,
  Video,
  Calendar
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Grade11LessonContentDisplay from '../content/Grade11LessonContentDisplay';
import { Grade11VideoViewer } from '@/components/content/Grade11VideoViewer';

export const StudentGrade11Content: React.FC = () => {
  const { sections, videos, loading, error, getContentStats } = useStudentGrade11Content();
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [openTopics, setOpenTopics] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('lessons');

  const stats = getContentStats();

  // Toggle section open/close
  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Toggle topic open/close
  const toggleTopic = (topicId: string) => {
    setOpenTopics(prev => 
      prev.includes(topicId) 
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  // Filter sections based on search
  const filteredSections = sections.filter(section => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      section.title.toLowerCase().includes(query) ||
      section.description?.toLowerCase().includes(query) ||
      section.topics.some(topic => 
        topic.title.toLowerCase().includes(query) ||
        topic.content?.toLowerCase().includes(query) ||
        topic.lessons.some(lesson => 
          lesson.title.toLowerCase().includes(query) ||
          lesson.content?.toLowerCase().includes(query)
        )
      )
    );
  });

  // Filter videos based on search
  const filteredVideos = videos.filter(video => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      video.title.toLowerCase().includes(query) ||
      video.description?.toLowerCase().includes(query) ||
      video.category.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">محتوى الصف الحادي عشر</h2>
          <p className="text-muted-foreground">جاري تحميل المحتوى التعليمي...</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-8 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
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
      <Card className="text-center p-8">
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <FileText className="w-8 h-8 text-red-600" />
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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          محتوى الصف الحادي عشر
        </h2>
        <p className="text-muted-foreground">
          استكشف المحتوى التعليمي المنظم في أقسام ومواضيع ودروس
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-2 hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-1">{stats.totalSections}</div>
            <div className="text-sm text-muted-foreground font-medium">أقسام</div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-1">{stats.totalTopics}</div>
            <div className="text-sm text-muted-foreground font-medium">مواضيع</div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 rounded-full flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-1">{stats.totalLessons}</div>
            <div className="text-sm text-muted-foreground font-medium">دروس</div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-orange-100 rounded-full flex items-center justify-center">
              <PlayCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-orange-600 mb-1">{stats.totalMedia}</div>
            <div className="text-sm text-muted-foreground font-medium">وسائط</div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-red-100 rounded-full flex items-center justify-center">
              <Video className="w-6 h-6 text-red-600" />
            </div>
            <div className="text-3xl font-bold text-red-600 mb-1">{stats.totalVideos}</div>
            <div className="text-sm text-muted-foreground font-medium">فيديوهات</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="ابحث في المحتوى..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 py-3 text-base border-2"
          />
        </div>
        {searchQuery && (
          <Button variant="outline" onClick={() => setSearchQuery('')} className="px-6 py-3">
            مسح
          </Button>
        )}
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger value="lessons" className="flex items-center gap-2 text-base font-medium">
            <BookOpen className="w-5 h-5" />
            الدروس ({sections.length})
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-2 text-base font-medium">
            <Video className="w-5 h-5" />
            الفيديوهات ({videos.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lessons" className="space-y-4 mt-6">
          {filteredSections.length === 0 ? (
            <Card className="text-center p-8">
              <div className="space-y-4">
                <Search className="w-16 h-16 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-semibold">لا توجد نتائج</h3>
                <p className="text-muted-foreground">
                  لم يتم العثور على محتوى يطابق البحث "{searchQuery}"
                </p>
              </div>
            </Card>
          ) : (
            filteredSections.map((section) => (
              <Card key={section.id} className="overflow-hidden">
                <Collapsible 
                  open={openSections.includes(section.id)}
                  onOpenChange={() => toggleSection(section.id)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                       <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                            <FolderOpen className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-left">
                            <CardTitle className="text-xl font-bold">{section.title}</CardTitle>
                            {section.description && (
                              <p className="text-base text-muted-foreground mt-2">
                                {section.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="text-sm px-3 py-1">
                            {section.topics.length} موضوع
                          </Badge>
                          {openSections.includes(section.id) ? (
                            <ChevronDown className="w-6 h-6" />
                          ) : (
                            <ChevronRight className="w-6 h-6" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {section.topics.map((topic) => (
                          <Card key={topic.id} className="ml-4">
                            <Collapsible
                              open={openTopics.includes(topic.id)}
                              onOpenChange={() => toggleTopic(topic.id)}
                            >
                              <CollapsibleTrigger asChild>
                                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-4">
                                   <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                                        <Target className="w-5 h-5 text-white" />
                                      </div>
                                      <div className="text-left">
                                        <h4 className="font-semibold text-lg">{topic.title}</h4>
                                        {topic.content && (
                                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                            {topic.content}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <Badge variant="outline" className="text-sm px-3 py-1">
                                        {topic.lessons.length} درس
                                      </Badge>
                                      {openTopics.includes(topic.id) ? (
                                        <ChevronDown className="w-5 h-5" />
                                      ) : (
                                        <ChevronRight className="w-5 h-5" />
                                      )}
                                    </div>
                                  </div>
                                </CardHeader>
                              </CollapsibleTrigger>

                              <CollapsibleContent>
                                <CardContent className="pt-0">
                                  <div className="space-y-2">
                                    {topic.lessons.map((lesson) => (
                                       <div
                                        key={lesson.id}
                                        className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                                        onClick={() => setSelectedLesson(lesson)}
                                      >
                                        <div className="flex items-center gap-4">
                                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                            <BookOpen className="w-4 h-4 text-white" />
                                          </div>
                                          <div>
                                            <h5 className="text-base font-semibold">{lesson.title}</h5>
                                            {lesson.media && lesson.media.length > 0 && (
                                              <div className="flex items-center gap-2 mt-1">
                                                <PlayCircle className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground">
                                                  {lesson.media.length} ملف وسائط
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <Button variant="outline" size="sm" className="px-4">
                                          عرض
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </CollapsibleContent>
                            </Collapsible>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="videos" className="space-y-4 mt-6">
          {filteredVideos.length === 0 ? (
            <Card className="text-center p-8">
              <div className="space-y-4">
                <Video className="w-16 h-16 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-semibold">لا توجد فيديوهات</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? `لم يتم العثور على فيديوهات تطابق البحث "${searchQuery}"` : 'لا توجد فيديوهات متاحة حالياً'}
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredVideos.map((video) => (
                <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-gradient-to-r from-red-500 to-pink-500 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <PlayCircle className="w-16 h-16 text-white opacity-80" />
                    </div>
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="bg-black/60 text-white">
                        <Clock className="w-3 h-3 ml-1" />
                        {video.duration || 'غير محدد'}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2">{video.title}</h3>
                    {video.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                        {video.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {video.category}
                      </Badge>
                      <Button 
                        size="sm"
                        onClick={() => setSelectedVideo(video)}
                        className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                      >
                        <PlayCircle className="w-4 h-4 ml-1" />
                        مشاهدة
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Lesson Viewer Dialog */}
      {selectedLesson && (
        <Dialog open={!!selectedLesson} onOpenChange={() => setSelectedLesson(null)}>
          <DialogContent 
            className="max-w-5xl max-h-[92vh] overflow-y-auto bg-background/95 backdrop-blur-sm border-2"
            aria-describedby="lesson-content-description"
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-4 text-2xl font-bold text-foreground">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-bold leading-tight">{selectedLesson.title}</h2>
                  <p className="text-base text-muted-foreground font-normal mt-1">
                    درس تفاعلي - الصف الحادي عشر
                  </p>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            <div id="lesson-content-description" className="mt-6 px-2">
              <Grade11LessonContentDisplay
                lesson={selectedLesson}
                defaultExpanded={true}
                showControls={true}
                hideHeader={true}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Video Viewer Dialog */}
      {selectedVideo && (
        <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
          <DialogContent 
            className="max-w-5xl max-h-[92vh] overflow-y-auto bg-background/95 backdrop-blur-sm border-2"
            aria-describedby="video-content-description"
          >
            <DialogHeader className="pb-6 border-b border-border/50">
              <DialogTitle className="flex items-center gap-4 text-2xl font-bold text-foreground">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-bold leading-tight">{selectedVideo.title}</h2>
                  <p className="text-base text-muted-foreground font-normal mt-1">
                    فيديو تعليمي - الصف الحادي عشر
                  </p>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            <div id="video-content-description" className="mt-6 px-2">
              <Grade11VideoViewer 
                video={selectedVideo}
                onClose={() => setSelectedVideo(null)}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};