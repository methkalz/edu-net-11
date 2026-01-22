import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  Users,
  School,
  Eye,
  EyeOff,
  Loader2,
  GraduationCap,
  RefreshCw,
  Globe,
  Lock,
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
  available_from: string | null;
  available_until: string | null;
  max_attempts: number;
  show_answers_to_students: boolean;
  allow_review_after_submit: boolean;
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
  
  // حالة النشر
  const [isPublished, setIsPublished] = useState(false);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  
  // إعدادات التوقيت
  const [useTimeWindow, setUseTimeWindow] = useState(false);
  const [availableFrom, setAvailableFrom] = useState('');
  const [availableUntil, setAvailableUntil] = useState('');
  
  // إعدادات المحاولات
  const [maxAttempts, setMaxAttempts] = useState(1);
  
  // إعدادات العرض
  const [showAnswersToStudents, setShowAnswersToStudents] = useState(false);
  const [allowReviewAfterSubmit, setAllowReviewAfterSubmit] = useState(true);

  // تحميل بيانات الامتحان عند فتح الـ dialog
  useEffect(() => {
    if (exam && open) {
      setIsPublished(exam.is_published || false);
      setSelectedGrades(exam.available_for_grades || []);
      setMaxAttempts(exam.max_attempts || 1);
      setShowAnswersToStudents(exam.show_answers_to_students || false);
      setAllowReviewAfterSubmit(exam.allow_review_after_submit ?? true);
      
      if (exam.available_from || exam.available_until) {
        setUseTimeWindow(true);
        setAvailableFrom(exam.available_from ? formatDateTimeLocal(exam.available_from) : '');
        setAvailableUntil(exam.available_until ? formatDateTimeLocal(exam.available_until) : '');
      } else {
        setUseTimeWindow(false);
        setAvailableFrom('');
        setAvailableUntil('');
      }
    }
  }, [exam, open]);

  const formatDateTimeLocal = (isoString: string) => {
    const date = new Date(isoString);
    return date.toISOString().slice(0, 16);
  };

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

    // التحقق من الصحة
    if (isPublished && selectedGrades.length === 0) {
      toast.error('يجب اختيار صف واحد على الأقل لنشر الامتحان');
      return;
    }

    if (useTimeWindow) {
      if (!availableFrom || !availableUntil) {
        toast.error('يجب تحديد تاريخ البداية والنهاية');
        return;
      }
      if (new Date(availableFrom) >= new Date(availableUntil)) {
        toast.error('تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
        return;
      }
    }

    setIsSaving(true);

    try {
      const updateData: any = {
        is_published: isPublished,
        available_for_grades: selectedGrades,
        max_attempts: maxAttempts,
        show_answers_to_students: showAnswersToStudents,
        allow_review_after_submit: allowReviewAfterSubmit,
        status: isPublished ? 'published' : 'ready',
        updated_at: new Date().toISOString(),
      };

      if (useTimeWindow) {
        updateData.available_from = new Date(availableFrom).toISOString();
        updateData.available_until = new Date(availableUntil).toISOString();
      } else {
        updateData.available_from = null;
        updateData.available_until = null;
      }

      const { error } = await supabase
        .from('bagrut_exams')
        .update(updateData)
        .eq('id', exam.id);

      if (error) throw error;

      toast.success(isPublished ? 'تم نشر الامتحان بنجاح' : 'تم إخفاء الامتحان');
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating exam:', error);
      toast.error('فشل في تحديث إعدادات النشر');
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
            إعدادات نشر الامتحان
          </DialogTitle>
          <DialogDescription>
            {exam.title} - {exam.subject} ({exam.exam_year})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* حالة النشر الرئيسية */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-3">
              {isPublished ? (
                <Globe className="h-5 w-5 text-green-500" />
              ) : (
                <Lock className="h-5 w-5 text-amber-500" />
              )}
              <div>
                <p className="font-medium">
                  {isPublished ? 'الامتحان منشور' : 'الامتحان مخفي'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isPublished
                    ? 'الطلاب يمكنهم رؤية وحل هذا الامتحان'
                    : 'الامتحان غير مرئي للطلاب'}
                </p>
              </div>
            </div>
            <Switch
              checked={isPublished}
              onCheckedChange={setIsPublished}
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
            {selectedGrades.length === 0 && isPublished && (
              <p className="text-xs text-destructive">
                يجب اختيار صف واحد على الأقل
              </p>
            )}
          </div>

          <Separator />

          {/* نافذة الوقت */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                تحديد فترة الإتاحة
              </Label>
              <Switch
                checked={useTimeWindow}
                onCheckedChange={setUseTimeWindow}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {useTimeWindow
                ? 'الامتحان متاح فقط خلال الفترة المحددة'
                : 'الامتحان متاح طوال الوقت (بعد النشر)'}
            </p>

            {useTimeWindow && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="available-from" className="text-xs">
                    من تاريخ
                  </Label>
                  <Input
                    id="available-from"
                    type="datetime-local"
                    value={availableFrom}
                    onChange={(e) => setAvailableFrom(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="available-until" className="text-xs">
                    إلى تاريخ
                  </Label>
                  <Input
                    id="available-until"
                    type="datetime-local"
                    value={availableUntil}
                    onChange={(e) => setAvailableUntil(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* إعدادات المحاولات */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              عدد المحاولات المسموحة
            </Label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={1}
                max={10}
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 1)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">
                محاولة لكل طالب
              </span>
            </div>
          </div>

          <Separator />

          {/* إعدادات العرض */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              إعدادات العرض للطالب
            </Label>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">عرض الإجابات الصحيحة</p>
                <p className="text-xs text-muted-foreground">
                  السماح للطالب برؤية الإجابات بعد التصحيح
                </p>
              </div>
              <Switch
                checked={showAnswersToStudents}
                onCheckedChange={setShowAnswersToStudents}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">مراجعة الامتحان</p>
                <p className="text-xs text-muted-foreground">
                  السماح للطالب بمراجعة إجاباته بعد التقديم
                </p>
              </div>
              <Switch
                checked={allowReviewAfterSubmit}
                onCheckedChange={setAllowReviewAfterSubmit}
              />
            </div>
          </div>

          {/* ملخص */}
          {isPublished && (
            <>
              <Separator />
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">
                  ملخص النشر:
                </p>
                <ul className="text-xs text-green-600 dark:text-green-500 space-y-1">
                  <li>• الصفوف: {selectedGrades.length > 0 ? selectedGrades.map(g => `الصف ${g}`).join('، ') : 'لم يتم تحديد'}</li>
                  <li>• الفترة: {useTimeWindow ? 'محددة' : 'متاح دائماً'}</li>
                  <li>• المحاولات: {maxAttempts} محاولة لكل طالب</li>
                  <li>• المدة: {exam.duration_minutes} دقيقة</li>
                </ul>
              </div>
            </>
          )}
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
