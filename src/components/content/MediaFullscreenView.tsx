import React, { useRef, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { X, Pen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Grade11LessonMedia } from '@/hooks/useGrade11Content';
import { useSharedLottieSettings } from '@/hooks/useSharedLottieSettings';
import Lottie from 'lottie-react';
import { DrawingToolbar, DrawingTool } from './DrawingToolbar';
import { DrawingCanvas } from './DrawingCanvas';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface MediaFullscreenViewProps {
  media: Grade11LessonMedia | null;
  onClose: () => void;
}

const MediaFullscreenView: React.FC<MediaFullscreenViewProps> = ({ media, onClose }) => {
  const { lottieSettings } = useSharedLottieSettings();
  const lottieRef = useRef<any>(null);
  
  // حالة أدوات الرسم
  const [drawingEnabled, setDrawingEnabled] = useState(false);
  const [activeTool, setActiveTool] = useState<DrawingTool>('pen');
  const [color, setColor] = useState('#FF0000');
  const [brushSize, setBrushSize] = useState(4);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [clearTrigger, setClearTrigger] = useState(0);
  const [undoTrigger, setUndoTrigger] = useState(0);
  const [redoTrigger, setRedoTrigger] = useState(0);

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
          <div className="w-full h-full flex items-center justify-center bg-black p-4">
            <img
              src={media.file_path}
              alt={media.file_name}
              className="max-w-full max-h-full w-auto h-auto object-contain"
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
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-8">
                <div className="w-full h-full max-w-full max-h-full flex items-center justify-center">
                  <Lottie
                    lottieRef={lottieRef}
                    animationData={animationData}
                    loop={loopSetting}
                    autoplay={true}
                    style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto' }}
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
        <VisuallyHidden>
          <DialogTitle>عرض الوسائط</DialogTitle>
          <DialogDescription>
            عرض {media.media_type === 'video' ? 'الفيديو' : media.media_type === 'image' ? 'الصورة' : 'الرسم المتحرك'} بملء الشاشة
          </DialogDescription>
        </VisuallyHidden>

        {/* زر الإغلاق */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full"
        >
          <X className="h-6 w-6" />
        </Button>

        {/* زر تفعيل الرسم */}
        <Button
          variant={drawingEnabled ? 'default' : 'ghost'}
          size="icon"
          onClick={() => setDrawingEnabled(!drawingEnabled)}
          className="absolute top-4 right-20 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full"
          title="أدوات الرسم"
        >
          <Pen className="h-6 w-6" />
        </Button>
        
        <div className="w-full h-full relative">
          {renderMediaContent()}
          
          {/* طبقة الرسم */}
          {drawingEnabled && (
            <>
              <DrawingCanvas
                activeTool={activeTool}
                color={color}
                brushSize={brushSize}
                onHistoryChange={(undo, redo) => {
                  setCanUndo(undo);
                  setCanRedo(redo);
                }}
                clearTrigger={clearTrigger}
                undoTrigger={undoTrigger}
                redoTrigger={redoTrigger}
              />
              
              <DrawingToolbar
                activeTool={activeTool}
                onToolChange={setActiveTool}
                activeColor={color}
                onColorChange={setColor}
                brushSize={brushSize}
                onBrushSizeChange={setBrushSize}
                onClear={() => setClearTrigger(prev => prev + 1)}
                onUndo={() => setUndoTrigger(prev => prev + 1)}
                onRedo={() => setRedoTrigger(prev => prev + 1)}
                canUndo={canUndo}
                canRedo={canRedo}
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaFullscreenView;
