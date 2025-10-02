import React from 'react';
import { X, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Grade11LessonWithMedia } from '@/hooks/useGrade11Content';
import Grade11LessonContentDisplay from './Grade11LessonContentDisplay';

interface LessonPreviewModalProps {
  lesson: Grade11LessonWithMedia | null;
  isOpen: boolean;
  onClose: () => void;
}

const LessonPreviewModal: React.FC<LessonPreviewModalProps> = ({
  lesson,
  isOpen,
  onClose,
}) => {
  if (!lesson) return null;

  const mediaCount = lesson.media?.length || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-blue-600" />
              <DialogTitle className="text-lg font-semibold">معاينة الدرس</DialogTitle>
              <Badge variant="outline" className="text-xs">
                وضع العرض للطلاب
              </Badge>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Lesson Header */}
          <div className="bg-gradient-to-r from-blue-50/50 to-transparent p-6 rounded-lg border border-blue-200/50">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground mb-3">{lesson.title}</h1>
              {mediaCount > 0 && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  {mediaCount} وسائط تعليمية
                </Badge>
              )}
            </div>
          </div>

          {/* Lesson Content */}
          <div className="bg-card rounded-lg border border-border p-4">
            <Grade11LessonContentDisplay 
              lesson={lesson}
              hideTitle={true}
            />
          </div>

          {/* Preview Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800 text-center">
              <Eye className="h-4 w-4 inline ml-1" />
              هذه معاينة لكيفية ظهور الدرس للطلاب
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LessonPreviewModal;