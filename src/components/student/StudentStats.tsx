import React from 'react';
import { useStudentProgress } from '@/hooks/useStudentProgress';
import { useStudentContent } from '@/hooks/useStudentContent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Star, 
  Target, 
  Zap, 
  Calendar,
  Clock,
  TrendingUp,
  Video,
  FileText,
  Brain,
  Award,
  Gift,
  Flame,
  BookOpen
} from 'lucide-react';

export const StudentStats: React.FC = () => {
  const { stats, achievements, loading } = useStudentProgress();
  const { getProgressPercentage, getTotalContentCount, getCompletedContentCount } = useStudentContent();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const progressPercentage = getProgressPercentage();
  const totalContent = getTotalContentCount();
  const completedContent = getCompletedContentCount();

  const statCards = [
    {
      title: 'النقاط الإجمالية',
      value: stats.total_points.toLocaleString(),
      icon: Star,
      gradient: 'from-yellow-400 to-orange-400',
      bgGradient: 'from-yellow-50 to-orange-50',
      description: 'نقطة مكتسبة',
      animation: 'animate-wiggle'
    },
    {
      title: 'معدل التقدم',
      value: `${progressPercentage}%`,
      icon: TrendingUp,
      gradient: 'from-green-400 to-emerald-400',
      bgGradient: 'from-green-50 to-emerald-50',
      description: `${completedContent} من ${totalContent}`,
      animation: 'animate-bounce-slow'
    },
    {
      title: 'الفيديوهات المكتملة',
      value: stats.completed_videos.toString(),
      icon: Video,
      gradient: 'from-blue-400 to-cyan-400',
      bgGradient: 'from-blue-50 to-cyan-50',
      description: 'فيديو تعليمي',
      animation: 'animate-float'
    },
    {
      title: 'المشاريع المنجزة',
      value: stats.completed_projects.toString(),
      icon: Trophy,
      gradient: 'from-purple-400 to-pink-400',
      bgGradient: 'from-purple-50 to-pink-50',
      description: 'مشروع مكتمل',
      animation: 'animate-glow'
    },
    {
      title: 'الإنجازات',
      value: stats.achievements_count.toString(),
      icon: Award,
      gradient: 'from-indigo-400 to-purple-400',
      bgGradient: 'from-indigo-50 to-purple-50',
      description: 'شارة وإنجاز',
      animation: 'animate-pulse-slow'
    },
    {
      title: 'الأيام المتتالية',
      value: stats.current_streak.toString(),
      icon: Flame,
      gradient: 'from-red-400 to-pink-400',
      bgGradient: 'from-red-50 to-pink-50',
      description: 'يوم نشاط متواصل',
      animation: 'animate-bounce'
    }
  ];

  const recentAchievements = achievements.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon;
          
          return (
            <Card 
              key={stat.title}
              className={`bg-gradient-to-br ${stat.bgGradient} border-0 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden relative`}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-gradient-to-br from-current to-transparent"></div>
              </div>
              
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <div className="space-y-1">
                      <p className="text-3xl font-bold text-foreground group-hover:scale-105 transition-transform duration-200">
                        {stat.value}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stat.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${stat.gradient} flex items-center justify-center shadow-lg ${stat.animation}`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Progress bar for certain stats */}
                {stat.title === 'معدل التقدم' && (
                  <div className="mt-4">
                    <Progress 
                      value={progressPercentage} 
                      className="h-2 bg-white/50"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Gift className="w-5 h-5" />
              أحدث الإنجازات
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                {achievements.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAchievements.map((achievement, index) => (
                <div 
                  key={achievement.id}
                  className="flex items-center gap-3 p-3 bg-white/50 rounded-lg border border-purple-100 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground">
                      {achievement.achievement_name}
                    </h4>
                    {achievement.achievement_description && (
                      <p className="text-sm text-muted-foreground">
                        {achievement.achievement_description}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-bold text-purple-600">
                      +{achievement.points_value}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      نقطة
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Study Time & Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Clock className="w-5 h-5" />
              إحصائيات النشاط
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">إجمالي الأنشطة</span>
                <span className="text-lg font-bold text-blue-600">
                  {stats.total_activities}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">متوسط النشاط اليومي</span>
                <span className="text-lg font-bold text-blue-600">
                  {Math.round(stats.total_activities / Math.max(stats.current_streak, 1))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Target className="w-5 h-5" />
              معدل الإنجاز
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">معدل النجاح</span>
                <span className="text-lg font-bold text-green-600">
                  {totalContent > 0 ? Math.round((completedContent / totalContent) * 100) : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">التقدم الأسبوعي</span>
                <span className="text-lg font-bold text-green-600">
                  +{Math.round(progressPercentage / 4)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};