import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Video, Trophy } from 'lucide-react';

interface TeacherGradeSelectorProps {
  allowedGrades: string[];
  activeGrade: string;
  onGradeChange: (grade: string) => void;
}

const gradeInfo = {
  '10': { 
    label: 'الصف العاشر',
    icon: Video,
    color: 'bg-blue-100 text-blue-700'
  },
  '11': { 
    label: 'الصف الحادي عشر',
    icon: BookOpen,
    color: 'bg-green-100 text-green-700'
  },
  '12': { 
    label: 'الصف الثاني عشر',
    icon: Trophy,
    color: 'bg-purple-100 text-purple-700'
  }
};

export const TeacherGradeSelector: React.FC<TeacherGradeSelectorProps> = ({
  allowedGrades,
  activeGrade,
  onGradeChange
}) => {
  if (allowedGrades.length <= 1) {
    // إذا كان المعلم مسؤول عن صف واحد فقط، عرض badge بسيط
    const grade = allowedGrades[0] || activeGrade;
    const info = gradeInfo[grade as keyof typeof gradeInfo];
    const IconComponent = info?.icon || BookOpen;
    
    return (
      <div className="flex justify-center mb-6">
        <Badge 
          variant="secondary" 
          className={`flex items-center gap-2 px-4 py-2 text-base ${info?.color || 'bg-gray-100 text-gray-700'}`}
        >
          <IconComponent className="h-5 w-5" />
          {info?.label || `الصف ${grade}`}
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex justify-center mb-6">
      <Tabs value={activeGrade} onValueChange={onGradeChange}>
        <TabsList className="grid w-full grid-cols-auto gap-2">
          {allowedGrades.map(grade => {
            const info = gradeInfo[grade as keyof typeof gradeInfo];
            const IconComponent = info?.icon || BookOpen;
            
            return (
              <TabsTrigger
                key={grade}
                value={grade}
                className="flex items-center gap-2 px-4 py-2"
              >
                <IconComponent className="h-4 w-4" />
                {info?.label || `الصف ${grade}`}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
};