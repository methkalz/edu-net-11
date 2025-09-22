import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, BookOpen, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink } from '@/components/ui/pagination';
import { useExamSystem } from '@/hooks/useExamSystem';
import { supabase } from '@/integrations/supabase/client';
import QuestionForm from './QuestionForm';
import { logger } from '@/lib/logger';

const QuestionBankManager: React.FC = () => {
  const {
    loading,
    questions,
    fetchQuestions,
    deleteQuestion
  } = useExamSystem();

  const [sections, setSections] = useState<any[]>([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    difficulty_level: 'all'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 10;

  useEffect(() => {
    fetchQuestions();
    fetchSections();
  }, [fetchQuestions]);

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from('question_bank_sections')
        .select('id, title')
        .order('title', { ascending: true });

      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      logger.error('Error fetching sections', error as Error);
    }
  };

  const handleSearch = () => {
    const searchFilters = {
      difficulty_level: filters.difficulty_level === 'all' ? undefined : filters.difficulty_level
    };
    fetchQuestions(searchFilters);
  };

  const handleEdit = (question: any) => {
    setEditingQuestion(question);
    setIsFormOpen(true);
  };

  const handleDelete = async (questionId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السؤال؟')) {
      await deleteQuestion(questionId);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingQuestion(null);
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (level: string) => {
    switch (level) {
      case 'easy': return 'سهل';
      case 'medium': return 'متوسط';
      case 'hard': return 'صعب';
      default: return level;
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple_choice': return 'اختيار متعدد';
      case 'true_false': return 'صح/خطأ';
      case 'short_answer': return 'إجابة قصيرة';
      case 'essay': return 'مقال';
      default: return type;
    }
  };

  const getSectionName = (sectionId: string) => {
    if (!sectionId) return 'عام';
    const section = sections.find(s => s.id === sectionId);
    return section ? section.title : 'غير محدد';
  };

  const filteredQuestions = questions.filter(question =>
    question.question_text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);
  const startIndex = (currentPage - 1) * questionsPerPage;
  const endIndex = startIndex + questionsPerPage;
  const currentQuestions = filteredQuestions.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">بنك الأسئلة</h2>
        </div>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              إضافة سؤال جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingQuestion ? 'تعديل السؤال' : 'إضافة سؤال جديد'}
              </DialogTitle>
            </DialogHeader>
            <QuestionForm
              question={editingQuestion}
              onClose={handleFormClose}
              onSave={() => {
                handleFormClose();
                fetchQuestions();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="البحث في الأسئلة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={filters.difficulty_level} onValueChange={(value) => setFilters(prev => ({ ...prev, difficulty_level: value === 'all' ? '' : value }))}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="المستوى" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="easy">سهل</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="hard">صعب</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={handleSearch} variant="outline">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      {loading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : (
        <>
          <div className="grid gap-4">
            {filteredQuestions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">لا توجد أسئلة</p>
                </CardContent>
              </Card>
            ) : (
              currentQuestions.map((question: any) => (
                <Card key={question.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge className={getDifficultyColor(question.difficulty_level)}>
                            {getDifficultyLabel(question.difficulty_level)}
                          </Badge>
                          <Badge variant="outline">
                            {getQuestionTypeLabel(question.question_type)}
                          </Badge>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {getSectionName(question.section_id)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {question.points} نقطة
                          </span>
                        </div>
                        <p className="text-sm font-medium text-right">
                          {question.question_text}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(question)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(question.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {question.question_type === 'multiple_choice' && question.choices?.length > 0 && (
                    <CardContent className="pt-0">
                      <div className="space-y-1">
                        {question.choices.map((choice: string, index: number) => (
                          <div
                            key={index}
                            className={`p-2 rounded text-sm ${
                              choice === question.correct_answer
                                ? 'bg-green-50 text-green-800 border border-green-200'
                                : 'bg-gray-50'
                            }`}
                          >
                            {choice}
                          </div>
                        ))}
                      </div>
                      
                      {question.explanation && (
                        <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-800">
                          <strong>التفسير:</strong> {question.explanation}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </div>

          {/* Pagination */}
          {filteredQuestions.length > 0 && totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination>
                <PaginationContent>
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1;
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(pageNumber);
                            }}
                            isActive={currentPage === pageNumber}
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (
                      pageNumber === currentPage - 2 ||
                      pageNumber === currentPage + 2
                    ) {
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default QuestionBankManager;