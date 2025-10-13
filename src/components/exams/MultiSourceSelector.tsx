import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { MultiSelect } from "@/components/ui/multi-select";

interface MultiSourceSelectorProps {
  selectedSources: string[];
  sourceDistribution: Record<string, number>;
  onSourcesChange: (sources: string[]) => void;
  onDistributionChange: (distribution: Record<string, number>) => void;
  
  // للأقسام المحددة
  availableSections?: Array<{ value: string; label: string }>;
  selectedSections?: string[];
  onSectionsChange?: (sections: string[]) => void;
  
  // لتصنيفات المعلم
  availableCategories?: Array<{ value: string; label: string }>;
  selectedCategories?: string[];
  onCategoriesChange?: (categories: string[]) => void;
  
  totalQuestions: number;
}

const sourceOptions = [
  { value: 'random', label: 'عشوائي من جميع الأقسام', icon: '🎲' },
  { value: 'specific_sections', label: 'أقسام محددة من بنك الأسئلة', icon: '📚' },
  { value: 'my_questions', label: 'أسئلتي الخاصة', icon: '✍️' },
];

export function MultiSourceSelector({
  selectedSources,
  sourceDistribution,
  onSourcesChange,
  onDistributionChange,
  availableSections,
  selectedSections = [],
  onSectionsChange,
  availableCategories,
  selectedCategories = [],
  onCategoriesChange,
  totalQuestions,
}: MultiSourceSelectorProps) {
  const [tempDistribution, setTempDistribution] = useState<Record<string, number>>(sourceDistribution);

  const handleSourceToggle = (sourceValue: string, checked: boolean) => {
    let newSources: string[];
    
    if (checked) {
      newSources = [...selectedSources, sourceValue];
      // إضافة توزيع افتراضي
      const remainingQuestions = totalQuestions - Object.values(tempDistribution).reduce((a, b) => a + b, 0);
      const defaultCount = Math.max(1, Math.floor(remainingQuestions / (newSources.length - selectedSources.length)));
      setTempDistribution({
        ...tempDistribution,
        [sourceValue]: defaultCount,
      });
      onDistributionChange({
        ...tempDistribution,
        [sourceValue]: defaultCount,
      });
    } else {
      newSources = selectedSources.filter(s => s !== sourceValue);
      const newDist = { ...tempDistribution };
      delete newDist[sourceValue];
      setTempDistribution(newDist);
      onDistributionChange(newDist);
    }
    
    onSourcesChange(newSources);
  };

  const handleDistributionChange = (source: string, value: number) => {
    const newDist = {
      ...tempDistribution,
      [source]: value,
    };
    setTempDistribution(newDist);
    onDistributionChange(newDist);
  };

  const getTotalDistributed = () => {
    return Object.values(tempDistribution).reduce((sum, val) => sum + val, 0);
  };

  const getSourceLabel = (sourceValue: string) => {
    return sourceOptions.find(s => s.value === sourceValue)?.label || sourceValue;
  };

  const getSourceIcon = (sourceValue: string) => {
    return sourceOptions.find(s => s.value === sourceValue)?.icon || '📝';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-3">اختر مصادر الأسئلة</h3>
        <div className="space-y-3">
          {sourceOptions.map((source) => (
            <div key={source.value} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <Checkbox
                id={source.value}
                checked={selectedSources.includes(source.value)}
                onCheckedChange={(checked) => handleSourceToggle(source.value, checked as boolean)}
              />
              <div className="flex-1">
                <Label
                  htmlFor={source.value}
                  className="flex items-center gap-2 font-normal cursor-pointer"
                >
                  <span className="text-lg">{source.icon}</span>
                  {source.label}
                </Label>
                
                {selectedSources.includes(source.value) && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`${source.value}-count`} className="text-xs text-muted-foreground whitespace-nowrap">
                        عدد الأسئلة:
                      </Label>
                      <Input
                        id={`${source.value}-count`}
                        type="number"
                        min={0}
                        max={totalQuestions}
                        value={tempDistribution[source.value] || 0}
                        onChange={(e) => handleDistributionChange(source.value, parseInt(e.target.value) || 0)}
                        className="h-8 w-20"
                      />
                    </div>

                    {/* عرض التصنيفات المختارة */}
                    {source.value === 'specific_sections' && availableSections && onSectionsChange && (
                      <div className="mt-2">
                        <MultiSelect
                          options={availableSections}
                          value={selectedSections}
                          onChange={onSectionsChange}
                          placeholder="اختر الأقسام"
                        />
                      </div>
                    )}

                    {source.value === 'my_questions' && availableCategories && onCategoriesChange && (
                      <div className="mt-2">
                        <MultiSelect
                          options={availableCategories}
                          value={selectedCategories}
                          onChange={onCategoriesChange}
                          placeholder="اختر التصنيفات"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* عرض الملخص */}
      {selectedSources.length > 0 && (
        <div className="space-y-3 p-4 rounded-lg border bg-muted/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">توزيع الأسئلة:</span>
            <span className={`text-sm font-medium ${getTotalDistributed() === totalQuestions ? 'text-green-600' : 'text-destructive'}`}>
              {getTotalDistributed()} / {totalQuestions}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedSources.map((source) => {
              const count = tempDistribution[source] || 0;
              const sections = source === 'specific_sections' ? selectedSections : 
                              source === 'my_questions' ? selectedCategories : [];
              
              return (
                <Badge key={source} variant="secondary" className="text-xs gap-1.5 py-1.5 px-3">
                  <span>{getSourceIcon(source)}</span>
                  <span className="font-medium">{count}</span>
                  <span className="text-muted-foreground">من</span>
                  <span>{getSourceLabel(source)}</span>
                  {sections.length > 0 && (
                    <span className="text-muted-foreground">({sections.length})</span>
                  )}
                </Badge>
              );
            })}
          </div>

          {getTotalDistributed() !== totalQuestions && (
            <p className="text-xs text-destructive">
              ⚠️ مجموع الأسئلة الموزعة لا يطابق العدد الإجمالي المطلوب
            </p>
          )}
        </div>
      )}

      {/* عرض Tags للتصنيفات المختارة */}
      {(selectedSections.length > 0 || selectedCategories.length > 0) && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">التصنيفات المختارة:</h4>
          <div className="flex flex-wrap gap-2">
            {selectedSections.map((sectionId) => {
              const section = availableSections?.find(s => s.value === sectionId);
              return (
                <Badge key={sectionId} variant="outline" className="gap-1.5">
                  #بنك_{section?.label}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => onSectionsChange?.(selectedSections.filter(s => s !== sectionId))}
                  />
                </Badge>
              );
            })}
            {selectedCategories.map((categoryId) => {
              const category = availableCategories?.find(c => c.value === categoryId);
              return (
                <Badge key={categoryId} variant="secondary" className="gap-1.5">
                  #أسئلتي_{category?.label}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => onCategoriesChange?.(selectedCategories.filter(c => c !== categoryId))}
                  />
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
