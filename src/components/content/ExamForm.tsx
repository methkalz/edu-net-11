import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, ClipboardCheck } from 'lucide-react';
import { logger } from '@/lib/logger';

interface ExamResponse {
  id?: string;
  title: string;
  description?: string;
  duration: number;
  total_marks: number;
  passing_grade: number;
  questions: Array<{
    id: string;
    question_text: string;
    question_type: string;
    choices?: string[];
    correct_answer?: string;
    points: number;
  }>;
  total_points: number;
  grade_level: string;
}

interface Question {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  question: string;
  options?: string[];
  correct_answer?: string;
  points: number;
}

interface ExamFormProps {
  exam?: ExamResponse;
  onClose: () => void;
  onSave: (exam: ExamResponse) => void;
}

const ExamForm: React.FC<ExamFormProps> = ({ exam, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: exam?.title || '',
    description: exam?.description || '',
    duration: exam?.duration || 60,
    total_marks: exam?.total_marks || 100,
    passing_grade: exam?.passing_grade || 60
  });

  const [questions, setQuestions] = useState<Question[]>(exam?.questions ? exam.questions.map(q => ({
    id: q.id,
    type: q.question_type as Question['type'],
    question: q.question_text,
    options: q.choices,
    correct_answer: q.correct_answer,
    points: q.points
  })) : []);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    type: 'multiple_choice',
    question: '',
    options: ['', '', '', ''],
    points: 5
  });

  const questionTypes = [
    { value: 'multiple_choice', label: 'اختيار من متعدد' },
    { value: 'true_false', label: 'صح أم خطأ' },
    { value: 'short_answer', label: 'إجابة قصيرة' },
    { value: 'essay', label: 'مقال' }
  ];

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleQuestionChange = (field: string, value: string | number | string[]) => {
    setCurrentQuestion(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(currentQuestion.options || ['', '', '', ''])];
    newOptions[index] = value;
    handleQuestionChange('options', newOptions);
  };

  const addQuestion = () => {
    if (currentQuestion.question && currentQuestion.points) {
      const newQuestion: Question = {
        id: Date.now().toString(),
        type: currentQuestion.type as Question['type'],
        question: currentQuestion.question,
        options: currentQuestion.options,
        correct_answer: currentQuestion.correct_answer,
        points: currentQuestion.points
      };

      setQuestions(prev => [...prev, newQuestion]);
      setCurrentQuestion({
        type: 'multiple_choice',
        question: '',
        options: ['', '', '', ''],
        points: 5
      });
    }
  };

  const removeQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const calculateTotalMarks = () => {
    return questions.reduce((total, question) => total + question.points, 0);
  };

  const handleSave = () => {
    const examData: ExamResponse = {
      id: exam?.id,
      title: formData.title,
      description: formData.description,
      duration: formData.duration,
      total_marks: formData.total_marks,
      passing_grade: formData.passing_grade,
      total_points: calculateTotalMarks(),
      grade_level: exam?.grade_level || '10',
      questions: questions.map(q => ({
        id: q.id,
        question_text: q.question,
        question_type: q.type,
        choices: q.options,
        correct_answer: q.correct_answer,
        points: q.points
      }))
    };
    
    logger.debug('Saving exam data', { 
      questionsCount: questions.length, 
      totalMarks: calculateTotalMarks(),
      examTitle: formData.title 
    });
    
    onSave(examData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            {exam ? 'تعديل الاختبار' : 'إضافة اختبار جديد'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* معلومات الاختبار */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">معلومات الاختبار</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">عنوان الاختبار</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="أدخل عنوان الاختبار"
                  />
                </div>

                <div>
                  <Label htmlFor="duration">مدة الاختبار (بالدقائق)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                    placeholder="60"
                  />
                </div>

                <div>
                  <Label htmlFor="passing_grade">درجة النجاح (%)</Label>
                  <Input
                    id="passing_grade"
                    type="number"
                    value={formData.passing_grade}
                    onChange={(e) => handleInputChange('passing_grade', parseInt(e.target.value))}
                    placeholder="60"
                  />
                </div>

                <div>
                  <Label>إجمالي الدرجات</Label>
                  <div className="text-lg font-semibold text-primary">
                    {calculateTotalMarks()} درجة
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="description">وصف الاختبار</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="أدخل وصف مفصل للاختبار"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* إضافة سؤال جديد */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">إضافة سؤال جديد</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>نوع السؤال</Label>
                  <Select
                    value={currentQuestion.type}
                    onValueChange={(value) => handleQuestionChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {questionTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="points">درجة السؤال</Label>
                  <Input
                    id="points"
                    type="number"
                    value={currentQuestion.points}
                    onChange={(e) => handleQuestionChange('points', parseInt(e.target.value))}
                    placeholder="5"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="question">نص السؤال</Label>
                <Textarea
                  id="question"
                  value={currentQuestion.question}
                  onChange={(e) => handleQuestionChange('question', e.target.value)}
                  placeholder="أدخل نص السؤال"
                  rows={2}
                />
              </div>

              {/* خيارات الاختيار من متعدد */}
              {currentQuestion.type === 'multiple_choice' && (
                <div>
                  <Label>خيارات الإجابة</Label>
                  <div className="space-y-2">
                    {(currentQuestion.options || ['', '', '', '']).map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-sm font-medium w-6">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <Input
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          placeholder={`الخيار ${String.fromCharCode(65 + index)}`}
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-2">
                    <Label>الإجابة الصحيحة</Label>
                    <Select
                      value={currentQuestion.correct_answer}
                      onValueChange={(value) => handleQuestionChange('correct_answer', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الإجابة الصحيحة" />
                      </SelectTrigger>
                      <SelectContent>
                        {['A', 'B', 'C', 'D'].map((letter, index) => (
                          <SelectItem key={letter} value={letter}>
                            {letter} - {currentQuestion.options?.[index] || `الخيار ${letter}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* خيارات صح أم خطأ */}
              {currentQuestion.type === 'true_false' && (
                <div>
                  <Label>الإجابة الصحيحة</Label>
                  <Select
                    value={currentQuestion.correct_answer}
                    onValueChange={(value) => handleQuestionChange('correct_answer', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الإجابة الصحيحة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">صح</SelectItem>
                      <SelectItem value="false">خطأ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button onClick={addQuestion} className="w-full">
                <Plus className="h-4 w-4 ml-1" />
                إضافة السؤال
              </Button>
            </CardContent>
          </Card>

          {/* الأسئلة المضافة */}
          {questions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  الأسئلة المضافة ({questions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <div key={question.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">السؤال {index + 1}</span>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              {questionTypes.find(t => t.value === question.type)?.label}
                            </span>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              {question.points} نقاط
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {question.question}
                          </p>
                          
                          {question.options && (
                            <div className="text-xs space-y-1">
                              {question.options.map((option, optIndex) => (
                                <div key={optIndex} className="flex items-center gap-1">
                                  <span className="font-medium">
                                    {String.fromCharCode(65 + optIndex)}.
                                  </span>
                                  <span>{option}</span>
                                  {question.correct_answer === String.fromCharCode(65 + optIndex) && (
                                    <span className="text-green-600">✓</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(question.id)}
                          className="text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* أزرار الحفظ والإلغاء */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!formData.title || questions.length === 0}
            >
              حفظ الاختبار
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExamForm;