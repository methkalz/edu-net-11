import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStudentProgress } from '@/hooks/useStudentProgress';
import { useBadgeProgress } from '@/hooks/useBadgeProgress';
import { BadgeCelebration } from './BadgeCelebration';

/**
 * Global Badge Celebration Component
 * 
 * This component monitors student progress globally and displays badge celebrations
 * whenever a student achieves a new badge, regardless of which page they're on.
 * 
 * It's meant to be placed at the App.tsx level to ensure celebrations work everywhere.
 */
export const GlobalBadgeCelebration: React.FC = () => {
  const { userProfile } = useAuth();
  
  // Only render for students
  if (userProfile?.role !== 'student') {
    return null;
  }

  return <GlobalBadgeCelebrationInner />;
};

const GlobalBadgeCelebrationInner: React.FC = () => {
  const { userProfile } = useAuth();
  const { stats } = useStudentProgress();
  
  const { 
    showCelebration, 
    celebrationBadge, 
    closeCelebration 
  } = useBadgeProgress(stats.total_points);

  useEffect(() => {
    if (showCelebration && celebrationBadge) {
      console.log('[GlobalBadgeCelebration] 🎉 Showing celebration for badge:', celebrationBadge.name);
      console.log('[GlobalBadgeCelebration] Student points:', stats.total_points);
    }
  }, [showCelebration, celebrationBadge, stats.total_points]);

  // Only render if we're showing a celebration
  if (!showCelebration || !celebrationBadge) {
    return null;
  }

  return (
    <BadgeCelebration
      badge={celebrationBadge}
      studentName={userProfile?.full_name}
      onClose={closeCelebration}
    />
  );
};
