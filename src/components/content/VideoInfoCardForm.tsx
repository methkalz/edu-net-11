import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, X, Save } from 'lucide-react';

interface VideoInfoCardFormProps {
  onSave: (data: { title: string; description: string }) => Promise<void>;
  onCancel: () => void;
  initialData?: { title: string; description: string };
}

const VideoInfoCardForm: React.FC<VideoInfoCardFormProps> = ({
  onSave,
  onCancel,
  initialData
}) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) return;

    setLoading(true);
    try {
      await onSave(formData);
      onCancel();
    } catch (error) {
      console.error('Error saving card:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader className="border-b bg-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Info className="h-5 w-5 text-primary" />
            </div>
            <CardTitle>
              {initialData ? 'تعديل البطاقة المعلوماتية' : 'إضافة بطاقة معلوماتية'}
            </CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base">
              العنوان *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="مثال: نموذج OSI - الطبقات السبع"
              required
              className="text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-base">
              الوصف *
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="اكتب وصفاً تفصيلياً للبطاقة المعلوماتية..."
              required
              rows={6}
              className="text-base resize-none"
            />
            <p className="text-xs text-muted-foreground">
              يمكنك استخدام أسطر جديدة لتنسيق النص
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={loading || !formData.title.trim() || !formData.description.trim()}
              className="flex-1 gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? 'جاري الحفظ...' : (initialData ? 'تحديث' : 'حفظ')}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              className="flex-1"
            >
              إلغاء
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default VideoInfoCardForm;