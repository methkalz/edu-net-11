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
      <DialogContent className="max-w-[98vw] max-h-[98vh] overflow-hidden p-0 m-2 gap-0">
        {/* Header */}
        <div className="border-b bg-gradient-to-br from-primary/10 via-primary/5 to-background p-4">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-3">
                <div className="p-2 bg-primary rounded-xl shadow-lg">
                  <FileText className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-l from-primary to-primary/70 bg-clip-text text-transparent">
                    {examData.exam.title}
                  </h2>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    معاينة الاختبار
                  </p>
                </div>
              </DialogTitle>
              <Badge className="px-3 py-1.5 bg-amber-500/10 text-amber-700 border-amber-200 hover:bg-amber-500/20 transition-colors">
                <AlertCircle className="h-3.5 w-3.5 ml-1.5" />
                معاينة فقط
              </Badge>
            </div>
          </DialogHeader>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-gradient-to-b from-muted/50 to-background border-b">
          <div className="flex items-center justify-between text-sm mb-2.5">
            <span className="font-semibold text-foreground">تقدم الإجابة</span>
            <span className="text-muted-foreground font-medium">{Object.keys(answers).length} من {examData.questions.length} سؤال</span>
          </div>
          <Progress value={getProgressPercentage()} className="h-2.5" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 h-[calc(95vh-12rem)] overflow-hidden">
          {/* Sidebar */}
          <div className="lg:col-span-1 bg-gradient-to-b from-muted/30 to-background border-r p-3 space-y-2 overflow-hidden">
            {/* Timer Card */}
            <Card className="bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10 border-2 border-blue-200/50 shadow-sm">
              <CardHeader className="pb-2 pt-2">
                <CardTitle className="text-xs flex items-center gap-2 font-bold">
                  <div className="p-1 bg-blue-500/20 rounded-lg">
                    <Timer className="h-3 w-3 text-blue-600" />
                  </div>
                  الوقت المتبقي
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-2">
                <div className={`text-xl font-bold text-center ${getTimeColor()}`}>
                  {formatTime(timeRemaining)}
                </div>
                <div className="text-xs text-center text-muted-foreground">
                  من {examData.exam.duration_minutes}د
                </div>
              </CardContent>
            </Card>

            {/* Question Map */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-2 pt-2">
                <CardTitle className="text-xs flex items-center justify-between font-bold">
                  <span>خريطة الأسئلة</span>
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {Object.keys(answers).length}/{examData.questions.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-2 space-y-2">
                <div className="grid grid-cols-5 gap-1">
                  {examData.questions.map((_, index: number) => (
                    <button
                      key={index}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`w-7 h-7 text-xs font-bold rounded-md border transition-all ${getQuestionStatusColor(index)}`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Exam Info */}
            <Card className="bg-gradient-to-br from-slate-500/5 via-gray-500/5 to-zinc-500/5 border shadow-sm">
              <CardHeader className="pb-2 pt-2">
                <CardTitle className="text-xs font-bold">تفاصيل الاختبار</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-xs pt-0 pb-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">الأسئلة:</span>
                  <span className="font-bold">{examData.questions.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">المدة:</span>
                  <span className="font-bold">{examData.exam.duration_minutes}د</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">النجاح:</span>
                  <span className="font-bold text-primary">{examData.exam.pass_percentage}%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question Content */}
          <div className="lg:col-span-3 bg-gradient-to-b from-background to-muted/20 overflow-hidden flex flex-col">
            <div className="p-4 space-y-3 flex-1 overflow-hidden">
              {currentQuestion && (
                <div className="space-y-3 h-full flex flex-col">
                  {/* Question Header */}
                  <Card className="border-2 shadow-sm bg-gradient-to-br from-primary/5 via-background to-primary/5">
                    <CardHeader className="pb-2 pt-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground rounded-lg w-8 h-8 flex items-center justify-center text-sm font-bold shadow-md">
                            {currentQuestionIndex + 1}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-foreground">
                              السؤال {currentQuestionIndex + 1} من {examData.questions.length}
                            </h3>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge 
                            variant={
                              currentQuestion.difficulty_level === 'easy' ? 'default' :
                              currentQuestion.difficulty_level === 'medium' ? 'secondary' :
                              'destructive'
                            }
                            className="px-2 py-0.5 text-xs"
                          >
                            {currentQuestion.difficulty_level === 'easy' ? '🟢' :
                             currentQuestion.difficulty_level === 'medium' ? '🟡' : '🔴'}
                          </Badge>
                          <Badge variant="outline" className="px-2 py-0.5 text-xs border">
                            {currentQuestion.points} علامة
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2 pb-3">
                      {/* Question Text */}
                      <div className="text-lg font-bold leading-relaxed p-3 bg-background rounded-lg border">
                        {currentQuestion.question_text}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Answer Options */}
                  <Card className="border-2 shadow-sm flex-1 overflow-hidden flex flex-col">
                    <CardHeader className="pb-2 pt-3">
                      <h4 className="font-bold text-base flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        اختر الإجابة الصحيحة
                      </h4>
                    </CardHeader>
                    <CardContent className="space-y-2 overflow-y-auto flex-1 pb-3">

                      {/* Multiple Choice */}
                      {currentQuestion.question_type === 'multiple_choice' && (
                        <RadioGroup
                          value={answers[currentQuestionIndex] || ''}
                          onValueChange={(value) => handleAnswerChange(currentQuestionIndex, value)}
                          className="space-y-2"
                        >
                          {currentQuestion.choices?.map((choice, index: number) => (
                            <label 
                              key={index}
                              htmlFor={`choice-${index}`}
                              className={`
                                flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer
                                transition-all duration-200 hover:shadow-md
                                ${answers[currentQuestionIndex] === (typeof choice === 'string' ? choice : choice.text)
                                  ? 'border-primary bg-primary/10 shadow-sm' 
                                  : 'border-border hover:border-primary/50 bg-background'
                                }
                              `}
                            >
                              <div className="flex items-center gap-2.5 flex-1">
                                <span className={`
                                  w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors shrink-0
                                  ${answers[currentQuestionIndex] === (typeof choice === 'string' ? choice : choice.text)
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-muted text-muted-foreground'
                                  }
                                `}>
                                  {String.fromCharCode(65 + index)}
                                </span>
                                <span className="text-base font-medium flex-1">{typeof choice === 'string' ? choice : choice.text}</span>
                              </div>
                              <RadioGroupItem 
                                value={typeof choice === 'string' ? choice : choice.text}
                                id={`choice-${index}`} 
                                className="shrink-0"
                              />
                            </label>
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
                          <label 
                            htmlFor="true"
                            className={`
                              flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer
                              transition-all duration-200 hover:shadow-md
                              ${answers[currentQuestionIndex] === 'true' 
                                ? 'border-green-500 bg-green-50 shadow-sm' 
                                : 'border-border hover:border-green-400 bg-background'
                              }
                            `}
                          >
                            <div className="flex items-center gap-2.5 flex-1">
                              <span className={`
                                w-7 h-7 rounded-full flex items-center justify-center text-base font-bold transition-colors shrink-0
                                ${answers[currentQuestionIndex] === 'true'
                                  ? 'bg-green-500 text-white' 
                                  : 'bg-green-100 text-green-700'
                                }
                              `}>✓</span>
                              <span className="text-base font-bold">صحيح</span>
                            </div>
                            <RadioGroupItem value="true" id="true" className="shrink-0" />
                          </label>
                          <label 
                            htmlFor="false"
                            className={`
                              flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer
                              transition-all duration-200 hover:shadow-md
                              ${answers[currentQuestionIndex] === 'false' 
                                ? 'border-red-500 bg-red-50 shadow-sm' 
                                : 'border-border hover:border-red-400 bg-background'
                              }
                            `}
                          >
                            <div className="flex items-center gap-2.5 flex-1">
                              <span className={`
                                w-7 h-7 rounded-full flex items-center justify-center text-base font-bold transition-colors shrink-0
                                ${answers[currentQuestionIndex] === 'false'
                                  ? 'bg-red-500 text-white' 
                                  : 'bg-red-100 text-red-700'
                                }
                              `}>✗</span>
                              <span className="text-base font-bold">خطأ</span>
                            </div>
                            <RadioGroupItem value="false" id="false" className="shrink-0" />
                          </label>
                        </RadioGroup>
                      )}

                      {/* Short Answer */}
                      {currentQuestion.question_type === 'short_answer' && (
                        <Textarea
                          value={answers[currentQuestionIndex] || ''}
                          onChange={(e) => handleAnswerChange(currentQuestionIndex, e.target.value)}
                          placeholder="اكتب إجابتك هنا..."
                          className="min-h-[100px] text-base border-2 focus:border-primary rounded-lg p-3 resize-none"
                        />
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Sidebar */}
          <div className="lg:col-span-1 bg-gradient-to-b from-muted/20 to-background border-l p-3 flex flex-col justify-between overflow-hidden">
            {/* Navigation Buttons */}
            <div className="space-y-2">
              <Button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                variant="outline"
                className="w-full text-xs h-9 font-semibold border hover:scale-105 transition-transform"
              >
                <ArrowRight className="h-3 w-3 ml-1.5" />
                السابق
              </Button>
              
              <Button
                onClick={handleNextQuestion}
                disabled={isLastQuestion}
                className="w-full text-xs h-9 font-semibold hover:scale-105 transition-transform shadow-sm"
              >
                التالي
                <ArrowLeft className="h-3 w-3 mr-1.5" />
              </Button>

              {/* Finish Exam Dialog */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="default"
                    className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-xs h-10 font-bold shadow-md hover:scale-105 transition-all mt-2"
                  >
                    <CheckCircle className="h-4 w-4 ml-1.5" />
                    إنهاء
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-amber-500/10 rounded-lg">
                        <AlertCircle className="h-6 w-6 text-amber-600" />
                      </div>
                      تأكيد إنهاء الاختبار
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-right text-base mt-4">
                      هل أنت متأكد من أنك تريد إنهاء الاختبار؟
                      <div className="mt-4 p-4 bg-muted rounded-xl border-2">
                        <div className="text-sm space-y-2.5 text-foreground">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">الأسئلة المجاب عليها:</span>
                            <span className="font-bold text-primary">{Object.keys(answers).length} من {examData?.questions?.length}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">الأسئلة المتبقية:</span>
                            <span className="font-bold">{(examData?.questions?.length || 0) - Object.keys(answers).length}</span>
                          </div>
                          {(examData?.questions?.length || 0) - Object.keys(answers).length > 0 && (
                            <div className="pt-2 border-t text-amber-600 font-semibold flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              لديك أسئلة لم تتم الإجابة عليها
                            </div>
                          )}
                        </div>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel className="font-semibold">إلغاء</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleFinishExam} 
                      className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 font-bold"
                    >
                      نعم، إنهاء الاختبار
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Progress Summary */}
            <Card className="mt-2 bg-gradient-to-br from-primary/5 to-background border">
              <CardContent className="pt-2 pb-2 space-y-2">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-0.5">السؤال</div>
                  <div className="text-xl font-bold bg-gradient-to-l from-primary to-primary/70 bg-clip-text text-transparent">
                    {currentQuestionIndex + 1} / {examData.questions.length}
                  </div>
                </div>
                
                {answers[currentQuestionIndex] && (
                  <Badge className="w-full justify-center bg-green-500/10 text-green-700 border-green-200 hover:bg-green-500/20 py-1 text-xs">
                    <CheckCircle className="h-3 w-3 ml-1" />
                    تم الإجابة
                  </Badge>
                )}
              </CardContent>
            </Card>
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