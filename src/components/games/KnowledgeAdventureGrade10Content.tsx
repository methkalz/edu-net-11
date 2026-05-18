import React, { useState } from 'react';
import { Trophy, Star, Zap, Book, Target, Map, Users, Loader2 } from 'lucide-react';
import { useBadgeProgress } from '@/hooks/useBadgeProgress';
import { BadgeCelebration } from '@/components/badges/BadgeCelebration';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { usePlayerProfile } from '@/hooks/usePlayerProfile';
import { useGrade10Game } from '@/hooks/useGrade10Game';
import { useSmartRewards } from '@/hooks/useSmartRewards';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import PlayerAvatar from './PlayerAvatar';
import GameMapGrade10 from './GameMapGrade10';
import { ShuffledQuizChallenge } from './ShuffledQuizChallenge';
import Achievements from './Achievements';
import GameErrorBoundary from './GameErrorBoundary';

const KnowledgeAdventureGrade10Content: React.FC = () => {
  const { user, userProfile } = useAuth();
  const { playerStats, loading: profileLoading, addCoins, addExperience } = usePlayerProfile();
  const [activeTab, setActiveTab] = useState('map');
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);

  const { showCelebration, celebrationBadge, closeCelebration } = useBadgeProgress(playerStats?.totalXP);
  const { lessons, progress, achievements, loading, updateProgress, isLessonUnlocked, getTotalStats } = useGrade10Game();
  const { toast } = useToast();
  const { processSmartReward } = useSmartRewards();

  const handleShuffledQuizComplete = (results: {
    finalScore: number;
    maxScore: number;
    percentage: number;
    totalQuestions: number;
    correctAnswers: number;
    completionTime?: number;
  }) => {
    if (selectedLesson) {
      handleLessonComplete(
        selectedLesson,
        results.finalScore,
        results.maxScore,
        results.completionTime,
        results.totalQuestions - results.correctAnswers
      );
    }
  };

  const handleLessonComplete = async (
    lessonId: string,
    score: number,
    maxScore: number,
    completionTime?: number,
    mistakesCount?: number
  ) => {
    try {
      if (!lessonId || score < 0 || maxScore <= 0) throw new Error('Invalid lesson completion data');
      await updateProgress(lessonId, score, maxScore, completionTime, mistakesCount);

      const reward = await processSmartReward({
        lessonId,
        score,
        maxScore,
        completionTime,
        mistakesCount: mistakesCount || 0
      });
      if (reward.coinsEarned > 0) await addCoins(reward.coinsEarned);
      if (reward.xpEarned > 0) await addExperience(reward.xpEarned);

      const percentage = (score / maxScore) * 100;
      let description = `حصلت على ${score}/${maxScore} نقطة (${Math.round(percentage)}%)`;
      if (completionTime) {
        const minutes = Math.floor(completionTime / 60);
        const seconds = completionTime % 60;
        description += `\nالوقت: ${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
      if (reward.coinsEarned > 0) description += `\nالعملات المكتسبة: ${reward.coinsEarned}`;
      if (reward.xpEarned > 0) description += `\nنقاط الخبرة: ${reward.xpEarned}`;
      if (reward.description) description += `\n\n${reward.description}`;

      toast({ title: reward.message, description, duration: 6000 });

      if (percentage >= 70) {
        logger.info('Grade10 student passed quiz, auto-returning to map', { lessonId, score, percentage });
        setTimeout(() => {
          setSelectedLesson(null);
          toast({
            title: '🔓 تم فتح الدرس التالي!',
            description: 'يمكنك الآن المتابعة للدرس التالي في رحلتك التعليمية',
            duration: 5000
          });
        }, 3000);
      }
    } catch (error: any) {
      logger.error('Error completing grade10 lesson', error);
      if (error.message?.includes('duplicate key') || error.code === '23505') {
        const percentage = (score / maxScore) * 100;
        toast({ title: '✅ تم تحديث النتيجة', description: `نتيجتك: ${score}/${maxScore} (${Math.round(percentage)}%)` });
      } else if (error.message?.includes('network') || !navigator.onLine) {
        toast({ title: '📱 تم الحفظ محلياً', description: 'سيتم مزامنة نتيجتك عند توفر الاتصال' });
      } else {
        toast({ title: 'خطأ في الحفظ', description: 'تحقق من اتصالك بالإنترنت وحاول مرة أخرى', variant: 'destructive' });
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <Trophy className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-2xl">مغامرة الشبكات — الصف العاشر</CardTitle>
            <p className="text-muted-foreground">يجب تسجيل الدخول أولاً للعب</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => (window.location.href = '/auth')} className="w-full">تسجيل الدخول</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || profileLoading || !playerStats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20 flex items-center justify-center">
        <Card className="p-8">
          <div className="flex items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-lg">جاري تحميل البيانات...</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {showCelebration && celebrationBadge && (
        <BadgeCelebration
          badge={celebrationBadge}
          studentName={playerStats?.name || userProfile?.full_name}
          onClose={closeCelebration}
        />
      )}

      <div className="bg-card/80 backdrop-blur border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <PlayerAvatar avatarId={playerStats.avatarId} size="sm" />
              <div>
                <h2 className="font-bold text-lg">{playerStats.name}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>المستوى {playerStats.level}</span>
                  <span>•</span>
                  <Zap className="h-4 w-4 text-blue-500" />
                  <span>{playerStats.coins} عملة</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium">{playerStats.totalXP} نقطة خبرة</div>
                <div className="text-xs text-muted-foreground">
                  {getTotalStats().completedLessons} / {lessons.length} درس مكتمل
                </div>
              </div>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                {playerStats.streakDays} يوم متتالي
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto">
            <TabsTrigger value="map" className="flex items-center gap-2"><Map className="h-4 w-4" />خريطة الدروس</TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2"><Trophy className="h-4 w-4" />الإنجازات</TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex items-center gap-2"><Users className="h-4 w-4" />المتصدرين</TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2"><Book className="h-4 w-4" />التقدم</TabsTrigger>
          </TabsList>

          <TabsContent value="map">
            <GameErrorBoundary>
              {selectedLesson ? (
                <ShuffledQuizChallenge
                  lessonId={selectedLesson}
                  lessons={lessons as any}
                  onComplete={handleShuffledQuizComplete}
                  onBack={() => setSelectedLesson(null)}
                  onNextLesson={(nextLessonId) => setSelectedLesson(nextLessonId)}
                />
              ) : (
                <GameMapGrade10
                  lessons={lessons}
                  progress={progress}
                  isLessonUnlocked={isLessonUnlocked}
                  onSelectLesson={setSelectedLesson}
                />
              )}
            </GameErrorBoundary>
          </TabsContent>

          <TabsContent value="achievements">
            <Achievements player={playerStats} onUnlockAchievement={() => {}} />
          </TabsContent>

          <TabsContent value="leaderboard">
            <div className="text-center py-16">
              <Users className="h-20 w-20 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-2xl font-bold mb-2">المتصدرين قريباً!</h3>
              <p className="text-muted-foreground">سيتم إضافة قائمة المتصدرين قريباً لإضافة روح التنافس</p>
            </div>
          </TabsContent>

          <TabsContent value="progress">
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>إحصائيات التقدم</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center"><div className="text-2xl font-bold text-primary">{playerStats.level}</div><div className="text-sm text-muted-foreground">المستوى</div></div>
                    <div className="text-center"><div className="text-2xl font-bold text-blue-500">{playerStats.totalXP}</div><div className="text-sm text-muted-foreground">نقاط الخبرة</div></div>
                    <div className="text-center"><div className="text-2xl font-bold text-green-500">{getTotalStats().completedLessons}</div><div className="text-sm text-muted-foreground">دروس مكتملة</div></div>
                    <div className="text-center"><div className="text-2xl font-bold text-orange-500">{playerStats.streakDays}</div><div className="text-sm text-muted-foreground">أيام متتالية</div></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>تقدم إكمال الدروس</span>
                      <span>{lessons.length === 0 ? 0 : Math.round((getTotalStats().completedLessons / lessons.length) * 100)}%</span>
                    </div>
                    <Progress value={lessons.length === 0 ? 0 : (getTotalStats().completedLessons / lessons.length) * 100} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>تفاصيل الدروس</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {lessons.map((lesson, index) => {
                      const lessonProgress = progress[lesson.id];
                      const unlocked = isLessonUnlocked(index);
                      return (
                        <div key={lesson.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{lesson.title}</div>
                            <div className="text-sm text-muted-foreground">{lesson.section_title} • {lesson.topic_title}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {lessonProgress?.completed_at && (
                              <Badge variant="default" className="bg-green-500">مكتمل {lessonProgress.score}/{lessonProgress.max_score}</Badge>
                            )}
                            {!unlocked && <Badge variant="outline">مقفل</Badge>}
                            {unlocked && !lessonProgress?.completed_at && <Badge variant="secondary">متاح</Badge>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default KnowledgeAdventureGrade10Content;
