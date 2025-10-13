import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Sparkles, BookOpen, FileEdit, AlertCircle } from 'lucide-react';
import { MultiSelect } from '@/components/ui/multi-select';

export interface SourceDistribution {
  type: 'smart' | 'question_bank' | 'my_questions';
  enabled: boolean;
  percentage: number;
  count: number;
  label: string;
  description: string;
  color: string;
  icon: React.ReactNode;
}

interface InteractiveSourceDistributorProps {
  totalQuestions: number;
  sources: SourceDistribution[];
  onSourcesChange: (sources: SourceDistribution[]) => void;
  availableSections?: Array<{ value: string; label: string }>;
  selectedSections?: string[];
  onSectionsChange?: (sections: string[]) => void;
  availableCategories?: Array<{ value: string; label: string }>;
  selectedCategories?: string[];
  onCategoriesChange?: (categories: string[]) => void;
}

export const InteractiveSourceDistributor: React.FC<InteractiveSourceDistributorProps> = ({
  totalQuestions,
  sources: initialSources,
  onSourcesChange,
  availableSections = [],
  selectedSections = [],
  onSectionsChange,
  availableCategories = [],
  selectedCategories = [],
  onCategoriesChange,
}) => {
  const [sources, setSources] = useState<SourceDistribution[]>(initialSources);

  // تحديث الحسابات عند تغيير عدد الأسئلة الكلي
  useEffect(() => {
    const enabledSources = sources.filter(s => s.enabled);
    if (enabledSources.length === 0) return;

    const updatedSources = sources.map(source => ({
      ...source,
      count: source.enabled ? Math.round((source.percentage / 100) * totalQuestions) : 0,
    }));

    setSources(updatedSources);
    onSourcesChange(updatedSources);
  }, [totalQuestions]);

  // تفعيل/تعطيل مصدر
  const toggleSource = (type: string, enabled: boolean) => {
    const updatedSources = sources.map(s => {
      if (s.type === type) {
        return { ...s, enabled };
      }
      return s;
    });

    // إعادة حساب النسب المئوية
    const enabledCount = updatedSources.filter(s => s.enabled).length;
    if (enabledCount > 0) {
      const equalPercentage = 100 / enabledCount;
      const redistributed = updatedSources.map(s => ({
        ...s,
        percentage: s.enabled ? equalPercentage : 0,
        count: s.enabled ? Math.round((equalPercentage / 100) * totalQuestions) : 0,
      }));

      setSources(redistributed);
      onSourcesChange(redistributed);
    } else {
      setSources(updatedSources);
      onSourcesChange(updatedSources);
    }
  };

  // تحديث النسبة المئوية لمصدر معين
  const handleSliderChange = (type: string, newPercentage: number) => {
    const enabledSources = sources.filter(s => s.enabled && s.type !== type);
    if (enabledSources.length === 0) return;

    const remaining = 100 - newPercentage;
    const totalOtherPercentage = enabledSources.reduce((sum, s) => sum + s.percentage, 0);

    const updatedSources = sources.map(source => {
      if (source.type === type) {
        return {
          ...source,
          percentage: newPercentage,
          count: Math.round((newPercentage / 100) * totalQuestions),
        };
      } else if (source.enabled) {
        // إعادة توزيع النسبة المتبقية بناءً على النسب الحالية
        const ratio = totalOtherPercentage > 0 ? source.percentage / totalOtherPercentage : 1 / enabledSources.length;
        const newPercent = remaining * ratio;
        return {
          ...source,
          percentage: newPercent,
          count: Math.round((newPercent / 100) * totalQuestions),
        };
      }
      return source;
    });

    // تصحيح الأخطاء في التقريب
    const totalCount = updatedSources.filter(s => s.enabled).reduce((sum, s) => sum + s.count, 0);
    if (totalCount !== totalQuestions && updatedSources.filter(s => s.enabled).length > 0) {
      const diff = totalQuestions - totalCount;
      const firstEnabled = updatedSources.find(s => s.enabled);
      if (firstEnabled) {
        firstEnabled.count += diff;
      }
    }

    setSources(updatedSources);
    onSourcesChange(updatedSources);
  };

  const enabledSources = sources.filter(s => s.enabled);
  const totalDistributed = enabledSources.reduce((sum, s) => sum + s.count, 0);
  const isComplete = totalDistributed === totalQuestions;

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">📊 توزيع الأسئلة من المصادر</h3>
        <div className={`text-sm font-medium px-3 py-1 rounded-full ${
          isComplete ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
        }`}>
          {totalDistributed} / {totalQuestions} سؤال
        </div>
      </div>

      {/* المصادر */}
      <div className="space-y-4">
        {sources.map((source) => (
          <Card key={source.type} className={`transition-all ${source.enabled ? 'border-primary/50 bg-primary/5' : 'border-border'}`}>
            <div className="p-4 space-y-4">
              {/* تفعيل المصدر */}
              <div className="flex items-start gap-3">
                <Checkbox
                  id={`source-${source.type}`}
                  checked={source.enabled}
                  onCheckedChange={(checked) => toggleSource(source.type, checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`text-${source.color}`}>{source.icon}</div>
                    <Label htmlFor={`source-${source.type}`} className="text-base font-medium cursor-pointer">
                      {source.label}
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">{source.description}</p>
                </div>
              </div>

              {/* Slider للتوزيع */}
              {source.enabled && enabledSources.length > 1 && (
                <div className="space-y-2 pr-8">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">نسبة التوزيع</span>
                    <span className="font-semibold">
                      {source.percentage.toFixed(0)}% ({source.count} سؤال)
                    </span>
                  </div>
                  <Slider
                    value={[source.percentage]}
                    onValueChange={([value]) => handleSliderChange(source.type, value)}
                    min={0}
                    max={100}
                    step={1}
                    className="cursor-pointer"
                  />
                  <Progress value={source.percentage} className="h-2" />
                </div>
              )}

              {/* عرض العدد فقط إذا كان هناك مصدر واحد مفعل */}
              {source.enabled && enabledSources.length === 1 && (
                <div className="text-center py-2 bg-primary/10 rounded-lg">
                  <span className="text-lg font-bold text-primary">
                    {source.count} سؤال (100%)
                  </span>
                </div>
              )}

              {/* MultiSelect للأقسام */}
              {source.enabled && source.type === 'question_bank' && availableSections.length > 0 && (
                <div className="space-y-2 border-t pt-3">
                  <Label className="text-sm">اختر الأقسام:</Label>
                  <MultiSelect
                    options={availableSections}
                    value={selectedSections}
                    onChange={onSectionsChange || (() => {})}
                    placeholder="اختر الأقسام..."
                    emptyText="لا توجد أقسام متاحة"
                  />
                </div>
              )}

              {/* MultiSelect للتصنيفات */}
              {source.enabled && source.type === 'my_questions' && availableCategories.length > 0 && (
                <div className="space-y-2 border-t pt-3">
                  <Label className="text-sm">اختر التصنيفات:</Label>
                  <MultiSelect
                    options={availableCategories}
                    value={selectedCategories}
                    onChange={onCategoriesChange || (() => {})}
                    placeholder="اختر التصنيفات..."
                    emptyText="لا توجد تصنيفات متاحة"
                  />
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* تحذير إذا لم يكتمل التوزيع */}
      {!isComplete && enabledSources.length > 0 && (
        <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            <p className="font-medium">التوزيع غير مكتمل</p>
            <p>الموزع: {totalDistributed} من {totalQuestions} سؤال</p>
          </div>
        </div>
      )}

      {/* تحذير إذا لم يتم اختيار أي مصدر */}
      {enabledSources.length === 0 && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium">اختر مصدراً واحداً على الأقل</p>
          </div>
        </div>
      )}
    </div>
  );
};

// دالة مساعدة لإنشاء المصادر الافتراضية
export const createDefaultSources = (totalQuestions: number): SourceDistribution[] => [
  {
    type: 'smart',
    enabled: true,
    percentage: 100,
    count: totalQuestions,
    label: 'اختيار ذكي تلقائي',
    description: 'يختار النظام الأسئلة بشكل متوازن من جميع المصادر',
    color: 'primary',
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    type: 'question_bank',
    enabled: false,
    percentage: 0,
    count: 0,
    label: 'من بنك الأسئلة',
    description: 'اختر أقساماً محددة من بنك الأسئلة',
    color: 'blue-600',
    icon: <BookOpen className="w-5 h-5" />,
  },
  {
    type: 'my_questions',
    enabled: false,
    percentage: 0,
    count: 0,
    label: 'من أسئلتي الخاصة',
    description: 'استخدم الأسئلة التي أنشأتها',
    color: 'green-600',
    icon: <FileEdit className="w-5 h-5" />,
  },
];
