import React, { useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Download, ExternalLink } from 'lucide-react';
import { Grade11LessonMedia } from '@/hooks/useGrade11Content';
import { useSharedLottieSettings } from '@/hooks/useSharedLottieSettings';
import Lottie from 'lottie-react';

interface MediaPreviewProps {
  media: Grade11LessonMedia;
  onClose: () => void;
}

const MediaPreview: React.FC<MediaPreviewProps> = ({ media, onClose }) => {
  const { lottieSettings } = useSharedLottieSettings();
  const lottieRef = useRef<any>(null);
  
  // Get speed setting for Lottie
  const speedSetting = media.metadata?.speed || lottieSettings?.speed || 1;
  
  // Apply speed when it changes
  useEffect(() => {
    if (lottieRef.current && speedSetting !== undefined && media.media_type === 'lottie') {
      console.log('Applying speed to media preview:', speedSetting);
      lottieRef.current.setSpeed(speedSetting);
    }
  }, [speedSetting, media.media_type]);
  const getMediaTypeBadge = (type: string) => {
    const typeMap = {
      video: { label: 'فيديو', color: 'bg-blue-100 text-blue-800' },
      image: { label: 'صورة', color: 'bg-green-100 text-green-800' },
      lottie: { label: 'لوتي', color: 'bg-purple-100 text-purple-800' }
    };
    
    const config = typeMap[type as keyof typeof typeMap] || { label: type, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <Badge className={`${config.color} text-xs`}>
        {config.label}
      </Badge>
    );
  };

  const getSourceBadge = (sourceType: string) => {
    const sourceMap = {
      upload: { label: 'رفع مباشر', color: 'bg-gray-100 text-gray-800' },
      youtube: { label: 'يوتيوب', color: 'bg-red-100 text-red-800' },
      google_drive: { label: 'جوجل درايف', color: 'bg-blue-100 text-blue-800' },
      url: { label: 'رابط خارجي', color: 'bg-orange-100 text-orange-800' }
    };
    
    const config = sourceMap[sourceType as keyof typeof sourceMap] || { label: sourceType, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <Badge variant="outline" className={`${config.color} text-xs`}>
        {config.label}
      </Badge>
    );
  };

  const renderMediaContent = () => {
    switch (media.media_type) {
      case 'video':
        if (media.metadata?.source_type === 'youtube' || media.metadata?.source_type === 'google_drive') {
          return (
            <iframe
              src={media.file_path}
              className="w-full h-96 rounded-lg"
              allow="autoplay; encrypted-media"
              title={media.file_name}
            />
          );
        } else {
          return (
            <video
              src={media.file_path}
              controls
              className="w-full max-h-96 rounded-lg"
              poster={media.metadata?.thumbnail_url}
            >
              متصفحك لا يدعم تشغيل الفيديو.
            </video>
          );
        }

      case 'image':
        return (
          <img
            src={media.file_path}
            alt={media.metadata?.alt_text || media.file_name}
            className="w-full max-h-96 object-contain rounded-lg"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        );

      case 'lottie':
        console.log('=== LOTTIE PREVIEW DEBUG ===');
        console.log('Media for preview:', media);
        console.log('Lottie settings in preview:', lottieSettings);
        
        let animationData = null;
        try {
          if (media.metadata?.animation_data) {
            console.log('Using animation_data from metadata');
            animationData = typeof media.metadata.animation_data === 'string' 
              ? JSON.parse(media.metadata.animation_data) 
              : media.metadata.animation_data;
          } else if (media.metadata?.lottie_data) {
            console.log('Using lottie_data from metadata');
            animationData = typeof media.metadata.lottie_data === 'string' 
              ? JSON.parse(media.metadata.lottie_data) 
              : media.metadata.lottie_data;
          }
        } catch (error) {
          console.error('Error parsing Lottie data in preview:', error);
        }

        console.log('Animation data for preview:', animationData);

        if (animationData && Object.keys(animationData).length > 0) {
          const loopSetting = lottieSettings?.loop !== undefined ? lottieSettings.loop : true;

          return (
            <div className="flex justify-center items-center min-h-[300px] max-h-[80vh] p-4">
              <div className="w-full max-w-4xl min-h-[200px] max-h-[70vh] flex items-center justify-center">
                <Lottie
                  lottieRef={lottieRef}
                  animationData={animationData}
                  loop={loopSetting}
                  autoplay={media.metadata?.autoplay !== false}
                  style={{ width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%' }}
                  rendererSettings={{
                    preserveAspectRatio: 'xMidYMid meet'
                  }}
                  onLoadedData={() => {
                    console.log('Lottie preview loaded successfully');
                    if (lottieRef.current && speedSetting !== 1) {
                      console.log('Setting speed on media preview load:', speedSetting);
                      lottieRef.current.setSpeed(speedSetting);
                    }
                  }}
                  onError={(error) => console.error('Lottie preview error:', error)}
                />
              </div>
            </div>
          );
        } else {
          return (
            <div className="flex justify-center items-center h-64 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-center">
                <div className="text-red-500 text-lg mb-2">⚠️</div>
                <p className="text-red-600 font-medium">لا يمكن تحميل الرسوم المتحركة</p>
                <p className="text-xs text-red-500 mt-1">تحقق من صحة بيانات اللوتي</p>
              </div>
            </div>
          );
        }

      default:
        return (
          <div className="flex justify-center items-center h-96 bg-muted rounded-lg">
            <p className="text-muted-foreground">نوع ملف غير مدعوم</p>
          </div>
        );
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {media.file_name}
              {getMediaTypeBadge(media.media_type)}
              {media.metadata?.source_type && getSourceBadge(media.metadata.source_type)}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* محتوى الوسائط */}
          <div className="border rounded-lg p-4">
            {renderMediaContent()}
            <div className="hidden text-center text-muted-foreground py-8">
              لا يمكن تحميل الملف. تحقق من صحة الرابط.
            </div>
          </div>

          {/* معلومات الملف */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">اسم الملف:</span>
              <p className="mt-1">{media.file_name}</p>
            </div>

            <div>
              <span className="font-medium text-muted-foreground">نوع الملف:</span>
              <p className="mt-1">{media.media_type}</p>
            </div>

            {media.metadata?.duration && (
              <div>
                <span className="font-medium text-muted-foreground">المدة:</span>
                <p className="mt-1">{media.metadata.duration}</p>
              </div>
            )}

            {media.metadata?.source_type && (
              <div>
                <span className="font-medium text-muted-foreground">المصدر:</span>
                <p className="mt-1">{media.metadata.source_type}</p>
              </div>
            )}

            <div>
              <span className="font-medium text-muted-foreground">ترتيب العرض:</span>
              <p className="mt-1">{media.order_index + 1}</p>
            </div>

            <div>
              <span className="font-medium text-muted-foreground">تاريخ الإضافة:</span>
              <p className="mt-1">{new Date(media.created_at).toLocaleDateString('en-GB')}</p>
            </div>

            {media.metadata?.description && (
              <div className="md:col-span-2">
                <span className="font-medium text-muted-foreground">الوصف:</span>
                <p className="mt-1">{media.metadata.description}</p>
              </div>
            )}

            {media.metadata?.alt_text && (
              <div className="md:col-span-2">
                <span className="font-medium text-muted-foreground">النص البديل:</span>
                <p className="mt-1">{media.metadata.alt_text}</p>
              </div>
            )}
          </div>

          {/* أزرار التحكم */}
          <div className="flex gap-3 justify-end">
            {media.file_path && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(media.file_path, '_blank')}
              >
                <ExternalLink className="h-4 w-4 ml-1" />
                فتح في نافذة جديدة
              </Button>
            )}
            
            {media.media_type !== 'lottie' && media.metadata?.source_type === 'upload' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = media.file_path;
                  link.download = media.file_name;
                  link.click();
                }}
              >
                <Download className="h-4 w-4 ml-1" />
                تحميل
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaPreview;