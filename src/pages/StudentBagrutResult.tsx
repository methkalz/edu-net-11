// صفحة عرض نتائج امتحان البجروت للطالب
import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  AlertCircle,
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  FileText,
  Home,
  Loader2,
  Trophy,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import SafeHtml from '@/components/bagrut/SafeHtml';

// ====== بناء شجرة الأسئلة المتداخلة (N مستويات) ======
interface QuestionTreeNode {
  question: any;
  children: QuestionTreeNode[];
}

function buildQuestionTree(flatQuestions: any[]): QuestionTreeNode[] {
  const map = new Map<string, QuestionTreeNode>();
  const roots: QuestionTreeNode[] = [];

  flatQuestions.forEach(q => {
    map.set(q.id, { question: q, children: [] });
  });

  flatQuestions.forEach(q => {
    const node = map.get(q.id)!;
    if (q.parent_question_id && map.has(q.parent_question_id)) {
      map.get(q.parent_question_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortChildren = (nodes: QuestionTreeNode[]) => {
    nodes.sort((a, b) => (a.question.order_index || 0) - (b.question.order_index || 0));
    nodes.forEach(n => sortChildren(n.children));
  };
  sortChildren(roots);

  return roots;
}

// ====== مكون عرض سؤال عودي ======
function ResultQuestionNode({
  node,
  depth,
  gradesMap,
  answers,
}: {
  node: QuestionTreeNode;
  depth: number;
  gradesMap: Map<string, any>;
  answers: Record<string, any>;
}) {
  const { question, children } = node;
  const grade = gradesMap.get(question.id);
  const studentAnswer = answers[question.id];
  const isParent = children.length > 0;

  const getAggregatedScore = (n: QuestionTreeNode): { score: number; max: number } => {
    if (n.children.length > 0) {
      return n.children.reduce(
        (acc, child) => {
          const childScore = getAggregatedScore(child);
          return { score: acc.score + childScore.score, max: acc.max + childScore.max };
        },
        { score: 0, max: 0 }
      );
    }
    const g = gradesMap.get(n.question.id);
    return { score: g?.final_score ?? 0, max: n.question.points || 0 };
  };

  const { score, max } = getAggregatedScore(node);
  const isCorrect = max > 0 && score === max;
  const isPartial = score > 0 && score < max;

  return (
    <div style={{ marginRight: depth * 20 }}>
      <div
        className={`p-3 rounded-lg border mb-2 ${
          depth === 0 ? 'border-border' : 'border-border/50'
        } ${
          isCorrect
            ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
            : isPartial
            ? 'bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
            : 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {isCorrect ? (
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            ) : isPartial ? (
              <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            )}
            <span className={`font-medium ${depth > 0 ? 'text-sm' : ''}`}>
              سؤال {question.question_number}
              {question.sub_question_label ? ` (${question.sub_question_label})` : ''}
            </span>
          </div>
          <Badge variant={isCorrect ? 'default' : isPartial ? 'secondary' : 'destructive'} className="text-xs">
            {score} / {max}
          </Badge>
        </div>

        <SafeHtml html={question.question_text} className="text-sm mb-2 text-muted-foreground" />

        {!isParent && (
          <div className="grid gap-1.5 text-sm">
            <div className="flex gap-2">
              <span className="font-medium min-w-[80px] text-muted-foreground">إجابتك:</span>
              <span className="text-foreground">
                {typeof studentAnswer?.answer === 'object'
                  ? JSON.stringify(studentAnswer.answer)
                  : studentAnswer?.answer || <span className="text-muted-foreground italic">لم تجب</span>}
              </span>
            </div>

            {question.correct_answer && (
              <div className="flex gap-2">
                <span className="font-medium min-w-[80px] text-muted-foreground">الصحيحة:</span>
                <span className="text-green-600 dark:text-green-400">{question.correct_answer}</span>
              </div>
            )}

            {question.answer_explanation && (
              <div className="mt-2 p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded border border-emerald-200 dark:border-emerald-800">
                <span className="font-medium text-emerald-700 dark:text-emerald-400">طريقة الحل: </span>
                <div className="text-foreground/80 whitespace-pre-wrap mt-1 text-sm">
                  {question.answer_explanation}
                </div>
              </div>
            )}

            {grade?.teacher_feedback && (
              <div className="mt-2 p-2 bg-muted rounded text-sm">
                <span className="font-medium">ملاحظة: </span>
                {grade.teacher_feedback}
              </div>
            )}
          </div>
        )}
      </div>

      {children.map(child => (
        <ResultQuestionNode
          key={child.question.id}
          node={child}
          depth={depth + 1}
          gradesMap={gradesMap}
          answers={answers}
        />
      ))}
    </div>
  );
}

// ====== المكون الرئيسي ======
export default function StudentBagrutResult() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['student-bagrut-result', examId, user?.id],
    queryFn: async () => {
      if (!examId || !user?.id) return null;

      const { data: exam } = await supabase
        .from('bagrut_exams').select('*').eq('id', examId).single();
      if (!exam) throw new Error('الامتحان غير موجود');

      const { data: attempts } = await supabase
        .from('bagrut_attempts').select('*').eq('exam_id', examId).eq('student_id', user.id)
        .order('created_at', { ascending: false });

      const { data: sections } = await supabase
        .from('bagrut_exam_sections').select('*').eq('exam_id', examId).order('order_index');

      const { data: questions } = await supabase
        .from('bagrut_questions').select('*').eq('exam_id', examId).order('order_index');

      const bestAttempt = (attempts || [])
        .filter(a => a.status === 'submitted' || a.status === 'graded')
        .sort((a, b) => (b.percentage || 0) - (a.percentage || 0))[0];

      let questionGrades: any[] = [];
      if (bestAttempt) {
        const { data: grades } = await supabase
          .from('bagrut_question_grades').select('*').eq('attempt_id', bestAttempt.id);
        questionGrades = grades || [];
      }

      return { exam, attempts: attempts || [], sections: sections || [], questions: questions || [], bestAttempt, questionGrades };
    },
    enabled: !!examId && !!user?.id,
  });

  const questionTree = useMemo(() => {
    if (!data?.questions) return [];
    return buildQuestionTree(data.questions);
  }, [data?.questions]);

  const canViewResults = useMemo(() => {
    if (!data?.bestAttempt) return false;
    if (data.bestAttempt.is_result_published) return true;
    const hasScore = data.bestAttempt.score !== null && data.bestAttempt.percentage !== null;
    if (hasScore && data.exam?.allow_review_after_submit) return true;
    return false;
  }, [data]);

  const totalPoints = useMemo(() => {
    if (!data?.sections) return 100;
    const est = data.exam?.exam_structure_type || 'standard';
    if (est === 'all_mandatory') return data.sections.reduce((s: number, sec: any) => s + (sec.total_points || 0), 0);
    let mp = 0, ep = 0;
    data.sections.forEach((s: any) => {
      if (s.section_type === 'mandatory') mp += s.total_points || 0;
      else if (s.section_type === 'elective') ep = Math.max(ep, s.total_points || 0);
    });
    return mp + ep;
  }, [data]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>فشل في تحميل النتائج</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/student/bagrut-exams')}>
          <Home className="ml-2 h-4 w-4" /> العودة لقائمة الامتحانات
        </Button>
      </div>
    );
  }

  const { exam, attempts, bestAttempt, sections, questions, questionGrades } = data;

  if (attempts.length === 0) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2">لم تقم بحل هذا الامتحان بعد</h2>
            <p className="text-muted-foreground mb-6">ابدأ الامتحان لمشاهدة نتائجك</p>
            <Button onClick={() => navigate(`/student/bagrut-attempt/${examId}`)}>بدء الامتحان</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canViewResults) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-16 w-16 mx-auto mb-4 text-orange-500" />
            <h2 className="text-xl font-semibold mb-2">النتائج قيد المراجعة</h2>
            <p className="text-muted-foreground mb-6">تم تسليم إجاباتك بنجاح. سيتم إبلاغك عند نشر النتائج.</p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              تم التقديم: {bestAttempt?.submitted_at ? format(new Date(bestAttempt.submitted_at), 'dd MMM yyyy HH:mm', { locale: ar }) : '-'}
            </div>
            <Button variant="outline" className="mt-6" onClick={() => navigate('/student/bagrut-exams')}>
              العودة لقائمة الامتحانات
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const percentage = bestAttempt?.percentage || 0;
  const passed = percentage >= 55;
  const gradesMap = new Map(questionGrades.map((g: any) => [g.question_id, g]));
  const attemptAnswers = (bestAttempt?.answers as Record<string, any>) || {};

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">نتيجة الامتحان</h1>
          <p className="text-muted-foreground">{exam.title}</p>
        </div>
      </div>

      <Card className={`border-2 ${passed ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20' : 'border-red-500 bg-red-50/50 dark:bg-red-950/20'}`}>
        <CardContent className="py-8">
          <div className="flex flex-col items-center text-center">
            {passed ? <Trophy className="h-20 w-20 text-green-500 mb-4" /> : <XCircle className="h-20 w-20 text-red-500 mb-4" />}
            <h2 className="text-4xl font-bold mb-2">{percentage.toFixed(1)}%</h2>
            <p className="text-xl mb-4">{bestAttempt?.score || 0} / {bestAttempt?.max_score || exam.total_points} علامة</p>
            <Badge variant={passed ? 'default' : 'destructive'} className="text-lg px-4 py-1">
              {passed ? 'ناجح' : 'راسب'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><Award className="h-6 w-6 mx-auto mb-2 text-primary" /><p className="text-2xl font-bold">{bestAttempt?.attempt_number || 1}</p><p className="text-sm text-muted-foreground">رقم المحاولة</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Clock className="h-6 w-6 mx-auto mb-2 text-blue-500" /><p className="text-2xl font-bold">{bestAttempt?.time_spent_seconds ? `${Math.floor(bestAttempt.time_spent_seconds / 60)} د` : '-'}</p><p className="text-sm text-muted-foreground">الوقت المستغرق</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-500" /><p className="text-2xl font-bold">{questions.length}</p><p className="text-sm text-muted-foreground">عدد الأسئلة</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><FileText className="h-6 w-6 mx-auto mb-2 text-purple-500" /><p className="text-2xl font-bold">{attempts.length}</p><p className="text-sm text-muted-foreground">إجمالي المحاولات</p></CardContent></Card>
      </div>

      {bestAttempt?.teacher_feedback && (
        <Card>
          <CardHeader><CardTitle className="text-lg">ملاحظات المعلم</CardTitle></CardHeader>
          <CardContent><p className="text-foreground whitespace-pre-wrap">{bestAttempt.teacher_feedback}</p></CardContent>
        </Card>
      )}

      {exam.show_answers_to_students && (
        <Card>
          <CardHeader>
            <CardTitle>تفاصيل الإجابات</CardTitle>
            <CardDescription>مراجعة إجاباتك مع الإجابات الصحيحة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {questionTree.map(rootNode => (
                <ResultQuestionNode
                  key={rootNode.question.id}
                  node={rootNode}
                  depth={0}
                  gradesMap={gradesMap}
                  answers={attemptAnswers}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4 justify-center">
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          <ArrowRight className="ml-2 h-4 w-4" /> العودة للوحة التحكم
        </Button>
        {data.exam.max_attempts > attempts.length && (
          <Button onClick={() => navigate(`/student/bagrut-attempt/${examId}`)}>محاولة جديدة</Button>
        )}
      </div>
    </div>
  );
}
