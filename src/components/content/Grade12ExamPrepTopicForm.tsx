import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Grade12ExamPrepTopic } from '@/hooks/useGrade12ExamPrepAdmin';

interface Grade12ExamPrepTopicFormProps {
  topic?: Grade12ExamPrepTopic | null;
  sectionId: string;
  onSave: (data: any) => Promise<any>;
  onCancel: () => void;
  saving: boolean;
}

const Grade12ExamPrepTopicForm: React.FC<Grade12ExamPrepTopicFormProps> = ({
  topic,
  sectionId,
  onSave,
  onCancel,
  saving
}) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    section_id: sectionId,
    order_index: 0
  });

  useEffect(() => {
    if (topic) {
      setFormData({
        title: topic.title,
        content: topic.content || '',
        section_id: topic.section_id,
        order_index: topic.order_index
      });
    } else {
      setFormData({
        title: '',
        content: '',
        section_id: sectionId,
        order_index: 0
      });
    }
  }, [topic, sectionId]);

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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {topic ? 'تعديل الموضوع' : 'إضافة موضوع جديد'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">عنوان الموضوع *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="مثال: نماذج 2023"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">محتوى الموضوع</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="وصف مختصر للموضوع..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order_index">ترتيب الموضوع</Label>
            <Input
              id="order_index"
              type="number"
              value={formData.order_index}
              onChange={(e) => setFormData(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
              min={0}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={saving || !formData.title.trim()}>
              {saving ? 'جاري الحفظ...' : (topic ? 'تحديث الموضوع' : 'إضافة الموضوع')}
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

export default Grade12ExamPrepTopicForm;