import { useState } from 'react';
import ModernHeader from '@/components/shared/ModernHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Play, Eye, RotateCcw, CheckCircle2, AlertTriangle, XCircle, Wrench } from 'lucide-react';
import { useTrueFalseAutoFix, FixResult } from '@/hooks/useTrueFalseAutoFix';

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

function QuestionCard({ result }: { result: FixResult }) {
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

export default function TrueFalseFixPage() {
  const { status, response, error, runFix, reset } = useTrueFalseAutoFix();
  const [activeTab, setActiveTab] = useState('all');

  const summary = response?.summary;
  const results = response?.results || [];

  const filteredResults = activeTab === 'all'
    ? results
    : results.filter((r) => r.status === activeTab);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <ModernHeader title="إصلاح أسئلة صح/خطأ بالذكاء الاصطناعي" showBackButton backPath="/exam-bank-management" />

      <div className="container mx-auto px-4 py-8 space-y-6 max-w-4xl">
        {/* Control Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>الإصلاح التلقائي بالذكاء الاصطناعي</CardTitle>
                <CardDescription>
                  يقوم الذكاء الاصطناعي بمراجعة جميع أسئلة صح/خطأ وتحديد الإجابة الصحيحة لكل سؤال
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === 'running' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                  جاري المعالجة... قد تستغرق العملية بضع دقائق
                </div>
                <Progress value={undefined} className="h-2" />
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 flex-wrap">
              {status === 'idle' && (
                <>
                  <Button onClick={() => runFix(true)} variant="outline" className="gap-2">
                    <Eye className="w-4 h-4" />
                    معاينة (بدون تعديل)
                  </Button>
                  <Button onClick={() => runFix(false)} className="gap-2">
                    <Play className="w-4 h-4" />
                    بدء الإصلاح
                  </Button>
                </>
              )}
              {status === 'running' && (
                <Button disabled variant="outline">جاري المعالجة...</Button>
              )}
              {(status === 'done' || status === 'error') && (
                <Button onClick={reset} variant="outline" className="gap-2">
                  <RotateCcw className="w-4 h-4" />
                  إعادة تشغيل
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-2xl font-bold">{summary.total}</p>
                <p className="text-xs text-muted-foreground">إجمالي</p>
              </CardContent>
            </Card>
            <Card className="border-green-500/30">
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{summary.confirmed}</p>
                <p className="text-xs text-muted-foreground">مُؤكّد</p>
              </CardContent>
            </Card>
            <Card className="border-blue-500/30">
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{summary.corrected}</p>
                <p className="text-xs text-muted-foreground">مُصحّح</p>
              </CardContent>
            </Card>
            <Card className="border-yellow-500/30">
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{summary.normalized}</p>
                <p className="text-xs text-muted-foreground">مُوحّد</p>
              </CardContent>
            </Card>
            <Card className="border-red-500/30">
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">{summary.skipped}</p>
                <p className="text-xs text-muted-foreground">تم تخطيه</p>
              </CardContent>
            </Card>
            {summary.dryRun && (
              <div className="col-span-full">
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                  ⚠️ وضع المعاينة - لم يتم تعديل قاعدة البيانات
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">تفاصيل النتائج</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">الكل ({results.length})</TabsTrigger>
                  <TabsTrigger value="corrected">مُصحّح ({summary?.corrected || 0})</TabsTrigger>
                  <TabsTrigger value="normalized">مُوحّد ({summary?.normalized || 0})</TabsTrigger>
                  <TabsTrigger value="confirmed">مُؤكّد ({summary?.confirmed || 0})</TabsTrigger>
                  <TabsTrigger value="skipped">تم تخطيه ({summary?.skipped || 0})</TabsTrigger>
                </TabsList>

                <ScrollArea className="h-[500px]">
                  {filteredResults.map((result) => (
                    <QuestionCard key={result.question_id} result={result} />
                  ))}
                  {filteredResults.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">لا توجد نتائج في هذه الفئة</p>
                  )}
                </ScrollArea>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
