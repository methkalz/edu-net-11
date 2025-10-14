import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FolderSync, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface MigrationResult {
  school_id: string;
  school_name: string;
  status: 'success' | 'error';
  documents_encrypted?: number;
  error?: string;
}

export const MigrationManager = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<MigrationResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const runMigration = async () => {
    setIsRunning(true);
    setShowResults(false);
    setResults([]);

    try {
      toast.info('🔄 بدء عملية المهاجرة...', {
        description: 'سيتم إنشاء الهيكل الهرمي لجميع المدارس'
      });

      const { data, error } = await supabase.functions.invoke('migrate-existing-schools', {
        body: {}
      });

      if (error) {
        throw new Error(error.message || 'فشل في تنفيذ المهاجرة');
      }

      if (!data.success) {
        throw new Error(data.error || 'فشل في المهاجرة');
      }

      setResults(data.results || []);
      setShowResults(true);

      const successCount = data.results?.filter((r: MigrationResult) => r.status === 'success').length || 0;
      const errorCount = data.results?.filter((r: MigrationResult) => r.status === 'error').length || 0;

      toast.success('✅ تمت المهاجرة بنجاح!', {
        description: `نجح: ${successCount} مدرسة | فشل: ${errorCount} مدرسة`
      });

    } catch (error: any) {
      console.error('Migration error:', error);
      toast.error('❌ فشل في تنفيذ المهاجرة', {
        description: error.message || 'حدث خطأ غير متوقع'
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderSync className="w-5 h-5" />
          مهاجرة المدارس القائمة
        </CardTitle>
        <CardDescription>
          إنشاء الهيكل الهرمي لـ Google Drive لجميع المدارس القائمة (المدرسة → الصفوف 10، 11، 12)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            <strong>ملاحظة مهمة:</strong> هذه العملية تقوم بـ:
            <ul className="list-disc mr-6 mt-2 space-y-1">
              <li>إنشاء مجلد رئيسي لكل مدرسة في Google Drive</li>
              <li>إنشاء 3 مجلدات فرعية (صف 10، صف 11، صف 12)</li>
              <li>تشفير روابط المجلدات وتخزينها في قاعدة البيانات</li>
              <li>تشفير المستندات القديمة غير المشفرة (إن وُجدت)</li>
            </ul>
          </AlertDescription>
        </Alert>

        <Button 
          onClick={runMigration}
          disabled={isRunning}
          className="w-full"
          size="lg"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              جاري التنفيذ...
            </>
          ) : (
            <>
              <FolderSync className="w-4 h-4 ml-2" />
              تشغيل المهاجرة الآن
            </>
          )}
        </Button>

        {showResults && results.length > 0 && (
          <div className="space-y-3 mt-6">
            <h3 className="font-semibold text-lg">نتائج المهاجرة:</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {result.status === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium">{result.school_name}</p>
                      {result.status === 'success' && result.documents_encrypted !== undefined && (
                        <p className="text-sm text-muted-foreground">
                          تم تشفير {result.documents_encrypted} مستند
                        </p>
                      )}
                      {result.status === 'error' && result.error && (
                        <p className="text-sm text-red-500">{result.error}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                    {result.status === 'success' ? 'نجح' : 'فشل'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
