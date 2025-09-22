import React from 'react';
import { Trophy, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useAchievements } from '@/hooks/useAchievements';

interface AchievementsProps {
  player?: any;
  onUnlockAchievement?: (achievementId: string) => void;
}

const RARITY_STYLES = {
  common: {
    bg: 'bg-muted/30 border-muted',
    text: 'text-foreground',
    badge: 'bg-muted'
  },
  uncommon: {
    bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-400',
    badge: 'bg-emerald-500'
  },
  rare: {
    bg: 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-400',
    badge: 'bg-blue-500'
  },
  epic: {
    bg: 'bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800',
    text: 'text-purple-700 dark:text-purple-400',
    badge: 'bg-purple-500'
  },
  legendary: {
    bg: 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 dark:from-yellow-950/20 dark:to-orange-950/20 dark:border-yellow-700',
    text: 'text-yellow-700 dark:text-yellow-400',
    badge: 'bg-gradient-to-r from-yellow-500 to-orange-500'
  }
};

const RARITY_NAMES = {
  common: 'عادي',
  uncommon: 'غير عادي',
  rare: 'نادر',
  epic: 'ملحمي',
  legendary: 'أسطوري'
};

const Achievements: React.FC<AchievementsProps> = ({ player, onUnlockAchievement }) => {
  const { achievements, loading, error, achievementStats } = useAchievements();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Skeleton className="h-8 w-32 mx-auto mb-2" />
          <Skeleton className="h-4 w-48 mx-auto mb-4" />
          <Skeleton className="h-3 w-64 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <Trophy className="h-20 w-20 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="text-2xl font-bold mb-2">خطأ في تحميل الإنجازات</h3>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  const unlockedAchievements = achievements.filter(achievement => achievement.unlocked);
  const lockedAchievements = achievements.filter(achievement => !achievement.unlocked);
  const totalProgress = achievements.length > 0 ? (unlockedAchievements.length / achievements.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">الإنجازات</h2>
        <p className="text-muted-foreground mb-4">
          تقدمك في رحلة تعلم الشبكات
        </p>
        
        {achievementStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{achievementStats.completedLessons}</div>
              <div className="text-sm text-muted-foreground">دروس مكتملة</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{achievementStats.perfectScores}</div>
              <div className="text-sm text-muted-foreground">نتائج مثالية</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{achievementStats.streakDays}</div>
              <div className="text-sm text-muted-foreground">أيام متتالية</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{achievementStats.level}</div>
              <div className="text-sm text-muted-foreground">المستوى</div>
            </div>
          </div>
        )}
        
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">التقدم الإجمالي</span>
            <span className="text-sm text-muted-foreground">
              {unlockedAchievements.length}/{achievements.length}
            </span>
          </div>
          <Progress value={totalProgress} className="h-3" />
        </div>
      </div>

      {/* Unlocked Achievements */}
      {unlockedAchievements.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            الإنجازات المحققة ({unlockedAchievements.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlockedAchievements.map((achievement) => {
              const AchievementIcon = achievement.icon;
              const style = RARITY_STYLES[achievement.rarity as keyof typeof RARITY_STYLES];
              
              return (
                <Card 
                  key={achievement.id}
                  className={`${style.bg} border-2 ${style.text} animate-fade-in`}
                >
                  <CardContent className="p-6 text-center">
                    <div className="mb-4">
                      <div className="w-16 h-16 mx-auto bg-background border-2 border-yellow-400 rounded-full flex items-center justify-center mb-3 shadow-lg">
                        <AchievementIcon className="h-8 w-8 text-yellow-500" />
                      </div>
                      <Badge className={`${style.badge} text-white`}>
                        {RARITY_NAMES[achievement.rarity as keyof typeof RARITY_NAMES]}
                      </Badge>
                    </div>
                    
                    <h4 className="font-bold text-lg mb-2">{achievement.title}</h4>
                    <p className="text-sm mb-3">{achievement.description}</p>
                    
                    <div className="flex items-center justify-center gap-1 text-sm font-medium">
                      <Trophy className="h-4 w-4 text-primary" />
                      <span>+{achievement.xpReward} XP</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Locked Achievements */}
      {lockedAchievements.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-muted-foreground" />
            الإنجازات المقفلة ({lockedAchievements.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lockedAchievements.map((achievement) => {
              const AchievementIcon = achievement.icon;
              
              return (
                <Card 
                  key={achievement.id}
                  className="bg-muted/50 border-dashed border-muted-foreground/30 opacity-60"
                >
                  <CardContent className="p-6 text-center">
                    <div className="mb-4">
                      <div className="w-16 h-16 mx-auto bg-muted/50 border-2 border-dashed border-muted-foreground/30 rounded-full flex items-center justify-center mb-3">
                        <AchievementIcon className="h-8 w-8 text-muted-foreground/60" />
                      </div>
                      <Badge variant="outline">
                        {RARITY_NAMES[achievement.rarity as keyof typeof RARITY_NAMES]}
                      </Badge>
                    </div>
                    
                    <h4 className="font-bold text-lg mb-2 text-muted-foreground">{achievement.title}</h4>
                    <p className="text-sm mb-3 text-muted-foreground">{achievement.description}</p>
                    
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground/80">
                      <Trophy className="h-4 w-4" />
                      <span>+{achievement.xpReward} XP</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {unlockedAchievements.length === 0 && (
        <div className="text-center py-16">
          <Trophy className="h-20 w-20 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-2xl font-bold mb-2">ابدأ رحلتك في عالم الشبكات!</h3>
          <p className="text-muted-foreground">
            أكمل أول اختبار في الشبكات لكسب أول إنجاز
          </p>
        </div>
      )}
    </div>
  );
};

export default Achievements;