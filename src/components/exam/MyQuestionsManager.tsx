import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Trash2, 
  Edit, 
  Plus, 
  CheckCircle,
  XCircle,
  AlertCircle,
  FolderPlus,
  X,
  Sparkles,
  Target,
  FileQuestion,
  TrendingUp
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface MyQuestionsManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  difficulty: string;
  category: string;
  points: number;
  choices: any[];
  correct_answer: string;
  created_at: string;
  is_active: boolean;
}

export const MyQuestionsManager: React.FC<MyQuestionsManagerProps> = ({
  open,
  onOpenChange,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [activeTab, setActiveTab] = useState('questions');
  
  // حالة التعديل
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<{
    question_text: string;
    question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
    difficulty: 'easy' | 'medium' | 'hard';
    category: string;
    points: number;
    choices: { text: string }[];
    correct_answer: string;
  }>({
    question_text: '',
    question_type: 'multiple_choice',
    difficulty: 'medium',
    category: '',
    points: 1,
    choices: [] as { text: string }[],
    correct_answer: ''
  });

  // جلب أسئلة المعلم
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['my-custom-questions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('teacher_custom_questions')
        .select('*')
        .eq('teacher_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Question[];
    },
    enabled: !!user?.id && open,
  });

  // جلب التصنيفات
  const categories = Array.from(new Set(questions.map(q => q.category)));

  // فلترة الأسئلة
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.question_text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || q.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // إحصائيات
  const stats = {
    total: questions.length,
    easy: questions.filter(q => q.difficulty === 'easy').length,
    medium: questions.filter(q => q.difficulty === 'medium').length,
    hard: questions.filter(q => q.difficulty === 'hard').length,
    categories: categories.length
  };

  // حذف سؤال
  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from('teacher_custom_questions')
        .update({ is_active: false })
        .eq('id', questionId)
        .eq('teacher_id', user?.id);

      if (error) throw error;

      toast.success('تم حذف السؤال بنجاح');
      queryClient.invalidateQueries({ queryKey: ['my-custom-questions'] });
      queryClient.invalidateQueries({ queryKey: ['my-questions-count'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-questions'] });
      setQuestionToDelete(null);
    } catch (error: any) {
      toast.error('فشل في حذف السؤال: ' + error.message);
    }
  };

  // فتح نموذج التعديل
  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setEditForm({
      question_text: question.question_text,
      question_type: question.question_type as 'multiple_choice' | 'true_false' | 'short_answer' | 'essay',
      difficulty: question.difficulty as 'easy' | 'medium' | 'hard',
      category: question.category,
      points: question.points,
      choices: question.choices.map((c: any) => ({ text: c.text })),
      correct_answer: question.correct_answer
    });
    setIsEditDialogOpen(true);
  };

  // حفظ التعديلات
  const handleSaveEdit = async () => {
    if (!editingQuestion) return;

    try {
      const formattedChoices = editForm.question_type === 'multiple_choice' 
        ? editForm.choices
            .filter((c) => c.text.trim())
            .map((choice, idx) => ({
              id: `choice_${idx}`,
              text: choice.text.trim(),
            }))
        : [
            { id: "choice_0", text: "صح" },
            { id: "choice_1", text: "خطأ" },
          ];

      const { error } = await supabase
        .from('teacher_custom_questions')
        .update({
          question_text: editForm.question_text,
          question_type: editForm.question_type,
          difficulty: editForm.difficulty,
          category: editForm.category,
          points: editForm.points,
          choices: formattedChoices,
          correct_answer: editForm.question_type === 'true_false' 
            ? editForm.correct_answer 
            : formattedChoices[parseInt(editForm.correct_answer)]?.id || '',
        })
        .eq('id', editingQuestion.id)
        .eq('teacher_id', user?.id);

      if (error) throw error;

      toast.success('تم تحديث السؤال بنجاح');
      queryClient.invalidateQueries({ queryKey: ['my-custom-questions'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-questions'] });
      setIsEditDialogOpen(false);
      setEditingQuestion(null);
    } catch (error: any) {
      toast.error('فشل في تحديث السؤال: ' + error.message);
    }
  };

  // إضافة تصنيف جديد
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('يرجى إدخال اسم التصنيف');
      return;
    }

    if (categories.includes(newCategoryName.trim())) {
      toast.error('هذا التصنيف موجود بالفعل');
      return;
    }

    setIsAddingCategory(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("user_id", user?.id)
        .single();

      if (!profile?.school_id) {
        throw new Error("لم يتم العثور على معلومات المدرسة");
      }

      const { error } = await supabase
        .from("teacher_custom_questions")
        .insert([{
          teacher_id: user?.id,
          school_id: profile.school_id,
          question_text: `[تصنيف] ${newCategoryName.trim()}`,
          question_type: "multiple_choice",
          difficulty: "medium",
          grade_level: "11",
          category: newCategoryName.trim(),
          points: 1,
          choices: [{ id: "1", text: "مؤقت" }],
          correct_answer: "1",
          tags: [],
          is_active: false,
        }]);

      if (error) throw error;

      toast.success(`تم إضافة التصنيف "${newCategoryName.trim()}" بنجاح`);
      setNewCategoryName("");
      setIsAddCategoryOpen(false);
      queryClient.invalidateQueries({ queryKey: ['my-custom-questions'] });
    } catch (error: any) {
      toast.error('فشل في إضافة التصنيف: ' + error.message);
    } finally {
      setIsAddingCategory(false);
    }
  };

  // حذف تصنيف
  const handleDeleteCategory = async (categoryName: string) => {
    if (categoryName === "عام") {
      toast.error('لا يمكن حذف التصنيف "عام"');
      return;
    }

    try {
      // حذف الأسئلة الوهمية
      await supabase
        .from("teacher_custom_questions")
        .delete()
        .eq("teacher_id", user?.id)
        .eq("category", categoryName)
        .eq("is_active", false);

      // نقل الأسئلة النشطة إلى "عام"
      await supabase
        .from("teacher_custom_questions")
        .update({ category: "عام" })
        .eq("teacher_id", user?.id)
        .eq("category", categoryName)
        .eq("is_active", true);

      toast.success(`تم حذف التصنيف "${categoryName}" ونقل الأسئلة إلى "عام"`);
      queryClient.invalidateQueries({ queryKey: ['my-custom-questions'] });
      setCategoryToDelete(null);
    } catch (error: any) {
      toast.error('فشل في حذف التصنيف: ' + error.message);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'hard': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'سهل';
      case 'medium': return 'متوسط';
      case 'hard': return 'صعب';
      default: return difficulty;
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple_choice': return 'اختيار من متعدد';
      case 'true_false': return 'صح وخطأ';
      default: return type;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[95vh] p-0 gap-0">
          {/* Header */}
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b sticky top-0 z-10">
            <DialogHeader className="p-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl">بنك أسئلتي</DialogTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    إدارة شاملة لأسئلتك وتصنيفاتها
                  </p>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-6">
            {/* إحصائيات سريعة */}
            <div className="grid grid-cols-5 gap-3">
              <Card className="border-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <FileQuestion className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                      <p className="text-xs text-muted-foreground">إجمالي</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-600">{stats.easy}</p>
                      <p className="text-xs text-muted-foreground">سهلة</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-gradient-to-br from-amber-500/10 to-amber-600/5 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <Target className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-amber-600">{stats.medium}</p>
                      <p className="text-xs text-muted-foreground">متوسطة</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-gradient-to-br from-rose-500/10 to-rose-600/5 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-rose-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-rose-600">{stats.hard}</p>
                      <p className="text-xs text-muted-foreground">صعبة</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <FolderPlus className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">{stats.categories}</p>
                      <p className="text-xs text-muted-foreground">تصنيفات</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* التبويبات */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-12">
                <TabsTrigger value="questions" className="text-base">
                  <FileQuestion className="h-4 w-4 ml-2" />
                  الأسئلة
                </TabsTrigger>
                <TabsTrigger value="categories" className="text-base">
                  <FolderPlus className="h-4 w-4 ml-2" />
                  التصنيفات
                </TabsTrigger>
              </TabsList>

              {/* تبويب الأسئلة */}
              <TabsContent value="questions" className="space-y-4 mt-4">
                {/* شريط البحث والفلتر */}
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ابحث في أسئلتك..."
                      className="pr-10"
                    />
                  </div>
                </div>

                {/* التصنيفات */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={selectedCategory === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('all')}
                  >
                    الكل ({questions.length})
                  </Button>
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category} ({questions.filter(q => q.category === category).length})
                    </Button>
                  ))}
                </div>

                {/* قائمة الأسئلة */}
                <ScrollArea className="h-[450px]">
                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-40 w-full" />
                      ))}
                    </div>
                  ) : filteredQuestions.length === 0 ? (
                    <Card className="border-dashed border-2">
                      <CardContent className="py-16 text-center">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                          <AlertCircle className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <p className="text-lg font-medium mb-2">لا توجد أسئلة</p>
                        <p className="text-sm text-muted-foreground">
                          {searchQuery || selectedCategory !== 'all' 
                            ? 'لا توجد أسئلة تطابق البحث' 
                            : 'لم تقم بإنشاء أي أسئلة بعد'}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {filteredQuestions.map((question) => (
                        <Card key={question.id} className="hover:shadow-md transition-all group border-l-4" style={{
                          borderLeftColor: question.difficulty === 'easy' ? '#10b981' : 
                                          question.difficulty === 'medium' ? '#f59e0b' : '#ef4444'
                        }}>
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div className="flex-1">
                                <h4 className="text-base font-semibold mb-2 text-foreground leading-relaxed">
                                  {question.question_text}
                                </h4>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className={getDifficultyColor(question.difficulty)}>
                                    {getDifficultyLabel(question.difficulty)}
                                  </Badge>
                                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                                    {getQuestionTypeLabel(question.question_type)}
                                  </Badge>
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    {question.category}
                                  </Badge>
                                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                    {question.points} نقطة
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditQuestion(question)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setQuestionToDelete(question.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {question.question_type === 'multiple_choice' && (
                              <div className="space-y-1.5 mt-3">
                                {question.choices.map((choice: any, idx: number) => {
                                  const isCorrect = choice.id === question.correct_answer;
                                  return (
                                    <div
                                      key={idx}
                                      className={cn(
                                        "flex items-center gap-2 p-2.5 rounded-lg text-sm transition-colors",
                                        isCorrect 
                                          ? 'bg-emerald-50 border border-emerald-200' 
                                          : 'bg-muted/30 hover:bg-muted/50'
                                      )}
                                    >
                                      {isCorrect ? (
                                        <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                      ) : (
                                        <XCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                      )}
                                      <span className={isCorrect ? 'text-emerald-700 font-medium' : 'text-muted-foreground'}>
                                        {choice.text}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {question.question_type === 'true_false' && (
                              <div className="flex gap-2 mt-3">
                                <Badge 
                                  variant={question.correct_answer === 'true' ? 'default' : 'outline'}
                                  className="px-4 py-1.5"
                                >
                                  صح {question.correct_answer === 'true' && '✓'}
                                </Badge>
                                <Badge 
                                  variant={question.correct_answer === 'false' ? 'default' : 'outline'}
                                  className="px-4 py-1.5"
                                >
                                  خطأ {question.correct_answer === 'false' && '✓'}
                                </Badge>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              {/* تبويب التصنيفات */}
              <TabsContent value="categories" className="space-y-4 mt-4">
                <Card className="border-2 border-dashed">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <FolderPlus className="h-5 w-5 text-primary" />
                          إضافة تصنيف جديد
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          أنشئ تصنيفات لتنظيم أسئلتك بشكل أفضل
                        </p>
                      </div>
                    </div>
                    {!isAddCategoryOpen ? (
                      <Button onClick={() => setIsAddCategoryOpen(true)} variant="outline" className="w-full">
                        <Plus className="h-4 w-4 ml-2" />
                        إضافة تصنيف
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Input
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="اسم التصنيف (مثال: الشبكات السلكية)"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddCategory();
                            }}
                          />
                          <Button 
                            onClick={handleAddCategory} 
                            disabled={isAddingCategory}
                          >
                            {isAddingCategory ? 'جاري الإضافة...' : 'إضافة'}
                          </Button>
                          <Button 
                            variant="ghost" 
                            onClick={() => {
                              setIsAddCategoryOpen(false);
                              setNewCategoryName('');
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <ScrollArea className="h-[400px]">
                  <div className="grid grid-cols-2 gap-3">
                    {categories.map((category) => {
                      const count = questions.filter(q => q.category === category).length;
                      return (
                        <Card key={category} className="group hover:shadow-md transition-all">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <FolderPlus className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-semibold">{category}</p>
                                  <p className="text-sm text-muted-foreground">{count} أسئلة</p>
                                </div>
                              </div>
                              {category !== 'عام' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setCategoryToDelete(category)}
                                  className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog تأكيد حذف السؤال */}
      <AlertDialog open={!!questionToDelete} onOpenChange={() => setQuestionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف السؤال</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا السؤال؟ لن تتمكن من التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => questionToDelete && handleDeleteQuestion(questionToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog تأكيد حذف التصنيف */}
      <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف التصنيف</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم نقل جميع الأسئلة في هذا التصنيف إلى "عام". هل تريد المتابعة؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => categoryToDelete && handleDeleteCategory(categoryToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog تعديل السؤال */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل السؤال</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>نص السؤال *</Label>
              <Textarea
                value={editForm.question_text}
                onChange={(e) => setEditForm({ ...editForm, question_text: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>نوع السؤال *</Label>
                <Select
                  value={editForm.question_type}
                  onValueChange={(value) => setEditForm({ ...editForm, question_type: value as 'multiple_choice' | 'true_false' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">اختيار من متعدد</SelectItem>
                    <SelectItem value="true_false">صح وخطأ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>مستوى الصعوبة *</Label>
                <Select
                  value={editForm.difficulty}
                  onValueChange={(value) => setEditForm({ ...editForm, difficulty: value as 'easy' | 'medium' | 'hard' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">سهل</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="hard">صعب</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>التصنيف *</Label>
                <Select
                  value={editForm.category}
                  onValueChange={(value) => setEditForm({ ...editForm, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>النقاط *</Label>
                <Input
                  type="number"
                  min="1"
                  value={editForm.points}
                  onChange={(e) => setEditForm({ ...editForm, points: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            {editForm.question_type === 'multiple_choice' && (
              <div className="space-y-2">
                <Label>الخيارات *</Label>
                <div className="space-y-2">
                  {editForm.choices.map((choice, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={choice.text}
                        onChange={(e) => {
                          const updated = [...editForm.choices];
                          updated[index].text = e.target.value;
                          setEditForm({ ...editForm, choices: updated });
                        }}
                        placeholder={`الخيار ${index + 1}`}
                      />
                      {editForm.choices.length > 2 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setEditForm({
                              ...editForm,
                              choices: editForm.choices.filter((_, i) => i !== index)
                            });
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {editForm.choices.length < 6 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditForm({
                          ...editForm,
                          choices: [...editForm.choices, { text: '' }]
                        });
                      }}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة خيار
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>الإجابة الصحيحة *</Label>
              {editForm.question_type === 'multiple_choice' ? (
                <Select
                  value={editForm.correct_answer}
                  onValueChange={(value) => setEditForm({ ...editForm, correct_answer: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الإجابة الصحيحة" />
                  </SelectTrigger>
                  <SelectContent>
                    {editForm.choices.map((choice, index) => (
                      <SelectItem key={index} value={index.toString()} disabled={!choice.text.trim()}>
                        {choice.text || `الخيار ${index + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select
                  value={editForm.correct_answer}
                  onValueChange={(value) => setEditForm({ ...editForm, correct_answer: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الإجابة الصحيحة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">صح</SelectItem>
                    <SelectItem value="false">خطأ</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveEdit}>
              حفظ التعديلات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
