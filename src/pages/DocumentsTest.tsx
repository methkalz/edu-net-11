import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGoogleDocs } from '@/hooks/useGoogleDocs';
import { FileText, Loader2, ExternalLink, Copy, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const DocumentsTest = () => {
  const [templateId, setTemplateId] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [result, setResult] = useState<any>(null);
  const { copyTemplate, loading } = useGoogleDocs();

  const handleCopy = async () => {
    if (!templateId.trim() || !newTitle.trim()) {
      return;
    }

    const data = await copyTemplate({
      templateId: templateId.trim(),
      newTitle: newTitle.trim(),
      studentName: studentName.trim() || undefined,
      studentId: studentId.trim() || undefined,
    });

    if (data) {
      setResult(data);
      // لا نمسح القالب ID لأنه قد يُستخدم مرة أخرى
      setNewTitle('');
      setStudentName('');
      setStudentId('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📋 نسخ قوالب Google Docs
          </h1>
          <p className="text-gray-600">
            انسخ قالب موجود وخصصه لكل طالب
          </p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>كيف تحصل على Template ID؟</strong><br />
            1. افتح القالب في Google Docs<br />
            2. انسخ الجزء من الرابط بعد <code>/d/</code> وقبل <code>/edit</code><br />
            مثال: <code className="text-xs bg-white px-1">docs.google.com/document/d/<strong>1ABC...XYZ</strong>/edit</code>
          </AlertDescription>
        </Alert>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Copy className="w-6 h-6" />
              نسخ قالب
            </CardTitle>
            <CardDescription>
              أدخل معلومات القالب والطالب
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">معرّف القالب (Template ID) *</label>
              <Input
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                placeholder="1ABC...XYZ"
                disabled={loading}
                className="font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">عنوان المستند الجديد *</label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="مثال: مشروع أحمد محمد - الصف الحادي عشر"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">اسم الطالب (اختياري)</label>
                <Input
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="أحمد محمد"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  سيُستبدل النص <code>{'{{student_name}}'}</code> في القالب
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">رقم الطالب (اختياري)</label>
                <Input
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="12345"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  سيُستبدل النص <code>{'{{student_id}}'}</code> في القالب
                </p>
              </div>
            </div>

            <Button
              onClick={handleCopy}
              disabled={loading || !templateId.trim() || !newTitle.trim()}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري النسخ...
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  نسخ القالب
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card className="shadow-xl border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800">✅ تم النسخ بنجاح!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="font-semibold">العنوان:</span> {result.title}
              </div>
              {result.studentName && (
                <div>
                  <span className="font-semibold">الطالب:</span> {result.studentName}
                  {result.studentId && ` (${result.studentId})`}
                </div>
              )}
              <div>
                <span className="font-semibold">معرف المستند:</span>
                <code className="bg-white px-2 py-1 rounded text-sm ml-2">
                  {result.documentId}
                </code>
              </div>
              <Button
                onClick={() => window.open(result.documentUrl, '_blank')}
                variant="outline"
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                فتح المستند في Google Docs
              </Button>
            </CardContent>
          </Card>
        )}

        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>💡 نصيحة:</strong> في القالب الأصلي، استخدم:<br />
            • <code>{'{{student_name}}'}</code> → سيُستبدل باسم الطالب<br />
            • <code>{'{{student_id}}'}</code> → سيُستبدل برقم الطالب
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default DocumentsTest;
