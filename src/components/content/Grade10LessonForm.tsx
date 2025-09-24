import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Grade10Lesson } from '@/hooks/useGrade10AdminContent';

interface Grade10LessonFormProps {
  lesson?: Grade10Lesson | null;
  topicId: string;
  onSave: (data: any) => Promise<any>;
  onCancel: () => void;
  saving: boolean;
}

const Grade10LessonForm: React.FC<Grade10LessonFormProps> = ({
  lesson,
  topicId,
  onSave,
  onCancel,
  saving
}) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    topic_id: topicId,
    order_index: 0,
    is_active: true
  });

  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title,
        content: lesson.content || '',
        topic_id: lesson.topic_id,
        order_index: lesson.order_index,
        is_active: lesson.is_active
      });
    } else {
      setFormData({
        title: '',
        content: '',
        topic_id: topicId,
        order_index: 0,
        is_active: true
      });
    }
  }, [lesson, topicId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await onSave(formData);
      onCancel();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {lesson ? 'تعديل الدرس' : 'إضافة درس جديد'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">عنوان الدرس *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="مثال: مضيف (Host)"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">محتوى الدرس</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="اكتب محتوى الدرس هنا..."
              rows={8}
              className="min-h-[200px]"
            />
            <p className="text-sm text-muted-foreground">
              يمكنك استخدام نص بسيط أو HTML أساسي لتنسيق المحتوى
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="order_index">ترتيب الدرس</Label>
            <Input
              id="order_index"
              type="number"
              value={formData.order_index}
              onChange={(e) => setFormData(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
              min={0}
            />
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active">الدرس نشط</Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={saving || !formData.title.trim()}>
              {saving ? 'جاري الحفظ...' : (lesson ? 'تحديث الدرس' : 'إضافة الدرس')}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default Grade10LessonForm;