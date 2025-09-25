import React, { useState, useEffect } from 'react';
import { Trophy, Star, Zap, Book, Target, Map, Users, Gift, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useGrade10PlayerProfile } from '@/hooks/useGrade10PlayerProfile';
import { useGrade10Game } from '@/hooks/useGrade10Game';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import PlayerAvatar from './PlayerAvatar';
import GameMapReal from './GameMapReal';
import { ShuffledQuizChallenge } from './ShuffledQuizChallenge';
import Achievements from './Achievements';
import GameErrorBoundary from './GameErrorBoundary';

const Grade10KnowledgeAdventure: React.FC = () => {
  const { user, userProfile } = useAuth();
  const { playerStats, loading: profileLoading, addCoins, addExperience } = useGrade10PlayerProfile();
  const [activeTab, setActiveTab] = useState('map');
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);

  const { 
    lessons, 
    progress, 
    achievements, 
    loading, 
    updateProgress, 
    isLessonUnlocked, 
    getTotalStats 
  } = useGrade10Game();

  const { toast } = useToast();

  // دالة مساعدة لمعالجة نتائج الاختبار المخلوط
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
        results.completionTime
      );
    }
  };

  // دالة معالجة إكمال الدرس
  const handleLessonComplete = async (
    lessonId: string,
    score: number,
    maxScore: number,
    completionTime?: number
  ) => {
    try {
      // حفظ التقدم في قاعدة البيانات أولاً
      await updateProgress(lessonId, score, maxScore, completionTime);
      
      // تطبيق نظام المكافآت الذكية
      const percentage = (score / maxScore) * 100;
      let coinsEarned = 0;
      let xpEarned = 0;

      // نظام مكافآت مبسط
      if (percentage >= 90) {
        coinsEarned = 50;
        xpEarned = 100;
      } else if (percentage >= 70) {
        coinsEarned = 30;
        xpEarned = 75;
      } else if (percentage >= 50) {
        coinsEarned = 20;
        xpEarned = 50;
      }

      // مكافأة إضافية للسرعة
      if (completionTime && completionTime < 120) {
        coinsEarned += 20;
        xpEarned += 25;
      }

      // إضافة المكافآت
      if (coinsEarned > 0) {
        await addCoins(coinsEarned);
      }
      if (xpEarned > 0) {
        await addExperience(xpEarned);
      }

      // إشعار مفصل بالنتائج
      const lessonTitle = lessons.find(l => l.id === lessonId)?.title || 'الدرس';
      
      toast({
        title: '🎉 أحسنت!',
        description: `
          أكملت ${lessonTitle} بنجاح!
          النتيجة: ${score}/${maxScore} (${percentage.toFixed(1)}%)
          ${coinsEarned > 0 ? `• العملات المكتسبة: +${coinsEarned} 🪙` : ''}
          ${xpEarned > 0 ? `• النقاط المكتسبة: +${xpEarned} ⭐` : ''}
          ${completionTime ? `• الوقت: ${Math.floor(completionTime / 60)}:${String(completionTime % 60).padStart(2, '0')}` : ''}
        `,
        duration: 8000
      });

      // العودة للخريطة
      setSelectedLesson(null);

    } catch (error: any) {
      logger.error('خطأ في حفظ النتائج', error);
      
      // معلومات أكثر تفصيلاً عن الخطأ
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        toast({
          title: '⚠️ مشكلة في الاتصال',
          description: 'تعذر حفظ النتيجة بسبب مشكلة في الشبكة. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.',
          variant: 'destructive',
          duration: 10000
        });
      } else if (error.code === '23505') {
        toast({
          title: '🔄 نتيجة مكررة',
          description: 'يبدو أن النتيجة محفوظة مسبقاً. يرجى تحديث الصفحة للمتابعة.',
          variant: 'default',
          duration: 8000
        });
      } else {
        toast({
          title: '❌ خطأ في حفظ النتيجة',
          description: `حدث خطأ غير متوقع: ${error.message || 'خطأ غير معروف'}. يرجى المحاولة مرة أخرى.`,
          variant: 'destructive',
          duration: 10000
        });
      }
    }
  };

  // التأكد من تسجيل الدخول
  if (!user) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8">
        <div className="animate-pulse mb-4">
          <Target className="h-16 w-16 text-muted-foreground mx-auto" />
        </div>
        <h3 className="text-xl font-semibold mb-2">يجب تسجيل الدخول</h3>
        <p className="text-muted-foreground mb-6">يرجى تسجيل الدخول للوصول إلى لعبة مغامرة المعرفة</p>
        <Button onClick={() => window.location.href = '/auth'}>
          تسجيل الدخول
        </Button>
      </div>
    );
  }

  // حالة التحميل
  if (loading || profileLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">جاري تحميل اللعبة...</p>
      </div>
    );
  }

  // حالة عدم وجود بيانات لاعب
  if (!playerStats) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8">
        <Gift className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">إعداد الملف الشخصي</h3>
        <p className="text-muted-foreground">جاري إعداد ملفك الشخصي في اللعبة...</p>
      </div>
    );
  }

  const totalStats = getTotalStats();

  return (
    <GameErrorBoundary>
      <div className="w-full space-y-6">
        {/* Header with player stats */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <PlayerAvatar 
                avatarId={playerStats.avatarId || 'student1'}
              />
              <div>
                <h2 className="text-2xl font-bold">{playerStats.name}</h2>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    <span>المستوى {playerStats.level}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4" />
                    <span>{playerStats.coins} عملة</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy className="h-4 w-4" />
                    <span>{playerStats.totalXP} نقطة</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    <span>{playerStats.streakDays} يوم متتالي</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm opacity-90 mb-1">تقدم المستوى</div>
              <Progress 
                value={playerStats.xp} 
                max={100} 
                className="w-32 h-2 bg-white/20"
              />
              <div className="text-xs mt-1">{playerStats.xp}/100 XP</div>
            </div>
          </div>
        </div>

        {/* Game Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              الخريطة
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              الإنجازات ({playerStats.achievements.length})
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <Book className="h-4 w-4" />
              التقدم
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="mt-6">
            {selectedLesson ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedLesson(null)}
                    className="flex items-center gap-2"
                  >
                    ← العودة للخريطة
                  </Button>
                </div>
                <ShuffledQuizChallenge
                  lessonId={selectedLesson}
                  onComplete={handleShuffledQuizComplete}
                  onBack={() => setSelectedLesson(null)}
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold mb-4">خريطة الدروس قيد التطوير</h3>
                <p className="text-muted-foreground">ستتوفر خريطة الدروس التفاعلية قريباً</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="achievements" className="mt-6">
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-4">الإنجازات</h3>
              <p className="text-muted-foreground">لديك {achievements.length} إنجاز</p>
            </div>
          </TabsContent>

          <TabsContent value="progress" className="mt-6">
            <div className="grid gap-6">
              {/* Overall Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Book className="h-5 w-5" />
                    الإحصائيات العامة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">{totalStats.completedLessons}</div>
                      <div className="text-sm text-muted-foreground">دروس مكتملة</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">{totalStats.totalLessons}</div>
                      <div className="text-sm text-muted-foreground">إجمالي الدروس</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">{playerStats.level}</div>
                      <div className="text-sm text-muted-foreground">المستوى الحالي</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">{playerStats.achievements.length}</div>
                      <div className="text-sm text-muted-foreground">الإنجازات</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lessons Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>تقدم الدروس</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {lessons.map((lesson, index) => {
                      const lessonProgress = progress[lesson.id];
                      const isUnlocked = isLessonUnlocked(index);
                      const isCompleted = lessonProgress?.completed_at;
                      const score = lessonProgress?.score || 0;
                      const maxScore = lessonProgress?.max_score || lesson.questions.length * 10;

                      return (
                        <div key={lesson.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`
                              h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold
                              ${isCompleted ? 'bg-green-500 text-white' : 
                                isUnlocked ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'}
                            `}>
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">{lesson.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {lesson.section_title} - {lesson.topic_title}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isCompleted ? (
                              <Badge variant="default" className="bg-green-500">
                                مكتمل ({score}/{maxScore})
                              </Badge>
                            ) : isUnlocked ? (
                              <Badge variant="outline">متاح</Badge>
                            ) : (
                              <Badge variant="secondary">مقفل</Badge>
                            )}
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
    </GameErrorBoundary>
  );
};

export default Grade10KnowledgeAdventure;