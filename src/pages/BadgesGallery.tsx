import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import StudentBadge, { BadgeLevel } from '@/components/badges/StudentBadge';
import { useAuth } from '@/hooks/useAuth';
import { useUserTitle } from '@/hooks/useUserTitle';
import { Sparkles, Trophy } from 'lucide-react';

interface BadgeInfo {
  level: BadgeLevel;
  name: string;
  description: string;
  pointsRequired: number;
}

const BADGES_INFO: BadgeInfo[] = [
  {
    level: 'bronze',
    name: 'وسام البرونز',
    description: 'بداية رائعة! استمر في التعلم والمشاركة',
    pointsRequired: 100
  },
  {
    level: 'silver',
    name: 'وسام الفضة',
    description: 'أداء ممتاز! أنت في الطريق الصحيح',
    pointsRequired: 300
  },
  {
    level: 'gold',
    name: 'وسام الذهب',
    description: 'متميز! مهاراتك تتطور بشكل رائع',
    pointsRequired: 500
  },
  {
    level: 'platinum',
    name: 'وسام البلاتين',
    description: 'محترف! معرفتك عميقة ومتقدمة',
    pointsRequired: 700
  },
  {
    level: 'diamond',
    name: 'وسام الألماس',
    description: 'أسطورة! لقد وصلت إلى أعلى مستوى',
    pointsRequired: 900
  }
];

const BadgesGallery: React.FC = () => {
  const { userProfile } = useAuth();
  const userPoints = userProfile?.points || 0;
  
  const { level: userLevel } = useUserTitle({
    role: userProfile?.role || 'student',
    displayTitle: userProfile?.display_title,
    points: userPoints,
    level: userProfile?.level
  });

  const getCurrentBadgeLevel = (points: number): BadgeLevel => {
    if (points >= 900) return 'diamond';
    if (points >= 700) return 'platinum';
    if (points >= 500) return 'gold';
    if (points >= 300) return 'silver';
    return 'bronze';
  };

  const currentBadge = getCurrentBadgeLevel(userPoints);

  return (
    <div className="container mx-auto p-6 max-w-7xl" dir="rtl">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Trophy className="w-10 h-10 text-primary" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            معرض الأوسمة
          </h1>
          <Sparkles className="w-10 h-10 text-primary" />
        </div>
        <p className="text-lg text-muted-foreground">
          اجمع النقاط واحصل على أوسمة رائعة تعكس تقدمك ومهاراتك
        </p>
      </div>

      {/* Current Badge Card */}
      {userProfile?.role === 'student' && (
        <Card className="mb-8 bg-gradient-to-br from-primary/5 to-purple-50 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-center justify-center">
              <Trophy className="w-6 h-6" />
              وسامك الحالي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <StudentBadge 
                level={currentBadge}
                size="xl"
                showLabel={true}
                currentPoints={userPoints}
                requiredPoints={
                  BADGES_INFO.find(b => b.level === currentBadge)?.pointsRequired || 0
                }
              />
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{userPoints} نقطة</p>
                <p className="text-sm text-muted-foreground">مجموع نقاطك</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {BADGES_INFO.map((badge, index) => {
          const isUnlocked = userPoints >= badge.pointsRequired;
          const isCurrentBadge = currentBadge === badge.level;
          const nextBadge = BADGES_INFO[index + 1];
          
          return (
            <Card 
              key={badge.level}
              className={`
                transition-all duration-300 hover:shadow-xl
                ${isCurrentBadge ? 'ring-2 ring-primary shadow-lg' : ''}
                ${isUnlocked ? 'bg-gradient-to-br from-white to-primary/5' : 'bg-muted/30'}
              `}
            >
              <CardHeader>
                <CardTitle className="text-center text-xl">
                  {badge.name}
                  {isCurrentBadge && (
                    <span className="ml-2 text-sm bg-primary text-primary-foreground px-2 py-1 rounded-full">
                      الحالي
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="text-center">
                  {badge.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4">
                  <StudentBadge 
                    level={badge.level}
                    size="lg"
                    isLocked={!isUnlocked}
                  />
                  
                  <div className="w-full space-y-2">
                    <div className="text-center">
                      <p className="text-sm font-semibold">
                        {isUnlocked ? '✅ تم الحصول عليه!' : '🔒 مغلق'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        يتطلب {badge.pointsRequired} نقطة
                      </p>
                    </div>
                    
                    {!isUnlocked && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>التقدم</span>
                          <span>{Math.round((userPoints / badge.pointsRequired) * 100)}%</span>
                        </div>
                        <StudentBadge 
                          level={badge.level}
                          size="xs"
                          showProgress={true}
                          currentPoints={userPoints}
                          requiredPoints={badge.pointsRequired}
                        />
                      </div>
                    )}
                    
                    {isCurrentBadge && nextBadge && (
                      <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                        <p className="text-xs font-semibold text-center mb-2">
                          الوسام التالي: {nextBadge.name}
                        </p>
                        <p className="text-xs text-center text-muted-foreground">
                          تحتاج {nextBadge.pointsRequired - userPoints} نقطة إضافية
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tips Section */}
      <Card className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Sparkles className="w-5 h-5" />
            كيف تحصل على المزيد من النقاط؟
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>أكمل الدروس والتمارين بنجاح</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>شارك في الأنشطة والمشاريع المدرسية</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>احصل على درجات عالية في الاختبارات</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>حافظ على سلسلة نشاطك اليومي</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default BadgesGallery;
