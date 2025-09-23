import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, X, CheckCircle, Play, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface LessonViewerProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: {
    id: string;
    title: string;
    description?: string;
    content?: string;
    video_url?: string;
    duration?: number;
    topic?: {
      id: string;
      title: string;
      section?: {
        id: string;
        title: string;
      };
    };
    media?: Array<{
      id: string;
      media_type: string;
      media_url: string;
      media_title: string;
      order_index: number;
    }>;
  };
  onProgress: (progress: number, studyTime: number) => void;
  onComplete: () => void;
}

export const LessonViewer: React.FC<LessonViewerProps> = ({ 
  isOpen, 
  onClose, 
  lesson, 
  onProgress,
  onComplete 
}) => {
  const [studyTime, setStudyTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Split lesson content into sections if available
  const sections = lesson.content 
    ? lesson.content.split('\n\n').filter(section => section.trim())
    : ['المحتوى غير متوفر'];

  // النظام المبسط: 5 ثوان = مكتمل + نقاط
  useEffect(() => {
    if (isOpen && !hasStarted) {
      setHasStarted(true);
      toast("بدء الدراسة", {
        description: "سيتم احتساب الدرس كمكتمل خلال 5 ثوانٍ",
        duration: 2000,
      });
      
      // 5 ثوانٍ = درس مكتمل + نقاط
      const completionTimer = setTimeout(() => {
        if (!isCompleted) {
          setProgress(100);
          setIsCompleted(true);
          onProgress(100, 5);
          onComplete();
          toast("تم إكمال الدرس!", {
            description: "أحسنت! لقد أكملت دراسة الدرس بنجاح",
            duration: 3000,
          });
        }
      }, 5000); // 5 ثوانٍ فقط

      return () => clearTimeout(completionTimer);
    }
  }, [isOpen, hasStarted, isCompleted, onProgress, onComplete]);

  const handleScroll = (scrollTop: number, scrollHeight: number, clientHeight: number) => {
    const maxScroll = scrollHeight - clientHeight;
    if (maxScroll > 0) {
      const scrollPercent = (scrollTop / maxScroll) * 100;
      setScrollProgress(Math.min(scrollPercent, 100));
    }
  };

  const handleClose = () => {
    // Save final progress before closing
    if (progress > 0) {
      onProgress(progress, studyTime);
    }
    onClose();
  };

  const nextSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(prev => prev + 1);
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                {lesson.title}
              </DialogTitle>
              {lesson.description && (
                <p className="text-sm text-muted-foreground">{lesson.description}</p>
              )}
              {lesson.topic && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {lesson.topic.section && (
                    <>
                      <span>{lesson.topic.section.title}</span>
                      <span>•</span>
                    </>
                  )}
                  <span>{lesson.topic.title}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isCompleted && (
                <Badge className="bg-green-100 text-green-800 border-green-300">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  مكتمل
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          {/* Video if available */}
          {lesson.video_url && (
            <div className="bg-black rounded-lg overflow-hidden">
              <iframe
                src={lesson.video_url}
                className="w-full aspect-video"
                allowFullScreen
                title={lesson.title}
              />
            </div>
          )}

          {/* Media Gallery */}
          {lesson.media && lesson.media.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">الوسائط المرفقة</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lesson.media
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((media) => (
                      <div key={media.id} className="border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          {media.media_type === 'video' && <Play className="w-4 h-4 text-blue-500" />}
                          {media.media_type === 'image' && <BookOpen className="w-4 h-4 text-green-500" />}
                          <span className="font-medium text-sm">{media.media_title}</span>
                        </div>
                        {media.media_type === 'video' && (
                          <div className="bg-black rounded overflow-hidden">
                            <iframe
                              src={media.media_url}
                              className="w-full aspect-video"
                              allowFullScreen
                              title={media.media_title}
                            />
                          </div>
                        )}
                        {media.media_type === 'image' && (
                          <img
                            src={media.media_url}
                            alt={media.media_title}
                            className="w-full rounded border"
                          />
                        )}
                        {media.media_type === 'document' && (
                          <div className="text-center p-4 bg-muted rounded">
                            <Button variant="outline" size="sm" asChild>
                              <a href={media.media_url} target="_blank" rel="noopener noreferrer">
                                عرض المستند
                              </a>
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lesson Content */}
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold">محتوى الدرس</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    القسم {currentSection + 1} من {sections.length}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={prevSection}
                      disabled={currentSection === 0}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={nextSection}
                      disabled={currentSection === sections.length - 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <ScrollArea 
                className="h-[40vh] p-6"
                onScrollCapture={(e) => {
                  const target = e.target as HTMLElement;
                  handleScroll(target.scrollTop, target.scrollHeight, target.clientHeight);
                }}
              >
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="whitespace-pre-wrap">
                    {sections[currentSection]}
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Progress Indicators */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">تقدم الدراسة</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">وقت الدراسة</span>
                <span className="font-medium">
                  {Math.floor(studyTime / 60)}:{(studyTime % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <Progress value={Math.min((studyTime / 60) * 100, 100)} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">الأقسام</span>
                <span className="font-medium">{currentSection + 1}/{sections.length}</span>
              </div>
              <Progress value={((currentSection + 1) / sections.length) * 100} className="h-2" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={prevSection}
                disabled={currentSection === 0}
              >
                <ChevronRight className="w-4 h-4 mr-2" />
                السابق
              </Button>
              <Button
                variant="outline"
                onClick={nextSection}
                disabled={currentSection === sections.length - 1}
              >
                التالي
                <ChevronLeft className="w-4 h-4 ml-2" />
              </Button>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose}>
                إغلاق
              </Button>
              {isCompleted && (
                <Button className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  مكتمل
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};