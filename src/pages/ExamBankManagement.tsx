import { useState, useMemo } from 'react';
import ModernHeader from '@/components/shared/ModernHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Plus, Search, Edit2, Trash2, Filter, RotateCcw, Check } from 'lucide-react';
import { useExamBankManager } from '@/hooks/useExamBankManager';
import { QuestionForm } from '@/components/exam/QuestionForm';
import { BulkQuestionImporter } from '@/components/exam/BulkQuestionImporter';
import { SmartQuestionGenerator } from '@/components/exam/SmartQuestionGenerator';
import { Question } from '@/types/exam';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
const ExamBankManagement = () => {
  const [filters, setFilters] = useState({
    gradeLevel: 'all',
    sectionName: 'all',
    difficulty: 'all',
    questionType: 'all',
    searchTerm: ''
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSmartGeneratorOpen, setIsSmartGeneratorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const {
    questions,
    sections,
    stats,
    isLoading,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    isAdding,
    isUpdating,
    isDeleting
  } = useExamBankManager(filters);
  const handleResetFilters = () => {
    setFilters({
      gradeLevel: 'all',
      sectionName: 'all',
      difficulty: 'all',
      questionType: 'all',
      searchTerm: ''
    });
  };
  const handleAddQuestion = () => {
    setEditingQuestion(undefined);
    setIsDialogOpen(true);
  };
  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setIsDialogOpen(true);
  };
  const handleSubmitQuestion = (data: Omit<Question, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingQuestion) {
      updateQuestion({
        id: editingQuestion.id,
        ...data
      });
    } else {
      addQuestion(data);
    }
    setIsDialogOpen(false);
  };
  const handleDeleteClick = (questionId: string) => {
    setQuestionToDelete(questionId);
    setDeleteDialogOpen(true);
  };
  const confirmDelete = () => {
    if (questionToDelete) {
      deleteQuestion(questionToDelete);
    }
    setDeleteDialogOpen(false);
    setQuestionToDelete(null);
  };
  const getDifficultyBadgeColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20';
      case 'hard':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
      default:
        return '';
    }
  };
  const getGradeBadgeStyle = (grade: string) => {
    switch (grade) {
      case '10':
        return 'bg-gradient-to-br from-blue-500 to-cyan-500';
      case '11':
        return 'bg-gradient-to-br from-purple-500 to-pink-500';
      case '12':
        return 'bg-gradient-to-br from-orange-500 to-red-500';
      default:
        return 'bg-gradient-to-br from-primary to-blue-600';
    }
  };
  const difficultyLabels = {
    easy: 'سهل',
    medium: 'متوسط',
    hard: 'صعب'
  };
  const typeLabels = {
    multiple_choice: 'اختيار متعدد',
    true_false: 'صح/خطأ'
  };
  return <div className="min-h-screen bg-background" dir="rtl">
      <ModernHeader title="إدارة بنك أسئلة الامتحانات" showBackButton backPath="/dashboard" />

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section - الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-primary to-blue-600 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <BookOpen className="w-8 h-8 opacity-80" />
              </div>
              <CardTitle className="text-3xl font-bold">{stats.totalQuestions}</CardTitle>
              <CardDescription className="text-white/80">إجمالي الأسئلة</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-none shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
            <CardHeader className="pb-3">
              <Badge className="w-fit bg-white/20 text-white border-white/30">الصف العاشر</Badge>
              <CardTitle className="text-3xl font-bold mt-2">{stats.grade10Count}</CardTitle>
              <CardDescription className="text-white/80">سؤال</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white border-none shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
            <CardHeader className="pb-3">
              <Badge className="w-fit bg-white/20 text-white border-white/30">الصف الحادي عشر</Badge>
              <CardTitle className="text-3xl font-bold mt-2">{stats.grade11Count}</CardTitle>
              <CardDescription className="text-white/80">سؤال</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-none shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
            <CardHeader className="pb-3">
              <Badge className="w-fit bg-white/20 text-white border-white/30">الصف الثاني عشر</Badge>
              <CardTitle className="text-3xl font-bold mt-2">{stats.grade12Count}</CardTitle>
              <CardDescription className="text-white/80">سؤال</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* شريط البحث والأزرار */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="relative flex-1 w-full md:max-w-md">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="ابحث في الأسئلة..." value={filters.searchTerm} onChange={e => setFilters(prev => ({
                ...prev,
                searchTerm: e.target.value
              }))} className="pr-10" />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button onClick={() => setIsSmartGeneratorOpen(true)} variant="default" className="gap-2">
                  <Check className="w-4 h-4" />
                  نظام توليد الأسئلة الذكي   
                </Button>
                <Button onClick={handleAddQuestion} variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  إضافة سؤال يدوياً
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* نظام الفلاتر المتقدم */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary" />
                <CardTitle>الفلاتر المتقدمة</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={handleResetFilters} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                إعادة تعيين
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">الصف الدراسي</label>
                <Select value={filters.gradeLevel} onValueChange={value => setFilters(prev => ({
                ...prev,
                gradeLevel: value,
                sectionName: 'all'
              }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الصفوف</SelectItem>
                    <SelectItem value="10">الصف العاشر</SelectItem>
                    <SelectItem value="11">الصف الحادي عشر</SelectItem>
                    <SelectItem value="12">الصف الثاني عشر</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">القسم</label>
                <Select value={filters.sectionName} onValueChange={value => setFilters(prev => ({
                ...prev,
                sectionName: value
              }))} disabled={filters.gradeLevel === 'all'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأقسام</SelectItem>
                    {sections.map(section => <SelectItem key={section} value={section}>{section}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">مستوى الصعوبة</label>
                <Select value={filters.difficulty} onValueChange={value => setFilters(prev => ({
                ...prev,
                difficulty: value
              }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المستويات</SelectItem>
                    <SelectItem value="easy">سهل</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="hard">صعب</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">نوع السؤال</label>
                <Select value={filters.questionType} onValueChange={value => setFilters(prev => ({
                ...prev,
                questionType: value
              }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأنواع</SelectItem>
                    <SelectItem value="multiple_choice">اختيار متعدد</SelectItem>
                    <SelectItem value="true_false">صح/خطأ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4">
              <Badge variant="secondary" className="text-sm">
                {questions.length} سؤال
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* عرض الأسئلة */}
        {isLoading ? <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">جاري تحميل الأسئلة...</p>
          </div> : questions.length === 0 ? <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="w-16 h-16 mx-auto text-muted-foreground opacity-50 mb-4" />
              <p className="text-lg text-muted-foreground">لا توجد أسئلة</p>
              <p className="text-sm text-muted-foreground mt-2">ابدأ بإضافة أسئلة جديدة أو استيراد أسئلة جاهزة</p>
            </CardContent>
          </Card> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {questions.map((question, index) => <Card key={question.id} className="hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                    <Badge className={`${getGradeBadgeStyle(question.grade_level)} text-white border-none`}>
                      الصف {question.grade_level}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline" className="text-xs">
                      {typeLabels[question.question_type as keyof typeof typeLabels]}
                    </Badge>
                    <Badge className={`text-xs border ${getDifficultyBadgeColor(question.difficulty)}`}>
                      {difficultyLabels[question.difficulty as keyof typeof difficultyLabels]}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {question.points} نقطة
                    </Badge>
                  </div>
                  {question.section_name && <Badge variant="outline" className="text-xs w-fit mb-2">
                      {question.section_name}
                    </Badge>}
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm line-clamp-3">{question.question_text}</p>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground mb-1">الإجابة الصحيحة:</p>
                    <p className="text-sm font-medium">{question.correct_answer}</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditQuestion(question)} className="flex-1 gap-2">
                      <Edit2 className="w-3 h-3" />
                      تعديل
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteClick(question.id)} className="flex-1 gap-2 text-destructive hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
                      حذف
                    </Button>
                  </div>
                </CardContent>
              </Card>)}
          </div>}
      </div>

      {/* Smart Question Generator */}
      <SmartQuestionGenerator open={isSmartGeneratorOpen} onOpenChange={setIsSmartGeneratorOpen} />
      
      {/* Dialog للإضافة/التعديل */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? 'تعديل السؤال' : 'إضافة سؤال جديد'}
            </DialogTitle>
          </DialogHeader>
          <QuestionForm question={editingQuestion} onSubmit={handleSubmitQuestion} onCancel={() => setIsDialogOpen(false)} isSubmitting={isAdding || isUpdating} />
        </DialogContent>
      </Dialog>

      {/* Dialog تأكيد الحذف */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذا السؤال؟</AlertDialogTitle>
            <AlertDialogDescription>
              لن يتم حذف السؤال نهائياً، بل سيتم إخفاؤه فقط ولن يظهر في الامتحانات الجديدة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'جاري الحذف...' : 'تأكيد الحذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};
export default ExamBankManagement;