import React from 'react';
import { useStudentProgress } from '@/hooks/useStudentProgress';
import { useStudentContent } from '@/hooks/useStudentContent';
import { useStudentAssignedGrade } from '@/hooks/useStudentAssignedGrade';
import { useStudentGameStats } from '@/hooks/useStudentGameStats';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { StudentCalendarSection } from './StudentCalendarSection';
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
  Gamepad2,
  BookOpen
} from 'lucide-react';

export const StudentStats: React.FC = () => {
  const { stats, achievements, loading } = useStudentProgress();
  const { getProgressPercentage, getTotalContentCount, getCompletedContentCount, gradeContent } = useStudentContent();
  const { assignedGrade } = useStudentAssignedGrade();
  const { stats: gameStats } = useStudentGameStats();
  
  // حساب العدد الكلي لمراحل الألعاب حسب الصف
  const [totalGameStages, setTotalGameStages] = React.useState(0);
  
  React.useEffect(() => {
    const fetchTotalGameStages = async () => {
      if (assignedGrade === '10') {
        // للصف العاشر: حساب عدد الدروس التي لها أسئلة في لعبة المعرفة
        const { count } = await supabase
          .from('grade10_game_questions')
          .select('lesson_id', { count: 'exact', head: true });
        
        // عدد الدروس الفريدة
        const { data } = await supabase
          .from('grade10_game_questions')
          .select('lesson_id');
        
        const uniqueLessons = new Set(data?.map(q => q.lesson_id) || []);
        setTotalGameStages(uniqueLessons.size);
      } else {
        // للصف الحادي عشر: pair_matching_games
        const { count } = await supabase
          .from('pair_matching_games')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);
        setTotalGameStages(count || 0);
      }
    };
    fetchTotalGameStages();
  }, [assignedGrade]);

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
  
  // حساب الدروس المكتملة فقط (وليس كل المحتوى)
  const completedLessons = (gradeContent?.lessons || []).filter(lesson => 
    lesson.progress?.progress_percentage === 100
  ).length;
  
  // حساب الإجمالي الكلي
  // للصف الثاني عشر: معدل التقدم يعتمد على الفيديوهات فقط
  const totalCompleted = assignedGrade === '12' 
    ? stats.completed_videos 
    : completedContent + gameStats.completedGames;
  const totalAll = assignedGrade === '12' 
    ? (gradeContent?.videos || []).length 
    : totalContent + totalGameStages;
  
  // حساب نسبة التقدم للصف الثاني عشر
  const grade12ProgressPercentage = totalAll > 0 ? Math.round((totalCompleted / totalAll) * 100) : 0;
  
  // حساب النقاط للصف الثاني عشر (10 نقاط لكل فيديو مكتمل)
  const grade12TotalPoints = stats.completed_videos * 10;

  const statCards = [
    {
      title: 'النقاط الإجمالية',
      value: (assignedGrade === '12' ? grade12TotalPoints : stats.total_points).toLocaleString(),
      icon: Star,
      gradient: 'from-yellow-400 to-orange-400',
      bgGradient: 'from-yellow-50 to-orange-50',
      description: 'نقطة مكتسبة'
    },
    {
      title: 'معدل التقدم',
      value: assignedGrade === '12' ? `${grade12ProgressPercentage}%` : `${progressPercentage}%`,
      icon: TrendingUp,
      gradient: 'from-green-400 to-emerald-400',
      bgGradient: 'from-green-50 to-emerald-50',
      description: assignedGrade === '12' 
        ? `${totalCompleted} فيديو من ${totalAll}` 
        : `${totalCompleted} من ${totalAll}`
    },
    {
      title: 'الفيديوهات المكتملة',
      value: stats.completed_videos.toString(),
      icon: Video,
      gradient: 'from-blue-400 to-cyan-400',
      bgGradient: 'from-blue-50 to-cyan-50',
      description: 'فيديو تعليمي'
    },
    // إخفاء المشاريع للصف الحادي عشر لأنه لا يحتوي على مشاريع
    ...(assignedGrade !== '11' ? [{
      title: assignedGrade === '10' ? 'المشاريع المصغرة' : 'المشاريع النهائية',
      value: stats.completed_projects.toString(),
      icon: Trophy,
      gradient: 'from-purple-400 to-pink-400',
      bgGradient: 'from-purple-50 to-pink-50',
      description: assignedGrade === '10' ? 'مشروع مصغر مكتمل' : 'مشروع نهائي مكتمل'
    }] : []),
    // إخفاء الدروس للصف الثاني عشر لأنه لا يحتوي على دروس
    ...(assignedGrade !== '12' ? [{
      title: 'الدروس المكتملة',
      value: completedLessons.toString(),
      icon: BookOpen,
      gradient: 'from-indigo-400 to-purple-400',
      bgGradient: 'from-indigo-50 to-purple-50',
      description: 'درس مكتمل'
    }] : []),
    // إخفاء المراحل المكتملة للصف الثاني عشر
    ...(assignedGrade !== '12' ? [{
      title: 'المراحل المكتملة',
      value: gameStats.completedGames.toString(),
      icon: Gamepad2,
      gradient: 'from-red-400 to-pink-400',
      bgGradient: 'from-red-50 to-pink-50',
      description: 'مرحلة لعبة مكتملة'
    }] : [])
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
                  
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${stat.gradient} flex items-center justify-center shadow-lg`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Progress bar for certain stats */}
                {stat.title === 'معدل التقدم' && (
                  <div className="mt-4">
                    <Progress 
                      value={assignedGrade === '12' ? grade12ProgressPercentage : progressPercentage} 
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

      {/* Calendar and Events Section */}
      <div className="mt-6">
        <StudentCalendarSection />
      </div>
    </div>
  );
};