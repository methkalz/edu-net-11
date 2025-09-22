import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface Grade12FinalProjectFormData {
  title: string;
  description: string;
  status: 'draft' | 'in_progress' | 'submitted' | 'completed' | 'reviewed';
  due_date?: string; // Change from Date to string
}

interface Grade12FinalProjectFormProps {
  onSave: (project: Grade12FinalProjectFormData) => void;
  onClose: () => void;
  initialData?: any;
}

const Grade12FinalProjectForm: React.FC<Grade12FinalProjectFormProps> = ({
  onSave,
  onClose,
  initialData
}) => {
  const [formData, setFormData] = useState<Grade12FinalProjectFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    status: initialData?.status || 'draft',
  });

  const [dueDate, setDueDate] = useState<Date | undefined>(
    initialData?.due_date ? new Date(initialData.due_date) : undefined
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('عنوان المشروع مطلوب');
      return;
    }

    try {
      const projectData = {
        ...formData,
        due_date: dueDate?.toISOString(),
      };
      
      logger.debug('Creating final project', { projectData });
      await onSave(projectData);
      onClose();
    } catch (error: any) {
      logger.error('Error saving project', error);
      const errorMessage = error.message || 'حدث خطأ أثناء حفظ المشروع';
      alert(errorMessage);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'تعديل المشروع النهائي' : 'إنشاء مشروع نهائي جديد'}
          </DialogTitle>
          <DialogDescription>
            املأ بيانات المشروع النهائي أدناه
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* عنوان المشروع */}
          <div className="space-y-2">
            <Label htmlFor="title">عنوان المشروع *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="أدخل عنوان المشروع النهائي"
              required
            />
          </div>

          {/* وصف المشروع */}
          <div className="space-y-2">
            <Label htmlFor="description">وصف المشروع</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="أدخل وصفاً مفصلاً للمشروع النهائي..."
              rows={4}
            />
          </div>

          {/* حالة المشروع */}
          <div className="space-y-2">
            <Label htmlFor="status">حالة المشروع</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value: any) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر حالة المشروع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                <SelectItem value="submitted">تم التسليم</SelectItem>
                <SelectItem value="completed">مكتمل</SelectItem>
                <SelectItem value="reviewed">تم المراجعة</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* موعد التسليم */}
          <div className="space-y-2">
            <Label>موعد التسليم</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "dd MMM yyyy", { locale: ar }) : "اختر التاريخ"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit">
              {initialData ? 'تحديث المشروع' : 'إنشاء المشروع'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default Grade12FinalProjectForm;