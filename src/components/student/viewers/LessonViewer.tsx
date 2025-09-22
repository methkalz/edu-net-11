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

  useEffect(() => {
    if (isOpen && !hasStarted) {
      setHasStarted(true);
      toast.info('بدأت دراسة الدرس', {
        description: 'ستحصل على النقاط عند إكمال الدراسة'
      });
    }
  }, [isOpen, hasStarted]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setStudyTime(prev => {
        const newTime = prev + 1;
        
        // Calculate progress based on study time, section progress, and scroll
        const timeProgress = Math.min((newTime / 60) * 100, 100); // 1 minute minimum
        const sectionProgress = ((currentSection + 1) / sections.length) * 100;
        const combinedProgress = Math.max(timeProgress, sectionProgress, scrollProgress);
        
        setProgress(combinedProgress);
        onProgress(combinedProgress, newTime);

        // Mark as complete if studied for enough time and viewed all sections
        if (combinedProgress >= 90 && !isCompleted) {
          setIsCompleted(true);
          onComplete();
          toast.success('تم إكمال دراسة الدرس بنجاح!', {
            description: 'تم إضافة النقاط إلى رصيدك'
          });
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, currentSection, sections.length, scrollProgress, onProgress, onComplete, isCompleted]);

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