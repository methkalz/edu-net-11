import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { History, ChevronDown, ChevronUp } from 'lucide-react';
import type { FixHistoryEntry } from '@/hooks/useTrueFalseFixHistory';

interface Props {
  history: FixHistoryEntry[];
  isLoading: boolean;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function HistorySection({ history, isLoading }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground text-sm">
          جاري تحميل السجل...
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">سجل العمليات السابقة</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {history.map((entry) => {
            const s = entry.payload_json?.summary;
            const isExpanded = expandedId === entry.id;
            const correctedResults = entry.payload_json?.results?.filter((r) => r.status === 'corrected') || [];

            return (
              <div key={entry.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Badge variant={entry.action === 'auto_fix' ? 'default' : 'outline'}>
                      {entry.action === 'auto_fix' ? 'إصلاح فعلي' : 'معاينة'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(entry.created_at_utc)}</span>
                  </div>
                  {s && (
                    <div className="flex items-center gap-2 text-xs">
                      <span>{s.total} سؤال</span>
                      <span className="text-green-600">✓ {s.confirmed}</span>
                      <span className="text-blue-600">🔧 {s.corrected}</span>
                      <span className="text-yellow-600">⚡ {s.normalized}</span>
                      <span className="text-red-600">✗ {s.skipped}</span>
                    </div>
                  )}
                </div>

                {correctedResults.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs gap-1 h-7"
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  >
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {isExpanded ? 'إخفاء التفاصيل' : `عرض ${correctedResults.length} تصحيح`}
                  </Button>
                )}

                {isExpanded && correctedResults.length > 0 && (
                  <div className="space-y-1 pt-1 border-t">
                    {correctedResults.map((r, i) => (
                      <div key={i} className="text-xs p-2 rounded bg-muted/50 space-y-1">
                        <p className="font-medium">{r.question_text}</p>
                        <div className="flex items-center gap-2">
                          <span className="line-through text-destructive">{r.old_answer}</span>
                          <span>→</span>
                          <span className="font-bold text-green-700 dark:text-green-400">{r.new_answer}</span>
                        </div>
                        {r.explanation && <p className="text-muted-foreground">{r.explanation}</p>}
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
}
