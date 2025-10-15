import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Grade12ExamPrepLesson } from '@/hooks/useGrade12ExamPrepAdmin';
import RichTextEditor from '@/components/content/RichTextEditor';

interface Grade12ExamPrepLessonFormProps {
  lesson?: Grade12ExamPrepLesson | null;
  topicId: string;
  onSave: (data: any) => Promise<any>;
  onCancel: () => void;
  saving: boolean;
}

const Grade12ExamPrepLessonForm: React.FC<Grade12ExamPrepLessonFormProps> = ({
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

  const handleContentChange = (newContent: string) => {
    setFormData(prev => ({ ...prev, content: newContent }));
  };

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
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
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
              placeholder="مثال: نموذج امتحان 2023 - الدور الأول"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">محتوى الدرس</Label>
            <div className="border rounded-md">
              <RichTextEditor
                content={formData.content}
                onChange={handleContentChange}
                placeholder="اكتب محتوى الدرس هنا..."
              />
            </div>
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

export default Grade12ExamPrepLessonForm;