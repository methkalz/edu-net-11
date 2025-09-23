import React, { useState, useCallback, memo, useMemo, Suspense, lazy } from 'react';
import { Search, ChevronDown, BookOpen, Trophy, Star, AlertCircle, RefreshCw, Wifi, WifiOff, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { useGrade11Content, Grade11LessonWithMedia, Grade11SectionWithTopics, Grade11TopicWithLessons } from '@/hooks/useGrade11Content';
import { useVirtualizedContent } from '@/hooks/useVirtualizedContent';
import { useErrorHandler } from '@/lib/error-handling/hooks/use-error-handler';
import MinimalistLessonCard from './MinimalistLessonCard';
import ProgressTracker from './ProgressTracker';

// Lazy load المودال للأداء
const StudentLessonModal = lazy(() => import('./StudentLessonModal'));

interface Grade11StudentContentViewerProps {
  onContentClick?: (content: any, contentType: 'lesson') => void;
  onContentComplete?: (contentId: string, contentType: string, timeSpent: number) => void;
  completedLessons?: string[];
  studyTime?: number;
}

// خطأ مخصص للشبكة
const NetworkError = ({ onRetry }: { onRetry: () => void }) => (
  <Alert className="border-red-200 bg-red-50">
    <WifiOff className="h-6 w-6 text-red-600" />
    <AlertDescription className="flex items-center justify-between">
      <div>
        <p className="text-lg font-medium text-red-800 mb-1">خطأ في الاتصال</p>
        <p className="text-red-600">تحقق من اتصالك بالإنترنت وحاول مرة أخرى</p>
      </div>
      <Button onClick={onRetry} variant="outline" size="sm" className="mr-4">
        <RefreshCw className="h-4 w-4 ml-2" />
        إعادة المحاولة
      </Button>
    </AlertDescription>
  </Alert>
);

// حالة التحميل المحسنة
const LoadingSkeleton = () => (
  <div className="max-w-6xl mx-auto space-y-8 px-4">
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 space-y-4">
      <Skeleton className="h-12 w-96 mx-auto" />
      <Skeleton className="h-6 w-64 mx-auto" />
      <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto pt-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
    <Skeleton className="h-16 rounded-2xl" />
    {[1, 2, 3].map(i => (
      <Card key={i} className="rounded-2xl">
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
        </div>
      </Card>
    ))}
  </div>
);

// Memoized minimalist topic card
const MinimalistTopicCard = memo<{
  topic: Grade11TopicWithLessons;
  topicIndex: number;
  onLessonClick: (lesson: Grade11LessonWithMedia) => void;
  completedLessons?: string[];
}>(({ topic, topicIndex, onLessonClick, completedLessons = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const completedCount = topic.lessons.filter(lesson => 
    completedLessons.includes(lesson.id)
  ).length;
  const progressPercentage = topic.lessons.length > 0 
    ? (completedCount / topic.lessons.length) * 100 
    : 0;

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className="border-2 border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-4 cursor-pointer hover:bg-blue-50/30 transition-colors">
            <CardTitle className="text-xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white ${
                  progressPercentage === 100 ? 'bg-green-500' : 'bg-blue-500'
                }`}>
                  {progressPercentage === 100 ? '✓' : topicIndex + 1}
                </div>
                <div className="text-right">
                  <span className="text-gray-900 text-xl font-bold">{topic.title}</span>
                  {progressPercentage > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-blue-600">
                        {Math.round(progressPercentage)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-base px-3 py-1">
                  {topic.lessons.length} درس
                </Badge>
                <ChevronDown className={`h-6 w-6 text-gray-400 transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`} />
              </div>
            </CardTitle>
            {topic.content && (
              <p className="text-lg text-gray-600 mr-16 leading-relaxed">{topic.content}</p>
            )}
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 pb-6">
            {topic.lessons.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-lg text-gray-500">لا توجد دروس في هذا الموضوع بعد</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topic.lessons.map((lesson, lessonIndex) => (
                  <MinimalistLessonCard
                    key={lesson.id}
                    lesson={lesson}
                    lessonIndex={lessonIndex}
                    onLessonClick={onLessonClick}
                    isCompleted={completedLessons.includes(lesson.id)}
                    progress={completedLessons.includes(lesson.id) ? 100 : 0}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
});

MinimalistTopicCard.displayName = 'MinimalistTopicCard';

// Memoized topic card
const TopicCard = memo<{
  topic: Grade11TopicWithLessons;
  topicIndex: number;
  onLessonClick: (lesson: Grade11LessonWithMedia) => void;
}>(({ topic, topicIndex, onLessonClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className="border-r-4 border-r-blue-400 bg-blue-50/30">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-4 cursor-pointer hover:bg-blue-50/50 transition-colors">
            <CardTitle className="text-xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  {topicIndex + 1}
                </span>
                <span className="text-gray-900">{topic.title}</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-sm">
                  {topic.lessons.length} درس
                </Badge>
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
              </div>
            </CardTitle>
            {topic.content && (
              <p className="text-lg text-gray-600 mr-12">{topic.content}</p>
            )}
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            {topic.lessons.length === 0 ? (
              <p className="text-gray-500 text-lg text-center py-8">
                لا توجد دروس في هذا الموضوع بعد
              </p>
            ) : (
              <div className="space-y-4">
                {topic.lessons.map((lesson, lessonIndex) => (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    lessonIndex={lessonIndex}
                    onLessonClick={onLessonClick}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
});

TopicCard.displayName = 'TopicCard';

const Grade11StudentContentViewer: React.FC<Grade11StudentContentViewerProps> = ({
  onContentClick,
  onContentComplete,
  completedLessons = [],
  studyTime = 0
}) => {
  const { sections, loading, error, fetchSections } = useGrade11Content();
  const { handleError } = useErrorHandler();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<Grade11LessonWithMedia | null>(null);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [showProgressTracker, setShowProgressTracker] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Handle section expansion with simple toggle
  const toggleSection = useCallback((sectionId: string) => {
    setOpenSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  // مراقبة حالة الشبكة
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle lesson click with error handling
  const handleLessonClick = useCallback(async (lesson: Grade11LessonWithMedia) => {
    try {
      if (onContentClick) {
        onContentClick(lesson, 'lesson');
      } else {
        setSelectedLesson(lesson);
        setIsLessonModalOpen(true);
      }
    } catch (error) {
      handleError(error, { context: 'opening_lesson', lessonId: lesson.id });
    }
  }, [onContentClick, handleError]);

  // Handle lesson completion
  const handleLessonComplete = useCallback(async (lessonId: string, timeSpent: number) => {
    try {
      if (onContentComplete) {
        await onContentComplete(lessonId, 'lesson', timeSpent);
      }
    } catch (error) {
      handleError(error, { context: 'completing_lesson', lessonId });
    }
  }, [onContentComplete, handleError]);

  // Memoized search filtering to prevent unnecessary re-renders
  const filteredSections = useMemo(() => {
    if (!searchTerm) return sections;
    
    return sections.filter(section => {
      const matchesSection = section.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTopics = section.topics.some(topic => 
        topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        topic.lessons.some(lesson => lesson.title.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      
      return matchesSection || matchesTopics;
    });
  }, [sections, searchTerm]);

  // Memoized statistics - calculated from sections
  const stats = useMemo(() => {
    const allTopics = sections.flatMap(section => section.topics);
    const allLessons = allTopics.flatMap(topic => topic.lessons);
    return {
      sectionsCount: sections.length,
      topicsCount: allTopics.length,
      lessonsCount: allLessons.length
    };
  }, [sections]);

  const completedLessonsCount = completedLessons.length;

  // إدارة الأخطاء والحالات الاستثنائية
  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error && !isOnline) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <NetworkError onRetry={() => fetchSections(false)} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-6 w-6 text-red-600" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <p className="text-lg font-medium text-red-800 mb-1">خطأ في تحميل المحتوى</p>
              <p className="text-red-600">يرجى المحاولة مرة أخرى</p>
            </div>
            <Button onClick={() => fetchSections(false)} variant="outline" size="sm" className="mr-4">
              <RefreshCw className="h-4 w-4 ml-2" />
              إعادة المحاولة
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const progressPercentage = stats.lessonsCount > 0 ? Math.round((completedLessonsCount / stats.lessonsCount) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* مؤشر الشبكة */}
      {!isOnline && (
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <WifiOff className="h-5 w-5 text-orange-600" />
          <AlertDescription className="text-orange-800">
            أنت تعمل في وضع عدم الاتصال. بعض الميزات قد لا تعمل بشكل صحيح.
          </AlertDescription>
        </Alert>
      )}

      {/* Header مينيماليست محسن */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-100 rounded-3xl p-8 mb-8 shadow-sm">
        <div className="text-center space-y-6">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-gray-900 leading-tight">
              دروس الصف الحادي عشر
            </h1>
            <p className="text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              استكشف المنهج التعليمي الشامل مع دروس تفاعلية وأدوات تعلم متطورة
            </p>
          </div>
          
          {/* إحصائيات محسنة */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/60 hover:scale-105 transition-transform duration-300">
              <div className="flex items-center justify-center gap-3 mb-3">
                <BookOpen className="h-10 w-10 text-blue-600" />
                <span className="text-4xl font-bold text-gray-900">{stats.lessonsCount}</span>
              </div>
              <p className="text-xl font-medium text-gray-600">درس متاح</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/60 hover:scale-105 transition-transform duration-300">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Trophy className="h-10 w-10 text-orange-600" />
                <span className="text-4xl font-bold text-gray-900">{completedLessons.length}</span>
              </div>
              <p className="text-xl font-medium text-gray-600">درس مكتمل</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/60 hover:scale-105 transition-transform duration-300">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Star className="h-10 w-10 text-green-600" />
                <span className="text-4xl font-bold text-gray-900">{stats.topicsCount}</span>
              </div>
              <p className="text-xl font-medium text-gray-600">موضوع رئيسي</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/60 hover:scale-105 transition-transform duration-300">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
                <span className="text-4xl font-bold text-gray-900">{Math.round(progressPercentage)}</span>
              </div>
              <p className="text-xl font-medium text-gray-600">نسبة الإنجاز</p>
            </div>
          </div>

          {/* أزرار التحكم */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button
              onClick={() => setShowProgressTracker(!showProgressTracker)}
              variant="outline"
              size="lg"
              className="h-12 px-6 text-lg border-2"
            >
              📈 تتبع التقدم
            </Button>
            <Button
              onClick={() => fetchSections(false)}
              variant="outline"  
              size="lg"
              className="h-12 px-6 text-lg border-2"
            >
              <RefreshCw className="h-5 w-5 ml-2" />
              تحديث المحتوى
            </Button>
          </div>
        </div>
      </div>

      {/* تتبع التقدم */}
      {showProgressTracker && (
        <div className="mb-8">
          <ProgressTracker
            sections={sections}
            completedLessons={completedLessons}
            studyTime={studyTime}
            onUpdateProgress={handleLessonComplete}
          />
        </div>
      )}

      {/* شريط البحث محسن */}
      <div className="mb-8">
        <Card className="border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-8">
            <div className="relative">
              <Search className="absolute right-6 top-1/2 transform -translate-y-1/2 h-7 w-7 text-gray-400" />
              <Input
                placeholder="ابحث في الدروس والمواضيع والمحتوى..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-xl h-16 pr-16 text-right border-0 bg-gray-50 focus:bg-white transition-all duration-300 rounded-xl"
              />
              {searchTerm && (
                <Button
                  onClick={() => setSearchTerm('')}
                  variant="ghost"
                  size="sm"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 rounded-full"
                >
                  ✕
                </Button>
              )}
            </div>
            {searchTerm && (
              <p className="text-base text-gray-500 mt-3 text-center">
                البحث عن: "{searchTerm}" - وجدت {filteredSections.length} نتيجة
              </p>
            )}
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
          <div className="space-y-6">
            {filteredSections.map((section, sectionIndex) => (
              <Collapsible 
                key={section.id} 
                open={openSections.has(section.id)}
                onOpenChange={() => toggleSection(section.id)}
              >
                <Card className="border-2 rounded-2xl bg-white shadow-sm overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <div className="px-8 py-6 hover:bg-gray-50/50 cursor-pointer transition-colors">
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
                        <div className="flex items-center gap-4">
                          <Badge variant="secondary" className="text-base px-4 py-2">
                            {section.topics.length} موضوع
                          </Badge>
                          <ChevronDown className={`h-6 w-6 text-gray-400 transition-transform duration-200 ${
                            openSections.has(section.id) ? 'rotate-180' : ''
                          }`} />
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="px-8 pb-8 border-t border-gray-100">
                      {section.topics.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-lg text-gray-500">لا توجد مواضيع في هذا القسم بعد</p>
                        </div>
                      ) : (
                        <div className="space-y-6 pt-6">
                          {section.topics.map((topic, topicIndex) => (
                            <MinimalistTopicCard
                              key={topic.id}
                              topic={topic}
                              topicIndex={topicIndex}
                              onLessonClick={handleLessonClick}
                              completedLessons={completedLessons}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        )}
      </div>

      {/* Modal محسن للطلاب */}
      <Suspense fallback={<div>تحميل الدرس...</div>}>
        <StudentLessonModal
          lesson={selectedLesson}
          isOpen={isLessonModalOpen}
          onClose={() => {
            setIsLessonModalOpen(false);
            setSelectedLesson(null);
          }}
          onComplete={handleLessonComplete}
          hasNext={false} // سيتم تحديثه لاحقاً
          hasPrevious={false} // سيتم تحديثه لاحقاً
        />
      </Suspense>
    </div>
  );
};

export default Grade11StudentContentViewer;