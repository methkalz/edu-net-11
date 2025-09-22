import React, { useState } from 'react';
import { Play, Clock, FileText, Users, Search, Filter, ChevronRight, CheckCircle2, PlayCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { useGrade11Content, Grade11TopicWithLessons, Grade11LessonWithMedia } from '@/hooks/useGrade11Content';
import Grade11LessonDetailsModal from './Grade11LessonDetailsModal';

const Grade11CourseViewer: React.FC = () => {
  const { sections, loading } = useGrade11Content();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<Grade11LessonWithMedia | null>(null);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);

  const allTopics = sections.flatMap(section => section.topics);
  const allLessons = allTopics.flatMap(topic => topic.lessons);
  const totalLessons = allLessons.length;
  const totalDuration = allLessons.length * 15; // تقدير 15 دقيقة لكل درس

  const filteredSections = sections.map(section => ({
    ...section,
    topics: section.topics.filter(topic => 
      topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.lessons.some(lesson => lesson.title.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })).filter(section => section.topics.length > 0);

  const handleLessonClick = (lesson: Grade11LessonWithMedia) => {
    setSelectedLesson(lesson);
    setIsLessonModalOpen(true);
  };

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'video':
        return <PlayCircle className="h-4 w-4 text-muted-foreground" />;
      case 'lottie':
        return <Play className="h-4 w-4 text-muted-foreground" />;
      case 'image':
        return <FileText className="h-4 w-4 text-muted-foreground" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-100 border border-border rounded-xl p-8 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl font-bold mb-4 text-foreground">محتوى الصف الحادي عشر</h1>
            <p className="text-muted-foreground mb-6 text-lg">
              استكشف المنهج التعليمي الشامل للصف الحادي عشر مع دروس تفاعلية ووسائط متنوعة
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                <span>{totalLessons} درس</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span>{Math.floor(totalDuration / 60)} ساعة</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span>{sections.length} أقسام</span>
              </div>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="bg-muted/30 border rounded-xl p-6">
              <h3 className="font-semibold mb-4 text-foreground">إحصائيات المحتوى</h3>
              <div className="space-y-3 text-muted-foreground">
                <div className="flex justify-between">
                  <span>الأقسام</span>
                  <span className="font-bold text-foreground">{sections.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>المواضيع</span>
                  <span className="font-bold text-foreground">{allTopics.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>الدروس</span>
                  <span className="font-bold text-foreground">{totalLessons}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-4">جميع المحتوى متاح للعرض</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search */}
          <Card>
            <CardHeader className="pb-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في الدروس والمواضيع..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </CardHeader>
          </Card>

          {/* Course Content */}
          <div className="space-y-6">
            {filteredSections.length === 0 ? (
              <Card className="text-center p-12">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">لا توجد نتائج</h3>
                <p className="text-muted-foreground">جرب تغيير مصطلحات البحث</p>
              </Card>
            ) : (
              <Accordion type="multiple" className="space-y-4">
                {filteredSections.map((section, sectionIndex) => (
                  <AccordionItem 
                    key={section.id} 
                    value={section.id}
                    className="border rounded-lg bg-card"
                  >
                    <AccordionTrigger className="px-6 py-4 hover:no-underline">
                      <div className="flex items-center justify-between w-full text-right">
                        <div className="flex items-center gap-4">
                          <div className="bg-muted text-muted-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                            {sectionIndex + 1}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{section.title}</h3>
                            {section.description && (
                              <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                            )}
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {section.topics.length} موضوع
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    
                    <AccordionContent className="px-6 pb-6">
                      <div className="space-y-4">
                        {section.topics.map((topic, topicIndex) => (
                          <Card key={topic.id} className="border-r-4 border-r-muted-foreground/30">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base flex items-center gap-3">
                                <span className="bg-muted text-muted-foreground rounded w-6 h-6 flex items-center justify-center text-xs">
                                  {topicIndex + 1}
                                </span>
                                {topic.title}
                              </CardTitle>
                              {topic.content && (
                                <p className="text-sm text-muted-foreground">{topic.content}</p>
                              )}
                            </CardHeader>
                            
                            <CardContent className="pt-0">
                              {topic.lessons.length === 0 ? (
                                <p className="text-muted-foreground text-sm text-center py-4">
                                  لا توجد دروس في هذا الموضوع
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {topic.lessons.map((lesson, lessonIndex) => (
                                    <div
                                      key={lesson.id}
                                      onClick={() => handleLessonClick(lesson)}
                                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors group"
                                    >
                                      <div className="bg-muted text-muted-foreground rounded w-6 h-6 flex items-center justify-center text-xs">
                                        ✓
                                      </div>
                                      
                                      <div className="flex-1">
                                        <h4 className="font-medium text-sm group-hover:text-foreground transition-colors">
                                          {lessonIndex + 1}. {lesson.title}
                                        </h4>
                                        <div className="flex items-center gap-4 mt-1">
                                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            15 دقيقة
                                          </span>
                                          {lesson.media && lesson.media.length > 0 && (
                                            <div className="flex items-center gap-1">
                                              {lesson.media.slice(0, 3).map((media) => (
                                                <span key={media.id} className="text-xs">
                                                  {getMediaIcon(media.media_type)}
                                                </span>
                                              ))}
                                              {lesson.media.length > 3 && (
                                                <span className="text-xs text-muted-foreground">
                                                  +{lesson.media.length - 3}
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      
                                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Content Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">إحصائيات المحتوى</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{sections.length}</div>
                  <p className="text-sm text-muted-foreground">أقسام متاحة</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">المواضيع</span>
                    <span className="font-medium">{allTopics.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">الدروس</span>
                    <span className="font-medium">{totalLessons}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">نظرة عامة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">الأقسام</span>
                  <Badge variant="secondary">{sections.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">المواضيع</span>
                  <Badge variant="secondary">{allTopics.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">الدروس</span>
                  <Badge variant="secondary">{totalLessons}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">المدة التقديرية</span>
                  <Badge variant="secondary">{Math.floor(totalDuration / 60)} ساعة</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">آخر التحديثات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sections.slice(0, 3).map((section) => (
                  <div key={section.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {section.title.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-xs font-medium">{section.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(section.created_at), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lesson Details Modal */}
      <Grade11LessonDetailsModal
        lesson={selectedLesson}
        isOpen={isLessonModalOpen}
        onClose={() => {
          setIsLessonModalOpen(false);
          setSelectedLesson(null);
        }}
      />
    </div>
  );
};

export default Grade11CourseViewer;