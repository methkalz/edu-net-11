// مكون البدء للامتحانات بجميع أقسام إلزامية (بدون قسم اختياري)
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  FileText, 
  Clock, 
  Award, 
  Layers,
  PlayCircle,
  BookOpen,
  AlertTriangle,
  Info
} from 'lucide-react';
import type { ParsedSection } from '@/lib/bagrut/buildBagrutPreview';

interface AllMandatoryExamStartProps {
  sections: ParsedSection[];
  examTitle: string;
  examDuration: number;
  totalPoints: number;
  instructions: string | null;
  onStart: () => void;
  isStarting: boolean;
}

export default function AllMandatoryExamStart({
  sections,
  examTitle,
  examDuration,
  totalPoints,
  instructions,
  onStart,
  isStarting,
}: AllMandatoryExamStartProps) {
  
  // حساب إجمالي الأسئلة
  const totalQuestionsCount = useMemo(() => {
    return sections.reduce((acc, s) => acc + s.questions.length, 0);
  }, [sections]);

  // تنسيق التعليمات كقائمة
  const formattedInstructions = useMemo(() => {
    if (!instructions) return [];
    return instructions
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }, [instructions]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* إرشادات وتعليمات الامتحان */}
      {instructions && formattedInstructions.length > 0 && (
        <Card className="border-2 border-orange-300 dark:border-orange-700 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/50">
                <BookOpen className="h-5 w-5" />
              </div>
              إرشادات وتعليمات الامتحان
            </CardTitle>
            <CardDescription className="text-orange-600/80 dark:text-orange-400/80">
              يرجى قراءة التعليمات التالية بعناية قبل البدء
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {formattedInstructions.map((line, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-3 p-2 rounded-lg bg-white/60 dark:bg-background/40"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-200 dark:bg-orange-800/50 text-orange-700 dark:text-orange-300 text-sm font-medium flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-foreground/90">{line}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-4 flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400 bg-orange-100/50 dark:bg-orange-900/30 rounded-lg p-3">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>تأكد من قراءة جميع التعليمات قبل بدء الامتحان. لن تتمكن من العودة لهذه الصفحة بعد البدء.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* معلومات الامتحان */}
      <Card>
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl">{examTitle}</CardTitle>
          <CardDescription>
            هذا الامتحان يتكون من فصول إلزامية يجب حلها جميعاً
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">المدة</p>
                <p className="font-semibold">{examDuration} دقيقة</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Award className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">العلامة</p>
                <p className="font-semibold">{totalPoints} علامة</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Layers className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">الفصول</p>
                <p className="font-semibold">{sections.length} فصل</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <FileText className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">الأسئلة</p>
                <p className="font-semibold">{totalQuestionsCount} سؤال</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* جميع الفصول الإلزامية */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            فصول الامتحان (جميعها إلزامية)
          </CardTitle>
          <CardDescription>
            يجب حل جميع الفصول التالية للحصول على العلامة الكاملة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sections.map((section, index) => (
              <div
                key={section.section_db_id || index}
                className="flex items-center justify-between p-4 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{section.section_title}</p>
                    <p className="text-sm text-muted-foreground">
                      {section.questions.length} سؤال
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400">
                  {section.total_points} علامة
                </Badge>
              </div>
            ))}
          </div>

          {/* ملاحظة */}
          <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>ستنتقل للفصل التالي تلقائياً بعد الإجابة على جميع أسئلة الفصل الحالي، أو يمكنك التنقل بحرية بين الأسئلة.</span>
          </div>
        </CardContent>
      </Card>

      {/* زر البدء */}
      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={onStart}
          disabled={isStarting}
          className="min-w-[200px] gap-2"
        >
          {isStarting ? (
            <>جاري التحميل...</>
          ) : (
            <>
              <PlayCircle className="h-5 w-5" />
              بدء الامتحان
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
