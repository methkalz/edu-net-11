import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, X } from 'lucide-react';
import { logger } from '@/lib/logger';

interface VideoFormProps {
  video?: any;
  onClose: () => void;
  onSave: (video: any) => void;
}

const VideoForm: React.FC<VideoFormProps> = ({ video, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: video?.title || '',
    description: video?.description || '',
    video_url: video?.video_url || '',
    duration: video?.duration || '',
    source_type: video?.source_type || 'upload' // 'upload', 'google_drive', 'url', 'youtube'
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingDuration, setIsLoadingDuration] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // هنا سيتم حفظ البيانات في قاعدة البيانات
    logger.info('حفظ بيانات الفيديو', { 
      title: formData.title,
      sourceType: formData.source_type,
      hasVideoUrl: !!formData.video_url,
      duration: formData.duration 
    });
    onSave(formData);
  };

  // دالة لتحويل الثواني إلى تنسيق MM:SS
  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // دالة للحصول على مدة الفيديو تلقائياً
  const getVideoDuration = (videoElement: HTMLVideoElement) => {
    return new Promise<string>((resolve) => {
      const onLoadedMetadata = () => {
        const duration = videoElement.duration;
        const formattedDuration = formatDuration(duration);
        videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
        resolve(formattedDuration);
      };
      
      videoElement.addEventListener('loadedmetadata', onLoadedMetadata);
      
      // إذا كانت البيانات محملة بالفعل
      if (videoElement.readyState >= 1) {
        onLoadedMetadata();
      }
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setIsLoadingDuration(true);
      handleInputChange('source_type', 'upload');
      
      try {
        // إنشاء رابط مؤقت للملف
        const tempUrl = URL.createObjectURL(file);
        handleInputChange('video_url', tempUrl);
        
        // الحصول على مدة الفيديو
        const video = document.createElement('video');
        video.src = tempUrl;
        const duration = await getVideoDuration(video);
        handleInputChange('duration', duration);
        
        // تنظيف الرابط المؤقت
        URL.revokeObjectURL(tempUrl);
        
        logger.info('رفع ملف الفيديو', { 
          fileName: file.name,
          fileSize: file.size,
          duration 
        });
      } catch (error) {
        logger.error('خطأ في الحصول على مدة الفيديو', error, { 
          fileName: file.name 
        });
        handleInputChange('duration', 'غير محدد');
      } finally {
        setIsUploading(false);
        setIsLoadingDuration(false);
      }
    }
  };

  const convertGoogleDriveUrl = (url: string) => {
    // تحويل رابط جوجل درايف إلى رابط قابل للمشاهدة
    const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (fileIdMatch) {
      const fileId = fileIdMatch[1];
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    return url;
  };

  const convertYouTubeUrl = (url: string) => {
    // تحويل رابط يوتيوب إلى رابط embed قابل للتشغيل
    let videoId = '';
    
    // التعامل مع أنواع مختلفة من روابط اليوتيوب
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0] || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('embed/')[1]?.split('?')[0] || '';
    }
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  const handleYouTubeUrl = async (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      setIsLoadingDuration(true);
      const convertedUrl = convertYouTubeUrl(url);
      handleInputChange('video_url', convertedUrl);
      handleInputChange('source_type', 'youtube');
      
      // لفيديوهات اليوتيوب، المدة غير متاحة عبر JavaScript بسبب قيود CORS
      try {
        handleInputChange('duration', 'جاري التحميل...');
        setTimeout(() => {
          handleInputChange('duration', 'غير محدد');
          setIsLoadingDuration(false);
        }, 1000);
      } catch (error) {
        logger.error('خطأ في الحصول على مدة فيديو اليوتيوب', error, { 
          url 
        });
        handleInputChange('duration', 'غير محدد');
        setIsLoadingDuration(false);
      }
    }
  };

  const handleGoogleDriveUrl = async (url: string) => {
    if (url.includes('drive.google.com')) {
      setIsLoadingDuration(true);
      const convertedUrl = convertGoogleDriveUrl(url);
      handleInputChange('video_url', convertedUrl);
      handleInputChange('source_type', 'google_drive');
      
      // محاولة الحصول على مدة الفيديو من جوجل درايف
      try {
        // لفيديوهات جوجل درايف، نحتاج طريقة مختلفة للحصول على المدة
        // حالياً سنضع قيمة افتراضية
        handleInputChange('duration', 'جاري التحميل...');
        setTimeout(() => {
          handleInputChange('duration', 'غير محدد');
          setIsLoadingDuration(false);
        }, 2000);
      } catch (error) {
        logger.error('خطأ في الحصول على مدة فيديو جوجل درايف', error, { 
          url 
        });
        handleInputChange('duration', 'غير محدد');
        setIsLoadingDuration(false);
      }
    } else {
      handleInputChange('video_url', url);
      handleInputChange('source_type', 'url');
      
      // للروابط الخارجية، محاولة الحصول على المدة
      if (url) {
        setIsLoadingDuration(true);
        try {
          const video = document.createElement('video');
          video.crossOrigin = 'anonymous';
          video.src = url;
          const duration = await getVideoDuration(video);
          handleInputChange('duration', duration);
        } catch (error) {
          logger.error('خطأ في الحصول على مدة الفيديو الخارجي', error, { 
            url 
          });
          handleInputChange('duration', 'غير محدد');
        } finally {
          setIsLoadingDuration(false);
        }
      }
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {video ? 'تعديل الفيديو' : 'إضافة فيديو جديد'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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
                />
              </div>

              <div>
                <Label htmlFor="description">وصف الفيديو</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="أدخل وصف مفصل للفيديو"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="duration">مدة الفيديو</Label>
                <div className="relative">
                  <Input
                    id="duration"
                    value={formData.duration}
                    readOnly
                    placeholder="سيتم تحديدها تلقائياً"
                    className="bg-muted cursor-not-allowed"
                  />
                  {isLoadingDuration && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  يتم تحديد المدة تلقائياً من الفيديو
                </p>
              </div>
            </CardContent>
          </Card>

          {/* رفع الفيديو */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">مصدر الفيديو</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* اختيار مصدر الفيديو */}
              <div>
                <Label>مصدر الفيديو</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <Button
                    type="button"
                    variant={formData.source_type === 'upload' ? 'default' : 'outline'}
                    onClick={() => handleInputChange('source_type', 'upload')}
                    className="w-full"
                  >
                    رفع ملف
                  </Button>
                  <Button
                    type="button"
                    variant={formData.source_type === 'youtube' ? 'default' : 'outline'}
                    onClick={() => handleInputChange('source_type', 'youtube')}
                    className="w-full"
                  >
                    يوتيوب
                  </Button>
                  <Button
                    type="button"
                    variant={formData.source_type === 'google_drive' ? 'default' : 'outline'}
                    onClick={() => handleInputChange('source_type', 'google_drive')}
                    className="w-full"
                  >
                    جوجل درايف
                  </Button>
                  <Button
                    type="button"
                    variant={formData.source_type === 'url' ? 'default' : 'outline'}
                    onClick={() => handleInputChange('source_type', 'url')}
                    className="w-full"
                  >
                    رابط خارجي
                  </Button>
                </div>
              </div>

              {/* رفع ملف محلي */}
              {formData.source_type === 'upload' && (
                <div>
                  <Label htmlFor="video-upload">رفع ملف الفيديو</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    {formData.video_url && formData.source_type === 'upload' ? (
                      <div className="space-y-2">
                        <video 
                          src={formData.video_url} 
                          controls 
                          className="w-full max-h-48 rounded"
                          onLoadedMetadata={async (e) => {
                            const duration = await getVideoDuration(e.currentTarget);
                            handleInputChange('duration', duration);
                          }}
                        />
                        <Button
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
                      <div className="space-y-2">
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
                          الحد الأقصى: 100MB | الأنواع المدعومة: MP4, AVI, MOV
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* جوجل درايف */}
              {formData.source_type === 'google_drive' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="google_drive_url">رابط جوجل درايف</Label>
                    <Input
                      id="google_drive_url"
                      value={formData.video_url}
                      onChange={(e) => handleGoogleDriveUrl(e.target.value)}
                      placeholder="https://drive.google.com/file/d/..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      انسخ رابط الملف من جوجل درايف (تأكد من أن الملف قابل للمشاهدة للجميع)
                    </p>
                  </div>
                  
                  {formData.video_url && (
                    <div className="space-y-2">
                      <Label>معاينة الفيديو</Label>
                      <iframe 
                        src={formData.video_url}
                        className="w-full h-48 rounded border"
                        allow="autoplay"
                        onLoad={() => {
                          // لفيديوهات جوجل درايف، المدة قد لا تكون متاحة
                          if (formData.duration === 'جاري التحميل...') {
                            handleInputChange('duration', 'غير محدد');
                            setIsLoadingDuration(false);
                          }
                        }}
                      />
                    </div>
                  )}

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      كيفية الحصول على رابط جوجل درايف:
                    </h4>
                    <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                      <li>ارفع الفيديو إلى جوجل درايف</li>
                      <li>انقر بزر الماوس الأيمن على الملف واختر "مشاركة"</li>
                      <li>غير إعدادات المشاركة إلى "يمكن لأي شخص لديه الرابط المشاهدة"</li>
                      <li>انسخ الرابط والصقه هنا</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* يوتيوب */}
              {formData.source_type === 'youtube' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="youtube_url">رابط فيديو اليوتيوب</Label>
                    <Input
                      id="youtube_url"
                      value={formData.video_url}
                      onChange={(e) => handleYouTubeUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=... أو https://youtu.be/..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      انسخ رابط فيديو اليوتيوب المراد إضافته
                    </p>
                  </div>
                  
                  {formData.video_url && (
                    <div className="space-y-2">
                      <Label>معاينة الفيديو</Label>
                      <iframe 
                        src={formData.video_url}
                        className="w-full h-48 rounded border"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        onLoad={() => {
                          // لفيديوهات اليوتيوب، المدة قد لا تكون متاحة بسبب قيود API
                          if (formData.duration === 'جاري التحميل...') {
                            handleInputChange('duration', 'غير محدد');
                            setIsLoadingDuration(false);
                          }
                        }}
                      />
                    </div>
                  )}

                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">
                      كيفية إضافة فيديو من اليوتيوب:
                    </h4>
                    <ol className="text-sm text-red-800 dark:text-red-200 space-y-1 list-decimal list-inside">
                      <li>انتقل إلى فيديو اليوتيوب المطلوب</li>
                      <li>انقر على زر "مشاركة" أسفل الفيديو</li>
                      <li>انسخ الرابط من النافذة المنبثقة</li>
                      <li>الصق الرابط في الحقل أعلاه</li>
                    </ol>
                    <p className="text-xs text-red-700 dark:text-red-300 mt-2">
                      ملاحظة: تأكد من أن الفيديو متاح للمشاهدة العامة وغير محظور في منطقتك
                    </p>
                  </div>
                </div>
              )}

              {/* رابط خارجي */}
              {formData.source_type === 'url' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="external_url">رابط الفيديو الخارجي</Label>
                    <Input
                      id="external_url"
                      value={formData.video_url}
                      onChange={(e) => {
                        const url = e.target.value;
                        handleInputChange('video_url', url);
                        handleInputChange('source_type', 'url');
                        
                        // محاولة الحصول على مدة الفيديو للروابط الخارجية
                        if (url && url.startsWith('http')) {
                          setIsLoadingDuration(true);
                          const video = document.createElement('video');
                          video.crossOrigin = 'anonymous';
                          video.src = url;
                          getVideoDuration(video)
                            .then(duration => {
                              handleInputChange('duration', duration);
                            })
                            .catch(() => {
                              handleInputChange('duration', 'غير محدد');
                            })
                            .finally(() => {
                              setIsLoadingDuration(false);
                            });
                        }
                      }}
                      placeholder="https://example.com/video.mp4"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      أدخل رابط مباشر للفيديو (YouTube, Vimeo, أو أي رابط مباشر)
                    </p>
                  </div>
                  
                  {formData.video_url && (
                    <div className="space-y-2">
                      <Label>معاينة الفيديو</Label>
                      <video 
                        src={formData.video_url} 
                        controls 
                        className="w-full max-h-48 rounded"
                        onLoadedMetadata={async (e) => {
                          const duration = await getVideoDuration(e.currentTarget);
                          handleInputChange('duration', duration);
                          setIsLoadingDuration(false);
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* أزرار الحفظ والإلغاء */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!formData.title || isUploading || isLoadingDuration}
            >
              {isUploading ? 'جاري الرفع...' : isLoadingDuration ? 'جاري تحديد المدة...' : 'حفظ'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoForm;