/**
 * Global Badge Celebration Component
 * 
 * يعمل على مستوى التطبيق بالكامل لمراقبة حصول الطلاب على أوسمة جديدة
 * ويعرض شاشة احتفال بغض النظر عن الصفحة التي يتواجد فيها الطالب
 */

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStudentProgress } from '@/hooks/useStudentProgress';
import { usePlayerProfile } from '@/hooks/usePlayerProfile';
import { useStudentAssignedGrade } from '@/hooks/useStudentAssignedGrade';
import { useBadgeProgress } from '@/hooks/useBadgeProgress';
import { BadgeCelebration } from './BadgeCelebration';

export const GlobalBadgeCelebration = () => {
  const { user, userProfile } = useAuth();
  
  // للصف العاشر والثاني عشر - نستخدم useStudentProgress
  const { stats } = useStudentProgress();
  
  // للصف الحادي عشر - نستخدم usePlayerProfile
  const { playerStats } = usePlayerProfile();
  
  // الحصول على الصف الدراسي
  const { assignedGrade } = useStudentAssignedGrade();
  
  const isGrade11 = assignedGrade === '11';
  const isStudent = userProfile?.role === 'student';
  
  // اختيار مصدر النقاط المناسب
  const currentPoints = isStudent 
    ? (isGrade11 ? playerStats?.totalXP : stats?.total_points)
    : null;
  
  // مراقبة الأوسمة
  const { showCelebration, celebrationBadge, closeCelebration } = useBadgeProgress(currentPoints);
  
  // تسجيل المعلومات للتشخيص
  useEffect(() => {
    if (isStudent && user) {
      console.log('🌍 [GlobalBadgeCelebration] Monitoring badges for:', {
        userId: user.id,
        userName: userProfile?.full_name,
        grade: assignedGrade,
        pointSource: isGrade11 ? 'playerProfile (XP)' : 'studentProgress (points)',
        currentPoints,
        isGrade11
      });
    }
  }, [user, userProfile, assignedGrade, currentPoints, isGrade11, isStudent]);

  // عرض الاحتفال فقط للطلاب
  if (!isStudent || !user) {
    return null;
  }

  return (
    <>
      {showCelebration && celebrationBadge && (
        <BadgeCelebration
          badge={celebrationBadge}
          studentName={userProfile?.full_name}
          onClose={closeCelebration}
        />
      )}
    </>
  );
};
