import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Upload, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useQuestionBank } from '@/hooks/useQuestionBank';
import { communicationBasicsQuestions } from '@/data/communication-basics-questions';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logging';

export const BulkQuestionImporter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    skipped: number;
    errors: string[];
  }>({
    success: 0,
    failed: 0,
    skipped: 0,
    errors: []
  });

  const { addQuestion, questions: existingQuestions } = useQuestionBank();
  const { toast } = useToast();

  const handleImport = async () => {
    setIsImporting(true);
    setProgress(0);
    
    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[]
    };

    const totalQuestions = communicationBasicsQuestions.length;

    for (let i = 0; i < totalQuestions; i++) {
      const question = communicationBasicsQuestions[i];
      
      try {
        // التحقق من التكرار
        const isDuplicate = existingQuestions.some(
          (existing) => existing.question_text.trim() === question.question_text.trim()
        );

        if (isDuplicate) {
          logger.info(`تخطي السؤال المكرر: ${question.question_text.substring(0, 50)}...`);
          results.skipped++;
        } else {
          // إضافة السؤال
          await new Promise<void>((resolve, reject) => {
            addQuestion(question as any, {
              onSuccess: () => {
                results.success++;
                resolve();
              },
              onError: (error) => {
                results.failed++;
                results.errors.push(`خطأ في السؤال ${i + 1}: ${error.message}`);
                reject(error);
              }
            });
          });

          // انتظار قصير لتجنب إرهاق السيرفر
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (error) {
        logger.error(`فشل في إضافة السؤال ${i + 1}`, error);
      }

      // تحديث التقدم
      setProgress(((i + 1) / totalQuestions) * 100);
    }

    setImportResults(results);
    setIsImporting(false);

    // عرض النتيجة النهائية
    if (results.success > 0) {
      toast({
        title: '✅ اكتمل الاستيراد',
        description: `تم إضافة ${results.success} سؤال بنجاح${results.skipped > 0 ? ` (تخطي ${results.skipped} مكرر)` : ''}${results.failed > 0 ? ` (فشل ${results.failed})` : ''}`,
      });
    } else {
      toast({
        title: '⚠️ لم يتم إضافة أسئلة',
        description: results.skipped > 0 ? `جميع الأسئلة موجودة مسبقاً (${results.skipped})` : 'حدث خطأ أثناء الاستيراد',
        variant: 'destructive'
      });
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setProgress(0);
    setImportResults({ success: 0, failed: 0, skipped: 0, errors: [] });
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="gap-2"
      >
        <Upload className="h-4 w-4" />
        استيراد أسئلة أساسيات الاتصال (30 سؤال)
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>استيراد أسئلة أساسيات الاتصال</DialogTitle>
            <DialogDescription>
              سيتم إضافة 30 سؤال (20 اختيار متعدد + 10 صح/خطأ) إلى بنك الأسئلة
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!isImporting && progress === 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  <span>سيتم التحقق من عدم وجود أسئلة مكررة</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div className="rounded-lg border p-3">
                    <div className="text-2xl font-bold text-green-600">10</div>
                    <div className="text-muted-foreground">سهلة</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-2xl font-bold text-yellow-600">10</div>
                    <div className="text-muted-foreground">متوسطة</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-2xl font-bold text-red-600">10</div>
                    <div className="text-muted-foreground">صعبة</div>
                  </div>
                </div>
              </div>
            )}

            {isImporting && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>جارِ الاستيراد...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>{importResults.success} نجح</span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span>{importResults.skipped} مكرر</span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span>{importResults.failed} فشل</span>
                  </div>
                </div>
              </div>
            )}

            {!isImporting && progress > 0 && (
              <div className="space-y-3">
                <div className="rounded-lg border bg-muted/50 p-4">
                  <h4 className="font-semibold mb-2">النتيجة النهائية:</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>تم إضافة {importResults.success} سؤال بنجاح</span>
                    </div>
                    {importResults.skipped > 0 && (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <span>تخطي {importResults.skipped} سؤال مكرر</span>
                      </div>
                    )}
                    {importResults.failed > 0 && (
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span>فشل {importResults.failed} سؤال</span>
                      </div>
                    )}
                  </div>
                </div>

                {importResults.errors.length > 0 && (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 max-h-32 overflow-y-auto">
                    <h5 className="text-sm font-semibold mb-1 text-destructive">الأخطاء:</h5>
                    <ul className="text-xs space-y-1">
                      {importResults.errors.map((error, i) => (
                        <li key={i} className="text-destructive/90">{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            {!isImporting && progress === 0 && (
              <>
                <Button variant="outline" onClick={handleClose}>
                  إلغاء
                </Button>
                <Button onClick={handleImport}>
                  <Upload className="h-4 w-4 ml-2" />
                  بدء الاستيراد
                </Button>
              </>
            )}
            {!isImporting && progress > 0 && (
              <Button onClick={handleClose}>
                إغلاق
              </Button>
            )}
            {isImporting && (
              <Button disabled>
                جارِ الاستيراد...
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
