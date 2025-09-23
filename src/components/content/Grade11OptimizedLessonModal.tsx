import React, { useState, useEffect } from 'react';
import { X, PlayCircle, FileText, Image, Video, Clock, Calendar, Download, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Grade11Lesson, Grade11LessonMedia } from '@/hooks/useGrade11Content';
import Grade11LessonContentDisplay from './Grade11LessonContentDisplay';

interface Grade11OptimizedLessonModalProps {
  lessonId: string | null;
  isOpen: boolean;
  onClose: () => void;
  loadFullLesson: (lessonId: string) => Promise<(Grade11Lesson & { media: Grade11LessonMedia[] }) | null>;
}

const Grade11OptimizedLessonModal: React.FC<Grade11OptimizedLessonModalProps> = ({ 
  lessonId, 
  isOpen, 
  onClose,
  loadFullLesson 
}) => {
  const [lesson, setLesson] = useState<(Grade11Lesson & { media: Grade11LessonMedia[] }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load lesson data when modal opens
  useEffect(() => {
    if (isOpen && lessonId) {
      const loadLesson = async () => {
        setLoading(true);
        setError(null);
        try {
          const lessonData = await loadFullLesson(lessonId);
          setLesson(lessonData);
        } catch (err: any) {
          setError(err.message || 'حدث خطأ في تحميل بيانات الدرس');
        } finally {
          setLoading(false);
        }
      };
      
      loadLesson();
    } else if (!isOpen) {
      // Clear lesson data when modal closes to free memory
      setLesson(null);
      setError(null);
    }
  }, [isOpen, lessonId, loadFullLesson]);

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'video':
        return <Video className="h-5 w-5 text-red-500" />;
      case 'lottie':
        return <PlayCircle className="h-5 w-5 text-purple-500" />;
      case 'image':
        return <Image className="h-5 w-5 text-blue-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
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

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 gap-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="p-8 pb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-8">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-3/4" />
                  <div className="flex gap-4">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
              ) : lesson ? (
                <>
                  <DialogTitle className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
                    {lesson.title}
                  </DialogTitle>
                  <div className="flex items-center gap-6 text-base text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      <span>15 دقيقة</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      <span>{format(new Date(lesson.created_at), 'dd/MM/yyyy')}</span>
                    </div>
                    {lesson.media && lesson.media.length > 0 && (
                      <Badge variant="secondary" className="bg-white/70 text-gray-700 text-sm px-3 py-1">
                        {lesson.media.length} ملف مرفق
                      </Badge>
                    )}
                  </div>
                </>
              ) : (
                <DialogTitle className="text-3xl font-bold text-gray-900">
                  تحميل الدرس...
                </DialogTitle>
              )}
            </div>
            <Button
              variant="ghost"
              size="lg"
              onClick={onClose}
              className="rounded-lg opacity-70 hover:opacity-100 hover:bg-white/50 p-2"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
                <p className="text-lg text-gray-600">جاري تحميل محتوى الدرس...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4 p-8">
                <FileText className="h-16 w-16 text-red-300 mx-auto" />
                <h3 className="text-xl font-semibold text-red-700">خطأ في التحميل</h3>
                <p className="text-gray-600">{error}</p>
                <Button onClick={() => window.location.reload()} variant="outline">
                  إعادة المحاولة
                </Button>
              </div>
            </div>
          ) : lesson ? (
            <Tabs defaultValue="content" className="h-full flex flex-col">
              <div className="px-8 pt-6 pb-4 border-b bg-background">
                <TabsList className="grid w-full grid-cols-2 h-12 text-base">
                  <TabsTrigger value="content" className="text-base">محتوى الدرس</TabsTrigger>
                  <TabsTrigger value="media" className="text-base">الوسائط المرفقة</TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden">
                <TabsContent value="content" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                  <ScrollArea className="flex-1 px-8 py-6">
                    <div className="space-y-8 max-w-none">
                      {/* Lesson Content */}
                      <Card className="border-2 border-blue-100">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-xl text-gray-900">محتوى الدرس</CardTitle>
                        </CardHeader>
                        <CardContent className="prose prose-lg max-w-none">
                          <div className="text-lg leading-relaxed text-gray-800 break-words max-w-full">
                            <Grade11LessonContentDisplay 
                              lesson={lesson}
                              defaultExpanded={true}
                              showControls={false}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Additional Information */}
                      <Card className="border-2 border-gray-100">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-xl text-gray-900">معلومات إضافية</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-lg text-gray-700">تاريخ الإنشاء</h4>
                              <p className="text-base text-gray-600">
                                {format(new Date(lesson.created_at), 'dd MMMM yyyy')}
                              </p>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-semibold text-lg text-gray-700">آخر تحديث</h4>
                              <p className="text-base text-gray-600">
                                {format(new Date(lesson.updated_at), 'dd MMMM yyyy')}
                              </p>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-semibold text-lg text-gray-700">ترتيب الدرس</h4>
                              <p className="text-base text-gray-600">
                                الدرس رقم {lesson.order_index}
                              </p>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-semibold text-lg text-gray-700">الوسائط المرفقة</h4>
                              <p className="text-base text-gray-600">
                                {lesson.media?.length || 0} ملف
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="media" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                  <ScrollArea className="flex-1 px-8 py-6">
                    <div className="space-y-6">
                      {!lesson.media || lesson.media.length === 0 ? (
                        <Card className="text-center p-16 border-2 border-dashed border-gray-200">
                          <FileText className="h-20 w-20 mx-auto mb-6 text-gray-300" />
                          <h3 className="text-2xl font-semibold mb-3 text-gray-700">لا توجد وسائط مرفقة</h3>
                          <p className="text-lg text-gray-500">لم يتم إرفاق أي ملفات بهذا الدرس</p>
                        </Card>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {lesson.media.map((media, index) => (
                            <Card key={media.id} className="hover:shadow-lg transition-shadow border-2 border-gray-100">
                              <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                  <div className="p-3 bg-gray-100 rounded-xl">
                                    {getMediaIcon(media.media_type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-base mb-2 truncate">
                                      {media.file_name || `${getMediaTypeLabel(media.media_type)} ${index + 1}`}
                                    </h4>
                                    <p className="text-sm text-gray-500 mb-3">
                                      نوع الملف: {getMediaTypeLabel(media.media_type)}
                                    </p>
                                    <div className="flex items-center gap-3">
                                      <Badge variant="outline" className="text-sm">
                                        {media.media_type}
                                      </Badge>
                                      <span className="text-sm text-gray-500">
                                        {format(new Date(media.created_at), 'dd/MM/yyyy')}
                                      </span>
                                    </div>
                                  </div>
                                  <Button variant="ghost" size="lg" className="p-3">
                                    <Download className="h-5 w-5" />
                                  </Button>
                                </div>

                                {/* Media Preview */}
                                <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                                  <p className="text-sm text-gray-600 mb-3 font-medium">معاينة:</p>
                                  {media.media_type === 'video' && (
                                    <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                                      <PlayCircle className="h-16 w-16 text-white opacity-70" />
                                    </div>
                                  )}
                                  {media.media_type === 'image' && (
                                    <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                                      <Image className="h-12 w-12 text-gray-400" />
                                    </div>
                                  )}
                                  {media.media_type === 'lottie' && (
                                    <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                                      <PlayCircle className="h-12 w-12 text-purple-500" />
                                    </div>
                                  )}
                                  {media.media_type === 'code' && (
                                    <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                                      &lt;/&gt; ملف كود
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </div>
            </Tabs>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Grade11OptimizedLessonModal;