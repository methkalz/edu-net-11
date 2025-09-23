import React, { useState } from 'react';
import { useStudentGrade10Lessons } from '@/hooks/useStudentGrade10Lessons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, 
  ChevronDown, 
  ChevronRight, 
  Play, 
  FileText, 
  Image,
  Code,
  Clock,
  Sparkles,
  Monitor,
  Zap
} from 'lucide-react';

export const StudentGrade10Lessons: React.FC = () => {
  const { sections, loading, error } = useStudentGrade10Lessons();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [openTopics, setOpenTopics] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const toggleTopic = (topicId: string) => {
    setOpenTopics(prev => ({
      ...prev,
      [topicId]: !prev[topicId]
    }));
  };

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'video': return Play;
      case 'image': return Image;
      case 'code': return Code;
      case 'lottie': return Sparkles;
      default: return FileText;
    }
  };

  const getMediaColor = (mediaType: string) => {
    switch (mediaType) {
      case 'video': return 'from-blue-500 to-cyan-500';
      case 'image': return 'from-green-500 to-emerald-500';
      case 'code': return 'from-purple-500 to-violet-500';
      case 'lottie': return 'from-pink-500 to-rose-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded mb-4"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
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
            <BookOpen className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold">حدث خطأ في تحميل الدروس</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </Card>
    );
  }

  if (!sections || sections.length === 0) {
    return (
      <Card className="text-center p-12">
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">لا توجد دروس متاحة</h3>
          <p className="text-muted-foreground">
            لا توجد دروس متاحة للصف العاشر حالياً
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
          <BookOpen className="w-6 h-6" />
          دروس الصف العاشر
        </h2>
        <p className="text-muted-foreground">
          استكشف المحتوى التعليمي المنظم حسب الأقسام والمواضيع
        </p>
      </div>

      <Tabs defaultValue="communication" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="communication" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            أساسيات الاتصال
          </TabsTrigger>
          <TabsTrigger value="computer" className="flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            تركيبة الحاسوب
          </TabsTrigger>
        </TabsList>

        <TabsContent value="communication" className="mt-6">
          <div className="space-y-4">
            {sections
              .filter(section => section.title.includes('أساسيات الاتصال'))
              .map((section) => (
                <Card key={section.id} className="overflow-hidden">
                  <Collapsible
                    open={openSections[section.id]}
                    onOpenChange={() => toggleSection(section.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                              <Zap className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-right">{section.title}</CardTitle>
                              {section.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {section.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {section.topics.length} موضوع
                            </Badge>
                            {openSections[section.id] ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <Separator className="mb-4" />
                        <div className="space-y-4">
                          {section.topics.map((topic) => (
                            <Card key={topic.id} className="bg-muted/30">
                              <Collapsible
                                open={openTopics[topic.id]}
                                onOpenChange={() => toggleTopic(topic.id)}
                              >
                                <CollapsibleTrigger asChild>
                                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <BookOpen className="w-5 h-5 text-primary" />
                                        <h4 className="font-medium">{topic.title}</h4>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs">
                                          {topic.lessons.length} درس
                                        </Badge>
                                        {openTopics[topic.id] ? (
                                          <ChevronDown className="w-4 h-4" />
                                        ) : (
                                          <ChevronRight className="w-4 h-4" />
                                        )}
                                      </div>
                                    </div>
                                  </CardHeader>
                                </CollapsibleTrigger>

                                <CollapsibleContent>
                                  <CardContent className="pt-0">
                                    <div className="grid gap-3">
                                      {topic.lessons.map((lesson) => (
                                        <div key={lesson.id} className="bg-background rounded-lg p-4 border">
                                          <div className="flex items-start justify-between mb-3">
                                            <h5 className="font-medium text-sm">{lesson.title}</h5>
                                            <Badge variant="secondary" className="text-xs">
                                              {lesson.media.length} ملف
                                            </Badge>
                                          </div>
                                          
                                          {lesson.content && (
                                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                              {lesson.content}
                                            </p>
                                          )}

                                          {lesson.media.length > 0 && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                              {lesson.media.map((media) => {
                                                const MediaIcon = getMediaIcon(media.media_type);
                                                const mediaColor = getMediaColor(media.media_type);
                                                
                                                return (
                                                  <div key={media.id} className="flex items-center gap-2 p-2 rounded bg-muted/50 hover:bg-muted transition-colors">
                                                    <div className={`w-8 h-8 rounded bg-gradient-to-r ${mediaColor} flex items-center justify-center flex-shrink-0`}>
                                                      <MediaIcon className="w-4 h-4 text-white" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                      <p className="text-xs font-medium truncate">
                                                        {media.file_name}
                                                      </p>
                                                      <p className="text-xs text-muted-foreground capitalize">
                                                        {media.media_type}
                                                      </p>
                                                    </div>
                                                    <Button size="sm" variant="ghost" className="p-1 h-auto">
                                                      <Play className="w-3 h-3" />
                                                    </Button>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
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
        </TabsContent>

        <TabsContent value="computer" className="mt-6">
          <div className="space-y-4">
            {sections
              .filter(section => section.title.includes('تركيبة الحاسوب'))
              .map((section) => (
                <Card key={section.id} className="overflow-hidden">
                  <Collapsible
                    open={openSections[section.id]}
                    onOpenChange={() => toggleSection(section.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                              <Monitor className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-right">{section.title}</CardTitle>
                              {section.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {section.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {section.topics.length} موضوع
                            </Badge>
                            {openSections[section.id] ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <Separator className="mb-4" />
                        {section.topics.length === 0 ? (
                          <div className="text-center py-8">
                            <Monitor className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                            <p className="text-muted-foreground">
                              المحتوى قيد التطوير - سيتم إضافة المواضيع قريباً
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {section.topics.map((topic) => (
                              <Card key={topic.id} className="bg-muted/30">
                                <CardHeader className="py-4">
                                  <div className="flex items-center gap-3">
                                    <Monitor className="w-5 h-5 text-primary" />
                                    <h4 className="font-medium">{topic.title}</h4>
                                    <Badge variant="outline" className="text-xs">
                                      {topic.lessons.length} درس
                                    </Badge>
                                  </div>
                                </CardHeader>
                              </Card>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            
            {sections.filter(section => section.title.includes('تركيبة الحاسوب')).length === 0 && (
              <Card className="text-center p-8">
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                    <Monitor className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold">قسم تركيبة الحاسوب</h3>
                  <p className="text-muted-foreground">
                    المحتوى قيد التطوير - ستتم إضافة المواضيع والدروس قريباً
                  </p>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};