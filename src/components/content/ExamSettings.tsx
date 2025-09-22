import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Settings, Save, X } from 'lucide-react';
import { useExamSystem } from '@/hooks/useExamSystem';
import { logger } from '@/lib/logger';

interface ExamSettingsProps {
  template: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const ExamSettings: React.FC<ExamSettingsProps> = ({
  template,
  open,
  onOpenChange,
  onSuccess
}) => {
  const { updateTemplateSettings, loading } = useExamSystem();
  const [settings, setSettings] = useState({
    is_active: template?.is_active || false,
    max_attempts: template?.max_attempts || 1,
    show_results_immediately: template?.show_results_immediately || false,
    randomize_questions: template?.randomize_questions || true,
    randomize_answers: template?.randomize_answers || true,
    pass_percentage: template?.pass_percentage || 60,
    time_limit_type: 'fixed', // fixed, flexible, unlimited
    allow_review: false,
    require_webcam: false,
    allow_calculator: false,
    show_question_numbers: true,
    allow_back_navigation: true
  });

  React.useEffect(() => {
    if (template && open) {
      setSettings({
        is_active: template.is_active || false,
        max_attempts: template.max_attempts || 1,
        show_results_immediately: template.show_results_immediately || false,
        randomize_questions: template.randomize_questions || true,
        randomize_answers: template.randomize_answers || true,
        pass_percentage: template.pass_percentage || 60,
        time_limit_type: 'fixed',
        allow_review: false,
        require_webcam: false,
        allow_calculator: false,
        show_question_numbers: true,
        allow_back_navigation: true
      });
    }
  }, [template, open]);

  const handleSave = async () => {
    try {
      await updateTemplateSettings(template.id, settings);
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      logger.error('Error updating exam settings', error as Error);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            إعدادات الاختبار: {template?.title}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">الإعدادات الأساسية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">تفعيل الاختبار</Label>
                  <div className="text-sm text-muted-foreground">
                    هل يمكن للطلاب الوصول إلى هذا الاختبار؟
                  </div>
                </div>
                <Switch
                  checked={settings.is_active}
                  onCheckedChange={(checked) => handleSettingChange('is_active', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_attempts">عدد المحاولات المسموحة</Label>
                <Select 
                  value={settings.max_attempts.toString()} 
                  onValueChange={(value) => handleSettingChange('max_attempts', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">محاولة واحدة</SelectItem>
                    <SelectItem value="2">محاولتان</SelectItem>
                    <SelectItem value="3">ثلاث محاولات</SelectItem>
                    <SelectItem value="5">خمس محاولات</SelectItem>
                    <SelectItem value="-1">غير محدود</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pass_percentage">النسبة المطلوبة للنجاح (%)</Label>
                <Input
                  id="pass_percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={settings.pass_percentage}
                  onChange={(e) => handleSettingChange('pass_percentage', parseInt(e.target.value))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">إظهار النتائج فوراً</Label>
                  <div className="text-sm text-muted-foreground">
                    عرض النتيجة للطالب فور انتهاء الاختبار
                  </div>
                </div>
                <Switch
                  checked={settings.show_results_immediately}
                  onCheckedChange={(checked) => handleSettingChange('show_results_immediately', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Question Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">إعدادات الأسئلة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">ترتيب عشوائي للأسئلة</Label>
                  <div className="text-sm text-muted-foreground">
                    أسئلة مختلفة لكل طالب
                  </div>
                </div>
                <Switch
                  checked={settings.randomize_questions}
                  onCheckedChange={(checked) => handleSettingChange('randomize_questions', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">ترتيب عشوائي للإجابات</Label>
                  <div className="text-sm text-muted-foreground">
                    ترتيب مختلف للخيارات لكل طالب
                  </div>
                </div>
                <Switch
                  checked={settings.randomize_answers}
                  onCheckedChange={(checked) => handleSettingChange('randomize_answers', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">إظهار أرقام الأسئلة</Label>
                  <div className="text-sm text-muted-foreground">
                    عرض "السؤال 1 من 20"
                  </div>
                </div>
                <Switch
                  checked={settings.show_question_numbers}
                  onCheckedChange={(checked) => handleSettingChange('show_question_numbers', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">السماح بالعودة للأسئلة السابقة</Label>
                  <div className="text-sm text-muted-foreground">
                    يمكن للطالب تعديل إجاباته السابقة
                  </div>
                </div>
                <Switch
                  checked={settings.allow_back_navigation}
                  onCheckedChange={(checked) => handleSettingChange('allow_back_navigation', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">إعدادات الأمان والمراقبة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">تتبع الكاميرا الويب</Label>
                  <div className="text-sm text-muted-foreground">
                    مطالبة الطالب بتشغيل الكاميرا أثناء الاختبار
                  </div>
                </div>
                <Switch
                  checked={settings.require_webcam}
                  onCheckedChange={(checked) => handleSettingChange('require_webcam', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">السماح بالحاسبة</Label>
                  <div className="text-sm text-muted-foreground">
                    إتاحة حاسبة مدمجة في الاختبار
                  </div>
                </div>
                <Switch
                  checked={settings.allow_calculator}
                  onCheckedChange={(checked) => handleSettingChange('allow_calculator', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">السماح بمراجعة الإجابات</Label>
                  <div className="text-sm text-muted-foreground">
                    مراجعة الأسئلة والإجابات بعد الانتهاء
                  </div>
                </div>
                <Switch
                  checked={settings.allow_review}
                  onCheckedChange={(checked) => handleSettingChange('allow_review', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Exam Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">حالة الاختبار</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>الحالة الحالية:</span>
                <Badge className={settings.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                  {settings.is_active ? 'نشط ومتاح للطلاب' : 'غير نشط'}
                </Badge>
              </div>
              
              <div className="text-sm space-y-2 bg-muted p-3 rounded">
                <p><strong>عدد الأسئلة:</strong> {template?.total_questions}</p>
                <p><strong>مدة الاختبار:</strong> {template?.duration_minutes} دقيقة</p>
                <p><strong>عدد المحاولات:</strong> {settings.max_attempts === -1 ? 'غير محدود' : settings.max_attempts}</p>
                <p><strong>درجة النجاح:</strong> {settings.pass_percentage}%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            <X className="h-4 w-4 mr-2" />
            إلغاء
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExamSettings;