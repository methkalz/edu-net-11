import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Trash2, 
  Edit, 
  Plus, 
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle
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
import { TeacherQuestionDialog } from './TeacherQuestionDialog';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'hard':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'سهل';
      case 'medium':
        return 'متوسط';
      case 'hard':
        return 'صعب';
      default:
        return difficulty;
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple_choice':
        return 'اختيار من متعدد';
      case 'true_false':
        return 'صح وخطأ';
      default:
        return type;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Edit className="h-6 w-6 text-primary" />
              إدارة أسئلتي
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
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
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="h-4 w-4 ml-2" />
                سؤال جديد
              </Button>
            </div>

            {/* الإحصائيات السريعة */}
            <div className="grid grid-cols-4 gap-3">
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{questions.length}</p>
                    <p className="text-xs text-muted-foreground">إجمالي الأسئلة</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {questions.filter(q => q.difficulty === 'easy').length}
                    </p>
                    <p className="text-xs text-muted-foreground">سهلة</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">
                      {questions.filter(q => q.difficulty === 'medium').length}
                    </p>
                    <p className="text-xs text-muted-foreground">متوسطة</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {questions.filter(q => q.difficulty === 'hard').length}
                    </p>
                    <p className="text-xs text-muted-foreground">صعبة</p>
                  </div>
                </CardContent>
              </Card>
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
            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : filteredQuestions.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {searchQuery || selectedCategory !== 'all' 
                        ? 'لا توجد أسئلة تطابق البحث' 
                        : 'لم تقم بإنشاء أي أسئلة بعد'}
                    </p>
                    {!searchQuery && selectedCategory === 'all' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => setIsAddDialogOpen(true)}
                      >
                        <Plus className="h-4 w-4 ml-2" />
                        أضف سؤالك الأول
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredQuestions.map((question) => (
                    <Card key={question.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-2">
                            <CardTitle className="text-base font-medium">
                              {question.question_text}
                            </CardTitle>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className={getDifficultyColor(question.difficulty)}>
                                {getDifficultyLabel(question.difficulty)}
                              </Badge>
                              <Badge variant="outline">
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
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setQuestionToDelete(question.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {question.question_type === 'multiple_choice' && (
                          <div className="space-y-1.5">
                            {question.choices.map((choice: any, idx: number) => {
                              const isCorrect = choice.id === question.correct_answer;
                              return (
                                <div
                                  key={idx}
                                  className={`flex items-center gap-2 p-2 rounded-md text-sm ${
                                    isCorrect ? 'bg-green-50 border border-green-200' : 'bg-muted/50'
                                  }`}
                                >
                                  {isCorrect ? (
                                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  )}
                                  <span className={isCorrect ? 'text-green-700 font-medium' : 'text-muted-foreground'}>
                                    {choice.text}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {question.question_type === 'true_false' && (
                          <div className="flex gap-2">
                            <Badge variant={question.correct_answer === 'true' ? 'default' : 'outline'}>
                              صح {question.correct_answer === 'true' && '✓'}
                            </Badge>
                            <Badge variant={question.correct_answer === 'false' ? 'default' : 'outline'}>
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
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog تأكيد الحذف */}
      <AlertDialog open={!!questionToDelete} onOpenChange={() => setQuestionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
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

      {/* Dialog إضافة سؤال جديد */}
      <TeacherQuestionDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['my-custom-questions'] });
          queryClient.invalidateQueries({ queryKey: ['my-questions-count'] });
          queryClient.invalidateQueries({ queryKey: ['teacher-questions'] });
        }}
        existingCategories={categories}
      />
    </>
  );
};
