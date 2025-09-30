import { useState } from 'react';
import { Grade11PointsConfigPanel } from '@/components/superadmin/Grade11PointsConfigPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Settings, Database, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { migrateStudentPointsData } from '@/utils/migrateStudentPoints';

export const Grade11PointsManagement = () => {
  const { toast } = useToast();
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{
    success: boolean;
    successCount?: number;
    errorCount?: number;
    message?: string;
    error?: string;
  } | null>(null);

  const handleMigration = async () => {
    if (!confirm('هل أنت متأكد من تشغيل script الترحيل؟ يجب تشغيله مرة واحدة فقط.')) {
      return;
    }

    setMigrating(true);
    setMigrationResult(null);

    try {
      const result = await migrateStudentPointsData();
      setMigrationResult(result);

      if (result.success) {
        toast({
          title: 'تم الترحيل بنجاح',
          description: result.message,
        });
      } else {
        toast({
          title: 'فشل الترحيل',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('خطأ في الترحيل:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء الترحيل',
        variant: 'destructive',
      });
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold mb-2">إدارة نقاط الصف الحادي عشر</h1>
        <p className="text-muted-foreground">
          تحكم في توزيع النقاط وإدارة نظام المكافآت للطلاب
        </p>
      </div>

      {/* Migration Section */}
      <Card className="border-warning/50 bg-warning/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            ترحيل البيانات الحالية
          </CardTitle>
          <CardDescription>
            تشغيل script لإنشاء سجلات نقاط للطلاب الحاليين بناءً على تقدمهم
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>تنبيه مهم</AlertTitle>
            <AlertDescription>
              يجب تشغيل هذا Script مرة واحدة فقط بعد إنشاء نظام النقاط الجديد. سيقوم
              بحساب النقاط المستحقة للطلاب الحاليين بناءً على تقدمهم في الدروس
              والفيديوهات.
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleMigration}
            disabled={migrating}
            variant="default"
            className="w-full"
          >
            {migrating ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full ml-2" />
                جاري الترحيل...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 ml-2" />
                تشغيل الترحيل
              </>
            )}
          </Button>

          {migrationResult && (
            <Alert
              variant={migrationResult.success ? 'default' : 'destructive'}
              className={migrationResult.success ? 'border-green-500 bg-green-50' : ''}
            >
              {migrationResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {migrationResult.success ? 'نجح الترحيل' : 'فشل الترحيل'}
              </AlertTitle>
              <AlertDescription>
                {migrationResult.success ? (
                  <div className="space-y-1">
                    <p>{migrationResult.message}</p>
                    <p className="text-sm">
                      نجح: {migrationResult.successCount} | فشل: {migrationResult.errorCount}
                    </p>
                  </div>
                ) : (
                  <p>{migrationResult.error}</p>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Points Configuration */}
      <Grade11PointsConfigPanel />

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            كيفية استخدام نظام النقاط
          </CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">النقطة الابتدائية (100 نقطة)</h3>
            <p className="text-muted-foreground">
              يحصل كل طالب جديد على 100 نقطة ابتدائية عند التسجيل تلقائياً. هذه النقاط
              تُضاف إلى total_xp في ملف اللاعب.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">نقاط الدروس (افتراضياً 50%)</h3>
            <p className="text-muted-foreground">
              يحصل الطالب على نقاط عند إكمال كل درس. يتم حساب نقاط كل درس ديناميكياً
              بناءً على العدد الإجمالي للدروس النشطة في النظام.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              مثال: إذا كان هناك 267 درساً، فكل درس = (50% × 1000) ÷ 267 ≈ 1.87 نقطة
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">نقاط الفيديوهات (افتراضياً 10%)</h3>
            <p className="text-muted-foreground">
              يحصل الطالب على نقاط عند مشاهدة كل فيديو بالكامل. يتم حساب نقاط كل
              فيديو ديناميكياً بناءً على العدد الإجمالي للفيديوهات.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              مثال: إذا كان هناك 5 فيديوهات، فكل فيديو = (10% × 1000) ÷ 5 = 20 نقطة
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">نقاط الألعاب (افتراضياً 30%)</h3>
            <p className="text-muted-foreground">
              يحصل الطالب على نقاط بناءً على أدائه في الألعاب التعليمية. النظام مرن
              ويدعم إضافة ألعاب جديدة مستقبلاً.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">تعديل النسب المئوية</h3>
            <p className="text-muted-foreground">
              يمكن للسوبر أدمن تعديل النسب المئوية لكل فئة من اللوحة أعلاه. سيتم
              تطبيق التغييرات على جميع الطلاب الجدد والقدامى. يجب أن يكون مجموع النسب
              مع النقطة الابتدائية = 100%.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
