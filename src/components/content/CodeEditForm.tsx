import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Code } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Grade11LessonMedia } from '@/hooks/useGrade11Content';

const PROGRAMMING_LANGUAGES = [
  { value: 'cmd', label: 'Command Prompt (CMD)' },
  { value: 'bash', label: 'Bash/Terminal' },
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'sql', label: 'SQL' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'xml', label: 'XML' },
  { value: 'php', label: 'PHP' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'plaintext', label: 'Plain Text' },
];

interface CodeEditFormProps {
  media: Grade11LessonMedia;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<Grade11LessonMedia>) => Promise<void>;
}

const CodeEditForm: React.FC<CodeEditFormProps> = ({
  media,
  isOpen,
  onClose,
  onUpdate
}) => {
  const { userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    language: 'cmd',
    enableTypewriter: true,
    typewriterSpeed: 30,
    autoRestart: true,
    loop: true,
    pauseDuration: 1000,
    showLineNumbers: true,
    theme: 'dark',
  });

  // Check if user can edit (superadmin only)
  const canEdit = userProfile?.role === 'superadmin';

  useEffect(() => {
    if (media && media.metadata) {
      console.log('CodeEditForm: Media changed, updating formData', media.id);
      
      // Handle both nested and non-nested metadata structures
      let codeMetadata = media.metadata || {};
      
      // Check if metadata is double-nested (metadata.metadata.code)
      if (codeMetadata.metadata && !codeMetadata.code) {
        codeMetadata = codeMetadata.metadata;
      }
      
      setFormData({
        title: codeMetadata.title || media.file_name || '',
        code: codeMetadata.code || '',
        language: codeMetadata.language || 'cmd',
        enableTypewriter: codeMetadata.enableTypewriter ?? true,
        typewriterSpeed: codeMetadata.typewriterSpeed || 30,
        autoRestart: codeMetadata.autoRestart ?? true,
        loop: codeMetadata.loop ?? true,
        pauseDuration: codeMetadata.pauseDuration || 1000,
        showLineNumbers: codeMetadata.showLineNumbers ?? true,
        theme: codeMetadata.theme || 'dark',
      });
    }
  }, [media, media.metadata]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canEdit) {
      toast({
        title: "غير مسموح",
        description: "لا يمكنك تعديل هذا المحتوى",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('=== CODE FORM SUBMIT START ===');
      console.log('Original media metadata:', JSON.stringify(media.metadata, null, 2));
      console.log('Form data:', JSON.stringify(formData, null, 2));
      
      // Create a properly structured metadata that matches the read format
      const updatedMetadata = {
        // Preserve any existing metadata at the top level
        ...media.metadata,
        // Add all the code-specific fields at the same level
        title: formData.title,
        code: formData.code,
        language: formData.language,
        enableTypewriter: formData.enableTypewriter,
        typewriterSpeed: formData.typewriterSpeed,
        autoRestart: formData.autoRestart,
        loop: formData.loop,
        pauseDuration: formData.pauseDuration,
        showLineNumbers: formData.showLineNumbers,
        theme: formData.theme,
      };

      console.log('Updated metadata to save:', JSON.stringify(updatedMetadata, null, 2));

      await onUpdate({
        file_name: formData.title,
        metadata: updatedMetadata
      });

      toast({
        title: "تم التحديث",
        description: "تم تحديث إعدادات الكود بنجاح",
        variant: "default",
      });

      console.log('=== CODE FORM SUBMIT SUCCESS ===');
      onClose();
    } catch (error) {
      console.error('=== CODE FORM SUBMIT ERROR ===');
      console.error('Error details:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث الكود. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!canEdit) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code className="h-5 w-5 text-blue-500" />
              عرض إعدادات الكود
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground text-center">
              عذراً، لا يمكنك تعديل هذا المحتوى. هذه الميزة متاحة للمدير العام فقط.
            </p>
            
            <div className="space-y-3">
              <div>
                <Label>العنوان</Label>
                <p className="text-sm font-medium">{formData.title}</p>
              </div>
              <div>
                <Label>لغة البرمجة</Label>
                <p className="text-sm font-medium">
                  {PROGRAMMING_LANGUAGES.find(l => l.value === formData.language)?.label}
                </p>
              </div>
              <div>
                <Label>تأثير الكتابة</Label>
                <p className="text-sm font-medium">{formData.enableTypewriter ? 'مفعل' : 'معطل'}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-blue-500" />
            تعديل إعدادات الكود
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">عنوان الكود</Label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="مثال: حلقة For في البايثون"
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">لغة البرمجة</Label>
              <Select value={formData.language} onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر لغة البرمجة" />
                </SelectTrigger>
                <SelectContent>
                  {PROGRAMMING_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">الكود</Label>
            <Textarea
              id="code"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              placeholder="اكتب الكود هنا..."
              className="min-h-64 font-mono text-right"
              dir="ltr"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="enableTypewriter">تفعيل تأثير الكتابة</Label>
              <Switch
                id="enableTypewriter"
                checked={formData.enableTypewriter}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enableTypewriter: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="showLineNumbers">إظهار أرقام الأسطر</Label>
              <Switch
                id="showLineNumbers"
                checked={formData.showLineNumbers}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showLineNumbers: checked }))}
              />
            </div>
          </div>

          {formData.enableTypewriter && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="typewriterSpeed">سرعة تأثير الكتابة (مللي ثانية)</Label>
                <Input
                  id="typewriterSpeed"
                  type="number"
                  min="10"
                  max="1000"
                  value={formData.typewriterSpeed}
                  onChange={(e) => setFormData(prev => ({ ...prev, typewriterSpeed: parseInt(e.target.value) || 50 }))}
                  className="text-right"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoRestart">إعادة تشغيل تلقائي</Label>
                  <Switch
                    id="autoRestart"
                    checked={formData.autoRestart}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoRestart: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="loop">تكرار مستمر</Label>
                  <Switch
                    id="loop"
                    checked={formData.loop}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, loop: checked }))}
                  />
                </div>
              </div>

              {(formData.autoRestart || formData.loop) && (
                <div className="space-y-2">
                  <Label htmlFor="pauseDuration">مدة التوقف بين التكرارات (مللي ثانية)</Label>
                  <Input
                    id="pauseDuration"
                    type="number"
                    min="500"
                    max="10000"
                    value={formData.pauseDuration}
                    onChange={(e) => setFormData(prev => ({ ...prev, pauseDuration: parseInt(e.target.value) || 2000 }))}
                    className="text-right"
                  />
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="theme">نمط العرض</Label>
            <Select value={formData.theme} onValueChange={(value) => setFormData(prev => ({ ...prev, theme: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="اختر نمط العرض" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">داكن</SelectItem>
                <SelectItem value="light">فاتح</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-medium">معاينة الإعدادات الحالية</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">العنوان:</span> {formData.title}
              </div>
              <div>
                <span className="font-medium">اللغة:</span> {PROGRAMMING_LANGUAGES.find(l => l.value === formData.language)?.label}
              </div>
              <div>
                <span className="font-medium">تأثير الكتابة:</span> {formData.enableTypewriter ? 'مفعل' : 'معطل'}
              </div>
              <div>
                <span className="font-medium">النمط:</span> {formData.theme === 'dark' ? 'داكن' : 'فاتح'}
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isLoading || !formData.code.trim()}>
              {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CodeEditForm;