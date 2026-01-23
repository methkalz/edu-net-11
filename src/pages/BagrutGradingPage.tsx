// صفحة تصحيح امتحانات البجروت للمعلم
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useBagrutGrading, QuestionGrade } from '@/hooks/useBagrutGrading';
import { supabase } from '@/integrations/supabase/client';
import { buildBagrutPreviewFromDb, type ParsedQuestion, type ParsedSection } from '@/lib/bagrut/buildBagrutPreview';
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

  // بناء الهيكل المنظم للامتحان
  const structuredExam = useMemo(() => {
    if (!examData?.exam || !examData?.sections || !examData?.questions) {
      return null;
    }
    try {
      const { exam } = buildBagrutPreviewFromDb({
        exam: { ...examData.exam, id: examData.exam.id },
        sections: examData.sections,
        questions: examData.questions,
      });
      return exam;
    } catch (e) {
      console.error('Failed to build exam structure', e);
      return null;
    }
  }, [examData]);

  // فلترة الأقسام بناءً على اختيارات الطالب
  const relevantSections = useMemo(() => {
    if (!structuredExam?.sections) return [];
    
    const selectedSectionIds = attempt?.selected_section_ids || [];
    
    // إذا لم يختر الطالب أقسام محددة، نعرض جميع الأقسام
    if (selectedSectionIds.length === 0) {
      return structuredExam.sections;
    }
    
    // الأقسام الإلزامية + الأقسام المختارة
    return structuredExam.sections.filter(
      s => s.section_type === 'mandatory' || selectedSectionIds.includes(s.section_db_id || '')
    );
  }, [structuredExam, attempt?.selected_section_ids]);

  const answers = attempt?.answers || {};

  // جمع الأسئلة الورقية فقط (بدون أسئلة لها فرعيات) لتجنب الاحتساب المزدوج
  const allQuestions = useMemo(() => {
    const result: ParsedQuestion[] = [];
    const collectLeafQuestions = (questions: ParsedQuestion[]) => {
      questions.forEach(q => {
        // إذا كان للسؤال أسئلة فرعية، نجمع الفرعية فقط
        if (q.sub_questions?.length) {
          collectLeafQuestions(q.sub_questions);
        } else {
          // سؤال ورقي - نضيفه للحساب
          result.push(q);
        }
      });
    };
    relevantSections.forEach(s => collectLeafQuestions(s.questions));
    return result;
  }, [relevantSections]);

  // دالة تنسيق إجابة الطالب حسب نوع السؤال
  const formatStudentAnswer = (question: ParsedQuestion, answer: any): React.ReactNode => {
    if (!answer?.answer) {
      return <span className="text-muted-foreground italic">لم يجب</span>;
    }

    const value = answer.answer;

    // 1. إجابات الجداول
    if (question.question_type === 'fill_table' && typeof value === 'object' && question.table_data) {
      const tableData = question.table_data;
      if (!tableData.rows || !tableData.headers) {
        return <span className="text-muted-foreground">إجابة جدول غير صالحة</span>;
      }
      
      return (
        <table className="w-full border-collapse text-sm mt-2">
          <thead>
            <tr>
              {tableData.headers.map((h: string, i: number) => (
                <th key={i} className="border p-2 bg-muted/30 text-right text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.rows.map((row: string[], rowIdx: number) => (
              <tr key={rowIdx}>
                {row.map((cell: string, colIdx: number) => {
                  const isInput = tableData.input_columns?.includes(colIdx);
                  const studentAnswer = value[`${rowIdx}-${colIdx}`] || value[`cell_${rowIdx}_${colIdx}`];
                  return (
                    <td key={colIdx} className="border p-2 text-xs">
                      {isInput ? (
                        <span className="font-medium text-primary bg-primary/10 px-1 rounded">
                          {studentAnswer || '—'}
                        </span>
                      ) : cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    // 2. ملء الفراغات
    if (question.question_type === 'fill_blank' && typeof value === 'object') {
      const entries = Object.entries(value);
      if (entries.length === 0) {
        return <span className="text-muted-foreground italic">لم يجب</span>;
      }
      return (
        <div className="space-y-1">
          {entries.map(([blankId, ans], idx) => (
            <div key={blankId} className="flex gap-2 text-sm">
              <span className="text-muted-foreground">فراغ {idx + 1}:</span>
              <span className="font-medium">{String(ans) || '—'}</span>
            </div>
          ))}
        </div>
      );
    }

    // 3. MCQ - عرض الخيار المختار
    if (question.question_type === 'mcq' && question.choices) {
      const choiceIndex = typeof value === 'number' ? value - 1 : parseInt(value) - 1;
      const choice = question.choices[choiceIndex];
      if (choice) {
        return (
          <span>
            <span className="text-muted-foreground">الخيار {choiceIndex + 1}:</span>{' '}
            <span className="font-medium">{choice.text}</span>
          </span>
        );
      }
    }

    // 4. صح/خطأ
    if (question.question_type === 'true_false') {
      const boolValue = value === true || value === 'true' || value === 'صح';
      return <span className="font-medium">{boolValue ? 'صح ✓' : 'خطأ ✗'}</span>;
    }

    // 5. نص عادي
    if (typeof value === 'string') {
      return <p className="whitespace-pre-wrap">{value}</p>;
    }

    // fallback
    if (typeof value === 'object') {
      return (
        <pre className="text-xs overflow-auto bg-muted/30 p-2 rounded max-h-24" dir="ltr">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }

    return <span>{String(value)}</span>;
  };

  // دالة تنسيق الإجابة الصحيحة
  const formatCorrectAnswer = (question: ParsedQuestion): React.ReactNode => {
    // للجداول
    if (question.question_type === 'fill_table' && question.table_data?.correct_answers) {
      const { correct_answers, headers, rows, input_columns } = question.table_data;
      return (
        <table className="w-full border-collapse text-sm mt-2">
          <thead>
            <tr>
              {headers?.map((h: string, i: number) => (
                <th key={i} className="border p-2 bg-green-100 dark:bg-green-950/50 text-right text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows?.map((row: string[], rowIdx: number) => (
              <tr key={rowIdx}>
                {row.map((cell: string, colIdx: number) => {
                  const isInput = input_columns?.includes(colIdx);
                  const correctAns = correct_answers?.[`${rowIdx}-${colIdx}`] || correct_answers?.[`cell_${rowIdx}_${colIdx}`];
                  return (
                    <td key={colIdx} className="border p-2 text-xs">
                      {isInput && correctAns ? (
                        <span className="font-bold text-green-600">{correctAns}</span>
                      ) : cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    // للفراغات
    if (question.question_type === 'fill_blank' && question.blanks) {
      return (
        <div className="space-y-1">
          {question.blanks.map((blank: any, i: number) => (
            <div key={blank.id || i} className="flex gap-2 text-sm">
              <span className="text-muted-foreground">فراغ {i + 1}:</span>
              <span className="font-bold text-green-600">{blank.correct_answer}</span>
            </div>
          ))}
        </div>
      );
    }

    // MCQ أو multiple_choice - دعم كلا الاسمين
    if ((question.question_type === 'mcq' || question.question_type === 'multiple_choice') && question.choices) {
      const correctChoice = question.choices.find((c: any) => c.is_correct);
      if (correctChoice) {
        const idx = question.choices.indexOf(correctChoice) + 1;
        return (
          <span>
            <span className="text-muted-foreground">الخيار {idx}:</span>{' '}
            <span className="font-bold text-green-600">{correctChoice.text}</span>
          </span>
        );
      }
    }

    // صح/خطأ - دعم جميع الصيغ
    if (question.question_type === 'true_false') {
      // أولاً: التحقق من choices إذا كانت موجودة
      if (question.choices && question.choices.length > 0) {
        const correctChoice = question.choices.find((c: any) => c.is_correct);
        if (correctChoice) {
          const isTrue = correctChoice.text === 'صح' || String(correctChoice.id) === '1';
          return <span className="font-bold text-green-600">{isTrue ? 'صح ✓' : 'خطأ ✗'}</span>;
        }
      }
      
      // ثانياً: التحقق من correct_answer
      if (question.correct_answer) {
        const answer = String(question.correct_answer).toLowerCase();
        // دعم: "صح", "خطأ", "true", "false", "1", "2", "صحيح", "غير صحيح"
        const isTrue = answer === 'true' || answer === 'صح' || answer === '1' || answer === 'صحيح';
        return <span className="font-bold text-green-600">{isTrue ? 'صح ✓' : 'خطأ ✗'}</span>;
      }
    }

    // نص عادي
    if (question.correct_answer) {
      return <p className="whitespace-pre-wrap font-medium text-green-600">{question.correct_answer}</p>;
    }

    return null;
  };

  // دالة مساعدة للتحقق من وجود إجابة صحيحة
  const hasCorrectAnswer = (question: ParsedQuestion): boolean => {
    // MCQ أو multiple_choice مع خيار صحيح
    if ((question.question_type === 'mcq' || question.question_type === 'multiple_choice') && question.choices) {
      return question.choices.some((c: any) => c.is_correct);
    }
    
    // صح/خطأ مع إجابة
    if (question.question_type === 'true_false') {
      if (question.choices?.some((c: any) => c.is_correct)) return true;
      if (question.correct_answer) return true;
      return false;
    }
    
    // جداول
    if (question.question_type === 'fill_table' && question.table_data?.correct_answers) {
      return Object.keys(question.table_data.correct_answers).length > 0;
    }
    
    // فراغات
    if (question.question_type === 'fill_blank' && question.blanks) {
      return question.blanks.some((b: any) => b.correct_answer);
    }
    
    // إجابة نصية
    return !!question.correct_answer;
  };

  const updateQuestionGrade = (questionId: string, field: string, value: any, maxScore: number) => {
    setQuestionGrades(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        attempt_id: attemptId,
        question_id: questionId,
        max_score: maxScore,
        [field]: value,
      },
    }));
  };

  const calculateTotalScore = () => {
    let total = 0;
    let maxTotal = 0;
    allQuestions.forEach((q) => {
      const grade = questionGrades[q.question_db_id || ''];
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

  // مكون عرض سؤال واحد (يدعم الأسئلة الفرعية)
  const QuestionCard = ({ question, depth = 0 }: { question: ParsedQuestion; depth?: number }) => {
    const questionId = question.question_db_id || '';
    const answer = answers[questionId];
    const grade = questionGrades[questionId] || {};

    return (
      <div className={depth > 0 ? 'mr-4 border-r-2 border-muted pr-4' : ''}>
        <Card className={depth > 0 ? 'border-dashed' : ''}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                سؤال {question.question_number} ({question.points} علامة)
                <Badge variant="outline" className="mr-2 text-xs">
                  {question.question_type}
                </Badge>
              </CardTitle>
              {question.points > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">العلامة:</span>
                  <Input
                    type="number"
                    min={0}
                    max={question.points}
                    value={(grade as any).manual_score ?? ''}
                    onChange={(e) => updateQuestionGrade(
                      questionId,
                      'manual_score',
                      e.target.value ? parseInt(e.target.value) : null,
                      question.points
                    )}
                    className="w-20 h-8"
                  />
                  <span className="text-sm">/ {question.points}</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-1">السؤال:</p>
              <p className="text-sm whitespace-pre-wrap">{question.question_text}</p>
              {question.image_url && (
                <img src={question.image_url} alt="صورة السؤال" className="mt-2 max-h-48 rounded" />
              )}
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <p className="text-sm font-medium mb-1">إجابة الطالب:</p>
              <div className="text-sm">
                {formatStudentAnswer(question, answer)}
              </div>
            </div>

            {hasCorrectAnswer(question) && (
              <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <p className="text-sm font-medium mb-1">الإجابة الصحيحة:</p>
                <div className="text-sm">
                  {formatCorrectAnswer(question)}
                </div>
              </div>
            )}

            {question.points > 0 && (
              <div>
                <label className="text-sm font-medium">ملاحظات على هذا السؤال:</label>
                <Textarea
                  value={(grade as any).teacher_feedback || ''}
                  onChange={(e) => updateQuestionGrade(questionId, 'teacher_feedback', e.target.value, question.points)}
                  placeholder="ملاحظات اختيارية..."
                  className="mt-1 h-16"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* الأسئلة الفرعية */}
        {question.sub_questions && question.sub_questions.length > 0 && (
          <div className="mt-3 space-y-3">
            {question.sub_questions.map((subQ) => (
              <QuestionCard key={subQ.question_db_id} question={subQ} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col gap-0 p-0">
        {/* Header - Fixed */}
        <DialogHeader className="p-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <span>تصحيح إجابات: {attempt?.student_name}</span>
            <Badge variant={scores.percentage >= 55 ? 'default' : 'destructive'}>
              {scores.total} / {scores.maxTotal} ({scores.percentage.toFixed(1)}%)
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6">
            {isLoadingGrades ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {relevantSections.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>لا توجد أسئلة للتصحيح</AlertDescription>
                  </Alert>
                ) : (
                  relevantSections.map((section) => (
                    <div key={section.section_db_id} className="space-y-4">
                      {/* عنوان القسم */}
                      <div className="bg-muted/50 p-4 rounded-lg border">
                        <h3 className="font-bold text-lg">
                          قسم {section.section_number}: {section.section_title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {section.total_points} علامة
                          {section.specialization_label && (
                            <span className="mr-2">• {section.specialization_label}</span>
                          )}
                        </p>
                        {section.instructions && (
                          <p className="text-sm text-muted-foreground mt-1">{section.instructions}</p>
                        )}
                      </div>

                      {/* أسئلة القسم */}
                      <div className="space-y-4">
                        {section.questions.map((question) => (
                          <QuestionCard key={question.question_db_id} question={question} />
                        ))}
                      </div>
                    </div>
                  ))
                )}

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
          </div>
        </ScrollArea>

        {/* Footer - Fixed */}
        <DialogFooter className="p-6 pt-4 border-t shrink-0 gap-2">
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
