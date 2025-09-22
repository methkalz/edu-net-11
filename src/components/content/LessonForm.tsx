import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, X, Image, Sparkles } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import { logger } from '@/lib/logger';

interface LessonFormProps {
  lesson?: any;
  onClose: () => void;
  onSave: (lesson: any) => void;
}

const LessonForm: React.FC<LessonFormProps> = ({ lesson, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: lesson?.title || '',
    content: lesson?.content || '',
    summary: lesson?.summary || ''
  });

  const [media, setMedia] = useState({
    images: lesson?.images || [],
    animations: lesson?.animations || [],
    lottieFiles: lesson?.lottie_files || []
  });

  const [isUploading, setIsUploading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContentChange = (content: string) => {
    handleInputChange('content', content);
  };

  const handleSave = () => {
    const lessonData = {
      ...formData,
      ...media
    };
    logger.debug('Saving lesson data', { 
      lessonTitle: formData.title, 
      hasMedia: Object.keys(media).length > 0 
    });
    onSave(lessonData);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setIsUploading(true);
      
      // محاكاة رفع الصور
      setTimeout(() => {
        const newImages = files.map(file => ({
          id: Date.now() + Math.random(),
          name: file.name,
          url: URL.createObjectURL(file),
          alt: file.name
        }));
        
        setMedia(prev => ({
          ...prev,
          images: [...prev.images, ...newImages]
        }));
        setIsUploading(false);
      }, 2000);
    }
  };

  const handleAnimationUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setIsUploading(true);
      
      // محاكاة رفع الرسوم المتحركة
      setTimeout(() => {
        const newAnimations = files.map(file => ({
          id: Date.now() + Math.random(),
          name: file.name,
          url: URL.createObjectURL(file),
          type: file.type
        }));
        
        setMedia(prev => ({
          ...prev,
          animations: [...prev.animations, ...newAnimations]
        }));
        setIsUploading(false);
      }, 2000);
    }
  };

  const handleLottieUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setIsUploading(true);
      
      // محاكاة رفع ملفات Lottie
      setTimeout(() => {
        const newLottieFiles = files.map(file => ({
          id: Date.now() + Math.random(),
          name: file.name,
          url: URL.createObjectURL(file)
        }));
        
        setMedia(prev => ({
          ...prev,
          lottieFiles: [...prev.lottieFiles, ...newLottieFiles]
        }));
        setIsUploading(false);
      }, 2000);
    }
  };

  const removeMediaItem = (type: 'images' | 'animations' | 'lottieFiles', id: any) => {
    setMedia(prev => ({
      ...prev,
      [type]: prev[type].filter((item: any) => item.id !== id)
    }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {lesson ? 'تعديل الدرس' : 'إضافة درس جديد'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="content" dir="rtl">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="content">المحتوى النصي</TabsTrigger>
            <TabsTrigger value="media">الوسائط المتعددة</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6">
            {/* معلومات الدرس */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">معلومات الدرس</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">عنوان الدرس</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="أدخل عنوان الدرس"
                  />
                </div>

                <div>
                  <Label htmlFor="summary">ملخص الدرس</Label>
                  <Textarea
                    id="summary"
                    value={formData.summary}
                    onChange={(e) => handleInputChange('summary', e.target.value)}
                    placeholder="أدخل ملخص مختصر للدرس"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* محرر المحتوى */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">محتوى الدرس</CardTitle>
              </CardHeader>
              <CardContent>
                <RichTextEditor
                  content={formData.content}
                  onChange={handleContentChange}
                  placeholder="اكتب محتوى الدرس هنا..."
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media" className="space-y-6">
            {/* الصور */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  الصور
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                  <div className="text-center space-y-2">
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                    <div>
                      <Label htmlFor="image-upload" className="cursor-pointer">
                        <span className="text-primary hover:underline">
                          اختر صور
                        </span>
                        <span className="text-muted-foreground"> أو اسحبها هنا</span>
                      </Label>
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </div>
                  </div>
                </div>

                {media.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    {media.images.map((image: any) => (
                      <div key={image.id} className="relative group">
                        <img 
                          src={image.url} 
                          alt={image.alt}
                          className="w-full h-24 object-cover rounded border"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeMediaItem('images', image.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* الرسوم المتحركة */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  الرسوم المتحركة (GIF)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                  <div className="text-center space-y-2">
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                    <div>
                      <Label htmlFor="animation-upload" className="cursor-pointer">
                        <span className="text-primary hover:underline">
                          اختر رسوم متحركة
                        </span>
                        <span className="text-muted-foreground"> أو اسحبها هنا</span>
                      </Label>
                      <Input
                        id="animation-upload"
                        type="file"
                        accept=".gif,image/gif"
                        multiple
                        className="hidden"
                        onChange={handleAnimationUpload}
                      />
                    </div>
                  </div>
                </div>

                {media.animations.length > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    {media.animations.map((animation: any) => (
                      <div key={animation.id} className="relative group">
                        <img 
                          src={animation.url} 
                          alt={animation.name}
                          className="w-full h-24 object-cover rounded border"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeMediaItem('animations', animation.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ملفات Lottie */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  ملفات Lottie
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                  <div className="text-center space-y-2">
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                    <div>
                      <Label htmlFor="lottie-upload" className="cursor-pointer">
                        <span className="text-primary hover:underline">
                          اختر ملفات Lottie
                        </span>
                        <span className="text-muted-foreground"> أو اسحبها هنا</span>
                      </Label>
                      <Input
                        id="lottie-upload"
                        type="file"
                        accept=".json"
                        multiple
                        className="hidden"
                        onChange={handleLottieUpload}
                      />
                    </div>
                  </div>
                </div>

                {media.lottieFiles.length > 0 && (
                  <div className="space-y-2">
                    {media.lottieFiles.map((lottie: any) => (
                      <div key={lottie.id} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">{lottie.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMediaItem('lottieFiles', lottie.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* أزرار الحفظ والإلغاء */}
        <div className="flex gap-3 justify-end mt-6">
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!formData.title || isUploading}
          >
            {isUploading ? 'جاري الرفع...' : 'حفظ'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LessonForm;