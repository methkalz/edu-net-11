import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Loader2, ImageDown, Undo2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface TopicOption {
  id: string;
  title: string;
  section_title: string;
}

interface ScanItem {
  lesson_id: string;
  title: string;
  pending: number;
  size: number;
}

interface MigrationResult {
  action: string;
  lessons: number;
  images_migrated: number;
  bytes_before: number;
  bytes_after: number;
  reduction_percent: number;
  results: Array<{ title: string; images: number; failed?: number; error?: string }>;
}

const fmt = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

const Grade11ImageMigrationPanel: React.FC = () => {
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [topicId, setTopicId] = useState<string>('');
  const [busy, setBusy] = useState<null | 'scan' | 'migrate' | 'restore'>(null);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [progress, setProgress] = useState<string>('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('grade11_topics')
        .select('id, title, order_index, grade11_sections(title)')
        .order('order_index');
      if (error) {
        toast.error('تعذّر تحميل المواضيع');
        return;
      }
      setTopics(
        (data || []).map((t: any) => ({
          id: t.id,
          title: t.title,
          section_title: t.grade11_sections?.title || '',
        }))
      );
    })();
  }, []);

  const invoke = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke('grade11-migrate-lesson-images', { body });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const scan = async (): Promise<ScanItem[]> => {
    const data = await invoke({ action: 'scan', topic_id: topicId });
    setResult({
      action: 'scan',
      lessons: data.lessons,
      images_migrated: data.pending_images,
      bytes_before: data.total_bytes,
      bytes_after: data.total_bytes,
      reduction_percent: 0,
      results: (data.items as ScanItem[]).map((i) => ({ title: i.title, images: i.pending })),
    });
    return data.items as ScanItem[];
  };

  const run = async (action: 'scan' | 'migrate' | 'restore') => {
    if (!topicId) {
      toast.error('اختر الموضوع أولاً');
      return;
    }
    setBusy(action);
    setProgress('');
    if (action !== 'restore') setResult(null);
    try {
      if (action === 'restore') {
        const data = await invoke({ action: 'restore', topic_id: topicId });
        toast.success(`تمت الاستعادة لـ ${data.restored} درس`);
        return;
      }

      const items = await scan();
      if (action === 'scan') {
        toast.success(`تم الفحص: ${items.reduce((s, i) => s + i.pending, 0)} صورة Base64`);
        return;
      }

      const pending = items.filter((i) => i.pending > 0);
      const rows: MigrationResult['results'] = [];
      let images = 0;
      let bytesBefore = 0;
      let bytesAfter = 0;

      for (let idx = 0; idx < pending.length; idx++) {
        const item = pending[idx];
        let remaining = item.pending;
        let migratedHere = 0;
        let sizeAfter = item.size;
        bytesBefore += item.size;

        while (remaining > 0) {
          setProgress(`(${idx + 1}/${pending.length}) ${item.title} — متبقٍ ${remaining} صورة`);
          const r = await invoke({ action: 'migrate', lesson_id: item.lesson_id, max_images: 4 });
          if (!r.images_migrated) {
            rows.push({ title: item.title, images: migratedHere, error: r.last_error || 'توقف' });
            break;
          }
          migratedHere += r.images_migrated;
          remaining = r.remaining;
          sizeAfter = r.size_after;
        }

        images += migratedHere;
        bytesAfter += sizeAfter;
        if (!rows.some((x) => x.title === item.title && x.error)) {
          rows.push({ title: item.title, images: migratedHere });
        }
      }

      setResult({
        action: 'migrate',
        lessons: pending.length,
        images_migrated: images,
        bytes_before: bytesBefore,
        bytes_after: bytesAfter,
        reduction_percent: bytesBefore ? Math.round((1 - bytesAfter / bytesBefore) * 100) : 0,
        results: rows,
      });
      toast.success(`تم تحويل ${images} صورة`);
    } catch (e: any) {
      toast.error(e?.message || 'حدث خطأ أثناء العملية');
    } finally {
      setBusy(null);
      setProgress('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageDown className="h-5 w-5 text-primary" />
          تحويل صور الدروس من Base64 إلى التخزين
        </CardTitle>
        <CardDescription>
          يتم حفظ نسخة احتياطية من محتوى كل درس قبل التعديل، ويمكن التراجع الكامل في أي وقت.
          شكل الصور وظهورها للمستخدم لا يتغيّر إطلاقاً.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={topicId} onValueChange={setTopicId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="اختر الموضوع" />
          </SelectTrigger>
          <SelectContent className="max-h-80">
            {topics.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.section_title ? `${t.section_title} — ` : ''}{t.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {progress && (
          <div className="text-sm text-muted-foreground">{progress}</div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" disabled={!!busy} onClick={() => run('scan')}>
            {busy === 'scan' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            فحص فقط
          </Button>
          <Button disabled={!!busy} onClick={() => setConfirmOpen(true)}>
            {busy === 'migrate' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageDown className="h-4 w-4" />}
            تنفيذ التحويل
          </Button>
          <Button variant="destructive" disabled={!!busy} onClick={() => setRestoreOpen(true)}>
            {busy === 'restore' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
            استعادة النسخة الأصلية
          </Button>
        </div>

        {result && (
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">الدروس: {result.lessons}</Badge>
              <Badge variant="secondary">الصور: {result.images_migrated}</Badge>
              <Badge variant="secondary">قبل: {fmt(result.bytes_before)}</Badge>
              <Badge variant="secondary">بعد: {fmt(result.bytes_after)}</Badge>
              <Badge>تقليص: {result.reduction_percent}%</Badge>
            </div>
            <div className="max-h-64 overflow-auto text-sm space-y-1">
              {result.results.map((r, i) => (
                <div key={i} className="flex justify-between gap-4 border-b py-1">
                  <span className="truncate">{r.title}</span>
                  <span className="text-muted-foreground whitespace-nowrap">
                    {r.error ? `خطأ: ${r.error}` : `${r.images} صورة${r.failed ? ` / فشل ${r.failed}` : ''}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد تحويل الصور</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم رفع صور دروس هذا الموضوع إلى التخزين واستبدالها بروابط، مع حفظ نسخة احتياطية
              كاملة للمحتوى الأصلي. يمكنك التراجع لاحقاً بزر «استعادة النسخة الأصلية».
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => run('migrate')}>تنفيذ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={restoreOpen} onOpenChange={setRestoreOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>استعادة المحتوى الأصلي</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم إرجاع محتوى دروس هذا الموضوع إلى حالته قبل التحويل (صور Base64 كما كانت).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => run('restore')}>استعادة</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default Grade11ImageMigrationPanel;
