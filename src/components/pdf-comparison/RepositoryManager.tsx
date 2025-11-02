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
    addToRepository 
  } = usePDFComparison();
  
  const [files, setFiles] = useState<RepositoryFile[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

    try {
      const success = await addToRepository(file, gradeLevel);
      if (success) {
        await loadData();
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('حدث خطأ أثناء رفع الملف');
    } finally {
      // إعادة تعيين input
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>إجمالي الملفات</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(stats?.totalFiles || 0).toLocaleString('ar-SA')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>إجمالي الكلمات</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(stats?.totalWords || 0).toLocaleString('ar-SA')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>الحجم الإجمالي</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {((stats?.totalSize || 0) / 1024 / 1024).toFixed(1)} MB
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Files Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>ملفات المستودع</CardTitle>
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
              >
                <Upload className="h-4 w-4 ml-2" />
                إضافة ملف
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
                    <TableHead className="text-center">عدد الكلمات</TableHead>
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
                        {(file.word_count || 0).toLocaleString('ar-SA')}
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
