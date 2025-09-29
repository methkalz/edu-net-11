import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStudentProgress } from '@/hooks/useStudentProgress';
import { useStudentContent } from '@/hooks/useStudentContent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Trophy, 
  Star, 
  Target, 
  Zap, 
  Calendar,
  Clock,
  Award,
  TrendingUp,
  Video,
  FileText,
  FolderOpen,
  Gamepad2,
  Sparkles,
  Gift,
  Brain,
  Rocket
} from 'lucide-react';
import { StudentStats } from './StudentStats';
import { StudentGradeContent } from './StudentGradeContent';
import { StudentGameSection } from './StudentGameSection';
import { StudentProfile } from './StudentProfile';
import { StudentDailyChallenges } from './StudentDailyChallenges';
import StudentNotifications from './StudentNotifications';
// AppFooter is managed by the main Dashboard page
import { UniversalAvatar } from '@/components/shared/UniversalAvatar';
import { UserTitleBadge } from '@/components/shared/UserTitleBadge';

const StudentDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const { stats, achievements, loading } = useStudentProgress();
  const { assignedGrade, getProgressPercentage } = useStudentContent();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Check if student is in Grade 10 or 12 (no games available)
  const hasGamesTab = assignedGrade !== "10" && assignedGrade !== "12";

  const motivationalMessages = [
    'مرحباً بك في رحلة التعلم الرائعة! 🌟',
    'كل خطوة تقربك من هدفك! 🎯',
    'أنت تتقدم بشكل ممتاز! 🚀',
    'استمر في التميز! ⭐',
    'المعرفة قوة والتعلم مغامرة!'
  ];

  const todayMessage = motivationalMessages[new Date().getDay() % motivationalMessages.length];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center loading-screen">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-lg font-medium text-muted-foreground">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg-page" dir="rtl">
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero text-on-gradient">
        <div className="absolute inset-0 bg-foreground/10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-foreground/10 rounded-full animate-float"></div>
          <div className="absolute top-20 -left-20 w-60 h-60 bg-stat-points/20 rounded-full animate-bounce-slow"></div>
          <div className="absolute bottom-10 right-1/3 w-32 h-32 bg-stat-achievements/20 rounded-full animate-wiggle"></div>
        </div>

        <div className="relative container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="animate-fade-in-up">
              <div className="flex items-center justify-center gap-6 mb-6">
                <UniversalAvatar
                  avatarUrl={userProfile?.avatar_url}
                  userName={userProfile?.full_name}
                  size="xl"
                  className="border-4 border-white/30 shadow-2xl"
                />
                <div className="text-center">
                  <h1 className="text-4xl md:text-6xl font-bold mb-2">
                    أهلاً بك، {userProfile?.full_name}! 
                    <span className="inline-block ml-3 animate-wiggle">👋</span>
                  </h1>
                  <div className="glass-surface text-on-gradient rounded-full px-4 py-2 mb-2">
                    <UserTitleBadge
                      role={userProfile?.role || 'student'}
                      displayTitle={userProfile?.display_title}
                      points={userProfile?.points}
                      level={userProfile?.level}
                      size="lg"
                      variant="secondary"
                    />
                  </div>
                </div>
              </div>
              <p className="text-xl md:text-2xl opacity-90 font-medium text-center">
                {todayMessage}
              </p>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 animate-fade-in-up animation-delay-200">
              <Card className="glass-surface text-on-gradient">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-stat-points/20 rounded-full flex items-center justify-center">
                    <Star className="w-6 h-6 text-stat-points" />
                  </div>
                  <div className="text-2xl font-bold text-center">{stats.total_points}</div>
                  <div className="text-sm opacity-80 text-center">نقطة إجمالية</div>
                </CardContent>
              </Card>

              <Card className="glass-surface text-on-gradient">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-stat-progress/20 rounded-full flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-stat-progress" />
                  </div>
                  <div className="text-2xl font-bold text-center">{stats.achievements_count}</div>
                  <div className="text-sm opacity-80 text-center">إنجاز</div>
                </CardContent>
              </Card>

              <Card className="glass-surface text-on-gradient">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-stat-videos/20 rounded-full flex items-center justify-center">
                    <Play className="w-6 h-6 text-stat-videos" />
                  </div>
                  <div className="text-2xl font-bold text-center">{stats.completed_videos}</div>
                  <div className="text-sm opacity-80 text-center">فيديو مكتمل</div>
                </CardContent>
              </Card>

              <Card className="glass-surface text-on-gradient">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-secondary/20 rounded-full flex items-center justify-center">
                    <Zap className="w-6 h-6 text-secondary" />
                  </div>
                  <div className="text-2xl font-bold text-center">{stats.current_streak}</div>
                  <div className="text-sm opacity-80 text-center">يوم متتالي</div>
                </CardContent>
              </Card>
            </div>

            {/* Overall Progress */}
            <div className="glass-surface rounded-xl p-6 mt-8 animate-fade-in-up animation-delay-400">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-stat-progress rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-on-gradient">التقدم الإجمالي</h3>
                    <p className="text-sm opacity-80 text-on-gradient">في جميع المواد</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-on-gradient">{getProgressPercentage()}%</div>
                  <div className="text-sm opacity-80 text-on-gradient">مكتمل</div>
                </div>
              </div>
              <Progress 
                value={getProgressPercentage()} 
                className="h-3 bg-muted/30"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex justify-center px-4">
            <TabsList className={`grid w-full max-w-4xl ${hasGamesTab ? 'grid-cols-5' : 'grid-cols-4'} tabs-elevated rounded-2xl p-2 h-16`}>
              <TabsTrigger value="overview" className="flex items-center justify-center gap-3 text-base font-semibold py-3 px-4 rounded-xl transition-all duration-300 hover:scale-105">
                <span className="text-center">نظرة عامة</span>
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center gap-3 text-base font-semibold py-3 px-4 rounded-xl transition-all duration-300 hover:scale-105">
                <Video className="w-6 h-6" />
                <span className="hidden sm:inline">المحتوى</span>
              </TabsTrigger>
              {hasGamesTab && (
                <TabsTrigger value="games" className="flex items-center gap-3 text-base font-semibold py-3 px-4 rounded-xl transition-all duration-300 hover:scale-105">
                  <Gamepad2 className="w-6 h-6" />
                  <span className="hidden sm:inline">الألعاب</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="challenges" className="flex items-center gap-3 text-base font-semibold py-3 px-4 rounded-xl transition-all duration-300 hover:scale-105">
                <Target className="w-6 h-6" />
                <span className="hidden sm:inline">التحديات</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-3 text-base font-semibold py-3 px-4 rounded-xl transition-all duration-300 hover:scale-105">
                <Award className="w-6 h-6" />
                <span className="hidden sm:inline">الملف الشخصي</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Stats Section */}
              <div className="lg:col-span-2">
                <StudentStats />
              </div>

              {/* Quick Actions */}
              <div className="space-y-4">
                <Card className="gradient-hero text-on-gradient">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Rocket className="w-5 h-5" />
                      إجراءات سريعة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      variant="secondary" 
                      className="w-full justify-start glass-surface hover:bg-primary/20"
                      onClick={() => setActiveTab('content')}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      متابعة التعلم
                    </Button>
                    {hasGamesTab && (
                      <Button 
                        variant="secondary" 
                        className="w-full justify-start glass-surface hover:bg-primary/20"
                        onClick={() => setActiveTab('games')}
                      >
                        <Gamepad2 className="w-4 h-4 mr-2" />
                        العب وتعلم
                      </Button>
                    )}
                    <Button 
                      variant="secondary" 
                      className="w-full justify-start glass-surface hover:bg-primary/20"
                      onClick={() => setActiveTab('challenges')}
                    >
                      <Target className="w-4 h-4 mr-2" />
                      تحديات اليوم
                    </Button>
                  </CardContent>
                </Card>

                {/* Student Notifications */}
                <StudentNotifications />

                {/* Assigned Grade Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FolderOpen className="w-5 h-5" />
                      صفك الدراسي
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-center p-4 gradient-hero text-on-gradient rounded-lg">
                      <h3 className="text-xl font-bold">الصف {assignedGrade}</h3>
                      <p className="text-sm opacity-90">صفك المخصص</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="content">
            <StudentGradeContent />
          </TabsContent>

          {hasGamesTab && (
            <TabsContent value="games">
              <StudentGameSection />
            </TabsContent>
          )}

          <TabsContent value="challenges">
            <StudentDailyChallenges />
          </TabsContent>

          <TabsContent value="profile">
            <StudentProfile />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
};

export default StudentDashboard;