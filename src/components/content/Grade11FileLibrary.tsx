import React, { useState } from 'react';
import { Search, Plus, Download, Edit, Trash2, FileText, Calendar, User, Eye, Filter, EyeOff, Upload, Sheet, Image, BookMarked, Monitor, Type, FileType, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import Grade11BulkDocumentUpload from './Grade11BulkDocumentUpload';

interface Document {
  id: string;
  title: string;
  description?: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
  category: 'bagrut_exam' | 'worksheets' | 'exams' | 'materials';
  grade_level: string;
  owner_user_id: string;
  school_id?: string;
  is_visible: boolean;
  allowed_roles: string[];
  is_active: boolean;
  order_index: number;
  published_at: string;
  created_at: string;
  updated_at: string;
}

interface Grade11FileLibraryProps {
  documents: Document[];
  loading: boolean;
  onAddDocument: () => void;
  onEditDocument: (document: Document) => void;
  onDeleteDocument: (id: string) => void;
  uploadFile: (file: File, path: string) => Promise<any>;
  addDocuments: (documents: any[]) => Promise<any>;
  getFileUrl: (path: string) => string;
}

const Grade11FileLibrary: React.FC<Grade11FileLibraryProps> = ({
  documents,
  loading,
  onAddDocument,
  onEditDocument,
  onDeleteDocument,
  uploadFile,
  addDocuments,
  getFileUrl
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedVisibility, setSelectedVisibility] = useState<string>('all');
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const itemsPerPage = 20;

  // تصفية المستندات حسب البحث والتصنيف والرؤية
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesVisibility = selectedVisibility === 'all' || 
                             (selectedVisibility === 'visible' && doc.is_visible) ||
                             (selectedVisibility === 'hidden' && !doc.is_visible);
    
    return matchesSearch && matchesCategory && matchesVisibility;
  });

  // حساب pagination
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);

  // إعادة تعيين الصفحة عند تغيير البحث أو التصفية
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1);
  };

  const handleVisibilityChange = (value: string) => {
    setSelectedVisibility(value);
    setCurrentPage(1);
  };

  // إحصائيات حسب التصنيف
  const getCategoryStats = () => {
    return {
      total: documents.length,
      bagrut_exam: documents.filter(d => d.category === 'bagrut_exam').length,
      worksheets: documents.filter(d => d.category === 'worksheets').length,
      exams: documents.filter(d => d.category === 'exams').length,
      materials: documents.filter(d => d.category === 'materials').length,
      visible: documents.filter(d => d.is_visible).length,
      hidden: documents.filter(d => !d.is_visible).length
    };
  };

  const stats = getCategoryStats();

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'غير محدد';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    if (bytes === 0) return '0 بايت';
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i)) + ' ' + sizes[i];
  };

  const handleDownload = (document: Document) => {
    try {
      const fileUrl = getFileUrl(document.file_path);
      window.open(fileUrl, '_blank');
      toast.success(`جاري تحميل: ${document.title}`);
    } catch (error) {
      toast.error('فشل في تحميل الملف');
    }
  };

  const handleBulkUploadComplete = (uploadedDocuments: any[]) => {
    setShowBulkUpload(false);
    toast.success(`تم رفع ${uploadedDocuments.length} ملف بنجاح`);
  };

  const getVisibilityLabel = (roles: string[]) => {
    if (roles.includes('all')) return 'جميع المستخدمين';
    
    const labels = {
      school_admin: 'مديري المدارس',
      teacher: 'المعلمين',
      student: 'الطلاب', 
      parent: 'أولياء الأمور'
    };
    
    const roleLabels = roles.map(role => labels[role as keyof typeof labels]).filter(Boolean);
    return roleLabels.length > 0 ? roleLabels.join(' + ') : 'غير محدد';
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      bagrut_exam: 'امتحان البجروت',
      worksheets: 'أوراق عمل',
      exams: 'امتحانات',
      materials: 'مواد'
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      bagrut_exam: 'bg-red-100 text-red-700 border-red-200',
      worksheets: 'bg-blue-100 text-blue-700 border-blue-200',
      exams: 'bg-green-100 text-green-700 border-green-200',
      materials: 'bg-purple-100 text-purple-700 border-purple-200'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getFileIcon = (fileType?: string, filePath?: string) => {
    // استخراج الامتداد من مسار الملف إذا لم يكن نوع الملف متوفراً
    const extension = filePath ? filePath.split('.').pop()?.toLowerCase() : '';
    const type = fileType?.toLowerCase() || '';
    
    // PDF files - كتاب مفتوح يرمز للمستندات المهمة
    if (type.includes('pdf') || extension === 'pdf') {
      return BookMarked;
    }
    // Word documents - نص للمستندات النصية
    if (type.includes('word') || type.includes('document') || 
        extension === 'doc' || extension === 'docx') {
      return FileText;
    }
    // Excel files - جدول للملفات الحسابية
    if (type.includes('excel') || type.includes('spreadsheet') || 
        extension === 'xls' || extension === 'xlsx') {
      return Sheet;
    }
    // PowerPoint files - شاشة للعروض التقديمية
    if (type.includes('presentation') || 
        extension === 'ppt' || extension === 'pptx') {
      return Monitor;
    }
    // Text files - حروف للملفات النصية البسيطة
    if (type.includes('text') || extension === 'txt') {
      return Type;
    }
    // Image files - صورة للملفات المرئية
    if (type.includes('image') || 
        ['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension || '')) {
      return Image;
    }
    
    // Default file icon - نوع ملف عام
    return FileType;
  };

  // عرض محمل أثناء التحميل
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            مكتبة الملفات - الصف الحادي عشر
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* إحصائيات */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Badge variant="outline">إجمالي الملفات: {stats.total}</Badge>
            <Badge variant="secondary">امتحانات البجروت: {stats.bagrut_exam}</Badge>
            <Badge variant="secondary">أوراق العمل: {stats.worksheets}</Badge>
            <Badge variant="secondary">الامتحانات: {stats.exams}</Badge>
            <Badge variant="secondary">المواد: {stats.materials}</Badge>
            <Badge className="bg-green-100 text-green-800">مرئي: {stats.visible}</Badge>
            <Badge className="bg-gray-100 text-gray-800">مخفي: {stats.hidden}</Badge>
          </div>

          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <div className="flex gap-2">
              <Button onClick={onAddDocument} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                إضافة مستند
              </Button>
              
              <Button onClick={() => setShowBulkUpload(true)} variant="outline" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                رفع متعدد
              </Button>
            </div>
            
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="البحث في المستندات..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="تصنيف المستندات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع التصنيفات</SelectItem>
                <SelectItem value="bagrut_exam">امتحان البجروت</SelectItem>
                <SelectItem value="worksheets">أوراق عمل</SelectItem>
                <SelectItem value="exams">امتحانات</SelectItem>
                <SelectItem value="materials">مواد</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedVisibility} onValueChange={handleVisibilityChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="حالة الرؤية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="visible">مرئي</SelectItem>
                <SelectItem value="hidden">مخفي</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex border rounded-md">
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'compact' ? 'default' : 'ghost'}
                onClick={() => setViewMode('compact')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* معلومات التصفح */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              عرض {startIndex + 1}-{Math.min(endIndex, filteredDocuments.length)} من {filteredDocuments.length} ملف
            </p>
          </div>

          {/* قائمة المستندات */}
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد مستندات</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedCategory !== 'all' || selectedVisibility !== 'all'
                  ? 'لا توجد مستندات تطابق معايير البحث'
                  : 'لم يتم إضافة أي مستندات بعد'
                }
              </p>
              {!searchTerm && selectedCategory === 'all' && selectedVisibility === 'all' && (
                <Button onClick={onAddDocument}>إضافة مستند جديد</Button>
              )}
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {paginatedDocuments.map((document) => (
                    <Card key={document.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              {(() => {
                                const IconComponent = getFileIcon(document.file_type, document.file_path);
                                return <IconComponent className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />;
                              })()}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-sm mb-1 line-clamp-2">
                                  {document.title}
                                </h3>
                                {document.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                    {document.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ml-2 flex-shrink-0 ${getCategoryColor(document.category)}`}
                            >
                              {getCategoryLabel(document.category)}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(document.created_at).toLocaleDateString('en-US')}</span>
                            {document.file_size && (
                              <>
                                <span>•</span>
                                <span>{formatFileSize(document.file_size)}</span>
                              </>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(document)}
                              className="flex-1"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              تحميل
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onEditDocument(document)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    هل أنت متأكد من حذف المستند "{document.title}"؟ لا يمكن التراجع عن هذا الإجراء.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => onDeleteDocument(document.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    حذف
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {paginatedDocuments.map((document) => (
                    <Card key={document.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {(() => {
                              const IconComponent = getFileIcon(document.file_type, document.file_path);
                              return <IconComponent className="h-4 w-4 text-muted-foreground flex-shrink-0" />;
                            })()}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm truncate">
                                {document.title}
                              </h3>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${getCategoryColor(document.category)}`}
                                >
                                  {getCategoryLabel(document.category)}
                                </Badge>
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(document.created_at).toLocaleDateString('en-US')}</span>
                                {document.file_size && (
                                  <>
                                    <span>•</span>
                                    <span>{formatFileSize(document.file_size)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(document)}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onEditDocument(document)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    هل أنت متأكد من حذف المستند "{document.title}"؟ لا يمكن التراجع عن هذا الإجراء.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => onDeleteDocument(document.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    حذف
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <Pagination>
                    <PaginationContent>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Bulk Upload Dialog */}
      <Dialog open={showBulkUpload} onOpenChange={setShowBulkUpload}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>رفع ملفات متعددة - الصف الحادي عشر</DialogTitle>
          </DialogHeader>
          <Grade11BulkDocumentUpload
            onUploadComplete={handleBulkUploadComplete}
            onCancel={() => setShowBulkUpload(false)}
            uploadFile={uploadFile}
            addDocuments={addDocuments}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Grade11FileLibrary;