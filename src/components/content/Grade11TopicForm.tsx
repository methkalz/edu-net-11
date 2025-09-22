import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Grade11Topic } from '@/hooks/useGrade11Content';
import RichTextEditor from './RichTextEditor';

interface Grade11TopicFormProps {
  topic?: Grade11Topic;
  sectionId?: string | null;
  onSave: (topicData: Omit<Grade11Topic, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
}

const Grade11TopicForm: React.FC<Grade11TopicFormProps> = ({
  topic,
  sectionId,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    section_id: sectionId || '',
    title: '',
    content: '',
    order_index: 0
  });

  useEffect(() => {
    if (topic) {
      setFormData({
        section_id: topic.section_id,
        title: topic.title,
        content: topic.content || '',
        order_index: topic.order_index
      });
    } else if (sectionId) {
      setFormData(prev => ({ ...prev, section_id: sectionId }));
    }
  }, [topic, sectionId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleContentChange = (content: string) => {
    setFormData({ ...formData, content });
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
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
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="أدخل عنوان الموضوع"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">محتوى الموضوع</Label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="أدخل محتوى الموضوع..."
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order_index">ترتيب الموضوع</Label>
            <Input
              id="order_index"
              type="number"
              value={formData.order_index}
              onChange={(e) => setFormData({ ...formData, order_index: Number(e.target.value) })}
              min="0"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              إلغاء
            </Button>
            <Button type="submit">
              {topic ? 'تحديث الموضوع' : 'إضافة الموضوع'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default Grade11TopicForm;