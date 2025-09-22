import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { useGrade10Content } from '@/hooks/useGrade10Content';
import { logger } from '@/lib/logger';

interface Grade10DocumentFormData {
  title: string;
  description?: string;
  category: string;
  file_path: string;
  file_type?: string;
  is_visible: boolean;
  allowed_roles: string[];
  grade_level: string;
  owner_user_id: string;
  school_id?: string;
  is_active: boolean;
  order_index: number;
}

interface Grade10DocumentFormProps {
  onSave: (data: Grade10DocumentFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<Grade10DocumentFormData>;
}

const Grade10DocumentForm: React.FC<Grade10DocumentFormProps> = ({
  onSave,
  onCancel,
  initialData
}) => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || 'materials',
    file_path: initialData?.file_path || '',
    file_type: initialData?.file_type || '',
    is_visible: initialData?.is_visible ?? true,
    allowed_roles: initialData?.allowed_roles || ['all']
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.file_path.trim()) {
      return;
    }

    setLoading(true);
    try {
      await onSave({
        ...formData,
        grade_level: '10',
        owner_user_id: userProfile!.user_id,
        school_id: userProfile!.school_id,
        is_active: true,
        order_index: 0
      });
      onCancel();
    } catch (error) {
      logger.error('Error saving document', error as Error);
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = [
    { value: 'bagrut_exam', label: 'امتحانات بجروت' },
    { value: 'worksheets', label: 'أوراق عمل' },
    { value: 'exams', label: 'امتحانات' },
    { value: 'materials', label: 'مواد تعليمية' },
    { value: 'projects', label: 'مشاريع' }
  ];

  const roleOptions = [
    { value: 'all', label: 'الجميع' },
    { value: 'student', label: 'الطلاب' },
    { value: 'teacher', label: 'المعلمون' },
    { value: 'school_admin', label: 'إداريو المدرسة' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? 'تعديل الملف' : 'إضافة ملف جديد'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">العنوان *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="category">الفئة</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="file_path">مسار الملف *</Label>
            <Input
              id="file_path"
              value={formData.file_path}
              onChange={(e) => setFormData(prev => ({ ...prev, file_path: e.target.value }))}
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="file_type">نوع الملف</Label>
            <Input
              id="file_type"
              value={formData.file_type}
              onChange={(e) => setFormData(prev => ({ ...prev, file_type: e.target.value }))}
              disabled={loading}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_visible"
              checked={formData.is_visible}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, is_visible: checked as boolean }))
              }
              disabled={loading}
            />
            <Label htmlFor="is_visible">مرئي للجميع</Label>
          </div>

          <div>
            <Label htmlFor="allowed_roles">الأدوار المسموحة</Label>
            <Select 
              value={formData.allowed_roles[0] || 'all'} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, allowed_roles: [value] }))}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              إلغاء
            </Button>
            <Button 
              type="submit" 
              disabled={!formData.title.trim() || !formData.file_path.trim() || loading}
            >
              {loading ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default Grade10DocumentForm;