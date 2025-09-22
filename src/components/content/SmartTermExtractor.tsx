import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Brain, Target, Zap } from "lucide-react";
import { useGrade11Content } from "@/hooks/useGrade11Content";
import { useGrade11EducationalTerms } from "@/hooks/useGrade11EducationalTerms";
import { toast } from "sonner";

interface SmartTermExtractorProps {
  onExtractionComplete?: (extractedCount: number) => void;
}

export const SmartTermExtractor: React.FC<SmartTermExtractorProps> = ({ onExtractionComplete }) => {
  const { sections, loading: sectionsLoading } = useGrade11Content();
  const { extractTermsFromContent, extracting } = useGrade11EducationalTerms();
  
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [extractionProgress, setExtractionProgress] = useState<number>(0);
  const [lastExtractionResults, setLastExtractionResults] = useState<{
    success_count: number;
    total_processed: number;
  } | null>(null);

  const handleSmartExtraction = async () => {
    if (!selectedSection) {
      toast.error('يرجى اختيار قسم للاستخراج منه');
      return;
    }

    try {
      setExtractionProgress(0);
      
      // محاكاة تقدم الاستخراج
      const progressInterval = setInterval(() => {
        setExtractionProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const results = await extractTermsFromContent(undefined, selectedSection);
      
      clearInterval(progressInterval);
      setExtractionProgress(100);
      
      setLastExtractionResults(results);
      onExtractionComplete?.(results.success_count);

      setTimeout(() => setExtractionProgress(0), 2000);
    } catch (error) {
      console.error('Extraction failed:', error);
      setExtractionProgress(0);
    }
  };

  const getSectionDifficultyLevel = (sectionIndex: number): string => {
    if (sectionIndex <= 5) return 'أساسي';
    if (sectionIndex <= 15) return 'متوسط';
    return 'متقدم';
  };

  const getDifficultyColor = (sectionIndex: number): string => {
    if (sectionIndex <= 5) return 'bg-green-100 text-green-800 border-green-200';
    if (sectionIndex <= 15) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          استخراج ذكي للمصطلحات التقنية
        </CardTitle>
        <CardDescription>
          استخراج المصطلحات التقنية من المحتوى النصي الحقيقي للمنهج مع تصنيف تلقائي حسب الصعوبة والأهمية
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* اختيار القسم */}
        <div className="space-y-2">
          <label className="text-sm font-medium">اختر القسم للاستخراج منه:</label>
          <Select value={selectedSection} onValueChange={setSelectedSection}>
            <SelectTrigger>
              <SelectValue placeholder="اختر قسماً من المنهج..." />
            </SelectTrigger>
            <SelectContent>
              {sections.map((section) => (
                <SelectItem key={section.id} value={section.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>القسم {section.order_index}: {section.title}</span>
                    <Badge 
                      variant="outline" 
                      className={`ml-2 ${getDifficultyColor(section.order_index)}`}
                    >
                      {getSectionDifficultyLevel(section.order_index)}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* معلومات القسم المختار */}
        {selectedSection && (
          <div className="p-4 bg-muted/30 rounded-lg">
            {(() => {
              const section = sections.find(s => s.id === selectedSection);
              if (!section) return null;
              
              const topicsCount = section.topics?.length || 0;
              const lessonsCount = section.topics?.reduce((acc, topic) => acc + (topic.lessons?.length || 0), 0) || 0;
              
              return (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{section.title}</span>
                    <Badge className={getDifficultyColor(section.order_index)}>
                      {getSectionDifficultyLevel(section.order_index)}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground grid grid-cols-2 gap-4">
                    <span>المواضيع: {topicsCount}</span>
                    <span>الدروس: {lessonsCount}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </div>
              );
            })()}
          </div>
        )}

        {/* شريط التقدم */}
        {extracting && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">جاري الاستخراج...</span>
              <span className="text-sm text-muted-foreground">{extractionProgress}%</span>
            </div>
            <Progress value={extractionProgress} className="w-full" />
          </div>
        )}

        {/* نتائج آخر استخراج */}
        {lastExtractionResults && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">نتائج الاستخراج</span>
            </div>
            <div className="text-sm text-green-700">
              تم استخراج <strong>{lastExtractionResults.success_count}</strong> مصطلح تقني 
              من <strong>{lastExtractionResults.total_processed}</strong> درس
            </div>
          </div>
        )}

        {/* أزرار التحكم */}
        <div className="flex gap-2">
          <Button 
            onClick={handleSmartExtraction}
            disabled={!selectedSection || extracting || sectionsLoading}
            className="flex-1"
          >
            {extracting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                جاري الاستخراج...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                بدء الاستخراج الذكي
              </>
            )}
          </Button>
        </div>

        {/* معلومات إضافية */}
        <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-lg">
          <div className="font-medium mb-1">ملاحظات هامة:</div>
          <ul className="space-y-1">
            <li>• يتم استخراج المصطلحات التقنية الفعلية من النصوص</li>
            <li>• الصعوبة تُحدد حسب ترتيب القسم في المنهج</li>
            <li>• المصطلحات تحتاج موافقة يدوية قبل استخدامها في الألعاب</li>
            <li>• يتم تجنب التكرار والكلمات الشائعة تلقائياً</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};