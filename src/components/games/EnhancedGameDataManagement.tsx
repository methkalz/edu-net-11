import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, RefreshCw, Gamepad2, BarChart3, Settings, Database, Shield, Activity, Users, TrendingUp, Award, Zap } from 'lucide-react';
// Clear import cache and re-import modules
import { useGameDataManagement } from '@/hooks/useGameDataManagement';
import { GameSystemHealthMonitor } from './GameSystemHealthMonitor';
import { GameSelector } from './GameSelector';
import { GameStatsCard } from './GameStatsCard';
import { GameActionsPanel } from './GameActionsPanel';

// Import shared components using project alias
import AppHeader from '@/components/shared/AppHeader';
import AppFooter from '@/components/shared/AppFooter';
interface Game {
  id: string;
  name: string;
  grade_level: string;
  subject: string;
  is_active: boolean;
  description?: string;
}
interface GameDataStats {
  totalUsers: number;
  totalProgress: number;
  totalGames: number;
  totalSessions: number;
  totalResults: number;
  activeUsers?: number;
  completionRate?: number;
  averageScore?: number;
  gamesAvailable?: number;
  playersThisWeek?: number;
}
const EnhancedGameDataManagement = () => {
  const {
    userProfile
  } = useAuth();
  const {
    getGameDataStats,
    resetUserGameData,
    resetAllGameData,
    resetLessonData,
    loading,
    error,
    clearError
  } = useGameDataManagement();
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [stats, setStats] = useState<GameDataStats>({
    totalUsers: 0,
    totalProgress: 0,
    totalGames: 0,
    totalSessions: 0,
    totalResults: 0,
    activeUsers: 0,
    completionRate: 0,
    averageScore: 0,
    gamesAvailable: 0,
    playersThisWeek: 0
  });
  const [retryCount, setRetryCount] = useState(0);

  // تحميل الإحصائيات
  const loadStats = useCallback(async (gameId?: string) => {
    const data = await getGameDataStats(gameId);
    if (data) {
      setStats(data);
      setRetryCount(0);
    }
  }, [getGameDataStats]);

  // تحميل الإحصائيات عند تغيير اللعبة المختارة
  useEffect(() => {
    if (userProfile?.role === 'superadmin') {
      loadStats(selectedGame?.id);
    }
  }, [userProfile?.role, selectedGame?.id, loadStats]);

  // التحقق من صلاحيات السوبر آدمن
  if (userProfile?.role !== 'superadmin') {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            عذراً، هذه الصفحة متاحة فقط لمدراء النظام العامين.
          </AlertDescription>
        </Alert>
      </div>;
  }
  const handleGameSelect = (game: Game | null) => {
    setSelectedGame(game);
  };
  const handleResetUserData = async (gameId: string | null, userId: string) => {
    await resetUserGameData(gameId, userId);
    await loadStats(selectedGame?.id);
  };
  const handleResetLessonData = async (gameId: string | null, lessonId: string) => {
    await resetLessonData(gameId, lessonId);
    await loadStats(selectedGame?.id);
  };
  const handleResetGameData = async (gameId: string | null) => {
    await resetAllGameData(gameId);
    await loadStats(selectedGame?.id);
  };
  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    clearError();
    await loadStats(selectedGame?.id);
  };
  return <div className="min-h-screen creative-background" dir="rtl">
      <AppHeader title="إدارة بيانات الألعاب" showBackButton={true} backPath="/dashboard" showLogout={true} />
      
      <div className="relative overflow-hidden">
        {/* Advanced Background Effects */}
        <div className="light-orbs"></div>
        <div className="feature-icons"></div>
        
        {/* Navigation Breadcrumbs */}
        <div className="relative z-10 border-b border-border/40 bg-background/50 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-3">
            <nav className="flex items-center space-x-2 text-sm text-muted-foreground" dir="ltr">
              <span className="text-primary">لوحة التحكم</span>
              <span>/</span>
              <span className="text-primary">إدارة النظام</span>
              <span>/</span>
              <span className="text-foreground font-medium">إدارة بيانات الألعاب</span>
            </nav>
          </div>
        </div>
        
        <div className="relative z-10 container mx-auto px-6 py-8 space-y-8">
          {/* Professional Header Section */}
          <div className="text-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-accent shadow-primary mb-6 animate-float">
              <Gamepad2 className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold">
                
              </h1>
              <div className="flex items-center justify-center gap-3 text-lg">
                <div className="flex items-center gap-2 text-primary font-medium">
                  <Database className="w-5 h-5" />
                  <span>نظام متقدم</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-accent"></div>
                <div className="flex items-center gap-2 text-secondary font-medium">
                  <Shield className="w-5 h-5" />
                  <span>آمن ومضمون</span>
                </div>
              </div>
              <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                منصة شاملة لإدارة وتحليل بيانات الألعاب التعليمية مع أدوات التحكم المتقدمة والمراقبة المستمرة
              </p>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-center gap-4 p-4 glass-card rounded-2xl border border-primary/10 animate-fade-in">
            <Button variant="outline" size="sm" onClick={() => loadStats(selectedGame?.id)} disabled={loading} className="bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 border-primary/20">
              <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
              تحديث سريع
            </Button>
            <div className="h-6 w-px bg-border"></div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4 text-green-500" />
              <span className="font-medium">النظام نشط</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="font-medium">{stats.totalUsers} مستخدم</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Gamepad2 className="h-4 w-4 text-purple-500" />
              <span className="font-medium">{stats.totalSessions} جلسة</span>
            </div>
          </div>

          {/* Enhanced System Health & Game Selector */}
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <GameSystemHealthMonitor />
            </div>
            <div className="lg:col-span-1">
              <GameSelector selectedGame={selectedGame} onGameSelect={handleGameSelect} />
            </div>
          </div>

          {/* Professional Error Display */}
          {error && <Alert className="glass-card border-destructive/30 bg-gradient-to-r from-destructive/5 to-red-500/5 animate-fade-in shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive animate-pulse" />
                </div>
                <AlertDescription className="flex-1 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-destructive">تنبيه خطأ:</span>
                    <p className="text-foreground mt-1">{error}</p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm" onClick={handleRetry} className="bg-destructive/5 border-destructive/20 hover:bg-destructive/10">
                      <RefreshCw className="h-4 w-4 ml-1" />
                      إعادة ({retryCount})
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearError} className="hover:bg-destructive/5">
                      إغلاق
                    </Button>
                  </div>
                </AlertDescription>
              </div>
            </Alert>}

          {/* Advanced Tab Navigation */}
          <Tabs defaultValue="stats" className="space-y-8 animate-fade-in">
            <div className="flex justify-center">
              <TabsList className="glass-card p-2 bg-background/80 backdrop-blur-md border border-primary/10 rounded-2xl shadow-lg">
                <TabsTrigger value="stats" className="flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white data-[state=active]:shadow-primary">
                  <BarChart3 className="h-4 w-4" />
                  <span className="font-medium">الإحصائيات</span>
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-electric">
                  <Settings className="h-4 w-4" />
                  <span className="font-medium">المستخدمين</span>
                </TabsTrigger>
                <TabsTrigger value="lessons" className="flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-neon">
                  <Database className="h-4 w-4" />
                  <span className="font-medium">الدروس</span>
                </TabsTrigger>
                <TabsTrigger value="reset" className="flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-destructive data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-fire">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">التصفير</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Professional Statistics Dashboard */}
            <TabsContent value="stats" className="animate-fade-in">
              <div className="space-y-6">
                {selectedGame ? <div className="space-y-6">
                    {/* Game Info Header */}
                    <Card className="glass-card border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-primary/10">
                              <BarChart3 className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h2 className="text-xl font-bold text-gradient bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                إحصائيات {selectedGame.name}
                              </h2>
                              <p className="text-muted-foreground">
                                تحليل شامل لبيانات اللعبة - صف {selectedGame.grade_level}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-gradient-to-r from-primary to-accent text-white px-4 py-2">
                            {selectedGame.subject}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <GameStatsCard game={selectedGame} stats={stats} loading={loading} />
                  </div> : <div className="space-y-6">
                    {/* Overview Alert */}
                    <Alert className="glass-card bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20 shadow-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-primary/10">
                          <Gamepad2 className="h-6 w-6 text-primary" />
                        </div>
                        <AlertDescription className="flex-1">
                          <h3 className="font-semibold text-primary mb-2">عرض شامل للنظام</h3>
                          <p className="text-muted-foreground">
                            يتم عرض إحصائيات جميع الألعاب مجمعة. اختر لعبة محددة من الشريط الجانبي لعرض إحصائيات مفصلة وتحليلات متقدمة.
                          </p>
                        </AlertDescription>
                      </div>
                    </Alert>
                    
                    {/* Enhanced Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                      <Card className="glass-card bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 hover:shadow-primary transition-all duration-300 group">
                        <CardContent className="p-6 text-center">
                          <div className="mb-4">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                              <Users className="h-6 w-6 text-primary" />
                            </div>
                          </div>
                          <div className="text-3xl font-bold text-gradient bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
                            {stats.totalUsers}
                          </div>
                          <p className="text-sm text-muted-foreground font-medium">إجمالي المستخدمين</p>
                          <div className="w-full bg-primary/10 rounded-full h-2 mt-4">
                            <div className="bg-gradient-to-r from-primary to-primary/70 h-2 rounded-full transition-all duration-1000" style={{
                          width: '85%'
                        }}></div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="glass-card bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent border-green-500/20 hover:shadow-neon transition-all duration-300 group">
                        <CardContent className="p-6 text-center">
                          <div className="mb-4">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                              <TrendingUp className="h-6 w-6 text-green-500" />
                            </div>
                          </div>
                          <div className="text-3xl font-bold text-gradient bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent mb-2">
                            {stats.totalProgress}
                          </div>
                          <p className="text-sm text-muted-foreground font-medium">سجلات التقدم</p>
                          <div className="w-full bg-green-500/10 rounded-full h-2 mt-4">
                            <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-1000" style={{
                          width: '72%'
                        }}></div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="glass-card bg-gradient-to-br from-yellow-500/10 via-yellow-500/5 to-transparent border-yellow-500/20 hover:shadow-cyber transition-all duration-300 group">
                        <CardContent className="p-6 text-center">
                          <div className="mb-4">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500/10 group-hover:bg-yellow-500/20 transition-colors">
                              <Award className="h-6 w-6 text-yellow-500" />
                            </div>
                          </div>
                          <div className="text-3xl font-bold text-gradient bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent mb-2">
                            {stats.totalGames}
                          </div>
                          <p className="text-sm text-muted-foreground font-medium">ألعاب المطابقة</p>
                          <div className="w-full bg-yellow-500/10 rounded-full h-2 mt-4">
                            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-1000" style={{
                          width: '91%'
                        }}></div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="glass-card bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/20 hover:shadow-electric transition-all duration-300 group">
                        <CardContent className="p-6 text-center">
                          <div className="mb-4">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                              <Zap className="h-6 w-6 text-blue-500" />
                            </div>
                          </div>
          <div className="text-3xl font-bold text-gradient bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent mb-2">
            {stats.totalSessions}
          </div>
          <p className="text-sm text-muted-foreground font-medium">جلسات الألعاب</p>
                          <div className="w-full bg-blue-500/10 rounded-full h-2 mt-4">
                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-1000" style={{
                          width: '67%'
                        }}></div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>}
              </div>
            </TabsContent>

          {/* Users Management Tab */}
          <TabsContent value="users">
            <GameActionsPanel game={selectedGame} onResetUserData={handleResetUserData} onResetLessonData={() => Promise.resolve()} onResetGameData={() => Promise.resolve()} loading={loading} />
          </TabsContent>

          {/* Lessons Management Tab */}
          <TabsContent value="lessons">
            <GameActionsPanel game={selectedGame} onResetUserData={() => Promise.resolve()} onResetLessonData={handleResetLessonData} onResetGameData={() => Promise.resolve()} loading={loading} />
          </TabsContent>

          {/* Global Reset Tab */}
          <TabsContent value="reset">
            <GameActionsPanel game={selectedGame} onResetUserData={() => Promise.resolve()} onResetLessonData={() => Promise.resolve()} onResetGameData={handleResetGameData} loading={loading} />
          </TabsContent>
        </Tabs>

          {/* Professional Action Button */}
          <div className="text-center py-6">
            <div className="inline-flex items-center gap-4 p-4 glass-card rounded-2xl border border-primary/10 bg-gradient-to-r from-background/80 to-primary/5">
              <Button variant="default" onClick={() => loadStats(selectedGame?.id)} disabled={loading} size="lg" className="bg-gradient-to-r from-primary via-primary/90 to-accent hover:from-primary/90 hover:via-primary/80 hover:to-accent/90 text-white shadow-primary transition-all duration-300 px-8 py-3 rounded-xl">
                <RefreshCw className={`h-5 w-5 ml-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'جاري التحديث...' : 'تحديث البيانات'}
              </Button>
              
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>متصل</span>
                </div>
                <div className="h-4 w-px bg-border"></div>
                <span>آخر تحديث: {new Date().toLocaleTimeString('en-US')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <AppFooter />
    </div>;
};
export default EnhancedGameDataManagement;