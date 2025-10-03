import { useEffect, useState } from 'react';
import { useGoogleDocs } from '@/hooks/useGoogleDocs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Plus, ExternalLink, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface MyDocument {
  id: string;
  doc_url: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export const StudentDocumentsPage = () => {
  const { createDocument, getMyDocuments, isLoading } = useGoogleDocs();
  const [documents, setDocuments] = useState<MyDocument[]>([]);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    const docs = await getMyDocuments();
    setDocuments(docs);
  };

  const handleCreateDocument = async () => {
    const result = await createDocument();
    if (result) {
      // فتح المستند الجديد في نافذة جديدة
      window.open(result.docUrl, '_blank');
      // تحديث القائمة
      await loadDocuments();
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">مستنداتي</h1>
          <p className="text-muted-foreground mt-2">
            أنشئ وأدر مستندات Google Docs الخاصة بك
          </p>
        </div>
        <Button 
          onClick={handleCreateDocument}
          disabled={isLoading}
          size="lg"
        >
          <Plus className="ml-2 h-5 w-5" />
          إنشاء مستند جديد
        </Button>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">لا توجد مستندات بعد</h3>
            <p className="text-muted-foreground text-center mb-4">
              ابدأ بإنشاء مستندك الأول من Google Docs
            </p>
            <Button onClick={handleCreateDocument} disabled={isLoading}>
              <Plus className="ml-2 h-4 w-4" />
              إنشاء مستند جديد
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <FileText className="h-8 w-8 text-primary" />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(doc.doc_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className="mt-4 line-clamp-1">{doc.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-2">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(doc.created_at), 'PPP', { locale: ar })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  onClick={() => window.open(doc.doc_url, '_blank')}
                >
                  فتح المستند
                  <ExternalLink className="mr-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentDocumentsPage;
