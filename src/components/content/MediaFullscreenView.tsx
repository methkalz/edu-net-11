import React, { useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Grade11LessonMedia } from '@/hooks/useGrade11Content';
import { useSharedLottieSettings } from '@/hooks/useSharedLottieSettings';
import Lottie from 'lottie-react';

interface MediaFullscreenViewProps {
  media: Grade11LessonMedia | null;
  onClose: () => void;
}

const MediaFullscreenView: React.FC<MediaFullscreenViewProps> = ({ media, onClose }) => {
  const { lottieSettings } = useSharedLottieSettings();
  const lottieRef = useRef<any>(null);

  if (!media) return null;

  const metadata = media.metadata || {};
  const speedSetting = metadata.speed || lottieSettings?.speed || 1;

  useEffect(() => {
    if (lottieRef.current && speedSetting !== undefined && media.media_type === 'lottie') {
      lottieRef.current.setSpeed(speedSetting);
    }
  }, [speedSetting, media.media_type]);

  const renderMediaContent = () => {
    switch (media.media_type) {
      case 'video':
        if (metadata.source_type === 'youtube') {
          let youtubeId = metadata.youtube_id;
          
          if (!youtubeId && metadata.video_url) {
            const urlMatch = metadata.video_url.match(/(?:embed\/|v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            if (urlMatch) youtubeId = urlMatch[1];
          }
          
          if (!youtubeId && metadata.file_path) {
            const pathMatch = metadata.file_path.match(/(?:embed\/|v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            if (pathMatch) youtubeId = pathMatch[1];
          }
          
          if (youtubeId) {
            return (
              <div className="w-full h-full flex items-center justify-center bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title={media.file_name}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            );
          }
        } else if (metadata.source_type === 'google_drive' && metadata.drive_id) {
          return (
            <div className="w-full h-full flex items-center justify-center bg-black">
              <iframe
                src={`https://drive.google.com/file/d/${metadata.drive_id}/preview`}
                title={media.file_name}
                className="w-full h-full"
                frameBorder="0"
                allow="autoplay"
              />
            </div>
          );
        } else if (metadata.source_type === 'upload' || metadata.source_type === 'url') {
          return (
            <div className="w-full h-full flex items-center justify-center bg-black">
              <video
                src={media.file_path}
                title={media.file_name}
                className="max-w-full max-h-full"
                controls
                autoPlay
              />
            </div>
          );
        }
        break;

      case 'image':
        return (
          <div className="w-full h-full flex items-center justify-center bg-black">
            <img
              src={media.file_path}
              alt={media.file_name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        );

      case 'lottie':
        try {
          let animationData = null;
          
          if (metadata.animation_data) {
            animationData = typeof metadata.animation_data === 'string' 
              ? JSON.parse(metadata.animation_data) 
              : metadata.animation_data;
          } else if (metadata.lottie_data) {
            animationData = typeof metadata.lottie_data === 'string' 
              ? JSON.parse(metadata.lottie_data) 
              : metadata.lottie_data;
          }

          if (animationData) {
            const loopSetting = typeof metadata.loop === 'boolean' ? metadata.loop : (lottieSettings?.loop !== undefined ? lottieSettings.loop : true);
            
            return (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
                <div className="w-full h-full max-w-4xl max-h-4xl">
                  <Lottie
                    lottieRef={lottieRef}
                    animationData={animationData}
                    loop={loopSetting}
                    autoplay={true}
                    style={{ width: '100%', height: '100%' }}
                    rendererSettings={{
                      preserveAspectRatio: 'xMidYMid meet'
                    }}
                    onLoadedData={() => {
                      if (lottieRef.current && speedSetting !== 1) {
                        lottieRef.current.setSpeed(speedSetting);
                      }
                    }}
                  />
                </div>
              </div>
            );
          }
        } catch (error) {
          console.error('Lottie parsing error:', error);
        }
        break;

      default:
        return null;
    }
  };

  return (
    <Dialog open={!!media} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black border-none">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full"
        >
          <X className="h-6 w-6" />
        </Button>
        
        <div className="w-full h-full">
          {renderMediaContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaFullscreenView;
