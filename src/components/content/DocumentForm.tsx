import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, X, FileText } from 'lucide-react';
import { logger } from '@/lib/logger';
import { DocumentResponse } from '@/types/api-responses';

interface DocumentFormProps {
  document?: DocumentResponse;
  onClose: () => void;
  onSave: (document: DocumentResponse) => void;
}

const DocumentForm: React.FC<DocumentFormProps> = ({ document, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: document?.title || '',
    description: document?.description || '',
    file_path: document?.file_path || '',
    file_type: document?.file_type || 'docx',
    category: document?.category || 'general',
    grade_level: document?.grade_level || '10'
  });

  const [isUploading, setIsUploading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // هنا سيتم حفظ البيانات في قاعدة البيانات
    logger.info('حفظ بيانات الملف', { 
      title: formData.title,
      hasFile: !!formData.file_path,
      fileType: formData.file_type 
    });
    
    const documentData: DocumentResponse = {
      id: document?.id || '',
      title: formData.title,
      description: formData.description,
      file_path: formData.file_path,
      file_type: formData.file_type,
      category: formData.category,
      grade_level: formData.grade_level,
      owner_user_id: document?.owner_user_id || '',
      school_id: document?.school_id,
      is_visible: document?.is_visible ?? true,
      allowed_roles: document?.allowed_roles,
      order_index: document?.order_index,
      created_at: document?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    onSave(documentData);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      // هنا سيتم رفع الملف إلى Supabase Storage
      logger.info('رفع الملف', { 
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type 
      });
      
      // تحديد نوع الملف
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      setTimeout(() => {
        setIsUploading(false);
        handleInputChange('file_path', URL.createObjectURL(file));
        handleInputChange('file_type', fileExtension || 'docx');
      }, 2000);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {document ? 'تعديل الملف' : 'إضافة ملف جديد'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* معلومات الملف */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">معلومات الملف</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">عنوان الملف</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="أدخل عنوان الملف"
                />
              </div>

              <div>
                <Label htmlFor="description">وصف الملف</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="أدخل وصف مفصل للملف وما يحتويه"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* رفع الملف */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ملف الوورد</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file-upload">رفع ملف الوورد</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  {formData.file_path ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="h-8 w-8 text-blue-600" />
                        <div className="text-center">
                          <div className="font-medium">ملف محمل</div>
                          <div className="text-sm text-muted-foreground">
                            النوع: {formData.file_type.toUpperCase()}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleInputChange('file_path', '');
                          handleInputChange('file_type', 'docx');
                        }}
                      >
                        <X className="h-4 w-4 ml-1" />
                        إزالة
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <div>
                        <Label htmlFor="file-upload" className="cursor-pointer">
                          <span className="text-primary hover:underline">
                            اختر ملف وورد
                          </span>
                          <span className="text-muted-foreground"> أو اسحبه هنا</span>
                        </Label>
                        <Input
                          id="file-upload"
                          type="file"
                          accept=".doc,.docx,.pdf"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        الحد الأقصى: 10MB | الأنواع المدعومة: DOC, DOCX, PDF
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* معاينة محتوى الملف */}
              {formData.file_path && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="font-medium mb-2">معاينة الملف:</h4>
                  <div className="text-sm text-muted-foreground">
                    سيتم عرض محتوى الملف هنا للطلاب بحيث يمكنهم العمل عليه مباشرة
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* إعدادات إضافية */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">إعدادات إضافية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>السماح بالتحميل</Label>
                  <div className="text-sm text-muted-foreground">
                    السماح للطلاب بتحميل الملف
                  </div>
                </div>
                <div>
                  <Label>السماح بالتعديل</Label>
                  <div className="text-sm text-muted-foreground">
                    السماح للطلاب بتعديل الملف
                  </div>
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
              {isUploading ? 'جاري الرفع...' : 'حفظ'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentForm;