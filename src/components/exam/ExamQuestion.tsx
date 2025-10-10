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
          <div className="flex items-center space-x-2 space-x-reverse p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="true" id="true" disabled={showCorrectAnswer} />
            <Label htmlFor="true" className="flex-1 cursor-pointer">صح</Label>
            {showCorrectAnswer && correctAnswer === 'true' && (
              <Badge className="bg-green-500">الإجابة الصحيحة</Badge>
            )}
          </div>
          <div className="flex items-center space-x-2 space-x-reverse p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="false" id="false" disabled={showCorrectAnswer} />
            <Label htmlFor="false" className="flex-1 cursor-pointer">خطأ</Label>
            {showCorrectAnswer && correctAnswer === 'false' && (
              <Badge className="bg-green-500">الإجابة الصحيحة</Badge>
            )}
          </div>
        </RadioGroup>
      );
    }

    if (question.question_type === 'multiple_choice' && question.choices) {
      return (
        <RadioGroup value={currentAnswer || ''} onValueChange={onAnswerChange}>
          {question.choices.map((choice, index) => (
            <div 
              key={choice.value} 
              className="flex items-center space-x-2 space-x-reverse p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <RadioGroupItem 
                value={choice.value} 
                id={`choice-${index}`} 
                disabled={showCorrectAnswer}
              />
              <Label htmlFor={`choice-${index}`} className="flex-1 cursor-pointer">
                {choice.text}
              </Label>
              {showCorrectAnswer && correctAnswer === choice.value && (
                <Badge className="bg-green-500">الإجابة الصحيحة</Badge>
              )}
              {showCorrectAnswer && currentAnswer === choice.value && correctAnswer !== choice.value && (
                <Badge variant="destructive">إجابتك</Badge>
              )}
            </div>
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
          className="min-h-[150px] resize-none"
          disabled={showCorrectAnswer}
        />
      );
    }

    return null;
  };

  return (
    <Card className="border-2">
      <CardHeader className="bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            السؤال {questionNumber} من {totalQuestions}
          </CardTitle>
          <Badge variant="outline" className="text-sm">
            {question.points} نقطة
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="text-lg font-medium leading-relaxed">
          {question.question_text}
        </div>
        
        <div className="space-y-3">
          {renderChoices()}
        </div>
      </CardContent>
    </Card>
  );
};