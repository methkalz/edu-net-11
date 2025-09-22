import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Video, Play, Edit, Trash2, Search, Plus, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Video {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  duration?: string;
  source_type: 'youtube' | 'vimeo' | 'direct';
  category?: string;
  created_at: string;
  updated_at: string;
}

interface Grade11VideoLibraryProps {
  videos: Video[];
  loading: boolean;
  onAddVideo: () => void;
  onEditVideo: (video: Video) => void;
  onDeleteVideo: (id: string) => void;
}

const Grade11VideoLibrary: React.FC<Grade11VideoLibraryProps> = ({
  videos,
  loading,
  onAddVideo,
  onEditVideo,
  onDeleteVideo
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'youtube':
        return '🎬';
      case 'vimeo':
        return '📹';
      default:
        return '🎥';
    }
  };

  const getSourceLabel = (sourceType: string) => {
    switch (sourceType) {
      case 'youtube':
        return 'YouTube';
      case 'vimeo':
        return 'Vimeo';
      default:
        return 'رابط مباشر';
    }
  };

  const handlePlayVideo = (videoUrl: string) => {
    window.open(videoUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-32 bg-muted rounded mb-4"></div>
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm">
            إجمالي الفيديوهات: {videos.length}
          </Badge>
          {videos.length > 0 && (
            <Badge variant="secondary">
              المدة الإجمالية: {videos.reduce((acc, video) => {
                if (video.duration) {
                  // Simple estimation for display
                  return acc + 1;
                }
                return acc;
              }, 0)} فيديو
            </Badge>
          )}
        </div>
        {/* تم إزالة زر إضافة الفيديو - يُظهر فقط للسوبر آدمن في مكون آخر */}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="البحث في الفيديوهات..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Videos grid */}
      {filteredVideos.length === 0 ? (
        <div className="text-center py-12">
          <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">لا توجد فيديوهات</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm 
              ? 'لا توجد فيديوهات تطابق معايير البحث' 
              : 'لم يتم إضافة أي فيديوهات بعد'
            }
          </p>
          {/* تم إزالة زر إضافة الفيديو - يُظهر فقط للسوبر آدمن في مكون آخر */}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredVideos.map((video) => (
            <Card key={video.id} className="hover:shadow-md transition-shadow overflow-hidden">
              {/* Video thumbnail/preview */}
              <div className="relative aspect-video bg-muted">
                {video.thumbnail_url ? (
                  <img 
                    src={video.thumbnail_url} 
                    alt={video.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handlePlayVideo(video.video_url)}
                    className="bg-white/90 hover:bg-white text-black"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    تشغيل
                  </Button>
                </div>
                {video.duration && (
                  <Badge className="absolute bottom-2 right-2 bg-black/70 text-white">
                    {video.duration}
                  </Badge>
                )}
              </div>

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-medium line-clamp-2 flex-1">
                    {video.title}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {getSourceIcon(video.source_type)} {getSourceLabel(video.source_type)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {video.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {video.description}
                  </p>
                )}
                
                <div className="space-y-2 text-xs text-muted-foreground mb-4">
                  {video.category && (
                    <div className="flex justify-between">
                      <span>الفئة:</span>
                      <span className="font-medium">{video.category}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>تاريخ الإضافة:</span>
                    <span className="font-medium">
                      {formatDistanceToNow(new Date(video.created_at), { 
                        addSuffix: true, 
                        locale: ar 
                      })}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePlayVideo(video.video_url)}
                    className="flex-1"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    مشاهدة
                  </Button>
                  {/* أزرار التعديل والحذف - يُظهر فقط للسوبر آدمن في مكون آخر */}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Grade11VideoLibrary;