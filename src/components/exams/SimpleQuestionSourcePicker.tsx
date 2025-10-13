import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { Target, BookOpen, Edit3 } from "lucide-react";

interface SimpleQuestionSourcePickerProps {
  mode: "smart" | "question_bank" | "my_questions";
  onModeChange: (mode: "smart" | "question_bank" | "my_questions") => void;
  
  // للأقسام من بنك الأسئلة
  availableSections?: Array<{ value: string; label: string }>;
  selectedSections?: string[];
  onSectionsChange?: (sections: string[]) => void;
  
  // للتصنيفات من أسئلة المعلم
  availableCategories?: Array<{ value: string; label: string }>;
  selectedCategories?: string[];
  onCategoriesChange?: (categories: string[]) => void;
}

export const SimpleQuestionSourcePicker = ({
  mode,
  onModeChange,
  availableSections = [],
  selectedSections = [],
  onSectionsChange,
  availableCategories = [],
  selectedCategories = [],
  onCategoriesChange,
}: SimpleQuestionSourcePickerProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-base font-medium">كيف تريد اختيار الأسئلة؟</Label>
        <RadioGroup value={mode} onValueChange={onModeChange} className="space-y-3">
          {/* الوضع التلقائي الذكي */}
          <div className="relative">
            <div className="flex items-start space-x-3 space-x-reverse border rounded-lg p-4 hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="smart" id="smart" className="mt-1" />
              <Label
                htmlFor="smart"
                className="flex-1 cursor-pointer space-y-2"
              >
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <span className="font-medium">تلقائي ذكي (موصى به)</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">🎯 الأفضل</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  سيتم اختيار الأسئلة تلقائياً من جميع المصادر المتاحة بشكل متوازن ومتنوع
                  (40% من بنك الأسئلة، 30% من أسئلتك الخاصة، 30% من أقسام محددة)
                </p>
              </Label>
            </div>
          </div>

          {/* من بنك الأسئلة فقط */}
          <div className="relative">
            <div className="flex items-start space-x-3 space-x-reverse border rounded-lg p-4 hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="question_bank" id="question_bank" className="mt-1" />
              <Label
                htmlFor="question_bank"
                className="flex-1 cursor-pointer space-y-2"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">من بنك الأسئلة فقط</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  اختيار أسئلة من أقسام محددة في بنك الأسئلة
                </p>
              </Label>
            </div>
            
            {mode === "question_bank" && (
              <div className="mr-9 mt-3 pr-4 border-r-2 border-primary/20">
                <MultiSelect
                  options={availableSections}
                  value={selectedSections}
                  onChange={onSectionsChange || (() => {})}
                  placeholder="اختر الأقسام..."
                  emptyText="لا توجد أقسام متاحة"
                />
              </div>
            )}
          </div>

          {/* من أسئلتي الخاصة فقط */}
          <div className="relative">
            <div className="flex items-start space-x-3 space-x-reverse border rounded-lg p-4 hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="my_questions" id="my_questions" className="mt-1" />
              <Label
                htmlFor="my_questions"
                className="flex-1 cursor-pointer space-y-2"
              >
                <div className="flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-green-600" />
                  <span className="font-medium">من أسئلتي الخاصة فقط</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  اختيار أسئلة من تصنيفاتك الخاصة التي أنشأتها
                </p>
              </Label>
            </div>
            
            {mode === "my_questions" && (
              <div className="mr-9 mt-3 pr-4 border-r-2 border-primary/20">
                {availableCategories.length === 0 ? (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm">
                    <p className="text-yellow-800 dark:text-yellow-200">
                      لم تقم بإنشاء أي تصنيفات بعد. يمكنك إنشاء أسئلة جديدة من خلال زر "سؤال جديد"
                    </p>
                  </div>
                ) : (
                  <MultiSelect
                    options={availableCategories}
                    value={selectedCategories}
                    onChange={onCategoriesChange || (() => {})}
                    placeholder="اختر التصنيفات..."
                    emptyText="لا توجد تصنيفات متاحة"
                  />
                )}
              </div>
            )}
          </div>
        </RadioGroup>
      </div>
    </div>
  );
};
