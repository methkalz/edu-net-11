import { useEffect, useState } from 'react';
import { useGoogleDocs } from '@/hooks/useGoogleDocs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { FileText, Search, ExternalLink, Calendar, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface GoogleDocument {
  document_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  doc_url: string;
  doc_title: string;
  created_at: string;
  last_accessed_at: string | null;
}

export const TeacherDocumentsPage = () => {
  const { getTeacherDocuments, isLoading } = useGoogleDocs();
  const [documents, setDocuments] = useState<GoogleDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    const docs = await getTeacherDocuments();
    setDocuments(docs);
  };

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.student_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.doc_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">مستندات الطلاب</h1>
          <p className="text-muted-foreground mt-2">
            عرض وإدارة مستندات طلابك في Google Docs
          </p>
        </div>
        <Button 
          onClick={loadDocuments}
          disabled={isLoading}
          variant="outline"
        >
          <RefreshCw className={`ml-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            قائمة المستندات ({filteredDocuments.length})
          </CardTitle>
          <CardDescription>
            يمكنك البحث عن المستندات حسب اسم الطالب أو البريد الإلكتروني
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن طالب أو مستند..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>

          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {searchTerm ? 'لا توجد نتائج' : 'لا توجد مستندات'}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? 'جرب مصطلح بحث آخر' 
                  : 'لم يقم أي طالب بإنشاء مستندات بعد'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>اسم الطالب</TableHead>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>اسم المستند</TableHead>
                    <TableHead>تاريخ الإنشاء</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => (
                    <TableRow key={doc.document_id}>
                      <TableCell className="font-medium">
                        {doc.student_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {doc.student_email}
                      </TableCell>
                      <TableCell>{doc.doc_title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(doc.created_at), 'PPP', { locale: ar })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(doc.doc_url, '_blank')}
                        >
                          فتح المستند
                          <ExternalLink className="mr-2 h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherDocumentsPage;
