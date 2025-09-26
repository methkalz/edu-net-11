import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useTeacherContentAccess } from '@/hooks/useTeacherContentAccess';
import { AlertCircle, CheckCircle, User, Users } from 'lucide-react';

interface TeacherPermissionsDebugProps {
  classData?: any;
}

export const TeacherPermissionsDebug: React.FC<TeacherPermissionsDebugProps> = ({ classData }) => {
  const { userProfile } = useAuth();
  const { allowedGrades, contentSettings, packageGrades, loading, canAccessGrade } = useTeacherContentAccess();

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
    <Card className="mb-4 border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          تشخيص صلاحيات المعلم
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">المعلم:</span> {userProfile.full_name}
          </div>
          <div>
            <span className="font-medium">الدور:</span> {userProfile.role}
          </div>
          <div>
            <span className="font-medium">ID:</span> {userProfile.user_id}
          </div>
          <div>
            <span className="font-medium">المدرسة:</span> {userProfile.school_id}
          </div>
        </div>

        <div className="border-t pt-3">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4" />
            <span className="font-medium">الصفوف المُخولة:</span>
            {loading && <Badge variant="secondary">جارٍ التحميل...</Badge>}
          </div>
          
          {!loading && (
            <div className="flex flex-wrap gap-1">
              {allowedGrades.length > 0 ? (
                allowedGrades.map(grade => (
                  <Badge key={grade} variant="default" className="text-xs">
                    الصف {grade}
                  </Badge>
                ))
              ) : (
                <Badge variant="destructive" className="text-xs">
                  لا توجد صفوف مُخولة
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="border-t pt-3">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4" />
            <span className="font-medium">صفوف الباقة:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {packageGrades.length > 0 ? (
              packageGrades.map(grade => (
                <Badge key={grade} variant="outline" className="text-xs">
                  الصف {grade}
                </Badge>
              ))
            ) : (
              <Badge variant="secondary" className="text-xs">
                لا توجد باقة نشطة
              </Badge>
            )}
          </div>
        </div>

        {classData && classGrade && (
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 mb-2">
              {canAccessGrade(classGrade) ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="font-medium">
                الوصول للصف الحالي ({classData.grade_level.label}):
              </span>
              <Badge 
                variant={canAccessGrade(classGrade) ? "default" : "destructive"}
                className="text-xs"
              >
                {canAccessGrade(classGrade) ? "مسموح" : "غير مسموح"}
              </Badge>
            </div>
          </div>
        )}

        <div className="border-t pt-3 text-xs text-muted-foreground">
          <div><strong>الإعدادات:</strong></div>
          <div>• تقييد للصفوف المُخولة: {contentSettings.restrict_to_assigned_grades ? 'نعم' : 'لا'}</div>
          <div>• السماح بالوصول المتقاطع: {contentSettings.allow_cross_grade_access ? 'نعم' : 'لا'}</div>
          <div>• عرض كل محتوى الباقة: {contentSettings.show_all_package_content ? 'نعم' : 'لا'}</div>
        </div>
      </CardContent>
    </Card>
  );
};