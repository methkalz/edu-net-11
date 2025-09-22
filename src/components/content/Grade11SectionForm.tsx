import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Grade11Section } from '@/hooks/useGrade11Content';

interface Grade11SectionFormProps {
  section?: Grade11Section;
  onSave: (sectionData: Omit<Grade11Section, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
}

const Grade11SectionForm: React.FC<Grade11SectionFormProps> = ({
  section,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order_index: 0
  });

  useEffect(() => {
    if (section) {
      setFormData({
        title: section.title,
        description: section.description || '',
        order_index: section.order_index
      });
    }
  }, [section]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {section ? 'تعديل القسم' : 'إضافة قسم جديد'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">عنوان القسم *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="أدخل عنوان القسم"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">الشرح الأولي</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="أدخل الشرح الأولي للقسم"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order_index">ترتيب القسم</Label>
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
              {section ? 'تحديث القسم' : 'إضافة القسم'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default Grade11SectionForm;