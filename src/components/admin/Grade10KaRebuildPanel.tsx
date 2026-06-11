import React, { useState } from 'react';
import { Loader2, RefreshCw, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SectionDef {
  id: string;
  title: string;
}

const SECTIONS: SectionDef[] = [
  { id: '0eaba634-48f2-4e7e-a8e4-e8593eee848b', title: 'أساسيات الاتصال' },
  { id: '9a7a101b-9272-4fd2-a572-5a535cefc129', title: 'عناوين الشبكة وطرق تمثيل الأرقام' },
  { id: '17692a6f-dfb4-4266-ba83-73e2b5afb882', title: 'شبكات الإيثرنت المحلية' },
  { id: 'b49b4b78-a88c-484a-9638-bd7b948b828b', title: 'البروتوكولات' },
];

type ResultItem = {
  topic: string;
  inserted?: number;
  skipped?: boolean;
  reason?: string;
  error?: string;
  generated?: number;
};

const Grade10KaRebuildPanel: React.FC = () => {
  const { toast } = useToast();
  const [running, setRunning] = useState<string | null>(null);
  const [resultsBySection, setResultsBySection] = useState<Record<string, ResultItem[]>>({});

  const rebuild = async (section: SectionDef) => {
    setRunning(section.id);
    try {
      const { data, error } = await supabase.functions.invoke('grade10-rebuild-ka-cards', {
        body: { section_id: section.id },
      });
      if (error) throw error;
      const items: ResultItem[] = (data as any)?.results ?? [];
      setResultsBySection((prev) => ({ ...prev, [section.id]: items }));
      const ok = items.filter((r) => r.inserted).length;
      const skipped = items.filter((r) => r.skipped).length;
      const failed = items.filter((r) => r.error).length;
      toast({
        title: `تم بناء بطاقات: ${section.title}`,
        description: `نجح: ${ok} • متخطى: ${skipped} • فشل: ${failed}`,
      });
    } catch (e: any) {
      toast({ title: 'فشل البناء', description: e?.message || 'خطأ غير متوقع', variant: 'destructive' });
    } finally {
      setRunning(null);
    }
  };

  const rebuildAll = async () => {
    for (const s of SECTIONS) {
      // eslint-disable-next-line no-await-in-loop
      await rebuild(s);
    }
  };

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-orange-600" />
          إعادة بناء بطاقات لعبة المعرفة (الصف العاشر)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          ينشئ بطاقة لكل موضوع بأسئلة مولّدة من نصوص الدروس فقط. تخطى مواضيع الألعاب. آمن لإعادة التشغيل.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={rebuildAll} disabled={!!running} variant="default">
            {running ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <RefreshCw className="h-4 w-4 ml-2" />}
            إعادة بناء جميع الأقسام
          </Button>
        </div>
        <div className="grid gap-3">
          {SECTIONS.map((s) => {
            const items = resultsBySection[s.id];
            const isRunning = running === s.id;
            return (
              <div key={s.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold">{s.title}</div>
                  <Button size="sm" variant="outline" onClick={() => rebuild(s)} disabled={!!running}>
                    {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : 'إعادة بناء'}
                  </Button>
                </div>
                {items && (
                  <div className="space-y-1 max-h-64 overflow-auto text-sm">
                    {items.map((r, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {r.inserted ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                        ) : r.skipped ? (
                          <MinusCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                        )}
                        <span className="flex-1 truncate">{r.topic}</span>
                        {r.inserted && <Badge variant="secondary">{r.inserted} أسئلة</Badge>}
                        {r.skipped && <Badge variant="outline">{r.reason}</Badge>}
                        {r.error && <Badge variant="destructive" className="max-w-[40%] truncate">{r.error}</Badge>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default Grade10KaRebuildPanel;
