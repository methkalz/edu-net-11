import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
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
  Target,
  PlayCircle,
  Calendar,
  Maximize2,
  BookOpen
} from 'lucide-react';
import { useStudentGrade10Lessons, Grade10LessonWithMedia, Grade10LessonMedia } from '@/hooks/useStudentGrade10Lessons';
import Grade10MediaPreview from '@/components/content/Grade10MediaPreview';

export const ComputerStructureLessons: React.FC = () => {
  const { sections, loading, error, getContentStats } = useStudentGrade10Lessons();
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [openTopics, setOpenTopics] = useState<string[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Grade10LessonWithMedia | null>(null);
  const [previewMedia, setPreviewMedia] = useState<Grade10LessonMedia | null>(null);

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

  // Filter sections for computer composition only
  const computerSections = (sections || []).filter(section => {
    const isComputerTopic = section.title.toLowerCase().includes('تركيبة الحاسوب') ||
                           section.title.toLowerCase().includes('القطع') ||
                           section.title.toLowerCase().includes('مبنى الحاسوب') ||
                           section.description?.toLowerCase().includes('تركيبة الحاسوب') ||
                           section.description?.toLowerCase().includes('القطع') ||
                           section.description?.toLowerCase().includes('مبنى الحاسوب');
    
    return isComputerTopic;
  });

  // Calculate total lessons for computer sections
  const getTotalLessonsInSections = (sectionsArray: any[]) => {
    return sectionsArray.reduce((total, section) => {
      return total + section.topics.reduce((sectionTotal: number, topic: any) => {
        return sectionTotal + topic.lessons.length;
      }, 0);
    }, 0);
  };

  const computerLessonsCount = getTotalLessonsInSections(computerSections);

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'video': return <Video className="w-4 h-4 text-white" />;
      case 'image': return <ImageIcon className="w-4 h-4 text-white" />;
      case 'code': return <Code className="w-4 h-4 text-white" />;
      case 'lottie': return <Play className="w-4 h-4 text-white" />;
      case '3d_model': return <Monitor className="w-4 h-4 text-white" />;
      default: return <FileText className="w-4 h-4 text-white" />;
    }
  };

  const getMediaColor = (mediaType: string) => {
    switch (mediaType) {
      case 'video': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'image': return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case 'code': return 'bg-gradient-to-r from-purple-500 to-violet-500';
      case 'lottie': return 'bg-gradient-to-r from-pink-500 to-rose-500';
      case '3d_model': return 'bg-gradient-to-r from-orange-500 to-red-500';
      default: return 'bg-gradient-to-r from-gray-500 to-slate-500';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">مبنى الحاسوب</h2>
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
    <div className="space-y-8">
      {/* Cute Minimalist Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/60">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 mx-auto mb-2 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <FolderOpen className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl font-bold text-blue-600 mb-0.5">{computerSections.length}</div>
            <div className="text-xs text-blue-600/70 font-medium">أقسام</div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/60">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 mx-auto mb-2 bg-green-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Target className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-xl font-bold text-green-600 mb-0.5">
              {computerSections.reduce((acc, section) => acc + section.topics.length, 0)}
            </div>
            <div className="text-xs text-green-600/70 font-medium">مواضيع</div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/60">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 mx-auto mb-2 bg-purple-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-xl font-bold text-purple-600 mb-0.5">{computerLessonsCount}</div>
            <div className="text-xs text-purple-600/70 font-medium">دروس</div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/60">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 mx-auto mb-2 bg-orange-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Monitor className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-xl font-bold text-orange-600 mb-0.5">
              {computerSections.reduce((acc, section) => 
                acc + section.topics.reduce((topicAcc: number, topic: any) => 
                  topicAcc + topic.lessons.reduce((lessonAcc: number, lesson: any) => 
                    lessonAcc + lesson.media.filter((m: any) => m.media_type === '3d_model').length, 0
                  ), 0
                ), 0
              )}
            </div>
            <div className="text-xs text-orange-600/70 font-medium">نماذج ثلاثية الأبعاد</div>
          </CardContent>
        </Card>
      </div>

      {/* Content Sections - Compact Design */}
      <div className="space-y-3">
        {computerSections.length === 0 ? (
          <Card className="text-center py-12 bg-muted/30 border-0">
            <div className="space-y-3">
              <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground/60" />
              <h3 className="text-base font-medium">لا توجد نتائج</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                لا توجد أقسام متاحة حالياً
              </p>
            </div>
          </Card>
        ) : (
          computerSections.map((section) => (
            <Card key={section.id} className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-white/60 backdrop-blur-sm">
              <Collapsible 
                open={openSections.includes(section.id)}
                onOpenChange={() => toggleSection(section.id)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/20 transition-colors py-3 px-4">
                     <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                          <Monitor className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left">
                          <CardTitle className="text-base font-semibold">{section.title}</CardTitle>
                          {section.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              {section.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs px-2 py-0.5 rounded-md">
                          {section.topics.length}
                        </Badge>
                        {openSections.includes(section.id) ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0 pb-3 px-4">
                    <div className="space-y-2">
                      {section.topics.map((topic) => (
                        <Card key={topic.id} className="ml-3 border-0 bg-muted/30">
                          <Collapsible
                            open={openTopics.includes(topic.id)}
                            onOpenChange={() => toggleTopic(topic.id)}
                          >
                            <CollapsibleTrigger asChild>
                              <CardHeader className="cursor-pointer hover:bg-muted/40 transition-colors py-2.5 px-3">
                                 <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-md flex items-center justify-center">
                                      <Target className="w-3 h-3 text-white" />
                                    </div>
                                    <div className="text-left">
                                      <h4 className="font-medium text-sm">{topic.title}</h4>
                                      {topic.content && (
                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                          {topic.content}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Badge variant="outline" className="text-xs px-1.5 py-0.5 rounded-md">
                                      {topic.lessons.length}
                                    </Badge>
                                    {openTopics.includes(topic.id) ? (
                                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                                    )}
                                  </div>
                                </div>
                              </CardHeader>
                            </CollapsibleTrigger>

                            <CollapsibleContent>
                              <CardContent className="pt-0 pb-2 px-3">
                                <div className="space-y-1.5">
                                  {topic.lessons.map((lesson) => (
                                     <div
                                      key={lesson.id}
                                      className="flex items-center justify-between p-2.5 bg-white/60 rounded-lg border-0 hover:bg-white/80 transition-colors cursor-pointer group"
                                      onClick={() => setSelectedLesson(lesson)}
                                    >
                            <div className="flex items-center gap-2.5">
                                        <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-md flex items-center justify-center">
                                          <BookOpen className="w-2.5 h-2.5 text-white" />
                                        </div>
                                        <div className="text-left">
                                          <h5 className="font-medium text-xs">{lesson.title}</h5>
                                          {lesson.content && (
                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                              {lesson.content}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1 flex-shrink-0">
                                        {lesson.media && lesson.media.length > 0 && (
                                          <Badge variant="outline" className="text-xs px-1 py-0.5 rounded">
                                            {lesson.media.length}
                                          </Badge>
                                        )}
                                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <ChevronRight className="w-3 h-3" />
                                        </Button>
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
          ))
        )}
      </div>

      {/* Lesson Details Modal */}
      <Dialog open={!!selectedLesson} onOpenChange={() => setSelectedLesson(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-blue-500" />
              {selectedLesson?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedLesson && (
            <div className="space-y-6">
              {/* Lesson Content */}
              {selectedLesson.content && (
                <div className="prose max-w-none">
                  <div className="bg-muted/20 p-6 rounded-lg border">
                    <h4 className="text-lg font-semibold mb-3 text-foreground">محتوى الدرس:</h4>
                    <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {selectedLesson.content}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Media Files */}
              {selectedLesson.media && selectedLesson.media.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-foreground">الوسائط المرفقة:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedLesson.media.map((media) => (
                      <Card 
                        key={media.id} 
                        className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/50"
                        onClick={() => setPreviewMedia(media)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getMediaColor(media.media_type)}`}>
                              {getMediaIcon(media.media_type)}
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-base mb-1">{media.file_name}</h5>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {media.media_type === '3d_model' ? 'نموذج ثلاثي الأبعاد' :
                                   media.media_type === 'video' ? 'فيديو' :
                                   media.media_type === 'image' ? 'صورة' :
                                   media.media_type === 'lottie' ? 'أنيميشن' :
                                   media.media_type === 'code' ? 'كود' : 'ملف'}
                                </Badge>
                                <Button size="sm" variant="ghost" className="h-6 px-2">
                                  <Maximize2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
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