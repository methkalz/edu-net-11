import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

interface Grade11DocumentFormProps {
  onSave: (documentData: any) => Promise<void>;
  onCancel: () => void;
  initialData?: any;
}

const Grade11DocumentForm: React.FC<Grade11DocumentFormProps> = ({
  onSave,
  onCancel,
  initialData
}) => {
  const { userProfile } = useAuth();
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    file_path: initialData?.file_path || '',
    file_type: initialData?.file_type || '',
    category: initialData?.category || 'worksheets',
    ...initialData
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.file_path.trim()) return;

    setLoading(true);
    try {
      await onSave({
        ...formData,
        owner_user_id: userProfile?.user_id,
        school_id: userProfile?.school_id,
        grade_level: '11'
      });
      onCancel();
    } catch (error) {
      logger.error('Error saving document', error as Error);
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = [
    { value: 'bagrut_exam', label: 'امتحان بجروت' },
    { value: 'worksheets', label: 'أوراق عمل وامتحانات' },
    { value: 'exams', label: 'أوراق عمل إضافية' }
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {initialData ? 'تعديل المستند' : 'إضافة مستند جديد'}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">عنوان المستند *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="أدخل عنوان المستند"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="أدخل وصف المستند"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">الفئة *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الفئة" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file_path">مسار الملف *</Label>
            <Input
              id="file_path"
              value={formData.file_path}
              onChange={(e) => setFormData({ ...formData, file_path: e.target.value })}
              placeholder="أدخل مسار الملف"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file_type">نوع الملف</Label>
            <Input
              id="file_type"
              value={formData.file_type}
              onChange={(e) => setFormData({ ...formData, file_type: e.target.value })}
              placeholder="مثال: PDF, DOC, etc."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading || !formData.title.trim() || !formData.file_path.trim()}>
              {loading ? 'جاري الحفظ...' : (initialData ? 'تحديث' : 'حفظ')}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              إلغاء
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default Grade11DocumentForm;