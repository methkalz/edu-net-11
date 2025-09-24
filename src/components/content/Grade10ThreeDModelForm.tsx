import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Box, Upload, Eye } from 'lucide-react';
import { ThreeDModelViewer } from './ThreeDModelViewer';

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

  const getModelType = (path: string): 'glb' | 'obj' => {
    return path.toLowerCase().endsWith('.glb') ? 'glb' : 'obj';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fileName.trim() || !filePath.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('grade10_lesson_media')
        .insert({
          lesson_id: lessonId,
          media_type: '3d_model',
          file_path: filePath,
          file_name: fileName,
          metadata: {
            modelType: getModelType(filePath),
            autoRotate,
            description: description || undefined
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <Label htmlFor="filePath">رابط الملف</Label>
                <Input
                  id="filePath"
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  placeholder="https://example.com/model.glb"
                  required
                />
              </div>
            </div>

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
                disabled={!filePath}
              >
                <Eye className="w-4 h-4 mr-2" />
                {showPreview ? 'إخفاء المعاينة' : 'معاينة النموذج'}
              </Button>
              
              {filePath && (
                <Badge variant="secondary">
                  نوع الملف: {getModelType(filePath).toUpperCase()}
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
      {showPreview && filePath && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">معاينة النموذج</CardTitle>
          </CardHeader>
          <CardContent>
            <ThreeDModelViewer
              modelUrl={filePath}
              modelType={getModelType(filePath)}
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