import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStudentProgress } from '@/hooks/useStudentProgress';
import { useStudentContent } from '@/hooks/useStudentContent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import PlayerAvatar from '@/components/games/PlayerAvatar';
import { 
  User, 
  Star, 
  Trophy, 
  Target, 
  Calendar,
  Award,
  Crown,
  Shield,
  Sparkles,
  Gift,
  Flame,
  Clock,
  BookOpen,
  Video,
  Brain
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export const StudentProfile: React.FC = () => {
  const { userProfile } = useAuth();
  const { stats, achievements } = useStudentProgress();
  const { getProgressPercentage, getTotalContentCount, getCompletedContentCount } = useStudentContent();

  const profileStats = [
    {
      label: 'المستوى الحالي',
      value: Math.floor(stats.total_points / 100) + 1,
      icon: Crown,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      label: 'النقاط الإجمالية',
      value: stats.total_points.toLocaleString(),
      icon: Star,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      label: 'معدل التقدم',
      value: `${getProgressPercentage()}%`,
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'الأيام المتتالية',
      value: stats.current_streak,
      icon: Flame,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  const learningStats = [
    {
      category: 'الفيديوهات',
      completed: stats.completed_videos,
      total: 45, // This would come from actual data
      icon: Video,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      category: 'المشاريع',
      completed: stats.completed_projects,
      total: 12,
      icon: BookOpen,
      color: 'from-green-500 to-emerald-500'
    },
    {
      category: 'الأنشطة',
      completed: stats.total_activities,
      total: 100,
      icon: Brain,
      color: 'from-purple-500 to-pink-500'
    }
  ];

  const badges = [
    { name: 'طالب مجتهد', description: 'أكمل 10 دروس', earned: true, icon: '🎓' },
    { name: 'نجم الفيديوهات', description: 'شاهد 25 فيديو', earned: true, icon: '🌟' },
    { name: 'بطل المشاريع', description: 'أكمل 5 مشاريع', earned: stats.completed_projects >= 5, icon: '🏆' },
    { name: 'عبقري الألعاب', description: 'احصل على نقاط كاملة في 20 لعبة', earned: false, icon: '🧠' },
    { name: 'مستكشف المعرفة', description: 'ادرس لمدة 100 ساعة', earned: false, icon: '🔍' },
    { name: 'مثابر', description: 'ادرس لمدة 30 يوم متتالي', earned: stats.current_streak >= 30, icon: '💪' }
  ];

  const currentLevel = Math.floor(stats.total_points / 100) + 1;
  const pointsInLevel = stats.total_points % 100;
  const pointsToNextLevel = 100 - pointsInLevel;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white border-0 overflow-hidden relative">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-4 right-4 w-32 h-32 bg-white/10 rounded-full animate-float"></div>
          <div className="absolute bottom-4 left-4 w-24 h-24 bg-yellow-400/20 rounded-full animate-bounce-slow"></div>
        </div>
        
        <CardContent className="p-8 relative">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <PlayerAvatar 
                avatarId="student1" 
                size="lg" 
                showBadge={true} 
                level={currentLevel} 
              />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-yellow-900">
                {currentLevel}
              </div>
            </div>
            
            <div className="text-center md:text-right flex-1">
              <h2 className="text-3xl font-bold mb-2">{userProfile?.full_name}</h2>
              <p className="text-xl opacity-90 mb-4">طالب متميز - الصف {'غير محدد'}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {profileStats.map((stat) => {
                  const IconComponent = stat.icon;
                  return (
                    <div key={stat.label} className="text-center">
                      <div className="w-12 h-12 mx-auto mb-2 bg-white/20 rounded-full flex items-center justify-center">
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <div className="text-sm opacity-80">{stat.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Level Progress */}
          <div className="mt-6 bg-white/10 rounded-lg p-4">
            <div className="flex justify-between text-sm mb-2">
              <span>المستوى {currentLevel}</span>
              <span>{pointsInLevel}/100 نقطة</span>
            </div>
            <Progress value={(pointsInLevel / 100) * 100} className="h-3 bg-white/20" />
            <p className="text-xs mt-2 opacity-80">
              تحتاج {pointsToNextLevel} نقطة للوصول للمستوى {currentLevel + 1}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Learning Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              إحصائيات التعلم
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {learningStats.map((stat) => {
              const IconComponent = stat.icon;
              const percentage = stat.total > 0 ? (stat.completed / stat.total) * 100 : 0;
              
              return (
                <div key={stat.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                        <IconComponent className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium">{stat.category}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {stat.completed} / {stat.total}
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              أحدث الإنجازات
              <Badge variant="secondary">{achievements.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {achievements.slice(0, 5).map((achievement, index) => (
              <div 
                key={achievement.id}
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{achievement.achievement_name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(achievement.earned_at), 'dd MMMM yyyy', { locale: ar })}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-purple-600">
                    +{achievement.points_value}
                  </div>
                  <div className="text-xs text-muted-foreground">نقطة</div>
                </div>
              </div>
            ))}
            
            {achievements.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>لم تحصل على أي إنجازات بعد</p>
                <p className="text-sm">ابدأ التعلم لتحصل على أول إنجاز!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Badges Collection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            مجموعة الشارات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {badges.map((badge, index) => (
              <div 
                key={badge.name}
                className={`text-center p-4 rounded-lg border transition-all duration-200 ${
                  badge.earned 
                    ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 shadow-md' 
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className="text-4xl mb-2">{badge.icon}</div>
                <h4 className={`font-medium text-sm mb-1 ${badge.earned ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {badge.name}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {badge.description}
                </p>
                {badge.earned && (
                  <Badge className="mt-2 bg-green-100 text-green-700 text-xs">
                    مكتسب
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            النشاط الأخير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: 'أكمل فيديو "مقدمة في الشبكات"', time: 'منذ ساعتين', points: 10, icon: Video, color: 'text-blue-600' },
              { action: 'حصل على شارة "طالب مجتهد"', time: 'منذ 4 ساعات', points: 25, icon: Award, color: 'text-yellow-600' },
              { action: 'أكمل لعبة المطابقة', time: 'أمس', points: 15, icon: Trophy, color: 'text-purple-600' },
              { action: 'بدأ مشروع جديد', time: 'أمس', points: 5, icon: BookOpen, color: 'text-green-600' }
            ].map((activity, index) => {
              const IconComponent = activity.icon;
              
              return (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <IconComponent className={`w-5 h-5 ${activity.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.time}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-600">+{activity.points}</div>
                    <div className="text-xs text-muted-foreground">نقطة</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};