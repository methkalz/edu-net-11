import React, { useState } from 'react';
import { Video, Play, Search, Calendar, Eye, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface Grade12Video {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  duration?: string;
  source_type: 'youtube' | 'vimeo' | 'direct' | 'google_drive';
  category?: string;
  grade_level: string;
  owner_user_id: string;
  school_id?: string;
  created_at: string;
  updated_at: string;
}

interface Grade12VideoViewerProps {
  videos: Grade12Video[];
  loading: boolean;
}

const Grade12VideoViewer: React.FC<Grade12VideoViewerProps> = ({ videos, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<Grade12Video | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (video.description && video.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getVideoThumbnail = (video: Grade12Video): string => {
    if (video.thumbnail_url) {
      return video.thumbnail_url;
    }

    if (video.source_type === 'youtube') {
      const videoId = extractYouTubeId(video.video_url);
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }
    }

    if (video.source_type === 'google_drive') {
      const fileId = extractGoogleDriveId(video.video_url);
      if (fileId) {
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
      }
    }

    return '/placeholder.svg';
  };

  const extractGoogleDriveId = (url: string): string | null => {
    const regex = /(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|docs\.google\.com\/file\/d\/)([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const extractYouTubeId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const openVideo = (video: Grade12Video) => {
    setSelectedVideo(video);
    setIsVideoModalOpen(true);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getSourceTypeLabel = (sourceType: string): string => {
    const labels = {
      youtube: 'يوتيوب',
      vimeo: 'فيميو',
      direct: 'رابط مباشر',
      google_drive: 'جوجل درايف'
    };
    return labels[sourceType as keyof typeof labels] || sourceType;
  };

  const renderVideoPlayer = (video: Grade12Video) => {
    if (video.source_type === 'youtube') {
      const videoId = extractYouTubeId(video.video_url);
      if (videoId) {
        return (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            className="w-full h-96 rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        );
      }
    }

    if (video.source_type === 'google_drive') {
      // Use the video URL directly as it comes from the database
      return (
        <iframe
          src={video.video_url}
          className="w-full h-96 rounded-lg"
          allow="autoplay"
          allowFullScreen
        />
      );
    }
    
    if (video.source_type === 'direct') {
      return (
        <video
          src={video.video_url}
          controls
          className="w-full h-96 rounded-lg"
        >
          متصفحك لا يدعم تشغيل الفيديو
        </video>
      );
    }

    // Fallback for unknown types
    return (
      <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Video className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">لا يمكن عرض هذا الفيديو مباشرة</p>
          <Button onClick={() => window.open(video.video_url, '_blank')}>
            فتح في صفحة جديدة
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">فيديوهات الصف الثاني عشر</h2>
          <p className="text-muted-foreground">
            {filteredVideos.length} من {videos.length} فيديو
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="البحث في الفيديوهات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>

      {/* Videos Grid */}
      {filteredVideos.length === 0 ? (
        <div className="text-center py-12">
          <Video className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {searchTerm ? 'لا توجد نتائج' : 'لا توجد فيديوهات'}
          </h3>
          <p className="text-muted-foreground">
            {searchTerm 
              ? 'جرب البحث بمصطلحات مختلفة'
              : 'لم يتم إضافة أي فيديوهات للصف الثاني عشر بعد'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <img
                  src={getVideoThumbnail(video)}
                  alt={video.title}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    size="lg"
                    className="bg-white/20 hover:bg-white/30 text-white border-white/50"
                    onClick={() => openVideo(video)}
                  >
                    <Play className="h-6 w-6 mr-2" />
                    مشاهدة
                  </Button>
                </div>
              </div>
              
              <CardHeader className="pb-3">
                <CardTitle className="text-lg leading-7 line-clamp-2">
                  {video.title}
                </CardTitle>
                {video.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {video.description}
                  </p>
                )}
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {getSourceTypeLabel(video.source_type)}
                  </Badge>
                  {video.category && (
                    <Badge variant="outline" className="text-xs">
                      {video.category}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(video.created_at)}
                  </div>
                  {video.duration && (
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {video.duration}
                    </div>
                  )}
                </div>

                <Button 
                  className="w-full" 
                  onClick={() => openVideo(video)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  مشاهدة الفيديو
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Video Modal */}
      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-right">
              {selectedVideo?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedVideo && renderVideoPlayer(selectedVideo)}
            {selectedVideo?.description && (
              <p className="text-muted-foreground text-right">
                {selectedVideo.description}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Grade12VideoViewer;