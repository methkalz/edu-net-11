import React, { useState, useCallback, memo, useMemo } from 'react';
import { Clock, FileText, Search, ChevronRight, PlayCircle, BookOpen, Trophy, Star, ChevronDown, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { useVirtualizedGrade11Content } from '@/hooks/useVirtualizedGrade11Content';
import Grade11OptimizedLessonModal from '../content/Grade11OptimizedLessonModal';

interface Grade11VirtualizedViewerProps {
  onContentClick?: (content: any, contentType: 'lesson') => void;
  onContentComplete?: (contentId: string, contentType: string, timeSpent: number) => void;
}

const Grade11VirtualizedViewer: React.FC<Grade11VirtualizedViewerProps> = ({
  onContentClick,
  onContentComplete
}) => {
  const { 
    sections, 
    loading, 
    stats, 
    loadTopicsForSection, 
    loadLessonsForTopic,
    getFullLesson 
  } = useVirtualizedGrade11Content();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const handleLessonClick = useCallback((lessonId: string) => {
    if (onContentClick) {
      onContentClick({ id: lessonId }, 'lesson');
    } else {
      setSelectedLessonId(lessonId);
      setIsLessonModalOpen(true);
    }
  }, [onContentClick]);

  const toggleSection = useCallback(async (sectionId: string) => {
    const isCurrentlyOpen = openSections.has(sectionId);
    
    setOpenSections(prev => {
      const newSet = new Set(prev);
      if (isCurrentlyOpen) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });

    if (!isCurrentlyOpen) {
      const section = sections.find(s => s.id === sectionId);
      if (section && !section.isLoaded) {
        await loadTopicsForSection(sectionId);
      }
    }
  }, [openSections, sections, loadTopicsForSection]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 px-6">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-16 w-96 rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-100 rounded-3xl p-12 mb-10">
        <div className="text-center space-y-8">
          <h1 className="text-5xl font-bold text-gray-900">دروس الصف الحادي عشر</h1>
          <p className="text-2xl text-gray-700 max-w-3xl mx-auto">
            استكشف المنهج التعليمي الشامل مع دروس تفاعلية ومتنوعة
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/60">
              <div className="flex items-center justify-center gap-4 mb-3">
                <BookOpen className="h-10 w-10 text-blue-600" />
                <span className="text-4xl font-bold text-gray-900">{stats.lessonsCount}</span>
              </div>
              <p className="text-xl font-semibold text-gray-700">درس متاح</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/60">
              <div className="flex items-center justify-center gap-4 mb-3">
                <Trophy className="h-10 w-10 text-orange-600" />
                <span className="text-4xl font-bold text-gray-900">{stats.sectionsCount}</span>
              </div>
              <p className="text-xl font-semibold text-gray-700">قسم تعليمي</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/60">
              <div className="flex items-center justify-center gap-4 mb-3">
                <Star className="h-10 w-10 text-yellow-600" />
                <span className="text-4xl font-bold text-gray-900">{stats.topicsCount}</span>
              </div>
              <p className="text-xl font-semibold text-gray-700">موضوع رئيسي</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-10">
        <Card className="border-2 border-gray-200 rounded-2xl">
          <CardContent className="p-8">
            <div className="relative">
              <Search className="absolute right-6 top-1/2 transform -translate-y-1/2 h-7 w-7 text-gray-400" />
              <Input
                placeholder="ابحث في الدروس والمواضيع..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-xl h-16 pr-16 text-right border-0 bg-gray-50 focus:bg-white transition-colors rounded-xl"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-8">
        {sections.map((section, sectionIndex) => (
          <Collapsible 
            key={section.id} 
            open={openSections.has(section.id)}
            onOpenChange={() => toggleSection(section.id)}
          >
            <Card className="border-2 rounded-3xl bg-white shadow-md">
              <CollapsibleTrigger asChild>
                <div className="px-10 py-8 hover:bg-gray-50/70 cursor-pointer transition-colors">
                  <div className="flex items-center justify-between w-full text-right">
                    <div className="flex items-center gap-8">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full w-14 h-14 flex items-center justify-center text-xl font-bold">
                        {sectionIndex + 1}
                      </div>
                      <div>
                        <h3 className="font-bold text-3xl text-gray-900 mb-3">{section.title}</h3>
                        {section.description && (
                          <p className="text-xl text-gray-700">{section.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <Badge variant="secondary" className="text-lg px-6 py-3">
                        {section.topics_count} موضوع
                      </Badge>
                      <ChevronDown className={`h-8 w-8 text-gray-400 transition-transform duration-300 ${
                        openSections.has(section.id) ? 'rotate-180' : ''
                      }`} />
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="px-10 pb-10 border-t-2 border-gray-100">
                  {!section.topics || section.topics.length === 0 ? (
                    <div className="text-center py-16">
                      <Trophy className="h-20 w-20 mx-auto mb-6 text-gray-300" />
                      <p className="text-2xl text-gray-500">لا توجد مواضيع في هذا القسم بعد</p>
                    </div>
                  ) : (
                    <div className="space-y-8 pt-8">
                      {section.topics.map((topic: any, topicIndex: number) => (
                        <Card key={topic.id} className="border-2 border-blue-200 bg-blue-50/30 rounded-2xl">
                          <CardHeader className="pb-6">
                            <CardTitle className="text-2xl flex items-center justify-between">
                              <div className="flex items-center gap-6">
                                <span className="bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold">
                                  {topicIndex + 1}
                                </span>
                                <span className="text-gray-900">{topic.title}</span>
                              </div>
                              <Badge variant="outline" className="text-base px-4 py-2">
                                {topic.lessons_count} درس
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          
                          <CardContent className="pt-0 pb-8">
                            {!topic.lessons || topic.lessons.length === 0 ? (
                              <div className="text-center py-12">
                                <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                                <p className="text-xl text-gray-500">لا توجد دروس في هذا الموضوع</p>
                              </div>
                            ) : (
                              <div className="space-y-6">
                                {topic.lessons.map((lesson: any, lessonIndex: number) => (
                                  <div
                                    key={lesson.id}
                                    onClick={() => handleLessonClick(lesson.id)}
                                    className="flex items-center gap-6 p-8 rounded-2xl border-2 border-gray-100 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition-all duration-300 group bg-white shadow-sm hover:shadow-md"
                                  >
                                    <div className="bg-green-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-lg font-bold">
                                      {lessonIndex + 1}
                                    </div>
                                    
                                    <div className="flex-1">
                                      <h4 className="font-bold text-xl text-gray-900 group-hover:text-blue-700 transition-colors mb-3">
                                        {lesson.title}
                                      </h4>
                                      <div className="flex items-center gap-8">
                                        <span className="text-lg text-gray-600 flex items-center gap-3">
                                          <Clock className="h-6 w-6" />
                                          15 دقيقة تقريباً
                                        </span>
                                        {lesson.media_count > 0 && (
                                          <Badge variant="outline" className="text-base px-3 py-1">
                                            {lesson.media_count} ملف
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <Button 
                                      size="lg" 
                                      className="px-8 py-4 text-lg font-semibold rounded-xl"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleLessonClick(lesson.id);
                                      }}
                                    >
                                      ابدأ الدرس
                                      <ChevronRight className="h-6 w-6 mr-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>

      <Grade11OptimizedLessonModal
        lessonId={selectedLessonId}
        isOpen={isLessonModalOpen}
        onClose={() => {
          setIsLessonModalOpen(false);
          setSelectedLessonId(null);
        }}
        loadFullLesson={getFullLesson}
      />
    </div>
  );
};

export default Grade11VirtualizedViewer;