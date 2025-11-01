import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StudentExamAttempt {
  id: string;
  attempt_number: number;
  score: number;
  percentage: number;
  passed: boolean;
  time_spent_seconds: number;
  submitted_at: string;
  total_points: number;
  total_questions: number;
  exam_title: string;
  passing_percentage: number;
}

export const useStudentExamAttempts = (
  examId: string | null,
  studentUserId: string | null
) => {
  return useQuery({
    queryKey: ["student-exam-attempts", examId, studentUserId],
    queryFn: async () => {
      if (!examId || !studentUserId) return null;

      // جلب بيانات الطالب
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", studentUserId)
        .maybeSingle();

      if (studentError) throw studentError;
      if (!student) return null;

      // جلب معلومات الامتحان
      const { data: exam, error: examError } = await supabase
        .from("exams")
        .select("title, total_questions, total_points, passing_percentage, max_attempts")
        .eq("id", examId)
        .single();

      if (examError) throw examError;

      // جلب جميع محاولات الطالب للامتحان
      const { data: attempts, error: attemptsError } = await supabase
        .from("exam_attempts")
        .select("*")
        .eq("exam_id", examId)
        .eq("student_id", student.id)
        .eq("status", "submitted")
        .order("attempt_number", { ascending: true });

      if (attemptsError) throw attemptsError;

      const formattedAttempts: StudentExamAttempt[] = (attempts || []).map((attempt) => ({
        id: attempt.id,
        attempt_number: attempt.attempt_number,
        score: attempt.score || 0,
        percentage: attempt.percentage || 0,
        passed: attempt.passed || false,
        time_spent_seconds: attempt.time_spent_seconds || 0,
        submitted_at: attempt.submitted_at || attempt.updated_at || "",
        total_points: exam.total_points,
        total_questions: exam.total_questions,
        exam_title: exam.title,
        passing_percentage: exam.passing_percentage,
      }));

      return {
        attempts: formattedAttempts,
        examInfo: {
          title: exam.title,
          total_questions: exam.total_questions,
          total_points: exam.total_points,
          passing_percentage: exam.passing_percentage,
          max_attempts: exam.max_attempts,
          attempts_used: formattedAttempts.length,
          attempts_remaining: Math.max(0, exam.max_attempts - formattedAttempts.length),
        },
      };
    },
    enabled: !!examId && !!studentUserId,
  });
};
