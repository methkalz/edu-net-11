import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useExamSystem } from '@/hooks/useExamSystem';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PlayCircle, CalendarIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ExamActivationDialogProps {
  template: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ExamActivationDialog: React.FC<ExamActivationDialogProps> = ({
  template,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { userProfile } = useAuth();
  const { activateExamForClasses, loading } = useExamSystem();
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [activationType, setActivationType] = useState<'immediate' | 'scheduled'>('immediate');
  const [startsAt, setStartsAt] = useState<Date | undefined>();
  const [lastAttemptTime, setLastAttemptTime] = useState<Date | undefined>();

  useEffect(() => {
    if (open) {
      fetchTeacherClasses();
      // تعيين قيم افتراضية
      handleActivationTypeChange('immediate');
    }
  }, [open]);

  const fetchTeacherClasses = async () => {
    const { data, error } = await supabase
      .from('teacher_classes')
      .select(`
        class_id,
        classes(
          id,
          grade_levels(id, label, code),
          class_names(id, name)
        )
      `)
      .eq('teacher_id', userProfile?.user_id);

    if (error) {
      console.error('Error fetching teacher classes:', error);
      toast({
        title: "خطأ",
        description: "فشل تحميل الصفوف",
        variant: "destructive",
      });
      return;
    }

    // تصفية صفوف الحادي عشر فقط
    const grade11Classes = (data || []).filter((tc: any) => 
      tc.classes?.grade_levels?.code === '11'
    );
    
    setTeacherClasses(grade11Classes);
  };

  const handleActivationTypeChange = (type: 'immediate' | 'scheduled') => {
    setActivationType(type);
    const now = new Date();
    
    if (type === 'immediate') {
      setStartsAt(now);
      // تعيين وقت افتراضي لآخر موعد للبدء (نهاية اليوم الدراسي - 3 مساءً)
      const endOfDay = new Date(now);
      endOfDay.setHours(15, 0, 0, 0);
      setLastAttemptTime(endOfDay);
    } else {
      setStartsAt(undefined);
      setLastAttemptTime(undefined);
    }
  };

  const handleActivate = async () => {
    if (selectedClasses.length === 0) {
      toast({
        title: "تنبيه",
        description: "يرجى اختيار صف واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    if (!lastAttemptTime) {
      toast({
        title: "تنبيه",
        description: "يرجى تحديد آخر موعد للبدء بالاختبار",
        variant: "destructive",
      });
      return;
    }

    // التحقق من أن وقت البدء قبل آخر موعد للبدء
    if (startsAt && lastAttemptTime && lastAttemptTime <= startsAt) {
      toast({
        title: "تنبيه",
        description: "آخر موعد للبدء يجب أن يكون بعد وقت البدء",
        variant: "destructive",
      });
      return;
    }

    try {
      await activateExamForClasses(
        template.id,
        selectedClasses,
        startsAt,
        lastAttemptTime
      );

      toast({
        title: "تم التفعيل",
        description: "تم تفعيل الاختبار للصفوف المحددة بنجاح",
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تفعيل الاختبار",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right">تفعيل الاختبار: {template.title}</DialogTitle>
          <DialogDescription className="text-right">
            اختر الصفوف ونوع التفعيل
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* نوع التفعيل */}
          <div className="space-y-2">
            <Label className="text-right block">نوع التفعيل</Label>
            <RadioGroup value={activationType} onValueChange={(v) => handleActivationTypeChange(v as 'immediate' | 'scheduled')}>
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="immediate" id="immediate" />
                <Label htmlFor="immediate" className="cursor-pointer">بدء فوري</Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="scheduled" id="scheduled" />
                <Label htmlFor="scheduled" className="cursor-pointer">مجدول</Label>
              </div>
            </RadioGroup>
            
            {activationType === 'immediate' && (
              <p className="text-sm text-muted-foreground text-right mt-2">
                سيظهر الاختبار للطلاب فوراً ويمكنهم البدء حتى الوقت المحدد
              </p>
            )}
            {activationType === 'scheduled' && (
              <p className="text-sm text-muted-foreground text-right mt-2">
                سيظهر الاختبار للطلاب كـ "قادم" حتى موعد البدء المحدد
              </p>
            )}
          </div>

          {/* تخصيص الأوقات */}
          <div className="space-y-4 border rounded-lg p-4">
            {activationType === 'scheduled' && (
              <div className="space-y-2">
                <Label className="text-right block">وقت البدء</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-right font-normal",
                        !startsAt && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {startsAt ? format(startsAt, "PPP 'الساعة' p", { locale: ar }) : "اختر التاريخ والوقت"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startsAt}
                      onSelect={(date) => {
                        if (date) {
                          const newDate = new Date(date);
                          newDate.setHours(8, 0, 0, 0);
                          setStartsAt(newDate);
                        }
                      }}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-right block">آخر موعد للبدء بمحاولة جديدة</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-right font-normal",
                      !lastAttemptTime && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {lastAttemptTime ? format(lastAttemptTime, "PPP 'الساعة' p", { locale: ar }) : "اختر التاريخ والوقت"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={lastAttemptTime}
                    onSelect={(date) => {
                      if (date) {
                        const newDate = new Date(date);
                        if (activationType === 'immediate') {
                          newDate.setHours(15, 0, 0, 0);
                        }
                        setLastAttemptTime(newDate);
                      }
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground text-right">
                بعد هذا الوقت، لا يمكن للطلاب بدء محاولات جديدة، لكن يمكنهم إكمال محاولاتهم الجارية
              </p>
            </div>
          </div>

          {/* اختيار الصفوف */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">اختيار الصفوف</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {teacherClasses.map((tc: any) => (
                  <div key={tc.class_id} className="flex items-center gap-2">
                    <Checkbox
                      id={`class-${tc.class_id}`}
                      checked={selectedClasses.includes(tc.class_id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedClasses([...selectedClasses, tc.class_id]);
                        } else {
                          setSelectedClasses(selectedClasses.filter(id => id !== tc.class_id));
                        }
                      }}
                    />
                    <Label htmlFor={`class-${tc.class_id}`} className="cursor-pointer">
                      {tc.classes.grade_levels.label} - {tc.classes.class_names.name}
                    </Label>
                  </div>
                ))}
              </div>
              {selectedClasses.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <Badge variant="secondary">
                    تم اختيار {selectedClasses.length} صف
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* أزرار الإجراء */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleActivate}
              disabled={loading || selectedClasses.length === 0}
            >
              <PlayCircle className="h-4 w-4 ml-2" />
              تفعيل الاختبار
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExamActivationDialog;
