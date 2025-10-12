import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface ExamQuestionProps {
  question: {
    id: string;
    question_text: string;
    question_type: 'multiple_choice' | 'true_false' | 'essay';
    choices?: Array<{ text: string; value: string }>;
    points: number;
  };
  questionNumber: number;
  totalQuestions: number;
  currentAnswer?: string;
  onAnswerChange: (answer: string) => void;
  showCorrectAnswer?: boolean;
  correctAnswer?: string;
}

export const ExamQuestion: React.FC<ExamQuestionProps> = ({
  question,
  questionNumber,
  totalQuestions,
  currentAnswer,
  onAnswerChange,
  showCorrectAnswer = false,
  correctAnswer
}) => {
  const renderChoices = () => {
    if (question.question_type === 'true_false') {
      return (
        <RadioGroup value={currentAnswer || ''} onValueChange={onAnswerChange}>
          <label 
            htmlFor="true"
            className={`
              flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer
              transition-all duration-200 hover:shadow-md
              ${currentAnswer === 'true' 
                ? 'border-primary bg-primary/5 shadow-sm' 
                : 'border-border hover:border-primary/40'
              }
            `}
          >
            <RadioGroupItem value="true" id="true" disabled={showCorrectAnswer} className="shrink-0" />
            <span className="flex-1 font-medium">صح</span>
            {showCorrectAnswer && correctAnswer === 'true' && (
              <Badge className="bg-green-500">الإجابة الصحيحة</Badge>
            )}
          </label>
          <label 
            htmlFor="false"
            className={`
              flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer
              transition-all duration-200 hover:shadow-md
              ${currentAnswer === 'false' 
                ? 'border-primary bg-primary/5 shadow-sm' 
                : 'border-border hover:border-primary/40'
              }
            `}
          >
            <RadioGroupItem value="false" id="false" disabled={showCorrectAnswer} className="shrink-0" />
            <span className="flex-1 font-medium">خطأ</span>
            {showCorrectAnswer && correctAnswer === 'false' && (
              <Badge className="bg-green-500">الإجابة الصحيحة</Badge>
            )}
          </label>
        </RadioGroup>
      );
    }

    if (question.question_type === 'multiple_choice' && question.choices) {
      return (
        <RadioGroup value={currentAnswer || ''} onValueChange={onAnswerChange}>
          {question.choices.map((choice, index) => (
            <label 
              key={choice.value}
              htmlFor={`choice-${index}`}
              className={`
                flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer
                transition-all duration-200 hover:shadow-md
                ${currentAnswer === choice.value 
                  ? 'border-primary bg-primary/5 shadow-sm' 
                  : 'border-border hover:border-primary/40'
                }
              `}
            >
              <RadioGroupItem 
                value={choice.value} 
                id={`choice-${index}`} 
                disabled={showCorrectAnswer}
                className="shrink-0"
              />
              <span className="flex-1 font-medium">
                {choice.text}
              </span>
              {showCorrectAnswer && correctAnswer === choice.value && (
                <Badge className="bg-green-500">الإجابة الصحيحة</Badge>
              )}
              {showCorrectAnswer && currentAnswer === choice.value && correctAnswer !== choice.value && (
                <Badge variant="destructive">إجابتك</Badge>
              )}
            </label>
          ))}
        </RadioGroup>
      );
    }

    if (question.question_type === 'essay') {
      return (
        <Textarea
          value={currentAnswer || ''}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="اكتب إجابتك هنا..."
          className="min-h-[150px] resize-none border-2 focus:border-primary rounded-xl"
          disabled={showCorrectAnswer}
        />
      );
    }

    return null;
  };

  return (
    <Card className="border-2 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent p-6 border-b">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg font-bold">
            السؤال {questionNumber} من {totalQuestions}
          </CardTitle>
          <Badge variant="secondary" className="text-sm font-semibold px-3 py-1">
            {question.points} نقطة
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="text-lg font-medium leading-relaxed text-foreground">
          {question.question_text}
        </div>
        
        <div className="space-y-3">
          {renderChoices()}
        </div>
      </CardContent>
    </Card>
  );
};