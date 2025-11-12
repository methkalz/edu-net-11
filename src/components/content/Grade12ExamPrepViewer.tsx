import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BookOpen, FileText, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Grade12ExamPrepSectionWithTopics, Grade12ExamPrepTopicWithLessons, Grade12ExamPrepLessonWithMedia } from '@/hooks/useGrade12ExamPrepAdmin';
import { Skeleton } from '@/components/ui/skeleton';
import GammaEmbedWrapper from './GammaEmbedWrapper';

const Grade12ExamPrepViewer: React.FC = () => {
  const [sections, setSections] = useState<Grade12ExamPrepSectionWithTopics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Grade12ExamPrepLessonWithMedia | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      
      // Fetch sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('grade12_exam_prep_sections')
        .select('*')
        .order('order_index');

      if (sectionsError) throw sectionsError;

      // Fetch topics
      const { data: topicsData, error: topicsError } = await supabase
        .from('grade12_exam_prep_topics')
        .select('*')
        .order('order_index');

      if (topicsError) throw topicsError;

      // Fetch lessons (only active ones for students/teachers)
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('grade12_exam_prep_lessons')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (lessonsError) throw lessonsError;

      // Fetch lesson media
      const { data: mediaData, error: mediaError } = await supabase
        .from('grade12_exam_prep_lesson_media')
        .select('*')
        .order('order_index');

      if (mediaError) throw mediaError;

      const sectionsWithContent = (sectionsData || []).map(section => {
        const sectionTopics = (topicsData || []).filter(topic => topic.section_id === section.id);
        
        const topicsWithLessons = sectionTopics.map(topic => {
          const topicLessons = (lessonsData || []).filter(lesson => lesson.topic_id === topic.id);
          
          const lessonsWithMedia = topicLessons.map(lesson => {
            const lessonMedia = (mediaData || []).filter(media => media.lesson_id === lesson.id);
            return {
              ...lesson,
              media: lessonMedia
            } as Grade12ExamPrepLessonWithMedia;
          });

          return {
            ...topic,
            lessons: lessonsWithMedia
          };
        });

        return {
          ...section,
          topics: topicsWithLessons
        };
      });

      setSections(sectionsWithContent);
    } catch (error) {
      console.error('Error fetching exam prep content:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSectionStats = (section: Grade12ExamPrepSectionWithTopics) => {
    const topicsCount = section.topics.length;
    const lessonsCount = section.topics.reduce((acc, topic) => acc + topic.lessons.length, 0);
    return { topicsCount, lessonsCount };
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">لا يوجد محتوى متاح حالياً</h3>
          <p className="text-muted-foreground">
            سيتم إضافة المحتوى التحضيري قريباً
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">تحضيرات امتحان المشروع</h2>
        <p className="text-muted-foreground">
          محتوى تحضيري لمساعدتك في التحضير لامتحان المشروع النهائي
        </p>
      </div>

      <Accordion type="multiple" className="space-y-4">
        {sections.map((section) => {
          const { topicsCount, lessonsCount } = getSectionStats(section);
          return (
            <AccordionItem key={section.id} value={section.id} className="border rounded-lg">
              <Card>
                <AccordionTrigger className="hover:no-underline p-0">
                  <CardHeader className="w-full">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <div className="text-right">
                          <CardTitle className="text-lg">{section.title}</CardTitle>
                          {section.description && (
                            <p className="text-sm text-muted-foreground">{section.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{topicsCount} مواضيع</Badge>
                        <Badge variant="secondary">{lessonsCount} دروس</Badge>
                      </div>
                    </div>
                  </CardHeader>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="space-y-4">
                    {section.topics.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2" />
                        <p>لا توجد مواضيع في هذا القسم</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {section.topics.map((topic) => (
                          <Card key={topic.id} className="ml-6">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-primary" />
                                  <div>
                                    <CardTitle className="text-base">{topic.title}</CardTitle>
                                    {topic.content && (
                                      <p className="text-sm text-muted-foreground">{topic.content}</p>
                                    )}
                                  </div>
                                </div>
                                <Badge variant="outline">{topic.lessons.length} دروس</Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              {topic.lessons.length === 0 ? (
                                <div className="text-center py-4 text-muted-foreground">
                                  <FileText className="h-6 w-6 mx-auto mb-2" />
                                  <p className="text-sm">لا توجد دروس في هذا الموضوع</p>
                                </div>
                              ) : (
                                <div className="grid gap-2">
                                  {topic.lessons.map((lesson) => (
                                    <div 
                                      key={lesson.id} 
                                      className="border rounded-lg ml-4 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                                      onClick={() => {
                                        setSelectedLesson(lesson);
                                        setIsDialogOpen(true);
                                      }}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <FileText className="h-4 w-4 text-primary" />
                                          <p className="font-medium">{lesson.title}</p>
                                        </div>
                                        {lesson.media.length > 0 && (
                                          <Badge variant="secondary" className="text-xs">
                                            {lesson.media.length} وسائط
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          );
        })}
      </Accordion>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedLesson?.title}</DialogTitle>
          </DialogHeader>
          {selectedLesson?.content && (
            <GammaEmbedWrapper content={selectedLesson.content} />
          )}
          {selectedLesson?.media && selectedLesson.media.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-medium">الوسائط المرفقة:</h4>
              <div className="grid gap-2">
                {selectedLesson.media.map((media) => (
                  <Badge key={media.id} variant="outline">
                    {media.media_type}: {media.file_name || media.file_path}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Grade12ExamPrepViewer;