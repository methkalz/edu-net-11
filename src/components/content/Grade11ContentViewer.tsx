import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, Play, Image, Video, Loader2, ChevronRight } from 'lucide-react';
import Grade11LessonContentDisplay from './Grade11LessonContentDisplay';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format } from 'date-fns';
import { useStudentGrade11Content } from '@/hooks/useStudentGrade11Content';
import { useTopicLessons } from '@/hooks/useTopicLessons';
import type { Grade11LessonWithMedia } from '@/hooks/useStudentGrade11Content';
import { logger } from '@/lib/logger';
const Grade11ContentViewer: React.FC = () => {
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [openTopics, setOpenTopics] = useState<string[]>([]);
  const [loadedTopics, setLoadedTopics] = useState<Record<string, Grade11LessonWithMedia[]>>({});
  const [currentTopicId, setCurrentTopicId] = useState<string | null>(null);

  const { sections, loading } = useStudentGrade11Content();
  const { data: topicLessons, isLoading: topicLessonsLoading } = useTopicLessons(currentTopicId);

  useEffect(() => {
    if (topicLessons && currentTopicId) {
      setLoadedTopics(prev => ({
        ...prev,
        [currentTopicId]: topicLessons
      }));
    }
  }, [topicLessons, currentTopicId]);

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId) 
        : [...prev, sectionId]
    );
  };

  const toggleTopic = (topicId: string) => {
    const isOpening = !openTopics.includes(topicId);
    
    setOpenTopics(prev => 
      prev.includes(topicId) 
        ? prev.filter(id => id !== topicId) 
        : [...prev, topicId]
    );
    
    if (isOpening && !loadedTopics[topicId]) {
      setCurrentTopicId(topicId);
    }
  };
  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'lottie':
        return <Play className="h-4 w-4" />;
      case 'image':
        return <Image className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };
  if (loading) {
    return <div className="space-y-6">
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[100px] w-full" />
              </CardContent>
            </Card>)}
        </div>
      </div>;
  }
  return <div className="space-y-8">
      <div className="text-center space-y-4">
        
        <Badge variant="secondary" className="bg-muted text-muted-foreground">
          وضع العرض فقط
        </Badge>
      </div>

      <div className="space-y-6">
        {sections.length === 0 ? <div className="text-center py-12">
            <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">لا يوجد محتوى متاح</h3>
            <p className="text-muted-foreground">لم يتم إضافة أي محتوى للصف الحادي عشر حتى الآن</p>
          </div> : sections.map(section => {
            const isSectionOpen = openSections.includes(section.id);
            
            return (
              <Card key={section.id} className="border-l-4 border-l-blue-500">
                <Collapsible open={isSectionOpen} onOpenChange={() => toggleSection(section.id)}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <ChevronRight className={`h-5 w-5 text-blue-600 transition-transform ${isSectionOpen ? 'rotate-90' : ''}`} />
                          <div>
                            <CardTitle className="flex items-center gap-2 text-xl">
                              <BookOpen className="h-5 w-5 text-blue-600" />
                              {section.title}
                            </CardTitle>
                            {section.description && <CardDescription className="mt-2">{section.description}</CardDescription>}
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {section.topics.length} موضوع
                        </Badge>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent>
                      <div className="space-y-4">
                        {section.topics.length === 0 ? (
                          <div className="text-center py-6 text-muted-foreground">
                            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>لا توجد مواضيع في هذا القسم</p>
                          </div>
                        ) : (
                          section.topics.map(topic => {
                            const isTopicOpen = openTopics.includes(topic.id);
                            const lessons = loadedTopics[topic.id] || [];
                            const isLoadingLessons = currentTopicId === topic.id && topicLessonsLoading;
                            
                            return (
                              <Card key={topic.id} className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
                                <Collapsible open={isTopicOpen} onOpenChange={() => toggleTopic(topic.id)}>
                                  <CollapsibleTrigger asChild>
                                    <CardContent className="pt-4 cursor-pointer hover:bg-muted/30 transition-colors">
                                      <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2 flex-1">
                                          <ChevronRight className={`h-4 w-4 text-blue-600 transition-transform flex-shrink-0 ${isTopicOpen ? 'rotate-90' : ''}`} />
                                          <div className="flex-1">
                                            <h4 className="font-semibold text-lg text-blue-900">
                                              {topic.title}
                                            </h4>
                                            {topic.content && (
                                              <div className="text-muted-foreground mt-2 leading-relaxed text-sm">
                                                <p>{topic.content}</p>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <Badge variant="outline" className="bg-white text-blue-700 border-blue-200 flex-shrink-0">
                                          {lessons.length > 0 ? lessons.length : '...'} درس
                                        </Badge>
                                      </div>
                                    </CardContent>
                                  </CollapsibleTrigger>

                                  <CollapsibleContent>
                                    <CardContent className="pt-0">
                                      {isLoadingLessons ? (
                                        <div className="flex items-center justify-center py-8">
                                          <Loader2 className="h-6 w-6 animate-spin text-primary ml-2" />
                                          <span className="text-muted-foreground">جاري تحميل الدروس...</span>
                                        </div>
                                      ) : lessons.length > 0 ? (
                                        <div className="space-y-4 mt-3">
                                          <h5 className="text-sm font-medium text-blue-800">الدروس:</h5>
                                          {lessons.map(lesson => (
                                            <div key={lesson.id} className="border-l-4 border-l-blue-300 pl-4 py-3 bg-white rounded-lg border border-blue-200 shadow-sm">
                                              <Grade11LessonContentDisplay lesson={lesson} />
                                              
                                              <div className="text-xs text-muted-foreground mt-3 pt-2 border-t border-blue-100 pr-3">
                                                {lesson.media?.length || 0} ملف وسائط • تم الإنشاء: {format(new Date(lesson.created_at), 'dd/MM/yyyy')}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-center text-muted-foreground py-6">
                                          لا توجد دروس في هذا الموضوع
                                        </p>
                                      )}

                                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 mt-3 border-t">
                                        <span>
                                          تاريخ الإنشاء: {format(new Date(topic.created_at), 'dd/MM/yyyy')}
                                        </span>
                                      </div>
                                    </CardContent>
                                  </CollapsibleContent>
                                </Collapsible>
                              </Card>
                            );
                          })
                        )}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
      </div>
    </div>;
};
export default Grade11ContentViewer;