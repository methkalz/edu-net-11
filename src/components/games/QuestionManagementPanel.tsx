import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Trash2, 
  RefreshCw, 
  BarChart3, 
  FileText, 
  CheckCircle, 
  XCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useRealQuestionGenerator } from '@/hooks/useRealQuestionGenerator';
import { toast } from 'sonner';

export const QuestionManagementPanel: React.FC = () => {
  const { 
    questions, 
    stats, 
    loading, 
    fetchQuestions, 
    addRealQuestions, 
    deleteQuestion 
  } = useRealQuestionGenerator();

  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter questions based on selected category
  const filteredQuestions = selectedCategory === 'all' 
    ? questions 
    : questions.filter(q => q.category === selectedCategory);

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(questions.map(q => q.category || 'عام')))];

  const handleDeleteQuestion = async (questionId: string, questionText: string) => {
    if (!confirm(`هل أنت متأكد من حذف هذا السؤال؟\n\n"${questionText}"`)) {
      return;
    }

    const success = await deleteQuestion(questionId);
    if (success) {
      toast.success('تم حذف السؤال بنجاح');
    }
  };

  const getDifficultyColor = (question: any) => {
    const textLength = question.question_text.length;
    if (textLength < 50) return 'bg-green-100 text-green-800 border-green-300';
    if (textLength < 100) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const getDifficultyLabel = (question: any) => {
    const textLength = question.question_text.length;
    if (textLength < 50) return 'سهل';
    if (textLength < 100) return 'متوسط';
    return 'صعب';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة أسئلة الصف الحادي عشر</h2>
          <p className="text-muted-foreground">
            إدارة وتحسين مكتبة الأسئلة التفاعلية
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={addRealQuestions} 
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            إضافة أسئلة جديدة
          </Button>
          <Button 
            onClick={fetchQuestions} 
            variant="outline" 
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.totalQuestions}</div>
                  <div className="text-sm text-muted-foreground">إجمالي الأسئلة</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.easyQuestions}</div>
                  <div className="text-sm text-muted-foreground">أسئلة سهلة</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-yellow-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.mediumQuestions}</div>
                  <div className="text-sm text-muted-foreground">أسئلة متوسطة</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <XCircle className="w-8 h-8 text-red-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.hardQuestions}</div>
                  <div className="text-sm text-muted-foreground">أسئلة صعبة</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Distribution */}
      {stats && Object.keys(stats.categoryCounts).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              توزيع الأسئلة حسب الفئة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(stats.categoryCounts).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="font-medium">{category}</span>
                <div className="flex items-center gap-3">
                  <Progress 
                    value={(count / stats.totalQuestions) * 100} 
                    className="w-32"
                  />
                  <Badge variant="outline">{count}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(category => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category === 'all' ? 'جميع الفئات' : category}
            {category !== 'all' && stats && (
              <Badge variant="secondary" className="mr-2">
                {stats.categoryCounts[category] || 0}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Questions List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              قائمة الأسئلة ({filteredQuestions.length})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllQuestions(!showAllQuestions)}
            >
              {showAllQuestions ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  إخفاء التفاصيل
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  عرض التفاصيل
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">جاري تحميل الأسئلة...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد أسئلة في هذه الفئة</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.slice(0, showAllQuestions ? undefined : 10).map((question) => (
                <Card key={question.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start gap-3">
                          <h3 className="font-semibold text-lg leading-relaxed flex-1">
                            {question.question_text}
                          </h3>
                          <div className="flex gap-2">
                            <Badge className={getDifficultyColor(question)}>
                              {getDifficultyLabel(question)}
                            </Badge>
                            <Badge variant="outline">
                              {question.category || 'عام'}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {question.choices.map((choice, index) => (
                            <div 
                              key={choice.id || index} 
                              className={`p-2 rounded border text-sm ${
                                choice.id === question.correct_answer 
                                  ? 'bg-green-50 border-green-300 text-green-800' 
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <span className="font-semibold mr-2">
                                {choice.id}:
                              </span>
                              {choice.text}
                              {choice.id === question.correct_answer && (
                                <CheckCircle className="w-4 h-4 text-green-600 inline mr-2" />
                              )}
                            </div>
                          ))}
                        </div>

                        {question.explanation && (
                          <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                            <h4 className="font-semibold text-blue-800 mb-1">شرح الإجابة:</h4>
                            <p className="text-sm text-blue-700">{question.explanation}</p>
                          </div>
                        )}
                      </div>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteQuestion(question.id, question.question_text)}
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {!showAllQuestions && filteredQuestions.length > 10 && (
                <div className="text-center py-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAllQuestions(true)}
                  >
                    عرض جميع الأسئلة ({filteredQuestions.length - 10} المتبقية)
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};