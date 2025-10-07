import React, { useEffect, useState } from 'react';
import { Shield, FileText, Users, Clock, ExternalLink, Eye, Search } from 'lucide-react';
import AppHeader from '@/components/shared/AppHeader';
import AppFooter from '@/components/shared/AppFooter';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import DocumentViewerDialog from './DocumentViewerDialog';
import GoogleDocForm from './GoogleDocForm';

interface GoogleDocument {
  id: string;
  title: string;
  doc_url: string;
  owner_name: string;
  owner_email: string;
  created_at: string;
  last_accessed_at: string;
}

const GoogleDocsManagement: React.FC = () => {
  const { userProfile } = useAuth();
  const [documents, setDocuments] = useState<GoogleDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<GoogleDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<GoogleDocument | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const documentsPerPage = 10;

  // Statistics
  const totalDocuments = documents.length;
  const uniqueStudents = new Set(documents.map(doc => doc.owner_email)).size;
  const lastActivity = documents.length > 0 
    ? format(new Date(Math.max(...documents.map(doc => new Date(doc.last_accessed_at).getTime()))), 'dd/MM/yyyy HH:mm')
    : 'لا يوجد';

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    // Filter documents based on search query
    if (searchQuery.trim() === '') {
      setFilteredDocuments(documents);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = documents.filter(
        doc =>
          doc.title.toLowerCase().includes(query) ||
          doc.owner_name.toLowerCase().includes(query) ||
          doc.owner_email.toLowerCase().includes(query)
      );
      setFilteredDocuments(filtered);
    }
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchQuery, documents]);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('google_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDocuments((data as any) || []);
      setFilteredDocuments((data as any) || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Pagination
  const indexOfLastDocument = currentPage * documentsPerPage;
  const indexOfFirstDocument = indexOfLastDocument - documentsPerPage;
  const currentDocuments = filteredDocuments.slice(indexOfFirstDocument, indexOfLastDocument);
  const totalPages = Math.ceil(filteredDocuments.length / documentsPerPage);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  // Check if user is superadmin
  if (userProfile?.role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">غير مصرح لك بالوصول</h2>
          <p className="text-muted-foreground">هذه الصفحة مخصصة لمدراء النظام فقط</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <AppHeader 
        title="إدارة مستندات Google Docs" 
        showBackButton={true}
        backPath="/content-management"
        showLogout={true}
      />
      
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">إجمالي المستندات</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalDocuments}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">عدد الطلاب</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{uniqueStudents}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">آخر نشاط</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{lastActivity}</div>
              </CardContent>
            </Card>
          </div>

          {/* Create Document Form */}
          <GoogleDocForm />

          {/* Documents Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>المستندات المتاحة</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="بحث في المستندات..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10 w-64"
                    />
                  </div>
                  <Button onClick={fetchDocuments} variant="outline" size="sm">
                    تحديث
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  جاري التحميل...
                </div>
              ) : currentDocuments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد مستندات
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>اسم المستند</TableHead>
                        <TableHead>اسم الطالب</TableHead>
                        <TableHead>البريد الإلكتروني</TableHead>
                        <TableHead>تاريخ الإنشاء</TableHead>
                        <TableHead>آخر دخول</TableHead>
                        <TableHead className="text-center">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentDocuments.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium">{doc.title}</TableCell>
                          <TableCell>{doc.owner_name}</TableCell>
                          <TableCell>{doc.owner_email}</TableCell>
                          <TableCell>{formatDate(doc.created_at)}</TableCell>
                          <TableCell>{formatDate(doc.last_accessed_at)}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedDocument(doc)}
                                className="flex items-center gap-1"
                              >
                                <Eye className="h-4 w-4" />
                                عرض
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(doc.doc_url, '_blank')}
                                className="flex items-center gap-1"
                              >
                                <ExternalLink className="h-4 w-4" />
                                فتح
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        السابق
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        صفحة {currentPage} من {totalPages}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        التالي
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <AppFooter />

      {/* Document Viewer Dialog */}
      {selectedDocument && (
        <DocumentViewerDialog
          isOpen={!!selectedDocument}
          onClose={() => setSelectedDocument(null)}
          documentUrl={selectedDocument.doc_url}
          documentTitle={selectedDocument.title}
        />
      )}
    </div>
  );
};

export default GoogleDocsManagement;
