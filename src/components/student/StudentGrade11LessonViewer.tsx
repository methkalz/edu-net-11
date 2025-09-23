import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  FileText, 
  Image, 
  Code, 
  Clock, 
  CheckCircle, 
  Star,
  PlayCircle,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import type { StudentGrade11Lesson, StudentGrade11LessonMedia } from '@/hooks/useStudentGrade11Content';

interface StudentGrade11LessonViewerProps {
  lesson: StudentGrade11Lesson | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (lessonId: string, timeSpent: number) => void;
  onProgressUpdate?: (lessonId: string, progress: number, timeSpent: number) => void;
}

export const StudentGrade11LessonViewer: React.FC<StudentGrade11LessonViewerProps> = ({
  lesson,
  isOpen,
  onClose,
  onComplete,
  onProgressUpdate
}) => {
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (isOpen && lesson) {
      setStartTime(Date.now());
      setCurrentProgress(lesson.progress?.progress_percentage || 0);
      setCurrentMediaIndex(0);
      setHasInteracted(false);
    }
  }, [isOpen, lesson]);

  if (!lesson) return null;

  const timeSpent = Math.floor((Date.now() - startTime) / 1000);
  const isCompleted = currentProgress >= 100;
  
  const handleMarkComplete = () => {
    if (!hasInteracted) {
      toast.error('يجب التفاعل مع محتوى الدرس أولاً');
      return;
    }

    setCurrentProgress(100);
    onComplete?.(lesson.id, timeSpent);
  };

  const handleProgressUpdate = (progress: number) => {
    setCurrentProgress(progress);
    onProgressUpdate?.(lesson.id, progress, timeSpent);
  };

  const handleMediaInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      const newProgress = Math.max(25, currentProgress);
      handleProgressUpdate(newProgress);
    }
  };

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'video':
        return <PlayCircle className="h-5 w-5" />;
      case 'lottie':
        return <Play className="h-5 w-5" />;
      case 'image':
        return <Image className="h-5 w-5" />;
      case 'code':
        return <Code className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getMediaTypeLabel = (mediaType: string) => {
    switch (mediaType) {
      case 'video':
        return 'فيديو';
      case 'lottie':
        return 'رسوم متحركة';
      case 'image':
        return 'صورة';
      case 'code':
        return 'كود';
      default:
        return 'ملف';
    }
  };

  const currentMedia = lesson.media?.[currentMediaIndex];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <span>{lesson.title}</span>
            </div>
            <div className="flex items-center gap-2">
              {isCompleted && (
                <Badge className="bg-green-100 text-green-800 border-green-300">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  مكتمل
                </Badge>
              )}
              {lesson.progress?.points_earned && (
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  <Star className="h-3 w-3 mr-1" />
                  {lesson.progress.points_earned} نقطة
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">التقدم</span>
              <span className="font-medium">{currentProgress}%</span>
            </div>
            <Progress value={currentProgress} className="h-2" />
          </div>

          {/* Content Area */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
            {/* Main Content */}
            <div className="lg:col-span-2 flex flex-col min-h-0">
              {lesson.media && lesson.media.length > 0 ? (
                <Tabs defaultValue="media" className="flex-1 flex flex-col">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="media" className="flex items-center gap-2">
                      {getMediaIcon(currentMedia?.media_type || 'video')}
                      الوسائط ({lesson.media.length})
                    </TabsTrigger>
                    <TabsTrigger value="content" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      المحتوى
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="media" className="flex-1 flex flex-col mt-4">
                    {currentMedia && (
                      <div className="flex-1 flex flex-col">
                        {/* Media Navigation */}
                        {lesson.media.length > 1 && (
                          <div className="flex items-center justify-between mb-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentMediaIndex(Math.max(0, currentMediaIndex - 1))}
                              disabled={currentMediaIndex === 0}
                            >
                              <ChevronRight className="h-4 w-4 mr-1" />
                              السابق
                            </Button>
                            
                            <span className="text-sm text-muted-foreground">
                              {currentMediaIndex + 1} من {lesson.media.length}
                            </span>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentMediaIndex(Math.min(lesson.media.length - 1, currentMediaIndex + 1))}
                              disabled={currentMediaIndex === lesson.media.length - 1}
                            >
                              التالي
                              <ChevronLeft className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        )}

                        {/* Media Display */}
                        <Card className="flex-1 overflow-hidden">
                          <CardContent className="p-0 h-full">
                            <div 
                              className="w-full h-full min-h-[300px] bg-muted/30 flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={handleMediaInteraction}
                            >
                              {currentMedia.media_type === 'video' ? (
                                <div className="text-center">
                                  <PlayCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                                  <p className="text-muted-foreground">انقر لتشغيل الفيديو</p>
                                  <p className="text-sm text-muted-foreground mt-2">{currentMedia.file_name}</p>
                                </div>
                              ) : currentMedia.media_type === 'image' ? (
                                <div className="text-center">
                                  <Image className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                                  <p className="text-muted-foreground">انقر لعرض الصورة</p>
                                  <p className="text-sm text-muted-foreground mt-2">{currentMedia.file_name}</p>
                                </div>
                              ) : currentMedia.media_type === 'code' ? (
                                <div className="text-center">
                                  <Code className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                                  <p className="text-muted-foreground">انقر لعرض الكود</p>
                                  <p className="text-sm text-muted-foreground mt-2">{currentMedia.file_name}</p>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <Play className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                                  <p className="text-muted-foreground">انقر لعرض المحتوى</p>
                                  <p className="text-sm text-muted-foreground mt-2">{currentMedia.file_name}</p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Media Info */}
                        <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getMediaIcon(currentMedia.media_type)}
                              <span className="font-medium">{getMediaTypeLabel(currentMedia.media_type)}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">{currentMedia.file_name}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="content" className="flex-1 mt-4">
                    <Card className="h-full">
                      <CardContent className="p-6">
                        {lesson.content ? (
                          <div 
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: lesson.content }}
                          />
                        ) : (
                          <div className="text-center text-muted-foreground py-8">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>لا يوجد محتوى نصي متاح لهذا الدرس</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              ) : (
                // Content only (no media)
                <Card className="flex-1">
                  <CardContent className="p-6 h-full overflow-auto">
                    {lesson.content ? (
                      <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: lesson.content }}
                        onClick={handleMediaInteraction}
                      />
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>لا يوجد محتوى متاح لهذا الدرس</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Lesson Info */}
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>المدة المقدرة: {lesson.estimated_duration} دقيقة</span>
                    </div>
                    
                    {lesson.media && lesson.media.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>{lesson.media.length} عنصر وسائط</span>
                      </div>
                    )}

                    {timeSpent > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>الوقت المنقضي: {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Media List */}
              {lesson.media && lesson.media.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-3">عناصر الوسائط</h4>
                    <div className="space-y-2">
                      {lesson.media.map((media, index) => (
                        <div
                          key={media.id}
                          onClick={() => setCurrentMediaIndex(index)}
                          className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                            index === currentMediaIndex
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          {getMediaIcon(media.media_type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {getMediaTypeLabel(media.media_type)}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {media.file_name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                {!isCompleted && (
                  <Button
                    onClick={handleMarkComplete}
                    disabled={!hasInteracted}
                    className="w-full"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    إكمال الدرس
                  </Button>
                )}
                
                <Button variant="outline" onClick={onClose} className="w-full">
                  <X className="h-4 w-4 mr-2" />
                  إغلاق
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};