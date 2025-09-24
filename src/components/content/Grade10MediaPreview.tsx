import React, { useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Download, ExternalLink, FileText, Image as ImageIcon, Video, Code, Play, Box } from 'lucide-react';
import { ThreeDModelViewer } from './ThreeDModelViewer';
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
  
  // Apply speed when it changes - updated to match Grade 11 logic
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
      case '3d_model': return <Box className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getMediaTypeBadge = (type: string) => {
    const typeMap = {
      video: { label: 'فيديو', color: 'bg-blue-100 text-blue-800' },
      image: { label: 'صورة', color: 'bg-green-100 text-green-800' },
      lottie: { label: 'لوتي', color: 'bg-purple-100 text-purple-800' },
      code: { label: 'كود', color: 'bg-orange-100 text-orange-800' },
      '3d_model': { label: 'نموذج ثلاثي الأبعاد', color: 'bg-cyan-100 text-cyan-800' }
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
        console.log('=== GRADE 10 LOTTIE DEBUG ===');
        console.log('Media metadata:', media.metadata);
        
        try {
          let animationData = null;
          
          // Try different ways to get animation data - same logic as Grade 11
          if (media.metadata?.animation_data) {
            console.log('Using metadata.animation_data');
            animationData = typeof media.metadata.animation_data === 'string' 
              ? JSON.parse(media.metadata.animation_data) 
              : media.metadata.animation_data;
          } else if (media.metadata?.lottie_data) {
            console.log('Using metadata.lottie_data');
            animationData = typeof media.metadata.lottie_data === 'string' 
              ? JSON.parse(media.metadata.lottie_data) 
              : media.metadata.lottie_data;
          } else if (media.file_path && media.file_path.includes('.json')) {
            console.log('Lottie file path detected, but no animation data in metadata');
            return (
              <div className="relative rounded-lg bg-amber-50 p-4 text-center">
                <Play className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                <p className="text-sm text-amber-700">يتطلب تحميل ملف اللوتي من الرابط</p>
              </div>
            );
          }

          console.log('Final animation data:', animationData);
          
          if (!animationData || Object.keys(animationData).length === 0) {
            throw new Error('No valid animation data found');
          }

          // Use metadata speed as single source of truth, fallback to 1
          const finalSpeedSetting = typeof media.metadata?.speed === 'number' ? media.metadata.speed : 1;
          const loopSetting = typeof media.metadata?.loop === 'boolean' ? media.metadata.loop : true;
          
          console.log('Speed sources - metadata.speed:', media.metadata?.speed, 'final speedSetting:', finalSpeedSetting);
          console.log('Loop setting:', loopSetting);

          return (
            <div className="relative rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center p-4">
              <div className="w-full max-w-2xl min-h-[300px] max-h-[600px] flex items-center justify-center">
                <Lottie
                  lottieRef={lottieRef}
                  animationData={animationData}
                  loop={loopSetting}
                  autoplay={true}
                  style={{ width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%' }}
                  rendererSettings={{
                    preserveAspectRatio: 'xMidYMid meet'
                  }}
                  onLoadedData={() => {
                    console.log('Grade 10 Lottie loaded successfully');
                    if (lottieRef.current && finalSpeedSetting !== 1) {
                      console.log('Setting speed on load:', finalSpeedSetting);
                      lottieRef.current.setSpeed(finalSpeedSetting);
                    }
                  }}
                  onError={(error) => console.error('Grade 10 Lottie error:', error)}
                />
              </div>
            </div>
          );
        } catch (error) {
          console.error('Grade 10 Lottie parsing error:', error);
          return (
            <div className="relative rounded-lg bg-red-50 border border-red-200 p-4 text-center">
              <Play className="h-8 w-8 mx-auto mb-2 text-red-400" />
              <p className="text-sm text-red-600">خطأ في تحميل الرسوم المتحركة</p>
              <p className="text-xs text-red-500 mt-1">تحقق من صحة ملف اللوتي</p>
            </div>
          );
        }

      case '3d_model':
        const modelType = media.file_path.toLowerCase().endsWith('.glb') ? 'glb' : 'obj';
        return (
          <ThreeDModelViewer
            modelUrl={media.file_path}
            modelType={modelType}
            title={media.file_name}
            showControls={true}
            autoRotate={media.metadata?.autoRotate !== false}
            className="w-full"
          />
        );

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
          {media.file_path && media.media_type !== 'lottie' && (
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