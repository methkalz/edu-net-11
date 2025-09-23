import React, { useState } from 'react';
import { Play, Clock, FileText, Search, ChevronRight, CheckCircle2, PlayCircle, BookOpen, Trophy, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { useGrade11Content, Grade11LessonWithMedia } from '@/hooks/useGrade11Content';
import Grade11LessonDetailsModal from '../content/Grade11LessonDetailsModal';

interface Grade11StudentContentViewerProps {
  onContentClick?: (content: any, contentType: 'lesson') => void;
  onContentComplete?: (contentId: string, contentType: string, timeSpent: number) => void;
}

const Grade11StudentContentViewer: React.FC<Grade11StudentContentViewerProps> = ({
  onContentClick,
  onContentComplete
}) => {
  const { sections, loading } = useGrade11Content();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<Grade11LessonWithMedia | null>(null);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);

  const allTopics = sections.flatMap(section => section.topics);
  const allLessons = allTopics.flatMap(topic => topic.lessons);
  const totalLessons = allLessons.length;
  const completedLessons = 0; // سيتم تحديثه لاحقاً مع نظام التقدم

  const filteredSections = sections.map(section => ({
    ...section,
    topics: section.topics.filter(topic => 
      topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.lessons.some(lesson => lesson.title.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })).filter(section => section.topics.length > 0);

  const handleLessonClick = (lesson: Grade11LessonWithMedia) => {
    if (onContentClick) {
      onContentClick(lesson, 'lesson');
    } else {
      setSelectedLesson(lesson);
      setIsLessonModalOpen(true);
    }
  };

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'video':
        return <PlayCircle className="h-5 w-5 text-blue-500" />;
      case 'lottie':
        return <Play className="h-5 w-5 text-purple-500" />;
      case 'image':
        return <FileText className="h-5 w-5 text-green-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 px-4">
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Header Section - أكبر وأوضح */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-8 mb-8">
        <div className="text-center space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-gray-900">دروس الصف الحادي عشر</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              استكشف المنهج التعليمي الشامل مع دروس تفاعلية ومتنوعة
            </p>
          </div>
          
          {/* إحصائيات المحتوى - أكبر وأوضح */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50">
              <div className="flex items-center justify-center gap-3 mb-2">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <span className="text-3xl font-bold text-gray-900">{totalLessons}</span>
              </div>
              <p className="text-lg font-medium text-gray-600">درس متاح</p>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Trophy className="h-8 w-8 text-orange-600" />
                <span className="text-3xl font-bold text-gray-900">{sections.length}</span>
              </div>
              <p className="text-lg font-medium text-gray-600">قسم تعليمي</p>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Star className="h-8 w-8 text-yellow-600" />
                <span className="text-3xl font-bold text-gray-900">{allTopics.length}</span>
              </div>
              <p className="text-lg font-medium text-gray-600">موضوع رئيسي</p>
            </div>
          </div>

          {/* شريط التقدم */}
          {progressPercentage > 0 && (
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 max-w-md mx-auto">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-gray-700">تقدمك في المنهج</span>
                  <span className="text-lg font-bold text-blue-600">{progressPercentage}%</span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
                <p className="text-sm text-gray-600">
                  أكملت {completedLessons} من أصل {totalLessons} درس
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* شريط البحث - أكبر */}
      <div className="mb-8">
        <Card className="border-2 border-gray-200">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
              <Input
                placeholder="ابحث في الدروس والمواضيع..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-lg h-14 pr-14 text-right border-0 bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* محتوى الدروس */}
      <div className="space-y-6">
        {filteredSections.length === 0 ? (
          <Card className="text-center p-12 border-2 border-dashed border-gray-200">
            <FileText className="h-20 w-20 mx-auto mb-4 text-gray-300" />
            <h3 className="text-2xl font-semibold mb-3 text-gray-700">لا توجد نتائج</h3>
            <p className="text-lg text-gray-500">جرب تغيير مصطلحات البحث</p>
          </Card>
        ) : (
          <Accordion type="multiple" defaultValue={sections.map(s => s.id)} className="space-y-6">
            {filteredSections.map((section, sectionIndex) => (
              <AccordionItem 
                key={section.id} 
                value={section.id}
                className="border-2 rounded-2xl bg-white shadow-sm"
              >
                <AccordionTrigger className="px-8 py-6 hover:no-underline">
                  <div className="flex items-center justify-between w-full text-right">
                    <div className="flex items-center gap-6">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-lg font-bold">
                        {sectionIndex + 1}
                      </div>
                      <div>
                        <h3 className="font-bold text-2xl text-gray-900 mb-2">{section.title}</h3>
                        {section.description && (
                          <p className="text-lg text-gray-600">{section.description}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-base px-4 py-2">
                      {section.topics.length} موضوع
                    </Badge>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="px-8 pb-8">
                  <div className="space-y-6">
                    {section.topics.map((topic, topicIndex) => (
                      <Card key={topic.id} className="border-r-4 border-r-blue-400 bg-blue-50/30">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-xl flex items-center gap-4">
                            <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                              {topicIndex + 1}
                            </span>
                            <span className="text-gray-900">{topic.title}</span>
                          </CardTitle>
                          {topic.content && (
                            <p className="text-lg text-gray-600 mr-12">{topic.content}</p>
                          )}
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                          {topic.lessons.length === 0 ? (
                            <p className="text-gray-500 text-lg text-center py-8">
                              لا توجد دروس في هذا الموضوع بعد
                            </p>
                          ) : (
                            <div className="space-y-4">
                              {topic.lessons.map((lesson, lessonIndex) => (
                                <div
                                  key={lesson.id}
                                  onClick={() => handleLessonClick(lesson)}
                                  className="flex items-center gap-4 p-5 rounded-xl border-2 border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 cursor-pointer transition-all duration-200 group bg-white"
                                >
                                  <div className="bg-green-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold">
                                    {lessonIndex + 1}
                                  </div>
                                  
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-lg text-gray-900 group-hover:text-blue-700 transition-colors mb-2">
                                      {lesson.title}
                                    </h4>
                                    <div className="flex items-center gap-6">
                                      <span className="text-base text-gray-500 flex items-center gap-2">
                                        <Clock className="h-5 w-5" />
                                        15 دقيقة تقريباً
                                      </span>
                                      {lesson.media && lesson.media.length > 0 && (
                                        <div className="flex items-center gap-3">
                                          <span className="text-sm text-gray-500">الوسائط:</span>
                                          <div className="flex items-center gap-2">
                                            {lesson.media.slice(0, 3).map((media) => (
                                              <div key={media.id} className="flex items-center">
                                                {getMediaIcon(media.media_type)}
                                              </div>
                                            ))}
                                            {lesson.media.length > 3 && (
                                              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                +{lesson.media.length - 3} أكثر
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <Button 
                                    size="lg" 
                                    className="px-6 py-3 text-base font-medium"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleLessonClick(lesson);
                                    }}
                                  >
                                    ابدأ الدرس
                                    <ChevronRight className="h-5 w-5 mr-2" />
                                  </Button>
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

      {/* Modal لتفاصيل الدرس */}
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

export default Grade11StudentContentViewer;