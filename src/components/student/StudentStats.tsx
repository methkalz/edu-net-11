import React from 'react';
import { useStudentProgress } from '@/hooks/useStudentProgress';
import { useStudentContent } from '@/hooks/useStudentContent';
import { useStudentAssignedGrade } from '@/hooks/useStudentAssignedGrade';
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
  const { assignedGrade } = useStudentAssignedGrade();

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
      gradient: 'stat-points',
      bgClass: 'stat-points-bg',
      description: 'نقطة مكتسبة',
      animation: 'animate-wiggle'
    },
    {
      title: 'معدل التقدم',
      value: `${progressPercentage}%`,
      icon: TrendingUp,
      gradient: 'stat-progress',
      bgClass: 'stat-progress-bg',
      description: `${completedContent} من ${totalContent}`,
      animation: 'animate-bounce-slow'
    },
    {
      title: 'الفيديوهات المكتملة',
      value: stats.completed_videos.toString(),
      icon: Video,
      gradient: 'stat-videos',
      bgClass: 'stat-videos-bg',
      description: 'فيديو تعليمي',
      animation: 'animate-float'
    },
    // إخفاء المشاريع للصف الحادي عشر لأنه لا يحتوي على مشاريع
    ...(assignedGrade !== '11' ? [{
      title: assignedGrade === '10' ? 'المشاريع المصغرة' : 'المشاريع النهائية',
      value: stats.completed_projects.toString(),
      icon: Trophy,
      gradient: 'stat-projects',
      bgClass: 'stat-projects-bg',
      description: assignedGrade === '10' ? 'مشروع مصغر مكتمل' : 'مشروع نهائي مكتمل',
      animation: 'animate-glow'
    }] : []),
    {
      title: 'الإنجازات',
      value: stats.achievements_count.toString(),
      icon: Award,
      gradient: 'stat-achievements',
      bgClass: 'stat-achievements-bg',
      description: 'شارة وإنجاز',
      animation: 'animate-pulse-slow'
    },
    {
      title: 'الأيام المتتالية',
      value: stats.current_streak.toString(),
      icon: Flame,
      gradient: 'secondary',
      bgClass: 'stat-points-bg',
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
              className={`${stat.bgClass} border-border shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden relative`}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-gradient-to-br from-current to-transparent"></div>
              </div>
              
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <p className="text-sm font-medium text-foreground-secondary">
                      {stat.title}
                    </p>
                    <div className="space-y-1">
                      <p className="text-3xl font-bold text-foreground group-hover:scale-105 transition-transform duration-200">
                        {stat.value}
                      </p>
                      <p className="text-xs text-foreground-muted">
                        {stat.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className={`w-12 h-12 rounded-full bg-${stat.gradient} flex items-center justify-center shadow-lg ${stat.animation}`}>
                    <IconComponent className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>

                {/* Progress bar for certain stats */}
                {stat.title === 'معدل التقدم' && (
                  <div className="mt-4">
                    <Progress 
                      value={progressPercentage} 
                      className="h-2 bg-muted/30"
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
        <Card className="stat-achievements-bg border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-stat-achievements">
              <Gift className="w-5 h-5" />
              أحدث الإنجازات
              <Badge variant="secondary" className="badge-info">
                {achievements.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAchievements.map((achievement, index) => (
                <div 
                  key={achievement.id}
                  className="flex items-center gap-3 p-3 glass-surface rounded-lg animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-10 h-10 bg-stat-achievements rounded-full flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground">
                      {achievement.achievement_name}
                    </h4>
                    {achievement.achievement_description && (
                      <p className="text-sm text-foreground-muted">
                        {achievement.achievement_description}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-bold text-stat-achievements">
                      +{achievement.points_value}
                    </div>
                    <div className="text-xs text-foreground-muted">
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
        <Card className="stat-videos-bg border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-stat-videos">
              <Clock className="w-5 h-5" />
              إحصائيات النشاط
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground-secondary">إجمالي الأنشطة</span>
                <span className="text-lg font-bold text-stat-videos">
                  {stats.total_activities}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground-secondary">متوسط النشاط اليومي</span>
                <span className="text-lg font-bold text-stat-videos">
                  {Math.round(stats.total_activities / Math.max(stats.current_streak, 1))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-progress-bg border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-stat-progress">
              <Target className="w-5 h-5" />
              معدل الإنجاز
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground-secondary">معدل النجاح</span>
                <span className="text-lg font-bold text-stat-progress">
                  {totalContent > 0 ? Math.round((completedContent / totalContent) * 100) : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground-secondary">التقدم الأسبوعي</span>
                <span className="text-lg font-bold text-stat-progress">
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