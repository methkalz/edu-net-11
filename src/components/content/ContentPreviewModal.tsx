import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlayCircle, FileText, ExternalLink, Clock, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface GradeContent {
  id: string;
  title: string;
  description?: string;
  type: 'video' | 'document';
  created_at: string;
  thumbnail_url?: string;
  duration?: string;
  file_type?: string;
  video_url?: string;
  file_path?: string;
  owner_user_id?: string;
  grade: string;
}

interface ContentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: GradeContent | null;
}

const ContentPreviewModal: React.FC<ContentPreviewModalProps> = ({
  isOpen,
  onClose,
  content
}) => {
  if (!content) return null;

  const handleOpenContent = () => {
    if (content.type === 'video' && content.video_url) {
      window.open(content.video_url, '_blank');
    } else if (content.type === 'document' && content.file_path) {
      // Open document preview or download
      window.open(content.file_path, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-3 text-xl">
            {content.type === 'video' ? (
              <PlayCircle className="h-6 w-6 text-primary" />
            ) : (
              <FileText className="h-6 w-6 text-primary" />
            )}
            {content.title}
          </DialogTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">
              {content.grade === 'grade10' ? 'الصف العاشر' : 
               content.grade === 'grade11' ? 'الصف الحادي عشر' : 
               'الصف الثاني عشر'}
            </Badge>
            <Badge variant="outline">
              {content.type === 'video' ? 'فيديو تعليمي' : 'ملف تعليمي'}
            </Badge>
            {content.duration && (
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                {content.duration}
              </Badge>
            )}
            {content.file_type && (
              <Badge variant="outline">
                {content.file_type.toUpperCase()}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview Area */}
          {content.type === 'video' && content.thumbnail_url && (
            <div className="relative rounded-lg overflow-hidden bg-muted">
              <img 
                src={content.thumbnail_url} 
                alt={content.title}
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <Button 
                  size="lg" 
                  onClick={handleOpenContent}
                  className="bg-white/90 text-black hover:bg-white"
                >
                  <PlayCircle className="h-6 w-6 mr-2" />
                  تشغيل الفيديو
                </Button>
              </div>
            </div>
          )}

          {/* Content Details */}
          <div className="space-y-4">
            {content.description && (
              <div>
                <h3 className="font-semibold mb-2">الوصف</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {content.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">تاريخ الإضافة:</span>
                <span>{format(new Date(content.created_at), 'dd MMMM yyyy', { locale: ar })}</span>
              </div>
              
              {content.type === 'video' && content.duration && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">المدة:</span>
                  <span>{content.duration}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={handleOpenContent} className="flex-1">
              <ExternalLink className="h-4 w-4 mr-2" />
              {content.type === 'video' ? 'مشاهدة الفيديو' : 'عرض الملف'}
            </Button>
            <Button variant="outline" onClick={onClose}>
              إغلاق
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContentPreviewModal;