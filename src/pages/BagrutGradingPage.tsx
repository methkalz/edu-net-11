// صفحة تصحيح امتحانات البجروت للمعلم
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useBagrutGrading, QuestionGrade } from '@/hooks/useBagrutGrading';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Loader2,
  Save,
  Send,
  User,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { ParsedQuestion, ParsedSection } from '@/lib/bagrut/buildBagrutPreview';

export default function BagrutGradingPage() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();

  const [selectedAttempt, setSelectedAttempt] = useState<string | null>(null);
  const [selectedAttempts, setSelectedAttempts] = useState<string[]>([]);
  const [gradingDialogOpen, setGradingDialogOpen] = useState(false);

  const {
    attempts,
    isLoading,
    isError,
    fetchQuestionGrades,
    saveQuestionGrade,
    updateAttempt,
    publishResults,
    isSaving,
    isPublishing,
  } = useBagrutGrading(examId, userProfile?.school_id);

  // جلب معلومات الامتحان
  const { data: examData } = useQuery({
    queryKey: ['bagrut-exam-details', examId],
    queryFn: async () => {
      if (!examId) return null;

      const { data: exam } = await supabase
        .from('bagrut_exams')
        .select('*')
        .eq('id', examId)
        .single();

      const { data: sections } = await supabase
        .from('bagrut_exam_sections')
        .select('*')
        .eq('exam_id', examId)
        .order('order_index');

      const { data: questions } = await supabase
        .from('bagrut_questions')
        .select('*')
        .eq('exam_id', examId)
        .order('order_index');

      return { exam, sections, questions };
    },
    enabled: !!examId,
  });

  // إحصائيات
  const stats = useMemo(() => {
    const graded = attempts.filter(a => a.status === 'graded').length;
    const pending = attempts.filter(a => a.status === 'submitted').length;
    const published = attempts.filter(a => a.is_result_published).length;
    const avgScore = attempts.length > 0
      ? attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / attempts.length
      : 0;

    return { total: attempts.length, graded, pending, published, avgScore };
  }, [attempts]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAttempts(attempts.map(a => a.id));
    } else {
      setSelectedAttempts([]);
    }
  };

  const handleSelectAttempt = (attemptId: string, checked: boolean) => {
    if (checked) {
      setSelectedAttempts(prev => [...prev, attemptId]);
    } else {
      setSelectedAttempts(prev => prev.filter(id => id !== attemptId));
    }
  };

  const handlePublishSelected = () => {
    if (selectedAttempts.length > 0) {
      publishResults(selectedAttempts);
      setSelectedAttempts([]);
    }
  };

  const openGradingDialog = (attemptId: string) => {
    setSelectedAttempt(attemptId);
    setGradingDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (isError || !examId) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>فشل في تحميل بيانات التصحيح</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">تصحيح امتحان البجروت</h1>
            {examData?.exam && (
              <p className="text-muted-foreground">
                {examData.exam.title} - {examData.exam.exam_year}
              </p>
            )}
          </div>
        </div>
        {selectedAttempts.length > 0 && (
          <Button onClick={handlePublishSelected} disabled={isPublishing}>
            {isPublishing ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="ml-2 h-4 w-4" />
            )}
            نشر النتائج ({selectedAttempts.length})
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">إجمالي المحاولات</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-orange-500">{stats.pending}</p>
            <p className="text-sm text-muted-foreground">بانتظار التصحيح</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-500">{stats.graded}</p>
            <p className="text-sm text-muted-foreground">مصححة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-500">{stats.published}</p>
            <p className="text-sm text-muted-foreground">منشورة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{stats.avgScore.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground">متوسط الدرجات</p>
          </CardContent>
        </Card>
      </div>

      {/* Attempts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            محاولات الطلاب
          </CardTitle>
          <CardDescription>
            اضغط على "تصحيح" لمراجعة إجابات الطالب وتقييمها
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attempts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد محاولات للتصحيح بعد</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedAttempts.length === attempts.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>الطالب</TableHead>
                  <TableHead>تاريخ التقديم</TableHead>
                  <TableHead className="text-center">الحالة</TableHead>
                  <TableHead className="text-center">العلامة</TableHead>
                  <TableHead className="text-center">النشر</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts.map((attempt) => (
                  <TableRow key={attempt.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedAttempts.includes(attempt.id)}
                        onCheckedChange={(checked) => handleSelectAttempt(attempt.id, !!checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{attempt.student_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {attempt.submitted_at
                        ? format(new Date(attempt.submitted_at), 'dd MMM yyyy HH:mm', { locale: ar })
                        : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {attempt.status === 'graded' ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="ml-1 h-3 w-3" />
                          مصحح
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Clock className="ml-1 h-3 w-3" />
                          بانتظار التصحيح
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {attempt.percentage !== null ? (
                        <span className="font-mono font-bold">
                          {attempt.percentage.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {attempt.is_result_published ? (
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          منشور
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          غير منشور
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openGradingDialog(attempt.id)}
                      >
                        <Eye className="ml-1 h-4 w-4" />
                        تصحيح
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Grading Dialog */}
      {selectedAttempt && (
        <GradingDialog
          open={gradingDialogOpen}
          onClose={() => {
            setGradingDialogOpen(false);
            setSelectedAttempt(null);
          }}
          attemptId={selectedAttempt}
          attempt={attempts.find(a => a.id === selectedAttempt)!}
          examData={examData}
          userId={user?.id || ''}
          onSave={updateAttempt}
          fetchQuestionGrades={fetchQuestionGrades}
          saveQuestionGrade={saveQuestionGrade}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}

// Dialog component for grading individual attempt
interface GradingDialogProps {
  open: boolean;
  onClose: () => void;
  attemptId: string;
  attempt: any;
  examData: any;
  userId: string;
  onSave: (data: any) => void;
  fetchQuestionGrades: (attemptId: string) => Promise<QuestionGrade[]>;
  saveQuestionGrade: (grade: any) => void;
  isSaving: boolean;
}

function GradingDialog({
  open,
  onClose,
  attemptId,
  attempt,
  examData,
  userId,
  onSave,
  fetchQuestionGrades,
  saveQuestionGrade,
  isSaving,
}: GradingDialogProps) {
  const [questionGrades, setQuestionGrades] = useState<Record<string, QuestionGrade>>({});
  const [teacherFeedback, setTeacherFeedback] = useState(attempt?.teacher_feedback || '');
  const [publishResult, setPublishResult] = useState(attempt?.is_result_published || false);
  const [isLoadingGrades, setIsLoadingGrades] = useState(true);

  useEffect(() => {
    const loadGrades = async () => {
      setIsLoadingGrades(true);
      try {
        const grades = await fetchQuestionGrades(attemptId);
        const gradesMap: Record<string, QuestionGrade> = {};
        grades.forEach(g => {
          gradesMap[g.question_id] = g;
        });
        setQuestionGrades(gradesMap);
      } catch (error) {
        console.error('Failed to load grades', error);
      }
      setIsLoadingGrades(false);
    };

    if (open && attemptId) {
      loadGrades();
    }
  }, [open, attemptId, fetchQuestionGrades]);

  const questions = examData?.questions || [];
  const answers = attempt?.answers || {};

  const updateQuestionGrade = (questionId: string, field: string, value: any) => {
    setQuestionGrades(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        attempt_id: attemptId,
        question_id: questionId,
        [field]: value,
      },
    }));
  };

  const calculateTotalScore = () => {
    let total = 0;
    let maxTotal = 0;
    questions.forEach((q: any) => {
      const grade = questionGrades[q.id];
      if (grade?.final_score !== undefined && grade?.final_score !== null) {
        total += grade.final_score;
      } else if (grade?.manual_score !== undefined && grade?.manual_score !== null) {
        total += grade.manual_score;
      }
      maxTotal += q.points || 0;
    });
    return { total, maxTotal, percentage: maxTotal > 0 ? (total / maxTotal) * 100 : 0 };
  };

  const handleSave = () => {
    // حفظ علامات الأسئلة
    Object.values(questionGrades).forEach(grade => {
      if (grade.question_id) {
        saveQuestionGrade({
          ...grade,
          graded_by: userId,
          final_score: grade.manual_score ?? grade.auto_score ?? 0,
        });
      }
    });

    // حفظ المحاولة
    const { total, maxTotal, percentage } = calculateTotalScore();
    onSave({
      attemptId,
      score: total,
      maxScore: maxTotal,
      percentage,
      teacherFeedback,
      gradedBy: userId,
      markAsGraded: true,
      publishResult,
    });
  };

  const scores = calculateTotalScore();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>تصحيح إجابات: {attempt?.student_name}</span>
            <Badge variant={scores.percentage >= 55 ? 'default' : 'destructive'}>
              {scores.total} / {scores.maxTotal} ({scores.percentage.toFixed(1)}%)
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {isLoadingGrades ? (
            <div className="space-y-4 py-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {questions.map((question: any, index: number) => {
                const answer = answers[question.id];
                const grade = questionGrades[question.id] || {};

                return (
                  <Card key={question.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">
                          سؤال {question.question_number} ({question.points} علامة)
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">العلامة:</span>
                          <Input
                            type="number"
                            min={0}
                            max={question.points}
                            value={(grade as any).manual_score ?? ''}
                            onChange={(e) => updateQuestionGrade(
                              question.id,
                              'manual_score',
                              e.target.value ? parseInt(e.target.value) : null
                            )}
                            className="w-20 h-8"
                          />
                          <span className="text-sm">/ {question.points}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">السؤال:</p>
                        <p className="text-sm">{question.question_text}</p>
                      </div>

                      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <p className="text-sm font-medium mb-1">إجابة الطالب:</p>
                        <p className="text-sm">
                          {typeof answer?.answer === 'object'
                            ? JSON.stringify(answer.answer, null, 2)
                            : answer?.answer || <span className="text-muted-foreground italic">لم يجب</span>}
                        </p>
                      </div>

                      {question.correct_answer && (
                        <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                          <p className="text-sm font-medium mb-1">الإجابة الصحيحة:</p>
                          <p className="text-sm">{question.correct_answer}</p>
                        </div>
                      )}

                      <div>
                        <label className="text-sm font-medium">ملاحظات على هذا السؤال:</label>
                        <Textarea
                          value={(grade as any).teacher_feedback || ''}
                          onChange={(e) => updateQuestionGrade(question.id, 'teacher_feedback', e.target.value)}
                          placeholder="ملاحظات اختيارية..."
                          className="mt-1 h-16"
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              <Separator />

              {/* التعليق العام */}
              <div>
                <label className="text-sm font-medium">تعليق عام على الامتحان:</label>
                <Textarea
                  value={teacherFeedback}
                  onChange={(e) => setTeacherFeedback(e.target.value)}
                  placeholder="تعليق عام للطالب..."
                  className="mt-1"
                />
              </div>

              {/* نشر النتيجة */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="publish"
                  checked={publishResult}
                  onCheckedChange={(c) => setPublishResult(!!c)}
                />
                <label htmlFor="publish" className="text-sm">
                  نشر النتيجة للطالب فوراً
                </label>
              </div>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="ml-2 h-4 w-4" />
                حفظ التصحيح
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
