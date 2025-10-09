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
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50/50 border border-blue-200/60 rounded-3xl p-10 shadow-sm">
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <div className="h-10 bg-blue-200/50 rounded-2xl w-80 mx-auto animate-pulse"></div>
              <div className="h-6 bg-blue-200/50 rounded-xl w-96 mx-auto animate-pulse"></div>
            </div>
            <div className="flex items-center justify-center gap-12">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-200/50 rounded-xl animate-pulse"></div>
                  <div className="h-4 bg-blue-200/50 rounded-lg w-16 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <Card className="bg-gradient-to-br from-slate-50 to-slate-100/50 border-slate-200/60 shadow-sm">
              <CardHeader className="p-6">
                <div className="h-12 bg-slate-200/50 rounded-2xl animate-pulse"></div>
              </CardHeader>
            </Card>
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <Card key={i} className="bg-gradient-to-br from-white to-slate-50/30 border-slate-200/60 shadow-sm">
                  <CardContent className="p-8">
                    <div className="flex items-center gap-6 mb-6">
                      <div className="w-14 h-14 bg-slate-200/50 rounded-2xl animate-pulse"></div>
                      <div className="flex-1 space-y-3">
                        <div className="h-6 bg-slate-200/50 rounded-xl w-3/4 animate-pulse"></div>
                        <div className="h-4 bg-slate-200/50 rounded-lg w-1/2 animate-pulse"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-gradient-to-br from-slate-50 to-slate-100/50 border-slate-200/60 shadow-sm">
                <CardContent className="p-6">
                  <div className="h-16 bg-slate-200/50 rounded-2xl animate-pulse"></div>
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
      {/* Elegant Hero Section with Grade 10 Colors */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50/50 border border-blue-200/60 rounded-3xl p-10 shadow-sm">
        <div className="text-center space-y-6">
          <div>
            <h1 className="text-4xl font-semibold mb-4 text-slate-700">محتوى الصف الحادي عشر</h1>
            <p className="text-slate-500 text-lg font-medium max-w-3xl mx-auto">
              استكشف المنهج التعليمي الشامل للصف الحادي عشر مع دروس تفاعلية ووسائط متنوعة
            </p>
          </div>
          <div className="flex items-center justify-center gap-12 text-slate-500">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-200/50">
                <Play className="h-5 w-5 text-blue-600" />
              </div>
              <span className="font-medium">{totalLessons} درس</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-200/50">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <span className="font-medium">{Math.floor(totalDuration / 60)} ساعة</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-200/50">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <span className="font-medium">{sections.length} أقسام</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-8">
          {/* Elegant Search with Grade 10 Style */}
          <Card className="bg-gradient-to-br from-slate-50 to-slate-100/50 border-slate-200/60 shadow-sm">
            <CardHeader className="p-6">
              <div className="relative">
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="البحث في الدروس والمواضيع..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-12 py-4 text-base border-slate-200 bg-white/80 focus:bg-white font-medium"
                />
              </div>
            </CardHeader>
          </Card>

          {/* Course Content with Grade 10 Styling */}
          <div className="space-y-6">
            {filteredSections.length === 0 ? (
              <Card className="text-center p-16 bg-gradient-to-br from-slate-50 to-slate-100/50 border-slate-200/60 shadow-sm">
                <FileText className="h-16 w-16 mx-auto mb-4 text-slate-400" />
                <h3 className="text-xl font-semibold mb-2 text-slate-600">لا توجد نتائج</h3>
                <p className="text-slate-500 font-medium">جرب تغيير مصطلحات البحث</p>
              </Card>
            ) : (
              <Accordion type="multiple" className="space-y-6">
                {filteredSections.map((section, sectionIndex) => (
                  <AccordionItem 
                    key={section.id} 
                    value={section.id}
                    className="border border-slate-200/60 rounded-3xl bg-gradient-to-br from-white to-slate-50/30 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <AccordionTrigger className="px-8 py-6 hover:no-underline">
                      <div className="flex items-center justify-between w-full text-right">
                        <div className="flex items-center gap-6">
                          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl w-14 h-14 flex items-center justify-center text-sm font-semibold border shadow-lg text-white">
                            {sectionIndex + 1}
                          </div>
                          <div>
                            <h3 className="font-semibold text-xl text-slate-700">{section.title}</h3>
                            {section.description && (
                              <p className="text-base text-slate-500 mt-2 font-medium">{section.description}</p>
                            )}
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-blue-50 border border-blue-200 font-medium px-4 py-2 text-blue-600">
                          {section.topics.length} موضوع
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    
                    <AccordionContent className="px-8 pb-8">
                      <div className="space-y-5">
                        {section.topics.map((topic, topicIndex) => (
                          <Card key={topic.id} className="border border-green-200/60 bg-gradient-to-br from-white to-green-50/30 shadow-sm mr-6">
                            <CardHeader className="pb-4 p-6">
                              <CardTitle className="text-lg font-semibold flex items-center gap-4 text-slate-700">
                                <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl w-10 h-10 flex items-center justify-center text-sm shadow-md">
                                  {topicIndex + 1}
                                </span>
                                {topic.title}
                              </CardTitle>
                              {topic.content && (
                                <p className="text-base text-slate-500 font-medium mt-2">{topic.content}</p>
                              )}
                            </CardHeader>
                            
                            <CardContent className="pt-0 px-6 pb-6">
                              {topic.lessons.length === 0 ? (
                                <p className="text-slate-500 text-base text-center py-6 font-medium">
                                  لا توجد دروس في هذا الموضوع
                                </p>
                              ) : (
                                <div className="space-y-3">
                                  {topic.lessons.map((lesson, lessonIndex) => (
                                    <div
                                      key={lesson.id}
                                      onClick={() => handleLessonClick(lesson)}
                                      className="flex items-center gap-4 p-5 rounded-2xl border border-purple-200/60 bg-gradient-to-br from-purple-50/50 to-purple-100/30 hover:bg-purple-50/80 cursor-pointer transition-colors group"
                                    >
                                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl w-8 h-8 flex items-center justify-center text-sm shadow-sm">
                                        ✓
                                      </div>
                                      
                                      <div className="flex-1">
                                        <h4 className="font-semibold text-base group-hover:text-purple-700 transition-colors text-slate-700">
                                          {lessonIndex + 1}. {lesson.title}
                                        </h4>
                                        <div className="flex items-center gap-6 mt-2">
                                          <span className="text-sm text-slate-500 flex items-center gap-2 font-medium">
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
                                                <span className="text-sm text-slate-500 font-medium">
                                                  +{lesson.media.length - 3}
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      
                                      <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-purple-600 transition-colors" />
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

        {/* Elegant Sidebar with Grade 10 Colors */}
        <div className="space-y-6">
          {/* Content Statistics */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/60 shadow-sm">
            <CardHeader className="p-6">
              <CardTitle className="text-lg font-semibold text-blue-700">إحصائيات المحتوى</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{sections.length}</div>
                  <p className="text-sm text-blue-600/70 font-medium">أقسام متاحة</p>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between text-base">
                    <span className="text-blue-600/70 font-medium">المواضيع</span>
                    <span className="font-semibold text-blue-700">{allTopics.length}</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-blue-600/70 font-medium">الدروس</span>
                    <span className="font-semibold text-blue-700">{totalLessons}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Overview */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/60 shadow-sm">
            <CardHeader className="p-6">
              <CardTitle className="text-lg font-semibold text-green-700">نظرة عامة</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-base font-medium text-green-600/70">الأقسام</span>
                  <Badge variant="secondary" className="bg-green-100 border border-green-200 font-medium text-green-700">{sections.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base font-medium text-green-600/70">المواضيع</span>
                  <Badge variant="secondary" className="bg-green-100 border border-green-200 font-medium text-green-700">{allTopics.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base font-medium text-green-600/70">الدروس</span>
                  <Badge variant="secondary" className="bg-green-100 border border-green-200 font-medium text-green-700">{totalLessons}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base font-medium text-green-600/70">المدة التقديرية</span>
                  <Badge variant="secondary" className="bg-green-100 border border-green-200 font-medium text-green-700">{Math.floor(totalDuration / 60)} ساعة</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/60 shadow-sm">
            <CardHeader className="p-6">
              <CardTitle className="text-lg font-semibold text-purple-700">آخر التحديثات</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-4">
                {sections.slice(0, 3).map((section) => (
                  <div key={section.id} className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 border border-purple-200">
                      <AvatarFallback className="text-sm bg-purple-100 text-purple-700 font-semibold">
                        {section.title.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-purple-700">{section.title}</p>
                      <p className="text-sm text-purple-600/70 font-medium">
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