import { Card, CardContent } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

interface Props {
  cumulativeStats: {
    totalCorrected: number;
    totalNormalized: number;
    totalOperations: number;
    lastOperation: string | null;
  };
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function CumulativeStatsCard({ cumulativeStats }: Props) {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-5 h-5 text-primary" />
          <p className="font-semibold">ملخص الإنجازات</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div>
            <p className="text-xl font-bold text-primary">{cumulativeStats.totalOperations}</p>
            <p className="text-xs text-muted-foreground">عمليات إصلاح</p>
          </div>
          <div>
            <p className="text-xl font-bold text-blue-600">{cumulativeStats.totalCorrected}</p>
            <p className="text-xs text-muted-foreground">سؤال مُصحّح</p>
          </div>
          <div>
            <p className="text-xl font-bold text-yellow-600">{cumulativeStats.totalNormalized}</p>
            <p className="text-xs text-muted-foreground">صيغة مُوحّدة</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">آخر عملية</p>
            <p className="text-xs font-medium">
              {cumulativeStats.lastOperation ? formatDate(cumulativeStats.lastOperation) : '-'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
