import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfessionalDocuments } from '@/hooks/useProfessionalDocuments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  FileText, 
  Search, 
  Calendar,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Share2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export const ProfessionalDocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    documents,
    loading,
    createDocument,
    deleteDocument,
    fetchDocuments
  } = useProfessionalDocuments();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDocuments, setFilteredDocuments] = useState(documents);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredDocuments(documents);
    } else {
      const filtered = documents.filter(doc => 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.plain_text?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDocuments(filtered);
    }
  }, [documents, searchQuery]);

  const handleNewDocument = async () => {
    const newDoc = await createDocument('مستند جديد');
    if (newDoc) {
      navigate(`/professional-document/${newDoc.id}`);
    }
  };

  const handleOpenDocument = (documentId: string) => {
    navigate(`/professional-document/${documentId}`);
  };

  const handleDeleteDocument = async (documentId: string, title: string) => {
    if (window.confirm(`هل أنت متأكد من حذف المستند "${title}"؟`)) {
      const success = await deleteDocument(documentId);
      if (success) {
        toast({
          title: "تم حذف المستند",
          description: `تم حذف "${title}" بنجاح`,
        });
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500';
      case 'draft': return 'bg-yellow-500';
      case 'submitted': return 'bg-blue-500';
      case 'archived': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published': return 'منشور';
      case 'draft': return 'مسودة';
      case 'submitted': return 'مُسلم';
      case 'archived': return 'مؤرشف';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* العنوان والبحث */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">المستندات الاحترافية</h1>
          <p className="text-muted-foreground">
            أنشئ وحرر مستنداتك بأدوات احترافية متطورة
          </p>
        </div>
        
        <Button onClick={handleNewDocument} className="gap-2">
          <Plus className="h-4 w-4" />
          مستند جديد
        </Button>
      </div>

      {/* شريط البحث */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="البحث في المستندات..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* قائمة المستندات */}
      {filteredDocuments.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد مستندات</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'لم يتم العثور على مستندات تطابق البحث' : 'ابدأ بإنشاء مستندك الأول'}
            </p>
            {!searchQuery && (
              <Button onClick={handleNewDocument} className="gap-2">
                <Plus className="h-4 w-4" />
                إنشاء مستند جديد
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((document) => (
            <Card key={document.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {document.title}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {formatDistanceToNow(new Date(document.updated_at), {
                        addSuffix: true,
                        locale: ar
                      })}
                    </CardDescription>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenDocument(document.id)}>
                        <Eye className="h-4 w-4 ml-2" />
                        عرض
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleOpenDocument(document.id)}>
                        <Edit className="h-4 w-4 ml-2" />
                        تحرير
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Share2 className="h-4 w-4 ml-2" />
                        مشاركة
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteDocument(document.id, document.title)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 ml-2" />
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {/* معاينة المحتوى */}
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {document.plain_text || 'لا يوجد محتوى...'}
                  </p>
                  
                  {/* المعلومات والحالة */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span>{document.word_count} كلمة</span>
                      <span>{document.page_count} صفحة</span>
                    </div>
                    
                    <Badge 
                      variant="secondary" 
                      className={`text-white ${getStatusColor(document.status)}`}
                    >
                      {getStatusText(document.status)}
                    </Badge>
                  </div>
                  
                  {/* تاريخ الإنشاء */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(document.created_at).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfessionalDocumentsPage;