import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle } from 'lucide-react';

interface ExamNavigationGridProps {
  totalQuestions: number;
  answeredQuestions: Set<number>;
  currentQuestion: number;
  onQuestionSelect: (questionIndex: number) => void;
}

export const ExamNavigationGrid: React.FC<ExamNavigationGridProps> = ({
  totalQuestions,
  answeredQuestions,
  currentQuestion,
  onQuestionSelect
}) => {
  return (
    <div className="grid grid-cols-5 gap-2">
      {Array.from({ length: totalQuestions }, (_, i) => {
        const questionNumber = i + 1;
        const isAnswered = answeredQuestions.has(i);
        const isCurrent = currentQuestion === i;

        return (
          <Button
            key={i}
            variant={isCurrent ? 'default' : isAnswered ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => onQuestionSelect(i)}
            className="relative"
          >
            {isAnswered ? (
              <CheckCircle2 className="w-4 h-4 absolute top-1 right-1 text-green-600" />
            ) : (
              <Circle className="w-4 h-4 absolute top-1 right-1 text-muted-foreground" />
            )}
            <span className="text-sm font-semibold">{questionNumber}</span>
          </Button>
        );
      })}
    </div>
  );
};