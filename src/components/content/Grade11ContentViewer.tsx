import React from 'react';
import { BookOpen, FileText, Play, Image, Video } from 'lucide-react';
import Grade11LessonContentDisplay from './Grade11LessonContentDisplay';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format } from 'date-fns';
import { useGrade11Content } from '@/hooks/useGrade11Content';
import { logger } from '@/lib/logger';

const Grade11ContentViewer: React.FC = () => {
  const { sections, loading } = useGrade11Content();

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
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[100px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 bg-blue-100 text-blue-700 px-6 py-3 rounded-full">
          <BookOpen className="h-6 w-6" />
          <span className="font-semibold">محتوى الصف الحادي عشر</span>
        </div>
        <Badge variant="secondary" className="bg-muted text-muted-foreground">
          وضع العرض فقط
        </Badge>
      </div>

      <div className="space-y-6">
        {sections.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">لا يوجد محتوى متاح</h3>
            <p className="text-muted-foreground">لم يتم إضافة أي محتوى للصف الحادي عشر حتى الآن</p>
          </div>
        ) : (
          sections.map((section) => (
            <Card key={section.id} className="border-l-4 border-l-blue-500">
              <Collapsible defaultOpen>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <BookOpen className="h-5 w-5 text-blue-600" />
                          {section.title}
                        </CardTitle>
                        {section.description && (
                          <CardDescription className="mt-2">{section.description}</CardDescription>
                        )}
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
                        section.topics.map((topic) => (
                          <Card key={topic.id} className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
                            <CardContent className="pt-4">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-lg mb-2 text-blue-900">
                                      {topic.title}
                                    </h4>
                                    {topic.content && (
                                      <div className="text-muted-foreground mb-3 leading-relaxed">
                                        <p>{topic.content}</p>
                                      </div>
                                    )}
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => logger.debug('Topic view requested', { topicId: topic.id })}
                                    className="bg-white hover:bg-blue-50 text-blue-700 border-blue-200"
                                  >
                                    عرض التفاصيل
                                  </Button>
                                </div>

                                 {/* Lessons */}
                                {topic.lessons && topic.lessons.length > 0 && (
                                  <div className="space-y-3">
                                    <h5 className="text-sm font-medium text-blue-800">الدروس:</h5>
                                    <div className="space-y-4">
                                      {topic.lessons.map((lesson) => (
                                        <div
                                          key={lesson.id}
                                          className="border-l-4 border-l-blue-300 pl-4 py-3 bg-white rounded-lg border border-blue-200 shadow-sm"
                                        >
                                          <Grade11LessonContentDisplay 
                                            lesson={lesson}
                                            defaultExpanded={false}
                                            showControls={true}
                                          />
                                          
                                           <div className="text-xs text-muted-foreground mt-3 pt-2 border-t border-blue-100">
                                             {lesson.media?.length || 0} ملف وسائط • تم الإنشاء: {format(new Date(lesson.created_at), 'dd/MM/yyyy')}
                                           </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                 <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                                   <span>
                                     تاريخ الإنشاء: {format(new Date(topic.created_at), 'dd/MM/yyyy')}
                                   </span>
                                   <span>{topic.lessons?.length || 0} درس</span>
                                 </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Grade11ContentViewer;