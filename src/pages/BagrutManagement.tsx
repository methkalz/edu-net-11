import React, { useState } from 'react';
import { GraduationCap, Plus, FileText, Loader2 } from 'lucide-react';
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

interface ParsedExam {
  title: string;
  exam_year: number;
  exam_season: string;
  exam_code?: string;
  subject: string;
  duration_minutes: number;
  total_points: number;
  instructions?: string;
  sections: any[];
}

interface Statistics {
  totalSections: number;
  totalQuestions: number;
  questionsByType: Record<string, number>;
  totalPoints: number;
}

type ViewState = 'list' | 'upload' | 'preview';

const BagrutManagement: React.FC = () => {
  const { userProfile } = useAuth();
  const [viewState, setViewState] = useState<ViewState>('list');
  const [parsedExam, setParsedExam] = useState<ParsedExam | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch existing exams
  const { data: exams, isLoading, refetch } = useQuery({
    queryKey: ['bagrut-exams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bagrut_exams')
        .select('*')
        .order('created_at', { ascending: false });
      
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('يجب تسجيل الدخول');

      // Insert main exam
      const { data: examData, error: examError } = await supabase
        .from('bagrut_exams')
        .insert({
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
        })
        .select()
        .single();

      if (examError) throw examError;

      // Insert sections
      for (const section of parsedExam.sections) {
        const { data: sectionData, error: sectionError } = await supabase
          .from('bagrut_exam_sections')
          .insert({
            exam_id: examData.id,
            section_number: section.section_number,
            section_title: section.section_title,
            section_type: section.section_type as 'mandatory' | 'elective',
            total_points: section.total_points,
            specialization: section.specialization,
            specialization_label: section.specialization_label,
            instructions: section.instructions,
            order_index: section.section_number - 1
          })
          .select()
          .single();

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
  const insertQuestion = async (
    examId: string, 
    sectionId: string, 
    question: any, 
    orderIndex: number,
    parentId: string | null
  ) => {
    const { data: questionData, error: questionError } = await supabase
      .from('bagrut_questions')
      .insert({
        exam_id: examId,
        section_id: sectionId,
        question_number: question.question_number,
        question_text: question.question_text,
        question_type: question.question_type as any,
        points: question.points,
        has_image: question.has_image || false,
        image_alt_text: question.image_description,
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
      })
      .select()
      .single();

    if (questionError) throw questionError;

    // Insert sub-questions recursively
    if (question.sub_questions && question.sub_questions.length > 0) {
      for (let i = 0; i < question.sub_questions.length; i++) {
        await insertQuestion(examId, sectionId, question.sub_questions[i], i, questionData.id);
      }
    }
  };

  // Access check
  if (userProfile?.role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">غير مصرح لك بالوصول</h2>
          <p className="text-muted-foreground">هذه الصفحة مخصصة لمدراء النظام فقط</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <ModernHeader 
        title="إدارة امتحانات البجروت" 
        showBackButton={true} 
        backPath="/content-management" 
      />
      
      <main className="container mx-auto px-6 py-8 flex-1">
        {viewState === 'list' && (
          <div className="space-y-6">
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
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : exams && exams.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {exams.map((exam) => (
                  <Card key={exam.id} className="hover:shadow-md transition-shadow">
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
                        <div className="flex items-center gap-2 mt-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            exam.is_published 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}>
                            {exam.is_published ? 'منشور' : 'مسودة'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">لا توجد امتحانات بعد</h3>
                  <p className="text-muted-foreground mb-4">
                    قم برفع أول امتحان بجروت لتبدأ
                  </p>
                  <Button onClick={() => setViewState('upload')} variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    رفع امتحان
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {viewState === 'upload' && (
          <BagrutExamUploader 
            onExamParsed={handleExamParsed}
            onCancel={() => setViewState('list')}
          />
        )}

        {viewState === 'preview' && parsedExam && statistics && (
          <BagrutExamPreview
            exam={parsedExam}
            statistics={statistics}
            onSave={handleSaveExam}
            onCancel={() => {
              setViewState('list');
              setParsedExam(null);
              setStatistics(null);
            }}
            isSaving={isSaving}
          />
        )}
      </main>
      
      <AppFooter />
    </div>
  );
};

export default BagrutManagement;
