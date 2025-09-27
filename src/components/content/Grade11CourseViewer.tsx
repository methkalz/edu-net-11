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
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-surface-light border border-divider rounded-3xl p-10">
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <div className="h-10 bg-background rounded-2xl w-80 mx-auto animate-pulse"></div>
              <div className="h-6 bg-background rounded-xl w-96 mx-auto animate-pulse"></div>
            </div>
            <div className="flex items-center justify-center gap-12">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-background rounded-xl border border-divider animate-pulse"></div>
                  <div className="h-4 bg-background rounded-lg w-16 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <Card className="border border-divider bg-surface-light shadow-none">
              <CardHeader className="p-6">
                <div className="h-12 bg-background rounded-2xl animate-pulse"></div>
              </CardHeader>
            </Card>
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <Card key={i} className="border border-divider bg-surface-light shadow-none">
                  <CardContent className="p-8">
                    <div className="flex items-center gap-6 mb-6">
                      <div className="w-12 h-12 bg-background rounded-2xl border border-divider animate-pulse"></div>
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
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border border-divider bg-surface-light shadow-none">
                <CardContent className="p-6">
                  <div className="h-16 bg-background rounded-2xl animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Minimal Hero Section */}
      <div className="bg-surface-light border border-divider rounded-3xl p-10">
        <div className="text-center space-y-6">
          <div>
            <h1 className="text-4xl font-light mb-4 text-foreground">محتوى الصف الحادي عشر</h1>
            <p className="text-text-soft text-lg font-light max-w-3xl mx-auto">
              استكشف المنهج التعليمي الشامل للصف الحادي عشر مع دروس تفاعلية ووسائط متنوعة
            </p>
          </div>
          <div className="flex items-center justify-center gap-12 text-text-soft">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center border border-divider">
                <Play className="h-5 w-5" />
              </div>
              <span className="font-light">{totalLessons} درس</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center border border-divider">
                <Clock className="h-5 w-5" />
              </div>
              <span className="font-light">{Math.floor(totalDuration / 60)} ساعة</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center border border-divider">
                <Users className="h-5 w-5" />
              </div>
              <span className="font-light">{sections.length} أقسام</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-8">
          {/* Minimal Search */}
          <Card className="border border-divider bg-surface-light shadow-none">
            <CardHeader className="p-6">
              <div className="relative">
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-soft" />
                <Input
                  placeholder="البحث في الدروس والمواضيع..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-12 py-4 text-base border-divider bg-background focus:bg-background font-light"
                />
              </div>
            </CardHeader>
          </Card>

          {/* Course Content */}
          <div className="space-y-6">
            {filteredSections.length === 0 ? (
              <Card className="text-center p-16 border border-divider bg-surface-light shadow-none">
                <FileText className="h-16 w-16 mx-auto mb-4 text-text-soft" />
                <h3 className="text-xl font-light mb-2 text-foreground">لا توجد نتائج</h3>
                <p className="text-text-soft font-light">جرب تغيير مصطلحات البحث</p>
              </Card>
            ) : (
              <Accordion type="multiple" className="space-y-6">
                {filteredSections.map((section, sectionIndex) => (
                  <AccordionItem 
                    key={section.id} 
                    value={section.id}
                    className="border border-divider rounded-3xl bg-surface-light shadow-none"
                  >
                    <AccordionTrigger className="px-8 py-6 hover:no-underline">
                      <div className="flex items-center justify-between w-full text-right">
                        <div className="flex items-center gap-6">
                          <div className="bg-background text-text-soft rounded-2xl w-12 h-12 flex items-center justify-center text-sm font-light border border-divider">
                            {sectionIndex + 1}
                          </div>
                          <div>
                            <h3 className="font-light text-xl text-foreground">{section.title}</h3>
                            {section.description && (
                              <p className="text-base text-text-soft mt-2 font-light">{section.description}</p>
                            )}
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-background border border-divider font-light px-4 py-2">
                          {section.topics.length} موضوع
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    
                    <AccordionContent className="px-8 pb-8">
                      <div className="space-y-5">
                        {section.topics.map((topic, topicIndex) => (
                          <Card key={topic.id} className="border border-divider bg-background shadow-none mr-6">
                            <CardHeader className="pb-4 p-6">
                              <CardTitle className="text-lg font-light flex items-center gap-4 text-foreground">
                                <span className="bg-surface-light text-text-soft rounded-xl w-8 h-8 flex items-center justify-center text-sm border border-divider">
                                  {topicIndex + 1}
                                </span>
                                {topic.title}
                              </CardTitle>
                              {topic.content && (
                                <p className="text-base text-text-soft font-light mt-2">{topic.content}</p>
                              )}
                            </CardHeader>
                            
                            <CardContent className="pt-0 px-6 pb-6">
                              {topic.lessons.length === 0 ? (
                                <p className="text-text-soft text-base text-center py-6 font-light">
                                  لا توجد دروس في هذا الموضوع
                                </p>
                              ) : (
                                <div className="space-y-3">
                                  {topic.lessons.map((lesson, lessonIndex) => (
                                    <div
                                      key={lesson.id}
                                      onClick={() => handleLessonClick(lesson)}
                                      className="flex items-center gap-4 p-5 rounded-2xl border border-divider bg-surface-light hover:bg-surface-hover cursor-pointer transition-colors group"
                                    >
                                      <div className="bg-background text-text-soft rounded-xl w-8 h-8 flex items-center justify-center text-sm border border-divider">
                                        ✓
                                      </div>
                                      
                                      <div className="flex-1">
                                        <h4 className="font-light text-base group-hover:text-foreground transition-colors">
                                          {lessonIndex + 1}. {lesson.title}
                                        </h4>
                                        <div className="flex items-center gap-6 mt-2">
                                          <span className="text-sm text-text-soft flex items-center gap-2 font-light">
                                            <Clock className="h-4 w-4" />
                                            15 دقيقة
                                          </span>
                                          {lesson.media && lesson.media.length > 0 && (
                                            <div className="flex items-center gap-2">
                                              {lesson.media.slice(0, 3).map((media) => (
                                                <span key={media.id} className="text-sm">
                                                  {getMediaIcon(media.media_type)}
                                                </span>
                                              ))}
                                              {lesson.media.length > 3 && (
                                                <span className="text-sm text-text-soft font-light">
                                                  +{lesson.media.length - 3}
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      
                                      <ChevronRight className="h-5 w-5 text-text-soft group-hover:text-foreground transition-colors" />
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

        {/* Minimal Sidebar */}
        <div className="space-y-6">
          {/* Content Statistics */}
          <Card className="border border-divider bg-surface-light shadow-none">
            <CardHeader className="p-6">
              <CardTitle className="text-lg font-light text-foreground">إحصائيات المحتوى</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-3xl font-light text-foreground">{sections.length}</div>
                  <p className="text-sm text-text-soft font-light">أقسام متاحة</p>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between text-base">
                    <span className="text-text-soft font-light">المواضيع</span>
                    <span className="font-light text-foreground">{allTopics.length}</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-text-soft font-light">الدروس</span>
                    <span className="font-light text-foreground">{totalLessons}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Overview */}
          <Card className="border border-divider bg-surface-light shadow-none">
            <CardHeader className="p-6">
              <CardTitle className="text-lg font-light text-foreground">نظرة عامة</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-base font-light text-text-soft">الأقسام</span>
                  <Badge variant="secondary" className="bg-background border border-divider font-light">{sections.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base font-light text-text-soft">المواضيع</span>
                  <Badge variant="secondary" className="bg-background border border-divider font-light">{allTopics.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base font-light text-text-soft">الدروس</span>
                  <Badge variant="secondary" className="bg-background border border-divider font-light">{totalLessons}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base font-light text-text-soft">المدة التقديرية</span>
                  <Badge variant="secondary" className="bg-background border border-divider font-light">{Math.floor(totalDuration / 60)} ساعة</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border border-divider bg-surface-light shadow-none">
            <CardHeader className="p-6">
              <CardTitle className="text-lg font-light text-foreground">آخر التحديثات</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-4">
                {sections.slice(0, 3).map((section) => (
                  <div key={section.id} className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 border border-divider">
                      <AvatarFallback className="text-sm bg-background text-text-soft font-light">
                        {section.title.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-light text-foreground">{section.title}</p>
                      <p className="text-sm text-text-soft font-light">
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