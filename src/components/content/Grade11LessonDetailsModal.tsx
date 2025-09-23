import React from 'react';
import { X, PlayCircle, FileText, Image, Video, Clock, Calendar, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Grade11LessonWithMedia } from '@/hooks/useGrade11Content';
import Grade11LessonContentDisplay from './Grade11LessonContentDisplay';

interface Grade11LessonDetailsModalProps {
  lesson: Grade11LessonWithMedia | null;
  isOpen: boolean;
  onClose: () => void;
}

const Grade11LessonDetailsModal: React.FC<Grade11LessonDetailsModalProps> = ({ lesson, isOpen, onClose }) => {
  if (!lesson) return null;

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[85vh] p-0 gap-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 bg-muted/30 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-8">
              <DialogTitle className="text-2xl font-bold text-foreground mb-3">
                {lesson.title}
              </DialogTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>15 دقيقة</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(lesson.created_at), 'dd/MM/yyyy')}</span>
                </div>
                {lesson.media && lesson.media.length > 0 && (
                  <Badge variant="secondary" className="bg-muted text-muted-foreground">
                    {lesson.media.length} ملف مرفق
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <Tabs defaultValue="content" className="h-full flex flex-col">
            <div className="px-6 pt-4 pb-2 border-b bg-background">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content">محتوى الدرس</TabsTrigger>
                <TabsTrigger value="media">الوسائط المرفقة</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
              <TabsContent value="content" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <ScrollArea className="flex-1 px-6 py-4">
                  <div className="space-y-6 max-w-none">
                    {/* Lesson Content */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">محتوى الدرس</CardTitle>
                      </CardHeader>
                      <CardContent className="prose prose-sm max-w-none break-words">
                        <div className="text-sm leading-relaxed break-words max-w-full overflow-wrap-anywhere">
                          <Grade11LessonContentDisplay 
                            lesson={lesson}
                          defaultExpanded={true}
                            showControls={false}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Additional Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">معلومات إضافية</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2">تاريخ الإنشاء</h4>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(lesson.created_at), 'dd MMMM yyyy')}
                            </p>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">آخر تحديث</h4>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(lesson.updated_at), 'dd MMMM yyyy')}
                            </p>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">ترتيب الدرس</h4>
                            <p className="text-sm text-muted-foreground">
                              الدرس رقم {lesson.order_index}
                            </p>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">الوسائط المرفقة</h4>
                            <p className="text-sm text-muted-foreground">
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
                <ScrollArea className="flex-1 px-6 py-4">
                  <div className="space-y-4">
                    {!lesson.media || lesson.media.length === 0 ? (
                      <Card className="text-center p-12">
                        <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">لا توجد وسائط مرفقة</h3>
                        <p className="text-muted-foreground">لم يتم إرفاق أي ملفات بهذا الدرس</p>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {lesson.media.map((media, index) => (
                          <Card key={media.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-muted rounded-lg">
                                  {getMediaIcon(media.media_type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm mb-1 truncate">
                                    {media.file_name || `${getMediaTypeLabel(media.media_type)} ${index + 1}`}
                                  </h4>
                                  <p className="text-xs text-muted-foreground mb-2">
                                    نوع الملف: {getMediaTypeLabel(media.media_type)}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">
                                      {media.media_type}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {format(new Date(media.created_at), 'dd/MM/yyyy')}
                                    </span>
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>

                              {/* Media Preview */}
                              <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                                <p className="text-xs text-muted-foreground mb-2">معاينة:</p>
                                {media.media_type === 'video' && (
                                  <div className="aspect-video bg-black rounded flex items-center justify-center">
                                    <PlayCircle className="h-12 w-12 text-white opacity-70" />
                                  </div>
                                )}
                                {media.media_type === 'image' && (
                                  <div className="aspect-video bg-gray-100 rounded flex items-center justify-center">
                                    <Image className="h-8 w-8 text-gray-400" />
                                  </div>
                                )}
                                {media.media_type === 'lottie' && (
                                  <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 rounded flex items-center justify-center">
                                    <PlayCircle className="h-8 w-8 text-purple-500" />
                                  </div>
                                )}
                                {media.media_type === 'code' && (
                                  <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs">
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Grade11LessonDetailsModal;