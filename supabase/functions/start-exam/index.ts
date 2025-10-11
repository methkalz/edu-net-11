import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StartExamRequest {
  examId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization')!;
    
    // Create client for user authentication
    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Create service role client for bypassing RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { examId } = await req.json() as StartExamRequest;

    console.log('Starting exam for user:', user.id, 'exam:', examId);

    // 1. Verify exam is published and active
    const { data: exam, error: examError } = await supabaseAdmin
      .from('teacher_exams')
      .select('*')
      .eq('id', examId)
      .eq('status', 'published')
      .eq('is_active', true)
      .single();

    if (examError || !exam) {
      console.error('Exam not found or not active:', examError);
      throw new Error('الاختبار غير متاح');
    }

    // 2. Check attempts count
    const { count: attemptsCount, error: countError } = await supabaseAdmin
      .from('exam_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('teacher_exam_id', examId)
      .eq('student_id', user.id);

    if (countError) {
      console.error('Error counting attempts:', countError);
      throw new Error('فشل في التحقق من المحاولات');
    }

    if ((attemptsCount || 0) >= (exam.max_attempts || 3)) {
      throw new Error('لقد استنفدت جميع المحاولات المتاحة');
    }

    // 3. Get questions from question bank based on question_sources
    const questionSources = exam.question_sources as {
      type: 'random' | 'sections';
      sections: string[];
    };

    let questionsQuery = supabaseAdmin
      .from('question_bank')
      .select('*')
      .eq('school_id', exam.school_id)
      .eq('is_active', true);

    // Filter by sections if specified
    if (questionSources && questionSources.type === 'sections' && questionSources.sections?.length > 0) {
      questionsQuery = questionsQuery.in('section_id', questionSources.sections);
    }

    const { data: questions, error: questionsError } = await questionsQuery;

    if (questionsError || !questions || questions.length === 0) {
      console.error('No questions found:', questionsError);
      throw new Error('لا توجد أسئلة متاحة في بنك الأسئلة');
    }

    // 4. Select random questions based on exam configuration
    const selectedQuestions = selectQuestions(questions, exam);

    // 5. Create exam attempt
    const maxScore = selectedQuestions.reduce((sum: number, q: any) => sum + (q.points || 1), 0);
    
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('exam_attempts')
      .insert({
        teacher_exam_id: examId,
        student_id: user.id,
        status: 'in_progress',
        max_score: maxScore,
        total_score: 0
      })
      .select()
      .single();

    if (attemptError || !attempt) {
      console.error('Error creating attempt:', attemptError);
      throw new Error('فشل في إنشاء المحاولة');
    }

    console.log('Created attempt:', attempt.id);

    // 6. Insert questions into exam_questions and exam_attempt_questions
    const examQuestions = selectedQuestions.map((q: any) => ({
      exam_id: examId,
      question_text: q.question_text,
      question_type: q.question_type,
      choices: q.choices || [],
      correct_answer: q.correct_answer,
      points: q.points || 1,
      difficulty_level: q.difficulty_level || 'medium',
      section_id: q.section_id,
      topic_id: q.topic_id,
      lesson_id: q.lesson_id
    }));

    const { data: insertedQuestions, error: insertQuestionsError } = await supabaseAdmin
      .from('exam_questions')
      .insert(examQuestions)
      .select();

    if (insertQuestionsError || !insertedQuestions) {
      console.error('Error inserting questions:', insertQuestionsError);
      // Cleanup attempt
      await supabaseAdmin.from('exam_attempts').delete().eq('id', attempt.id);
      throw new Error('فشل في إنشاء الأسئلة');
    }

    console.log('Inserted questions:', insertedQuestions.length);

    // 7. Create exam_attempt_questions records
    const attemptQuestions = insertedQuestions.map((q: any, index: number) => ({
      attempt_id: attempt.id,
      question_id: q.id,
      display_order: index + 1,
      score: 0
    }));

    const { error: attemptQuestionsError } = await supabaseAdmin
      .from('exam_attempt_questions')
      .insert(attemptQuestions);

    if (attemptQuestionsError) {
      console.error('Error creating attempt questions:', attemptQuestionsError);
      // Cleanup
      await supabaseAdmin.from('exam_questions').delete().in('id', insertedQuestions.map((q: any) => q.id));
      await supabaseAdmin.from('exam_attempts').delete().eq('id', attempt.id);
      throw new Error('فشل في ربط الأسئلة بالمحاولة');
    }

    console.log('Successfully started exam, attempt:', attempt.id);

    return new Response(
      JSON.stringify({ 
        attemptId: attempt.id,
        questionsCount: insertedQuestions.length,
        maxScore: maxScore
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in start-exam:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'حدث خطأ أثناء بدء الاختبار' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to select questions based on exam configuration
function selectQuestions(questions: any[], exam: any): any[] {
  const distribution = exam.difficulty_distribution || {
    easy: 30,    // 30%
    medium: 50,  // 50%
    hard: 20     // 20%
  };
  
  const totalQuestions = exam.total_questions || 20;
  
  // Calculate number of questions needed from each level
  const questionsNeeded = {
    easy: Math.round(totalQuestions * (distribution.easy / 100)),
    medium: Math.round(totalQuestions * (distribution.medium / 100)),
    hard: Math.round(totalQuestions * (distribution.hard / 100))
  };
  
  // Group questions by difficulty
  const byDifficulty = {
    easy: questions.filter(q => q.difficulty_level === 'easy'),
    medium: questions.filter(q => q.difficulty_level === 'medium'),
    hard: questions.filter(q => q.difficulty_level === 'hard')
  };
  
  const selected: any[] = [];
  
  // Select random questions from each level
  for (const [level, count] of Object.entries(questionsNeeded)) {
    const available = byDifficulty[level as keyof typeof byDifficulty] || [];
    const shuffled = available.sort(() => Math.random() - 0.5);
    selected.push(...shuffled.slice(0, count));
  }
  
  // If we don't have enough questions, complete from remaining
  if (selected.length < totalQuestions) {
    const remaining = questions.filter(q => !selected.includes(q));
    const shuffled = remaining.sort(() => Math.random() - 0.5);
    selected.push(...shuffled.slice(0, totalQuestions - selected.length));
  }
  
  return selected.slice(0, totalQuestions);
}
