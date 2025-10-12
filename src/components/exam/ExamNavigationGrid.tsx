import React from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

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
          <button
            key={i}
            onClick={() => onQuestionSelect(i)}
            className={`
              relative h-12 w-full rounded-lg font-semibold text-sm
              transition-all duration-200 transform hover:scale-105
              ${isCurrent 
                ? 'bg-primary text-primary-foreground shadow-lg scale-105' 
                : isAnswered 
                  ? 'bg-primary/10 text-primary border-2 border-primary/20' 
                  : 'bg-background text-muted-foreground border-2 border-border hover:border-primary/40'
              }
            `}
          >
            {isAnswered && !isCurrent && (
              <Check className="w-3 h-3 absolute top-1 left-1 text-primary" />
            )}
            <span>{questionNumber}</span>
          </button>
        );
      })}
    </div>
  );
};