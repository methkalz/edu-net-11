import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FixHistoryEntry {
  id: string;
  action: string;
  created_at_utc: string;
  payload_json: {
    summary: {
      total: number;
      confirmed: number;
      corrected: number;
      normalized: number;
      skipped: number;
      dryRun: boolean;
    };
    results: Array<{
      question_id: string;
      question_text: string;
      old_answer: string;
      new_answer: string;
      status: string;
      explanation: string;
      confidence: string;
    }>;
  };
}

export interface QuestionBankStats {
  total: number;
  trueCount: number;
  falseCount: number;
  brokenCount: number;
}

export function useTrueFalseFixHistory() {
  const historyQuery = useQuery({
    queryKey: ['true-false-fix-history'],
    queryFn: async (): Promise<FixHistoryEntry[]> => {
      const { data, error } = await supabase
        .from('audit_log')
        .select('id, action, created_at_utc, payload_json')
        .eq('entity', 'true_false_fix')
        .order('created_at_utc', { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data || []) as unknown as FixHistoryEntry[];
    },
  });

  const statsQuery = useQuery({
    queryKey: ['true-false-question-stats'],
    queryFn: async (): Promise<QuestionBankStats> => {
      const { data, error } = await supabase
        .from('question_bank')
        .select('id, correct_answer, choices')
        .eq('question_type', 'true_false')
        .eq('is_active', true);

      if (error) throw error;

      const questions = data || [];
      let trueCount = 0;
      let falseCount = 0;
      let brokenCount = 0;

      for (const q of questions) {
        const choices = q.choices as any[];
        const correctAnswer = q.correct_answer;

        if (!choices || !Array.isArray(choices)) {
          brokenCount++;
          continue;
        }

        const matchExists = choices.some((c: any) => c.id === correctAnswer);
        if (!matchExists) {
          brokenCount++;
          continue;
        }

        const trueChoice = choices.find((c: any) => c.id === 'choice_true');
        if (trueChoice && trueChoice.text === 'خطأ') {
          brokenCount++;
          continue;
        }

        if (correctAnswer === 'choice_true') trueCount++;
        else if (correctAnswer === 'choice_false') falseCount++;
        else brokenCount++;
      }

      return {
        total: questions.length,
        trueCount,
        falseCount,
        brokenCount,
      };
    },
  });

  // Cumulative stats from history
  const cumulativeStats = (() => {
    const entries = historyQuery.data || [];
    const liveEntries = entries.filter((e) => e.action === 'auto_fix');
    let totalCorrected = 0;
    let totalNormalized = 0;

    for (const entry of liveEntries) {
      const s = entry.payload_json?.summary;
      if (s) {
        totalCorrected += s.corrected || 0;
        totalNormalized += s.normalized || 0;
      }
    }

    return {
      totalCorrected,
      totalNormalized,
      totalOperations: liveEntries.length,
      lastOperation: liveEntries[0]?.created_at_utc || null,
    };
  })();

  return {
    history: historyQuery.data || [],
    stats: statsQuery.data || null,
    cumulativeStats,
    isLoading: historyQuery.isLoading || statsQuery.isLoading,
    refetch: () => {
      historyQuery.refetch();
      statsQuery.refetch();
    },
  };
}
