import React from 'react';
import { X, BookOpen, Clock, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Grade11LessonWithMedia } from '@/hooks/useGrade11Content';
import Grade11LessonContentDisplay from './Grade11LessonContentDisplay';

interface Grade11LessonDetailsModalProps {
  lesson: Grade11LessonWithMedia | null;
  isOpen: boolean;
  onClose: () => void;
}

const Grade11LessonDetailsModal: React.FC<Grade11LessonDetailsModalProps> = ({ lesson, isOpen, onClose }) => {
  if (!lesson) {
    console.log('❌ No lesson provided to modal');
    return null;
  }

  console.log('✅ Modal opening for lesson:', lesson.title, lesson);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 gap-0 flex flex-col bg-background">
        {/* Minimalist Header */}
        <DialogHeader className="p-8 pb-6 border-b bg-background">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-bold text-foreground leading-tight">
                    {lesson.title}
                  </DialogTitle>
                  <div className="flex items-center gap-6 mt-3 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      <span className="text-lg">15 دقيقة</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      <span className="text-lg">{format(new Date(lesson.created_at), 'dd/MM/yyyy')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="lg"
              onClick={onClose}
              className="h-12 w-12 rounded-full bg-muted/50 hover:bg-muted transition-colors"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </DialogHeader>

        {/* Content Area */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-8 space-y-8">
              {/* Main Lesson Content */}
              <div className="bg-card rounded-2xl border-2 p-8">
                <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                  <BookOpen className="h-6 w-6 text-primary" />
                  محتوى الدرس
                </h3>
                
                <div className="prose prose-lg max-w-none">
                  <Grade11LessonContentDisplay 
                    lesson={lesson}
                    defaultExpanded={true}
                    showControls={true}
                    hideHeader={true}
                  />
                </div>
              </div>

              {/* Lesson Text Content */}
              {lesson.content && (
                <div className="bg-muted/30 rounded-2xl border p-8">
                  <h4 className="text-xl font-bold text-foreground mb-4">النص الأساسي</h4>
                  <div className="text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    {lesson.content}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Grade11LessonDetailsModal;