import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { buildBagrutPreviewFromDb } from '@/lib/bagrut/buildBagrutPreview';
import BagrutQuestionRenderer from '@/components/bagrut/BagrutQuestionRenderer';

interface Props {
  examId: string;
  examTitle: string;
}

export default function TeacherExamPreviewDialog({ examId, examTitle }: Props) {
  const [open, setOpen] = useState(false);
  const [showAnswers, setShowAnswers] = useState(true);

  const { data: preview, isLoading } = useQuery({
    queryKey: ['bagrut-teacher-preview', examId],
    queryFn: async () => {
      const [examRes, sectionsRes, questionsRes] = await Promise.all([
        supabase.from('bagrut_exams').select('*').eq('id', examId).single(),
        supabase.from('bagrut_exam_sections').select('*').eq('exam_id', examId).order('order_index'),
        supabase.from('bagrut_questions').select('*').eq('exam_id', examId).order('order_index'),
      ]);
      if (!examRes.data) return null;
      const result = buildBagrutPreviewFromDb({
        exam: examRes.data as any,
        sections: (sectionsRes.data || []) as any[],
        questions: (questionsRes.data || []) as any[],
      });
      return result.exam;
    },
    enabled: open,
  });

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        title="معاينة الامتحان"
      >
        <Eye className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col gap-0 p-0">
          <DialogHeader className="p-6 pb-4 border-b shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle>معاينة: {examTitle}</DialogTitle>
              <div className="flex items-center gap-2">
                {showAnswers ? <Eye className="h-4 w-4 text-muted-foreground" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                <Label htmlFor="show-answers-toggle" className="text-sm text-muted-foreground cursor-pointer">
                  {showAnswers ? 'إخفاء الإجابات' : 'إظهار الإجابات'}
                </Label>
                <Switch
                  id="show-answers-toggle"
                  checked={showAnswers}
                  onCheckedChange={setShowAnswers}
                />
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 min-h-0">
            <div className="p-6 space-y-6">
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : !preview ? (
                <p className="text-center text-muted-foreground py-12">لم يتم العثور على بيانات الامتحان</p>
              ) : (
                preview.sections.map((section, si) => (
                  <div key={si} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-sm">
                        {section.section_title}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        ({section.total_points} علامة)
                      </span>
                    </div>
                    {section.instructions && (
                      <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                        {section.instructions}
                      </p>
                    )}
                    {section.questions.map((q, qi) => (
                      <BagrutQuestionRenderer
                        key={q.question_db_id || qi}
                        question={q}
                        answers={{}}
                        onAnswerChange={() => {}}
                        showAnswer={showAnswers}
                        disabled={true}
                      />
                    ))}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
