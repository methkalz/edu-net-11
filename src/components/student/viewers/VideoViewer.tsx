import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, X, CheckCircle, Video, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface VideoViewerProps {
  isOpen: boolean;
  onClose: () => void;
  video: {
    id: string;
    title: string;
    description?: string;
    video_url: string;
    source_type?: string;
    duration?: number;
  };
  onProgress: (progress: number, watchTime: number) => void;
  onComplete: () => void;
}

export const VideoViewer: React.FC<VideoViewerProps> = ({ 
  isOpen, 
  onClose, 
  video, 
  onComplete 
}) => {
  const [hasStarted, setHasStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (isOpen && !hasStarted) {
      setHasStarted(true);
      toast.info('بدأت مشاهدة الفيديو', {
        description: 'ستحصل على النقاط عند تشغيل الفيديو'
      });
    }
  }, [isOpen, hasStarted]);

  const handleVideoPlay = () => {
    if (!isCompleted) {
      setIsCompleted(true);
      onComplete();
      toast.success('تم إكمال الفيديو بنجاح!', {
        description: 'تم إضافة النقاط إلى رصيدك'
      });
    }
  };

  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const renderVideoPlayer = () => {
    if (video.source_type === 'youtube' || video.video_url.includes('youtube.com') || video.video_url.includes('youtu.be')) {
      const videoId = extractYouTubeId(video.video_url);
      if (videoId) {
        return (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            className="w-full h-96 rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={handleVideoPlay}
          />
        );
      }
    }

    if (video.source_type === 'google_drive' || video.video_url.includes('drive.google.com')) {
      return (
        <iframe
          src={video.video_url}
          className="w-full h-96 rounded-lg"
          allow="autoplay"
          allowFullScreen
          onLoad={handleVideoPlay}
        />
      );
    }
    
    if (video.source_type === 'direct' || video.video_url.includes('.mp4') || video.video_url.includes('.webm')) {
      return (
        <video
          src={video.video_url}
          controls
          className="w-full h-96 rounded-lg"
          onPlay={handleVideoPlay}
        >
          متصفحك لا يدعم تشغيل الفيديو
        </video>
      );
    }

    // Handle vimeo
    if (video.source_type === 'vimeo' || video.video_url.includes('vimeo.com')) {
      const videoId = video.video_url.split('/').pop()?.split('?')[0];
      return (
        <iframe
          src={`https://player.vimeo.com/video/${videoId}`}
          className="w-full h-96 rounded-lg"
          allowFullScreen
          onLoad={handleVideoPlay}
        />
      );
    }

    // Fallback for unknown types
    return (
      <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center space-y-4">
          <Video className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">لا يمكن عرض هذا الفيديو مباشرة</p>
          <Button 
            onClick={() => {
              window.open(video.video_url, '_blank');
              handleVideoPlay();
            }}
            className="flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            فتح في صفحة جديدة
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Play className="w-5 h-5" />
                {video.title}
              </DialogTitle>
              {video.description && (
                <p className="text-sm text-muted-foreground">{video.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isCompleted && (
                <Badge className="bg-green-100 text-green-800 border-green-300">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  مكتمل
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          {/* Video Player */}
          <div className="bg-black rounded-lg overflow-hidden">
            {renderVideoPlayer()}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              إغلاق
            </Button>
            {isCompleted && (
              <Button className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                مكتمل
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};