import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { logger } from '@/lib/logger';
import { ar } from 'date-fns/locale';
import { CalendarIcon, Upload, X, Trophy, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import DocumentEditor from './DocumentEditor';

interface ProjectFormProps {
  project?: any;
  onClose: () => void;
  onSave: (project: any) => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ project, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: project?.title || '',
    description: project?.description || '',
    requirements: project?.requirements || '',
    rubric: project?.rubric || '',
    due_date: project?.due_date ? new Date(project.due_date) : undefined,
    document_template: project?.document_template || ''
  });

  const [isUploading, setIsUploading] = useState(false);

  const handleInputChange = (field: string, value: string | Date) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDocumentChange = (content: string) => {
    handleInputChange('document_template', content);
  };

  const handleSave = () => {
    const projectData = {
      ...formData,
      due_date: formData.due_date ? format(formData.due_date, 'yyyy-MM-dd') : null
    };
    logger.debug('Saving project data', { 
      projectTitle: formData.title, 
      hasDueDate: !!formData.due_date 
    });
    onSave(projectData);
  };

  const handleTemplateUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      // محاكاة رفع الملف
      setTimeout(() => {
        setIsUploading(false);
        // هنا سيتم تحويل الملف إلى نص قابل للتحرير
        handleInputChange('document_template', `قالب مشروع من الملف: ${file.name}`);
      }, 2000);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            {project ? 'تعديل المشروع' : 'إضافة مشروع جديد'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* معلومات المشروع */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">معلومات المشروع</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">عنوان المشروع</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="أدخل عنوان المشروع النهائي"
                />
              </div>

              <div>
                <Label htmlFor="description">وصف المشروع</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="أدخل وصف شامل للمشروع وأهدافه"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>تاريخ التسليم</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.due_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {formData.due_date ? (
                          format(formData.due_date, "PPP", { locale: ar })
                        ) : (
                          <span>اختر تاريخ التسليم</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.due_date}
                        onSelect={(date) => handleInputChange('due_date', date || new Date())}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* متطلبات المشروع */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">متطلبات المشروع</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="requirements">المتطلبات والمعايير</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => handleInputChange('requirements', e.target.value)}
                  placeholder="أدخل متطلبات المشروع والمعايير المطلوبة للتقييم"
                  rows={6}
                />
              </div>

              <div>
                <Label htmlFor="rubric">معايير التقييم</Label>
                <Textarea
                  id="rubric"
                  value={formData.rubric}
                  onChange={(e) => handleInputChange('rubric', e.target.value)}
                  placeholder="أدخل معايير التقييم المفصلة وتوزيع الدرجات"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* قالب المستند */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">قالب المستند</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('template-upload')?.click()}
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 ml-1" />
                  {isUploading ? 'جاري الرفع...' : 'رفع قالب'}
                </Button>
                <Input
                  id="template-upload"
                  type="file"
                  accept=".doc,.docx,.pdf"
                  className="hidden"
                  onChange={handleTemplateUpload}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">محرر القالب</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    قم بإنشاء قالب المستند الذي سيستخدمه الطلاب لكتابة مشاريعهم
                  </p>
                  
                  <DocumentEditor
                    content={formData.document_template}
                    onChange={handleDocumentChange}
                    placeholder="اكتب قالب المشروع هنا... يمكنك تضمين العناوين والأقسام والتوجيهات للطلاب"
                  />
                </div>

                <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                  <strong>نصائح لإنشاء قالب فعال:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>ضع عناوين واضحة للأقسام المطلوبة</li>
                    <li>أضف توجيهات وإرشادات لكل قسم</li>
                    <li>حدد عدد الكلمات أو الصفحات المطلوبة</li>
                    <li>اتبع تنسيق موحد ومنظم</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* أزرار الحفظ والإلغاء */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!formData.title || isUploading}
            >
              {isUploading ? 'جاري المعالجة...' : 'حفظ المشروع'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectForm;