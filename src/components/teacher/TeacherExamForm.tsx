import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertCircle, ChevronDown, Settings } from 'lucide-react';
import { useTeacherExams } from '@/hooks/useTeacherExams';
import { useExamSystem } from '@/hooks/useExamSystem';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MultiSelect } from '@/components/ui/multi-select';

interface TeacherExamFormProps {
  exam?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const TeacherExamForm: React.FC<TeacherExamFormProps> = ({
  exam,
  onClose,
  onSuccess
}) => {
  const { createExam, updateExam } = useTeacherExams();
  const { sections, fetchSections } = useExamSystem();
  const { userProfile } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // حالات الصفوف المتعددة
  const [selectedGrades, setSelectedGrades] = useState<string[]>(
    exam?.grade_levels || [exam?.grade_level] || []
  );
  
  // نوع مصدر الأسئلة
  const [questionSourceType, setQuestionSourceType] = useState<'random' | 'sections'>(
    exam?.question_sources?.type || 'random'
  );
  
  // الأقسام المختارة
  const [selectedSections, setSelectedSections] = useState<string[]>(
    exam?.question_sources?.sections || []
  );
  
  // توزيع الصعوبة
  const [difficultyDistribution, setDifficultyDistribution] = useState({
    easy: exam?.difficulty_distribution?.easy || 30,
    medium: exam?.difficulty_distribution?.medium || 50,
    hard: exam?.difficulty_distribution?.hard || 20
  });
  
  const [formData, setFormData] = useState({
    title: exam?.title || '',
    description: exam?.description || '',
    target_class_ids: exam?.target_class_ids || [],
    total_questions: exam?.total_questions || 10,
    duration_minutes: exam?.duration_minutes || 60,
    pass_percentage: exam?.pass_percentage || 60,
    max_attempts: exam?.max_attempts || 1,
    randomize_questions: exam?.randomize_questions ?? true,
    randomize_answers: exam?.randomize_answers ?? true,
    show_results_immediately: exam?.show_results_immediately ?? false,
    show_correct_answers: exam?.show_correct_answers ?? false,
  });

  useEffect(() => {
    fetchClasses();
    fetchSections();
  }, []);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          id,
          class_name_id,
          class_names (name),
          grade_levels (code, label)
        `)
        .eq('school_id', userProfile?.school_id)
        .eq('status', 'active');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleGradeToggle = (grade: string, checked: boolean) => {
    if (checked) {
      setSelectedGrades([...selectedGrades, grade]);
    } else {
      setSelectedGrades(selectedGrades.filter(g => g !== grade));
    }
  };

  const handleSectionToggle = (sectionId: string, checked: boolean) => {
    if (checked) {
      setSelectedSections([...selectedSections, sectionId]);
    } else {
      setSelectedSections(selectedSections.filter(id => id !== sectionId));
    }
  };

  const handleDifficultyChange = (level: 'easy' | 'medium' | 'hard', value: number) => {
    setDifficultyDistribution({
      ...difficultyDistribution,
      [level]: value
    });
  };

  const totalPercentage = difficultyDistribution.easy + difficultyDistribution.medium + difficultyDistribution.hard;

  // فلترة الصفوف بناءً على الصفوف المختارة
  const availableClasses = classes.filter(cls => 
    selectedGrades.length === 0 || 
    selectedGrades.some(grade => 
      cls.grade_levels?.code === grade || 
      cls.grade_levels?.label?.includes(grade)
    )
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedGrades.length === 0) {
      alert('يرجى اختيار صف واحد على الأقل');
      return;
    }
    
    if (totalPercentage !== 100) {
      alert('مجموع توزيع الصعوبة يجب أن يساوي 100%');
      return;
    }
    
    setLoading(true);

    try {
      const examData = {
        ...formData,
        grade_levels: selectedGrades,
        difficulty_distribution: difficultyDistribution,
        question_sources: {
          type: questionSourceType,
          sections: questionSourceType === 'sections' ? selectedSections : []
        }
      };
      
      if (exam) {
        await updateExam(exam.id, examData);
      } else {
        await createExam(examData);
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving exam:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">عنوان الاختبار</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="مثال: اختبار الوحدة الأولى"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">الوصف (اختياري)</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="وصف مختصر للاختبار"
            rows={3}
          />
        </div>

        {/* اختيار الصفوف المتعددة */}
        <div>
          <Label>الصفوف المستهدفة (يمكن اختيار أكثر من صف)</Label>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="grade10"
                checked={selectedGrades.includes('10')}
                onCheckedChange={(checked) => handleGradeToggle('10', checked as boolean)}
              />
              <Label htmlFor="grade10" className="font-normal cursor-pointer">
                الصف العاشر
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="grade11"
                checked={selectedGrades.includes('11')}
                onCheckedChange={(checked) => handleGradeToggle('11', checked as boolean)}
              />
              <Label htmlFor="grade11" className="font-normal cursor-pointer">
                الصف الحادي عشر
              </Label>
            </div>
          </div>
        </div>

        {/* اختيار الصفوف الدراسية */}
        <div>
          <Label>الصفوف الدراسية المستهدفة</Label>
          <MultiSelect
            options={availableClasses.map(cls => ({
              value: cls.id,
              label: cls.class_names?.name || 'صف غير محدد'
            }))}
            value={formData.target_class_ids}
            onChange={(values) => setFormData({ ...formData, target_class_ids: values })}
            placeholder="اختر الصفوف..."
            emptyText="لا توجد صفوف متاحة"
            searchPlaceholder="بحث عن صف..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="total_questions">عدد الأسئلة</Label>
            <Input
              id="total_questions"
              type="number"
              min="1"
              value={formData.total_questions}
              onChange={(e) => setFormData({ ...formData, total_questions: parseInt(e.target.value) })}
              required
            />
          </div>

          <div>
            <Label htmlFor="duration_minutes">المدة (دقيقة)</Label>
            <Input
              id="duration_minutes"
              type="number"
              min="1"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="pass_percentage">نسبة النجاح (%)</Label>
            <Input
              id="pass_percentage"
              type="number"
              min="0"
              max="100"
              value={formData.pass_percentage}
              onChange={(e) => setFormData({ ...formData, pass_percentage: parseInt(e.target.value) })}
              required
            />
          </div>

          <div>
            <Label htmlFor="max_attempts">عدد المحاولات المسموحة</Label>
            <Input
              id="max_attempts"
              type="number"
              min="1"
              value={formData.max_attempts}
              onChange={(e) => setFormData({ ...formData, max_attempts: parseInt(e.target.value) })}
              required
            />
          </div>
        </div>

        {/* الإعدادات المتقدمة */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full" type="button">
              <Settings className="h-4 w-4 mr-2" />
              إعدادات متقدمة لاختيار الأسئلة
              <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-4 mt-4">
            {/* نوع مصدر الأسئلة */}
            <div>
              <Label>مصدر الأسئلة</Label>
              <RadioGroup value={questionSourceType} onValueChange={(value: any) => setQuestionSourceType(value)}>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="random" id="random" />
                  <Label htmlFor="random" className="font-normal cursor-pointer">
                    عشوائي من كل الأقسام
                  </Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="sections" id="sections" />
                  <Label htmlFor="sections" className="font-normal cursor-pointer">
                    من أقسام محددة
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* اختيار الأقسام */}
            {questionSourceType === 'sections' && (
              <div>
                <Label>الأقسام المستهدفة</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-4 mt-2">
                  {sections.map(section => (
                    <div key={section.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`section-${section.id}`}
                        checked={selectedSections.includes(section.id)}
                        onCheckedChange={(checked) => handleSectionToggle(section.id, checked as boolean)}
                      />
                      <Label htmlFor={`section-${section.id}`} className="font-normal cursor-pointer flex-1">
                        {section.title}
                      </Label>
                      <Badge variant="outline">
                        {section.question_count || 0} سؤال
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* توزيع الصعوبة */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">توزيع درجات الصعوبة</CardTitle>
                <CardDescription>
                  حدد النسبة المئوية لكل مستوى صعوبة (المجموع يجب أن يساوي 100%)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* سهل */}
                <div>
                  <div className="flex justify-between mb-2">
                    <Label className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800">سهل</Badge>
                    </Label>
                    <span className="text-sm font-semibold">{difficultyDistribution.easy}%</span>
                  </div>
                  <Slider
                    value={[difficultyDistribution.easy]}
                    onValueChange={(values) => handleDifficultyChange('easy', values[0])}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>

                {/* متوسط */}
                <div>
                  <div className="flex justify-between mb-2">
                    <Label className="flex items-center gap-2">
                      <Badge className="bg-yellow-100 text-yellow-800">متوسط</Badge>
                    </Label>
                    <span className="text-sm font-semibold">{difficultyDistribution.medium}%</span>
                  </div>
                  <Slider
                    value={[difficultyDistribution.medium]}
                    onValueChange={(values) => handleDifficultyChange('medium', values[0])}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>

                {/* صعب */}
                <div>
                  <div className="flex justify-between mb-2">
                    <Label className="flex items-center gap-2">
                      <Badge className="bg-red-100 text-red-800">صعب</Badge>
                    </Label>
                    <span className="text-sm font-semibold">{difficultyDistribution.hard}%</span>
                  </div>
                  <Slider
                    value={[difficultyDistribution.hard]}
                    onValueChange={(values) => handleDifficultyChange('hard', values[0])}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>

                {/* تحذير إذا المجموع ليس 100 */}
                {totalPercentage !== 100 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>تنبيه</AlertTitle>
                    <AlertDescription>
                      المجموع الحالي: {totalPercentage}% - يجب أن يساوي 100%
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        <div className="space-y-4 border-t pt-4">
          <h3 className="font-semibold">الإعدادات العامة</h3>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="randomize_questions">ترتيب عشوائي للأسئلة</Label>
            <Switch
              id="randomize_questions"
              checked={formData.randomize_questions}
              onCheckedChange={(checked) => setFormData({ ...formData, randomize_questions: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="randomize_answers">ترتيب عشوائي للإجابات</Label>
            <Switch
              id="randomize_answers"
              checked={formData.randomize_answers}
              onCheckedChange={(checked) => setFormData({ ...formData, randomize_answers: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show_results_immediately">إظهار النتائج فوراً</Label>
            <Switch
              id="show_results_immediately"
              checked={formData.show_results_immediately}
              onCheckedChange={(checked) => setFormData({ ...formData, show_results_immediately: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show_correct_answers">إظهار الإجابات الصحيحة</Label>
            <Switch
              id="show_correct_answers"
              checked={formData.show_correct_answers}
              onCheckedChange={(checked) => setFormData({ ...formData, show_correct_answers: checked })}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          إلغاء
        </Button>
        <Button type="submit" disabled={loading || selectedGrades.length === 0 || totalPercentage !== 100}>
          {loading ? 'جاري الحفظ...' : exam ? 'تحديث' : 'إنشاء'}
        </Button>
      </div>
    </form>
  );
};
