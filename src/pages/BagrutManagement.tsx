import React, { useState } from 'react';
import { GraduationCap, Plus, FileText, Loader2, Trash2, Eye } from 'lucide-react';
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
import { BagrutDevConsole } from '@/components/bagrut/BagrutDevConsole';
import { buildBagrutPreviewFromDb } from '@/lib/bagrut/buildBagrutPreview';
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

interface ParsedQuestion {
  question_number: string;
  question_text: string;
  question_type: string;
  points: number;
  has_image?: boolean;
  image_description?: string;
  image_url?: string;
  has_table?: boolean;
  table_data?: any;
  word_bank?: string[];
  has_code?: boolean;
  code_content?: string;
  choices?: Array<{ id: string; text: string; is_correct: boolean }>;
  correct_answer?: string;
  answer_explanation?: string;
  sub_questions?: ParsedQuestion[];
  topic_tags?: string[];
  question_db_id?: string;
}

interface ParsedSection {
  section_number: number;
  section_title: string;
  section_type: 'mandatory' | 'elective';
  total_points: number;
  specialization?: string;
  specialization_label?: string;
  instructions?: string;
  questions: ParsedQuestion[];
  section_db_id?: string;
}

interface ParsedExam {
  title: string;
  exam_year: number;
  exam_season: string;
  exam_code?: string;
  subject: string;
  duration_minutes: number;
  total_points: number;
  instructions?: string;
  sections: ParsedSection[];
  exam_db_id?: string;
}

interface Statistics {
  totalSections: number;
  totalQuestions: number;
  questionsByType: Record<string, number>;
  totalPoints: number;
}
type ViewState = 'list' | 'upload' | 'preview' | 'db_preview';
const BagrutManagement: React.FC = () => {
  const {
    userProfile
  } = useAuth();
  const [viewState, setViewState] = useState<ViewState>('list');
  const [parsedExam, setParsedExam] = useState<ParsedExam | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingExamId, setDeletingExamId] = useState<string | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<{ id: string; title: string } | null>(null);

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
  const handleExamParsed = (exam: ParsedExam, stats: Statistics) => {
    setParsedExam(exam);
    setStatistics(stats);
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
    const {
      data: questionData,
      error: questionError
    } = await supabase.from('bagrut_questions').insert({
      exam_id: examId,
      section_id: sectionId,
      question_number: question.question_number,
      question_text: question.question_text,
      question_type: question.question_type as any,
      points: Math.round(question.points || 0),
      has_image: question.has_image || false,
      image_alt_text: question.image_description,
      image_url: question.image_url || null,
      has_table: question.has_table || false,
      table_data: question.table_data,
      has_code: question.has_code || false,
      code_content: question.code_content,
      choices: question.choices,
      correct_answer: question.correct_answer,
      answer_explanation: question.answer_explanation,
      parent_question_id: parentId,
      sub_question_label: question.sub_question_label,
      topic_tags: question.topic_tags || [],
      order_index: orderIndex
    }).select().single();
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
    setParsedExam(updatedExam);
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

        const { error } = await supabase
          .from('bagrut_questions')
          .update({
            question_text: q.question_text,
            points: Math.round(q.points || 0),
            choices: q.choices,
            correct_answer: q.correct_answer,
            answer_explanation: q.answer_explanation,
            table_data: q.table_data,
            code_content: q.code_content,
            updated_at: new Date().toISOString()
          })
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
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-orange-500" />
                        {exam.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>{exam.subject} - {exam.exam_year}</p>
                        <p>{exam.duration_minutes} دقيقة | {exam.total_points} نقطة</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${exam.is_published ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                            {exam.is_published ? 'منشور' : 'مسودة'}
                          </span>
                           <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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

        {viewState === 'preview' && parsedExam && statistics && <BagrutExamPreview exam={parsedExam} statistics={statistics} onSave={handleSaveExam} onCancel={() => {
        setViewState('list');
        setParsedExam(null);
        setStatistics(null);
      }} onExamUpdate={handleExamUpdate} isSaving={isSaving} />}

        {viewState === 'db_preview' && parsedExam && statistics && <BagrutExamPreview exam={parsedExam} statistics={statistics} onCancel={() => {
        setViewState('list');
        setParsedExam(null);
        setStatistics(null);
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
    </div>;
};
export default BagrutManagement;