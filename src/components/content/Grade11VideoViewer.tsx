import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  PlayCircle, 
  Clock, 
  Calendar,
  ExternalLink,
  Video 
} from 'lucide-react';
import { Grade11Video } from '@/hooks/useStudentGrade11Content';

interface Grade11VideoViewerProps {
  video: Grade11Video;
  onClose?: () => void;
}

export const Grade11VideoViewer: React.FC<Grade11VideoViewerProps> = ({ 
  video, 
  onClose 
}) => {
  const getEmbedUrl = (url: string, sourceType?: string) => {
    // Handle YouTube URLs
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Handle Google Drive URLs
    if (url.includes('drive.google.com/file/d/')) {
      const fileId = url.split('/d/')[1]?.split('/')[0];
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    
    return url;
  };

  const embedUrl = getEmbedUrl(video.video_url, video.source_type);
  const isGoogleDrive = video.video_url.includes('drive.google.com');
  const isYouTube = video.source_type === 'youtube' || video.video_url.includes('youtube.com') || video.video_url.includes('youtu.be');

  return (
    <div className="space-y-6">
      {/* Video Player */}
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        {isYouTube || isGoogleDrive ? (
          <iframe
            src={embedUrl}
            title={video.title}
            className="w-full h-full border-0"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        ) : (
          <video
            src={video.video_url}
            title={video.title}
            className="w-full h-full"
            controls
            preload="metadata"
          />
        )}
      </div>

      {/* Video Info */}
      <Card className="border-2">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <CardTitle className="text-2xl font-bold text-foreground">{video.title}</CardTitle>
              <div className="flex items-center gap-3 text-base text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {new Date(video.created_at).toLocaleDateString('en-GB')}
                </div>
                {video.duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    {video.duration}
                  </div>
                )}
              </div>
            </div>
            <Badge variant="outline" className="flex items-center gap-2 text-sm px-4 py-2">
              <Video className="w-4 h-4" />
              {video.category}
            </Badge>
          </div>
        </CardHeader>

        {video.description && (
          <CardContent className="pt-0">
            <div className="space-y-5">
              <div>
                <h4 className="text-lg font-bold mb-3 text-foreground">الوصف</h4>
                <p className="text-base text-muted-foreground leading-7">
                  {video.description}
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  size="default"
                  onClick={() => window.open(video.video_url, '_blank')}
                  className="flex items-center gap-2 px-4 py-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  فتح في نافذة جديدة
                </Button>
                
                {onClose && (
                  <Button 
                    variant="ghost" 
                    size="default"
                    onClick={onClose}
                    className="px-4 py-2"
                  >
                    إغلاق
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};