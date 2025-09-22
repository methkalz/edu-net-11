import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, X, Play, Globe, FolderOpen } from 'lucide-react';
import Lottie from 'lottie-react';
import { logger } from '@/lib/logger';
import SharedMediaPicker from './SharedMediaPicker';
import type { SharedMediaFile } from '@/hooks/useSharedMediaLibrary';

interface LessonLottieFormProps {
  onSave: (lottieData: any) => void;
  onCancel: () => void;
}

// مكون معاينة Lottie مبسط
interface LottiePreviewProps {
  animationData: any;
  speed: number;
  loop: boolean;
  autoplay: boolean;
  width?: string;
  height?: string;
}

const LottiePreview: React.FC<LottiePreviewProps> = ({ 
  animationData, 
  speed, 
  loop, 
  autoplay, 
  width = '100%', 
  height = '100%' 
}) => {
  console.log('عرض Lottie بالإعدادات:', { speed, loop, autoplay });
  
  return (
    <Lottie
      animationData={animationData}
      loop={loop}
      autoplay={autoplay}
      style={{ 
        width, 
        height,
        // تطبيق السرعة عبر CSS animation
        animationDuration: `${1/speed}s`
      }}
    />
  );
};

const LessonLottieForm: React.FC<LessonLottieFormProps> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file_url: '',
    source_type: 'upload',
    loop: true,
    autoplay: true,
    speed: 1
  });

  const [animationData, setAnimationData] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [jsonError, setJsonError] = useState<string>('');
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [selectedTab, setSelectedTab] = useState('upload');

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setJsonError('');

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      
      // التحقق من صحة ملف Lottie
      if (!jsonData.v || !jsonData.layers) {
        throw new Error('ملف Lottie غير صحيح');
      }

      setAnimationData(jsonData);
      handleInputChange('file_url', URL.createObjectURL(file));
      handleInputChange('source_type', 'upload');
    } catch (error) {
      setJsonError('ملف Lottie غير صحيح. تأكد من أن الملف بصيغة JSON صحيحة.');
      logger.error('Error parsing Lottie file', error as Error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlInput = async (url: string) => {
    if (!url) {
      setAnimationData(null);
      setJsonError('');
      return;
    }

    handleInputChange('file_url', url);
    handleInputChange('source_type', 'url');

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('لا يمكن الوصول إلى الرابط');
      }
      
      const jsonData = await response.json();
      
      if (!jsonData.v || !jsonData.layers) {
        throw new Error('ملف Lottie غير صحيح');
      }

      setAnimationData(jsonData);
      setJsonError('');
    } catch (error) {
      setJsonError('لا يمكن تحميل ملف Lottie من هذا الرابط. تحقق من صحة الرابط.');
      setAnimationData(null);
      logger.error('Error loading Lottie from URL', error as Error);
    }
  };

  const handleSelectFromLibrary = (mediaFile: SharedMediaFile) => {
    setFormData(prev => ({
      ...prev,
      title: prev.title || mediaFile.file_name,
      file_url: mediaFile.file_path,
      source_type: 'library',
      loop: mediaFile.metadata?.loop ?? true,
      autoplay: mediaFile.metadata?.autoplay ?? true,
      speed: mediaFile.metadata?.speed ?? 1
    }));
    
    if (mediaFile.metadata?.animation_data) {
      setAnimationData(mediaFile.metadata.animation_data);
    }
    
    setShowMediaPicker(false);
    setSelectedTab('library');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // التأكد من صحة البيانات
    const speedValue = Number(formData.speed);
    if (speedValue < 0.1 || speedValue > 3) {
      logger.error('سرعة غير صحيحة: ' + speedValue);
      return;
    }

    console.log('حفظ بيانات Lottie:', {
      speed: speedValue,
      loop: formData.loop,
      autoplay: formData.autoplay
    });

    onSave({
      ...formData,
      file_path: formData.file_url,
      file_name: formData.title,
      animation_data: animationData,
      metadata: {
        speed: speedValue,
        loop: formData.loop,
        autoplay: formData.autoplay,
        animation_data: animationData
      }
    });
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onCancel}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              إضافة ملف Lottie للدرس
            </DialogTitle>
          </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* معلومات الملف */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">معلومات الملف</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">عنوان الملف</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="أدخل عنوان ملف Lottie"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">وصف الملف</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="أدخل وصف للملف"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* مصدر الملف */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">مصدر الملف</CardTitle>
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
                  <div>
                    <Label htmlFor="lottie-upload">رفع ملف Lottie</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      {animationData ? (
                        <div className="space-y-3">
                          <div className="w-32 h-32 mx-auto">
                            <LottiePreview
                              animationData={animationData}
                              speed={formData.speed}
                              loop={formData.loop}
                              autoplay={formData.autoplay}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setAnimationData(null);
                              handleInputChange('file_url', '');
                              setJsonError('');
                            }}
                          >
                            <X className="h-4 w-4 ml-1" />
                            إزالة
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Play className="h-8 w-8 mx-auto text-muted-foreground" />
                          <div>
                            <Label htmlFor="lottie-upload" className="cursor-pointer">
                              <span className="text-primary hover:underline">
                                اختر ملف Lottie
                              </span>
                              <span className="text-muted-foreground"> أو اسحبه هنا</span>
                            </Label>
                            <Input
                              id="lottie-upload"
                              type="file"
                              accept=".json"
                              className="hidden"
                              onChange={handleFileUpload}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            ملف JSON من LottieFiles أو After Effects
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {jsonError && (
                      <div className="text-sm text-destructive mt-2">
                        {jsonError}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="url" className="space-y-4">
                  {/* رابط خارجي */}
                  <div>
                    <Label htmlFor="lottie_url">رابط ملف Lottie</Label>
                    <Input
                      id="lottie_url"
                      value={formData.file_url}
                      onChange={(e) => handleUrlInput(e.target.value)}
                      placeholder="https://example.com/animation.json"
                      required
                    />
                    
                    {jsonError && (
                      <div className="text-sm text-destructive mt-2">
                        {jsonError}
                      </div>
                    )}
                    
                    {/* معاينة الملف */}
                    {animationData && (
                      <div className="mt-3">
                        <Label>معاينة الملف</Label>
                        <div className="mt-2 border rounded-lg p-4 flex justify-center">
                          <div className="w-32 h-32">
                            <LottiePreview
                              animationData={animationData}
                              speed={formData.speed}
                              loop={formData.loop}
                              autoplay={formData.autoplay}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="library" className="space-y-4">
                  <div className="text-center py-8">
                    <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      اختر ملف Lottie من الملفات المرفوعة سابقاً
                    </p>
                    <Button onClick={() => setShowMediaPicker(true)}>
                      تصفح المكتبة
                    </Button>
                  </div>

                  {/* عرض الملف المختار */}
                  {formData.source_type === 'library' && formData.file_url && (
                    <div>
                      <Label>الملف المختار</Label>
                      <div className="mt-2 p-4 border rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <Play className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">{formData.title}</p>
                            <p className="text-sm text-muted-foreground">من المكتبة المشتركة</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setAnimationData(null);
                              handleInputChange('file_url', '');
                              handleInputChange('source_type', 'upload');
                              setSelectedTab('upload');
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {animationData && (
                          <div className="flex justify-center">
                            <div className="w-32 h-32">
                              <LottiePreview
                                animationData={animationData}
                                speed={formData.speed}
                                loop={formData.loop}
                                autoplay={formData.autoplay}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* إعدادات التشغيل */}
          {animationData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">إعدادات التشغيل</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <input
                    id="loop"
                    type="checkbox"
                    checked={formData.loop}
                    onChange={(e) => handleInputChange('loop', e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="loop">تكرار التشغيل</Label>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <input
                    id="autoplay"
                    type="checkbox"
                    checked={formData.autoplay}
                    onChange={(e) => handleInputChange('autoplay', e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="autoplay">تشغيل تلقائي</Label>
                </div>

                <div>
                  <Label htmlFor="speed">سرعة التشغيل: {formData.speed}x</Label>
                  <input
                    id="speed"
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={formData.speed}
                    onChange={(e) => {
                      const newSpeed = parseFloat(e.target.value);
                      console.log('تغيير سرعة Lottie إلى:', newSpeed);
                      handleInputChange('speed', newSpeed);
                    }}
                    className="w-full mt-1"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>0.1x</span>
                    <span>1x (عادي)</span>
                    <span>3x</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* أزرار التحكم */}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              إلغاء
            </Button>
            <Button type="submit" disabled={!formData.title || !animationData || isUploading}>
              إضافة الملف
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <SharedMediaPicker
      isOpen={showMediaPicker}
      onClose={() => setShowMediaPicker(false)}
      onSelectMedia={handleSelectFromLibrary}
      mediaType="lottie"
    />
  </>
  );
};

export default LessonLottieForm;