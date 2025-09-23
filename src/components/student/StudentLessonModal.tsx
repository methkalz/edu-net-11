import React, { useState, useCallback, useEffect } from 'react';
import { X, Clock, BookOpen, Star, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Grade11LessonWithMedia } from '@/hooks/useGrade11Content';
import Grade11LessonContentDisplay from '../content/Grade11LessonContentDisplay';
import { useErrorHandler } from '@/lib/error-handling/hooks/use-error-handler';

interface StudentLessonModalProps {
  lesson: Grade11LessonWithMedia | null;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  onComplete?: (lessonId: string, timeSpent: number) => void;
}

const StudentLessonModal: React.FC<StudentLessonModalProps> = ({
  lesson,
  isOpen,
  onClose,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
  onComplete
}) => {
  const [startTime, setStartTime] = useState<number>(0);
  const [readingProgress, setReadingProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { handleError } = useErrorHandler();

  // تتبع وقت البداية
  useEffect(() => {
    if (isOpen && lesson) {
      setStartTime(Date.now());
      setReadingProgress(0);
    }
  }, [isOpen, lesson]);

  // تتبع تقدم القراءة
  const handleScroll = useCallback((scrollTop: number, scrollHeight: number, clientHeight: number) => {
    const progress = Math.min(100, Math.max(0, (scrollTop / (scrollHeight - clientHeight)) * 100));
    setReadingProgress(progress);
  }, []);

  // إنهاء الدرس
  const handleCompleteLesson = useCallback(async () => {
    if (!lesson || !onComplete) return;
    
    try {
      const timeSpent = Date.now() - startTime;
      await onComplete(lesson.id, timeSpent);
      onClose();
    } catch (error) {
      handleError(error, { context: 'completing_lesson', lessonId: lesson.id });
    }
  }, [lesson, onComplete, startTime, onClose, handleError]);

  // إدارة الـ fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  if (!lesson) return null;

  const timeSpent = Math.floor((Date.now() - startTime) / 1000 / 60); // بالدقائق
  const hasContent = lesson.content && lesson.content.trim().length > 0;
  const hasMedia = lesson.media && lesson.media.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${
        isFullscreen ? 'max-w-[100vw] h-[100vh] w-full' : 'max-w-6xl h-[95vh]'
      } p-0 gap-0 flex flex-col bg-white`}>
        
        {/* Header مينيماليست */}
        <div className="flex-shrink-0 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
          <div className="flex items-center justify-between p-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <Badge variant="outline" className="text-base px-3 py-1">
                  الدرس {lesson.order_index}
                </Badge>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-5 w-5" />
                  <span className="text-base">15 دقيقة تقريباً</span>
                </div>
                {timeSpent > 0 && (
                  <div className="flex items-center gap-2 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium">{timeSpent} دقيقة</span>
                  </div>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                {lesson.title}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="lg"
                onClick={toggleFullscreen}
                className="h-12 w-12 rounded-full hover:bg-gray-100"
              >
                <Maximize2 className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={onClose}
                className="h-12 w-12 rounded-full hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>

          {/* شريط التقدم */}
          <div className="px-6 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">تقدم القراءة</span>
              <span className="text-sm font-bold text-blue-600">{Math.round(readingProgress)}%</span>
            </div>
            <Progress value={readingProgress} className="h-2" />
          </div>
        </div>

        {/* المحتوى الرئيسي */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="max-w-4xl mx-auto p-8 space-y-8">
              {/* المحتوى النصي */}
              {hasContent && (
                <div className="bg-white rounded-2xl border border-gray-200 p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">محتوى الدرس</h2>
                  </div>
                  <div className="prose prose-xl max-w-none text-gray-800 leading-relaxed">
                    <div className="text-xl leading-9 whitespace-pre-wrap break-words">
                      {lesson.content}
                    </div>
                  </div>
                </div>
              )}

              {/* الوسائط التعليمية */}
              {hasMedia && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Star className="h-6 w-6 text-purple-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">الوسائط التعليمية</h2>
                  </div>
                  
                  <Grade11LessonContentDisplay 
                    lesson={lesson}
                    defaultExpanded={true}
                    showControls={false}
                    hideHeader={true}
                  />
                </div>
              )}

              {/* حالة فارغة */}
              {!hasContent && !hasMedia && (
                <div className="text-center py-16">
                  <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                    <BookOpen className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-700 mb-3">الدرس قيد التطوير</h3>
                  <p className="text-xl text-gray-500">سيتم إضافة المحتوى قريباً</p>
                </div>
              )}

              {/* مساحة إضافية في النهاية */}
              <div className="h-16" />
            </div>
          </ScrollArea>
        </div>

        {/* Footer للتنقل */}
        <div className="flex-shrink-0 bg-gray-50 border-t border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {hasPrevious && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={onPrevious}
                  className="h-12 px-6 text-base"
                >
                  <ChevronLeft className="h-5 w-5 ml-2" />
                  الدرس السابق
                </Button>
              )}
            </div>

            <div className="flex items-center gap-4">
              {onComplete && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleCompleteLesson}
                  className="h-12 px-6 text-base border-green-200 text-green-700 hover:bg-green-50"
                >
                  ✓ أكملت الدرس
                </Button>
              )}
              
              {hasNext && (
                <Button
                  size="lg"
                  onClick={onNext}
                  className="h-12 px-6 text-base bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  الدرس التالي
                  <ChevronRight className="h-5 w-5 mr-2" />
                </Button>
              )}

              {!hasNext && (
                <Button
                  size="lg"
                  onClick={onClose}
                  className="h-12 px-6 text-base"
                >
                  إنهاء
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentLessonModal;