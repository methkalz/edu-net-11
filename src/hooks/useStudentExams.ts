import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StudentExam {
  id: string;
  title: string;
  description?: string;
  duration_minutes: number;
  total_questions: number;
  grade_levels: string[];
  target_class_ids?: string[];
  max_attempts: number;
  status: string;
  created_at: string;
  created_by: string;
  teacher_name?: string;
  my_attempts_count?: number;
  best_score?: number;
  question_sources?: {
    type: 'sections' | 'random';
    sections?: string[];
  };
  pass_percentage?: number;
}

export interface ExamAttempt {
  id: string;
  teacher_exam_id: string;
  student_id: string;
  started_at: string;
  finished_at?: string | null;
  status: 'in_progress' | 'completed' | 'expired';
  total_score: number;
  max_score: number;
  exam_title?: string;
}

export interface ExamQuestion {
  id: string;
  question_text: string;
  question_type: string;
  choices?: any;
  points: number;
  display_order?: number;
  correct_answer?: string;
}

export interface StudentAnswer {
  question_id: string;
  student_answer: string;
  answered_at?: string;
}

export const useStudentExams = () => {
  const [exams, setExams] = useState<StudentExam[]>([]);
  const [myAttempts, setMyAttempts] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentExam, setCurrentExam] = useState<StudentExam | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<ExamAttempt | null>(null);
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);

  // جلب الاختبارات المتاحة للطالب
  const fetchAvailableExams = async () => {
    setLoading(true);
    try {
      // 1. جلب معلومات الطالب
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('المستخدم غير مسجل');

      // 2. جلب صف الطالب وclass_id
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select(`
          id,
          class_students!inner(
            class_id,
            classes!inner(
              grade_levels!inner(code)
            )
          )
        `)
        .eq('user_id', user.user.id)
        .single();

      if (studentError) throw studentError;

      const studentClassId = studentData.class_students[0]?.class_id;
      const studentGrade = studentData.class_students[0]?.classes?.grade_levels?.code;

      if (!studentClassId || !studentGrade) {
        toast.error('لم يتم العثور على بيانات الطالب');
        setLoading(false);
        return;
      }

      console.log('🔍 Student Info:', { 
        studentClassId, 
        studentGrade,
        userId: user.user.id 
      });

      // 3. جلب الاختبارات مع فلترة صريحة
      console.log('📝 Fetching exams with filters:', {
        status: 'published',
        is_active: true,
        grade: studentGrade,
        classId: studentClassId
      });

      const { data: examsData, error } = await supabase
        .from('teacher_exams')
        .select('*')
        .eq('status', 'published')
        .eq('is_active', true)
        .contains('grade_levels', [studentGrade])
        .contains('target_class_ids', [studentClassId])
        .order('created_at', { ascending: false });

      console.log('📊 Query Result:', { 
        error: error?.message, 
        count: examsData?.length,
        exams: examsData 
      });

      if (error) {
        console.error('❌ Error fetching exams:', error);
        throw error;
      }

      console.log('✅ Fetched Exams:', examsData);

      // 4. فلترة إضافية من جانب العميل لضمان عدم وجود NULL
      const filteredExams = (examsData || []).filter(exam => 
        exam.grade_levels && 
        exam.grade_levels.length > 0 &&
        !exam.grade_levels.includes(null) &&
        exam.grade_levels.includes(studentGrade) &&
        exam.target_class_ids &&
        exam.target_class_ids.includes(studentClassId)
      );

      console.log('Filtered Exams:', filteredExams);

      // 5. جلب عدد المحاولات وأفضل نتيجة
      const examsWithAttempts = await Promise.all(
        filteredExams.map(async (exam) => {
          const { count } = await supabase
            .from('exam_attempts')
            .select('*', { count: 'exact', head: true })
            .eq('teacher_exam_id', exam.id)
            .eq('student_id', user.user.id);

          const { data: bestAttempt } = await supabase
            .from('exam_attempts')
            .select('total_score')
            .eq('teacher_exam_id', exam.id)
            .eq('student_id', user.user.id)
            .eq('status', 'completed')
            .order('total_score', { ascending: false })
            .limit(1)
            .single();

          return {
            ...exam,
            teacher_name: 'المعلم',
            my_attempts_count: count || 0,
            best_score: bestAttempt?.total_score || 0,
            question_sources: exam.question_sources as any
          } as StudentExam;
        })
      );

      setExams(examsWithAttempts);
    } catch (error: any) {
      console.error('Error fetching exams:', error);
      toast.error('فشل تحميل الاختبارات');
    } finally {
      setLoading(false);
    }
  };

  // جلب محاولات الطالب
  const fetchMyAttempts = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('exam_attempts')
        .select(`
          *,
          teacher_exams(title)
        `)
        .eq('student_id', user.user.id)
        .order('started_at', { ascending: false});

      if (error) throw error;

      setMyAttempts((data || []).map((attempt: any) => ({
        id: attempt.id,
        teacher_exam_id: attempt.teacher_exam_id,
        student_id: attempt.student_id,
        started_at: attempt.started_at,
        finished_at: attempt.finished_at,
        status: attempt.status as 'in_progress' | 'completed' | 'expired',
        total_score: attempt.total_score,
        max_score: attempt.max_score,
        exam_title: attempt.teacher_exams?.title || 'اختبار'
      })));
    } catch (error: any) {
      console.error('Error fetching attempts:', error);
    }
  };

  // بدء محاولة جديدة
  const startExam = async (examId: string): Promise<string | null> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast.error('يجب تسجيل الدخول');
        return null;
      }

      // التحقق من عدد المحاولات
      const exam = exams.find(e => e.id === examId);
      if (!exam) {
        toast.error('الاختبار غير موجود');
        return null;
      }

      if (exam.my_attempts_count && exam.my_attempts_count >= exam.max_attempts) {
        toast.error(`لقد استنفذت جميع المحاولات المتاحة (${exam.max_attempts})`);
        return null;
      }

      // توليد الأسئلة بناءً على question_sources
      const questionSources = exam.question_sources as any;
      let bankQuestions: any[] = [];

      if (questionSources?.type === 'sections' && questionSources.sections?.length > 0) {
        // جلب أسئلة من الأقسام المحددة
        const { data: sectionQuestions, error: questionsError } = await supabase
          .from('question_bank')
          .select('*')
          .in('section_id', questionSources.sections)
          .limit(exam.total_questions || 10);

        if (questionsError) throw questionsError;
        bankQuestions = sectionQuestions || [];
      } else if (questionSources?.type === 'random') {
        // جلب أسئلة عشوائية من بنك الأسئلة
        const { data: randomQuestions, error: questionsError } = await supabase
          .from('question_bank')
          .select('*')
          .limit(exam.total_questions || 10);

        if (questionsError) throw questionsError;
        bankQuestions = randomQuestions || [];
      }

      if (!bankQuestions || bankQuestions.length === 0) {
        toast.error('الاختبار لا يحتوي على أسئلة');
        return null;
      }

      // نسخ الأسئلة إلى exam_questions للربط مع exam_attempt_questions
      const examQuestionsToInsert = bankQuestions.map(q => ({
        exam_id: examId,
        question_bank_id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        choices: q.choices,
        correct_answer: q.correct_answer,
        points: q.points || 1,
        difficulty_level: q.difficulty_level,
        bank_category: q.category
      }));

      const { data: insertedQuestions, error: insertError } = await supabase
        .from('exam_questions')
        .insert(examQuestionsToInsert)
        .select();

      if (insertError) throw insertError;
      if (!insertedQuestions || insertedQuestions.length === 0) {
        toast.error('فشل في إنشاء أسئلة الاختبار');
        return null;
      }

      const questions = insertedQuestions;

      // إنشاء محاولة جديدة
      const { data: attempt, error: attemptError } = await supabase
        .from('exam_attempts')
        .insert({
          teacher_exam_id: examId,
          student_id: user.user.id,
          status: 'in_progress',
          max_score: questions.reduce((sum, q) => sum + (q.points || 0), 0),
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (attemptError) throw attemptError;

      // إنشاء سجلات للأسئلة
      const attemptQuestions = questions.map((q, index) => ({
        attempt_id: attempt.id,
        question_id: q.id,
        display_order: index + 1
      }));

      const { error: questionsInsertError } = await supabase
        .from('exam_attempt_questions')
        .insert(attemptQuestions);

      if (questionsInsertError) throw questionsInsertError;

      setCurrentAttempt({
        id: attempt.id,
        teacher_exam_id: attempt.teacher_exam_id,
        student_id: attempt.student_id,
        started_at: attempt.started_at,
        finished_at: attempt.finished_at,
        status: attempt.status as 'in_progress' | 'completed' | 'expired',
        total_score: attempt.total_score,
        max_score: attempt.max_score
      });
      setExamQuestions(questions as any);
      setCurrentExam(exam);

      toast.success('تم بدء الاختبار بنجاح');
      return attempt.id;
    } catch (error: any) {
      console.error('Error starting exam:', error);
      toast.error('فشل بدء الاختبار');
      return null;
    }
  };

  // حفظ إجابة
  const saveAnswer = async (attemptId: string, questionId: string, answer: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('exam_attempt_questions')
        .update({
          student_answer: answer,
          answered_at: new Date().toISOString()
        })
        .eq('attempt_id', attemptId)
        .eq('question_id', questionId);

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error saving answer:', error);
      return false;
    }
  };

  // إنهاء الاختبار وحساب النتيجة
  const submitExam = async (attemptId: string): Promise<boolean> => {
    try {
      // جلب الأسئلة والإجابات
      const { data: attemptQuestions, error: questionsError } = await supabase
        .from('exam_attempt_questions')
        .select(`
          *,
          exam_questions(correct_answer, points)
        `)
        .eq('attempt_id', attemptId);

      if (questionsError) throw questionsError;

      // حساب النتيجة (100 / عدد الأسئلة) * عدد الإجابات الصحيحة
      let correctAnswers = 0;
      const totalQuestions = attemptQuestions?.length || 0;

      attemptQuestions?.forEach((aq: any) => {
        const correctAnswer = aq.exam_questions?.correct_answer;
        const studentAnswer = aq.student_answer;

        if (correctAnswer && studentAnswer && correctAnswer === studentAnswer) {
          correctAnswers++;
        }
      });

      const totalScore = Math.round((correctAnswers / totalQuestions) * 100);

      // تحديث المحاولة
      const { error: updateError } = await supabase
        .from('exam_attempts')
        .update({
          status: 'completed',
          finished_at: new Date().toISOString(),
          total_score: totalScore
        })
        .eq('id', attemptId);

      if (updateError) throw updateError;

      toast.success(`تم تسليم الاختبار! النتيجة: ${totalScore}/100`);
      return true;
    } catch (error: any) {
      console.error('Error submitting exam:', error);
      toast.error('فشل تسليم الاختبار');
      return false;
    }
  };

  // جلب تفاصيل محاولة معينة
  const fetchAttemptDetails = async (attemptId: string) => {
    try {
      const { data: attempt, error: attemptError } = await supabase
        .from('exam_attempts')
        .select(`
          *,
          teacher_exams(title, duration_minutes)
        `)
        .eq('id', attemptId)
        .single();

      if (attemptError) throw attemptError;

      const { data: questions, error: questionsError } = await supabase
        .from('exam_attempt_questions')
        .select(`
          *,
          exam_questions(*)
        `)
        .eq('attempt_id', attemptId)
        .order('display_order');

      if (questionsError) throw questionsError;

      return {
        attempt,
        questions
      };
    } catch (error: any) {
      console.error('Error fetching attempt details:', error);
      toast.error('فشل تحميل تفاصيل المحاولة');
      return null;
    }
  };

  useEffect(() => {
    fetchAvailableExams();
    fetchMyAttempts();
  }, []);

  return {
    exams,
    myAttempts,
    loading,
    currentExam,
    currentAttempt,
    examQuestions,
    startExam,
    saveAnswer,
    submitExam,
    fetchAttemptDetails,
    refetch: () => {
      fetchAvailableExams();
      fetchMyAttempts();
    }
  };
};