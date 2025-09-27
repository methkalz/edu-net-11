import React, { useState } from 'react';
import { Video, Play, Search, Calendar, Eye, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface Grade10Video {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  duration?: string;
  source_type: 'youtube' | 'vimeo' | 'direct' | 'google_drive';
  category?: string;
  video_category?: string;
  grade_level: string;
  owner_user_id: string;
  school_id?: string;
  created_at: string;
  updated_at: string;
}

interface DirectVideoViewerProps {
  videos: Grade10Video[];
  loading: boolean;
  title?: string;
}

const DirectVideoViewer: React.FC<DirectVideoViewerProps> = ({ videos, loading, title }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<Grade10Video | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Filter videos by search term
  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (video.description && video.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const extractYouTubeId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const extractGoogleDriveId = (url: string): string | null => {
    const regex = /(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|docs\.google\.com\/file\/d\/)([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const getVideoThumbnail = (video: Grade10Video): string => {
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
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h300`;
      }
    }

    return '/placeholder.svg';
  };

  const handleVideoClick = (video: Grade10Video) => {
    setSelectedVideo(video);
    setIsVideoModalOpen(true);
  };

  const getVideoEmbedUrl = (video: Grade10Video): string => {
    if (video.source_type === 'youtube') {
      const videoId = extractYouTubeId(video.video_url);
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    if (video.source_type === 'google_drive') {
      const fileId = extractGoogleDriveId(video.video_url);
      if (fileId) {
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }

    return video.video_url;
  };

  const renderVideoGrid = (videos: Grade10Video[]) => {
    if (loading) {
      return (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (videos.length === 0) {
      return (
        <div className="text-center py-12">
          <Video className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">لا توجد فيديوهات</h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'لم يتم العثور على فيديوهات تطابق البحث' : 'لم يتم إضافة فيديوهات بعد'}
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {videos.map((video) => (
          <Card key={video.id} className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-md">
            <div className="relative">
              <img
                src={getVideoThumbnail(video)}
                alt={video.title}
                className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
              
              {/* Play overlay */}
              <div 
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                onClick={() => handleVideoClick(video)}
              >
                <div className="bg-white/20 hover:bg-white/30 rounded-full p-3 backdrop-blur-sm">
                  <Play className="w-8 h-8 text-white fill-white" />
                </div>
              </div>

              {/* Teacher preview badge */}
              <div className="absolute top-2 left-2 bg-blue-600 text-white rounded-full px-2 py-1 text-xs font-medium">
                <Eye className="w-3 h-3 inline-block mr-1" />
                معاينة
              </div>

              {/* Duration badge */}
              {video.duration && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white rounded px-2 py-1 text-xs">
                  {video.duration}
                </div>
              )}
            </div>
            
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                {video.title}
              </h3>
              
              {video.description && (
                <p className="text-xs text-muted-foreground line-clamp-3 mb-3">
                  {video.description}
                </p>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(video.created_at).toLocaleDateString('ar-SA')}</span>
                </div>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleVideoClick(video)}
                  className="text-xs px-3 py-1"
                >
                  مشاهدة
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      {title && (
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{title}</h2>
          <Badge variant="secondary" className="text-sm">
            {filteredVideos.length} فيديو
          </Badge>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="البحث في الفيديوهات..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10 text-right"
        />
      </div>

      {/* Videos Grid */}
      {renderVideoGrid(filteredVideos)}

      {/* Video Modal */}
      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-right">
              {selectedVideo?.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedVideo && (
              <div className="aspect-video">
                <iframe
                  src={getVideoEmbedUrl(selectedVideo)}
                  className="w-full h-full rounded-lg"
                  allowFullScreen
                  title={selectedVideo.title}
                />
              </div>
            )}
            
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

export default DirectVideoViewer;