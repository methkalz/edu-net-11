import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { X, Shuffle, BookOpen, FileEdit } from "lucide-react";
import { MultiSelect } from "@/components/ui/multi-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

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
  { 
    value: 'random', 
    label: 'عشوائي', 
    description: 'من جميع الأقسام',
    Icon: Shuffle,
    color: 'bg-blue-500/10 text-blue-600 border-blue-200'
  },
  { 
    value: 'specific_sections', 
    label: 'أقسام محددة', 
    description: 'من بنك الأسئلة',
    Icon: BookOpen,
    color: 'bg-purple-500/10 text-purple-600 border-purple-200'
  },
  { 
    value: 'my_questions', 
    label: 'أسئلتي', 
    description: 'أسئلتي الخاصة',
    Icon: FileEdit,
    color: 'bg-green-500/10 text-green-600 border-green-200'
  },
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
  const [activeTab, setActiveTab] = useState<string>(selectedSources[0] || 'random');
  const [tempDistribution, setTempDistribution] = useState<Record<string, number>>(sourceDistribution);

  // إضافة المصدر النشط تلقائياً إذا لم يكن موجوداً
  useEffect(() => {
    if (!selectedSources.includes(activeTab)) {
      const newSources = [...selectedSources, activeTab];
      onSourcesChange(newSources);
      
      // تعيين عدد افتراضي إذا لم يكن موجوداً
      if (!tempDistribution[activeTab]) {
        const newDist = { ...tempDistribution, [activeTab]: totalQuestions };
        setTempDistribution(newDist);
        onDistributionChange(newDist);
      }
    }
  }, [activeTab]);

  const handleSliderChange = (source: string, values: number[]) => {
    const value = values[0];
    const newDist = { ...tempDistribution, [source]: value };
    setTempDistribution(newDist);
    onDistributionChange(newDist);
  };

  const handleRemoveSource = (source: string) => {
    const newSources = selectedSources.filter(s => s !== source);
    const newDist = { ...tempDistribution };
    delete newDist[source];
    
    onSourcesChange(newSources);
    setTempDistribution(newDist);
    onDistributionChange(newDist);
    
    // التبديل إلى التاب الأول المتاح
    if (activeTab === source && newSources.length > 0) {
      setActiveTab(newSources[0]);
    }
  };

  const getTotalDistributed = () => {
    return Object.values(tempDistribution).reduce((sum, val) => sum + val, 0);
  };

  const getProgress = () => {
    return (getTotalDistributed() / totalQuestions) * 100;
  };

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">إجمالي التوزيع</span>
          <span className={`font-bold ${getProgress() === 100 ? 'text-green-600' : getProgress() > 100 ? 'text-destructive' : 'text-orange-500'}`}>
            {getTotalDistributed()} / {totalQuestions}
          </span>
        </div>
        <Progress value={getProgress()} className="h-2" />
      </div>

      {/* Tabs للمصادر */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1">
          {sourceOptions.map((source) => {
            const Icon = source.Icon;
            const isActive = selectedSources.includes(source.value);
            const count = tempDistribution[source.value] || 0;
            
            return (
              <TabsTrigger
                key={source.value}
                value={source.value}
                className="flex flex-col gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative"
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs font-medium">{source.label}</span>
                {isActive && count > 0 && (
                  <Badge variant="secondary" className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs">
                    {count}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {sourceOptions.map((source) => {
          const Icon = source.Icon;
          const count = tempDistribution[source.value] || 0;
          const isIncluded = selectedSources.includes(source.value);

          return (
            <TabsContent key={source.value} value={source.value} className="space-y-4 mt-4">
              <div className={`p-4 rounded-lg border-2 ${source.color}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    <div>
                      <h3 className="font-medium">{source.label}</h3>
                      <p className="text-xs text-muted-foreground">{source.description}</p>
                    </div>
                  </div>
                  {isIncluded && selectedSources.length > 1 && (
                    <button
                      onClick={() => handleRemoveSource(source.value)}
                      className="text-destructive hover:bg-destructive/10 p-1 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Slider للتوزيع */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <Label>عدد الأسئلة من هذا المصدر</Label>
                    <span className="font-bold text-lg">{count}</span>
                  </div>
                  <Slider
                    value={[count]}
                    onValueChange={(values) => handleSliderChange(source.value, values)}
                    max={totalQuestions}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0</span>
                    <span>{totalQuestions}</span>
                  </div>
                </div>

                {/* التصنيفات حسب المصدر */}
                {source.value === 'specific_sections' && availableSections && onSectionsChange && (
                  <div className="mt-4 space-y-2">
                    <Label className="text-sm">اختر الأقسام المحددة</Label>
                    <MultiSelect
                      options={availableSections}
                      value={selectedSections}
                      onChange={onSectionsChange}
                      placeholder="جميع الأقسام"
                    />
                    {selectedSections.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {selectedSections.map((sectionId) => {
                          const section = availableSections?.find(s => s.value === sectionId);
                          return (
                            <Badge key={sectionId} variant="outline" className="text-xs gap-1">
                              {section?.label}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => onSectionsChange?.(selectedSections.filter(s => s !== sectionId))}
                              />
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {source.value === 'my_questions' && availableCategories && onCategoriesChange && (
                  <div className="mt-4 space-y-2">
                    <Label className="text-sm">اختر التصنيفات</Label>
                    <MultiSelect
                      options={availableCategories}
                      value={selectedCategories}
                      onChange={onCategoriesChange}
                      placeholder="جميع التصنيفات"
                    />
                    {selectedCategories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {selectedCategories.map((categoryId) => {
                          const category = availableCategories?.find(c => c.value === categoryId);
                          return (
                            <Badge key={categoryId} variant="secondary" className="text-xs gap-1">
                              {category?.label}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => onCategoriesChange?.(selectedCategories.filter(c => c !== categoryId))}
                              />
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* ملخص المصادر المفعّلة */}
      {selectedSources.length > 1 && (
        <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-muted/50 border">
          <span className="text-xs text-muted-foreground w-full mb-1">المصادر النشطة:</span>
          {selectedSources.map((source) => {
            const sourceOption = sourceOptions.find(s => s.value === source);
            const Icon = sourceOption?.Icon || FileEdit;
            const count = tempDistribution[source] || 0;
            
            return (
              <Badge key={source} variant="outline" className="gap-1.5">
                <Icon className="h-3 w-3" />
                <span className="font-medium">{count}</span>
                <span className="text-muted-foreground text-xs">{sourceOption?.label}</span>
              </Badge>
            );
          })}
        </div>
      )}

      {/* تحذير إذا لم يكن التوزيع صحيحاً */}
      {getProgress() !== 100 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-200 text-orange-800">
          <span className="text-sm">
            {getProgress() > 100 
              ? '⚠️ مجموع الأسئلة أكبر من المطلوب' 
              : '⚠️ مجموع الأسئلة أقل من المطلوب'}
          </span>
        </div>
      )}
    </div>
  );
}
