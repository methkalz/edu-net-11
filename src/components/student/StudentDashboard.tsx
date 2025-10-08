import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStudentProgress } from '@/hooks/useStudentProgress';
import { useStudentContent } from '@/hooks/useStudentContent';
import { useBadgeProgress } from '@/hooks/useBadgeProgress';
import { BadgeCelebration } from '@/components/badges/BadgeCelebration';
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
import { StudentExamsWidget } from './StudentExamsWidget';
import { SchoolCalendarWidget } from '@/components/calendar/SchoolCalendarWidget';
import { UniversalAvatar } from '@/components/shared/UniversalAvatar';
import { UserTitleBadge } from '@/components/shared/UserTitleBadge';
import { useStudentTeacher } from '@/hooks/useStudentTeacher';
import { useStudentGameStats } from '@/hooks/useStudentGameStats';

const StudentDashboard: React.FC = () => {
  const { user, userProfile } = useAuth();
  const { stats, achievements, loading, refetch: refetchProgress } = useStudentProgress();
  const { assignedGrade, getProgressPercentage, refetch: refetchContent } = useStudentContent();
  const { teacher, loading: teacherLoading } = useStudentTeacher();
  const { refetch: refetchGameStats } = useStudentGameStats();
  const [activeTab, setActiveTab] = useState('overview');
  
  // نظام تتبع الأوسمة والاحتفال
  const { 
    currentBadge, 
    showCelebration, 
    celebrationBadge, 
    closeCelebration
  } = useBadgeProgress(stats.total_points);
  
  // تحديث البيانات عند الضغط على تاب نظرة عامة
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'overview') {
      refetchProgress();
      refetchContent();
      refetchGameStats();
    }
  };
  
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-lg font-medium text-muted-foreground">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" dir="rtl">
      {/* Badge Celebration Modal */}
      {showCelebration && celebrationBadge && (
        <BadgeCelebration
          badge={celebrationBadge}
          studentName={userProfile?.full_name}
          onClose={closeCelebration}
        />
      )}
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full animate-float"></div>
          <div className="absolute top-20 -left-20 w-60 h-60 bg-yellow-400/20 rounded-full animate-bounce-slow"></div>
          <div className="absolute bottom-10 right-1/3 w-32 h-32 bg-pink-400/20 rounded-full animate-wiggle"></div>
          
          {/* Floating Badge Shape */}
          <div className="absolute top-10 left-20 opacity-15 animate-float">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 shadow-xl"></div>
          </div>
        </div>

        <div className="relative container mx-auto px-6 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="animate-fade-in-up">
              {/* Main Welcome Section */}
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-6xl font-bold mb-6">
                  أهلاً بك، {userProfile?.full_name}! 
                  <span className="inline-block ml-3 animate-wiggle">👋</span>
                </h1>

                <p className="text-xl md:text-2xl opacity-90 font-medium">
                  {todayMessage}
                </p>
              </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 animate-fade-in-up animation-delay-200">
              <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-yellow-400/20 rounded-full flex items-center justify-center">
                    <Star className="w-6 h-6 text-yellow-300" />
                  </div>
                  <div className="text-3xl font-bold text-center mb-1">{stats.total_points}</div>
                  <div className="text-sm opacity-90 text-center font-medium">نقطة</div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur border-white/20 text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 bg-gradient-to-r from-red-700 via-red-800 to-red-900 text-white px-16 py-1.5 text-xs font-bold whitespace-nowrap transform -rotate-[55deg] -translate-x-[4.25rem] translate-y-7 shadow-lg z-10">
                  <span className="inline-block -translate-x-2">
                    {currentBadge?.title || userProfile?.display_title || 'طالب جديد'}
                  </span>
                </div>
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <UserTitleBadge 
                    role={userProfile?.role || 'student'}
                    displayTitle={userProfile?.display_title}
                    points={stats.total_points}
                    showIcon={false}
                    size="lg"
                  />
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-blue-400/20 rounded-full flex items-center justify-center">
                    <Play className="w-6 h-6 text-blue-300" />
                  </div>
                  <div className="text-2xl font-bold text-center">{stats.completed_videos}</div>
                  <div className="text-sm opacity-80 text-center">فيديو مكتمل</div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-orange-400/20 rounded-full flex items-center justify-center">
                    <Zap className="w-6 h-6 text-orange-300" />
                  </div>
                  <div className="text-2xl font-bold text-center">{stats.current_streak}</div>
                  <div className="text-sm opacity-80 text-center">يوم متتالي</div>
                </CardContent>
              </Card>
            </div>

            {/* Overall Progress */}
            <div className="bg-white/10 backdrop-blur rounded-xl p-6 mt-8 animate-fade-in-up animation-delay-400">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">التقدم الإجمالي</h3>
                    <p className="text-sm opacity-80">في جميع المواد</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{getProgressPercentage()}%</div>
                  <div className="text-sm opacity-80">مكتمل</div>
                </div>
              </div>
              <Progress 
                value={getProgressPercentage()} 
                className="h-3 bg-white/20"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <div className="flex justify-center px-4">
            <TabsList className={`grid w-full max-w-4xl ${hasGamesTab ? 'grid-cols-4' : 'grid-cols-3'} bg-white/95 backdrop-blur-sm shadow-xl border border-white/20 rounded-2xl p-2 h-16`}>
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
              <TabsTrigger value="profile" className="flex items-center gap-3 text-base font-semibold py-3 px-4 rounded-xl transition-all duration-300 hover:scale-105">
                <Award className="w-6 h-6" />
                <span className="hidden sm:inline">الملف الشخصي</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Stats Section */}
              <div className="lg:col-span-2 space-y-6">
                <StudentStats />
              </div>

              {/* Quick Actions */}
              <div className="space-y-4">
                <Card className="border-border/40 bg-gradient-to-br from-violet-50/50 via-background to-purple-50/30 dark:from-violet-950/20 dark:via-background dark:to-purple-950/10 shadow-sm hover:shadow-md transition-all duration-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 flex items-center justify-center">
                        <Rocket className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      </div>
                      <span className="bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">إجراءات سريعة</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start h-11 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-cyan-50/50 dark:hover:from-blue-950/30 dark:hover:to-cyan-950/30 hover:text-blue-700 dark:hover:text-blue-400 transition-all group"
                      onClick={() => setActiveTab('content')}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center mr-3 group-hover:from-blue-500/20 group-hover:to-cyan-500/20 transition-all">
                        <Play className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="font-medium">متابعة التعلم</span>
                    </Button>
                    {hasGamesTab && (
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start h-11 hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50 dark:hover:from-emerald-950/30 dark:hover:to-teal-950/30 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all group"
                        onClick={() => setActiveTab('games')}
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center mr-3 group-hover:from-emerald-500/20 group-hover:to-teal-500/20 transition-all">
                          <Gamepad2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="font-medium">العب وتعلم</span>
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Electronic Exams Widget */}
                <StudentExamsWidget />

                {/* Student Notifications */}
                <StudentNotifications />

                {/* Assigned Grade Info */}
                <Card className="border-border/40 bg-gradient-to-br from-sky-50/50 via-background to-indigo-50/30 dark:from-sky-950/20 dark:via-background dark:to-indigo-950/10 shadow-sm hover:shadow-md transition-all duration-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500/10 to-indigo-500/10 flex items-center justify-center">
                        <FolderOpen className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      </div>
                      <span className="bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-400 dark:to-indigo-400 bg-clip-text text-transparent">صفك الدراسي</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-indigo-100/50 via-purple-50/30 to-pink-100/50 dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-pink-950/30 border border-indigo-200/50 dark:border-indigo-800/30">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-2xl" />
                      <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent relative">الصف {assignedGrade}</h3>
                    </div>
                    
                    {userProfile?.schools?.name && (
                      <div className="p-3 rounded-xl bg-gradient-to-br from-teal-50/50 to-emerald-50/50 dark:from-teal-950/20 dark:to-emerald-950/20 border border-teal-200/50 dark:border-teal-800/30">
                        <p className="text-xs font-medium text-teal-600 dark:text-teal-400 mb-1">المدرسة</p>
                        <p className="font-semibold text-foreground">{userProfile.schools.name}</p>
                      </div>
                    )}
                    
                    {teacherLoading ? (
                      <div className="text-center p-3 rounded-xl bg-muted/20">
                        <p className="text-sm text-muted-foreground">جاري التحميل...</p>
                      </div>
                    ) : teacher ? (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-rose-50/50 to-pink-50/50 dark:from-rose-950/20 dark:to-pink-950/20 border border-rose-200/50 dark:border-rose-800/30 hover:border-rose-300/50 dark:hover:border-rose-700/30 transition-colors">
                        <UniversalAvatar
                          avatarUrl={teacher.avatar_url}
                          userName={teacher.full_name}
                          size="md"
                          className="ring-2 ring-rose-200/50 dark:ring-rose-800/30"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-rose-600 dark:text-rose-400">معلم الموضوع</p>
                          <p className="font-semibold text-foreground truncate">{teacher.full_name}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-3 rounded-xl bg-muted/20">
                        <p className="text-sm text-muted-foreground">لم يتم تعيين معلم</p>
                      </div>
                    )}
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

          <TabsContent value="profile">
            <StudentProfile />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
};

export default StudentDashboard;