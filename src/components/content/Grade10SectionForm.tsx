import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Grade10Section } from '@/hooks/useGrade10AdminContent';

interface Grade10SectionFormProps {
  section?: Grade10Section | null;
  onSave: (data: any) => Promise<any>;
  onCancel: () => void;
  saving: boolean;
}

const Grade10SectionForm: React.FC<Grade10SectionFormProps> = ({
  section,
  onSave,
  onCancel,
  saving
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
    } else {
      setFormData({
        title: '',
        description: '',
        order_index: 0
      });
    }
  }, [section]);

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
            {section ? 'تعديل القسم' : 'إضافة قسم جديد'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">عنوان القسم *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="مثال: أساسيات الاتصال"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">وصف القسم</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="وصف مختصر للقسم..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order_index">ترتيب القسم</Label>
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
              {saving ? 'جاري الحفظ...' : (section ? 'تحديث القسم' : 'إضافة القسم')}
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

export default Grade10SectionForm;