import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { RefreshCw, Trash2, Database, Upload } from 'lucide-react';
import { usePDFComparison, type GradeLevel, type RepositoryFile } from '@/hooks/usePDFComparison';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface RepositoryManagerProps {
  gradeLevel?: GradeLevel;
}

const RepositoryManager = ({ gradeLevel }: RepositoryManagerProps) => {
  const { userProfile } = useAuth();
  const { 
    getRepositoryFiles, 
    deleteFromRepository,
    deleteMultipleFromRepository,
    getRepositoryStats,
    addToRepository,
    uploadProgress
  } = usePDFComparison();
  
  const [files, setFiles] = useState<RepositoryFile[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Bulk upload states
  const [uploadQueue, setUploadQueue] = useState<Array<{
    file: File;
    status: 'pending' | 'uploading' | 'success' | 'error';
    progress: number;
    error?: string;
  }>>([]);

  const isSuperAdmin = userProfile?.role === 'superadmin';

  const loadData = async () => {
    setIsLoading(true);
    const [filesData, statsData] = await Promise.all([
      getRepositoryFiles(gradeLevel),
      getRepositoryStats(gradeLevel),
    ]);
    setFiles(filesData);
    setStats(statsData);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [gradeLevel]);

  const handleDelete = async (fileId: string) => {
    if (!isSuperAdmin) {
      toast.error('غير مصرح لك بالحذف');
      return;
    }

    if (!confirm('هل أنت متأكد من حذف هذا الملف من المستودع؟')) {
      return;
    }

    setDeletingId(fileId);
    const success = await deleteFromRepository(fileId);
    if (success) {
      setSelectedFiles(new Set()); // Clear selection after delete
      loadData();
    }
    setDeletingId(null);
  };

  // تحديد/إلغاء تحديد ملف
  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  // تحديد الكل
  const selectAll = () => {
    setSelectedFiles(new Set(files.map(f => f.id)));
  };

  // إلغاء تحديد الكل
  const clearSelection = () => {
    setSelectedFiles(new Set());
  };

  // حذف الملفات المحددة
  const handleBulkDelete = async () => {
    if (!isSuperAdmin) {
      toast.error('غير مصرح لك بالحذف');
      return;
    }

    if (selectedFiles.size === 0) {
      toast.warning('لم يتم تحديد أي ملفات');
      return;
    }

    if (!confirm(`هل أنت متأكد من حذف ${selectedFiles.size} ملف من المستودع؟\n\nهذا الإجراء لا يمكن التراجع عنه.`)) {
      return;
    }

    setIsDeleting(true);
    const success = await deleteMultipleFromRepository(Array.from(selectedFiles));
    if (success) {
      setSelectedFiles(new Set());
      await loadData();
    }
    setIsDeleting(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    if (!gradeLevel) {
      toast.error('يرجى تحديد الصف أولاً');
      return;
    }

    // تحويل FileList إلى Array وإنشاء queue
    const filesArray = Array.from(selectedFiles);
    const initialQueue = filesArray.map(file => ({
      file,
      status: 'pending' as const,
      progress: 0,
    }));

    setUploadQueue(initialQueue);
    setIsUploading(true);

    // رفع الملفات بشكل متتالي
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];
      
      // تحديث حالة الملف إلى "uploading"
      setUploadQueue(prev => 
        prev.map((item, idx) => 
          idx === i ? { ...item, status: 'uploading' as const, progress: 0 } : item
        )
      );

      try {
        const success = await addToRepository(file, gradeLevel);
        
        if (success) {
          successCount++;
          setUploadQueue(prev => 
            prev.map((item, idx) => 
              idx === i ? { ...item, status: 'success' as const, progress: 100 } : item
            )
          );
        } else {
          errorCount++;
          setUploadQueue(prev => 
            prev.map((item, idx) => 
              idx === i ? { ...item, status: 'error' as const, error: 'فشل الرفع' } : item
            )
          );
        }
      } catch (error) {
        errorCount++;
        const errorMsg = error instanceof Error ? error.message : 'خطأ غير معروف';
        setUploadQueue(prev => 
          prev.map((item, idx) => 
            idx === i ? { ...item, status: 'error' as const, error: errorMsg } : item
          )
        );
      }

      // تحديث progress
      setUploadQueue(prev => 
        prev.map((item, idx) => 
          idx === i ? { ...item, progress: 100 } : item
        )
      );
    }

    // إظهار ملخص النتائج
    if (successCount > 0) {
      toast.success(`تم رفع ${successCount} من ${filesArray.length} ملف بنجاح`);
      await loadData();
    }
    
    if (errorCount > 0) {
      toast.error(`فشل رفع ${errorCount} من ${filesArray.length} ملف`);
    }

    // تنظيف بعد 3 ثوان
    setTimeout(() => {
      setUploadQueue([]);
      setIsUploading(false);
    }, 3000);

    event.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Bulk Upload Progress */}
      {uploadQueue.length > 0 && (
        <Card className="border-0 bg-gradient-to-r from-primary/10 to-primary/5 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="h-5 w-5 text-primary animate-pulse" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">جاري رفع الملفات...</p>
                    <p className="text-xs text-muted-foreground">
                      {uploadQueue.filter(f => f.status === 'success').length} / {uploadQueue.length} مكتمل
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium text-primary">
                  {Math.round((uploadQueue.filter(f => f.status === 'success').length / uploadQueue.length) * 100)}%
                </span>
              </div>

              {/* قائمة الملفات */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {uploadQueue.map((item, index) => (
                  <div key={index} className="bg-background/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {item.status === 'pending' && (
                          <div className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse" />
                        )}
                        {item.status === 'uploading' && (
                          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        )}
                        {item.status === 'success' && (
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                        )}
                        {item.status === 'error' && (
                          <div className="h-2 w-2 rounded-full bg-red-500" />
                        )}
                        <span className="text-sm truncate flex-1">
                          {item.file.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {(item.file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      {item.status === 'success' && (
                        <span className="text-xs text-green-500 font-medium">✓ مكتمل</span>
                      )}
                      {item.status === 'error' && (
                        <span className="text-xs text-red-500 font-medium">✗ فشل</span>
                      )}
                    </div>
                    
                    {(item.status === 'uploading' || item.status === 'pending') && (
                      <Progress value={item.progress} className="h-1" />
                    )}
                    
                    {item.error && (
                      <p className="text-xs text-red-500 mt-1">{item.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent backdrop-blur-sm hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
          <CardContent className="p-6 relative">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 rounded-xl bg-primary/10 backdrop-blur-sm">
                <Database className="h-7 w-7 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium">إجمالي الملفات</p>
                <p className="text-3xl font-bold bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-transparent">
                  {stats?.totalFiles || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent backdrop-blur-sm hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-50" />
          <CardContent className="p-6 relative">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 rounded-xl bg-green-500/10 backdrop-blur-sm">
                <Database className="h-7 w-7 text-green-500" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium">الحجم الإجمالي</p>
                <p className="text-3xl font-bold bg-gradient-to-br from-green-500 to-green-400 bg-clip-text text-transparent">
                  {((stats?.totalSize || 0) / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Files Table */}
      <Card className="border-0 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                ملفات المستودع
              </CardTitle>
              <CardDescription>
                {selectedFiles.size > 0 
                  ? `تم تحديد ${selectedFiles.size} من ${files.length} ملف`
                  : 'الملفات المستخدمة كمرجع في عملية المقارنة'
                }
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {isSuperAdmin && selectedFiles.size > 0 && (
                <>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 ml-2" />
                    حذف المحدد ({selectedFiles.size})
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSelection}
                    disabled={isDeleting}
                  >
                    إلغاء التحديد
                  </Button>
                </>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={isLoading}
              >
                <RefreshCw className={cn('h-4 w-4 ml-2', isLoading && 'animate-spin')} />
                تحديث
              </Button>
              
              <Button
                size="sm"
                onClick={() => document.getElementById('repository-upload')?.click()}
                disabled={isUploading}
              >
                <Upload className={cn('h-4 w-4 ml-2', isUploading && 'animate-pulse')} />
                {isUploading ? 'جاري الرفع...' : 'إضافة ملف'}
              </Button>
              <input
                id="repository-upload"
                type="file"
                accept="application/pdf"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">جارٍ تحميل البيانات...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12">
              <Database className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">المستودع فارغ</p>
              <p className="text-sm text-muted-foreground mt-1">
                ابدأ بإضافة ملفات للمقارنة
              </p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    {isSuperAdmin && (
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedFiles.size === files.length && files.length > 0}
                          onCheckedChange={(checked) => 
                            checked ? selectAll() : clearSelection()
                          }
                          disabled={isDeleting}
                        />
                      </TableHead>
                    )}
                    <TableHead>اسم الملف</TableHead>
                    <TableHead className="text-center">الحجم</TableHead>
                    <TableHead className="text-center">تاريخ الإضافة</TableHead>
                    {isSuperAdmin && (
                      <TableHead className="text-center">إجراءات</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map((file) => (
                    <TableRow key={file.id}>
                      {isSuperAdmin && (
                        <TableCell>
                          <Checkbox
                            checked={selectedFiles.has(file.id)}
                            onCheckedChange={() => toggleFileSelection(file.id)}
                            disabled={isDeleting}
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-medium max-w-[300px] truncate">
                        {file.file_name}
                      </TableCell>
                      <TableCell className="text-center">
                        {(file.file_size / 1024 / 1024).toFixed(2)} MB
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(file.created_at), {
                          addSuffix: true,
                          locale: ar,
                        })}
                      </TableCell>
                      {isSuperAdmin && (
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(file.id)}
                            disabled={deletingId === file.id || isDeleting}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </TableCell>
                      )}
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

export default RepositoryManager;
