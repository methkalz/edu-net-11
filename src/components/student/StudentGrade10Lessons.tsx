import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  BookOpen,
  Monitor, 
  FolderOpen, 
  ChevronDown, 
  ChevronRight,
  FileText,
  Video,
  Music,
  Image as ImageIcon,
  Code,
  Download,
  Play,
  Search,
  Target,
  PlayCircle,
  Calendar,
  Maximize2
} from 'lucide-react';
import { useStudentGrade10Lessons, Grade10LessonWithMedia, Grade10LessonMedia } from '@/hooks/useStudentGrade10Lessons';
import Grade10MediaPreview from '@/components/content/Grade10MediaPreview';

export const StudentGrade10Lessons: React.FC = () => {
  const { sections, loading, error, getContentStats } = useStudentGrade10Lessons();
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [openTopics, setOpenTopics] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<Grade10LessonWithMedia | null>(null);
  const [previewMedia, setPreviewMedia] = useState<Grade10LessonMedia | null>(null);
  const [activeTab, setActiveTab] = useState('communication');

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

  // Filter sections for communication basics (exclude computer composition topics)
  const communicationSections = (sections || []).filter(section => {
    // Exclude sections or topics related to computer composition
    const isComputerTopic = section.title.toLowerCase().includes('تركيبة الحاسوب') ||
                           section.title.toLowerCase().includes('القطع') ||
                           section.description?.toLowerCase().includes('تركيبة الحاسوب') ||
                           section.description?.toLowerCase().includes('القطع');
    
    if (isComputerTopic) return false;
    
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      section.title.toLowerCase().includes(query) ||
      section.description?.toLowerCase().includes(query) ||
      section.topics?.some(topic => {
        // Also exclude computer composition topics from search
        const isTopicComputer = topic.title.toLowerCase().includes('تركيبة الحاسوب') ||
                              topic.title.toLowerCase().includes('القطع') ||
                              topic.content?.toLowerCase().includes('تركيبة الحاسوب') ||
                              topic.content?.toLowerCase().includes('القطع');
        
        if (isTopicComputer) return false;
        
        return (
          topic.title.toLowerCase().includes(query) ||
          topic.content?.toLowerCase().includes(query) ||
          topic.lessons?.some(lesson => 
            lesson.title.toLowerCase().includes(query) ||
            lesson.content?.toLowerCase().includes(query)
          )
        );
      })
    );
  });

  // For computer composition tab - only sections/topics related to computer composition
  const computerSections = (sections || []).filter(section => {
    const isComputerTopic = section.title.toLowerCase().includes('تركيبة الحاسوب') ||
                           section.title.toLowerCase().includes('القطع') ||
                           section.description?.toLowerCase().includes('تركيبة الحاسوب') ||
                           section.description?.toLowerCase().includes('القطع');
    
    if (!isComputerTopic) return false;
    
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

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'video': return <Video className="w-4 h-4 text-white" />;
      case 'image': return <ImageIcon className="w-4 h-4 text-white" />;
      case 'code': return <Code className="w-4 h-4 text-white" />;
      case 'lottie': return <Play className="w-4 h-4 text-white" />;
      default: return <FileText className="w-4 h-4 text-white" />;
    }
  };

  const getMediaColor = (mediaType: string) => {
    switch (mediaType) {
      case 'video': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'image': return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case 'code': return 'bg-gradient-to-r from-purple-500 to-violet-500';
      case 'lottie': return 'bg-gradient-to-r from-pink-500 to-rose-500';
      default: return 'bg-gradient-to-r from-gray-500 to-slate-500';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">محتوى الصف العاشر</h2>
          <p className="text-muted-foreground">جاري تحميل المحتوى التعليمي...</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
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
          محتوى الصف العاشر
        </h2>
        <p className="text-muted-foreground">
          استكشف المحتوى التعليمي المنظم في أقسام ومواضيع ودروس
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          <TabsTrigger value="communication" className="flex items-center gap-2 text-base font-medium">
            <BookOpen className="w-5 h-5" />
            أساسيات الاتصال ({communicationSections.length})
          </TabsTrigger>
          <TabsTrigger value="computer" className="flex items-center gap-2 text-base font-medium">
            <Monitor className="w-5 h-5" />
            تركيبة الحاسوب ({computerSections.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="communication" className="space-y-4 mt-6">
          {communicationSections.length === 0 ? (
            <Card className="text-center p-8">
              <div className="space-y-4">
                <Search className="w-16 h-16 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-semibold">لا توجد نتائج</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? `لم يتم العثور على محتوى يطابق البحث "${searchQuery}"` : 'لا توجد أقسام متاحة حالياً'}
                </p>
              </div>
            </Card>
          ) : (
            communicationSections.map((section) => (
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
                                            {lesson.content && (
                                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                {lesson.content.substring(0, 100)}...
                                              </p>
                                            )}
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
                                        <Button variant="outline" size="sm" className="px-4 hover:bg-primary hover:text-primary-foreground transition-colors">
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

        <TabsContent value="computer" className="space-y-4 mt-6">
          {computerSections.length === 0 ? (
            <Card className="text-center p-8">
              <div className="space-y-4">
                <Monitor className="w-16 h-16 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-semibold">قريباً</h3>
                <p className="text-muted-foreground">
                  محتوى تركيبة الحاسوب قيد التطوير وسيكون متاحاً قريباً
                </p>
              </div>
            </Card>
          ) : (
            computerSections.map((section) => (
              <Card key={section.id} className="overflow-hidden">
                <Collapsible 
                  open={openSections.includes(section.id)}
                  onOpenChange={() => toggleSection(section.id)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                       <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                            <Monitor className="w-6 h-6 text-white" />
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
                                      <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                                        <Monitor className="w-5 h-5 text-white" />
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
                                            {lesson.content && (
                                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                {lesson.content.substring(0, 100)}...
                                              </p>
                                            )}
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
                                        <Button variant="outline" size="sm" className="px-4 hover:bg-primary hover:text-primary-foreground transition-colors">
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
      </Tabs>

      {/* Lesson Details Modal */}
      <Dialog open={!!selectedLesson} onOpenChange={() => setSelectedLesson(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selectedLesson?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedLesson && (
            <div className="space-y-6">
              {/* Lesson Content */}
              {selectedLesson.content && (
                <div className="prose prose-sm max-w-none">
                  <div className="text-xl text-foreground/90 leading-9 whitespace-pre-wrap break-words max-w-full p-8 bg-gradient-to-r from-muted/30 to-muted/20 rounded-3xl border-2 border-border/30 shadow-sm">
                    {selectedLesson.content}
                  </div>
                </div>
              )}

              {/* Media Files */}
              {selectedLesson.media && selectedLesson.media.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">الملفات المرفقة</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {selectedLesson.media.map((media) => (
                      <Card key={media.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setPreviewMedia(media)}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getMediaColor(media.media_type)}`}>
                            {getMediaIcon(media.media_type)}
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium">{media.file_name}</h5>
                            <p className="text-sm text-muted-foreground">
                              {media.media_type === 'video' ? 'فيديو' : 
                               media.media_type === 'image' ? 'صورة' :
                               media.media_type === 'code' ? 'كود' : 
                               media.media_type === 'lottie' ? 'أنيميشن' : 'ملف'}
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            <Maximize2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Media Preview Modal */}
      {previewMedia && (
        <Grade10MediaPreview
          media={previewMedia}
          onClose={() => setPreviewMedia(null)}
        />
      )}
    </div>
  );
};