import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Loader2,
  GraduationCap,
  Globe,
  Lock,
  Info,
} from 'lucide-react';

interface BagrutExam {
  id: string;
  title: string;
  exam_year: number;
  subject: string;
  duration_minutes: number;
  total_points: number;
  is_published: boolean;
  available_for_grades: string[];
}

interface BagrutPublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exam: BagrutExam | null;
  onSuccess?: () => void;
}

const AVAILABLE_GRADES = [
  { code: '10', label: 'الصف العاشر' },
  { code: '11', label: 'الصف الحادي عشر' },
  { code: '12', label: 'الصف الثاني عشر' },
];

export default function BagrutPublishDialog({
  open,
  onOpenChange,
  exam,
  onSuccess,
}: BagrutPublishDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isReleased, setIsReleased] = useState(false);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);

  useEffect(() => {
    if (exam && open) {
      setIsReleased(exam.is_published || false);
      setSelectedGrades(exam.available_for_grades || []);
    }
  }, [exam, open]);

  const handleGradeToggle = (gradeCode: string) => {
    setSelectedGrades(prev =>
      prev.includes(gradeCode)
        ? prev.filter(g => g !== gradeCode)
        : [...prev, gradeCode]
    );
  };

  const handleSelectAllGrades = () => {
    if (selectedGrades.length === AVAILABLE_GRADES.length) {
      setSelectedGrades([]);
    } else {
      setSelectedGrades(AVAILABLE_GRADES.map(g => g.code));
    }
  };

  const handleSave = async () => {
    if (!exam) return;

    if (isReleased && selectedGrades.length === 0) {
      toast.error('يجب اختيار صف واحد على الأقل لإتاحة الامتحان للمعلمين');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('bagrut_exams')
        .update({
          is_published: isReleased,
          available_for_grades: selectedGrades,
          status: isReleased ? 'published' : 'ready',
          // الوصول المباشر للطلاب من السوبر آدمن أصبح ملغى — المعلم هو من ينشر
          available_from: null,
          available_until: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', exam.id);

      if (error) throw error;

      toast.success(
        isReleased
          ? 'تم إتاحة الامتحان للمعلمين — يمكنهم الآن مراجعته ونشره لطلابهم'
          : 'تم إخفاء الامتحان عن المعلمين'
      );
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating exam:', error);
      toast.error('فشل في تحديث الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  if (!exam) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-orange-500" />
            إتاحة الامتحان للمعلمين
          </DialogTitle>
          <DialogDescription>
            {exam.title} - {exam.subject} ({exam.exam_year})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* تنبيه شرح النظام الجديد */}
          <div className="flex gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <p className="font-medium">نظام النشر الجديد</p>
              <p className="text-xs">
                دور السوبر آدمن هو إتاحة الامتحان <strong>للمعلمين</strong> فقط ليراجعوه.
                المعلم بعد ذلك يقرر متى ولأي صف ينشره لطلابه بإعدادات مستقلة (تواريخ، عدد محاولات، إظهار الإجابات).
              </p>
            </div>
          </div>

          {/* حالة الإتاحة الرئيسية */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-3">
              {isReleased ? (
                <Globe className="h-5 w-5 text-green-500" />
              ) : (
                <Lock className="h-5 w-5 text-amber-500" />
              )}
              <div>
                <p className="font-medium">
                  {isReleased ? 'متاح للمعلمين' : 'غير متاح'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isReleased
                    ? 'المعلمون يستطيعون مراجعته ونشره لطلابهم'
                    : 'الامتحان مخفي عن المعلمين والطلاب'}
                </p>
              </div>
            </div>
            <Switch
              checked={isReleased}
              onCheckedChange={setIsReleased}
            />
          </div>

          <Separator />

          {/* الصفوف المستهدفة */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                الصفوف المستهدفة
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAllGrades}
                className="text-xs"
              >
                {selectedGrades.length === AVAILABLE_GRADES.length
                  ? 'إلغاء تحديد الكل'
                  : 'تحديد الكل'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              معلمو هذه الصفوف فقط هم من سيرون الامتحان ضمن قائمتهم.
            </p>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_GRADES.map((grade) => (
                <Badge
                  key={grade.code}
                  variant={selectedGrades.includes(grade.code) ? 'default' : 'outline'}
                  className="cursor-pointer transition-all hover:scale-105"
                  onClick={() => handleGradeToggle(grade.code)}
                >
                  <Checkbox
                    checked={selectedGrades.includes(grade.code)}
                    className="ml-2 h-3 w-3"
                    onCheckedChange={() => handleGradeToggle(grade.code)}
                  />
                  {grade.label}
                </Badge>
              ))}
            </div>
            {selectedGrades.length === 0 && isReleased && (
              <p className="text-xs text-destructive">
                يجب اختيار صف واحد على الأقل
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex-row-reverse gap-2">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              'حفظ الإعدادات'
            )}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
