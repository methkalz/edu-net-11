import React, { useState } from 'react';
import { GraduationCap, Plus, FileText, Loader2, Trash2, Eye, Pencil, Send } from 'lucide-react';
import ModernHeader from '@/components/shared/ModernHeader';
import AppFooter from '@/components/shared/AppFooter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import BagrutExamUploader from '@/components/bagrut/BagrutExamUploader';
import BagrutExamPreview from '@/components/bagrut/BagrutExamPreview';
import BagrutPublishDialog from '@/components/bagrut/BagrutPublishDialog';
import { BagrutDevConsole } from '@/components/bagrut/BagrutDevConsole';
import { buildBagrutPreviewFromDb } from '@/lib/bagrut/buildBagrutPreview';
import type { ParsedExam, Statistics, ParsedQuestion } from '@/lib/bagrut/buildBagrutPreview';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type AnswersReport = {
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  unansweredList: Array<{ question_number: string; question_type: string; reason: string }>;
};
type ViewState = 'list' | 'upload' | 'preview' | 'db_preview';
const BagrutManagement: React.FC = () => {
  const {
    userProfile
  } = useAuth();
  const [viewState, setViewState] = useState<ViewState>('list');
  // Use loose typing here to avoid TS2322 with complex JSON shapes (table_data / correct_answer_data)
  const [parsedExam, setParsedExam] = useState<any>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [answersReport, setAnswersReport] = useState<AnswersReport | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingExamId, setDeletingExamId] = useState<string | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<{ id: string; title: string } | null>(null);

  const [editIdentifierOpen, setEditIdentifierOpen] = useState(false);
  const [examToEditIdentifier, setExamToEditIdentifier] = useState<{ id: string; title: string; exam_code?: string | null } | null>(null);
  const [editedExamCode, setEditedExamCode] = useState('');

  // حالة dialog النشر
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [examToPublish, setExamToPublish] = useState<any>(null);

  const openPublishDialog = (exam: any) => {
    setExamToPublish(exam);
    setPublishDialogOpen(true);
  };

  // Preview an existing exam from DB
  const handlePreviewExam = async (examId: string) => {
    setPreviewLoadingId(examId);
    try {
      const { data: examRow, error: examError } = await supabase
        .from('bagrut_exams')
        .select('*')
        .eq('id', examId)
        .single();
      if (examError) throw examError;

      const { data: sectionRows, error: sectionsError } = await supabase
        .from('bagrut_exam_sections')
        .select('*')
        .eq('exam_id', examId)
        .order('order_index', { ascending: true });
      if (sectionsError) throw sectionsError;

      const { data: questionRows, error: questionsError } = await supabase
        .from('bagrut_questions')
        .select('*')
        .eq('exam_id', examId)
        .order('order_index', { ascending: true });
      if (questionsError) throw questionsError;

      const rebuilt = buildBagrutPreviewFromDb({
        exam: examRow as any,
        sections: (sectionRows || []) as any,
        questions: (questionRows || []) as any
      });

      setParsedExam(rebuilt.exam as any);
      setStatistics(rebuilt.statistics as any);
      setViewState('db_preview');
    } catch (error) {
      console.error('Error previewing exam:', error);
      toast.error('حدث خطأ أثناء معاينة الامتحان');
    } finally {
      setPreviewLoadingId(null);
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (examId: string, examTitle: string) => {
    setExamToDelete({ id: examId, title: examTitle });
    setDeleteDialogOpen(true);
  };

  const openEditIdentifierDialog = (exam: { id: string; title: string; exam_code?: string | null }) => {
    setExamToEditIdentifier({ id: exam.id, title: exam.title, exam_code: exam.exam_code });
    setEditedExamCode(exam.exam_code || '');
    setEditIdentifierOpen(true);
  };

  const handleSaveExamIdentifier = async () => {
    if (!examToEditIdentifier) return;

    try {
      const { error } = await supabase
        .from('bagrut_exams')
        .update({
          exam_code: editedExamCode?.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', examToEditIdentifier.id);

      if (error) throw error;
      toast.success('تم تحديث معرف الامتحان');
      setEditIdentifierOpen(false);
      setExamToEditIdentifier(null);
      await refetch();
    } catch (e) {
      console.error('Error updating exam identifier:', e);
      toast.error('فشل في تحديث معرف الامتحان');
    }
  };

  // Delete exam function
  const handleDeleteExam = async () => {
    if (!examToDelete) return;

    setDeleteDialogOpen(false);
    setDeletingExamId(examToDelete.id);
    
    try {
      // Delete related questions first
      const { error: questionsError } = await supabase
        .from('bagrut_questions')
        .delete()
        .eq('exam_id', examToDelete.id);
      
      if (questionsError) throw questionsError;

      // Delete related sections
      const { error: sectionsError } = await supabase
        .from('bagrut_exam_sections')
        .delete()
        .eq('exam_id', examToDelete.id);
      
      if (sectionsError) throw sectionsError;

      // Delete the exam itself
      const { error: examError } = await supabase
        .from('bagrut_exams')
        .delete()
        .eq('id', examToDelete.id);
      
      if (examError) throw examError;

      toast.success('تم حذف الامتحان بنجاح');
      refetch();
    } catch (error) {
      console.error('Error deleting exam:', error);
      toast.error('حدث خطأ أثناء حذف الامتحان');
    } finally {
      setDeletingExamId(null);
      setExamToDelete(null);
    }
  };

  // Fetch existing exams
  const {
    data: exams,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['bagrut-exams'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('bagrut_exams').select('*').order('created_at', {
        ascending: false
      });
      if (error) throw error;
      return data;
    },
    enabled: userProfile?.role === 'superadmin'
  });

  // Handle exam parsed from uploader
  const handleExamParsed = (exam: ParsedExam, stats: Statistics, report?: AnswersReport) => {
    setParsedExam(exam);
    setStatistics(stats);
    setAnswersReport(report || null);
    setViewState('preview');
  };

  // Save exam to database
  const handleSaveExam = async () => {
    if (!parsedExam || !statistics) return;
    setIsSaving(true);
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('يجب تسجيل الدخول');

      // Insert main exam
      const {
        data: examData,
        error: examError
      } = await supabase.from('bagrut_exams').insert({
        title: parsedExam.title,
        exam_year: parsedExam.exam_year,
        exam_season: parsedExam.exam_season as 'summer' | 'winter' | 'spring',
        exam_code: parsedExam.exam_code,
        subject: parsedExam.subject,
        duration_minutes: parsedExam.duration_minutes,
        total_points: parsedExam.total_points,
        instructions: parsedExam.instructions,
        status: 'ready',
        created_by: user.id,
        ai_parsed_at: new Date().toISOString()
      }).select().single();
      if (examError) throw examError;

      // Insert sections
      for (const section of parsedExam.sections) {
        const {
          data: sectionData,
          error: sectionError
        } = await supabase.from('bagrut_exam_sections').insert({
          exam_id: examData.id,
          section_number: section.section_number,
          section_title: section.section_title,
          section_type: section.section_type as 'mandatory' | 'elective',
          total_points: Math.round(section.total_points || 0),
          specialization: section.specialization,
          specialization_label: section.specialization_label,
          instructions: section.instructions,
          order_index: section.section_number - 1
        }).select().single();
        if (sectionError) throw sectionError;

        // Insert questions for this section
        for (let i = 0; i < section.questions.length; i++) {
          const question = section.questions[i];
          await insertQuestion(examData.id, sectionData.id, question, i, null);
        }
      }
      toast.success('تم حفظ الامتحان بنجاح!');
      setViewState('list');
      setParsedExam(null);
      setStatistics(null);
      setAnswersReport(null);
      refetch();
    } catch (error) {
      console.error('Error saving exam:', error);
      toast.error(error instanceof Error ? error.message : 'فشل في حفظ الامتحان');
    } finally {
      setIsSaving(false);
    }
  };

  // Recursive function to insert questions
  const insertQuestion = async (examId: string, sectionId: string, question: any, orderIndex: number, parentId: string | null) => {
    const correctAnswerData =
      question?.correct_answer_data ??
      (question?.blanks?.length ? { blanks: question.blanks } : null);

    const safeTableData = question?.table_data ? JSON.parse(JSON.stringify(question.table_data)) : null;
    const safeChoices = question?.choices ? JSON.parse(JSON.stringify(question.choices)) : null;
    const safeCorrectAnswerData = correctAnswerData ? JSON.parse(JSON.stringify(correctAnswerData)) : null;

    const insertPayload: any = {
      exam_id: examId,
      section_id: sectionId,
      question_number: question.question_number,
      question_text: question.question_text,
      question_type: question.question_type as any,
      points: Math.round(question.points || 0),
      has_image: question.has_image || false,
      image_alt_text: question.image_description,
      image_url: question.image_url || null,
       has_table: (question.has_table || !!question.table_data) || false,
      table_data: safeTableData,
      has_code: question.has_code || false,
      code_content: question.code_content,
      choices: safeChoices,
      correct_answer: question.correct_answer,
      correct_answer_data: safeCorrectAnswerData,
      answer_explanation: question.answer_explanation,
      parent_question_id: parentId,
      sub_question_label: question.sub_question_label,
      topic_tags: question.topic_tags || [],
      order_index: orderIndex
    };

    const {
      data: questionData,
      error: questionError
    } = await (supabase.from('bagrut_questions') as any).insert(insertPayload).select().single();
    if (questionError) throw questionError;

    // Insert sub-questions recursively
    if (question.sub_questions && question.sub_questions.length > 0) {
      for (let i = 0; i < question.sub_questions.length; i++) {
        await insertQuestion(examId, sectionId, question.sub_questions[i], i, questionData.id);
      }
    }
  };

  // Handle exam update from preview (for image uploads)
  const handleExamUpdate = (updatedExam: ParsedExam) => {
    // keep local state, but avoid overly strict typing against Supabase Json
    setParsedExam(updatedExam as any);
  };

  // Save edits to existing exam in database
  const handleSaveEditsToDb = async (updatedExam: ParsedExam) => {
    if (!updatedExam.exam_db_id) {
      toast.error('لا يمكن حفظ التعديلات: معرف الامتحان مفقود');
      return;
    }

    try {
      // Collect all questions to update (recursively)
      const collectQuestionsToUpdate = (questions: ParsedQuestion[]): ParsedQuestion[] => {
        const result: ParsedQuestion[] = [];
        for (const q of questions) {
          if (q.question_db_id) {
            result.push(q);
          }
          if (q.sub_questions && q.sub_questions.length > 0) {
            result.push(...collectQuestionsToUpdate(q.sub_questions));
          }
        }
        return result;
      };

      const allQuestions: ParsedQuestion[] = [];
      for (const section of updatedExam.sections) {
        allQuestions.push(...collectQuestionsToUpdate(section.questions));
      }

      // Update questions in parallel batches
      const updatePromises = allQuestions.map(async (q) => {
        if (!q.question_db_id) return;

        const correctAnswerData =
          (q as any).correct_answer_data ??
          ((q as any).blanks?.length ? { blanks: (q as any).blanks } : null);

        const safeTableData = (q as any).table_data ? JSON.parse(JSON.stringify((q as any).table_data)) : null;
        const safeChoices = (q as any).choices ? JSON.parse(JSON.stringify((q as any).choices)) : null;
        const safeCorrectAnswerData = correctAnswerData ? JSON.parse(JSON.stringify(correctAnswerData)) : null;

         const updatePayload: any = {
          question_text: q.question_text,
          points: Math.round(q.points || 0),
          choices: safeChoices,
          correct_answer: q.correct_answer,
          correct_answer_data: safeCorrectAnswerData,
          answer_explanation: q.answer_explanation,
           has_table: ((q as any).has_table || !!(q as any).table_data) || false,
          table_data: safeTableData,
          code_content: q.code_content,
          updated_at: new Date().toISOString()
        };

        const { error } = await (supabase.from('bagrut_questions') as any)
          .update(updatePayload)
          .eq('id', q.question_db_id);

        if (error) throw error;
      });

      await Promise.all(updatePromises);

      toast.success('تم حفظ التعديلات بنجاح!');
      
      // Refresh the exam data
      if (updatedExam.exam_db_id) {
        await handlePreviewExam(updatedExam.exam_db_id);
      }
    } catch (error) {
      console.error('Error saving edits:', error);
      toast.error('فشل في حفظ التعديلات');
      throw error;
    }
  };

  // Access check
  if (userProfile?.role !== 'superadmin') {
    return <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">غير مصرح لك بالوصول</h2>
          <p className="text-muted-foreground">هذه الصفحة مخصصة لمدراء النظام فقط</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <ModernHeader title="إدارة امتحانات البجروت" showBackButton={true} backPath="/content-management" />
      
      <main className="container mx-auto px-6 py-8 flex-1">
        {viewState === 'list' && <div className="space-y-6">
            {/* Header with Add Button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-8 w-8 text-orange-600" />
                <div>
                  <h1 className="text-2xl font-bold">امتحانات البجروت</h1>
                  <p className="text-muted-foreground">إدارة ورفع امتحانات البجروت بالذكاء الاصطناعي</p>
                </div>
              </div>
              <Button onClick={() => setViewState('upload')} className="gap-2">
                <Plus className="h-4 w-4" />
                رفع امتحان جديد
              </Button>
            </div>

            {/* Exams List */}
            {isLoading ? <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div> : exams && exams.length > 0 ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                 {exams.map(exam => <Card key={exam.id} className="hover:shadow-md transition-shadow relative group">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileText className="h-5 w-5 text-orange-500" />
                          <span className="line-clamp-2">{exam.title}</span>
                        </CardTitle>

                        <span className="shrink-0 px-2 py-1 rounded-md text-xs bg-muted text-foreground">
                          #{(exam as any).exam_number}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>{exam.subject} - {exam.exam_year}</p>
                        <p>
                          معرف الامتحان: {(exam.exam_code || '—')}
                        </p>
                        <p>{exam.duration_minutes} دقيقة | {exam.total_points} علامة</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${exam.is_published ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                            {exam.is_published ? 'منشور' : 'مسودة'}
                          </span>
                           <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Button
                               variant="ghost"
                               size="icon"
                               className="h-8 w-8 text-muted-foreground hover:text-primary"
                               onClick={() => openPublishDialog(exam)}
                               title="إعدادات النشر"
                             >
                               <Send className="h-4 w-4" />
                             </Button>
                             <Button
                               variant="ghost"
                               size="icon"
                               className="h-8 w-8 text-muted-foreground hover:text-foreground"
                               onClick={() => openEditIdentifierDialog(exam as any)}
                               title="تعديل معرف الامتحان"
                             >
                               <Pencil className="h-4 w-4" />
                             </Button>
                             <Button
                               variant="ghost"
                               size="icon"
                               className="h-8 w-8 text-muted-foreground hover:text-foreground"
                               onClick={() => handlePreviewExam(exam.id)}
                               disabled={previewLoadingId === exam.id}
                             >
                               {previewLoadingId === exam.id ? (
                                 <Loader2 className="h-4 w-4 animate-spin" />
                               ) : (
                                 <Eye className="h-4 w-4" />
                               )}
                             </Button>
                             <Button
                               variant="ghost"
                               size="icon"
                               className="h-8 w-8 text-muted-foreground hover:text-destructive"
                               onClick={() => openDeleteDialog(exam.id, exam.title)}
                               disabled={deletingExamId === exam.id}
                             >
                               {deletingExamId === exam.id ? (
                                 <Loader2 className="h-4 w-4 animate-spin" />
                               ) : (
                                 <Trash2 className="h-4 w-4" />
                               )}
                             </Button>
                           </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>)}
              </div> : <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2 text-center">لا توجد امتحانات بعد</h3>
                  <p className="text-muted-foreground mb-4 text-center">
                    قم برفع أول امتحان بجروت لتبدأ
                  </p>
                  <Button onClick={() => setViewState('upload')} variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    رفع امتحان
                  </Button>
                </CardContent>
              </Card>}
          </div>}

        {viewState === 'upload' && <BagrutExamUploader onExamParsed={handleExamParsed} onCancel={() => setViewState('list')} />}

        {viewState === 'preview' && parsedExam && statistics && <div className="space-y-4">
            {answersReport && <Card>
                <CardContent className="py-4">
                  {answersReport.answeredCount > 0 ? <div className="space-y-2">
                      <p className="font-medium text-center">تم العثور على إجابات لـ {answersReport.answeredCount} سؤال</p>
                      {answersReport.unansweredCount > 0 ? <p className="text-sm text-muted-foreground text-center">
                          لم يتم العثور على إجابات لـ {answersReport.unansweredCount} سؤال في الملف أو تعذر التعرف عليها.
                        </p> : <p className="text-sm text-muted-foreground text-center">كل الأسئلة التي لها إجابات في الملف تم التقاطها.</p>}
                      {answersReport.unansweredCount > 0 && <div className="text-sm text-muted-foreground">
                          <p className="font-medium mb-2">أسئلة بدون إجابات مكتشفة (مختصر):</p>
                          <div className="flex flex-wrap gap-2">
                            {answersReport.unansweredList.slice(0, 20).map((q, idx) => <span key={`${q.question_number}-${idx}`} className="px-2 py-1 rounded bg-muted">
                                {q.question_number || '—'}
                              </span>)}
                            {answersReport.unansweredList.length > 20 && <span className="px-2 py-1 rounded bg-muted">+{answersReport.unansweredList.length - 20}</span>}
                          </div>
                        </div>}
                    </div> : <p className="text-sm text-muted-foreground text-center">
                      لم يتم العثور على إجابات في الملف المرفق أو تعذر التعرف عليها. يمكنك إدخال الإجابات يدويًا قبل نشر الامتحان.
                    </p>}
                </CardContent>
              </Card>}

            <BagrutExamPreview exam={parsedExam} statistics={statistics} onSave={handleSaveExam} onCancel={() => {
          setViewState('list');
          setParsedExam(null);
          setStatistics(null);
          setAnswersReport(null);
        }} onExamUpdate={handleExamUpdate} isSaving={isSaving} />
          </div>}

        {viewState === 'db_preview' && parsedExam && statistics && <BagrutExamPreview exam={parsedExam} statistics={statistics} onCancel={() => {
        setViewState('list');
        setParsedExam(null);
        setStatistics(null);
        setAnswersReport(null);
      }} onExamUpdate={handleExamUpdate} onSaveEdits={handleSaveEditsToDb} showSaveButton={false} />}
      </main>
      
      <AppFooter />
      
      {/* Dev Console - only in development */}
      {process.env.NODE_ENV === 'development' && <BagrutDevConsole />}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف الامتحان</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف امتحان "{examToDelete?.title}"؟
              <br />
              سيتم حذف جميع الأقسام والأسئلة المرتبطة به نهائياً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteExam}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              تأكيد الحذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit exam identifier (exam_code) */}
      <Dialog open={editIdentifierOpen} onOpenChange={setEditIdentifierOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل معرف الامتحان</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              الرقم التسلسلي ثابت ولا يتغير: #{(exams?.find((e: any) => e.id === examToEditIdentifier?.id) as any)?.exam_number}
            </p>

            <div className="space-y-2">
              <Label htmlFor="exam-code">معرف الامتحان (اختياري)</Label>
              <Input
                id="exam-code"
                value={editedExamCode}
                onChange={(e) => setEditedExamCode(e.target.value)}
                placeholder="مثال: CS-2025-SUMMER"
              />
              <p className="text-xs text-muted-foreground">
                يمكنك تغيير هذا المعرف في أي وقت. يُستخدم كاسم مرجعي فقط.
              </p>
            </div>
          </div>

          <DialogFooter className="flex-row-reverse gap-2">
            <Button onClick={handleSaveExamIdentifier}>حفظ</Button>
            <Button variant="outline" onClick={() => setEditIdentifierOpen(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish Dialog */}
      <BagrutPublishDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        exam={examToPublish}
        onSuccess={() => refetch()}
      />
    </div>;
};
export default BagrutManagement;