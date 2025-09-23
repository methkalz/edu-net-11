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
      <DialogContent className="max-w-5xl h-[90vh] p-0 gap-0 flex flex-col bg-background">
        {/* Header - Minimalist */}
        <div className="flex items-center justify-between p-8 pb-6 border-b border-border/50">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground mb-3 leading-tight">
              {lesson.title}
            </h1>
            <div className="flex items-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span className="text-base">15 دقيقة تقريباً</span>
              </div>
              {lesson.media && lesson.media.length > 0 && (
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <span className="text-base">{lesson.media.length} وسيطة مرفقة</span>
                </div>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="lg"
            onClick={onClose}
            className="h-12 w-12 rounded-full hover:bg-muted"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Content - Clean and Spacious */}
        <ScrollArea className="flex-1 px-8 py-6">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Lesson Text Content */}
            {lesson.content && (
              <div className="bg-background rounded-2xl border border-border/50 p-8">
                <div className="prose prose-lg max-w-none text-foreground leading-8">
                  <div className="text-lg text-foreground leading-8 whitespace-pre-wrap break-words">
                    {lesson.content}
                  </div>
                </div>
              </div>
            )}

            {/* Media Content */}
            {lesson.media && lesson.media.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-foreground">الوسائط التعليمية</h2>
                <div className="space-y-6">
                  <Grade11LessonContentDisplay 
                    lesson={lesson}
                    defaultExpanded={true}
                    showControls={false}
                    hideHeader={true}
                  />
                </div>
              </div>
            )}

            {/* Empty State */}
            {(!lesson.content || lesson.content.trim() === '') && (!lesson.media || lesson.media.length === 0) && (
              <div className="text-center py-16">
                <div className="bg-muted/50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">الدرس فارغ</h3>
                <p className="text-lg text-muted-foreground">لم يتم إضافة محتوى لهذا الدرس بعد</p>
              </div>
            )}

            {/* Minimal Footer Info */}
            <div className="pt-8 border-t border-border/50">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>تاريخ الإنشاء: {format(new Date(lesson.created_at), 'dd MMMM yyyy')}</span>
                <span>الدرس رقم {lesson.order_index}</span>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default Grade11LessonDetailsModal;