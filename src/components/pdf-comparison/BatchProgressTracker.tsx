import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle, Clock, ArrowLeft, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import {
  usePDFComparison,
  type GradeLevel,
  type ActiveBatch,
  type BatchFileStatus,
} from '@/hooks/usePDFComparison';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface BatchProgressTrackerProps {
  gradeLevel: GradeLevel;
  newBatchId?: string | null;
  onViewResults?: (batchId: string) => void;
}

const STATUS_VALUE: Record<BatchFileStatus, number> = {
  pending: 0,
  internal_done: 1,
  repository_done: 3, // نهائي فعلياً (لا توجد add_to_repo jobs)
  completed: 3,
};

// تسمية المرحلة حسب أدنى حالة بين ملفات الدفعة
const getPhaseLabel = (minStatus: number, internalDone: number, total: number): string => {
  if (minStatus >= 3) return 'اكتملت المعالجة';
  if (internalDone > 0 && internalDone < total) {
    return `جاري المقارنة... (${internalDone} من ${total} انتهى من المقارنة الداخلية)`;
  }
  if (minStatus < 1) return 'في قائمة الانتظار للمعالجة...';
  return 'جاري المقارنة الداخلية ومع المستودع...';
};

interface BatchView {
  batchId: string;
  total: number;
  completed: number;
  internalDone: number;
  progressPercent: number;
  phaseLabel: string;
  isComplete: boolean;
}

const computeBatchView = (batch: ActiveBatch): BatchView => {
  const total = batch.files.length;
  const values = batch.files.map((f) => STATUS_VALUE[f.batchStatus] ?? 0);
  const completed = values.filter((v) => v >= 3).length;
  const internalDone = values.filter((v) => v >= 1).length;
  const sum = values.reduce((a, b) => a + b, 0);
  const progressPercent = total > 0 ? Math.round((sum / (total * 3)) * 100) : 0;
  const minStatus = total > 0 ? Math.min(...values) : 0;
  return {
    batchId: batch.batchId,
    total,
    completed,
    internalDone,
    progressPercent,
    phaseLabel: getPhaseLabel(minStatus, internalDone, total),
    isComplete: total > 0 && completed === total,
  };
};

const BatchProgressTracker = ({
  gradeLevel,
  newBatchId,
  onViewResults,
}: BatchProgressTrackerProps) => {
  const { getActiveBatches, cancelBatch } = usePDFComparison();
  const { userProfile } = useAuth();
  const [batches, setBatches] = useState<ActiveBatch[]>([]);
  const [batchToCancel, setBatchToCancel] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const refresh = useCallback(async () => {
    const active = await getActiveBatches(gradeLevel);
    setBatches(active);
  }, [gradeLevel, userProfile?.user_id]);

  const handleConfirmCancel = async () => {
    if (!batchToCancel) return;
    setIsCancelling(true);
    const success = await cancelBatch(batchToCancel);
    if (success) {
      setBatches((prev) => prev.filter((b) => b.batchId !== batchToCancel));
      toast.success('تم إلغاء عملية المقارنة');
    }
    setIsCancelling(false);
    setBatchToCancel(null);
  };

  // جلب الدفعات قيد المعالجة عند التحميل أو تغيّر الصف أو وصول دفعة جديدة
  useEffect(() => {
    refresh();
  }, [refresh, newBatchId]);

  // Realtime - تحديث حالة الملفات لحظياً
  useEffect(() => {
    if (!userProfile?.user_id) return;

    const channel = supabase
      .channel(`active-batches-${userProfile.user_id}`)
      .on(
        'postgres_changes' as any,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pdf_comparison_results',
          filter: `requested_by=eq.${userProfile.user_id}`,
        },
        (payload: any) => {
          const updated = payload.new;
          if (!updated?.batch_id) return;

          setBatches((prev) => {
            const idx = prev.findIndex((b) => b.batchId === updated.batch_id);
            if (idx === -1) {
              // دفعة جديدة لم تكن في القائمة - أعد الجلب
              refresh();
              return prev;
            }
            const next = [...prev];
            const batch = { ...next[idx], files: [...next[idx].files] };
            const fileIdx = batch.files.findIndex((f) => f.id === updated.id);
            if (fileIdx !== -1) {
              batch.files[fileIdx] = {
                ...batch.files[fileIdx],
                batchStatus: updated.batch_status || 'pending',
              };
            }
            next[idx] = batch;
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile?.user_id, refresh]);

  if (batches.length === 0) return null;

  return (
    <div className="space-y-3">
      {batches.map((batch) => {
        const view = computeBatchView(batch);
        return (
          <Card
            key={view.batchId}
            className="border border-primary/20 bg-primary/5 backdrop-blur-sm"
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {view.isComplete ? (
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                  ) : (
                    <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {view.isComplete
                        ? `اكتملت معالجة ${view.total} ملف`
                        : `جاري معالجة ${view.total} ملف في الخلفية`}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      {!view.isComplete && <Clock className="h-3 w-3" />}
                      {view.phaseLabel}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {view.isComplete && onViewResults && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewResults(view.batchId)}
                      className="gap-1.5"
                    >
                      عرض النتائج
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {!view.isComplete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setBatchToCancel(view.batchId)}
                      className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-3.5 w-3.5" />
                      إلغاء
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Progress value={view.progressPercent} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {view.completed} من {view.total} ملف اكتمل
                  </span>
                  <span>{view.progressPercent}%</span>
                </div>
              </div>

              {!view.isComplete && (
                <p className="text-[11px] text-muted-foreground/70">
                  يمكنك مغادرة الصفحة - ستستمر المعالجة في الخلفية وتظهر النتائج تلقائياً.
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}

      <AlertDialog
        open={batchToCancel !== null}
        onOpenChange={(open) => !open && setBatchToCancel(null)}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من إلغاء العملية؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم إيقاف معالجة هذه الدفعة وحذف جميع بياناتها نهائياً. لا يمكن
              التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>تراجع</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmCancel();
              }}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? 'جاري الإلغاء...' : 'نعم، إلغاء العملية'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BatchProgressTracker;
