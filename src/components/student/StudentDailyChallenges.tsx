import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  CheckCircle, 
  Gift, 
  Clock, 
  Star,
  Video,
  BookOpen,
  Gamepad2,
  Brain,
  Zap,
  Trophy,
  Calendar,
  Flame
} from 'lucide-react';
import { toast } from 'sonner';

export const StudentDailyChallenges: React.FC = () => {
  const [challenges, setChallenges] = useState([
    {
      id: 1,
      type: 'watch_videos',
      title: 'مشاهدة الفيديوهات',
      description: 'شاهد 3 فيديوهات تعليمية اليوم',
      target: 3,
      current: 1,
      points: 15,
      icon: Video,
      bgClass: 'stat-videos-bg',
      completed: false
    },
    {
      id: 2,
      type: 'play_games',
      title: 'العب وتعلم',
      description: 'أكمل لعبتين تعليميتين',
      target: 2,
      current: 2,
      points: 20,
      icon: Gamepad2,
      bgClass: 'stat-achievements-bg',
      completed: true
    },
    {
      id: 3,
      type: 'study_time',
      title: 'وقت الدراسة',
      description: 'ادرس لمدة 30 دقيقة متواصلة',
      target: 30,
      current: 18,
      points: 25,
      icon: Brain,
      bgClass: 'stat-progress-bg',
      completed: false
    },
    {
      id: 4,
      type: 'complete_project',
      title: 'إنجاز المشاريع',
      description: 'أكمل مهمة واحدة من مشاريعك',
      target: 1,
      current: 0,
      points: 30,
      icon: Trophy,
      bgClass: 'stat-projects-bg',
      completed: false
    }
  ]);

  const [streak, setStreak] = useState(5);
  const [totalPointsToday, setTotalPointsToday] = useState(20);

  const weeklyGoals = [
    {
      title: 'نجم الأسبوع',
      description: 'أكمل جميع التحديات اليومية لـ 5 أيام',
      progress: 3,
      target: 5,
      reward: '100 نقطة + شارة خاصة',
      icon: Star
    },
    {
      title: 'عبقري الفيديوهات',
      description: 'شاهد 20 فيديو تعليمي هذا الأسبوع',
      progress: 12,
      target: 20,
      reward: '50 نقطة',
      icon: Video
    },
    {
      title: 'بطل الألعاب',
      description: 'احصل على نقاط كاملة في 10 ألعاب',
      progress: 7,
      target: 10,
      reward: '75 نقطة + لقب خاص',
      icon: Gamepad2
    }
  ];

  const handleCompleteChallenge = (challengeId: number) => {
    setChallenges(challenges.map(challenge => {
      if (challenge.id === challengeId && !challenge.completed) {
        setTotalPointsToday(prev => prev + challenge.points);
        toast.success(`تهانينا! تم إكمال التحدي بنجاح 🎉`, {
          description: `حصلت على ${challenge.points} نقطة`
        });
        return { ...challenge, completed: true, current: challenge.target };
      }
      return challenge;
    }));
  };

  const completedChallenges = challenges.filter(c => c.completed).length;
  const totalChallenges = challenges.length;
  const completionPercentage = (completedChallenges / totalChallenges) * 100;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="stat-points-bg">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-2 bg-stat-points/20 rounded-full flex items-center justify-center">
              <Flame className="w-6 h-6 text-stat-points" />
            </div>
            <div className="text-2xl font-bold text-foreground">{streak}</div>
            <div className="text-sm text-foreground-secondary">أيام متتالية</div>
          </CardContent>
        </Card>

        <Card className="stat-progress-bg">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-2 bg-stat-progress/20 rounded-full flex items-center justify-center">
              <Target className="w-6 h-6 text-stat-progress" />
            </div>
            <div className="text-2xl font-bold text-foreground">{completedChallenges}/{totalChallenges}</div>
            <div className="text-sm text-foreground-secondary">تحديات اليوم</div>
          </CardContent>
        </Card>

        <Card className="stat-achievements-bg">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-2 bg-stat-achievements/20 rounded-full flex items-center justify-center">
              <Star className="w-6 h-6 text-stat-achievements" />
            </div>
            <div className="text-2xl font-bold text-foreground">{totalPointsToday}</div>
            <div className="text-sm text-foreground-secondary">نقاط اليوم</div>
          </CardContent>
        </Card>

        <Card className="stat-videos-bg">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-2 bg-stat-videos/20 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-stat-videos" />
            </div>
            <div className="text-2xl font-bold text-foreground">{Math.round(completionPercentage)}%</div>
            <div className="text-sm text-foreground-secondary">مكتمل</div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Progress */}
      <Card className="gradient-hero text-on-gradient border-0">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-bold">تقدم اليوم</h3>
            <div className="max-w-md mx-auto">
              <div className="flex justify-between text-sm mb-2">
                <span>التحديات المكتملة</span>
                <span>{completedChallenges} من {totalChallenges}</span>
              </div>
              <Progress value={completionPercentage} className="h-3 bg-white/20" />
            </div>
            {completionPercentage === 100 && (
              <div className="glass-surface rounded-lg p-4 animate-pulse">
                <div className="flex items-center justify-center gap-2">
                  <Gift className="w-5 h-5" />
                  <span className="font-medium">تهانينا! أكملت جميع تحديات اليوم 🎉</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Daily Challenges */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          تحديات اليوم
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {challenges.map((challenge) => {
            const IconComponent = challenge.icon;
            const progress = (challenge.current / challenge.target) * 100;

            return (
              <Card 
                key={challenge.id}
                className={`${challenge.bgClass} border-0 shadow-lg transition-all duration-300 group ${
                  challenge.completed ? 'ring-2 ring-stat-progress' : 'hover:shadow-xl'
                }`}
              >
                <CardContent className="p-6 relative overflow-hidden">
                  <div className="space-y-4 relative">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      
                      {challenge.completed ? (
                        <Badge className="badge-success">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          مكتمل
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="glass-surface">
                          {challenge.points} نقطة
                        </Badge>
                      )}
                    </div>

                    <div>
                      <h4 className="font-semibold text-lg mb-1 text-foreground">{challenge.title}</h4>
                      <p className="text-sm text-foreground-secondary mb-3">
                        {challenge.description}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>التقدم</span>
                        <span>{challenge.current} / {challenge.target}</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    {!challenge.completed && progress < 100 && (
                      <Button 
                        onClick={() => handleCompleteChallenge(challenge.id)}
                        className="w-full"
                        variant="outline"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        إكمال التحدي
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Weekly Goals */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          أهداف الأسبوع
        </h3>
        
        <div className="space-y-4">
          {weeklyGoals.map((goal, index) => {
            const IconComponent = goal.icon;
            const progress = (goal.progress / goal.target) * 100;

            return (
              <Card key={index} className="glass-surface shadow-md hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div>
                        <h4 className="font-semibold text-lg">{goal.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {goal.description}
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>التقدم</span>
                          <span>{goal.progress} / {goal.target}</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Gift className="w-4 h-4 text-yellow-600" />
                        <span className="text-muted-foreground">المكافأة:</span>
                        <span className="font-medium text-yellow-600">{goal.reward}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};