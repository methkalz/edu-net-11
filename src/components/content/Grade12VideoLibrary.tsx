import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useGrade12Content } from '@/hooks/useGrade12Content';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Search,
  Filter,
  Play,
  Eye,
  Download,
  Edit3,
  Trash2,
  Plus,
  Video,
  Clock,
  Calendar,
  ExternalLink,
  Upload,
  Globe,
  HardDrive
} from 'lucide-react';
import { toast } from 'sonner';
import Grade12VideoForm from './Grade12VideoForm';

const Grade12VideoLibrary: React.FC = () => {
  const { userProfile } = useAuth();
  const { videos, loading, fetchVideos, deleteVideo } = useGrade12Content();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<any>(null);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [viewingVideo, setViewingVideo] = useState(false);

  // فصل منطق العرض عن منطق التعديل
  const canViewContent = true; // الجميع يستطيع المشاهدة
  const canManageContent = userProfile?.role === 'superadmin'; // فقط السوبر آدمن يستطيع التعديل

  useEffect(() => {
    fetchVideos();
  }, []);

  // تصفية الفيديوهات
  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || video.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // الحصول على الفئات المتوفرة
  const availableCategories = Array.from(new Set(videos.map(v => v.category)));

  // حذف الفيديو
  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الفيديو؟')) return;
    
    try {
      await deleteVideo(videoId);
      toast.success('تم حذف الفيديو بنجاح');
    } catch (error) {
      logger.error('Error deleting video', error as Error);
    }
  };

  // تحرير الفيديو
  const handleEditVideo = (video: any) => {
    setEditingVideo(video);
    setShowVideoForm(true);
  };

  // عرض الفيديو
  const handleViewVideo = (video: any) => {
    setSelectedVideo(video);
    setViewingVideo(true);
  };

  // الحصول على رابط المعاينة للفيديو
  const getVideoThumbnail = (video: any): string => {
    if (video.thumbnail_url) {
      return video.thumbnail_url;
    }
    
    if (video.source_type === 'youtube' && video.video_url) {
      const videoId = extractYouTubeId(video.video_url);
      return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '';
    }
    
    if (video.source_type === 'google_drive' && video.video_url) {
      const fileId = extractGoogleDriveId(video.video_url);
      return fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w320-h180` : '';
    }
    
    return '';
  };

  // استخراج معرف فيديو YouTube
  const extractYouTubeId = (url: string): string | null => {
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/)?([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  // استخراج معرف فيديو Google Drive
  const extractGoogleDriveId = (url: string): string | null => {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  // الحصول على رابط التضمين
  const getEmbedUrl = (video: any): string => {
    if (video.source_type === 'youtube') {
      const videoId = extractYouTubeId(video.video_url);
      return videoId ? `https://www.youtube.com/embed/${videoId}` : video.video_url;
    }
    
    if (video.source_type === 'google_drive') {
      return video.video_url; // يجب أن يكون مُحدّث بالفعل إلى رابط preview
    }
    
    return video.video_url;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="aspect-video bg-muted rounded-t-lg"></div>
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold">مكتبة الفيديوهات</h3>
          <p className="text-muted-foreground">
            {filteredVideos.length} فيديو متاح
          </p>
        </div>
        
        {canManageContent && (
          <Button onClick={() => setShowVideoForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            إضافة فيديو جديد
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث في الفيديوهات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 ml-2" />
            <SelectValue placeholder="الفئة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الفئات</SelectItem>
            {availableCategories.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Videos Grid */}
      {filteredVideos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Video className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد فيديوهات</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || selectedCategory !== 'all' 
                ? 'لم يتم العثور على فيديوهات تطابق البحث'
                : 'لم يتم إضافة أي فيديوهات بعد'
              }
            </p>
            {canManageContent && !searchTerm && selectedCategory === 'all' && (
              <Button onClick={() => setShowVideoForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                إضافة أول فيديو
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <Card key={video.id} className="group hover:shadow-lg transition-all duration-200">
              {/* Video Thumbnail */}
              <div className="relative aspect-video bg-muted rounded-t-lg overflow-hidden">
                {getVideoThumbnail(video) ? (
                  <img
                    src={getVideoThumbnail(video)}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleViewVideo(video)}
                    className="gap-2"
                  >
                    <Play className="h-4 w-4" />
                    تشغيل
                  </Button>
                </div>
                
                {/* Duration Badge */}
                {video.duration && (
                  <Badge className="absolute bottom-2 right-2 bg-black/70 text-white">
                    <Clock className="h-3 w-3 ml-1" />
                    {video.duration}
                  </Badge>
                )}
              </div>

              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{video.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {video.description || 'لا يوجد وصف'}
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-2">
                    <Badge variant="outline">{video.category}</Badge>
                    {video.source_type === 'youtube' && (
                      <Badge variant="outline" className="bg-red-50 text-red-700">
                        YouTube
                      </Badge>
                    )}
                    {video.source_type === 'google_drive' && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        <HardDrive className="h-3 w-3 ml-1" />
                        Drive
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Video Info */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(video.published_at || video.created_at), 'dd MMM yyyy', { locale: ar })}</span>
                  </div>
                  
                  {video.source_type && (
                    <div className="flex items-center gap-1">
                      {video.source_type === 'youtube' ? (
                        <Globe className="h-4 w-4" />
                      ) : video.source_type === 'google_drive' ? (
                        <HardDrive className="h-4 w-4" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      <span className="capitalize">
                        {video.source_type === 'google_drive' ? 'Google Drive' : video.source_type}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewVideo(video)}
                    className="flex-1 gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    مشاهدة
                  </Button>
                  
                  {(video.source_type === 'youtube' || video.source_type === 'google_drive') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(
                        video.source_type === 'youtube' ? video.video_url : 
                        `https://drive.google.com/file/d/${extractGoogleDriveId(video.video_url)}/view`, 
                        '_blank'
                      )}
                      className="gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {video.source_type === 'youtube' ? 'YouTube' : 'Google Drive'}
                    </Button>
                  )}
                  
                  {canManageContent && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditVideo(video)}
                        className="gap-2"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteVideo(video.id)}
                        className="gap-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Video Form Modal */}
      {showVideoForm && (
        <Grade12VideoForm
          video={editingVideo}
          onClose={() => {
            setShowVideoForm(false);
            setEditingVideo(null);
          }}
          onSave={() => {
            setShowVideoForm(false);
            setEditingVideo(null);
            fetchVideos();
          }}
        />
      )}

      {/* Video Viewer Modal */}
      {viewingVideo && selectedVideo && (
        <Dialog open={viewingVideo} onOpenChange={setViewingVideo}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedVideo.title}</DialogTitle>
              <DialogDescription>
                {selectedVideo.description}
              </DialogDescription>
            </DialogHeader>
            
            <div className="aspect-video">
              <iframe
                src={getEmbedUrl(selectedVideo)}
                title={selectedVideo.title}
                className="w-full h-full rounded-lg"
                allowFullScreen
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Grade12VideoLibrary;