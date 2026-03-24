import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { buildBagrutPreviewFromDb, type ParsedExam } from '@/lib/bagrut/buildBagrutPreview';
import BagrutQuestionRenderer from '@/components/bagrut/BagrutQuestionRenderer';

interface Props {
  examId: string;
  examTitle: string;
}

export default function TeacherExamPreviewDialog({ examId, examTitle }: Props) {
  const [open, setOpen] = useState(false);

  const { data: preview, isLoading } = useQuery<ParsedExam | null>({
    queryKey: ['bagrut-teacher-preview', examId],
    queryFn: () => buildBagrutPreviewFromDb(examId),
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
            <DialogTitle>معاينة: {examTitle}</DialogTitle>
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
                        showAnswer={true}
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
