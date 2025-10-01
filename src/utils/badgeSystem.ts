import { Badge } from '@/types/badge';
import newStudentBadge from '@/assets/badges/new-student-badge.png';
import activeStudentBadge from '@/assets/badges/active-student-badge.png';
import diligentStudentBadge from '@/assets/badges/diligent-student-badge.png';
import ambitiousStudentBadge from '@/assets/badges/ambitious-student-badge.png';
import knowledgeSeekerBadge from '@/assets/badges/knowledge-seeker-badge.png';
import thinkerStudentBadge from '@/assets/badges/thinker-student-badge.png';
import solidStudentBadge from '@/assets/badges/solid-student-badge.png';
import legendStudentBadge from '@/assets/badges/legend-student-badge.png';
import spaceStudentBadge from '@/assets/badges/space-student-badge.png';
import prideStudentBadge from '@/assets/badges/pride-student-badge.png';

// قائمة الأوسمة المتاحة مرتبة حسب النقاط
export const AVAILABLE_BADGES: Badge[] = [
  {
    id: 'new-student',
    name: 'طالب جديد',
    title: 'طالب جديد',
    image: newStudentBadge,
    minPoints: 100,
    maxPoints: 199,
    description: 'وسام الطالب الجديد'
  },
  {
    id: 'active-student',
    name: 'طالب نشيط',
    title: 'الطالب النشيط',
    image: activeStudentBadge,
    minPoints: 200,
    maxPoints: 299,
    description: 'وسام الطالب النشيط'
  },
  {
    id: 'diligent-student',
    name: 'طالب مجتهد',
    title: 'الطالب المجتهد',
    image: diligentStudentBadge,
    minPoints: 300,
    maxPoints: 399,
    description: 'وسام الطالب المجتهد'
  },
  {
    id: 'ambitious-student',
    name: 'طالب طموح',
    title: 'الطالب الطموح',
    image: ambitiousStudentBadge,
    minPoints: 400,
    maxPoints: 499,
    description: 'وسام الطالب الطموح'
  },
  {
    id: 'knowledge-seeker',
    name: 'طالب العلم',
    title: 'طالب العلم',
    image: knowledgeSeekerBadge,
    minPoints: 500,
    maxPoints: 599,
    description: 'وسام طالب العلم'
  },
  {
    id: 'thinker-student',
    name: 'طالب مُفكّر',
    title: 'الطالب المُفكّر',
    image: thinkerStudentBadge,
    minPoints: 600,
    maxPoints: 699,
    description: 'وسام الطالب المُفكّر'
  },
  {
    id: 'solid-student',
    name: 'طالب جامد',
    title: 'الطالب الجامد',
    image: solidStudentBadge,
    minPoints: 700,
    maxPoints: 799,
    description: 'وسام الطالب الجامد'
  },
  {
    id: 'legend-student',
    name: 'طالب اسطورة',
    title: 'الطالب الأسطورة',
    image: legendStudentBadge,
    minPoints: 800,
    maxPoints: 899,
    description: 'وسام الطالب الأسطورة'
  },
  {
    id: 'space-student',
    name: 'طالب الفضاء',
    title: 'طالب الفضاء',
    image: spaceStudentBadge,
    minPoints: 900,
    maxPoints: 999,
    description: 'وسام طالب الفضاء'
  },
  {
    id: 'pride-student',
    name: 'طالب الفخر',
    title: 'طالب الفخر',
    image: prideStudentBadge,
    minPoints: 1000,
    maxPoints: 1500,
    description: 'وسام طالب الفخر'
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
