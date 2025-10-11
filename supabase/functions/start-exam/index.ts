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
      .select('*, question_bank_id')
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

    // 3. Get questions from question bank
    const { data: bankQuestions, error: questionsError } = await supabaseAdmin
      .from('question_bank')
      .select('*')
      .eq('id', exam.question_bank_id);

    if (questionsError || !bankQuestions || bankQuestions.length === 0) {
      console.error('No questions found:', questionsError);
      throw new Error('لا توجد أسئلة في بنك الأسئلة');
    }

    const questionBank = bankQuestions[0];
    const questions = questionBank.questions || [];

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('بنك الأسئلة فارغ');
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
    const examQuestions = selectedQuestions.map((q: any, index: number) => ({
      exam_id: examId,
      question_bank_id: exam.question_bank_id,
      question_text: q.question_text || q.text,
      question_type: q.question_type || q.type,
      choices: q.choices || [],
      correct_answer: q.correct_answer || q.answer,
      points: q.points || 1,
      difficulty_level: q.difficulty_level || q.difficulty || 'medium',
      bank_category: q.category || null
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
  const questionsPerDifficulty = exam.questions_per_difficulty || {
    easy: 5,
    medium: 10,
    hard: 5
  };

  const selected: any[] = [];
  
  // Group questions by difficulty
  const byDifficulty: Record<string, any[]> = {
    easy: [],
    medium: [],
    hard: []
  };

  questions.forEach(q => {
    const difficulty = (q.difficulty_level || q.difficulty || 'medium').toLowerCase();
    if (byDifficulty[difficulty]) {
      byDifficulty[difficulty].push(q);
    }
  });

  // Select random questions from each difficulty
  for (const [difficulty, count] of Object.entries(questionsPerDifficulty)) {
    const available = byDifficulty[difficulty] || [];
    const shuffled = available.sort(() => Math.random() - 0.5);
    selected.push(...shuffled.slice(0, count as number));
  }

  // If we don't have enough questions, add more from available pool
  if (selected.length < (exam.total_questions || 20)) {
    const remaining = questions.filter(q => !selected.includes(q));
    const shuffled = remaining.sort(() => Math.random() - 0.5);
    selected.push(...shuffled.slice(0, (exam.total_questions || 20) - selected.length));
  }

  return selected;
}
