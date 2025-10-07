import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useGoogleDocs } from '@/hooks/useGoogleDocs';
import { FileText, TestTube, FolderOpen, ExternalLink, Copy, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface DriveFile {
  id: string;
  name: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink?: string;
}

interface FolderInfo {
  id: string;
  name: string;
  capabilities?: {
    canAddChildren: boolean;
    canEdit: boolean;
  };
  permissions?: any[];
}

interface ListFilesResponse {
  files: DriveFile[];
  folderInfo?: FolderInfo;
  serviceAccount?: string;
}

const GoogleDocForm: React.FC = () => {
  const [studentName, setStudentName] = useState('');
  const [documentContent, setDocumentContent] = useState('');
  const [folderId, setFolderId] = useState('');
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [folderInfo, setFolderInfo] = useState<FolderInfo | null>(null);
  const [serviceAccount, setServiceAccount] = useState<string>('');
  const [showFiles, setShowFiles] = useState(false);
  const [isListingFiles, setIsListingFiles] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{message: string; hint?: string} | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [createdFolder, setCreatedFolder] = useState<{
    folderId: string;
    folderName: string;
    webViewLink: string;
  } | null>(null);

  const { createDocument, listFiles, testConnection, createFolder, isLoading } = useGoogleDocs();

  const handleCreateDocument = async () => {
    if (!studentName.trim()) {
      return;
    }

    const result = await createDocument({
      studentName: studentName.trim(),
      documentContent: documentContent.trim(),
      folderId: folderId.trim() || undefined
    });

    if (result?.success) {
      setStudentName('');
      setDocumentContent('');
      if (result.documentUrl) {
        window.open(result.documentUrl, '_blank');
      }
    }
  };

  const handleTestConnection = async () => {
    setErrorDetails(null);
    
    try {
      const result = await testConnection();
      if (result) {
        toast.success('الاتصال ناجح! ✅', {
          description: `دعم Workspace: ${result.workspaceSupport ? 'مفعّل ✅' : 'غير مفعّل ⚠️'}`
        });
        if (result.serviceAccount) {
          setServiceAccount(result.serviceAccount);
        }
      }
    } catch (error: any) {
      setErrorDetails({
        message: error.message || 'فشل في اختبار الاتصال',
        hint: 'تحقق من صلاحيات الـ Service Account'
      });
    }
  };

  const handleListFiles = async () => {
    setIsListingFiles(true);
    setShowFiles(true);
    setErrorDetails(null);
    
    try {
      const response = await listFiles(folderId.trim() || undefined, true);
      
      // Handle response object structure
      if (typeof response === 'object' && 'files' in response) {
        const listResponse = response as ListFilesResponse;
        setFiles(listResponse.files || []);
        setFolderInfo(listResponse.folderInfo || null);
        setServiceAccount(listResponse.serviceAccount || '');
        
        if (listResponse.folderInfo && !listResponse.folderInfo.capabilities?.canAddChildren) {
          setErrorDetails({
            message: '⚠️ تحذير: لا توجد صلاحية لإضافة ملفات للمجلد',
            hint: `يجب مشاركة المجلد "${listResponse.folderInfo.name}" مع:\n${listResponse.serviceAccount}\nبصلاحية "محرر" (Editor)`
          });
        } else if ((listResponse.files || []).length === 0) {
          setErrorDetails({
            message: 'المجلد فارغ أو لا يمكن الوصول إليه',
            hint: 'لم يتم العثور على ملفات في المجلد المحدد. تأكد من صحة Folder ID ومن مشاركة المجلد مع Service Account'
          });
        } else {
          toast.success(`تم العثور على ${listResponse.files.length} ملف ✅`);
        }
      } else {
        // Fallback for array response
        const fileArray = response as DriveFile[];
        setFiles(fileArray);
        if (fileArray.length === 0) {
          setErrorDetails({
            message: 'لم يتم العثور على ملفات',
            hint: 'تأكد من صحة folder ID ومن مشاركة المجلد مع Service Account'
          });
        }
      }
    } catch (error: any) {
      setErrorDetails({
        message: error.message || 'فشل في جلب الملفات',
        hint: 'تأكد من صحة folder ID ومن مشاركة المجلد مع Service Account بصلاحية "محرر"'
      });
    } finally {
      setIsListingFiles(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('يرجى إدخال اسم المجلد');
      return;
    }

    setErrorDetails(null);
    setCreatedFolder(null);

    const response = await createFolder({
      folderName: newFolderName,
      parentFolderId: folderId.trim() || undefined
    });

    if (response?.success && response.folderId) {
      setCreatedFolder({
        folderId: response.folderId,
        folderName: response.folderName || newFolderName,
        webViewLink: response.webViewLink || ''
      });
      setNewFolderName('');
      
      // تحديث قائمة الملفات تلقائياً
      setTimeout(() => {
        handleListFiles();
      }, 1000);
    }
  };

  const copyToClipboard = (text: string, message: string = 'تم النسخ إلى الحافظة') => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            إنشاء مستند Google Docs جديد
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {serviceAccount && (
            <div className="bg-muted/50 p-4 rounded-lg border">
              <p className="text-sm font-medium mb-2">📧 Service Account:</p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-background p-2 rounded flex-1 break-all">
                  {serviceAccount}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(serviceAccount)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                ⚠️ تأكد من مشاركة المجلد مع هذا البريد بصلاحية "محرر" (Editor)
              </p>
            </div>
          )}

          {folderInfo && (
            <div className="bg-muted/50 p-4 rounded-lg border">
              <p className="text-sm font-medium mb-2">📁 معلومات المجلد:</p>
              <div className="space-y-2 text-sm">
                <p><strong>الاسم:</strong> {folderInfo.name}</p>
                <p className="flex items-center gap-2">
                  <strong>إضافة ملفات:</strong>
                  {folderInfo.capabilities?.canAddChildren ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" /> مسموح
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1">
                      <XCircle className="h-4 w-4" /> ممنوع - يجب تعديل الصلاحيات
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="studentName">اسم الطالب *</Label>
            <Input
              id="studentName"
              placeholder="أدخل اسم الطالب"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentContent">محتوى المستند (اختياري)</Label>
            <Textarea
              id="documentContent"
              placeholder="أدخل المحتوى الأولي للمستند"
              value={documentContent}
              onChange={(e) => setDocumentContent(e.target.value)}
              disabled={isLoading}
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="folderId">معرف المجلد (Folder ID) - اختياري</Label>
            <Input
              id="folderId"
              placeholder="أدخل معرف المجلد في Google Drive"
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              💡 يمكنك الحصول على Folder ID من رابط المجلد في Google Drive
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newFolderName">إنشاء مجلد جديد في المجلد الحالي</Label>
            <Input
              id="newFolderName"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="اسم المجلد الجديد"
              dir="rtl"
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={handleCreateDocument}
              disabled={isLoading || !studentName.trim()}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              إنشاء مستند جديد
            </Button>

            <Button
              onClick={handleTestConnection}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <TestTube className="h-4 w-4" />
              اختبار الاتصال
            </Button>

            <Button
              onClick={handleListFiles}
              disabled={isLoading || isListingFiles}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <FolderOpen className="h-4 w-4" />
              {isListingFiles ? 'جاري التحميل...' : 'عرض الملفات'}
            </Button>

            <Button
              onClick={handleCreateFolder}
              disabled={isLoading || !newFolderName.trim()}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <FolderOpen className="h-4 w-4" />
              إنشاء مجلد جديد
            </Button>
          </div>
        </CardContent>
      </Card>

      {createdFolder && (
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <CardHeader>
            <CardTitle className="text-green-800 dark:text-green-200 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              تم إنشاء المجلد بنجاح
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-background rounded border">
              <p className="text-sm font-medium mb-2">📁 اسم المجلد:</p>
              <p className="text-sm font-bold">{createdFolder.folderName}</p>
            </div>
            
            <div className="p-3 bg-background rounded border">
              <p className="text-sm font-medium mb-2">🆔 معرف المجلد (Folder ID):</p>
              <div className="flex items-center gap-2">
                <Input
                  value={createdFolder.folderId}
                  readOnly
                  className="text-xs font-mono"
                  dir="ltr"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(createdFolder.folderId, 'تم نسخ معرف المجلد')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {createdFolder.webViewLink && (
              <a
                href={createdFolder.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                فتح المجلد في Google Drive
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {errorDetails && (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              تفاصيل المشكلة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-background rounded border">
              <p className="text-sm font-medium mb-1">رسالة الخطأ:</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{errorDetails.message}</p>
            </div>
            {errorDetails.hint && (
              <div className="p-3 bg-primary/5 rounded border border-primary/20">
                <p className="text-sm font-medium text-primary mb-1">💡 نصيحة للحل:</p>
                <p className="text-sm whitespace-pre-wrap">{errorDetails.hint}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showFiles && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              الملفات في المجلد ({files.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isListingFiles ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-3 text-muted-foreground">جاري تحميل الملفات...</p>
              </div>
            ) : files.length > 0 ? (
              <div className="space-y-3">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{file.name}</h4>
                      <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                        <span>تاريخ الإنشاء: {formatDate(file.createdTime)}</span>
                        <span>آخر تعديل: {formatDate(file.modifiedTime)}</span>
                      </div>
                    </div>
                    {file.webViewLink && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(file.webViewLink, '_blank')}
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        فتح
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">لا توجد ملفات في هذا المجلد</p>
                <p className="text-sm mt-1">قد يكون المجلد فارغاً أو قد لا تملك صلاحيات الوصول</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GoogleDocForm;