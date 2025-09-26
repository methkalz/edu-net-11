import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useTeacherContentAccess } from '@/hooks/useTeacherContentAccess';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface TeacherPermissionsDebugProps {
  classData?: any;
}

export const TeacherPermissionsDebug: React.FC<TeacherPermissionsDebugProps> = ({ classData }) => {
  const { userProfile } = useAuth();
  const { allowedGrades, loading, canAccessGrade } = useTeacherContentAccess();

  if (!userProfile || userProfile.role !== 'teacher') {
    return null; // Only show for teachers
  }

  // Get class grade if provided
  let classGrade = null;
  if (classData?.grade_level) {
    const classGradeLevel = classData.grade_level.label || classData.grade_level.code || '11';
    if (classGradeLevel.includes('عاشر') || classGradeLevel === '10') {
      classGrade = '10';
    } else if (classGradeLevel.includes('حادي عشر') || classGradeLevel === '11') {
      classGrade = '11';
    } else if (classGradeLevel.includes('ثاني عشر') || classGradeLevel === '12') {
      classGrade = '12';
    }
  }

  return (
    <Card className="mb-4 border-border/50">
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium">{userProfile.full_name}</span>
            <span className="text-muted-foreground">-</span>
            {loading ? (
              <Badge variant="secondary" className="text-xs">جارٍ التحميل...</Badge>
            ) : (
              <>
                {allowedGrades.length > 0 ? (
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground text-xs">الصفوف المُخولة:</span>
                    {allowedGrades.map(grade => (
                      <Badge key={grade} variant="secondary" className="text-xs">
                        {grade}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <Badge variant="destructive" className="text-xs">
                    لا توجد صفوف مُخولة
                  </Badge>
                )}
              </>
            )}
          </div>

          {classData && classGrade && (
            <div className="flex items-center gap-2">
              {canAccessGrade(classGrade) ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <Badge variant="default" className="text-xs">
                    مسموح
                  </Badge>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <Badge variant="destructive" className="text-xs">
                    غير مسموح
                  </Badge>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};