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
  BookOpen, 
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
import AppFooter from '@/components/shared/AppFooter';
import { UniversalAvatar } from '@/components/shared/UniversalAvatar';
import { UserTitleBadge } from '@/components/shared/UserTitleBadge';

const StudentDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const { stats, achievements, loading } = useStudentProgress();
  const { assignedGrade, getProgressPercentage } = useStudentContent();
  const [activeTab, setActiveTab] = useState('overview');

  const motivationalMessages = [
    'مرحباً بك في رحلة التعلم الرائعة! 🌟',
    'كل خطوة تقربك من هدفك! 🎯',
    'أنت تتقدم بشكل ممتاز! 🚀',
    'استمر في التميز! ⭐',
    'المعرفة قوة والتعلم مغامرة! 📚'
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
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full animate-float"></div>
          <div className="absolute top-20 -left-20 w-60 h-60 bg-yellow-400/20 rounded-full animate-bounce-slow"></div>
          <div className="absolute bottom-10 right-1/3 w-32 h-32 bg-pink-400/20 rounded-full animate-wiggle"></div>
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
                  <div className="bg-white/20 text-white border border-white/20 rounded-full px-4 py-2 mb-2">
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
              <p className="text-xl md:text-2xl opacity-90 font-medium">
                {todayMessage}
              </p>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 animate-fade-in-up animation-delay-200">
              <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-yellow-400/20 rounded-full flex items-center justify-center">
                    <Star className="w-6 h-6 text-yellow-300" />
                  </div>
                  <div className="text-2xl font-bold">{stats.total_points}</div>
                  <div className="text-sm opacity-80">نقطة إجمالية</div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-green-400/20 rounded-full flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-green-300" />
                  </div>
                  <div className="text-2xl font-bold">{stats.achievements_count}</div>
                  <div className="text-sm opacity-80">إنجاز</div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-blue-400/20 rounded-full flex items-center justify-center">
                    <Play className="w-6 h-6 text-blue-300" />
                  </div>
                  <div className="text-2xl font-bold">{stats.completed_videos}</div>
                  <div className="text-sm opacity-80">فيديو مكتمل</div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-orange-400/20 rounded-full flex items-center justify-center">
                    <Zap className="w-6 h-6 text-orange-300" />
                  </div>
                  <div className="text-2xl font-bold">{stats.current_streak}</div>
                  <div className="text-sm opacity-80">يوم متتالي</div>
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-2xl grid-cols-5 bg-white shadow-lg">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">نظرة عامة</span>
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                <span className="hidden sm:inline">المحتوى</span>
              </TabsTrigger>
              <TabsTrigger value="games" className="flex items-center gap-2">
                <Gamepad2 className="w-4 h-4" />
                <span className="hidden sm:inline">الألعاب</span>
              </TabsTrigger>
              <TabsTrigger value="challenges" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span className="hidden sm:inline">التحديات</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <Award className="w-4 h-4" />
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
                <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Rocket className="w-5 h-5" />
                      إجراءات سريعة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      variant="secondary" 
                      className="w-full justify-start bg-white/20 hover:bg-white/30 text-white border-white/20"
                      onClick={() => setActiveTab('content')}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      متابعة التعلم
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="w-full justify-start bg-white/20 hover:bg-white/30 text-white border-white/20"
                      onClick={() => setActiveTab('games')}
                    >
                      <Gamepad2 className="w-4 h-4 mr-2" />
                      العب وتعلم
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="w-full justify-start bg-white/20 hover:bg-white/30 text-white border-white/20"
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
                    <div className="text-center p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg">
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

          <TabsContent value="games">
            <StudentGameSection />
          </TabsContent>

          <TabsContent value="challenges">
            <StudentDailyChallenges />
          </TabsContent>

          <TabsContent value="profile">
            <StudentProfile />
          </TabsContent>
        </Tabs>
      </section>

      <AppFooter />
    </div>
  );
};

export default StudentDashboard;