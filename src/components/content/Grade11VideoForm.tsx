import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, X, Link, Upload, ImageIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Grade11VideoFormProps {
  onSave: (videoData: any) => Promise<void>;
  onCancel: () => void;
  initialData?: any;
}

const Grade11VideoForm: React.FC<Grade11VideoFormProps> = ({
  onSave,
  onCancel,
  initialData
}) => {
  const { userProfile } = useAuth();
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    video_url: initialData?.video_url || '',
    thumbnail_url: initialData?.thumbnail_url || '',
    duration: initialData?.duration || '',
    source_type: initialData?.source_type || 'youtube',
    category: initialData?.category || '',
    ...initialData
  });
  const [loading, setLoading] = useState(false);
  const [thumbnailMode, setThumbnailMode] = useState<'url' | 'upload'>('url');
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>(initialData?.thumbnail_url || '');

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'خطأ',
        description: 'الرجاء اختيار ملف صورة',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'خطأ',
        description: 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت',
        variant: 'destructive'
      });
      return;
    }

    setUploadingThumbnail(true);
    try {
      // Create unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `grade11-videos/${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('grade11_thumbnails')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('grade11_thumbnails')
        .getPublicUrl(filePath);

      setFormData({ ...formData, thumbnail_url: publicUrl });
      setThumbnailPreview(publicUrl);
      
      toast({
        title: 'تم الرفع بنجاح',
        description: 'تم رفع الصورة المصغرة بنجاح'
      });
    } catch (error) {
      logger.error('Error uploading thumbnail', error as Error);
      toast({
        title: 'خطأ',
        description: 'فشل رفع الصورة المصغرة',
        variant: 'destructive'
      });
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.video_url.trim()) return;

    setLoading(true);
    try {
      await onSave({
        ...formData,
        owner_user_id: userProfile?.user_id,
        school_id: userProfile?.school_id,
        grade_level: '11'
      });
      onCancel();
    } catch (error) {
      logger.error('Error saving video', error as Error);
    } finally {
      setLoading(false);
    }
  };

  const sourceTypeOptions = [
    { value: 'youtube', label: 'YouTube' },
    { value: 'vimeo', label: 'Vimeo' },
    { value: 'direct', label: 'رابط مباشر' }
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          {initialData ? 'تعديل الفيديو' : 'إضافة فيديو جديد'}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="space-y-2">
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="أدخل وصف الفيديو"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="video_url">رابط الفيديو *</Label>
            <Input
              id="video_url"
              value={formData.video_url}
              onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
              placeholder="أدخل رابط الفيديو"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source_type">نوع المصدر</Label>
            <Select
              value={formData.source_type}
              onValueChange={(value) => setFormData({ ...formData, source_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع المصدر" />
              </SelectTrigger>
              <SelectContent>
                {sourceTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>الصورة المصغرة</Label>
            
            {/* Mode selector */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={thumbnailMode === 'url' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setThumbnailMode('url')}
                className="flex-1"
              >
                <Link className="h-4 w-4 mr-2" />
                رابط
              </Button>
              <Button
                type="button"
                variant={thumbnailMode === 'upload' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setThumbnailMode('upload')}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                رفع صورة
              </Button>
            </div>

            {/* URL input */}
            {thumbnailMode === 'url' && (
              <Input
                id="thumbnail_url"
                value={formData.thumbnail_url}
                onChange={(e) => {
                  setFormData({ ...formData, thumbnail_url: e.target.value });
                  setThumbnailPreview(e.target.value);
                }}
                placeholder="أدخل رابط الصورة المصغرة"
              />
            )}

            {/* File upload */}
            {thumbnailMode === 'upload' && (
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  disabled={uploadingThumbnail}
                />
                {uploadingThumbnail && (
                  <p className="text-sm text-muted-foreground">جاري رفع الصورة...</p>
                )}
              </div>
            )}

            {/* Preview */}
            {thumbnailPreview && (
              <div className="relative rounded-lg overflow-hidden border bg-muted aspect-video max-w-xs">
                <img 
                  src={thumbnailPreview} 
                  alt="معاينة الصورة المصغرة"
                  className="w-full h-full object-cover"
                  onError={() => setThumbnailPreview('')}
                />
                <div className="absolute top-2 right-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setFormData({ ...formData, thumbnail_url: '' });
                      setThumbnailPreview('');
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">مدة الفيديو</Label>
            <Input
              id="duration"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="مثال: 15:30"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">الفئة التعليمية</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="مثال: شبكات، برمجة، إلخ"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading || !formData.title.trim() || !formData.video_url.trim()}>
              {loading ? 'جاري الحفظ...' : (initialData ? 'تحديث' : 'حفظ')}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              إلغاء
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default Grade11VideoForm;