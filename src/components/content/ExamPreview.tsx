import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Clock, FileText, User, ArrowLeft, ArrowRight, CheckCircle, AlertCircle, Timer, Trophy, XCircle, Target, BarChart3 } from 'lucide-react';

interface ExamResponse {
  exam: {
    title: string;
    description?: string;
    duration_minutes: number;
    pass_percentage: number;
    show_results_immediately?: boolean;
  };
  questions: Array<{
    id: string;
    question_text: string;
    question_type: 'multiple_choice' | 'true_false' | 'short_answer';
    choices?: Array<{ text: string } | string>;
    correct_answer: string;
    points: number;
    difficulty_level?: 'easy' | 'medium' | 'hard';
  }>;
}

interface ExamPreviewProps {
  examData: ExamResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ExamPreview: React.FC<ExamPreviewProps> = ({
  examData,
  open,
  onOpenChange
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [examCompleted, setExamCompleted] = useState(false);

  useEffect(() => {
    if (open && examData) {
      setCurrentQuestionIndex(0);
      setAnswers({});
      setShowResults(false);
      setExamCompleted(false);
      if (examData?.exam?.duration_minutes) {
        setTimeRemaining(examData.exam.duration_minutes * 60);
      }
    }
  }, [open, examData]);

  useEffect(() => {
    if (timeRemaining > 0 && open) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining, open]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (examData?.questions?.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleFinishExam = () => {
    setExamCompleted(true);
    if (examData?.exam?.show_results_immediately) {
      setShowResults(true);
    }
  };

  const calculateResults = () => {
    if (!examData?.questions) return null;
    
    let correctAnswers = 0;
    const totalQuestions = examData.questions.length;
    const answeredQuestions = Object.keys(answers).length;
    
    examData.questions.forEach((question, index: number) => {
      const userAnswer = answers[index];
      const correctAnswer = question.correct_answer;
      
      if (userAnswer && userAnswer === correctAnswer) {
        correctAnswers++;
      }
    });
    
    const percentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const passed = percentage >= (examData.exam.pass_percentage || 60);
    
    return {
      correctAnswers,
      totalQuestions,
      answeredQuestions,
      unansweredQuestions: totalQuestions - answeredQuestions,
      percentage: Math.round(percentage),
      passed
    };
  };

  const isLastQuestion = currentQuestionIndex === (examData?.questions?.length || 0) - 1;

  const getQuestionStatusColor = (index: number) => {
    if (answers[index]) return 'bg-green-500 text-white border-green-500 hover:bg-green-600';
    if (index === currentQuestionIndex) return 'bg-primary text-primary-foreground border-primary hover:bg-primary/90';
    return 'bg-background text-foreground border-border hover:bg-muted/50';
  };

  const getTimeColor = () => {
    const totalTime = examData?.exam?.duration_minutes * 60 || 3600;
    const percentage = (timeRemaining / totalTime) * 100;
    if (percentage > 50) return 'text-green-600';
    if (percentage > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressPercentage = () => {
    const answeredQuestions = Object.keys(answers).length;
    const totalQuestions = examData?.questions?.length || 1;
    return (answeredQuestions / totalQuestions) * 100;
  };

  if (!examData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p>لا توجد بيانات للمعاينة</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentQuestion = examData.questions[currentQuestionIndex];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] max-h-[98vh] overflow-hidden p-0 m-2">
        {/* Header */}
        <div className="border-b bg-gradient-to-r from-primary/5 to-primary/10 p-3">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{examData.exam.title}</h2>
                  <p className="text-xs text-muted-foreground">معاينة الاختبار</p>
                </div>
              </DialogTitle>
              <Badge variant="outline" className="text-xs px-2 py-1 bg-yellow-50 text-yellow-700 border-yellow-200">
                <AlertCircle className="h-3 w-3 mr-1" />
                معاينة فقط
              </Badge>
            </div>
          </DialogHeader>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-muted/30 border-b">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium">تقدم الإجابة</span>
            <span>{Object.keys(answers).length} من {examData.questions.length} سؤال</span>
          </div>
          <Progress value={getProgressPercentage()} className="h-2" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 h-[calc(95vh-12rem)] overflow-hidden">
          {/* Sidebar */}
          <div className="lg:col-span-1 bg-muted/20 border-r p-3 space-y-3 overflow-y-auto">
            {/* Timer Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs flex items-center gap-1">
                  <Timer className="h-3 w-3 text-blue-600" />
                  الوقت المتبقي
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className={`text-lg font-bold text-center ${getTimeColor()}`}>
                  {formatTime(timeRemaining)}
                </div>
                <div className="text-xs text-center text-muted-foreground">
                  من أصل {examData.exam.duration_minutes} دقيقة
                </div>
              </CardContent>
            </Card>

            {/* Question Map */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs flex items-center justify-between">
                  خريطة الأسئلة
                  <Badge variant="outline" className="text-xs">
                    {Object.keys(answers).length}/{examData.questions.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-5 gap-1">
                  {examData.questions.map((_, index: number) => (
                    <button
                      key={index}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`w-6 h-6 text-xs font-medium rounded border transition-all duration-200 ${getQuestionStatusColor(index)}`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                
                {/* Compact Legend */}
                <div className="mt-2 grid grid-cols-1 gap-1 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-sm"></div>
                    <span className="text-xs">مجاب</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-primary rounded-sm"></div>
                    <span className="text-xs">حالي</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-background border rounded-sm"></div>
                    <span className="text-xs">باقي</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Compact Exam Info */}
            <Card className="bg-gradient-to-br from-gray-50 to-slate-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs">تفاصيل الاختبار</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-xs pt-0">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الأسئلة:</span>
                  <span className="font-medium">{examData.questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المدة:</span>
                  <span className="font-medium">{examData.exam.duration_minutes}د</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">النجاح:</span>
                  <span className="font-medium">{examData.exam.pass_percentage}%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question Content */}
          <div className="lg:col-span-3 bg-white overflow-y-auto">
            <div className="p-4 space-y-4">
              {currentQuestion && (
                <div className="space-y-4">
                  {/* Compact Question Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                          {currentQuestionIndex + 1}
                        </div>
                        <h3 className="text-sm font-semibold">
                          السؤال {currentQuestionIndex + 1} من {examData.questions.length}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge 
                          variant={
                            currentQuestion.difficulty_level === 'easy' ? 'default' :
                            currentQuestion.difficulty_level === 'medium' ? 'secondary' :
                            'destructive'
                          }
                          className="px-2 py-1 text-xs"
                        >
                          {currentQuestion.difficulty_level === 'easy' ? '🟢 سهل' :
                           currentQuestion.difficulty_level === 'medium' ? '🟡 متوسط' : '🔴 صعب'}
                        </Badge>
                        <Badge variant="outline" className="px-2 py-1 text-xs">
                          {currentQuestion.points} نقطة
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Question Text */}
                    <div className="text-sm leading-relaxed p-3 bg-white rounded-lg border shadow-sm">
                      {currentQuestion.question_text}
                    </div>
                  </div>

                  {/* Answer Options */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      اختر الإجابة الصحيحة:
                    </h4>

                    {/* Multiple Choice */}
                    {currentQuestion.question_type === 'multiple_choice' && (
                      <RadioGroup
                        value={answers[currentQuestionIndex] || ''}
                        onValueChange={(value) => handleAnswerChange(currentQuestionIndex, value)}
                        className="space-y-2"
                      >
                        {currentQuestion.choices?.map((choice, index: number) => (
                          <div key={index} className="group">
                            <div className="flex items-start space-x-2 space-x-reverse">
                              <RadioGroupItem 
                                value={typeof choice === 'string' ? choice : choice.text}
                                id={`choice-${index}`} 
                                className="mt-1"
                              />
                              <Label 
                                htmlFor={`choice-${index}`} 
                                className="flex-1 cursor-pointer p-2 rounded-lg border border-gray-200 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group-has-[:checked]:border-primary group-has-[:checked]:bg-primary/10"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium group-has-[:checked]:bg-primary group-has-[:checked]:text-white">
                                    {String.fromCharCode(65 + index)}
                                  </span>
                                  <span className="text-sm">{typeof choice === 'string' ? choice : choice.text}</span>
                                </div>
                              </Label>
                            </div>
                          </div>
                        ))}
                      </RadioGroup>
                    )}

                    {/* True/False */}
                    {currentQuestion.question_type === 'true_false' && (
                      <RadioGroup
                        value={answers[currentQuestionIndex] || ''}
                        onValueChange={(value) => handleAnswerChange(currentQuestionIndex, value)}
                        className="space-y-2"
                      >
                        <div className="group">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <RadioGroupItem value="true" id="true" />
                            <Label htmlFor="true" className="cursor-pointer p-2 rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all duration-200 flex-1 group-has-[:checked]:border-green-500 group-has-[:checked]:bg-green-50">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-bold">✓</span>
                                <span className="text-sm font-medium">صحيح</span>
                              </div>
                            </Label>
                          </div>
                        </div>
                        <div className="group">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <RadioGroupItem value="false" id="false" />
                            <Label htmlFor="false" className="cursor-pointer p-2 rounded-lg border border-gray-200 hover:border-red-500 hover:bg-red-50 transition-all duration-200 flex-1 group-has-[:checked]:border-red-500 group-has-[:checked]:bg-red-50">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-sm font-bold">✗</span>
                                <span className="text-sm font-medium">خطأ</span>
                              </div>
                            </Label>
                          </div>
                        </div>
                      </RadioGroup>
                    )}

                    {/* Short Answer */}
                    {currentQuestion.question_type === 'short_answer' && (
                      <div className="space-y-2">
                        <Label htmlFor="answer-input" className="text-sm font-medium">اكتب إجابتك:</Label>
                        <Textarea
                          id="answer-input"
                          value={answers[currentQuestionIndex] || ''}
                          onChange={(e) => handleAnswerChange(currentQuestionIndex, e.target.value)}
                          placeholder="اكتب إجابتك هنا..."
                          className="min-h-[80px] p-3 text-sm border focus:border-primary resize-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Controls */}
            <div className="border-t bg-gradient-to-r from-gray-50 to-slate-50 p-6">
              <div className="flex items-center justify-between max-w-4xl mx-auto">
                <Button
                  variant="outline"
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center gap-2 px-6 py-3 text-base disabled:opacity-50"
                >
                  <ArrowRight className="h-5 w-5" />
                  السؤال السابق
                </Button>

                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">السؤال الحالي</div>
                    <div className="text-lg font-bold text-primary">
                      {currentQuestionIndex + 1} / {examData.questions.length}
                    </div>
                  </div>
                  
                  {answers[currentQuestionIndex] && (
                    <Badge className="bg-green-100 text-green-800 border-green-300 px-3 py-1">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      تم الإجابة
                    </Badge>
                  )}
                </div>

                {isLastQuestion ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="default"
                        className="flex items-center gap-1 px-4 py-2 text-sm bg-green-600 hover:bg-green-700"
                      >
                        إنهاء
                        <Trophy className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-yellow-600" />
                          تأكيد إنهاء الاختبار
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-right">
                          هل أنت متأكد من أنك تريد إنهاء الاختبار؟
                          <br />
                          <div className="mt-3 p-3 bg-muted rounded-md">
                            <div className="text-sm space-y-1">
                              <div>الأسئلة المجاب عليها: {Object.keys(answers).length} من {examData?.questions?.length}</div>
                              <div>الأسئلة المتبقية: {(examData?.questions?.length || 0) - Object.keys(answers).length}</div>
                              {(examData?.questions?.length || 0) - Object.keys(answers).length > 0 && (
                                <div className="text-yellow-600 font-medium">
                                  ⚠️ لديك أسئلة لم تتم الإجابة عليها
                                </div>
                              )}
                            </div>
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={handleFinishExam} className="bg-green-600 hover:bg-green-700">
                          نعم، إنهاء الاختبار
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Button
                    variant="default"
                    onClick={handleNextQuestion}
                    disabled={currentQuestionIndex === examData.questions.length - 1}
                    className="flex items-center gap-1 px-4 py-2 text-sm disabled:opacity-50"
                  >
                    التالي
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Results Modal Overlay */}
        {showResults && examCompleted && (() => {
          const results = calculateResults();
          if (!results) return null;

          return (
            <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-y-auto">
              <div className="min-h-full flex items-center justify-center p-6">
                <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl border">
                  {/* Results Header */}
                  <div className={`text-center p-8 rounded-t-xl ${results.passed ? 'bg-gradient-to-r from-green-50 to-emerald-50' : 'bg-gradient-to-r from-red-50 to-rose-50'}`}>
                    <div className="flex justify-center mb-4">
                      {results.passed ? (
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                          <Trophy className="h-10 w-10 text-green-600" />
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                          <XCircle className="h-10 w-10 text-red-600" />
                        </div>
                      )}
                    </div>
                    <h2 className="text-3xl font-bold mb-2">
                      {results.passed ? 'مبروك! لقد نجحت في الاختبار' : 'للأسف، لم تحقق درجة النجاح'}
                    </h2>
                    <p className="text-lg text-muted-foreground">
                      {examData.exam.title}
                    </p>
                  </div>

                  {/* Results Statistics */}
                  <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      {/* Score */}
                      <Card className="text-center">
                        <CardContent className="p-6">
                          <div className={`text-4xl font-bold mb-2 ${results.passed ? 'text-green-600' : 'text-red-600'}`}>
                            {results.percentage}%
                          </div>
                          <p className="text-sm text-muted-foreground">النتيجة النهائية</p>
                        </CardContent>
                      </Card>

                      {/* Correct Answers */}
                      <Card className="text-center">
                        <CardContent className="p-6">
                          <div className="text-4xl font-bold text-green-600 mb-2">
                            {results.correctAnswers}
                          </div>
                          <p className="text-sm text-muted-foreground">إجابات صحيحة</p>
                        </CardContent>
                      </Card>

                      {/* Wrong Answers */}
                      <Card className="text-center">
                        <CardContent className="p-6">
                          <div className="text-4xl font-bold text-red-600 mb-2">
                            {results.totalQuestions - results.correctAnswers}
                          </div>
                          <p className="text-sm text-muted-foreground">إجابات خاطئة</p>
                        </CardContent>
                      </Card>

                      {/* Unanswered */}
                      <Card className="text-center">
                        <CardContent className="p-6">
                          <div className="text-4xl font-bold text-yellow-600 mb-2">
                            {results.unansweredQuestions}
                          </div>
                          <p className="text-sm text-muted-foreground">لم يتم الإجابة</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Progress Bar */}
                    <Card className="mb-8">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          تحليل النتائج
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span>الإجابات الصحيحة</span>
                              <span>{results.correctAnswers}/{results.totalQuestions}</span>
                            </div>
                            <Progress value={(results.correctAnswers / results.totalQuestions) * 100} className="h-3" />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                            <div className="p-4 bg-green-50 rounded-lg">
                              <div className="text-lg font-bold text-green-600">
                                {((results.correctAnswers / results.totalQuestions) * 100).toFixed(1)}%
                              </div>
                              <div className="text-sm text-green-700">صحيح</div>
                            </div>
                            <div className="p-4 bg-red-50 rounded-lg">
                              <div className="text-lg font-bold text-red-600">
                                {(((results.totalQuestions - results.correctAnswers - results.unansweredQuestions) / results.totalQuestions) * 100).toFixed(1)}%
                              </div>
                              <div className="text-sm text-red-700">خطأ</div>
                            </div>
                            <div className="p-4 bg-yellow-50 rounded-lg">
                              <div className="text-lg font-bold text-yellow-600">
                                {((results.unansweredQuestions / results.totalQuestions) * 100).toFixed(1)}%
                              </div>
                              <div className="text-sm text-yellow-700">لم يتم الإجابة</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Pass/Fail Status */}
                    <Card className={`border-2 ${results.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                      <CardContent className="p-6 text-center">
                        <div className={`text-lg font-bold ${results.passed ? 'text-green-700' : 'text-red-700'}`}>
                          {results.passed ? '✅ نجح' : '❌ راسب'}
                        </div>
                        <p className="text-sm mt-2">
                          درجة النجاح المطلوبة: {examData.exam.pass_percentage}%
                        </p>
                        <p className="text-sm">
                          درجتك: {results.percentage}%
                        </p>
                      </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex justify-center gap-4 mt-8">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowResults(false);
                          setExamCompleted(false);
                          setCurrentQuestionIndex(0);
                        }}
                        className="px-6"
                      >
                        مراجعة الإجابات
                      </Button>
                      <Button
                        onClick={() => onOpenChange(false)}
                        className="px-6"
                      >
                        إغلاق
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* No Results Message */}
        {examCompleted && !examData?.exam?.show_results_immediately && !showResults && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
            <Card className="w-full max-w-md mx-4">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">تم إنهاء الاختبار بنجاح!</h3>
                <p className="text-muted-foreground mb-6">
                  شكراً لك على إجراء الاختبار. ستكون النتائج متاحة لاحقاً.
                </p>
                <Button onClick={() => onOpenChange(false)} className="w-full">
                  إغلاق
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ExamPreview;