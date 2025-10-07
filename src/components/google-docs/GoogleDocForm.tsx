import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useGoogleDocs } from '@/hooks/useGoogleDocs';
import { FileText, TestTube, FolderOpen, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface DriveFile {
  id: string;
  name: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink: string;
}

const GoogleDocForm: React.FC = () => {
  const [studentName, setStudentName] = useState('');
  const [documentContent, setDocumentContent] = useState('');
  const [folderId, setFolderId] = useState('');
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [showFiles, setShowFiles] = useState(false);
  const [isListingFiles, setIsListingFiles] = useState(false);

  const { createDocument, listFiles, testConnection, isLoading } = useGoogleDocs();

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
      // Open the document in a new tab
      if (result.documentUrl) {
        window.open(result.documentUrl, '_blank');
      }
    }
  };

  const handleTestConnection = async () => {
    await testConnection();
  };

  const handleListFiles = async () => {
    setIsListingFiles(true);
    setShowFiles(true);
    const fileList = await listFiles(folderId.trim() || undefined);
    setFiles(fileList);
    setIsListingFiles(false);
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
          </div>
        </CardContent>
      </Card>

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
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(file.webViewLink, '_blank')}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      فتح
                    </Button>
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
