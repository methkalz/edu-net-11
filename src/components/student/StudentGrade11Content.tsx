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
  const filteredSections = (sections || []).filter(section => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      section.title.toLowerCase().includes(query) ||
      section.description?.toLowerCase().includes(query) ||
      section.topics?.some(topic => 
        topic.title.toLowerCase().includes(query) ||
        topic.content?.toLowerCase().includes(query) ||
        topic.lessons?.some(lesson => 
          lesson.title.toLowerCase().includes(query) ||
          lesson.content?.toLowerCase().includes(query)
        )
      )
    );
  });

  // Filter videos based on search
  const filteredVideos = (videos || []).filter(video => {
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
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-light text-foreground">محتوى الصف الحادي عشر</h2>
          <p className="text-text-soft font-light">جاري تحميل المحتوى التعليمي...</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="border border-divider bg-surface-light shadow-none">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-background rounded-2xl border border-divider animate-pulse"></div>
                <div className="h-6 bg-background rounded-xl mb-2 animate-pulse"></div>
                <div className="h-4 bg-background rounded-lg animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border border-divider bg-surface-light shadow-none">
              <CardContent className="p-8">
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-16 h-16 bg-background rounded-3xl border border-divider animate-pulse"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-6 bg-background rounded-xl w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-background rounded-lg w-1/2 animate-pulse"></div>
                  </div>
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
      <Card className="text-center p-12 border border-divider bg-surface-light shadow-none">
        <div className="space-y-6">
          <div className="w-20 h-20 mx-auto bg-background rounded-3xl flex items-center justify-center border border-divider">
            <FileText className="w-10 h-10 text-text-soft" />
          </div>
          <h3 className="text-xl font-light text-foreground">حدث خطأ في تحميل المحتوى</h3>
          <p className="text-text-soft font-light">{error}</p>
          <Button onClick={() => window.location.reload()} variant="ghost" className="font-light">
            إعادة المحاولة
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Minimal Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-light text-foreground">
          محتوى الصف الحادي عشر
        </h1>
        <p className="text-text-soft text-lg font-light max-w-2xl mx-auto">
          استكشف المحتوى التعليمي المنظم في أقسام ومواضيع ودروس تفاعلية
        </p>
      </div>

      {/* Clean Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        <Card className="border border-divider bg-surface-light hover:bg-surface-hover transition-all duration-300 shadow-none">
          <CardContent className="p-6 text-center">
            <div className="w-14 h-14 mx-auto mb-4 bg-background rounded-2xl flex items-center justify-center border border-divider">
              <FolderOpen className="w-7 h-7 text-muted-foreground" />
            </div>
            <div className="text-2xl font-light text-foreground mb-1">{stats.totalSections}</div>
            <div className="text-sm text-text-soft font-light">أقسام</div>
          </CardContent>
        </Card>

        <Card className="border border-divider bg-surface-light hover:bg-surface-hover transition-all duration-300 shadow-none">
          <CardContent className="p-6 text-center">
            <div className="w-14 h-14 mx-auto mb-4 bg-background rounded-2xl flex items-center justify-center border border-divider">
              <Target className="w-7 h-7 text-muted-foreground" />
            </div>
            <div className="text-2xl font-light text-foreground mb-1">{stats.totalTopics}</div>
            <div className="text-sm text-text-soft font-light">مواضيع</div>
          </CardContent>
        </Card>

        <Card className="border border-divider bg-surface-light hover:bg-surface-hover transition-all duration-300 shadow-none">
          <CardContent className="p-6 text-center">
            <div className="w-14 h-14 mx-auto mb-4 bg-background rounded-2xl flex items-center justify-center border border-divider">
              <BookOpen className="w-7 h-7 text-muted-foreground" />
            </div>
            <div className="text-2xl font-light text-foreground mb-1">{stats.totalLessons}</div>
            <div className="text-sm text-text-soft font-light">دروس</div>
          </CardContent>
        </Card>

        <Card className="border border-divider bg-surface-light hover:bg-surface-hover transition-all duration-300 shadow-none">
          <CardContent className="p-6 text-center">
            <div className="w-14 h-14 mx-auto mb-4 bg-background rounded-2xl flex items-center justify-center border border-divider">
              <PlayCircle className="w-7 h-7 text-muted-foreground" />
            </div>
            <div className="text-2xl font-light text-foreground mb-1">{stats.totalMedia}</div>
            <div className="text-sm text-text-soft font-light">وسائط</div>
          </CardContent>
        </Card>

        <Card className="border border-divider bg-surface-light hover:bg-surface-hover transition-all duration-300 shadow-none">
          <CardContent className="p-6 text-center">
            <div className="w-14 h-14 mx-auto mb-4 bg-background rounded-2xl flex items-center justify-center border border-divider">
              <Video className="w-7 h-7 text-muted-foreground" />
            </div>
            <div className="text-2xl font-light text-foreground mb-1">{stats.totalVideos}</div>
            <div className="text-sm text-text-soft font-light">فيديوهات</div>
          </CardContent>
        </Card>
      </div>

      {/* Minimal Search */}
      <div className="flex gap-4 max-w-2xl mx-auto">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-soft w-5 h-5" />
          <Input
            placeholder="ابحث في المحتوى..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 py-4 text-base border-divider bg-surface-light focus:bg-background transition-colors font-light"
          />
        </div>
        {searchQuery && (
          <Button variant="ghost" onClick={() => setSearchQuery('')} className="px-6 py-4 text-text-soft hover:text-foreground">
            مسح
          </Button>
        )}
      </div>

      {/* Clean Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-14 bg-surface-light border border-divider">
          <TabsTrigger value="lessons" className="flex items-center gap-3 text-base font-light py-3">
            <BookOpen className="w-5 h-5" />
            الدروس ({(sections || []).length})
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-3 text-base font-light py-3">
            <Video className="w-5 h-5" />
            الفيديوهات ({(videos || []).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lessons" className="space-y-6 mt-8">
          {filteredSections.length === 0 ? (
            <Card className="text-center p-12 border border-divider bg-surface-light">
              <div className="space-y-4">
                <Search className="w-16 h-16 mx-auto text-text-soft" />
                <h3 className="text-xl font-light text-foreground">لا توجد نتائج</h3>
                <p className="text-text-soft font-light">
                  لم يتم العثور على محتوى يطابق البحث "{searchQuery}"
                </p>
              </div>
            </Card>
          ) : (
            filteredSections.map((section) => (
              <Card key={section.id} className="border border-divider bg-surface-light shadow-none">
                <Collapsible 
                  open={openSections.includes(section.id)}
                  onOpenChange={() => toggleSection(section.id)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-surface-hover transition-colors p-8">
                       <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-background rounded-3xl flex items-center justify-center border border-divider">
                            <FolderOpen className="w-8 h-8 text-text-soft" />
                          </div>
                          <div className="text-left">
                            <CardTitle className="text-2xl font-light text-foreground">{section.title}</CardTitle>
                            {section.description && (
                              <p className="text-base text-text-soft mt-3 font-light">
                                {section.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="secondary" className="text-sm px-4 py-2 bg-background border border-divider font-light">
                            {section.topics.length} موضوع
                          </Badge>
                          {openSections.includes(section.id) ? (
                            <ChevronDown className="w-6 h-6 text-text-soft" />
                          ) : (
                            <ChevronRight className="w-6 h-6 text-text-soft" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="pt-0 px-8 pb-8">
                      <div className="space-y-4">
                        {section.topics.map((topic) => (
                          <Card key={topic.id} className="mr-8 border border-divider bg-background shadow-none">
                            <Collapsible
                              open={openTopics.includes(topic.id)}
                              onOpenChange={() => toggleTopic(topic.id)}
                            >
                              <CollapsibleTrigger asChild>
                                <CardHeader className="cursor-pointer hover:bg-surface-light transition-colors py-6">
                                   <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-5">
                                      <div className="w-12 h-12 bg-surface-light rounded-2xl flex items-center justify-center border border-divider">
                                        <Target className="w-6 h-6 text-text-soft" />
                                      </div>
                                      <div className="text-left">
                                        <h4 className="font-light text-lg text-foreground">{topic.title}</h4>
                                        {topic.content && (
                                          <p className="text-sm text-text-soft mt-2 line-clamp-2 font-light">
                                            {topic.content}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <Badge variant="outline" className="text-sm px-3 py-1 font-light border-divider">
                                        {topic.lessons.length} درس
                                      </Badge>
                                      {openTopics.includes(topic.id) ? (
                                        <ChevronDown className="w-5 h-5 text-text-soft" />
                                      ) : (
                                        <ChevronRight className="w-5 h-5 text-text-soft" />
                                      )}
                                    </div>
                                  </div>
                                </CardHeader>
                              </CollapsibleTrigger>

                              <CollapsibleContent>
                                <CardContent className="pt-0 px-6 pb-6">
                                  <div className="space-y-3">
                                    {topic.lessons.map((lesson) => (
                                       <div
                                        key={lesson.id}
                                        className="flex items-center justify-between p-5 bg-surface-light rounded-2xl border border-divider hover:bg-surface-hover transition-colors cursor-pointer"
                                        onClick={() => setSelectedLesson(lesson)}
                                      >
                                        <div className="flex items-center gap-5">
                                          <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center border border-divider">
                                            <BookOpen className="w-5 h-5 text-text-soft" />
                                          </div>
                                          <div>
                                            <h5 className="text-base font-light text-foreground">{lesson.title}</h5>
                                            {lesson.media && lesson.media.length > 0 && (
                                              <div className="flex items-center gap-2 mt-2">
                                                <PlayCircle className="w-4 h-4 text-text-soft" />
                                                <span className="text-sm text-text-soft font-light">
                                                  {lesson.media.length} ملف وسائط
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <Button variant="ghost" className="px-5 text-text-soft hover:text-foreground font-light">
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
                  <div className="aspect-video bg-gradient-to-r from-red-500 to-pink-500 relative overflow-hidden cursor-pointer group" onClick={() => setSelectedVideo(video)}>
                    {video.thumbnail_url ? (
                      <img 
                        src={video.thumbnail_url} 
                        alt={video.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : null}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                      <PlayCircle className="w-16 h-16 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {video.duration && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="bg-black/60 text-white">
                          <Clock className="w-3 h-3 ml-1" />
                          {video.duration}
                        </Badge>
                      </div>
                    )}
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
                hideTitle={true}
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