import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, RotateCcw } from 'lucide-react';

interface ExamResultsFiltersProps {
  type: 'exam' | 'student' | 'comparison';
  selectedExam?: string;
  selectedStudent?: string;
  onExamChange?: (value: string) => void;
  onStudentChange?: (value: string) => void;
  onReset?: () => void;
  exams?: Array<{ id: string; title: string }>;
  students?: Array<{ id: string; name: string }>;
}

export const ExamResultsFilters: React.FC<ExamResultsFiltersProps> = ({
  type,
  selectedExam,
  selectedStudent,
  onExamChange,
  onStudentChange,
  onReset,
  exams = [],
  students = [],
}) => {
  return (
    <div className="flex flex-wrap gap-3 p-4 bg-accent/5 rounded-lg border border-border/50">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span className="font-medium">تصفية النتائج:</span>
      </div>
      
      {(type === 'exam' || type === 'comparison') && exams.length > 0 && (
        <Select value={selectedExam} onValueChange={onExamChange}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="اختر الامتحان..." />
          </SelectTrigger>
          <SelectContent>
            {exams.map((exam) => (
              <SelectItem key={exam.id} value={exam.id}>
                {exam.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      
      {(type === 'student' || type === 'comparison') && students.length > 0 && (
        <Select value={selectedStudent} onValueChange={onStudentChange}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="اختر الطالب..." />
          </SelectTrigger>
          <SelectContent>
            {students.map((student) => (
              <SelectItem key={student.id} value={student.id}>
                {student.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      
      <Button
        variant="outline"
        size="sm"
        onClick={onReset}
        className="gap-2"
      >
        <RotateCcw className="h-4 w-4" />
        إعادة تعيين
      </Button>
    </div>
  );
};
