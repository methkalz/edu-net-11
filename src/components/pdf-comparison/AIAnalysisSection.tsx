import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Tag, AlertTriangle, Lightbulb, CheckCircle } from 'lucide-react';
import type { ComparisonMatch } from '@/hooks/usePDFComparison';

interface AIAnalysisSectionProps {
  match: ComparisonMatch;
}

interface Analysis {
  type: string;
  typeDescription: string;
  riskLevel: number;
  recommendations: string[];
}

function generateAnalysis(match: ComparisonMatch): Analysis {
  const score = match.similarity_score;
  const segments = match.matched_segments || [];
  
  // تحليل نوع التشابه
  let type = 'تشابه معنوي';
  let typeDescription = 'النصوص متشابهة في المعنى مع اختلاف في الصياغة';
  
  if (score >= 0.95) {
    type = 'نسخ حرفي';
    typeDescription = 'النصوص متطابقة تماماً أو شبه متطابقة';
  } else if (score >= 0.80) {
    type = 'إعادة صياغة بسيطة';
    typeDescription = 'النصوص متشابهة مع تغييرات طفيفة في الكلمات';
  } else if (score >= 0.60) {
    type = 'إعادة صياغة متوسطة';
    typeDescription = 'هناك تشابه ملحوظ مع بعض التغييرات في التعبير';
  }
  
  // حساب مستوى الخطورة
  const riskLevel = Math.min(100, score * 120);
  
  // التوصيات
  const recommendations: string[] = [];
  if (score >= 0.70) {
    recommendations.push('يُنصح بمراجعة دقيقة للنصوص المتشابهة');
    recommendations.push('التحقق من المصادر والاستشهادات');
    recommendations.push('مقابلة الطالب لمناقشة العمل');
    if (segments.length > 10) {
      recommendations.push('عدد كبير من الجمل المتشابهة يتطلب تحقيقاً شاملاً');
    }
  } else if (score >= 0.40) {
    recommendations.push('مراجعة الأقسام المتشابهة');
    recommendations.push('التأكد من استخدام الاقتباسات بشكل صحيح');
    recommendations.push('التوجيه نحو إعادة الصياغة الأفضل');
  } else {
    recommendations.push('التشابه ضمن الحدود المقبولة');
    recommendations.push('مراجعة عامة موصى بها');
  }
  
  return { type, typeDescription, riskLevel, recommendations };
}

export const AIAnalysisSection = ({ match }: AIAnalysisSectionProps) => {
  const analysis = generateAnalysis(match);
  
  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20 dark:border-purple-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
          <Brain className="h-5 w-5" />
          التحليل الأولي
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* نوع التشابه */}
        <div>
          <h5 className="font-semibold text-sm mb-2 flex items-center gap-2 text-foreground">
            <Tag className="h-4 w-4" />
            نوع التشابه
          </h5>
          <Badge variant="outline" className="text-sm bg-background/50">
            {analysis.type}
          </Badge>
          <p className="text-sm text-muted-foreground mt-2">
            {analysis.typeDescription}
          </p>
        </div>

        {/* مستوى الخطورة */}
        <div>
          <h5 className="font-semibold text-sm mb-2 flex items-center gap-2 text-foreground">
            <AlertTriangle className="h-4 w-4" />
            مستوى الخطورة
          </h5>
          <div className="flex items-center gap-2">
            <Progress value={analysis.riskLevel} className="flex-1" />
            <span className="text-sm font-bold text-foreground">
              {analysis.riskLevel.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* التوصيات */}
        <div>
          <h5 className="font-semibold text-sm mb-2 flex items-center gap-2 text-foreground">
            <Lightbulb className="h-4 w-4" />
            التوصيات
          </h5>
          <ul className="space-y-2">
            {analysis.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
