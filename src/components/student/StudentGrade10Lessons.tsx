import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  BookOpen,
  FolderOpen, 
  ChevronDown, 
  ChevronRight,
  FileText,
  Video,
  Music,
  Image as ImageIcon,
  Code,
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

  const stats = getContentStats();

  // Auto-open first communication section when data loads
  React.useEffect(() => {
    if (sections && sections.length > 0 && openSections.length === 0) {
      const communicationSections = sections.filter(section => {
        // Include sections NOT related to computer composition
        const isComputerTopic = section.title.toLowerCase().includes('تركيبة الحاسوب') ||
                               section.title.toLowerCase().includes('القطع') ||
                               section.title.toLowerCase().includes('مبنى الحاسوب') ||
                               section.description?.toLowerCase().includes('تركيبة الحاسوب') ||
                               section.description?.toLowerCase().includes('القطع') ||
                               section.description?.toLowerCase().includes('مبنى الحاسوب');
        
        return !isComputerTopic; // Return communication sections
      });
      
      if (communicationSections.length > 0) {
        setOpenSections([communicationSections[0].id]);
        
        // Also auto-open first topic of the first section
        if (communicationSections[0].topics && communicationSections[0].topics.length > 0) {
          setOpenTopics([communicationSections[0].topics[0].id]);
        }
      }
    }
  }, [sections, openSections.length]);

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
                           section.title.toLowerCase().includes('مبنى الحاسوب') ||
                           section.description?.toLowerCase().includes('تركيبة الحاسوب') ||
                           section.description?.toLowerCase().includes('القطع') ||
                           section.description?.toLowerCase().includes('مبنى الحاسوب');
    
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
                              topic.title.toLowerCase().includes('مبنى الحاسوب') ||
                              topic.content?.toLowerCase().includes('تركيبة الحاسوب') ||
                              topic.content?.toLowerCase().includes('القطع') ||
                              topic.content?.toLowerCase().includes('مبنى الحاسوب');
        
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
          <h2 className="text-2xl font-bold text-foreground dark:text-foreground">أساسيات الاتصال</h2>
          <p className="text-muted-foreground dark:text-foreground/70">جاري تحميل المحتوى التعليمي...</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse dark:bg-card transition-colors duration-300">
              <CardContent className="p-4">
                <div className="h-4 bg-muted dark:bg-muted/50 rounded mb-2"></div>
                <div className="h-8 bg-muted dark:bg-muted/50 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse dark:bg-card transition-colors duration-300">
              <CardContent className="p-6">
                <div className="h-6 bg-muted dark:bg-muted/50 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted dark:bg-muted/50 rounded w-3/4"></div>
                  <div className="h-4 bg-muted dark:bg-muted/50 rounded w-1/2"></div>
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
      <Card className="text-center p-8 dark:bg-card transition-colors duration-300">
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center">
            <FileText className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-foreground dark:text-foreground">حدث خطأ في تحميل المحتوى</h3>
          <p className="text-muted-foreground dark:text-foreground/70">{error}</p>
          <Button onClick={() => window.location.reload()}>
            إعادة المحاولة
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-500/10 dark:to-blue-500/5 border-blue-200/60 dark:border-blue-500/20">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
            <div className="w-8 h-8 mx-auto mb-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <FolderOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-0.5">{communicationSections.length}</div>
            <div className="text-xs text-blue-600/70 dark:text-blue-400/70 font-medium">أقسام</div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-500/10 dark:to-green-500/5 border-green-200/60 dark:border-green-500/20">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
            <div className="w-8 h-8 mx-auto mb-2 bg-green-500/10 dark:bg-green-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-xl font-bold text-green-600 dark:text-green-400 mb-0.5">
              {communicationSections.reduce((total, section) => total + section.topics.length, 0)}
            </div>
            <div className="text-xs text-green-600/70 dark:text-green-400/70 font-medium">مواضيع</div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-500/10 dark:to-purple-500/5 border-purple-200/60 dark:border-purple-500/20">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
            <div className="w-8 h-8 mx-auto mb-2 bg-purple-500/10 dark:bg-purple-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mb-0.5">
              {communicationSections.reduce((total, section) => {
                return total + section.topics.reduce((sectionTotal: number, topic: any) => {
                  return sectionTotal + topic.lessons.length;
                }, 0);
              }, 0)}
            </div>
            <div className="text-xs text-purple-600/70 dark:text-purple-400/70 font-medium">دروس</div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-500/10 dark:to-orange-500/5 border-orange-200/60 dark:border-orange-500/20">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
            <div className="w-8 h-8 mx-auto mb-2 bg-orange-500/10 dark:bg-orange-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <PlayCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="text-xl font-bold text-orange-600 dark:text-orange-400 mb-0.5">
              {communicationSections.reduce((total, section) => {
                return total + section.topics.reduce((sectionTotal: number, topic: any) => {
                  return sectionTotal + topic.lessons.reduce((lessonTotal: number, lesson: any) => {
                    return lessonTotal + (lesson.media ? lesson.media.length : 0);
                  }, 0);
                }, 0);
              }, 0)}
            </div>
            <div className="text-xs text-orange-600/70 dark:text-orange-400/70 font-medium">وسائط</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground dark:text-foreground/70 w-5 h-5" />
          <Input
            placeholder="ابحث في المحتوى..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 py-3 text-base border-2 dark:bg-card dark:border-border transition-colors duration-300"
          />
        </div>
        {searchQuery && (
          <Button variant="outline" onClick={() => setSearchQuery('')} className="px-6 py-3">
            مسح
          </Button>
        )}
      </div>

      {/* Content Sections - Communication Basics Only */}
      {communicationSections.length === 0 ? (
        <Card className="text-center p-8 dark:bg-card transition-colors duration-300">
          <div className="space-y-4">
            <Search className="w-16 h-16 mx-auto text-muted-foreground dark:text-foreground/40" />
            <h3 className="text-lg font-semibold text-foreground dark:text-foreground">لا توجد نتائج</h3>
            <p className="text-muted-foreground dark:text-foreground/70">
              {searchQuery ? `لم يتم العثور على محتوى يطابق البحث "${searchQuery}"` : 'لا توجد أقسام متاحة حالياً'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {communicationSections.map((section) => (
            <Card key={section.id} className="overflow-hidden dark:bg-card transition-colors duration-300">
              <Collapsible 
                open={openSections.includes(section.id)}
                onOpenChange={() => toggleSection(section.id)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/20 dark:hover:bg-muted/10 transition-all duration-200 py-3 px-4 rounded-lg">
                     <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-sm">
                          <FolderOpen className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left">
                          <CardTitle className="text-lg font-medium text-foreground/95 dark:text-foreground">{section.title}</CardTitle>
                          {section.description && (
                            <p className="text-sm text-muted-foreground dark:text-foreground/70 mt-0.5 leading-relaxed">
                              {section.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs px-2 py-0.5 rounded-md dark:bg-secondary/20 dark:text-foreground/80">
                          {section.topics.length}
                        </Badge>
                        {openSections.includes(section.id) ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground dark:text-foreground/70" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground dark:text-foreground/70" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {section.topics.map((topic) => (
                        <Card key={topic.id} className="ml-4 dark:bg-muted/20 transition-colors duration-300">
                          <Collapsible
                            open={openTopics.includes(topic.id)}
                            onOpenChange={() => toggleTopic(topic.id)}
                          >
                            <CollapsibleTrigger asChild>
                              <CardHeader className="cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/30 transition-colors py-4">
                                 <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-md">
                                      <Target className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="text-left">
                                      <h4 className="font-semibold text-lg text-foreground dark:text-foreground">{topic.title}</h4>
                                      {topic.content && (
                                        <p className="text-sm text-muted-foreground dark:text-foreground/70 mt-2 line-clamp-2">
                                          {topic.content}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="text-sm px-3 py-1 dark:bg-background/50 dark:border-border dark:text-foreground/80">
                                      {topic.lessons.length} درس
                                    </Badge>
                                    {openTopics.includes(topic.id) ? (
                                      <ChevronDown className="w-5 h-5 dark:text-foreground/70" />
                                    ) : (
                                      <ChevronRight className="w-5 h-5 dark:text-foreground/70" />
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
                                      className="flex items-center justify-between p-4 bg-muted/30 dark:bg-muted/10 rounded-lg border dark:border-border hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors cursor-pointer"
                                      onClick={() => setSelectedLesson(lesson)}
                                    >
                                      <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md">
                                          <BookOpen className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                          <h5 className="font-medium text-base text-foreground dark:text-foreground">{lesson.title}</h5>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        {lesson.media && lesson.media.length > 0 && (
                                          <Badge variant="outline" className="text-sm px-2 py-1 dark:bg-background/50 dark:border-border dark:text-foreground/80">
                                            {lesson.media.length} ملف
                                          </Badge>
                                        )}
                                      </div>
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
          ))}
        </div>
      )}

      {/* Lesson Details Modal */}
      <Dialog open={!!selectedLesson} onOpenChange={() => setSelectedLesson(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto dark:bg-card transition-colors duration-300">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground dark:text-foreground">
              {selectedLesson?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedLesson && (
            <div className="space-y-6">
              {/* Lesson Content */}
              {selectedLesson.content && (
                <div className="prose prose-sm max-w-none">
                  <div className="text-xl text-foreground/90 dark:text-foreground/90 leading-9 whitespace-pre-wrap break-words max-w-full p-8 bg-gradient-to-r from-muted/30 to-muted/20 dark:from-muted/10 dark:to-muted/5 rounded-3xl border-2 border-border/30 dark:border-border/20 shadow-sm transition-colors duration-300">
                    {selectedLesson.content}
                  </div>
                </div>
              )}

              {/* Media Files */}
              {selectedLesson.media && selectedLesson.media.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-foreground dark:text-foreground">الملفات المرفقة</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {selectedLesson.media.map((media) => (
                      <Card key={media.id} className="p-4 hover:shadow-md dark:hover:shadow-primary/10 transition-shadow cursor-pointer dark:bg-card/60" onClick={() => setPreviewMedia(media)}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-md ${getMediaColor(media.media_type)}`}>
                            {getMediaIcon(media.media_type)}
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium text-foreground dark:text-foreground">{media.file_name}</h5>
                            <p className="text-sm text-muted-foreground dark:text-foreground/70">
                              {media.media_type === 'video' ? 'فيديو' : 
                               media.media_type === 'image' ? 'صورة' :
                               media.media_type === 'code' ? 'كود' : 
                               media.media_type === 'lottie' ? 'أنيميشن' : 'ملف'}
                            </p>
                          </div>
                          <Button variant="outline" size="sm" className="dark:hover:bg-accent/50">
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

export default StudentGrade10Lessons;