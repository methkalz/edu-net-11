import React from 'react';
import { X, BookOpen, Play, FileText, Image, Video, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { Grade11TopicWithLessons } from '@/hooks/useGrade11Content';
import Grade11LessonContentDisplay from './Grade11LessonContentDisplay';

interface Grade11TopicModalProps {
  topic: Grade11TopicWithLessons | null;
  isOpen: boolean;
  onClose: () => void;
}

const Grade11TopicModal: React.FC<Grade11TopicModalProps> = ({ topic, isOpen, onClose }) => {
  if (!topic) return null;

  const totalMedia = topic.lessons.reduce((sum, lesson) => sum + (lesson.media?.length || 0), 0);

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'lottie':
        return <Play className="h-4 w-4" />;
      case 'image':
        return <Image className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold text-foreground mb-2 pr-8">
                {topic.title}
              </DialogTitle>
              {topic.content && (
                <p className="text-muted-foreground leading-relaxed">
                  {topic.content}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute left-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-4 mt-4">
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              <BookOpen className="h-3 w-3 mr-1" />
              {topic.lessons.length} درس
            </Badge>
            {totalMedia > 0 && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                <Play className="h-3 w-3 mr-1" />
                {totalMedia} وسائط
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              {format(new Date(topic.created_at), 'dd/MM/yyyy')}
            </Badge>
          </div>
        </DialogHeader>

        {/* Content */}
        <ScrollArea className="flex-1 p-6">
          {topic.lessons.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">لا توجد دروس</h3>
              <p className="text-muted-foreground">لم يتم إضافة أي دروس لهذا الموضوع حتى الآن</p>
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-4">دروس الموضوع</h3>
              
              {topic.lessons.map((lesson, index) => (
                <Card key={lesson.id} className="border-l-4 border-l-blue-400 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base font-semibold">
                        {index + 1}. {lesson.title}
                      </CardTitle>
                      {lesson.media && lesson.media.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {lesson.media.length} ملف
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <Grade11LessonContentDisplay 
                      lesson={lesson}
                      defaultExpanded={false}
                      showControls={true}
                    />
                    
                    {/* Media preview */}
                    {lesson.media && lesson.media.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h5 className="text-sm font-medium mb-2 text-muted-foreground">الوسائط المرفقة:</h5>
                        <div className="flex flex-wrap gap-2">
                          {lesson.media.map((media) => (
                            <Badge 
                              key={media.id} 
                              variant="secondary" 
                              className="text-xs flex items-center gap-1"
                            >
                              {getMediaIcon(media.media_type)}
                              {media.file_name || media.media_type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                      تاريخ الإنشاء: {format(new Date(lesson.created_at), 'dd/MM/yyyy')}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default Grade11TopicModal;