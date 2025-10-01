import { Badge } from '@/types/badge';
import newStudentBadge from '@/assets/badges/new-student-badge.png';

// قائمة الأوسمة المتاحة مرتبة حسب النقاط
export const AVAILABLE_BADGES: Badge[] = [
  {
    id: 'new-student',
    name: 'طالب جديد',
    image: newStudentBadge,
    minPoints: 100,
    maxPoints: 199,
    description: 'وسام الطالب الجديد'
  }
  // يمكن إضافة المزيد من الأوسمة هنا
];

// دالة لتحديد الوسام المناسب بناءً على النقاط
export const getBadgeByPoints = (points: number | null | undefined): Badge | null => {
  if (!points || points < 100) return null;
  
  // البحث عن الوسام المناسب
  const badge = AVAILABLE_BADGES.find(
    badge => points >= badge.minPoints && points <= badge.maxPoints
  );
  
  return badge || null;
};
