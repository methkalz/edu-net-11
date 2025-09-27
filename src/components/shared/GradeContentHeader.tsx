import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Users, Folder, Target, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGradeStudentCount } from '@/hooks/useGradeStudentCount';

interface GradeContentHeaderProps {
  /** عنوان الصف */
  gradeTitle: string;
  /** وصف الصف */
  gradeDescription: string;
  /** رقم الصف (10, 11, 12) */
  gradeNumber: number;
  /** عدد الطلاب المسجلين */
  studentsCount?: number;
  /** عدد المحتويات المتاحة */
  contentCount?: number;
  /** نسبة الإكمال العامة */
  completionRate?: number;
  /** معرف المدرس */
  isTeacherView?: boolean;
  /** دالة العودة للوحة الرئيسية */
  onBackToDashboard?: () => void;
  /** دالة الإعدادات */
  onSettings?: () => void;
}

const GradeContentHeader: React.FC<GradeContentHeaderProps> = ({
  gradeTitle,
  gradeDescription,
  gradeNumber,
  studentsCount = 0,
  contentCount = 0,
  completionRate = 0,
  isTeacherView = false,
  onBackToDashboard,
  onSettings
}) => {
  // جلب العدد الحقيقي لطلاب الصف
  const { studentCount: realStudentCount, isLoading } = useGradeStudentCount(gradeNumber);
  // تحديد اللون الأساسي بناءً على رقم الصف
  const getGradeGradient = () => {
    switch (gradeNumber) {
      case 10:
        return 'from-primary/20 via-primary/10 to-background/50';
      case 11:
        return 'from-secondary/20 via-secondary/10 to-background/50';
      case 12:
        return 'from-purple-mystic/20 via-purple-mystic/10 to-background/50';
      default:
        return 'from-primary/20 via-primary/10 to-background/50';
    }
  };

  const getIconColor = () => {
    switch (gradeNumber) {
      case 10:
        return 'text-primary';
      case 11:
        return 'text-secondary';
      case 12:
        return 'text-purple-mystic';
      default:
        return 'text-primary';
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 creative-background opacity-40" />
      
      <Card className={cn(
        "relative border-0 shadow-lg backdrop-blur-md",
        "bg-gradient-to-br", getGradeGradient()
      )}>
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Content Section */}
            <div className="flex-1 space-y-4">
              {/* Breadcrumb - Removed as not needed in teacher dashboard */}

              {/* Grade Title */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-3 rounded-xl backdrop-blur-sm border border-white/20",
                    "bg-white/10"
                  )}>
                    <Folder className={cn("w-6 h-6", getIconColor())} />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground">
                      {gradeTitle}
                    </h1>
                    <p className="text-base text-muted-foreground">
                      {gradeDescription}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Actions Section - Removed teacher mode badge and settings */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GradeContentHeader;