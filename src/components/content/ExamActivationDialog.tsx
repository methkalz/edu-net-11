import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { useExamSystem } from '@/hooks/useExamSystem';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PlayCircle, Clock, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
  const [startsAt, setStartsAt] = useState<Date | undefined>(new Date());
  const [endsAt, setEndsAt] = useState<Date | undefined>();
  const [quickOption, setQuickOption] = useState<string>('now');

  useEffect(() => {
    if (open) {
      fetchTeacherClasses();
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

  const handleQuickOption = (option: string) => {
    setQuickOption(option);
    const now = new Date();
    
    switch(option) {
      case 'now':
        setStartsAt(now);
        setEndsAt(undefined);
        break;
      case 'tomorrow':
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(8, 0, 0, 0);
        setStartsAt(tomorrow);
        setEndsAt(undefined);
        break;
      case 'next_week':
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        nextWeek.setHours(8, 0, 0, 0);
        setStartsAt(nextWeek);
        setEndsAt(undefined);
        break;
      case 'custom':
        // يبقى كما هو
        break;
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

    try {
      await activateExamForClasses(
        template.id,
        selectedClasses,
        startsAt,
        endsAt
      );
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      // error handled in hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-primary" />
            تفعيل الاختبار: {template?.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">خيارات سريعة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={quickOption === 'now' ? 'default' : 'outline'}
                  onClick={() => handleQuickOption('now')}
                  className="justify-start"
                >
                  <PlayCircle className="h-4 w-4 ml-2" />
                  بدء فوري
                </Button>
                <Button
                  variant={quickOption === 'tomorrow' ? 'default' : 'outline'}
                  onClick={() => handleQuickOption('tomorrow')}
                  className="justify-start"
                >
                  <Calendar className="h-4 w-4 ml-2" />
                  غداً الساعة 8 صباحاً
                </Button>
                <Button
                  variant={quickOption === 'next_week' ? 'default' : 'outline'}
                  onClick={() => handleQuickOption('next_week')}
                  className="justify-start"
                >
                  <Clock className="h-4 w-4 ml-2" />
                  الأسبوع القادم
                </Button>
                <Button
                  variant={quickOption === 'custom' ? 'default' : 'outline'}
                  onClick={() => handleQuickOption('custom')}
                  className="justify-start"
                >
                  تخصيص الوقت
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Class Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">اختيار الصفوف</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {teacherClasses.map((tc: any) => (
                  <div key={tc.class_id} className="flex items-center gap-2">
                    <Checkbox
                      id={`quick-class-${tc.class_id}`}
                      checked={selectedClasses.includes(tc.class_id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedClasses([...selectedClasses, tc.class_id]);
                        } else {
                          setSelectedClasses(selectedClasses.filter(id => id !== tc.class_id));
                        }
                      }}
                    />
                    <Label htmlFor={`quick-class-${tc.class_id}`} className="cursor-pointer">
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

          {/* Custom Schedule */}
          {quickOption === 'custom' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">جدولة مخصصة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>تاريخ ووقت البدء</Label>
                  <DateTimePicker
                    value={startsAt}
                    onChange={setStartsAt}
                  />
                </div>
                <div className="space-y-2">
                  <Label>تاريخ ووقت الانتهاء (اختياري)</Label>
                  <DateTimePicker
                    value={endsAt}
                    onChange={setEndsAt}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
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
