import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, X, Link, Upload, Clock, Tag, CheckCircle2 } from 'lucide-react';
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
    <Card className="w-full max-w-3xl mx-auto shadow-xl border-2">
      {/* Header */}
      <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Video className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">
                {initialData ? 'تعديل الفيديو' : 'إضافة فيديو جديد'}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                أكمل المعلومات لإضافة فيديو تعليمي
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      
      {/* Scrollable Content */}
      <ScrollArea className="h-[60vh] max-h-[600px]">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="basic" className="gap-2">
                  <Video className="h-4 w-4" />
                  معلومات أساسية
                </TabsTrigger>
                <TabsTrigger value="thumbnail" className="gap-2">
                  <Upload className="h-4 w-4" />
                  الصورة المصغرة
                </TabsTrigger>
                <TabsTrigger value="additional" className="gap-2">
                  <Tag className="h-4 w-4" />
                  معلومات إضافية
                </TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="title" className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    عنوان الفيديو *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="مثال: شرح بروتوكولات الشبكات"
                    required
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    وصف الفيديو
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="وصف مختصر للفيديو ومحتواه..."
                    rows={4}
                    className="text-base resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="video_url" className="flex items-center gap-2">
                    <Link className="h-4 w-4" />
                    رابط الفيديو *
                  </Label>
                  <Input
                    id="video_url"
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    placeholder="https://youtube.com/watch?v=..."
                    required
                    className="text-base font-mono text-sm"
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground">
                    يدعم YouTube, Vimeo, Google Drive وروابط مباشرة
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source_type">نوع المصدر</Label>
                  <Select
                    value={formData.source_type}
                    onValueChange={(value) => setFormData({ ...formData, source_type: value })}
                  >
                    <SelectTrigger className="text-base">
                      <SelectValue placeholder="اختر نوع المصدر" />
                    </SelectTrigger>
                    <SelectContent>
                      {sourceTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-base">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              {/* Thumbnail Tab */}
              <TabsContent value="thumbnail" className="space-y-5">
                <div className="space-y-4">
                  <Label className="text-base font-medium">طريقة إضافة الصورة المصغرة</Label>
                  
                  {/* Mode selector with improved design */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant={thumbnailMode === 'url' ? 'default' : 'outline'}
                      onClick={() => setThumbnailMode('url')}
                      className="h-auto py-4 flex-col gap-2"
                    >
                      <Link className="h-6 w-6" />
                      <span className="text-sm font-medium">رابط مباشر</span>
                    </Button>
                    <Button
                      type="button"
                      variant={thumbnailMode === 'upload' ? 'default' : 'outline'}
                      onClick={() => setThumbnailMode('upload')}
                      className="h-auto py-4 flex-col gap-2"
                    >
                      <Upload className="h-6 w-6" />
                      <span className="text-sm font-medium">رفع صورة</span>
                    </Button>
                  </div>

                  {/* URL input */}
                  {thumbnailMode === 'url' && (
                    <div className="space-y-2 animate-in fade-in duration-300">
                      <Input
                        id="thumbnail_url"
                        value={formData.thumbnail_url}
                        onChange={(e) => {
                          setFormData({ ...formData, thumbnail_url: e.target.value });
                          setThumbnailPreview(e.target.value);
                        }}
                        placeholder="https://example.com/image.jpg"
                        className="text-base font-mono text-sm"
                        dir="ltr"
                      />
                    </div>
                  )}

                  {/* File upload */}
                  {thumbnailMode === 'upload' && (
                    <div className="space-y-3 animate-in fade-in duration-300">
                      <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleThumbnailUpload}
                          disabled={uploadingThumbnail}
                          className="cursor-pointer"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          PNG, JPG أو WEBP (حد أقصى 5 ميجابايت)
                        </p>
                      </div>
                      {uploadingThumbnail && (
                        <div className="flex items-center justify-center gap-2 text-sm text-primary">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                          جاري رفع الصورة...
                        </div>
                      )}
                    </div>
                  )}

                  {/* Preview */}
                  {thumbnailPreview && (
                    <div className="space-y-2 animate-in fade-in duration-300">
                      <Label className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        معاينة الصورة المصغرة
                      </Label>
                      <div className="relative rounded-lg overflow-hidden border-2 bg-muted aspect-video">
                        <img 
                          src={thumbnailPreview} 
                          alt="معاينة"
                          className="w-full h-full object-cover"
                          onError={() => setThumbnailPreview('')}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => {
                            setFormData({ ...formData, thumbnail_url: '' });
                            setThumbnailPreview('');
                          }}
                          className="absolute top-2 right-2 rounded-full"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Additional Info Tab */}
              <TabsContent value="additional" className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="duration" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    مدة الفيديو
                  </Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="15:30"
                    className="text-base"
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground">
                    مثال: 15:30 (15 دقيقة و 30 ثانية)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    الفئة التعليمية
                  </Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="شبكات، برمجة، أمن المعلومات..."
                    className="text-base"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </form>
        </CardContent>
      </ScrollArea>

      {/* Footer with Actions */}
      <div className="border-t bg-muted/30 p-4">
        <div className="flex justify-end gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="min-w-[100px]"
          >
            إلغاء
          </Button>
          <Button 
            type="submit" 
            disabled={loading || !formData.title.trim() || !formData.video_url.trim()}
            onClick={handleSubmit}
            className="min-w-[120px] gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                {initialData ? 'تحديث' : 'حفظ'}
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default Grade11VideoForm;