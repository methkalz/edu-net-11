import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useTeacherExams } from '@/hooks/useTeacherExams';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TeacherExamFormProps {
  exam?: any;
  gradeLevel: '10' | '11';
  onClose: () => void;
  onSuccess: () => void;
}

export const TeacherExamForm: React.FC<TeacherExamFormProps> = ({
  exam,
  gradeLevel,
  onClose,
  onSuccess
}) => {
  const { createExam, updateExam } = useTeacherExams();
  const { userProfile } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: exam?.title || '',
    description: exam?.description || '',
    grade_level: gradeLevel,
    target_class_ids: exam?.target_class_ids || [],
    total_questions: exam?.total_questions || 10,
    duration_minutes: exam?.duration_minutes || 60,
    pass_percentage: exam?.pass_percentage || 60,
    max_attempts: exam?.max_attempts || 1,
    randomize_questions: exam?.randomize_questions ?? true,
    randomize_answers: exam?.randomize_answers ?? true,
    show_results_immediately: exam?.show_results_immediately ?? false,
    show_correct_answers: exam?.show_correct_answers ?? false,
  });

  useEffect(() => {
    fetchClasses();
  }, [gradeLevel]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          id,
          class_name_id,
          class_names (name),
          grade_levels (code, label)
        `)
        .eq('school_id', userProfile?.school_id)
        .eq('status', 'active');

      if (error) throw error;
      
      const filtered = data?.filter((c: any) => 
        c.grade_levels?.code === gradeLevel || 
        c.grade_levels?.label?.includes(gradeLevel)
      ) || [];
      
      setClasses(filtered);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (exam) {
        await updateExam(exam.id, formData);
      } else {
        await createExam(formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving exam:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">عنوان الاختبار</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="مثال: اختبار الوحدة الأولى"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">الوصف (اختياري)</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="وصف مختصر للاختبار"
            rows={3}
          />
        </div>

        <div>
          <Label>الصفوف المستهدفة</Label>
          <Select
            value={formData.target_class_ids[0] || ''}
            onValueChange={(value) => setFormData({ ...formData, target_class_ids: [value] })}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر الصف" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.class_names?.name || 'صف غير محدد'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="total_questions">عدد الأسئلة</Label>
            <Input
              id="total_questions"
              type="number"
              min="1"
              value={formData.total_questions}
              onChange={(e) => setFormData({ ...formData, total_questions: parseInt(e.target.value) })}
              required
            />
          </div>

          <div>
            <Label htmlFor="duration_minutes">المدة (دقيقة)</Label>
            <Input
              id="duration_minutes"
              type="number"
              min="1"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="pass_percentage">نسبة النجاح (%)</Label>
            <Input
              id="pass_percentage"
              type="number"
              min="0"
              max="100"
              value={formData.pass_percentage}
              onChange={(e) => setFormData({ ...formData, pass_percentage: parseInt(e.target.value) })}
              required
            />
          </div>

          <div>
            <Label htmlFor="max_attempts">عدد المحاولات المسموحة</Label>
            <Input
              id="max_attempts"
              type="number"
              min="1"
              value={formData.max_attempts}
              onChange={(e) => setFormData({ ...formData, max_attempts: parseInt(e.target.value) })}
              required
            />
          </div>
        </div>

        <div className="space-y-4 border-t pt-4">
          <h3 className="font-semibold">إعدادات متقدمة</h3>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="randomize_questions">ترتيب عشوائي للأسئلة</Label>
            <Switch
              id="randomize_questions"
              checked={formData.randomize_questions}
              onCheckedChange={(checked) => setFormData({ ...formData, randomize_questions: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="randomize_answers">ترتيب عشوائي للإجابات</Label>
            <Switch
              id="randomize_answers"
              checked={formData.randomize_answers}
              onCheckedChange={(checked) => setFormData({ ...formData, randomize_answers: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show_results_immediately">إظهار النتائج فوراً</Label>
            <Switch
              id="show_results_immediately"
              checked={formData.show_results_immediately}
              onCheckedChange={(checked) => setFormData({ ...formData, show_results_immediately: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show_correct_answers">إظهار الإجابات الصحيحة</Label>
            <Switch
              id="show_correct_answers"
              checked={formData.show_correct_answers}
              onCheckedChange={(checked) => setFormData({ ...formData, show_correct_answers: checked })}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          إلغاء
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'جاري الحفظ...' : exam ? 'تحديث' : 'إنشاء'}
        </Button>
      </div>
    </form>
  );
};
