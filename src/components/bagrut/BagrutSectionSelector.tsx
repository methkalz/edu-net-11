// مكون اختيار أقسام البجروت (للأقسام الاختيارية) مع عرض إرشادات الامتحان
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, 
  FileText, 
  Clock, 
  Award, 
  Layers,
  AlertCircle,
  PlayCircle,
  BookOpen,
  AlertTriangle,
  Info
} from 'lucide-react';
import type { ParsedSection } from '@/lib/bagrut/buildBagrutPreview';

interface BagrutSectionSelectorProps {
  sections: ParsedSection[];
  examTitle: string;
  examDuration: number;
  totalPoints: number;
  instructions: string | null;
  onStart: (selectedSectionIds: string[]) => void;
  isStarting: boolean;
}

export default function BagrutSectionSelector({
  sections,
  examTitle,
  examDuration,
  totalPoints,
  instructions,
  onStart,
  isStarting,
}: BagrutSectionSelectorProps) {
  // تحديد الأقسام الإلزامية والاختيارية
  const mandatorySections = useMemo(() => 
    sections.filter(s => s.section_type === 'mandatory'),
    [sections]
  );
  
  const electiveSections = useMemo(() => 
    sections.filter(s => s.section_type === 'elective'),
    [sections]
  );

  // تجميع الأقسام الاختيارية حسب التخصص
  const electivesBySpecialization = useMemo(() => {
    const grouped: Record<string, ParsedSection[]> = {};
    electiveSections.forEach(section => {
      const key = section.specialization || 'general';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(section);
    });
    return grouped;
  }, [electiveSections]);

  // الأقسام المختارة (الإلزامية دائماً مختارة)
  const [selectedElectives, setSelectedElectives] = useState<string[]>([]);

  // عدد الأقسام الاختيارية المطلوبة
  const requiredElectives = electiveSections.length > 0 ? 1 : 0; // عادةً قسم واحد

  const toggleSection = (sectionId: string) => {
    setSelectedElectives(prev => {
      if (prev.includes(sectionId)) {
        return prev.filter(id => id !== sectionId);
      }
      // إذا كان التخصص مختلف، نزيل القسم السابق من نفس المجموعة
      const section = electiveSections.find(s => s.section_db_id === sectionId);
      if (section?.specialization) {
        const sameSPec = electiveSections
          .filter(s => s.specialization === section.specialization)
          .map(s => s.section_db_id!);
        return [...prev.filter(id => !sameSPec.includes(id)), sectionId];
      }
      return [...prev, sectionId];
    });
  };

  const handleStart = () => {
    const mandatoryIds = mandatorySections.map(s => s.section_db_id!).filter(Boolean);
    const allSelected = [...mandatoryIds, ...selectedElectives];
    onStart(allSelected);
  };

  const canStart = requiredElectives === 0 || selectedElectives.length >= requiredElectives;

  const totalQuestionsCount = useMemo(() => {
    const mandatoryCount = mandatorySections.reduce((acc, s) => acc + s.questions.length, 0);
    const selectedElectiveCount = electiveSections
      .filter(s => selectedElectives.includes(s.section_db_id!))
      .reduce((acc, s) => acc + s.questions.length, 0);
    return mandatoryCount + selectedElectiveCount;
  }, [mandatorySections, electiveSections, selectedElectives]);

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
      {/* إرشادات وتعليمات الامتحان - بارزة في الأعلى */}
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
            اختر الأقسام التي تريد حلها ثم ابدأ الامتحان
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
                <p className="text-sm text-muted-foreground">الأقسام</p>
                <p className="font-semibold">{sections.length} قسم</p>
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

      {/* الأقسام الإلزامية */}
      {mandatorySections.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              الأقسام الإلزامية
            </CardTitle>
            <CardDescription>
              هذه الأقسام مطلوبة ولا يمكن تخطيها
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mandatorySections.map((section, index) => (
                <div
                  key={section.section_db_id || index}
                  className="flex items-center justify-between p-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">{section.section_title}</p>
                      <p className="text-sm text-muted-foreground">
                        {section.questions.length} سؤال
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{section.total_points} علامة</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* الأقسام الاختيارية */}
      {electiveSections.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-500" />
              الأقسام الاختيارية
            </CardTitle>
            <CardDescription>
              اختر قسماً واحداً على الأقل من الأقسام التالية
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-6">
                {Object.entries(electivesBySpecialization).map(([spec, specSections]) => (
                  <div key={spec}>
                    {spec !== 'general' && (
                      <h4 className="font-medium mb-3 text-muted-foreground">
                        تخصص: {specSections[0].specialization_label || spec}
                      </h4>
                    )}
                    <div className="space-y-3">
                      {specSections.map((section, index) => {
                        const isSelected = selectedElectives.includes(section.section_db_id!);
                        return (
                          <label
                            key={section.section_db_id || index}
                            className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50 hover:bg-accent/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleSection(section.section_db_id!)}
                              />
                              <div>
                                <p className="font-medium">{section.section_title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {section.questions.length} سؤال
                                  {section.instructions && (
                                    <span className="mx-2">•</span>
                                  )}
                                  {section.instructions && (
                                    <span className="text-xs">{section.instructions.substring(0, 50)}...</span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <Badge variant={isSelected ? 'default' : 'secondary'}>
                              {section.total_points} علامة
                            </Badge>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {!canStart && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  يجب اختيار قسم واحد على الأقل من الأقسام الاختيارية
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* زر البدء */}
      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={handleStart}
          disabled={!canStart || isStarting}
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
