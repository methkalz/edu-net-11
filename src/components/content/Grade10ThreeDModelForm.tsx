import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Box, Upload, Eye, File, Link } from 'lucide-react';
import { ThreeDModelViewer } from './ThreeDModelViewer';
import { useGrade10Files } from '@/hooks/useGrade10Files';

interface Grade10ThreeDModelFormProps {
  lessonId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const Grade10ThreeDModelForm: React.FC<Grade10ThreeDModelFormProps> = ({
  lessonId,
  onSuccess,
  onCancel
}) => {
  const [fileName, setFileName] = useState('');
  const [filePath, setFilePath] = useState('');
  const [description, setDescription] = useState('');
  const [autoRotate, setAutoRotate] = useState(true);
  const [orderIndex, setOrderIndex] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  
  const { uploadFile, getFileUrl } = useGrade10Files();

  const getModelType = (path: string): 'glb' | 'obj' => {
    return path.toLowerCase().endsWith('.glb') ? 'glb' : 'obj';
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if file is a valid 3D model format
      const validExtensions = ['.glb', '.gltf', '.obj'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!validExtensions.includes(fileExtension)) {
        toast({
          title: "نوع ملف غير مدعوم",
          description: "يرجى اختيار ملف بصيغة GLB، GLTF، أو OBJ",
          variant: "destructive"
        });
        return;
      }

      setSelectedFile(file);
      setFileName(file.name);
      setFilePath(''); // Clear URL when file is selected
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fileName.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال اسم الملف",
        variant: "destructive"
      });
      return;
    }

    if (uploadMethod === 'file' && !selectedFile) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى اختيار ملف للرفع",
        variant: "destructive"
      });
      return;
    }

    if (uploadMethod === 'url' && !filePath.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال رابط الملف",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let finalFilePath = filePath;

      // If uploading a file, upload it first
      if (uploadMethod === 'file' && selectedFile) {
        const uploadResult = await uploadFile(selectedFile, `3d-models/${Date.now()}_${selectedFile.name}`);
        finalFilePath = getFileUrl(uploadResult.path);
      }

      const { error } = await supabase
        .from('grade10_lesson_media')
        .insert({
          lesson_id: lessonId,
          media_type: '3d_model',
          file_path: finalFilePath,
          file_name: fileName,
          metadata: {
            modelType: getModelType(finalFilePath),
            autoRotate,
            description: description || undefined,
            uploadMethod
          },
          order_index: orderIndex
        });

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم إضافة النموذج ثلاثي الأبعاد بنجاح",
      });

      // Reset form
      setFileName('');
      setFilePath('');
      setDescription('');
      setAutoRotate(true);
      setOrderIndex(1);
      setShowPreview(false);
      setSelectedFile(null);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error adding 3D model:', error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة النموذج ثلاثي الأبعاد",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const sampleModels = [
    {
      name: 'نموذج رائد الفضاء',
      url: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
      type: 'glb'
    },
    {
      name: 'نموذج نيل أرمسترونغ',
      url: 'https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb',
      type: 'glb'
    },
    {
      name: 'نموذج الحصان',
      url: 'https://modelviewer.dev/shared-assets/models/Horse.glb',
      type: 'glb'
    }
  ];

  const handleSampleSelect = (sample: typeof sampleModels[0]) => {
    setFileName(`${sample.name}.${sample.type}`);
    setFilePath(sample.url);
    setUploadMethod('url');
    setSelectedFile(null);
  };

  const getCurrentFilePath = () => {
    if (uploadMethod === 'file' && selectedFile) {
      return URL.createObjectURL(selectedFile);
    }
    return filePath;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Box className="w-5 h-5" />
            إضافة نموذج ثلاثي الأبعاد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fileName">اسم الملف</Label>
              <Input
                id="fileName"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="مثال: نموذج المعالج.glb"
                required
              />
            </div>

            <Tabs value={uploadMethod} onValueChange={(value) => setUploadMethod(value as 'file' | 'url')} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file" className="flex items-center gap-2">
                  <File className="w-4 h-4" />
                  رفع ملف
                </TabsTrigger>
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <Link className="w-4 h-4" />
                  رابط خارجي
                </TabsTrigger>
              </TabsList>

              <TabsContent value="file" className="space-y-2">
                <Label htmlFor="fileUpload">اختر ملف النموذج ثلاثي الأبعاد</Label>
                <Input
                  id="fileUpload"
                  type="file"
                  accept=".glb,.gltf,.obj"
                  onChange={handleFileSelect}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                />
                {selectedFile && (
                  <div className="text-sm text-muted-foreground">
                    ملف محدد: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
              </TabsContent>

              <TabsContent value="url" className="space-y-2">
                <Label htmlFor="filePath">رابط الملف</Label>
                <Input
                  id="filePath"
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  placeholder="https://example.com/model.glb"
                />
              </TabsContent>
            </Tabs>

            <div className="space-y-2">
              <Label htmlFor="description">الوصف (اختياري)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف مختصر للنموذج ثلاثي الأبعاد..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoRotate">دوران تلقائي</Label>
                <Switch
                  id="autoRotate"
                  checked={autoRotate}
                  onCheckedChange={setAutoRotate}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="orderIndex">ترتيب العرض</Label>
                <Input
                  id="orderIndex"
                  type="number"
                  min="1"
                  value={orderIndex}
                  onChange={(e) => setOrderIndex(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                disabled={!getCurrentFilePath()}
              >
                <Eye className="w-4 h-4 mr-2" />
                {showPreview ? 'إخفاء المعاينة' : 'معاينة النموذج'}
              </Button>
              
              {getCurrentFilePath() && (
                <Badge variant="secondary">
                  نوع الملف: {getModelType(getCurrentFilePath()).toUpperCase()}
                </Badge>
              )}
              
              {uploadMethod === 'file' && selectedFile && (
                <Badge variant="outline">
                  رفع محلي
                </Badge>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  إلغاء
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                <Upload className="w-4 h-4 mr-2" />
                {isSubmitting ? 'جارٍ الإضافة...' : 'إضافة النموذج'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Sample Models */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">نماذج تجريبية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {sampleModels.map((sample, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => handleSampleSelect(sample)}
                className="text-sm"
              >
                {sample.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {showPreview && getCurrentFilePath() && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">معاينة النموذج</CardTitle>
          </CardHeader>
          <CardContent>
            <ThreeDModelViewer
              modelUrl={getCurrentFilePath()}
              modelType={getModelType(getCurrentFilePath())}
              title={fileName}
              autoRotate={autoRotate}
              showControls={true}
              className="h-96"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};