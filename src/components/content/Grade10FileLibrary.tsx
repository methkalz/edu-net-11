import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Download, Edit, Trash2, Plus, Search, Filter, Grid, List, Upload, Play, File, FileImage } from 'lucide-react';
import { useGrade10Files } from '@/hooks/useGrade10Files';
import { useAuth } from '@/hooks/useAuth';
import Grade10BulkDocumentUpload from './Grade10BulkDocumentUpload';
import Grade10DocumentForm from './Grade10DocumentForm';

interface Document {
  id: string;
  title: string;
  description?: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
  category: string;
  is_visible: boolean;
  allowed_roles: string[];
  published_at: string;
}

interface Grade10FileLibraryProps {
  documents: Document[];
  loading: boolean;
  onAddDocument: (documentData: any) => Promise<any>;
  onEditDocument: (id: string, updates: any) => Promise<any>;
  onDeleteDocument: (id: string) => Promise<void>;
  uploadFile: (file: File, path: string) => Promise<any>;
  addDocuments: (documents: any[]) => Promise<any>;
  getFileUrl: (path: string) => string;
}

const Grade10FileLibrary: React.FC<Grade10FileLibraryProps> = ({
  documents,
  loading,
  onAddDocument,
  onEditDocument,
  onDeleteDocument,
  uploadFile,
  addDocuments,
  getFileUrl
}) => {
  const { userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showAddDocument, setShowAddDocument] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const itemsPerPage = 12;

  // فصل منطق العرض عن منطق التعديل
  const canViewContent = true; // الجميع يستطيع المشاهدة
  const canManageContent = userProfile?.role === 'superadmin'; // فقط السوبر آدمن يستطيع التعديل

  // Filter and paginate documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    const matchesVisibility = visibilityFilter === 'all' || 
                             (visibilityFilter === 'visible' && doc.is_visible) ||
                             (visibilityFilter === 'hidden' && !doc.is_visible);
    
    return matchesSearch && matchesCategory && matchesVisibility;
  });

  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDocuments = filteredDocuments.slice(startIndex, startIndex + itemsPerPage);

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return FileText;
    
    if (fileType.includes('image')) return FileImage;
    if (fileType.includes('video')) return Play;
    if (fileType.includes('pdf')) return File;
    return FileText;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'غير محدد';
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'bagrut_exam': 'امتحانات بجروت',
      'worksheets': 'أوراق عمل',
      'exams': 'امتحانات',
      'materials': 'مواد تعليمية',
      'projects': 'مشاريع'
    };
    return labels[category] || category;
  };

  const getVisibilityLabel = (isVisible: boolean) => {
    return isVisible ? 'مرئي' : 'مخفي';
  };

  const handleDownload = (document: Document) => {
    const url = getFileUrl(document.file_path);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = document.title;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const handleEdit = (document: Document) => {
    setEditingDocument(document);
  };

  const handleSaveEdit = async (documentData: any) => {
    if (editingDocument) {
      await onEditDocument(editingDocument.id, documentData);
      setEditingDocument(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-2/3 mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="mx-auto h-8 w-8 text-primary mb-2" />
            <div className="text-2xl font-bold">{documents.length}</div>
            <p className="text-sm text-muted-foreground">إجمالي الملفات</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Filter className="mx-auto h-8 w-8 text-green-500 mb-2" />
            <div className="text-2xl font-bold">{documents.filter(d => d.is_visible).length}</div>
            <p className="text-sm text-muted-foreground">ملفات مرئية</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Upload className="mx-auto h-8 w-8 text-blue-500 mb-2" />
            <div className="text-2xl font-bold">{documents.filter(d => d.category === 'materials').length}</div>
            <p className="text-sm text-muted-foreground">مواد تعليمية</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="mx-auto h-8 w-8 text-orange-500 mb-2" />
            <div className="text-2xl font-bold">{documents.filter(d => d.category === 'exams').length}</div>
            <p className="text-sm text-muted-foreground">امتحانات</p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              مكتبة الملفات - الصف العاشر
            </CardTitle>
            {canManageContent && (
              <div className="flex gap-2">
                <Dialog open={showBulkUpload} onOpenChange={setShowBulkUpload}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      رفع متعدد
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>رفع ملفات متعددة</DialogTitle>
                    </DialogHeader>
                    <Grade10BulkDocumentUpload
                      onUploadComplete={() => setShowBulkUpload(false)}
                      onCancel={() => setShowBulkUpload(false)}
                      uploadFile={uploadFile}
                      addDocuments={addDocuments}
                    />
                  </DialogContent>
                </Dialog>
                
                <Dialog open={showAddDocument} onOpenChange={setShowAddDocument}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      إضافة ملف
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>إضافة ملف جديد</DialogTitle>
                    </DialogHeader>
                    <Grade10DocumentForm
                      onSave={async (data) => {
                        await onAddDocument(data);
                        setShowAddDocument(false);
                      }}
                      onCancel={() => setShowAddDocument(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="البحث في الملفات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="تصفية حسب الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                <SelectItem value="bagrut_exam">امتحانات بجروت</SelectItem>
                <SelectItem value="worksheets">أوراق عمل</SelectItem>
                <SelectItem value="exams">امتحانات</SelectItem>
                <SelectItem value="materials">مواد تعليمية</SelectItem>
                <SelectItem value="projects">مشاريع</SelectItem>
              </SelectContent>
            </Select>
            <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="تصفية حسب الرؤية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الملفات</SelectItem>
                <SelectItem value="visible">مرئي</SelectItem>
                <SelectItem value="hidden">مخفي</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Documents Grid/List */}
          {paginatedDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد ملفات</h3>
              <p className="text-muted-foreground mb-4">
                {documents.length === 0
                  ? 'لم يتم رفع أي ملفات بعد'
                  : 'لا توجد ملفات تطابق معايير البحث'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedDocuments.map((document) => {
                const IconComponent = getFileIcon(document.file_type);
                return (
                  <Card key={document.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <IconComponent className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate mb-1">{document.title}</h3>
                          {document.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {document.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="secondary" className="text-xs">
                          {getCategoryLabel(document.category)}
                        </Badge>
                        <Badge 
                          variant={document.is_visible ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {getVisibilityLabel(document.is_visible)}
                        </Badge>
                      </div>
                      
                      <div className="text-xs text-muted-foreground mb-3">
                        <div>الحجم: {formatFileSize(document.file_size)}</div>
                        <div>تاريخ النشر: {new Date(document.published_at).toLocaleDateString('en-GB')}</div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(document)}
                          className="flex-1"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          تحميل
                        </Button>
                        {canManageContent && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(document)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onDeleteDocument(document.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {paginatedDocuments.map((document) => {
                const IconComponent = getFileIcon(document.file_type);
                return (
                  <Card key={document.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <IconComponent className="h-6 w-6 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{document.title}</h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {document.description || 'لا يوجد وصف'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {getCategoryLabel(document.category)}
                          </Badge>
                          <Badge 
                            variant={document.is_visible ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {getVisibilityLabel(document.is_visible)}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground text-right">
                          <div>{formatFileSize(document.file_size)}</div>
                          <div>{new Date(document.published_at).toLocaleDateString('en-GB')}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(document)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {canManageContent && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(document)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onDeleteDocument(document.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                السابق
              </Button>
              <span className="px-4 py-2 text-sm">
                الصفحة {currentPage} من {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                التالي
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Document Dialog */}
      {editingDocument && (
        <Dialog open={!!editingDocument} onOpenChange={() => setEditingDocument(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تعديل الملف</DialogTitle>
            </DialogHeader>
            <Grade10DocumentForm
              initialData={editingDocument}
              onSave={handleSaveEdit}
              onCancel={() => setEditingDocument(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Grade10FileLibrary;