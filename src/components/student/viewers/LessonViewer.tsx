import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, X, CheckCircle, Clock, Play, FileText, Image } from 'lucide-react';
import { toast } from 'sonner';
import type { StudentContentItem } from '@/hooks/useStudentContent';

interface LessonViewerProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: StudentContentItem;
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
        
        // Calculate progress based on study time (minimum 1 minute)
        const timeProgress = Math.min((newTime / 60) * 100, 100);
        
        setProgress(timeProgress);
        onProgress(timeProgress, newTime);

        // Mark as complete if studied for enough time
        if (timeProgress >= 90 && !isCompleted) {
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
  }, [isOpen, onProgress, onComplete, isCompleted]);

  const handleClose = () => {
    // Save final progress before closing
    if (progress > 0) {
      onProgress(progress, studyTime);
    }
    onClose();
  };

  // Helper function to render media content
  const renderMediaContent = () => {
    if (!lesson.media || !Array.isArray(lesson.media) || lesson.media.length === 0) {
      return null;
    }

    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">الوسائط المرفقة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lesson.media.map((media: any, index: number) => (
              <div key={media.id || index} className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  {media.media_type === 'video' && <Play className="w-4 h-4 text-blue-500" />}
                  {media.media_type === 'image' && <Image className="w-4 h-4 text-green-500" />}
                  {media.media_type === 'document' && <FileText className="w-4 h-4 text-purple-500" />}
                  <span className="font-medium text-sm">{media.file_name || `وسيطة ${index + 1}`}</span>
                </div>
                
                {media.media_type === 'video' && media.file_path && (
                  <div className="bg-black rounded overflow-hidden">
                    <iframe
                      src={media.file_path}
                      className="w-full aspect-video"
                      allowFullScreen
                      title={media.file_name || `فيديو ${index + 1}`}
                    />
                  </div>
                )}
                
                {media.media_type === 'image' && media.file_path && (
                  <img
                    src={media.file_path}
                    alt={media.file_name || `صورة ${index + 1}`}
                    className="w-full rounded border"
                  />
                )}
                
                {media.media_type === 'document' && media.file_path && (
                  <div className="text-center p-4 bg-muted rounded">
                    <Button variant="outline" size="sm" asChild>
                      <a href={media.file_path} target="_blank" rel="noopener noreferrer">
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
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                {lesson.title}
              </DialogTitle>
              {lesson.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{lesson.description}</p>
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

          {/* Progress Indicators */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">تقدم الدراسة</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  وقت الدراسة
                </span>
                <span className="font-medium">
                  {Math.floor(studyTime / 60)}:{(studyTime % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <Progress value={Math.min((studyTime / 60) * 100, 100)} className="h-2" />
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6">
          <ScrollArea className="max-h-[60vh]">
            {/* Video Content */}
            {lesson.video_url && (
              <div className="bg-black rounded-lg overflow-hidden mb-4">
                <iframe
                  src={lesson.video_url}
                  className="w-full aspect-video"
                  allowFullScreen
                  title={lesson.title}
                />
              </div>
            )}

            {/* Media Content */}
            {renderMediaContent()}

            {/* Text Content */}
            {lesson.content && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">محتوى الدرس</h3>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                      {lesson.content}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fallback if no content */}
            {!lesson.content && !lesson.video_url && (!lesson.media || lesson.media.length === 0) && (
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="space-y-2">
                    <BookOpen className="w-12 h-12 mx-auto text-muted-foreground" />
                    <h3 className="font-semibold">لا يوجد محتوى متاح</h3>
                    <p className="text-sm text-muted-foreground">محتوى هذا الدرس غير متوفر حالياً</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </ScrollArea>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 mt-4 border-t">
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
      </DialogContent>
    </Dialog>
  );
};