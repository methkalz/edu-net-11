import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudentExams } from '@/hooks/useStudentExams';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  Calendar,
  AlertCircle,
  Trophy,
  Play
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export const StudentExamsWidget: React.FC = () => {
  const { exams, myAttempts, loading, startExam } = useStudentExams();
  const navigate = useNavigate();
  const [startingExamId, setStartingExamId] = useState<string | null>(null);

  const handleStartExam = async (examId: string) => {
    setStartingExamId(examId);
    const attemptId = await startExam(examId);
    setStartingExamId(null);
    
    if (attemptId) {
      navigate(`/exam/${attemptId}`);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل الاختبارات...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            الاختبارات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="available">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="available">
                الاختبارات المتاحة ({exams.length})
              </TabsTrigger>
              <TabsTrigger value="attempts">
                محاولاتي ({myAttempts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="available" className="space-y-4 mt-4">
              {exams.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">لا توجد اختبارات متاحة حالياً</p>
                </div>
              ) : (
                exams.map((exam) => {
                  const canTakeExam = !exam.my_attempts_count || exam.my_attempts_count < exam.max_attempts;
                  const attemptsLeft = exam.max_attempts - (exam.my_attempts_count || 0);

                  return (
                    <Card key={exam.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-bold text-lg mb-2">{exam.title}</h3>
                            {exam.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {exam.description}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">
                              <Clock className="w-3 h-3 ml-1" />
                              {exam.duration_minutes} دقيقة
                            </Badge>
                            <Badge variant="secondary">
                              <FileText className="w-3 h-3 ml-1" />
                              {exam.total_questions} سؤال
                            </Badge>
                            <Badge variant="outline">
                              الصف {exam.grade_levels.join(', ')}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t">
                            <div className="space-y-1">
                              <div className="text-sm text-muted-foreground">
                                المحاولات المتبقية: {attemptsLeft}/{exam.max_attempts}
                              </div>
                              {exam.best_score > 0 && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Trophy className="w-4 h-4 text-amber-500" />
                                  <span className="font-semibold">أفضل درجة: {exam.best_score}/100</span>
                                </div>
                              )}
                            </div>

                            <Button
                              onClick={() => handleStartExam(exam.id)}
                              disabled={!canTakeExam || startingExamId === exam.id}
                              size="sm"
                            >
                              {startingExamId === exam.id ? (
                                'جاري البدء...'
                              ) : canTakeExam ? (
                                <>
                                  <Play className="w-4 h-4 ml-2" />
                                  ابدأ الاختبار
                                </>
                              ) : (
                                'استنفذت المحاولات'
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="attempts" className="space-y-4 mt-4">
              {myAttempts.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">لم تقم بأي محاولات بعد</p>
                </div>
              ) : (
                myAttempts.map((attempt) => {
                  const isCompleted = attempt.status === 'completed';
                  const percentage = Math.round((attempt.total_score / attempt.max_score) * 100);

                  return (
                    <Card key={attempt.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <h3 className="font-semibold">{attempt.exam_title}</h3>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDistanceToNow(new Date(attempt.started_at), {
                                  addSuffix: true,
                                  locale: ar
                                })}
                              </div>
                              
                              {isCompleted ? (
                                <div className="flex items-center gap-1 text-green-600">
                                  <CheckCircle className="w-4 h-4" />
                                  مكتمل
                                </div>
                              ) : (
                                <Badge variant="secondary">قيد التقدم</Badge>
                              )}
                            </div>

                            {isCompleted && (
                              <div className="flex items-center gap-3 mt-3">
                                <div className={`text-2xl font-bold ${
                                  percentage >= 70 ? 'text-green-600' :
                                  percentage >= 50 ? 'text-amber-600' :
                                  'text-red-600'
                                }`}>
                                  {attempt.total_score}/{attempt.max_score}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  ({percentage}%)
                                </div>
                              </div>
                            )}
                          </div>

                          {isCompleted && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/exam-results/${attempt.id}`)}
                            >
                              عرض النتائج
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};