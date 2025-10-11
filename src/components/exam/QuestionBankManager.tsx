import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuestionBank } from '@/hooks/useQuestionBank';
import { Plus, Search, Edit, Trash2, FileText, Hash, Filter } from 'lucide-react';
import { Question } from '@/types/exam';
import { QuestionForm } from './QuestionForm';
import { BulkQuestionImporter } from './BulkQuestionImporter';

export const QuestionBankManager: React.FC = () => {
  const { questions, isLoading, addQuestion, updateQuestion, deleteQuestion, isAdding, isUpdating } = useQuestionBank();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | undefined>();

  // استخراج الأقسام الفريدة من الأسئلة
  const uniqueSections = useMemo(() => {
    const sections = questions
      .map(q => q.section_name)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index);
    return sections.sort();
  }, [questions]);

  // فلترة الأسئلة حسب البحث والقسم ونوع السؤال
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchesSearch = q.question_text.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSection = selectedSection === 'all' || q.section_name === selectedSection;
      const matchesType = selectedType === 'all' || q.question_type === selectedType;
      
      return matchesSearch && matchesSection && matchesType;
    });
  }, [questions, searchTerm, selectedSection, selectedType]);

  const difficultyColors = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800',
  };

  const typeLabels = {
    multiple_choice: 'اختيار متعدد',
    true_false: 'صح/خطأ',
    essay: 'مقالي',
    short_answer: 'إجابة قصيرة',
  };

  const handleAddQuestion = () => {
    setSelectedQuestion(undefined);
    setIsDialogOpen(true);
  };

  const handleEditQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: Omit<Question, 'id' | 'created_at' | 'updated_at'>) => {
    if (selectedQuestion) {
      updateQuestion({ id: selectedQuestion.id, ...data });
    } else {
      addQuestion(data);
    }
    setIsDialogOpen(false);
  };

  const getCorrectAnswerDisplay = (question: Question) => {
    switch (question.question_type) {
      case 'true_false':
        return question.correct_answer === 'صح' ? 'صح ✓' : 'خطأ ✗';
      
      case 'multiple_choice':
        return question.correct_answer;
      
      case 'essay':
      case 'short_answer':
        return question.correct_answer || 'تتطلب تصحيح يدوي';
      
      default:
        return 'غير محدد';
    }
  };

  if (isLoading) {
    return <div className="text-center p-6">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* شريط البحث والأزرار */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="ابحث في بنك الأسئلة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <BulkQuestionImporter />
          <Button className="gap-2" onClick={handleAddQuestion}>
            <Plus className="w-4 h-4" />
            إضافة سؤال جديد
          </Button>
        </div>
      </div>

      {/* الفلاتر */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">تصفية حسب:</span>
        </div>
        
        <Select value={selectedSection} onValueChange={setSelectedSection}>
          <SelectTrigger className="w-[200px] bg-background">
            <SelectValue placeholder="اختر القسم" />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            <SelectItem value="all">جميع الأقسام</SelectItem>
            {uniqueSections.map((section) => (
              <SelectItem key={section} value={section}>
                {section}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[180px] bg-background">
            <SelectValue placeholder="نوع السؤال" />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            <SelectItem value="all">جميع الأنواع</SelectItem>
            <SelectItem value="multiple_choice">اختيار متعدد</SelectItem>
            <SelectItem value="true_false">صح/خطأ</SelectItem>
          </SelectContent>
        </Select>

        {(selectedSection !== 'all' || selectedType !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedSection('all');
              setSelectedType('all');
            }}
            className="text-sm"
          >
            إعادة تعيين الفلاتر
          </Button>
        )}
        
        <Badge variant="secondary" className="mr-auto">
          {filteredQuestions.length} سؤال
        </Badge>
      </div>

      <div className="grid gap-4">
        {filteredQuestions.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد أسئلة في البنك'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredQuestions.map((question, index) => (
            <Card key={question.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="default" className="gap-1">
                        <Hash className="w-3 h-3" />
                        {index + 1}
                      </Badge>
                      <Badge variant="outline">
                        {typeLabels[question.question_type]}
                      </Badge>
                      <Badge className={difficultyColors[question.difficulty]}>
                        {question.difficulty === 'easy' ? 'سهل' : 
                         question.difficulty === 'medium' ? 'متوسط' : 'صعب'}
                      </Badge>
                      <Badge variant="secondary">
                        {question.points} نقطة
                      </Badge>
                      <Badge variant="outline">
                        {question.grade_level}
                      </Badge>
                    </div>
                    
                    <p className="text-lg font-medium">{question.question_text}</p>
                    
                    <div className="flex items-start gap-2 text-sm bg-muted/50 p-3 rounded-lg">
                      <span className="font-semibold text-primary">✅ الإجابة الصحيحة:</span>
                      <span className="flex-1">{getCorrectAnswerDisplay(question)}</span>
                    </div>
                    
                    {question.section_name && (
                      <p className="text-sm text-muted-foreground">
                        القسم: {question.section_name}
                        {question.topic_name && ` - ${question.topic_name}`}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEditQuestion(question)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => deleteQuestion(question.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedQuestion ? 'تعديل السؤال' : 'إضافة سؤال جديد'}
            </DialogTitle>
          </DialogHeader>
          <QuestionForm
            question={selectedQuestion}
            onSubmit={handleSubmit}
            onCancel={() => setIsDialogOpen(false)}
            isSubmitting={isAdding || isUpdating}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
