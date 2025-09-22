import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface AcademicYear {
  id: string;
  name: string;
  start_at_utc: string;
  end_at_utc: string;
  granularity: 'year' | 'month' | 'day';
  status: 'active' | 'archived';
}

interface AcademicYearFormProps {
  academicYear?: AcademicYear | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AcademicYearForm: React.FC<AcademicYearFormProps> = ({
  academicYear,
  onSuccess,
  onCancel
}) => {
  const { userProfile } = useAuth();
  const [granularity, setGranularity] = useState<'year' | 'month' | 'day'>('year');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [startMonth, setStartMonth] = useState('');
  const [endMonth, setEndMonth] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [previewName, setPreviewName] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // التحقق من أن المستخدم سوبر آدمن
  const isSuperAdmin = userProfile?.role === 'superadmin';

  // منع الوصول إذا لم يكن سوبر آدمن
  useEffect(() => {
    if (userProfile && !isSuperAdmin) {
      toast({
        title: 'غير مصرح',
        description: 'هذا النموذج مخصص للسوبر آدمن فقط',
        variant: 'destructive',
      });
      onCancel();
    }
  }, [userProfile, isSuperAdmin, onCancel, toast]);

  // تحديث المعاينة عند تغيير المدخلات
  useEffect(() => {
    let name = '';
    
    if (granularity === 'year' && startYear && endYear) {
      name = `${startYear}-${endYear}`;
    } else if (granularity === 'month' && startMonth && startYear && endMonth && endYear) {
      name = `${startYear}-${endYear}`;
    } else if (granularity === 'day' && startDate && endDate) {
      name = `${startDate.getFullYear()}-${endDate.getFullYear()}`;
    }
    
    setPreviewName(name);
  }, [granularity, startYear, endYear, startMonth, endMonth, startDate, endDate]);

  // تعبئة النموذج للتعديل
  useEffect(() => {
    if (academicYear) {
      const start = new Date(academicYear.start_at_utc);
      const end = new Date(academicYear.end_at_utc);
      
      setGranularity(academicYear.granularity);
      
      if (academicYear.granularity === 'year') {
        setStartYear(start.getFullYear().toString());
        setEndYear(end.getFullYear().toString());
      } else if (academicYear.granularity === 'month') {
        setStartYear(start.getFullYear().toString());
        setEndYear(end.getFullYear().toString());
        setStartMonth((start.getMonth() + 1).toString().padStart(2, '0'));
        setEndMonth((end.getMonth() + 1).toString().padStart(2, '0'));
      } else if (academicYear.granularity === 'day') {
        setStartDate(start);
        setEndDate(end);
      }
    }
  }, [academicYear]);

  const calculateUTCDates = () => {
    let startUTC: Date;
    let endUTC: Date;

    if (granularity === 'year') {
      startUTC = new Date(`${startYear}-01-01T00:00:00.000Z`);
      endUTC = new Date(`${endYear}-12-31T23:59:59.999Z`);
    } else if (granularity === 'month') {
      const startMonthNum = parseInt(startMonth);
      const endMonthNum = parseInt(endMonth);
      
      startUTC = new Date(`${startYear}-${startMonth.padStart(2, '0')}-01T00:00:00.000Z`);
      
      // حساب آخر يوم في الشهر
      const lastDay = new Date(parseInt(endYear), endMonthNum, 0).getDate();
      endUTC = new Date(`${endYear}-${endMonth.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}T23:59:59.999Z`);
    } else if (granularity === 'day') {
      if (!startDate || !endDate) return null;
      
      startUTC = new Date(startDate);
      startUTC.setUTCHours(0, 0, 0, 0);
      
      endUTC = new Date(endDate);
      endUTC.setUTCHours(23, 59, 59, 999);
    } else {
      return null;
    }

    return { startUTC, endUTC };
  };

  const checkOverlap = async (startUTC: Date, endUTC: Date, excludeId?: string) => {
    // التحقق من التداخل الفعلي - فقط إذا كانت إحدى السنوات تحتوي كامل على الأخرى
    // أو كان هناك تداخل كبير (أكثر من 6 أشهر)
    const { data, error } = await supabase
      .from('academic_years')
      .select('id, name, start_at_utc, end_at_utc')
      .eq('status', 'active');

    if (error) throw error;

    // استبعاد السجل الحالي عند التعديل
    const existingYears = data?.filter(year => year.id !== excludeId) || [];
    
    for (const year of existingYears) {
      const existingStart = new Date(year.start_at_utc);
      const existingEnd = new Date(year.end_at_utc);
      
      // حساب التداخل الفعلي
      const overlapStart = new Date(Math.max(startUTC.getTime(), existingStart.getTime()));
      const overlapEnd = new Date(Math.min(endUTC.getTime(), existingEnd.getTime()));
      
      // إذا كان هناك تداخل فعلي
      if (overlapStart < overlapEnd) {
        const overlapDays = (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24);
        
        // السماح بتداخل قصير (أقل من 30 يوم) للانتقال بين السنوات
        if (overlapDays > 30) {
          return year;
        }
      }
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // التحقق من الصلاحية مرة أخرى
    if (!isSuperAdmin) {
      toast({
        title: 'غير مصرح',
        description: 'هذه العملية مخصصة للسوبر آدمن فقط',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const dates = calculateUTCDates();
      if (!dates) {
        toast({
          title: 'خطأ',
          description: 'يرجى تعبئة جميع التواريخ المطلوبة',
          variant: 'destructive',
        });
        return;
      }

      const { startUTC, endUTC } = dates;

      // التحقق من عدم التداخل
      const overlapping = await checkOverlap(startUTC, endUTC, academicYear?.id);
      if (overlapping) {
        toast({
          title: 'خطأ في التداخل',
          description: `هناك تداخل مع السنة الدراسية: ${overlapping.name}`,
          variant: 'destructive',
        });
        return;
      }

      const yearData = {
        name: previewName,
        start_at_utc: startUTC.toISOString(),
        end_at_utc: endUTC.toISOString(),
        granularity,
        created_by: (await supabase.auth.getUser()).data.user?.id
      };

      let result;
      let action;

      if (academicYear) {
        // تحديث
        result = await supabase
          .from('academic_years')
          .update(yearData)
          .eq('id', academicYear.id);
        action = 'update';
      } else {
        // إنشاء جديد
        result = await supabase
          .from('academic_years')
          .insert(yearData);
        action = 'create';
      }

      if (result.error) throw result.error;

      // تسجيل في audit log
      await supabase.from('audit_log').insert({
        actor_user_id: (await supabase.auth.getUser()).data.user?.id,
        action,
        entity: 'academic_year',
        entity_id: academicYear?.id || result.data?.[0]?.id,
        payload_json: yearData
      });

      toast({
        title: 'نجح',
        description: academicYear ? 'تم تحديث السنة الدراسية بنجاح' : 'تم إنشاء السنة الدراسية بنجاح',
      });

      onSuccess();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في حفظ السنة الدراسية',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // عدم عرض النموذج إذا لم يكن سوبر آدمن
  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>
            {academicYear ? 'تعديل السنة الدراسية' : 'إضافة سنة دراسية جديدة'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* اختيار مستوى الدقة */}
            <div>
              <Label className="text-base font-medium">مستوى الدقة</Label>
              <RadioGroup value={granularity} onValueChange={(value: 'year' | 'month' | 'day') => setGranularity(value)} className="mt-2">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="year" id="year" />
                  <Label htmlFor="year">سنة/سنة</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="month" id="month" />
                  <Label htmlFor="month">شهر/سنة</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="day" id="day" />
                  <Label htmlFor="day">يوم/شهر/سنة</Label>
                </div>
              </RadioGroup>
            </div>

            {/* مدخلات حسب مستوى الدقة */}
            {granularity === 'year' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-year">سنة البداية</Label>
                  <Input
                    id="start-year"
                    type="number"
                    value={startYear}
                    onChange={(e) => setStartYear(e.target.value)}
                    placeholder="2025"
                    min="2020"
                    max="2050"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end-year">سنة النهاية</Label>
                  <Input
                    id="end-year"
                    type="number"
                    value={endYear}
                    onChange={(e) => setEndYear(e.target.value)}
                    placeholder="2026"
                    min="2020"
                    max="2050"
                    required
                  />
                </div>
              </div>
            )}

            {granularity === 'month' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>تاريخ البداية</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={startMonth}
                      onChange={(e) => setStartMonth(e.target.value)}
                      placeholder="شهر"
                      min="1"
                      max="12"
                      required
                    />
                    <Input
                      type="number"
                      value={startYear}
                      onChange={(e) => setStartYear(e.target.value)}
                      placeholder="سنة"
                      min="2020"
                      max="2050"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label>تاريخ النهاية</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={endMonth}
                      onChange={(e) => setEndMonth(e.target.value)}
                      placeholder="شهر"
                      min="1"
                      max="12"
                      required
                    />
                    <Input
                      type="number"
                      value={endYear}
                      onChange={(e) => setEndYear(e.target.value)}
                      placeholder="سنة"
                      min="2020"
                      max="2050"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {granularity === 'day' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>تاريخ البداية</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "dd.M.yyyy") : "اختر تاريخ البداية"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>تاريخ النهاية</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "dd.M.yyyy") : "اختر تاريخ النهاية"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

            {/* معاينة الاسم */}
            {previewName && (
              <div className="p-4 bg-muted rounded-lg">
                <Label className="text-sm font-medium">معاينة اسم السنة الدراسية:</Label>
                <div className="text-lg font-bold mt-1">{previewName}</div>
              </div>
            )}

            {/* أزرار الإجراءات */}
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={onCancel}>
                إلغاء
              </Button>
              <Button type="submit" disabled={loading || !previewName}>
                {loading ? 'جاري الحفظ...' : 'حفظ'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};