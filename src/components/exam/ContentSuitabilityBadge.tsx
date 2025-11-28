import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { evaluateLessonContent, getSuitabilityColor, getSuitabilityIcon } from '@/utils/contentEvaluator';

interface Props {
  content: string;
}

export function ContentSuitabilityBadge({ content }: Props) {
  const evaluation = evaluateLessonContent(content);
  
  const badge = (
    <Badge 
      variant="outline" 
      className={`${getSuitabilityColor(evaluation.suitabilityLevel)} border text-xs`}
    >
      {getSuitabilityIcon(evaluation.suitabilityLevel)}
      {' '}
      {evaluation.maxRecommendedQuestions > 0 
        ? `حتى ${evaluation.maxRecommendedQuestions} أسئلة`
        : 'غير كافٍ'
      }
    </Badge>
  );
  
  if (evaluation.warnings.length === 0) {
    return badge;
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold text-sm">تنبيهات:</p>
            {evaluation.warnings.map((warning, idx) => (
              <p key={idx} className="text-xs">• {warning}</p>
            ))}
            <p className="text-xs text-muted-foreground mt-2">
              طول النص: {evaluation.textLength} حرف
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
