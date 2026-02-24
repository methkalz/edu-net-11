import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { QuestionBankStats } from '@/hooks/useTrueFalseFixHistory';

interface Props {
  stats: QuestionBankStats | null;
  isLoading: boolean;
}

export default function CurrentStatsSection({ stats, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground text-sm">
          جاري تحميل الإحصائيات...
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const truePercent = stats.total > 0 ? Math.round((stats.trueCount / stats.total) * 100) : 0;
  const falsePercent = stats.total > 0 ? Math.round((stats.falseCount / stats.total) * 100) : 0;
  const brokenPercent = stats.total > 0 ? Math.round((stats.brokenCount / stats.total) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">الوضع الحالي لأسئلة صح/خطأ</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">إجمالي الأسئلة</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-green-500/10">
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.trueCount}</p>
            <p className="text-xs text-muted-foreground">إجابتها "صح"</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-red-500/10">
            <p className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.falseCount}</p>
            <p className="text-xs text-muted-foreground">إجابتها "خطأ"</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-yellow-500/10">
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.brokenCount}</p>
            <p className="text-xs text-muted-foreground">صيغ مكسورة</p>
          </div>
        </div>

        {/* Distribution bar */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">توزيع الإجابات</p>
          <div className="flex h-4 rounded-full overflow-hidden">
            {truePercent > 0 && (
              <div className="bg-green-500 flex items-center justify-center" style={{ width: `${truePercent}%` }}>
                <span className="text-[10px] text-white font-medium">{truePercent}%</span>
              </div>
            )}
            {falsePercent > 0 && (
              <div className="bg-red-500 flex items-center justify-center" style={{ width: `${falsePercent}%` }}>
                <span className="text-[10px] text-white font-medium">{falsePercent}%</span>
              </div>
            )}
            {brokenPercent > 0 && (
              <div className="bg-yellow-500 flex items-center justify-center" style={{ width: `${brokenPercent}%` }}>
                <span className="text-[10px] text-white font-medium">{brokenPercent}%</span>
              </div>
            )}
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> صح</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> خطأ</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> مكسور</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
