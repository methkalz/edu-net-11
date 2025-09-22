import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, X, Video, Youtube, Globe, HardDrive, FolderOpen } from 'lucide-react';
import { logger } from '@/lib/logger';
import SharedMediaPicker from './SharedMediaPicker';
import type { SharedMediaFile } from '@/hooks/useSharedMediaLibrary';

interface LessonVideoFormProps {
  onSave: (videoData: any) => void;
  onCancel: () => void;
}

const LessonVideoForm: React.FC<LessonVideoFormProps> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    duration: '',
    source_type: 'upload',
    thumbnail_url: ''
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingDuration, setIsLoadingDuration] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [selectedTab, setSelectedTab] = useState('upload');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setIsLoadingDuration(true);

    try {
      // في التطبيق الحقيقي، يجب رفع الملف إلى Supabase Storage
      const tempUrl = URL.createObjectURL(file);
      handleInputChange('video_url', tempUrl);
      handleInputChange('source_type', 'upload');

      // محاولة الحصول على مدة الفيديو
      const video = document.createElement('video');
      video.src = tempUrl;
      
      video.onloadedmetadata = () => {
        const duration = Math.floor(video.duration);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        handleInputChange('duration', formattedDuration);
        setIsLoadingDuration(false);
      };

      video.onerror = () => {
        handleInputChange('duration', 'غير محدد');
        setIsLoadingDuration(false);
      };
    } catch (error) {
      logger.error('Error uploading video', error as Error);
      handleInputChange('duration', 'غير محدد');
      setIsLoadingDuration(false);
    } finally {
      setIsUploading(false);
    }
  };

  const handleYouTubeUrl = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      // تحويل رابط اليوتيوب إلى embed
      let videoId = '';
      if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1]?.split('&')[0] || '';
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
      }
      
      if (videoId) {
        const embedUrl = `https://www.youtube.com/embed/${videoId}`;
        handleInputChange('video_url', embedUrl);
        handleInputChange('source_type', 'youtube');
        handleInputChange('thumbnail_url', `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
      }
    }
  };

  const handleGoogleDriveUrl = (url: string) => {
    if (url.includes('drive.google.com')) {
      const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
      if (fileIdMatch) {
        const fileId = fileIdMatch[1];
        const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
        handleInputChange('video_url', embedUrl);
        handleInputChange('source_type', 'google_drive');
      }
    }
  };

  const handleUrlInput = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      handleYouTubeUrl(url);
    } else if (url.includes('drive.google.com')) {
      handleGoogleDriveUrl(url);
    } else {
      handleInputChange('video_url', url);
      handleInputChange('source_type', 'url');
    }
  };

  const handleSelectFromLibrary = (mediaFile: SharedMediaFile) => {
    setFormData(prev => ({
      ...prev,
      title: prev.title || mediaFile.file_name,
      video_url: mediaFile.file_path,
      source_type: 'library',
      duration: mediaFile.metadata?.duration || '',
      thumbnail_url: mediaFile.metadata?.thumbnail_url || ''
    }));
    setShowMediaPicker(false);
    setSelectedTab('library');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      file_path: formData.video_url,
      file_name: formData.title
    });
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onCancel}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              إضافة فيديو للدرس
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* معلومات الفيديو */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">معلومات الفيديو</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">عنوان الفيديو</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="أدخل عنوان الفيديو"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">وصف الفيديو</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="أدخل وصف للفيديو"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* مصدر الفيديو */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">مصدر الفيديو</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="upload" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      رفع جديد
                    </TabsTrigger>
                    <TabsTrigger value="url" className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      رابط خارجي
                    </TabsTrigger>
                    <TabsTrigger value="library" className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4" />
                      من المكتبة
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      <Button
                        type="button"
                        variant={formData.source_type === 'upload' ? 'default' : 'outline'}
                        onClick={() => handleInputChange('source_type', 'upload')}
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        رفع ملف من الجهاز
                      </Button>
                    </div>

                    {formData.source_type === 'upload' && (
                      <div>
                        <Label htmlFor="video-upload">رفع ملف الفيديو</Label>
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                          {formData.video_url ? (
                            <div className="space-y-3">
                              <video
                                src={formData.video_url}
                                controls
                                className="w-full max-h-48 rounded"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  handleInputChange('video_url', '');
                                  handleInputChange('duration', '');
                                }}
                              >
                                <X className="h-4 w-4 ml-1" />
                                إزالة
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                              <div>
                                <Label htmlFor="video-upload" className="cursor-pointer">
                                  <span className="text-primary hover:underline">
                                    اختر ملف فيديو
                                  </span>
                                  <span className="text-muted-foreground"> أو اسحبه هنا</span>
                                </Label>
                                <Input
                                  id="video-upload"
                                  type="file"
                                  accept="video/*"
                                  className="hidden"
                                  onChange={handleFileUpload}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground">
                                أنواع مدعومة: MP4, AVI, MOV
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="url" className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant={formData.source_type === 'youtube' ? 'default' : 'outline'}
                        onClick={() => handleInputChange('source_type', 'youtube')}
                        className="flex items-center gap-2"
                      >
                        <Youtube className="h-4 w-4" />
                        يوتيوب
                      </Button>
                      <Button
                        type="button"
                        variant={formData.source_type === 'google_drive' ? 'default' : 'outline'}
                        onClick={() => handleInputChange('source_type', 'google_drive')}
                        className="flex items-center gap-2"
                      >
                        <HardDrive className="h-4 w-4" />
                        جوجل درايف
                      </Button>
                      <Button
                        type="button"
                        variant={formData.source_type === 'url' ? 'default' : 'outline'}
                        onClick={() => handleInputChange('source_type', 'url')}
                        className="flex items-center gap-2"
                      >
                        <Globe className="h-4 w-4" />
                        رابط مباشر
                      </Button>
                    </div>

                    <div>
                      <Label htmlFor="video_url">
                        {formData.source_type === 'youtube' && 'رابط يوتيوب'}
                        {formData.source_type === 'google_drive' && 'رابط جوجل درايف'}
                        {formData.source_type === 'url' && 'رابط الفيديو'}
                      </Label>
                      <Input
                        id="video_url"
                        value={formData.video_url}
                        onChange={(e) => handleUrlInput(e.target.value)}
                        placeholder={
                          formData.source_type === 'youtube' 
                            ? 'https://www.youtube.com/watch?v=...'
                            : formData.source_type === 'google_drive'
                            ? 'https://drive.google.com/file/d/...'
                            : 'https://example.com/video.mp4'
                        }
                        required
                      />
                    </div>

                    {formData.video_url && (
                      <div>
                        <Label>معاينة الفيديو</Label>
                        <div className="mt-2">
                          {formData.source_type === 'youtube' || formData.source_type === 'google_drive' ? (
                            <iframe
                              src={formData.video_url}
                              className="w-full h-48 rounded border"
                              allow="autoplay; encrypted-media"
                            />
                          ) : (
                            <video
                              src={formData.video_url}
                              controls
                              className="w-full max-h-48 rounded"
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="library" className="space-y-4">
                    <div className="text-center py-8">
                      <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">
                        اختر فيديو من الملفات المرفوعة سابقاً
                      </p>
                      <Button onClick={() => setShowMediaPicker(true)}>
                        تصفح المكتبة
                      </Button>
                    </div>

                    {formData.source_type === 'library' && formData.video_url && (
                      <div>
                        <Label>الفيديو المختار</Label>
                        <div className="mt-2 p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Video className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium">{formData.title}</p>
                              <p className="text-sm text-muted-foreground">من المكتبة المشتركة</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                handleInputChange('video_url', '');
                                handleInputChange('source_type', 'upload');
                                setSelectedTab('upload');
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* أزرار التحكم */}
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={onCancel}>
                إلغاء
              </Button>
              <Button type="submit" disabled={!formData.title || !formData.video_url}>
                إضافة الفيديو
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <SharedMediaPicker
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelectMedia={handleSelectFromLibrary}
        mediaType="video"
      />
    </>
  );
};

export default LessonVideoForm;