// صفحة تصحيح امتحانات البجروت للمعلم
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useBagrutGrading, QuestionGrade } from '@/hooks/useBagrutGrading';
import { supabase } from '@/integrations/supabase/client';
import { buildBagrutPreviewFromDb, type ParsedQuestion, type ParsedSection } from '@/lib/bagrut/buildBagrutPreview';
import SafeHtml from '@/components/bagrut/SafeHtml';
import ModernHeader from '@/components/shared/ModernHeader';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertCircle, ArrowRight, CheckCircle2, Clock, Eye, FileText, Loader2, Save, Send, User, XCircle, TrendingUp, BookOpen, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
export default function BagrutGradingPage() {
  const {
    examId
  } = useParams<{
    examId: string;
  }>();
  const navigate = useNavigate();
  const {
    user,
    userProfile
  } = useAuth();
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
    isPublishing
  } = useBagrutGrading(examId, userProfile?.school_id);

  // جلب معلومات الامتحان
  const {
    data: examData
  } = useQuery({
    queryKey: ['bagrut-exam-details', examId],
    queryFn: async () => {
      if (!examId) return null;
      const {
        data: exam
      } = await supabase.from('bagrut_exams').select('*').eq('id', examId).single();
      const {
        data: sections
      } = await supabase.from('bagrut_exam_sections').select('*').eq('exam_id', examId).order('order_index');
      const {
        data: questions
      } = await supabase.from('bagrut_questions').select('*').eq('exam_id', examId).order('order_index');
      return {
        exam,
        sections,
        questions
      };
    },
    enabled: !!examId
  });

  // إحصائيات
  const stats = useMemo(() => {
    const gradedAttempts = attempts.filter(a => a.status === 'graded');
    const graded = gradedAttempts.length;
    const pending = attempts.filter(a => a.status === 'submitted').length;
    const published = attempts.filter(a => a.is_result_published).length;
    // حساب المتوسط بناءً على الامتحانات المصححة فقط
    const gradedWithScores = gradedAttempts.filter(a => a.percentage !== null);
    const avgScore = gradedWithScores.length > 0 
      ? gradedWithScores.reduce((sum, a) => sum + (a.percentage || 0), 0) / gradedWithScores.length 
      : 0;
    return {
      total: attempts.length,
      graded,
      pending,
      published,
      avgScore
    };
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
    return <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        <ModernHeader title="تصحيح امتحان البجروت" showBackButton backPath="/dashboard" />
        <div className="container mx-auto px-6 py-8 space-y-6">
          <Skeleton className="h-28 w-full rounded-xl" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>;
  }
  if (isError || !examId) {
    return <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        <ModernHeader title="تصحيح امتحان البجروت" showBackButton backPath="/dashboard" />
        <div className="container mx-auto px-6 py-8">
          <Alert variant="destructive" className="max-w-md mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>فشل في تحميل بيانات التصحيح</AlertDescription>
          </Alert>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <ModernHeader title="تصحيح امتحان البجروت" showBackButton backPath="/dashboard" onRefresh={() => window.location.reload()} />
      
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Exam Info Card */}
        {examData?.exam && <Card className="bg-card/60 backdrop-blur-lg border-0 shadow-lg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 -z-10" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-inner">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{examData.exam.title}</h2>
                    <div className="flex items-center gap-3 text-muted-foreground mt-1 flex-wrap">
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                        {examData.exam.subject}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {examData.exam.exam_year} - {examData.exam.exam_season === 'summer' ? 'صيف' : examData.exam.exam_season === 'winter' ? 'شتاء' : 'موعد ب'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {selectedAttempts.length > 0 && <Button onClick={handlePublishSelected} disabled={isPublishing} className="bg-gradient-to-r from-primary to-primary/80 shadow-lg hover:shadow-xl transition-all" size="lg">
                    {isPublishing ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Send className="ml-2 h-4 w-4" />}
                    نشر النتائج ({selectedAttempts.length})
                  </Button>}
              </div>
            </CardContent>
          </Card>}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Total Attempts */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-500/10 via-slate-500/5 to-transparent backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-transparent opacity-50" />
            <CardContent className="p-6 relative">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 backdrop-blur-sm group-hover:scale-110 transition-transform">
                  <FileText className="h-7 w-7 text-slate-600 dark:text-slate-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium">إجمالي المحاولات</p>
                  <p className="text-3xl font-bold text-foreground text-center">
                    {stats.total}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-50" />
            <CardContent className="p-6 relative">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30 backdrop-blur-sm group-hover:scale-110 transition-transform">
                  <Clock className="h-7 w-7 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium">بانتظار التصحيح</p>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 text-center">
                    {stats.pending}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Graded */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-50" />
            <CardContent className="p-6 relative">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30 backdrop-blur-sm group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium">مصححة</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 text-center">
                    {stats.graded}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Published */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-50" />
            <CardContent className="p-6 relative">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 backdrop-blur-sm group-hover:scale-110 transition-transform">
                  <Send className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium">منشورة</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 text-center">
                    {stats.published}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Average */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-50" />
            <CardContent className="p-6 relative">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 backdrop-blur-sm group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium">متوسط الدرجات</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 text-center">
                    {stats.avgScore.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attempts Table */}
        <Card className="bg-card/60 backdrop-blur-lg border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent border-b">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              محاولات الطلاب
            </CardTitle>
            <CardDescription>
              اضغط على "تصحيح" لمراجعة إجابات الطالب وتقييمها
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {attempts.length === 0 ? <div className="text-center py-12 text-muted-foreground">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                  <FileText className="h-8 w-8 opacity-50" />
                </div>
                <p className="text-lg font-medium">لا توجد محاولات للتصحيح بعد</p>
                <p className="text-sm mt-1">سيظهر هنا محاولات الطلاب عند تقديمهم للامتحان</p>
              </div> : <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="w-12 text-center">
                      <div className="flex justify-center">
                        <Checkbox checked={selectedAttempts.length === attempts.length} onCheckedChange={handleSelectAll} />
                      </div>
                    </TableHead>
                    <TableHead className="text-center">الطالب</TableHead>
                    <TableHead className="text-center">تاريخ التقديم</TableHead>
                    <TableHead className="text-center">الحالة</TableHead>
                    <TableHead className="text-center">العلامة</TableHead>
                    <TableHead className="text-center">النشر</TableHead>
                    <TableHead className="w-28"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attempts.map(attempt => <TableRow key={attempt.id} className="hover:bg-accent/50 transition-colors">
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Checkbox checked={selectedAttempts.includes(attempt.id)} onCheckedChange={checked => handleSelectAttempt(attempt.id, !!checked)} />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium">{attempt.student_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {attempt.submitted_at ? format(new Date(attempt.submitted_at), 'd.M.yyyy HH:mm') : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {attempt.status === 'graded' ? <Badge className="bg-green-500/10 text-green-600 border-green-200 dark:border-green-800 hover:bg-green-500/20">
                            <CheckCircle2 className="ml-1 h-3 w-3" />
                            مصحح
                          </Badge> : <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-800">
                            <Clock className="ml-1 h-3 w-3" />
                            بانتظار التصحيح
                          </Badge>}
                      </TableCell>
                      <TableCell className="text-center">
                        {attempt.percentage !== null ? <span className={`font-mono font-bold text-lg ${attempt.percentage >= 55 ? 'text-green-600' : 'text-red-500'}`}>
                            {attempt.percentage.toFixed(1)}%
                          </span> : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        {attempt.is_result_published ? <Badge className="bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800">
                            <CheckCircle2 className="ml-1 h-3 w-3" />
                            منشور
                          </Badge> : <Badge variant="outline" className="text-muted-foreground">
                            غير منشور
                          </Badge>}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" onClick={() => openGradingDialog(attempt.id)} className="bg-gradient-to-r from-primary to-primary/80 shadow hover:shadow-md transition-all">
                          <Eye className="ml-1 h-4 w-4" />
                          تصحيح
                        </Button>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>}
          </CardContent>
        </Card>
      </div>

      {/* Grading Dialog */}
      {selectedAttempt && <GradingDialog open={gradingDialogOpen} onClose={() => {
      setGradingDialogOpen(false);
      setSelectedAttempt(null);
    }} attemptId={selectedAttempt} attempt={attempts.find(a => a.id === selectedAttempt)!} examData={examData} userId={user?.id || ''} onSave={updateAttempt} fetchQuestionGrades={fetchQuestionGrades} saveQuestionGrade={saveQuestionGrade} isSaving={isSaving} />}
    </div>;
}

// مكون عرض سؤال واحد (منفصل لتجنب إعادة الإنشاء عند كل render)
interface QuestionCardProps {
  question: ParsedQuestion;
  depth?: number;
  answers: Record<string, any>;
  questionGrades: Record<string, QuestionGrade>;
  autoGradeQuestion: (q: ParsedQuestion, answer: any) => {
    isAutoGradable: boolean;
    isCorrect: boolean | null;
    autoScore: number;
  };
  updateQuestionGrade: (questionId: string, field: string, value: any, maxScore: number) => void;
  formatStudentAnswer: (q: ParsedQuestion, answer: any) => React.ReactNode;
  formatCorrectAnswer: (q: ParsedQuestion) => React.ReactNode;
  hasCorrectAnswer: (q: ParsedQuestion) => boolean;
}

const QuestionCard = React.memo(({
  question,
  depth = 0,
  answers,
  questionGrades,
  autoGradeQuestion,
  updateQuestionGrade,
  formatStudentAnswer,
  formatCorrectAnswer,
  hasCorrectAnswer
}: QuestionCardProps) => {
  const questionId = question.question_db_id || '';
  const answer = answers[questionId];
  const grade = questionGrades[questionId] || {};

  // التحقق إذا كان سؤال رئيسي له أسئلة فرعية
  const hasSubQuestions = question.sub_questions && question.sub_questions.length > 0;
  // سؤال رئيسي بدون إجابة مباشرة (الإجابات في الفرعيات)
  const isParentWithNoDirectAnswer = hasSubQuestions && !answer?.answer;

  // التحقق من التصحيح التلقائي (فقط للأسئلة الطرفية)
  const autoGradeResult = !hasSubQuestions ? autoGradeQuestion(question, answer) : { isAutoGradable: false, isCorrect: null, autoScore: 0 };
  const isAutoGraded = autoGradeResult.isAutoGradable;
  const hasManualScore = (grade as any).manual_score !== undefined && (grade as any).manual_score !== null;

  // القيمة المعروضة في حقل العلامة (فقط للأسئلة الطرفية)
  const displayScore = hasManualScore ? (grade as any).manual_score : isAutoGraded ? autoGradeResult.autoScore : '';
  
  // للأسئلة الرئيسية: لا نعرض حقل العلامة إذا كانت لها فرعيات
  const showGradeInput = question.points > 0 && !hasSubQuestions;

  return (
    <div className={depth > 0 ? 'mr-4 border-r-2 border-muted pr-4' : ''}>
      <Card className={`${depth > 0 ? 'border-dashed' : ''} ${isAutoGraded && !hasManualScore ? autoGradeResult.isCorrect ? 'border-green-300 dark:border-green-800' : 'border-red-300 dark:border-red-800' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm flex items-center gap-2 flex-wrap">
              <span>سؤال {question.question_number} ({question.points} علامة)</span>
              <Badge variant="outline" className="text-xs">
                {question.question_type}
              </Badge>
              
              {/* شارة التصحيح التلقائي - فقط للأسئلة الطرفية */}
              {isAutoGraded && !hasManualScore && (
                <Badge variant={autoGradeResult.isCorrect ? "default" : "destructive"} className={`text-xs ${autoGradeResult.isCorrect ? 'bg-green-500 hover:bg-green-600' : ''}`}>
                  {autoGradeResult.isCorrect ? '✓ صحيح تلقائي' : '✗ خطأ تلقائي'}
                </Badge>
              )}
              
              {/* شارة للأسئلة الرئيسية */}
              {hasSubQuestions && (
                <Badge variant="secondary" className="text-xs">
                  يحتوي {question.sub_questions!.length} أسئلة فرعية
                </Badge>
              )}
            </CardTitle>
            {showGradeInput && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">العلامة:</span>
                <Input 
                  type="number" 
                  min={0} 
                  max={question.points} 
                  value={displayScore} 
                  onChange={e => updateQuestionGrade(questionId, 'manual_score', e.target.value ? parseInt(e.target.value) : null, question.points)} 
                  className={`w-20 h-8 ${isAutoGraded && !hasManualScore ? autoGradeResult.isCorrect ? 'bg-green-50 border-green-300 dark:bg-green-950/30' : 'bg-red-50 border-red-300 dark:bg-red-950/30' : ''}`} 
                />
                <span className="text-sm">/ {question.points}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 overflow-x-auto">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-1">السؤال:</p>
            <SafeHtml html={question.question_text} />
            {question.image_url && <img src={question.image_url} alt="صورة السؤال" className="mt-2 max-h-48 rounded" />}
          </div>

          {/* إظهار قسم الإجابة فقط إذا كان السؤال له إجابة مباشرة */}
          {!isParentWithNoDirectAnswer && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <p className="text-sm font-medium mb-1">إجابة الطالب:</p>
              <div className="text-sm">
                {formatStudentAnswer(question, answer)}
              </div>
            </div>
          )}

          {/* الإجابة الصحيحة - فقط للأسئلة الطرفية */}
          {!hasSubQuestions && hasCorrectAnswer(question) && (
            <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <p className="text-sm font-medium mb-1">الإجابة الصحيحة:</p>
              <div className="text-sm">
                {formatCorrectAnswer(question)}
              </div>
            </div>
          )}

          {/* شرح الحل / طريقة الحل - للمعلم */}
          {!hasSubQuestions && question.answer_explanation && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <p className="text-sm font-medium mb-1 flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <BookOpen className="h-4 w-4" />
                طريقة الحل:
              </p>
              <SafeHtml html={question.answer_explanation} className="text-foreground/80" />
            </div>
          )}

          {/* ملاحظات - فقط للأسئلة الطرفية */}
          {showGradeInput && (
            <div>
              <label className="text-sm font-medium">ملاحظات على هذا السؤال:</label>
              <Textarea 
                value={(grade as any).teacher_feedback || ''} 
                onChange={e => updateQuestionGrade(questionId, 'teacher_feedback', e.target.value, question.points)} 
                placeholder="ملاحظات اختيارية..." 
                className="mt-1 h-16" 
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* الأسئلة الفرعية */}
      {hasSubQuestions && (
        <div className="mt-3 space-y-3">
          {question.sub_questions!.map(subQ => (
            <QuestionCard 
              key={subQ.question_db_id} 
              question={subQ} 
              depth={depth + 1}
              answers={answers}
              questionGrades={questionGrades}
              autoGradeQuestion={autoGradeQuestion}
              updateQuestionGrade={updateQuestionGrade}
              formatStudentAnswer={formatStudentAnswer}
              formatCorrectAnswer={formatCorrectAnswer}
              hasCorrectAnswer={hasCorrectAnswer}
            />
          ))}
        </div>
      )}
    </div>
  );
});

QuestionCard.displayName = 'QuestionCard';

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
  isSaving
}: GradingDialogProps) {
  const [questionGrades, setQuestionGrades] = useState<Record<string, QuestionGrade>>({});
  const [teacherFeedback, setTeacherFeedback] = useState(attempt?.teacher_feedback || '');
  const [publishResult, setPublishResult] = useState(attempt?.is_result_published || false);
  const [isLoadingGrades, setIsLoadingGrades] = useState(true);
  const [gradingFilter, setGradingFilter] = useState<'all' | 'graded' | 'not_graded' | 'needs_manual'>('all');

  // نقل useEffect للأسفل بعد تعريف autoGradeQuestion
  const [shouldLoadGrades, setShouldLoadGrades] = useState(false);
  useEffect(() => {
    if (open && attemptId) {
      setShouldLoadGrades(true);
    }
  }, [open, attemptId]);

  // بناء الهيكل المنظم للامتحان
  const structuredExam = useMemo(() => {
    if (!examData?.exam || !examData?.sections || !examData?.questions) {
      return null;
    }
    try {
      const {
        exam
      } = buildBagrutPreviewFromDb({
        exam: {
          ...examData.exam,
          id: examData.exam.id
        },
        sections: examData.sections,
        questions: examData.questions
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
    return structuredExam.sections.filter(s => s.section_type === 'mandatory' || selectedSectionIds.includes(s.section_db_id || ''));
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

  // دالة التصحيح التلقائي للأسئلة الموضوعية
  const autoGradeQuestion = (question: ParsedQuestion, studentAnswer: any): {
    isAutoGradable: boolean;
    isCorrect: boolean | null;
    autoScore: number;
  } => {
    // التحقق من وجود إجابة
    if (!studentAnswer?.answer) {
      return {
        isAutoGradable: false,
        isCorrect: null,
        autoScore: 0
      };
    }
    const value = studentAnswer.answer;

    // 1. MCQ أو multiple_choice
    if ((question.question_type === 'mcq' || question.question_type === 'multiple_choice') && question.choices) {
      const correctChoice = question.choices.find((c: any) => c.is_correct);
      if (correctChoice) {
        const strValue = String(value).trim();
        // مقارنة مباشرة بمعرف الخيار أو نصه
        let isCorrect = strValue === String(correctChoice.id) || strValue === String(correctChoice.text);
        // fallback: مقارنة رقمية (1-based index)
        if (!isCorrect) {
          const numValue = parseInt(strValue);
          if (!isNaN(numValue)) {
            const correctIndex = question.choices.indexOf(correctChoice) + 1;
            isCorrect = numValue === correctIndex;
          }
        }
        return {
          isAutoGradable: true,
          isCorrect,
          autoScore: isCorrect ? question.points || 0 : 0
        };
      }
    }

    // 2. صح/خطأ
    if (question.question_type === 'true_false') {
      // تحويل إجابة الطالب
      const studentTrue = value === true || value === 'true' || value === 'صح' || value === '1';
      const studentFalse = value === false || value === 'false' || value === 'خطأ' || value === '2';

      // الإجابة الصحيحة: correct_answer أولاً (المصدر الموثوق)، ثم choices كـ fallback
      let correctIsTrue: boolean | null = null;
      if (question.correct_answer) {
        const answer = String(question.correct_answer).toLowerCase();
        correctIsTrue = answer === 'true' || answer === 'صح' || answer === '1' || answer === 'صحيح';
      } else if (question.choices?.length && question.choices.length > 0) {
        const correctChoice = question.choices.find((c: any) => c.is_correct);
        if (correctChoice) {
          correctIsTrue = correctChoice.text === 'صح' || String(correctChoice.id) === '1' || String(correctChoice.id) === 'choice_true' || String(correctChoice.id) === 'true';
        }
      }
      if (correctIsTrue !== null && (studentTrue || studentFalse)) {
        const isCorrect = studentTrue && correctIsTrue || studentFalse && !correctIsTrue;
        return {
          isAutoGradable: true,
          isCorrect,
          autoScore: isCorrect ? question.points || 0 : 0
        };
      }
    }

    // 3. ملء الفراغات — مقارنة case-insensitive مع trim
    if (question.question_type === 'fill_blank' && question.blanks && typeof value === 'object') {
      const blanksWithAnswers = question.blanks.filter((b: any) => b.correct_answer);
      if (blanksWithAnswers.length > 0) {
        let correctCount = 0;
        blanksWithAnswers.forEach((blank: any) => {
          const studentAns = String(value[blank.id] || '').trim().toLowerCase().normalize('NFC');
          const correctAns = String(blank.correct_answer).trim().toLowerCase().normalize('NFC');
          if (studentAns === correctAns) correctCount++;
        });
        const allCorrect = correctCount === blanksWithAnswers.length;
        const partialScore = blanksWithAnswers.length > 0
          ? Math.round(((question.points || 0) * correctCount) / blanksWithAnswers.length * 100) / 100
          : 0;
        return {
          isAutoGradable: true,
          isCorrect: allCorrect,
          autoScore: partialScore
        };
      }
    }

    // 4. جداول — مقارنة case-insensitive مع trim
    if (question.question_type === 'fill_table' && typeof value === 'object' && question.table_data?.correct_answers) {
      const correctAnswers = question.table_data.correct_answers;
      const correctKeys = Object.keys(correctAnswers);
      if (correctKeys.length > 0) {
        let correctCount = 0;
        correctKeys.forEach(key => {
          const studentAns = String(value[key] || '').trim().toLowerCase().normalize('NFC');
          const correctAns = String(correctAnswers[key]).trim().toLowerCase().normalize('NFC');
          if (studentAns === correctAns) correctCount++;
        });
        const allCorrect = correctCount === correctKeys.length;
        const partialScore = correctKeys.length > 0
          ? Math.round(((question.points || 0) * correctCount) / correctKeys.length * 100) / 100
          : 0;
        return {
          isAutoGradable: true,
          isCorrect: allCorrect,
          autoScore: partialScore
        };
      }
    }

    return {
      isAutoGradable: false,
      isCorrect: null,
      autoScore: 0
    };
  };

  // دالة مساعدة للتحقق من وجود إجابة صحيحة (يجب أن تكون قبل autoGradeStats)
  const hasCorrectAnswer = (question: ParsedQuestion): boolean => {
    // MCQ أو multiple_choice مع خيار صحيح
    if ((question.question_type === 'mcq' || question.question_type === 'multiple_choice') && question.choices) {
      return question.choices.some((c: any) => c.is_correct);
    }

    // صح/خطأ مع إجابة
    if (question.question_type === 'true_false') {
      if (question.correct_answer) return true;
      if (question.choices?.some((c: any) => c.is_correct)) return true;
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

  // حساب إحصائيات التصحيح التلقائي
  const autoGradeStats = useMemo(() => {
    let total = 0;
    let correct = 0;
    let wrong = 0;
    let autoGradedScore = 0;
    let unanswered = 0;
    allQuestions.forEach(q => {
      const questionId = q.question_db_id || '';
      const answer = answers[questionId];

      // هل السؤال قابل للتصحيح التلقائي؟
      const isObjective = q.question_type === 'mcq' || q.question_type === 'multiple_choice' || q.question_type === 'true_false' || q.question_type === 'fill_blank' || q.question_type === 'fill_table';
      const hasCorrect = hasCorrectAnswer(q);
      if (isObjective && hasCorrect) {
        const result = autoGradeQuestion(q, answer);
        if (result.isAutoGradable) {
          total++;
          if (result.isCorrect) {
            correct++;
          } else {
            wrong++;
          }
          autoGradedScore += result.autoScore;
        } else if (!answer?.answer) {
          unanswered++;
        }
      }
    });
    return {
      total,
      correct,
      wrong,
      autoGradedScore,
      unanswered
    };
  }, [allQuestions, answers]);

  // حساب المجموع الكلي للعلامات من الأقسام الرسمية
  // حسب نوع الهيكل: standard = إلزامي + Max(اختياري)، all_mandatory = مجموع جميع الأقسام
  const totalPoints = useMemo(() => {
    const structureType = examData?.exam?.exam_structure_type || 'standard';
    
    // إذا كان all_mandatory: جمع جميع الأقسام
    if (structureType === 'all_mandatory') {
      return relevantSections.reduce((sum, s) => sum + (s.total_points || 0), 0);
    }
    
    // الهيكل القياسي: إلزامي + Max(اختياري)
    let mandatoryPoints = 0;
    let electivePoints = 0;
    
    relevantSections.forEach(section => {
      if (section.section_type === 'mandatory') {
        mandatoryPoints += section.total_points;
      } else if (section.section_type === 'elective') {
        electivePoints = Math.max(electivePoints, section.total_points);
      }
    });
    
    return mandatoryPoints + electivePoints;
  }, [relevantSections, examData]);

  // دالة تحديد حالة تصحيح السؤال (تدعم الأسئلة الرئيسية والفرعية)
  const getQuestionGradingStatus = (question: ParsedQuestion): 'auto_graded' | 'manual_graded' | 'needs_manual' => {
    // إذا كان سؤال رئيسي له أسئلة فرعية، نتحقق من حالة الفرعية
    if (question.sub_questions && question.sub_questions.length > 0) {
      const subStatuses = question.sub_questions.map(sq => getQuestionGradingStatus(sq));
      
      // إذا كل الفرعية مصححة (تلقائياً أو يدوياً) → السؤال الرئيسي مصحح
      const allGraded = subStatuses.every(s => s === 'auto_graded' || s === 'manual_graded');
      if (allGraded) {
        // نُرجع 'manual_graded' إذا أي فرعي مصحح يدوياً
        return subStatuses.some(s => s === 'manual_graded') ? 'manual_graded' : 'auto_graded';
      }
      
      // إذا أي فرعي يحتاج تصحيح يدوي → الرئيسي يحتاج
      return 'needs_manual';
    }

    // سؤال طرفي (بدون فرعيات)
    const questionId = question.question_db_id || '';
    const grade = questionGrades[questionId];
    const answer = answers[questionId];
    const autoResult = autoGradeQuestion(question, answer);

    // إذا كانت هناك علامة يدوية
    if (grade?.manual_score !== undefined && grade?.manual_score !== null) {
      return 'manual_graded';
    }

    // إذا تم تصحيحه تلقائياً
    if (autoResult.isAutoGradable) {
      return 'auto_graded';
    }

    // يحتاج تصحيح يدوي
    return 'needs_manual';
  };

  // دالة مساعدة للتحقق من مطابقة الفلتر
  const matchesGradingFilter = (status: 'auto_graded' | 'manual_graded' | 'needs_manual', filter: string): boolean => {
    switch (filter) {
      case 'graded':
        return status === 'auto_graded' || status === 'manual_graded';
      case 'not_graded':
      case 'needs_manual':
        return status === 'needs_manual';
      default:
        return true;
    }
  };

  // فلترة الأسئلة حسب حالة التصحيح (تدعم الأسئلة الفرعية)
  const filterQuestionsByGradingStatus = (questions: ParsedQuestion[]): ParsedQuestion[] => {
    if (gradingFilter === 'all') return questions;
    
    return questions.filter(q => {
      const status = getQuestionGradingStatus(q);
      
      // التحقق من السؤال نفسه
      if (matchesGradingFilter(status, gradingFilter)) {
        return true;
      }
      
      // إذا كان للسؤال أسئلة فرعية، نتحقق منها أيضاً
      if (q.sub_questions && q.sub_questions.length > 0) {
        const anySubMatchesFilter = q.sub_questions.some(subQ => {
          const subStatus = getQuestionGradingStatus(subQ);
          return matchesGradingFilter(subStatus, gradingFilter);
        });
        // نُبقي السؤال الرئيسي إذا أي من أبنائه يطابق الفلتر
        if (anySubMatchesFilter) return true;
      }
      
      return false;
    });
  };

  // إحصائيات الفلتر
  const filterStats = useMemo(() => {
    let autoGraded = 0;
    let manualGraded = 0;
    let needsManual = 0;
    allQuestions.forEach(q => {
      const status = getQuestionGradingStatus(q);
      if (status === 'auto_graded') autoGraded++;else if (status === 'manual_graded') manualGraded++;else needsManual++;
    });
    return {
      autoGraded,
      manualGraded,
      needsManual,
      total: allQuestions.length
    };
  }, [allQuestions, questionGrades, answers]);

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
      return <table className="w-full border-collapse text-sm mt-2">
          <thead>
            <tr>
              {tableData.headers.map((h: string, i: number) => <th key={i} className="border p-2 bg-muted/30 text-right text-xs">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {tableData.rows.map((row: string[], rowIdx: number) => <tr key={rowIdx}>
                {row.map((cell: string, colIdx: number) => {
              const isInput = tableData.input_columns?.includes(colIdx);
              const studentAnswer = value[`${rowIdx}-${colIdx}`] || value[`cell_${rowIdx}_${colIdx}`];
              return <td key={colIdx} className="border p-2 text-xs">
                      {isInput ? <span className="font-medium text-primary bg-primary/10 px-1 rounded">
                          {studentAnswer || '—'}
                        </span> : cell}
                    </td>;
            })}
              </tr>)}
          </tbody>
        </table>;
    }

    // 2. ملء الفراغات
    if (question.question_type === 'fill_blank' && typeof value === 'object') {
      const entries = Object.entries(value);
      if (entries.length === 0) {
        return <span className="text-muted-foreground italic">لم يجب</span>;
      }
      return <div className="space-y-1">
          {entries.map(([blankId, ans], idx) => <div key={blankId} className="flex gap-2 text-sm">
              <span className="text-muted-foreground">فراغ {idx + 1}:</span>
              <span className="font-medium">{String(ans) || '—'}</span>
            </div>)}
        </div>;
    }

    // 3. MCQ - عرض الخيار المختار
    if ((question.question_type === 'mcq' || question.question_type === 'multiple_choice') && question.choices) {
      const strValue = String(value).trim().toLowerCase();
      // أولاً: البحث بالمعرف أو النص
      let matchedChoice = question.choices.find((c: any) => 
        String(c.id).toLowerCase() === strValue || String(c.text).trim().toLowerCase() === strValue
      );
      // fallback: البحث بالفهرس الرقمي
      if (!matchedChoice) {
        const numVal = parseInt(String(value));
        if (!isNaN(numVal) && numVal >= 1 && numVal <= question.choices.length) {
          matchedChoice = question.choices[numVal - 1];
        }
      }
      if (matchedChoice) {
        const idx = question.choices.indexOf(matchedChoice) + 1;
        return <span>
            <span className="text-muted-foreground">الخيار {idx}:</span>{' '}
            <span className="font-medium">{matchedChoice.text}</span>
          </span>;
      }
    }

    // 4. صح/خطأ
    if (question.question_type === 'true_false') {
      const boolValue = value === true || value === 'true' || value === 'صح' || value === '1';
      return <span className="font-medium">{boolValue ? 'صح ✓' : 'خطأ ✗'}</span>;
    }

    // 5. نص عادي
    if (typeof value === 'string') {
      return <p className="whitespace-pre-wrap">{value}</p>;
    }

    // fallback
    if (typeof value === 'object') {
      return <pre className="text-xs overflow-auto bg-muted/30 p-2 rounded max-h-24" dir="ltr">
          {JSON.stringify(value, null, 2)}
        </pre>;
    }
    return <span>{String(value)}</span>;
  };

  // دالة تنسيق الإجابة الصحيحة
  const formatCorrectAnswer = (question: ParsedQuestion): React.ReactNode => {
    // للجداول
    if (question.question_type === 'fill_table' && question.table_data?.correct_answers) {
      const {
        correct_answers,
        headers,
        rows,
        input_columns
      } = question.table_data;
      return <table className="w-full border-collapse text-sm mt-2">
          <thead>
            <tr>
              {headers?.map((h: string, i: number) => <th key={i} className="border p-2 bg-green-100 dark:bg-green-950/50 text-right text-xs">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows?.map((row: string[], rowIdx: number) => <tr key={rowIdx}>
                {row.map((cell: string, colIdx: number) => {
              const isInput = input_columns?.includes(colIdx);
              const correctAns = correct_answers?.[`${rowIdx}-${colIdx}`] || correct_answers?.[`cell_${rowIdx}_${colIdx}`];
              return <td key={colIdx} className="border p-2 text-xs">
                      {isInput && correctAns ? <span className="font-bold text-green-600">{correctAns}</span> : cell}
                    </td>;
            })}
              </tr>)}
          </tbody>
        </table>;
    }

    // للفراغات
    if (question.question_type === 'fill_blank' && question.blanks) {
      return <div className="space-y-1">
          {question.blanks.map((blank: any, i: number) => <div key={blank.id || i} className="flex gap-2 text-sm">
              <span className="text-muted-foreground">فراغ {i + 1}:</span>
              <span className="font-bold text-green-600">{blank.correct_answer}</span>
            </div>)}
        </div>;
    }

    // MCQ أو multiple_choice - دعم كلا الاسمين
    if ((question.question_type === 'mcq' || question.question_type === 'multiple_choice') && question.choices) {
      const correctChoice = question.choices.find((c: any) => c.is_correct);
      if (correctChoice) {
        const idx = question.choices.indexOf(correctChoice) + 1;
        return <span>
            <span className="text-muted-foreground">الخيار {idx}:</span>{' '}
            <span className="font-bold text-green-600">{correctChoice.text}</span>
          </span>;
      }
    }

    // صح/خطأ - دعم جميع الصيغ (correct_answer أولاً كمصدر موثوق)
    if (question.question_type === 'true_false') {
      if (question.correct_answer) {
        const answer = String(question.correct_answer).toLowerCase();
        const isTrue = answer === 'true' || answer === 'صح' || answer === '1' || answer === 'صحيح';
        return <span className="font-bold text-green-600">{isTrue ? 'صح ✓' : 'خطأ ✗'}</span>;
      }

      if (question.choices && question.choices.length > 0) {
        const correctChoice = question.choices.find((c: any) => c.is_correct);
        if (correctChoice) {
          const isTrue = correctChoice.text === 'صح' || String(correctChoice.id) === '1' || String(correctChoice.id) === 'choice_true' || String(correctChoice.id) === 'true';
          return <span className="font-bold text-green-600">{isTrue ? 'صح ✓' : 'خطأ ✗'}</span>;
        }
      }
    }

    // نص عادي
    if (question.correct_answer) {
      return <SafeHtml html={question.correct_answer} className="font-medium text-green-600" />;
    }
    return null;
  };

  // تحميل العلامات مع التصحيح التلقائي
  useEffect(() => {
    const loadGrades = async () => {
      if (!shouldLoadGrades || !attemptId) return;
      setIsLoadingGrades(true);
      try {
        const grades = await fetchQuestionGrades(attemptId);
        const gradesMap: Record<string, QuestionGrade> = {};

        // أولاً: تحميل العلامات المحفوظة
        grades.forEach(g => {
          gradesMap[g.question_id] = g;
        });

        // ثانياً: تشغيل التصحيح التلقائي للأسئلة التي لم تُصحح بعد
        allQuestions.forEach(q => {
          const questionId = q.question_db_id || '';
          const existingGrade = gradesMap[questionId];

          // إذا لم تكن هناك علامة يدوية أو تلقائية، نحاول التصحيح التلقائي
          if (existingGrade?.manual_score === undefined && existingGrade?.auto_score === undefined) {
            const answer = answers[questionId];
            const autoResult = autoGradeQuestion(q, answer);
            if (autoResult.isAutoGradable) {
              gradesMap[questionId] = {
                ...gradesMap[questionId],
                attempt_id: attemptId,
                question_id: questionId,
                auto_score: autoResult.autoScore,
                final_score: autoResult.autoScore,
                max_score: q.points || 0
              };
            }
          }
        });
        setQuestionGrades(gradesMap);
      } catch (error) {
        console.error('Failed to load grades', error);
      }
      setIsLoadingGrades(false);
      setShouldLoadGrades(false);
    };
    loadGrades();
  }, [shouldLoadGrades, attemptId, fetchQuestionGrades, allQuestions, answers]);
  const updateQuestionGrade = useCallback((questionId: string, field: string, value: any, maxScore: number) => {
    setQuestionGrades(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        attempt_id: attemptId,
        question_id: questionId,
        max_score: maxScore,
        [field]: value
      }
    }));
  }, [attemptId]);
  const calculateTotalScore = () => {
    let total = 0;
    
    // حساب العلامة لكل قسم على حدة مع مراعاة max_questions_to_answer
    relevantSections.forEach(section => {
      const maxQ = (section as any).max_questions_to_answer;
      
      if (maxQ && maxQ < section.questions.length) {
        // نمط "اختر N من M": حساب علامة كل سؤال جذري ثم أخذ الأفضل N
        const rootScores: number[] = section.questions.map(rootQ => {
          // حساب علامة السؤال الجذري (مجموع فرعياته أو علامته المباشرة)
          const getQuestionScore = (q: ParsedQuestion): number => {
            const questionId = q.question_db_id || '';
            if (q.sub_questions && q.sub_questions.length > 0) {
              return q.sub_questions.reduce((sum, sq) => sum + getQuestionScore(sq), 0);
            }
            const grade = questionGrades[questionId];
            const answer = answers[questionId];
            if (grade?.manual_score !== undefined && grade?.manual_score !== null) return grade.manual_score;
            if (grade?.final_score !== undefined && grade?.final_score !== null) return grade.final_score;
            if (grade?.auto_score !== undefined && grade?.auto_score !== null) return grade.auto_score;
            const autoResult = autoGradeQuestion(q, answer);
            if (autoResult.isAutoGradable) return autoResult.autoScore;
            return 0;
          };
          return getQuestionScore(rootQ);
        });
        
        // ترتيب تنازلي وأخذ الأفضل N
        rootScores.sort((a, b) => b - a);
        const bestN = rootScores.slice(0, maxQ);
        total += bestN.reduce((s, v) => s + v, 0);
      } else {
        // بدون max_questions_to_answer: جمع كل الأسئلة الطرفية كالمعتاد
        const sectionLeaves: ParsedQuestion[] = [];
        const collectLeaves = (qs: ParsedQuestion[]) => {
          qs.forEach(q => {
            if (q.sub_questions?.length) collectLeaves(q.sub_questions);
            else sectionLeaves.push(q);
          });
        };
        collectLeaves(section.questions);
        
        sectionLeaves.forEach(q => {
          const questionId = q.question_db_id || '';
          const grade = questionGrades[questionId];
          const answer = answers[questionId];
          if (grade?.manual_score !== undefined && grade?.manual_score !== null) {
            total += grade.manual_score;
          } else if (grade?.final_score !== undefined && grade?.final_score !== null) {
            total += grade.final_score;
          } else if (grade?.auto_score !== undefined && grade?.auto_score !== null) {
            total += grade.auto_score;
          } else {
            const autoResult = autoGradeQuestion(q, answer);
            if (autoResult.isAutoGradable) {
              total += autoResult.autoScore;
            }
          }
        });
      }
    });
    
    return {
      total,
      maxTotal: totalPoints,
      percentage: totalPoints > 0 ? (total / totalPoints) * 100 : 0
    };
  };
  const handleSave = () => {
    // حفظ علامات الأسئلة
    Object.values(questionGrades).forEach(grade => {
      if (grade.question_id) {
        saveQuestionGrade({
          ...grade,
          graded_by: userId,
          final_score: grade.manual_score ?? grade.auto_score ?? 0
        });
      }
    });

    // حفظ المحاولة
    const {
      total,
      maxTotal,
      percentage
    } = calculateTotalScore();
    onSave({
      attemptId,
      score: total,
      maxScore: maxTotal,
      percentage,
      teacherFeedback,
      gradedBy: userId,
      markAsGraded: true,
      publishResult
    });
  };
  const scores = calculateTotalScore();
  return <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-6xl h-[92vh] flex flex-col gap-0 p-0">
        {/* Header - Fixed */}
        <DialogHeader className="p-6 pb-4 border-b shrink-0 space-y-3">
          <DialogTitle className="flex items-center justify-between">
            <span>تصحيح إجابات: {attempt?.student_name}</span>
            <Badge variant={scores.percentage >= 55 ? 'default' : 'destructive'}>
              {scores.total} / {scores.maxTotal} ({scores.percentage.toFixed(1)}%)
            </Badge>
          </DialogTitle>
          
          {/* ملخص التصحيح التلقائي */}
          {autoGradeStats.total > 0 && <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-bold">تم تصحيح {autoGradeStats.total} سؤال تلقائياً:</span>
                <span className="text-green-600 font-medium">
                  ✓ {autoGradeStats.correct} صحيح ({autoGradeStats.autoGradedScore} علامة)
                </span>
                <span className="text-red-600 font-medium">
                  ✗ {autoGradeStats.wrong} خطأ
                </span>
              </AlertDescription>
            </Alert>}
          
          {/* فلتر حالة التصحيح */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium">عرض:</span>
            <Select value={gradingFilter} onValueChange={(v: any) => setGradingFilter(v)}>
              <SelectTrigger className="w-[200px] h-9 bg-background">
                <SelectValue placeholder="جميع الأسئلة" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="all">
                  جميع الأسئلة ({filterStats.total})
                </SelectItem>
                <SelectItem value="graded">
                  المصححة ({filterStats.autoGraded + filterStats.manualGraded})
                </SelectItem>
                <SelectItem value="not_graded">
                  تحتاج تصحيح يدوي ({filterStats.needsManual})
                </SelectItem>
              </SelectContent>
            </Select>
            
            {gradingFilter !== 'all' && <Button variant="ghost" size="sm" onClick={() => setGradingFilter('all')} className="h-8 px-2 text-muted-foreground">
                إظهار الكل
              </Button>}
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6">
            {isLoadingGrades ? <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
              </div> : <div className="space-y-6">
                {relevantSections.length === 0 ? <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>لا توجد أسئلة للتصحيح</AlertDescription>
                  </Alert> : relevantSections.map(section => <div key={section.section_db_id} className="space-y-4">
                      {/* عنوان القسم */}
                      <div className="bg-muted/50 p-4 rounded-lg border">
                        <h3 className="font-bold text-lg">
                          قسم {section.section_number}: {section.section_title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {section.total_points} علامة
                          {section.specialization_label && <span className="mr-2">• {section.specialization_label}</span>}
                          {(section as any).max_questions_to_answer && (
                            <span className="mr-2 font-medium text-primary">
                              • يجيب عن {(section as any).max_questions_to_answer} من {section.questions.length} سؤال (الأفضل يُحتسب)
                            </span>
                          )}
                        </p>
                        {section.instructions && <p className="text-sm text-muted-foreground mt-1">{section.instructions}</p>}
                      </div>

                      {/* أسئلة القسم - مع الفلتر */}
                      {(() => {
                const filteredQuestions = filterQuestionsByGradingStatus(section.questions);
                if (filteredQuestions.length === 0) {
                  return <p className="text-sm text-muted-foreground italic py-2">
                              لا توجد أسئلة تطابق الفلتر في هذا القسم
                            </p>;
                }
                return <div className="space-y-4">
                            {filteredQuestions.map(question => (
                              <QuestionCard 
                                key={question.question_db_id} 
                                question={question}
                                answers={answers}
                                questionGrades={questionGrades}
                                autoGradeQuestion={autoGradeQuestion}
                                updateQuestionGrade={updateQuestionGrade}
                                formatStudentAnswer={formatStudentAnswer}
                                formatCorrectAnswer={formatCorrectAnswer}
                                hasCorrectAnswer={hasCorrectAnswer}
                              />
                            ))}
                          </div>;
              })()}
                    </div>)}

                <Separator />

                {/* التعليق العام */}
                <div>
                  <label className="text-sm font-medium">تعليق عام على الامتحان:</label>
                  <Textarea value={teacherFeedback} onChange={e => setTeacherFeedback(e.target.value)} placeholder="تعليق عام للطالب..." className="mt-1" />
                </div>

                {/* نشر النتيجة */}
                <div className="flex items-center gap-2">
                  <Checkbox id="publish" checked={publishResult} onCheckedChange={c => setPublishResult(!!c)} />
                  <label htmlFor="publish" className="text-sm">
                    نشر النتيجة للطالب فوراً
                  </label>
                </div>
              </div>}
          </div>
        </ScrollArea>

        {/* Footer - Fixed */}
        <DialogFooter className="p-6 pt-4 border-t shrink-0 gap-2">
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري الحفظ...
              </> : <>
                <Save className="ml-2 h-4 w-4" />
                حفظ التصحيح
              </>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
}