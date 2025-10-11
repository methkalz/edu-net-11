import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuestionBank } from '@/hooks/useQuestionBank';
import { Plus, Search, Edit, Trash2, FileText } from 'lucide-react';
import { Question } from '@/types/exam';

export const QuestionBankManager: React.FC = () => {
  const { questions, isLoading, deleteQuestion } = useQuestionBank();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredQuestions = questions.filter(q => 
    q.question_text.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  if (isLoading) {
    return <div className="text-center p-6">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="ابحث في بنك الأسئلة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة سؤال جديد
        </Button>
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
          filteredQuestions.map((question) => (
            <Card key={question.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
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
                    
                    <p className="text-lg">{question.question_text}</p>
                    
                    {question.section_name && (
                      <p className="text-sm text-muted-foreground">
                        القسم: {question.section_name}
                        {question.topic_name && ` - ${question.topic_name}`}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
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
    </div>
  );
};
