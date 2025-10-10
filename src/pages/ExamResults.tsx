import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudentExams } from '@/hooks/useStudentExams';
import { ExamQuestion } from '@/components/exam/ExamQuestion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Home
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function ExamResults() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { fetchAttemptDetails } = useStudentExams();
  
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    if (attemptId) {
      loadResults();
    }
  }, [attemptId]);

  const loadResults = async () => {
    if (!attemptId) return;
    
    setLoading(true);
    const data = await fetchAttemptDetails(attemptId);
    
    if (data) {
      setAttempt(data.attempt);
      setQuestions(data.questions || []);
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-lg text-muted-foreground">جاري تحميل النتائج...</p>
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" dir="rtl">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">لا توجد نتائج لعرضها</p>
            <Button onClick={() => navigate('/dashboard')}>
              العودة للوحة التحكم
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const percentage = Math.round((attempt.total_score / attempt.max_score) * 100);
  const correctAnswers = questions.filter((q: any) => 
    q.student_answer === q.exam_questions?.correct_answer
  ).length;
  const totalQuestions = questions.length;

  const getPerformanceColor = (percent: number) => {
    if (percent >= 70) return 'text-green-600';
    if (percent >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (percent: number) => {
    if (percent >= 90) return { label: 'ممتاز', variant: 'default' as const };
    if (percent >= 70) return { label: 'جيد جداً', variant: 'secondary' as const };
    if (percent >= 50) return { label: 'جيد', variant: 'outline' as const };
    return { label: 'يحتاج تحسين', variant: 'destructive' as const };
  };

  const performanceBadge = getPerformanceBadge(percentage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8" dir="rtl">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <Trophy className="w-16 h-16 mx-auto text-amber-500 mb-4" />
          <h1 className="text-3xl font-bold mb-2">نتيجة الاختبار</h1>
          <p className="text-muted-foreground">{attempt.teacher_exams?.title}</p>
        </div>

        {/* Score Card */}
        <Card className="mb-8 border-2">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              {/* Main Score */}
              <div>
                <div className={`text-6xl font-bold mb-2 ${getPerformanceColor(percentage)}`}>
                  {attempt.total_score}/{attempt.max_score}
                </div>
                <div className="text-2xl font-semibold text-muted-foreground mb-4">
                  ({percentage}%)
                </div>
                <Badge {...performanceBadge} className="text-lg px-4 py-1">
                  {performanceBadge.label}
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="max-w-md mx-auto">
                <Progress value={percentage} className="h-4" />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t">
                <div>
                  <div className="flex items-center justify-center gap-2 text-green-600 mb-1">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-2xl font-bold">{correctAnswers}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">إجابات صحيحة</p>
                </div>
                
                <div>
                  <div className="flex items-center justify-center gap-2 text-red-600 mb-1">
                    <XCircle className="w-5 h-5" />
                    <span className="text-2xl font-bold">{totalQuestions - correctAnswers}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">إجابات خاطئة</p>
                </div>
                
                <div>
                  <div className="flex items-center justify-center gap-2 text-blue-600 mb-1">
                    <Clock className="w-5 h-5" />
                    <span className="text-lg font-bold">
                      {Math.round(
                        (new Date(attempt.finished_at).getTime() - new Date(attempt.started_at).getTime()) / 60000
                      )} د
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">الوقت المستغرق</p>
                </div>
              </div>

              {/* Time Info */}
              <div className="text-sm text-muted-foreground pt-4">
                تم الانتهاء {formatDistanceToNow(new Date(attempt.finished_at), {
                  addSuffix: true,
                  locale: ar
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Review Answers Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>مراجعة الإجابات</CardTitle>
              <Button
                variant="outline"
                onClick={() => setShowAnswers(!showAnswers)}
              >
                {showAnswers ? 'إخفاء الإجابات' : 'عرض الإجابات'}
              </Button>
            </div>
          </CardHeader>
          
          {showAnswers && (
            <CardContent className="space-y-6">
              {questions.map((q: any, index: number) => {
                const isCorrect = q.student_answer === q.exam_questions?.correct_answer;
                
                return (
                  <div key={q.id} className="space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                      {isCorrect ? (
                        <Badge className="bg-green-500">
                          <CheckCircle2 className="w-3 h-3 ml-1" />
                          صحيحة
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="w-3 h-3 ml-1" />
                          خاطئة
                        </Badge>
                      )}
                    </div>
                    
                    <ExamQuestion
                      question={{
                        ...q.exam_questions,
                        id: q.question_id
                      }}
                      questionNumber={index + 1}
                      totalQuestions={totalQuestions}
                      currentAnswer={q.student_answer}
                      onAnswerChange={() => {}}
                      showCorrectAnswer={true}
                      correctAnswer={q.exam_questions?.correct_answer}
                    />
                  </div>
                );
              })}
            </CardContent>
          )}
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
          >
            <Home className="w-4 h-4 ml-2" />
            العودة للوحة التحكم
          </Button>
          
          <Button onClick={() => navigate(-1)}>
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة للاختبارات
          </Button>
        </div>
      </div>
    </div>
  );
}