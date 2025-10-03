import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGoogleDocs } from '@/hooks/useGoogleDocs';
import { FileText, Loader2, ExternalLink } from 'lucide-react';

const DocumentsTest = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [result, setResult] = useState<any>(null);
  const { createDocument, loading } = useGoogleDocs();

  const handleCreate = async () => {
    if (!title.trim()) {
      return;
    }

    const data = await createDocument(title, content);
    if (data) {
      setResult(data);
      setTitle('');
      setContent('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🚀 اختبار إنشاء المستندات
          </h1>
          <p className="text-gray-600">
            أنشئ مستندات Google Docs مباشرة من التطبيق
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-6 h-6" />
              مستند جديد
            </CardTitle>
            <CardDescription>
              أدخل عنوان ومحتوى المستند (المحتوى اختياري)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">عنوان المستند *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: تقرير العمل اليومي"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">محتوى المستند (اختياري)</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="أكتب محتوى المستند هنا..."
                rows={6}
                disabled={loading}
              />
            </div>

            <Button
              onClick={handleCreate}
              disabled={loading || !title.trim()}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  إنشاء المستند
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card className="shadow-xl border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800">✅ تم الإنشاء بنجاح!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="font-semibold">العنوان:</span> {result.title}
              </div>
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
      </div>
    </div>
  );
};

export default DocumentsTest;
