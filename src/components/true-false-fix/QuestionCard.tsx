import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle, Wrench } from 'lucide-react';
import { FixResult } from '@/hooks/useTrueFalseAutoFix';

const confidenceColors: Record<string, string> = {
  high: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
  low: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
};

const confidenceLabels: Record<string, string> = {
  high: 'عالية',
  medium: 'متوسطة',
  low: 'منخفضة',
};

const statusIcons: Record<string, React.ReactNode> = {
  confirmed: <CheckCircle2 className="w-4 h-4 text-green-600" />,
  corrected: <Wrench className="w-4 h-4 text-blue-600" />,
  normalized: <AlertTriangle className="w-4 h-4 text-yellow-600" />,
  skipped: <XCircle className="w-4 h-4 text-red-600" />,
};

const statusLabels: Record<string, string> = {
  confirmed: 'مُؤكّد',
  corrected: 'مُصحّح',
  normalized: 'مُوحّد',
  skipped: 'تم تخطيه',
};

export default function QuestionCard({ result }: { result: FixResult }) {
  return (
    <Card className="mb-3">
      <CardContent className="pt-4 pb-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-relaxed flex-1">{result.question_text}</p>
          <div className="flex items-center gap-1.5 shrink-0">
            {statusIcons[result.status]}
            <Badge variant="outline" className="text-xs">
              {statusLabels[result.status]}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {result.status === 'corrected' && (
            <>
              <span className="line-through text-destructive">{result.old_answer}</span>
              <span>→</span>
              <span className="font-bold text-green-700 dark:text-green-400">{result.new_answer}</span>
            </>
          )}
          {result.status === 'confirmed' && (
            <span className="text-green-700 dark:text-green-400 font-medium">الإجابة: {result.new_answer}</span>
          )}
          {result.status === 'normalized' && (
            <span className="text-yellow-700 dark:text-yellow-400 font-medium">تم توحيد الصيغة → {result.new_answer}</span>
          )}
          <Badge variant="outline" className={confidenceColors[result.confidence]}>
            ثقة {confidenceLabels[result.confidence]}
          </Badge>
        </div>

        {result.explanation && (
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2">{result.explanation}</p>
        )}
      </CardContent>
    </Card>
  );
}
