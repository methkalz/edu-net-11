import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import StudentBadge, { BadgeLevel } from '@/components/badges/StudentBadge';
import { useAuth } from '@/hooks/useAuth';
import { useUserTitle } from '@/hooks/useUserTitle';
import { Sparkles, Trophy, Medal, Award, Crown, Gem, Star, Shield, Hexagon, Zap, Circle, Heart } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface BadgeInfo {
  level: BadgeLevel;
  name: string;
  description: string;
  pointsRequired: number;
}

const BADGE_STYLES: Record<BadgeLevel, string> = {
  bronze: 'bg-gradient-to-br from-amber-400 to-orange-500',
  silver: 'bg-gradient-to-br from-gray-300 to-gray-500',
  gold: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
  platinum: 'bg-gradient-to-br from-purple-400 to-purple-600',
  diamond: 'bg-gradient-to-br from-cyan-400 to-blue-600'
};

const BADGE_ICONS: Record<BadgeLevel, typeof Medal> = {
  bronze: Medal,
  silver: Award,
  gold: Trophy,
  platinum: Crown,
  diamond: Gem
};

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

// Badge icon options
const ICON_OPTIONS = [
  { name: 'ميدالية', icon: Medal, category: 'classic' },
  { name: 'جائزة', icon: Award, category: 'classic' },
  { name: 'كأس', icon: Trophy, category: 'classic' },
  { name: 'تاج', icon: Crown, category: 'classic' },
  { name: 'ألماس', icon: Gem, category: 'classic' },
  { name: 'نجمة', icon: Star, category: 'shapes' },
  { name: 'درع', icon: Shield, category: 'shapes' },
  { name: 'سداسي', icon: Hexagon, category: 'shapes' },
  { name: 'صاعقة', icon: Zap, category: 'modern' },
  { name: 'دائرة', icon: Circle, category: 'modern' },
  { name: 'قلب', icon: Heart, category: 'modern' },
];

// Badge shape variants
const SHAPE_VARIANTS = [
  { name: 'دائري', class: 'rounded-full' },
  { name: 'سداسي', class: 'hexagon' },
  { name: 'درع', class: 'shield-shape' },
  { name: 'نجمة', class: 'star-shape' },
  { name: 'مربع مستدير', class: 'rounded-3xl' },
];

// Badge style variants
const STYLE_VARIANTS = [
  { name: 'تدرج لوني', gradient: 'bg-gradient-to-br from-amber-400 to-orange-500', effect: '' },
  { name: 'ثلاثي الأبعاد', gradient: 'bg-gradient-to-br from-amber-400 to-orange-500', effect: 'shadow-2xl shadow-amber-500/50' },
  { name: 'مسطح', gradient: 'bg-amber-500', effect: '' },
  { name: 'توهج', gradient: 'bg-gradient-to-br from-amber-400 to-orange-500', effect: 'shadow-[0_0_30px_rgba(251,191,36,0.6)] animate-pulse' },
  { name: 'زجاجي', gradient: 'bg-gradient-to-br from-amber-400/80 to-orange-500/80 backdrop-blur-sm', effect: 'border border-white/30' },
];

const BadgesGallery: React.FC = () => {
  const { userProfile } = useAuth();
  const userPoints = userProfile?.points || 0;
  const [selectedTab, setSelectedTab] = useState('preview');
  
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
          استكشف خيارات الأوسمة المتاحة واختر التصميم المفضل لديك
        </p>
      </div>

      {/* Tabs for different views */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto">
          <TabsTrigger value="preview">معاينة أوسمتك</TabsTrigger>
          <TabsTrigger value="icons">الأيقونات</TabsTrigger>
          <TabsTrigger value="shapes">الأشكال</TabsTrigger>
          <TabsTrigger value="styles">الأنماط</TabsTrigger>
        </TabsList>

        {/* Preview Tab - Current badges */}
        <TabsContent value="preview" className="mt-6">

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
        </TabsContent>

        {/* Icons Tab */}
        <TabsContent value="icons" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>خيارات الأيقونات</CardTitle>
              <CardDescription>اختر الأيقونة المفضلة لديك لكل مستوى وسام</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {['classic', 'shapes', 'modern'].map((category) => (
                  <div key={category}>
                    <h3 className="text-lg font-semibold mb-4">
                      {category === 'classic' && '✨ كلاسيكي'}
                      {category === 'shapes' && '🔷 أشكال'}
                      {category === 'modern' && '⚡ عصري'}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {ICON_OPTIONS.filter(opt => opt.category === category).map((iconOpt) => {
                        const IconComponent = iconOpt.icon;
                        return (
                          <Card key={iconOpt.name} className="hover:shadow-lg transition-all hover:scale-105">
                            <CardContent className="p-6 flex flex-col items-center gap-3">
                              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                                <IconComponent className="w-10 h-10 text-white" />
                              </div>
                              <p className="font-medium text-center">{iconOpt.name}</p>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shapes Tab */}
        <TabsContent value="shapes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>خيارات الأشكال</CardTitle>
              <CardDescription>جرب أشكالاً مختلفة للأوسمة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {SHAPE_VARIANTS.map((shape) => (
                  <Card key={shape.name} className="hover:shadow-xl transition-all">
                    <CardContent className="p-6 flex flex-col items-center gap-4">
                      <h3 className="font-semibold text-lg">{shape.name}</h3>
                      <div className="flex gap-3 flex-wrap justify-center">
                        {BADGES_INFO.slice(0, 3).map((badge) => {
                          const BadgeIcon = BADGE_ICONS[badge.level];
                          const badgeStyle = BADGE_STYLES[badge.level];
                          return (
                            <div
                              key={badge.level}
                              className={`
                                ${badgeStyle} 
                                ${shape.class}
                                w-16 h-16
                                flex items-center justify-center 
                                shadow-lg 
                                border-2 border-white
                                transition-transform hover:scale-110
                              `}
                            >
                              <BadgeIcon className="w-8 h-8 text-white" />
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Styles Tab */}
        <TabsContent value="styles" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>خيارات الأنماط</CardTitle>
              <CardDescription>اختر النمط البصري للأوسمة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {STYLE_VARIANTS.map((style) => (
                  <Card key={style.name} className="hover:shadow-xl transition-all">
                    <CardContent className="p-6 flex flex-col items-center gap-4">
                      <h3 className="font-semibold text-lg">{style.name}</h3>
                      <div className="flex gap-4 flex-wrap justify-center">
                        {['bronze', 'silver', 'gold'].map((level) => {
                          const BadgeIcon = BADGE_ICONS[level as BadgeLevel];
                          return (
                            <div
                              key={level}
                              className={`
                                ${BADGE_STYLES[level as BadgeLevel]}
                                ${style.effect}
                                w-20 h-20
                                rounded-full
                                flex items-center justify-center 
                                border-4 border-white
                                transition-transform hover:scale-110
                              `}
                            >
                              <BadgeIcon className="w-10 h-10 text-white" />
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tips Section */}
      {selectedTab === 'preview' && (
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
      )}
    </div>
  );
};

export default BadgesGallery;
