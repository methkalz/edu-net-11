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
    getRepositoryStats,
    addToRepository,
    uploadProgress
  } = usePDFComparison();
  
  const [files, setFiles] = useState<RepositoryFile[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState<string>('');

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
      loadData();
    }
    setDeletingId(null);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!gradeLevel) {
      toast.error('يرجى تحديد الصف أولاً');
      return;
    }

    setIsUploading(true);
    setUploadingFileName(file.name);

    try {
      const success = await addToRepository(file, gradeLevel);
      if (success) {
        await loadData();
        toast.success('تم رفع الملف بنجاح');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('حدث خطأ أثناء رفع الملف');
    } finally {
      setIsUploading(false);
      setUploadingFileName('');
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Progress Bar */}
      {isUploading && (
        <Card className="border-0 bg-gradient-to-r from-primary/10 to-primary/5 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="h-5 w-5 text-primary animate-pulse" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">جاري رفع الملف...</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                      {uploadingFileName}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium text-primary">
                  {uploadProgress}%
                </span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
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
                الملفات المستخدمة كمرجع في عملية المقارنة
              </CardDescription>
            </div>
            <div className="flex gap-2">
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
                            disabled={deletingId === file.id}
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
