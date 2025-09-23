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
  const getYouTubeEmbedUrl = (url: string) => {
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  const embedUrl = getYouTubeEmbedUrl(video.video_url);

  return (
    <div className="space-y-6">
      {/* Video Player */}
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        {video.source_type === 'youtube' ? (
          <iframe
            src={embedUrl}
            title={video.title}
            className="w-full h-full"
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
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-xl">{video.title}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {new Date(video.created_at).toLocaleDateString('ar-SA')}
                {video.duration && (
                  <>
                    <span>•</span>
                    <Clock className="w-4 h-4" />
                    {video.duration}
                  </>
                )}
              </div>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Video className="w-3 h-3" />
              {video.category}
            </Badge>
          </div>
        </CardHeader>

        {video.description && (
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">الوصف</h4>
                <p className="text-muted-foreground leading-relaxed">
                  {video.description}
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(video.video_url, '_blank')}
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  فتح في نافذة جديدة
                </Button>
                
                {onClose && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={onClose}
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