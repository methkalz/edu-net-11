import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useGrade12Content } from '@/hooks/useGrade12Content';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import { Video, Upload, Link, Globe } from 'lucide-react';

interface Grade12VideoFormProps {
  video?: any;
  onClose: () => void;
  onSave: () => void;
}

const Grade12VideoForm: React.FC<Grade12VideoFormProps> = ({
  video,
  onClose,
  onSave
}) => {
  const { addVideo, updateVideo } = useGrade12Content();
  
  const [formData, setFormData] = useState({
    title: video?.title || '',
    description: video?.description || '',
    video_url: video?.video_url || '',
    category: video?.category || 'general',
    duration: video?.duration || '',
    thumbnail_url: video?.thumbnail_url || '',
    source_type: video?.source_type || 'youtube',
    is_visible: video?.is_visible ?? true,
    is_active: video?.is_active ?? true,
    allowed_roles: video?.allowed_roles || ['all'],
    order_index: video?.order_index || 0,
  });

  const [loading, setLoading] = useState(false);

  // قائمة أنواع المصادر
  const sourceTypes = [
    { value: 'youtube', label: 'YouTube', icon: Globe },
    { value: 'google_drive', label: 'Google Drive', icon: Upload },
    { value: 'vimeo', label: 'Vimeo', icon: Globe },
    { value: 'direct', label: 'رابط مباشر', icon: Link },
    { value: 'upload', label: 'رفع ملف', icon: Upload },
  ];

  // قائمة الفئات
  const categories = [
    { value: 'general', label: 'عام' },
    { value: 'lessons', label: 'دروس' },
    { value: 'tutorials', label: 'شروحات' },
    { value: 'projects', label: 'مشاريع' },
    { value: 'examples', label: 'أمثلة' },
    { value: 'reviews', label: 'مراجعات' },
  ];

  // قائمة الأدوار المسموح لها
  const roleOptions = [
    { value: 'all', label: 'الجميع' },
    { value: 'student', label: 'الطلاب' },
    { value: 'teacher', label: 'المعلمون' },
    { value: 'school_admin', label: 'مدراء المدارس' },
  ];

  // استخراج معرف فيديو YouTube من الرابط
  const extractYouTubeId = (url: string): string | null => {
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/)?([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  // استخراج معرف فيديو Google Drive من الرابط
  const extractGoogleDriveId = (url: string): string | null => {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  // تحويل رابط Google Drive إلى رابط تضمين
  const convertGoogleDriveUrl = (url: string): string => {
    const fileId = extractGoogleDriveId(url);
    if (fileId) {
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    return url;
  };

  // توليد رابط الصورة المصغرة تلقائياً
  const generateThumbnail = (url: string, sourceType: string) => {
    if (sourceType === 'youtube') {
      const videoId = extractYouTubeId(url);
      if (videoId) {
        setFormData(prev => ({
          ...prev,
          thumbnail_url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
        }));
      }
    } else if (sourceType === 'google_drive') {
      const fileId = extractGoogleDriveId(url);
      if (fileId) {
        setFormData(prev => ({
          ...prev,
          thumbnail_url: `https://drive.google.com/thumbnail?id=${fileId}&sz=w320-h180`
        }));
      }
    }
  };

  // معالجة تغيير الرابط
  const handleUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, video_url: url }));
    
    // توليد الصورة المصغرة تلقائياً
    if ((formData.source_type === 'youtube' || formData.source_type === 'google_drive') && url) {
      generateThumbnail(url, formData.source_type);
    }
  };

  // معالجة تغيير نوع المصدر
  const handleSourceTypeChange = (sourceType: string) => {
    setFormData(prev => ({ ...prev, source_type: sourceType }));
    
    // توليد الصورة المصغرة إذا كان هناك رابط موجود
    if ((sourceType === 'youtube' || sourceType === 'google_drive') && formData.video_url) {
      generateThumbnail(formData.video_url, sourceType);
    }
  };

  // معالجة الحفظ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.video_url.trim()) {
      toast.error('يرجى ملء العنوان والرابط');
      return;
    }

    setLoading(true);
    
    try {
      const videoData = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        video_url: formData.source_type === 'google_drive' ? 
          convertGoogleDriveUrl(formData.video_url.trim()) : 
          formData.video_url.trim(),
        thumbnail_url: formData.thumbnail_url.trim(),
        allowed_roles: formData.allowed_roles.length > 0 ? formData.allowed_roles : ['all'],
        grade_level: '12',
      };

      if (video) {
        await updateVideo(videoData);
        toast.success('تم تحديث الفيديو بنجاح');
      } else {
        await addVideo(videoData);
        toast.success('تم إضافة الفيديو بنجاح');
      }
      
      onSave();
    } catch (error) {
      logger.error('Error saving video', error as Error);
      toast.error('حدث خطأ أثناء حفظ الفيديو');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            {video ? 'تعديل الفيديو' : 'إضافة فيديو جديد'}
          </DialogTitle>
          <DialogDescription>
            {video ? 'قم بتعديل بيانات الفيديو' : 'أضف فيديو جديد إلى مكتبة الصف الثاني عشر'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* عنوان الفيديو */}
          <div className="space-y-2">
            <Label htmlFor="title">عنوان الفيديو *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="أدخل عنوان الفيديو"
              required
            />
          </div>

          {/* وصف الفيديو */}
          <div className="space-y-2">
            <Label htmlFor="description">وصف الفيديو</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="اكتب وصفاً للفيديو..."
              rows={3}
            />
          </div>

          {/* نوع المصدر */}
          <div className="space-y-2">
            <Label htmlFor="source-type">نوع المصدر</Label>
            <Select value={formData.source_type} onValueChange={handleSourceTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع المصدر" />
              </SelectTrigger>
              <SelectContent>
                {sourceTypes.map((source) => {
                  const IconComponent = source.icon;
                  return (
                    <SelectItem key={source.value} value={source.value}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        {source.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* رابط الفيديو */}
          <div className="space-y-2">
            <Label htmlFor="video-url">رابط الفيديو *</Label>
            <Input
              id="video-url"
              value={formData.video_url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder={
                formData.source_type === 'youtube' ? 'https://www.youtube.com/watch?v=...' :
                formData.source_type === 'google_drive' ? 'https://drive.google.com/file/d/your-file-id/view' :
                formData.source_type === 'vimeo' ? 'https://vimeo.com/...' :
                'https://example.com/video.mp4'
              }
              required
            />
            {formData.source_type === 'youtube' && (
              <p className="text-xs text-muted-foreground">
                يمكنك نسخ الرابط من شريط العنوان أو من زر المشاركة في YouTube
              </p>
            )}
            {formData.source_type === 'google_drive' && (
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• انقر بزر الماوس الأيمن على الفيديو في Google Drive</p>
                <p>• اختر "الحصول على رابط" أو "Get Link"</p>
                <p>• تأكد من أن الصلاحية "Anyone with the link" مفعلة</p>
                <p>• انسخ الرابط واطع هنا</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* الفئة */}
            <div className="space-y-2">
              <Label htmlFor="category">الفئة</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* مدة الفيديو */}
            <div className="space-y-2">
              <Label htmlFor="duration">مدة الفيديو</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="مثال: 10:30"
              />
            </div>
          </div>

          {/* رابط الصورة المصغرة */}
          <div className="space-y-2">
            <Label htmlFor="thumbnail">رابط الصورة المصغرة</Label>
            <Input
              id="thumbnail"
              value={formData.thumbnail_url}
              onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
              placeholder="https://example.com/thumbnail.jpg"
            />
            {(formData.source_type === 'youtube' || formData.source_type === 'google_drive') && (
              <p className="text-xs text-muted-foreground">
                سيتم توليد الصورة المصغرة تلقائياً من {formData.source_type === 'youtube' ? 'YouTube' : 'Google Drive'}
              </p>
            )}
          </div>

          {/* الأدوار المسموح لها */}
          <div className="space-y-2">
            <Label>الأدوار المسموح لها بالمشاهدة</Label>
            <div className="grid grid-cols-2 gap-2">
              {roleOptions.map((role) => (
                <div key={role.value} className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    id={role.value}
                    checked={formData.allowed_roles.includes(role.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          allowed_roles: [...formData.allowed_roles, role.value]
                        });
                      } else {
                        setFormData({
                          ...formData,
                          allowed_roles: formData.allowed_roles.filter(r => r !== role.value)
                        });
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor={role.value} className="text-sm font-normal">
                    {role.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ترتيب العرض */}
            <div className="space-y-2">
              <Label htmlFor="order">ترتيب العرض</Label>
              <Input
                id="order"
                type="number"
                value={formData.order_index}
                onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>

            {/* إعدادات الرؤية */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  id="visible"
                  checked={formData.is_visible}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_visible: checked })}
                />
                <Label htmlFor="visible">مرئي للطلاب</Label>
              </div>
              
              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="active">نشط</Label>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'جاري الحفظ...' : video ? 'تحديث الفيديو' : 'إضافة الفيديو'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default Grade12VideoForm;