import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Video, Play, Edit, Trash2, Search, Filter, Plus, Eye, EyeOff, Calendar, Clock, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useGrade10Content } from '@/hooks/useGrade10Content';
import { logger } from '@/lib/logger';
import Grade10VideoForm from './Grade10VideoForm';
import { toast } from 'sonner';

const Grade10VideoLibrary: React.FC = () => {
  const { userProfile } = useAuth();
  const { videos, addVideo, updateVideo, deleteVideo, loading } = useGrade10Content();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<{ id: string; title: string; video_url: string } | null>(null);
  const [previewVideo, setPreviewVideo] = useState<{ id: string; title: string; video_url: string; source_type: string; description?: string } | null>(null);

  // فصل منطق العرض عن منطق التعديل
  const canViewContent = true; // الجميع يستطيع المشاهدة
  const canManageContent = userProfile?.role === 'superadmin'; // فقط السوبر آدمن يستطيع التعديل

  const categoryOptions = [
    { value: 'all', label: 'جميع الفئات' },
    { value: 'general', label: 'عام' },
    { value: 'programming', label: 'البرمجة' },
    { value: 'networks', label: 'الشبكات' },
    { value: 'databases', label: 'قواعد البيانات' },
    { value: 'web_development', label: 'تطوير المواقع' },
    { value: 'mobile_apps', label: 'تطبيقات الجوال' },
    { value: 'theory', label: 'المفاهيم النظرية' }
  ];

  const sourceTypeLabels = {
    youtube: 'YouTube',
    vimeo: 'Vimeo',
    google_drive: 'Google Drive',
    direct: 'رابط مباشر',
    upload: 'ملف مرفوع'
  };

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || video.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSaveVideo = async (videoData: any) => {
    try {
      if (editingVideo) {
        await updateVideo(editingVideo.id, videoData);
      } else {
        await addVideo(videoData);
      }
      setShowForm(false);
      setEditingVideo(null);
    } catch (error) {
      logger.error('Error saving video', error as Error);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    try {
      await deleteVideo(id);
      toast.success('تم حذف الفيديو بنجاح');
    } catch (error) {
      logger.error('Error deleting video', error as Error);
      toast.error('فشل في حذف الفيديو');
    }
  };

  const handleEditVideo = (video: any) => {
    setEditingVideo(video);
    setShowForm(true);
  };

  const getVideoThumbnail = (video: any) => {
    if (video.thumbnail_url) {
      return video.thumbnail_url;
    }
    
    if (video.source_type === 'youtube' && video.video_url) {
      const videoId = extractYouTubeId(video.video_url);
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }
    }
    
    if (video.source_type === 'google_drive' && video.video_url) {
      const fileId = extractGoogleDriveId(video.video_url);
      if (fileId) {
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
      }
    }
    
    return '/placeholder.svg';
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getRolesBadges = (allowedRoles: string[]) => {
    const roleLabels = {
      all: 'الجميع',
      student: 'طلاب',
      teacher: 'معلمين',
      school_admin: 'إداريين'
    };

    return allowedRoles.map(role => (
      <Badge key={role} variant="outline" className="text-xs">
        {roleLabels[role as keyof typeof roleLabels] || role}
      </Badge>
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* الترويسة والأدوات */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Video className="h-6 w-6" />
            مكتبة فيديوهات الصف العاشر
          </h2>
          <p className="text-muted-foreground mt-1">
            {filteredVideos.length} فيديو متاح
          </p>
        </div>

        {canManageContent && (
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            إضافة فيديو جديد
          </Button>
        )}
      </div>

      {/* أدوات البحث والتصفية */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث في الفيديوهات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* قائمة الفيديوهات */}
      {filteredVideos.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد فيديوهات</h3>
            <p className="text-muted-foreground">
              {searchTerm || selectedCategory !== 'all'
                ? 'لم يتم العثور على فيديوهات تطابق المعايير المحددة'
                : 'لم يتم إضافة أي فيديوهات بعد'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <img
                  src={getVideoThumbnail(video)}
                  alt={video.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    size="sm"
                    onClick={() => setPreviewVideo(video)}
                    className="flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    مشاهدة
                  </Button>
                </div>
                
                {/* مؤشرات الحالة */}
                <div className="absolute top-2 right-2 flex gap-1">
                  {!video.is_visible && (
                    <Badge variant="secondary" className="text-xs">
                      <EyeOff className="h-3 w-3 mr-1" />
                      مخفي
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs bg-background/80">
                    {sourceTypeLabels[video.source_type as keyof typeof sourceTypeLabels]}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold line-clamp-2 mb-1">{video.title}</h3>
                    {video.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {video.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {getRolesBadges(video.allowed_roles || ['all'])}
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    {video.duration && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {video.duration}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(video.created_at)}
                    </div>
                  </div>

                  {canManageContent && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditVideo(video)}
                        className="flex-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        تعديل
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من حذف هذا الفيديو؟ لا يمكن التراجع عن هذا الإجراء.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteVideo(video.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* نموذج إضافة/تعديل الفيديو */}
      {showForm && (
        <Dialog open={showForm} onOpenChange={() => {
          setShowForm(false);
          setEditingVideo(null);
        }}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <Grade10VideoForm
              onSave={handleSaveVideo}
              onCancel={() => {
                setShowForm(false);
                setEditingVideo(null);
              }}
              initialData={editingVideo}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* معاينة الفيديو */}
      {previewVideo && (
        <Dialog open={!!previewVideo} onOpenChange={() => setPreviewVideo(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{previewVideo.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="w-full">
                {previewVideo.source_type === 'youtube' ? (
                  <iframe
                    src={previewVideo.video_url}
                    className="w-full h-96 rounded"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : previewVideo.source_type === 'google_drive' ? (
                  <iframe
                    src={previewVideo.video_url}
                    className="w-full h-96 rounded"
                    allow="autoplay"
                  />
                ) : (
                  <video
                    src={previewVideo.video_url}
                    controls
                    className="w-full h-96 rounded"
                  />
                )}
              </div>
              {previewVideo.description && (
                <div>
                  <h4 className="font-semibold mb-2">الوصف:</h4>
                  <p className="text-muted-foreground">{previewVideo.description}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Grade10VideoLibrary;