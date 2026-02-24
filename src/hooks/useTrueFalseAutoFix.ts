import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FixResult {
  question_id: string;
  question_text: string;
  old_answer: string;
  new_answer: string;
  old_choices: any;
  status: 'confirmed' | 'corrected' | 'normalized' | 'skipped';
  explanation: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface FixSummary {
  total: number;
  confirmed: number;
  corrected: number;
  normalized: number;
  skipped: number;
  dryRun: boolean;
}

export interface FixResponse {
  summary: FixSummary;
  results: FixResult[];
}

type FixStatus = 'idle' | 'running' | 'done' | 'error';

export function useTrueFalseAutoFix() {
  const [status, setStatus] = useState<FixStatus>('idle');
  const [response, setResponse] = useState<FixResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const runFix = useCallback(async (dryRun: boolean = false) => {
    setStatus('running');
    setError(null);
    setResponse(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('fix-true-false-questions', {
        body: { dryRun },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      setResponse(data as FixResponse);
      setStatus('done');

      const summary = data.summary as FixSummary;
      toast({
        title: dryRun ? '✅ المعاينة اكتملت' : '✅ الإصلاح اكتمل',
        description: `تم معالجة ${summary.total} سؤال: ${summary.corrected} مُصحّح، ${summary.normalized} مُوحّد، ${summary.confirmed} مُؤكّد`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'خطأ غير معروف';
      setError(msg);
      setStatus('error');
      toast({
        title: '❌ خطأ',
        description: msg,
        variant: 'destructive',
      });
    }
  }, [toast]);

  const reset = useCallback(() => {
    setStatus('idle');
    setResponse(null);
    setError(null);
  }, []);

  return { status, response, error, runFix, reset };
}
