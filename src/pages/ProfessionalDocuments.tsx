import { useState } from 'react';
import { FileText, Plus, Trash2, ExternalLink, Search, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useProfessionalDocuments } from '@/hooks/useProfessionalDocuments';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const documentTypes = [
  { value: 'report', label: 'تقرير' },
  { value: 'lesson_plan', label: 'خطة درس' },
  { value: 'curriculum', label: 'منهاج' },
  { value: 'assessment', label: 'تقييم' },
  { value: 'policy', label: 'سياسة' },
  { value: 'general', label: 'عام' },
];

export default function ProfessionalDocuments() {
  const {
    documents,
    loading,
    createDocument,
    deleteDocument,
  } = useProfessionalDocuments();

  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocType, setNewDocType] = useState('general');
  const [storageInfo, setStorageInfo] = useState<{
    usageInGB: string;
    limitInGB: string;
    usagePercent: string;
  } | null>(null);
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreatingGoogleDoc, setIsCreatingGoogleDoc] = useState(false);

  const filteredDocuments = documents?.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.document_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateDocument = async () => {
    if (!newDocTitle.trim()) return;

    const result = await createDocument(newDocTitle, newDocType);
    
    if (result) {
      setNewDocTitle('');
      setNewDocType('general');
      setIsCreateDialogOpen(false);
    }
  };

  const fetchStorageInfo = async () => {
    setLoadingStorage(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-docs', {
        body: { action: 'storage' }
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        setStorageInfo({
          usageInGB: data.data.usageInGB,
          limitInGB: data.data.limitInGB,
          usagePercent: data.data.usagePercent,
        });
      }
    } catch (error: any) {
      toast({
        title: 'فشل في جلب معلومات المساحة',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingStorage(false);
    }
  };

  const handleCreateGoogleDoc = async (documentId: string, title: string) => {
    setIsCreatingGoogleDoc(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('google-docs', {
        body: {
          action: 'create',
          title,
        },
      });

      if (error) throw error;

      if (data?.data?.documentId) {
        // تحديث المستند بـ Google Doc ID
        const { error: updateError } = await supabase
          .from('professional_documents')
          .update({ google_doc_id: data.data.documentId })
          .eq('id', documentId);

        if (updateError) throw updateError;

        toast({
          title: 'تم الربط',
          description: 'تم إنشاء المستند في Google Docs بنجاح',
        });

        // Refresh the documents list
        window.location.reload();
      }
    } catch (error: any) {
      toast({
        title: 'خطأ في Google Docs',
        description: error.message || 'حدث خطأ أثناء إنشاء المستند',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingGoogleDoc(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المستند؟')) {
      await deleteDocument(id);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      draft: { label: 'مسودة', variant: 'secondary' },
      published: { label: 'منشور', variant: 'default' },
      archived: { label: 'مؤرشف', variant: 'outline' },
    };

    const statusInfo = statusMap[status] || statusMap.draft;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getDocumentTypeLabel = (type: string) => {
    return documentTypes.find((t) => t.value === type)?.label || type;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              المستندات المهنية
            </h1>
            <p className="text-muted-foreground mt-2">
              إدارة المستندات والتكامل مع Google Docs
            </p>
          </div>

          <div className="flex gap-3">
            {/* Storage Info Card */}
            <Card className="min-w-[200px]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">مساحة Service Account</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingStorage ? (
                  <p className="text-sm text-muted-foreground">جاري التحميل...</p>
                ) : storageInfo ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>المستخدم:</span>
                      <span className="font-bold">{storageInfo.usageInGB} GB</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>الإجمالي:</span>
                      <span>{storageInfo.limitInGB} GB</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${storageInfo.usagePercent}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      {storageInfo.usagePercent}% مستخدم
                    </p>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchStorageInfo}
                    className="w-full"
                  >
                    عرض المساحة
                  </Button>
                )}
              </CardContent>
            </Card>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2">
                  <Plus className="h-5 w-5" />
                  مستند جديد
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إنشاء مستند جديد</DialogTitle>
                <DialogDescription>
                  أنشئ مستنداً مهنياً جديداً يمكنك ربطه لاحقاً مع Google Docs
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">عنوان المستند</Label>
                  <Input
                    id="title"
                    placeholder="مثال: خطة الدرس للفصل الأول"
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">نوع المستند</Label>
                  <Select value={newDocType} onValueChange={setNewDocType}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleCreateDocument}
                  disabled={!newDocTitle.trim() || loading}
                >
                  {loading ? 'جاري الإنشاء...' : 'إنشاء'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="ابحث في المستندات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Documents Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
          </div>
        ) : filteredDocuments && filteredDocuments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{doc.title}</CardTitle>
                    </div>
                    {getStatusBadge(doc.status)}
                  </div>
                  <CardDescription>
                    {getDocumentTypeLabel(doc.document_type)}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>📝 {doc.word_count} كلمة</p>
                    <p>📄 {doc.page_count} صفحة</p>
                    <p>
                      🕐 آخر تحديث:{' '}
                      {format(new Date(doc.updated_at), 'dd MMM yyyy', {
                        locale: ar,
                      })}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {doc.google_doc_id ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        asChild
                      >
                        <a
                          href={`https://docs.google.com/document/d/${doc.google_doc_id}/edit`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 ml-2" />
                          فتح في Google Docs
                        </a>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleCreateGoogleDoc(doc.id, doc.title)}
                        disabled={isCreatingGoogleDoc}
                      >
                        <FileDown className="h-4 w-4 ml-2" />
                        {isCreatingGoogleDoc ? 'جاري الربط...' : 'ربط مع Google Docs'}
                      </Button>
                    )}

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteDocument(doc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">لا توجد مستندات</h3>
              <p className="text-muted-foreground mb-4">
                ابدأ بإنشاء مستند مهني جديد
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 ml-2" />
                إنشاء مستند
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
