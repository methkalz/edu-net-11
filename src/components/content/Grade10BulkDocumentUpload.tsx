import React, { useState, useCallback } from 'react';
import { Upload, X, FileText, Eye, EyeOff, Settings, Plus, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { createSafeStoragePath, hasUnsafeCharacters, validateFileName } from '@/utils/fileNameSanitizer';
import { logger } from '@/lib/logger';

interface FileUpload {
  file: File;
  id: string;
  title: string;
  description: string;
  category: string;
  is_visible: boolean;
  allowed_roles: string[];
  progress: number;
  uploaded: boolean;
  error?: string;
  originalFileName: string;
  storagePath?: string;
}

interface Grade10BulkDocumentUploadProps {
  onUploadComplete: (documents: any[]) => void;
  onCancel: () => void;
  uploadFile: (file: File, path: string) => Promise<any>;
  addDocuments: (documents: any[]) => Promise<any>;
}

const Grade10BulkDocumentUpload: React.FC<Grade10BulkDocumentUploadProps> = ({
  onUploadComplete,
  onCancel,
  uploadFile,
  addDocuments
}) => {
  const { userProfile } = useAuth();
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [uploading, setUploading] = useState(false);
  const [globalSettings, setGlobalSettings] = useState({
    category: 'materials',
    is_visible: true,
    allowed_roles: ['all'] as string[]
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const newFiles: FileUpload[] = [];
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const validation = validateFileName(file.name);
      
      if (!validation.isValid) {
        toast.error(`${file.name}: ${validation.message}`);
        continue;
      }
      
      newFiles.push({
        file,
        id: `${Date.now()}-${i}`,
        title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension but keep original name
        description: '',
        category: globalSettings.category,
        is_visible: globalSettings.is_visible,
        allowed_roles: [...globalSettings.allowed_roles],
        progress: 0,
        uploaded: false,
        originalFileName: file.name
      });
    }

    setFiles(prev => [...prev, ...newFiles]);
    
    if (newFiles.length > 0) {
      toast.success(`تم إضافة ${newFiles.length} ملف. أسماء الملفات العربية والعبرية مدعومة!`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const newFiles: FileUpload[] = [];
    
    for (let i = 0; i < droppedFiles.length; i++) {
      const file = droppedFiles[i];
      const validation = validateFileName(file.name);
      
      if (!validation.isValid) {
        toast.error(`${file.name}: ${validation.message}`);
        continue;
      }
      
      newFiles.push({
        file,
        id: `${Date.now()}-${i}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        description: '',
        category: globalSettings.category,
        is_visible: globalSettings.is_visible,
        allowed_roles: [...globalSettings.allowed_roles],
        progress: 0,
        uploaded: false,
        originalFileName: file.name
      });
    }

    setFiles(prev => [...prev, ...newFiles]);
    
    if (newFiles.length > 0) {
      toast.success(`تم إضافة ${newFiles.length} ملف. أسماء الملفات العربية والعبرية مدعومة!`);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const updateFile = (id: string, updates: Partial<FileUpload>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const applyGlobalSettings = () => {
    setFiles(prev => prev.map(f => ({
      ...f,
      category: globalSettings.category,
      is_visible: globalSettings.is_visible,
      allowed_roles: [...globalSettings.allowed_roles]
    })));
    toast.success('تم تطبيق الإعدادات على جميع الملفات');
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('الرجاء إضافة ملفات للرفع');
      return;
    }

    setUploading(true);
    const uploadedDocuments: any[] = [];

    try {
      // Upload files to storage
      for (const fileData of files) {
        try {
          updateFile(fileData.id, { progress: 10 });
          
          // إنشاء مسار آمن للتخزين (يحتوي على timestamp و random ID فقط)
          const timestamp = new Date().getTime();
          const safeStoragePath = createSafeStoragePath(fileData.originalFileName, timestamp);
          const bucketPath = `grade10/${safeStoragePath}`;
          
          logger.debug('Processing Grade 10 file upload', {
            originalName: fileData.originalFileName,
            title: fileData.title,
            storagePath: safeStoragePath,
            bucketPath,
            fileSize: fileData.file.size
          });
          
          updateFile(fileData.id, { progress: 50, storagePath: safeStoragePath });
          
          await uploadFile(fileData.file, bucketPath);
          
          updateFile(fileData.id, { progress: 80 });

          const documentData = {
            title: fileData.title, // الاحتفاظ بالاسم الأصلي (عربي/عبري) للعرض
            description: fileData.description || null,
            file_path: bucketPath, // مسار التخزين الآمن
            file_type: fileData.file.type,
            file_size: fileData.file.size,
            category: fileData.category,
            grade_level: '10',
            owner_user_id: userProfile?.user_id || '',
            school_id: userProfile?.school_id || null,
            is_visible: fileData.is_visible,
            allowed_roles: fileData.allowed_roles,
            is_active: true,
            order_index: 0
          };

          uploadedDocuments.push(documentData);
          updateFile(fileData.id, { progress: 100, uploaded: true });
        } catch (error) {
          logger.error('Error uploading file', error as Error, {
            originalFileName: fileData.originalFileName,
            title: fileData.title,
            storagePath: fileData.storagePath
          });
          const errorMessage = error instanceof Error ? error.message : 'فشل في رفع الملف';
          updateFile(fileData.id, { error: errorMessage, progress: 0 });
        }
      }

      // Save document records to database
      if (uploadedDocuments.length > 0) {
        await addDocuments(uploadedDocuments);
        onUploadComplete(uploadedDocuments);
      }
    } catch (error) {
      logger.error('Upload error during bulk document upload', error as Error);
      toast.error('حدث خطأ أثناء رفع الملفات');
    } finally {
      setUploading(false);
    }
  };

  const categoryOptions = [
    { value: 'bagrut_exam', label: 'امتحان البجروت' },
    { value: 'worksheets', label: 'أوراق عمل' },
    { value: 'exams', label: 'امتحانات' },
    { value: 'materials', label: 'مواد تعليمية' },
    { value: 'projects', label: 'مشاريع' }
  ];

  const roleOptions = [
    { value: 'all', label: 'جميع المستخدمين' },
    { value: 'school_admin', label: 'مديري المدارس' },
    { value: 'teacher', label: 'المعلمين' },
    { value: 'student', label: 'الطلاب' },
    { value: 'parent', label: 'أولياء الأمور' }
  ];

  const handleRoleChange = (role: string, checked: boolean) => {
    setGlobalSettings(prev => {
      let newRoles = [...prev.allowed_roles];
      
      if (role === 'all') {
        // إذا تم اختيار "جميع المستخدمين"، امسح كل الأدوار الأخرى
        newRoles = checked ? ['all'] : [];
      } else {
        // إزالة "جميع المستخدمين" إذا تم اختيار دور محدد
        newRoles = newRoles.filter(r => r !== 'all');
        
        if (checked) {
          if (!newRoles.includes(role)) {
            newRoles.push(role);
          }
        } else {
          newRoles = newRoles.filter(r => r !== role);
        }
        
        // إذا لم يتم اختيار أي دور، اختر "جميع المستخدمين"
        if (newRoles.length === 0) {
          newRoles = ['all'];
        }
      }
      
      return { ...prev, allowed_roles: newRoles };
    });
  };

  const handleFileRoleChange = (fileId: string, role: string, checked: boolean) => {
    setFiles(prev => prev.map(f => {
      if (f.id !== fileId) return f;
      
      let newRoles = [...f.allowed_roles];
      
      if (role === 'all') {
        newRoles = checked ? ['all'] : [];
      } else {
        newRoles = newRoles.filter(r => r !== 'all');
        
        if (checked) {
          if (!newRoles.includes(role)) {
            newRoles.push(role);
          }
        } else {
          newRoles = newRoles.filter(r => r !== role);
        }
        
        if (newRoles.length === 0) {
          newRoles = ['all'];
        }
      }
      
      return { ...f, allowed_roles: newRoles };
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            رفع ملفات متعددة - الصف العاشر
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Global Settings */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="h-4 w-4" />
              <span className="font-medium">الإعدادات العامة</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>التصنيف الافتراضي</Label>
                <Select value={globalSettings.category} onValueChange={(value: any) => setGlobalSettings(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-3 block">من يمكنه رؤية الملفات</Label>
                <div className="space-y-2 bg-muted/30 p-3 rounded-lg">
                  {roleOptions.map(role => (
                    <div key={role.value} className="flex items-center space-x-2">
                      <Checkbox
                        checked={globalSettings.allowed_roles.includes(role.value)}
                        onCheckedChange={(checked) => handleRoleChange(role.value, checked as boolean)}
                      />
                      <Label className="text-sm">{role.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={globalSettings.is_visible}
                  onCheckedChange={(checked) => setGlobalSettings(prev => ({ ...prev, is_visible: checked }))}
                />
                <Label>مرئي للمستخدمين</Label>
              </div>
            </div>

            <Button onClick={applyGlobalSettings} variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              تطبيق على جميع الملفات
            </Button>
          </div>

          {/* File Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors border-muted-foreground/25 hover:border-primary hover:bg-primary/5"
          >
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div>
                <p className="text-lg mb-2">اسحب الملفات هنا أو انقر للاختيار</p>
                <p className="text-sm text-muted-foreground">
                  يدعم: PDF, DOC, DOCX, TXT, PPT, PPTX • أسماء عربية وعبرية مدعومة • أقصى حجم: 10MB
                </p>
              </div>
            </label>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">الملفات المحددة ({files.length})</h3>
                <Badge variant="secondary">
                  {files.filter(f => f.uploaded).length} / {files.length} مكتمل
                </Badge>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {files.map((fileData) => (
                  <Card key={fileData.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <FileText className="h-5 w-5 text-primary" />
                          <div className="flex-1">
                            <Input
                              value={fileData.title}
                              onChange={(e) => updateFile(fileData.id, { title: e.target.value })}
                              placeholder="عنوان المستند"
                              className="mb-2"
                            />
                            <Textarea
                              value={fileData.description}
                              onChange={(e) => updateFile(fileData.id, { description: e.target.value })}
                              placeholder="وصف المستند (اختياري)"
                              rows={2}
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(fileData.id)}
                          disabled={uploading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Select value={fileData.category} onValueChange={(value: any) => updateFile(fileData.id, { category: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categoryOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="space-y-2">
                          <Label className="text-xs">من يمكنه الرؤية</Label>
                          <div className="flex flex-wrap gap-1">
                            {roleOptions.map(role => (
                              <div key={role.value} className="flex items-center space-x-1">
                                <Checkbox
                                  checked={fileData.allowed_roles.includes(role.value)}
                                  onCheckedChange={(checked) => handleFileRoleChange(fileData.id, role.value, checked as boolean)}
                                  className="h-3 w-3"
                                />
                                <Label className="text-xs">{role.label}</Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={fileData.is_visible}
                            onCheckedChange={(checked) => updateFile(fileData.id, { is_visible: checked })}
                            className="scale-75"
                          />
                          <Label className="text-xs">مرئي</Label>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {(fileData.progress > 0 || fileData.uploaded || fileData.error) && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              {fileData.uploaded ? 'تم الرفع بنجاح' : 
                               fileData.error ? 'خطأ في الرفع' : 
                               'جاري الرفع...'}
                            </span>
                            {fileData.uploaded ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : fileData.error ? (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            ) : null}
                          </div>
                          {fileData.progress > 0 && !fileData.uploaded && (
                            <Progress value={fileData.progress} className="h-2" />
                          )}
                          {fileData.error && (
                            <p className="text-xs text-red-500">{fileData.error}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onCancel} disabled={uploading}>
              إلغاء
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={files.length === 0 || uploading}
              className="min-w-32"
            >
              {uploading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current" />
                  جاري الرفع...
                </div>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  رفع الملفات ({files.length})
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Grade10BulkDocumentUpload;