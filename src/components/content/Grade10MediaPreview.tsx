import React, { useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Download, ExternalLink, FileText, Image as ImageIcon, Video, Code, Play } from 'lucide-react';
import { Grade10LessonMedia } from '@/hooks/useStudentGrade10Lessons';
import Lottie from 'lottie-react';

interface Grade10MediaPreviewProps {
  media: Grade10LessonMedia;
  onClose: () => void;
}

const Grade10MediaPreview: React.FC<Grade10MediaPreviewProps> = ({ media, onClose }) => {
  const lottieRef = useRef<any>(null);
  
  // Get speed setting for Lottie from metadata
  const speedSetting = media.metadata?.speed || 1;
  
  // Apply speed when it changes
  useEffect(() => {
    if (lottieRef.current && speedSetting !== undefined && media.media_type === 'lottie') {
      console.log('Applying speed to Grade 10 media preview:', speedSetting);
      lottieRef.current.setSpeed(speedSetting);
    }
  }, [speedSetting, media.media_type]);

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-5 h-5" />;
      case 'image': return <ImageIcon className="w-5 h-5" />;
      case 'code': return <Code className="w-5 h-5" />;
      case 'lottie': return <Play className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getMediaTypeBadge = (type: string) => {
    const typeMap = {
      video: { label: 'فيديو', color: 'bg-blue-100 text-blue-800' },
      image: { label: 'صورة', color: 'bg-green-100 text-green-800' },
      lottie: { label: 'لوتي', color: 'bg-purple-100 text-purple-800' },
      code: { label: 'كود', color: 'bg-orange-100 text-orange-800' }
    };
    
    const config = typeMap[type as keyof typeof typeMap] || { label: type, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <Badge className={`${config.color} text-xs`}>
        {config.label}
      </Badge>
    );
  };

  const renderMediaContent = () => {
    switch (media.media_type) {
      case 'video':
        if (media.file_path.includes('youtube.com') || media.file_path.includes('youtu.be')) {
          const videoId = media.file_path.includes('youtube.com') 
            ? media.file_path.split('v=')[1]?.split('&')[0]
            : media.file_path.split('youtu.be/')[1]?.split('?')[0];
          
          return (
            <div className="aspect-video rounded-lg overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title={media.file_name}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          );
        } else if (media.file_path.includes('drive.google.com')) {
          const fileId = media.file_path.match(/[-\w]{25,}/)?.[0];
          return (
            <div className="aspect-video rounded-lg overflow-hidden">
              <iframe
                src={`https://drive.google.com/file/d/${fileId}/preview`}
                title={media.file_name}
                className="w-full h-full"
                frameBorder="0"
                allow="autoplay"
              />
            </div>
          );
        } else {
          return (
            <div className="aspect-video rounded-lg overflow-hidden bg-black">
              <video 
                controls 
                className="w-full h-full"
                src={media.file_path}
              >
                <source src={media.file_path} type="video/mp4" />
                متصفحك لا يدعم تشغيل الفيديو
              </video>
            </div>
          );
        }

      case 'image':
        return (
          <div className="flex justify-center">
            <img 
              src={media.file_path} 
              alt={media.file_name}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>
        );

      case 'lottie':
        try {
          const animationData = typeof media.metadata?.animation_data === 'string' 
            ? JSON.parse(media.metadata.animation_data)
            : media.metadata?.animation_data;
          
          if (!animationData) {
            return (
              <div className="text-center p-8">
                <p className="text-muted-foreground">لا يمكن تحميل بيانات الأنيميشن</p>
              </div>
            );
          }

          return (
            <div className="relative rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center p-4">
              <div className="w-full max-w-2xl min-h-[300px] max-h-[600px] flex items-center justify-center">
                <Lottie
                  lottieRef={lottieRef}
                  animationData={animationData}
                  loop={media.metadata?.loop !== false}
                  autoplay={true}
                  style={{ width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%' }}
                  rendererSettings={{
                    preserveAspectRatio: 'xMidYMid meet'
                  }}
                  onLoadedData={() => {
                    console.log('Grade 10 Lottie loaded successfully');
                    if (lottieRef.current && speedSetting !== 1) {
                      console.log('Setting speed on load:', speedSetting);
                      lottieRef.current.setSpeed(speedSetting);
                    }
                  }}
                  onError={(error) => console.error('Grade 10 Lottie error:', error)}
                />
              </div>
            </div>
          );
        } catch (error) {
          console.error('Error parsing Lottie data:', error);
          return (
            <div className="text-center p-8">
              <p className="text-red-500">خطأ في تحميل الأنيميشن</p>
            </div>
          );
        }

      case 'code':
        const codeContent = media.metadata?.code_content || '';
        const language = media.metadata?.language || 'text';
        
        return (
          <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-[60vh]">
            <pre className="text-green-400 text-sm">
              <code>{codeContent}</code>
            </pre>
          </div>
        );

      default:
        return (
          <div className="text-center p-8">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              نوع الملف غير مدعوم للمعاينة
            </p>
            <Button variant="outline" className="mt-4">
              <Download className="w-4 h-4 mr-2" />
              تحميل الملف
            </Button>
          </div>
        );
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              {getMediaIcon(media.media_type)}
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">{media.file_name}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                {getMediaTypeBadge(media.media_type)}
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>
        
        <div className="mt-4">
          {renderMediaContent()}
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            إغلاق
          </Button>
          {media.file_path && (
            <Button 
              variant="default"
              onClick={() => window.open(media.file_path, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              فتح في نافذة جديدة
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Grade10MediaPreview;