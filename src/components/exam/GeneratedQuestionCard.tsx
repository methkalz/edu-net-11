import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, Save, X, CheckCircle2 } from 'lucide-react';

export interface GeneratedQuestion {
  id?: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false';
  difficulty_level: 'easy' | 'medium' | 'hard';
  choices: Array<{ id: string; text: string }>;
  correct_answer: string;
  explanation: string;
  section_name: string;
  topic_name: string;
  grade_level: string;
  points: number;
}

interface Props {
  question: GeneratedQuestion;
  index: number;
  onEdit: (question: GeneratedQuestion) => void;
  onDelete: () => void;
  onApprove?: () => void;
  isApproved?: boolean;
}

const DIFFICULTY_LABELS = {
  easy: { label: 'سهل', color: 'bg-green-100 text-green-800' },
  medium: { label: 'متوسط', color: 'bg-yellow-100 text-yellow-800' },
  hard: { label: 'صعب', color: 'bg-red-100 text-red-800' }
};

const TYPE_LABELS = {
  multiple_choice: 'اختيار متعدد',
  true_false: 'صح/خطأ'
};

export function GeneratedQuestionCard({ 
  question, 
  index, 
  onEdit, 
  onDelete,
  onApprove,
  isApproved = false
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState(question);
  
  const handleSave = () => {
    onEdit(editedQuestion);
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setEditedQuestion(question);
    setIsEditing(false);
  };
  
  const handleChoiceChange = (choiceId: string, newText: string) => {
    setEditedQuestion({
      ...editedQuestion,
      choices: editedQuestion.choices.map(c => 
        c.id === choiceId ? { ...c, text: newText } : c
      )
    });
  };
  
  const correctChoice = question.choices.find(c => c.id === question.correct_answer);
  
  return (
    <Card className={`p-4 ${isApproved ? 'border-green-500 bg-green-50/30' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-muted-foreground">#{index + 1}</span>
          <Badge className={DIFFICULTY_LABELS[question.difficulty_level].color}>
            {DIFFICULTY_LABELS[question.difficulty_level].label}
          </Badge>
          <Badge variant="outline">{TYPE_LABELS[question.question_type]}</Badge>
          {isApproved && (
            <Badge className="bg-green-600 text-white">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              موافق عليه
            </Badge>
          )}
        </div>
        
        <div className="flex gap-1">
          {!isApproved && (
            <>
              {!isEditing ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={onDelete}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                  {onApprove && (
                    <Button
                      type="button"
                      size="sm"
                      variant="default"
                      onClick={onApprove}
                    >
                      <CheckCircle2 className="w-4 h-4 ml-1" />
                      موافقة
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    onClick={handleSave}
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleCancel}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>
      
      {!isEditing ? (
        <div className="space-y-3">
          <div>
            <Label className="text-sm text-muted-foreground">السؤال:</Label>
            <p className="text-base font-medium mt-1">{question.question_text}</p>
          </div>
          
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">الخيارات:</Label>
            <div className="space-y-2">
              {question.choices.map((choice) => (
                <div
                  key={choice.id}
                  className={`p-2 rounded border ${
                    choice.id === question.correct_answer
                      ? 'border-green-500 bg-green-50'
                      : 'border-border bg-background'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {choice.id === question.correct_answer && (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    )}
                    <span>{choice.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <Label className="text-sm text-muted-foreground">التفسير:</Label>
            <p className="text-sm mt-1 text-muted-foreground">{question.explanation}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <Label>السؤال</Label>
            <Textarea
              value={editedQuestion.question_text}
              onChange={(e) => setEditedQuestion({ ...editedQuestion, question_text: e.target.value })}
              rows={2}
            />
          </div>
          
          <div>
            <Label className="mb-2 block">الخيارات</Label>
            <div className="space-y-2">
              {editedQuestion.choices.map((choice, idx) => (
                <div key={choice.id} className="flex items-center gap-2">
                  <Input
                    value={choice.text}
                    onChange={(e) => handleChoiceChange(choice.id, e.target.value)}
                    placeholder={`الخيار ${idx + 1}`}
                  />
                  {choice.id === editedQuestion.correct_answer && (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <Label>التفسير</Label>
            <Textarea
              value={editedQuestion.explanation}
              onChange={(e) => setEditedQuestion({ ...editedQuestion, explanation: e.target.value })}
              rows={2}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
