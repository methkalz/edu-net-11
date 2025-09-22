import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trash2, 
  Search, 
  AlertTriangle, 
  Users, 
  Trophy, 
  BarChart3,
  RefreshCw,
  Shield,
  Clock,
  Database,
  Star
} from 'lucide-react';
import { useGameDataManagement } from '@/hooks/useGameDataManagement';
import { toast } from '@/hooks/use-toast';
import { GameSystemHealthMonitor } from './GameSystemHealthMonitor';

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

const GameDataManagement = () => {
  const { userProfile } = useAuth();
  const { 
    getGameDataStats, 
    resetUserGameData, 
    resetAllGameData,
    resetLessonData,
    loading,
    error,
    clearError
  } = useGameDataManagement();

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

  const [searchUserId, setSearchUserId] = useState('');
  const [searchLessonId, setSearchLessonId] = useState('');
  const [confirmationStep, setConfirmationStep] = useState<'none' | 'user' | 'lesson' | 'all'>('none');
  const [actionType, setActionType] = useState<'user' | 'lesson' | 'all' | ''>('');
  const [retryCount, setRetryCount] = useState(0);

  // تحميل الإحصائيات
  const loadStats = useCallback(async () => {
    const data = await getGameDataStats();
    if (data) {
      setStats(data);
      setRetryCount(0); // إعادة تعيين عدد المحاولات عند النجاح
    }
  }, [getGameDataStats]);

  // تحميل الإحصائيات عند بدء التشغيل
  useEffect(() => {
    if (userProfile?.role === 'superadmin') {
      loadStats();
    }
  }, [userProfile?.role, loadStats]);

  // التحقق من صلاحيات السوبر آدمن
  if (userProfile?.role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            عذراً، هذه الصفحة متاحة فقط لمدراء النظام العامين.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleResetUserData = async () => {
    if (!searchUserId.trim()) {
      toast({
        title: 'تحذير',
        description: 'يرجى إدخال معرف المستخدم',
        variant: 'destructive'
      });
      return;
    }

    if (confirmationStep !== 'user') {
      setActionType('user');
      setConfirmationStep('user');
      return;
    }

    const success = await resetUserGameData(null, searchUserId.trim());
    if (success) {
      setSearchUserId('');
      setConfirmationStep('none');
      await loadStats();
    }
  };

  const handleResetLessonData = async () => {
    if (!searchLessonId.trim()) {
      toast({
        title: 'تحذير',
        description: 'يرجى إدخال معرف الدرس',
        variant: 'destructive'
      });
      return;
    }

    if (confirmationStep !== 'lesson') {
      setActionType('lesson');
      setConfirmationStep('lesson');
      return;
    }

    const success = await resetLessonData(null, searchLessonId.trim());
    if (success) {
      setSearchLessonId('');
      setConfirmationStep('none');
      await loadStats();
    }
  };

  const handleResetAllData = async () => {
    if (confirmationStep !== 'all') {
      setActionType('all');
      setConfirmationStep('all');
      return;
    }

    const success = await resetAllGameData(null);
    if (success) {
      setConfirmationStep('none');
      await loadStats();
    }
  };

  const cancelConfirmation = () => {
    setConfirmationStep('none');
    setActionType('');
    clearError();
  };

  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    clearError();
    await loadStats();
  };

  return (
    <div className="min-h-screen bg-background pattern-dots p-6" dir="rtl">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gradient">
            🎮 إدارة بيانات الألعاب
          </h1>
          <p className="text-muted-foreground">
            أدوات إدارة وتصفير بيانات المستخدمين في الألعاب التعليمية
          </p>
        </div>

        {/* System Health Monitor */}
        <GameSystemHealthMonitor />

        {/* Error Display */}
        {error && (
          <Alert className="border-destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex justify-between items-center">
              <span>حدث خطأ: {error}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleRetry}>
                  إعادة المحاولة ({retryCount > 0 ? `${retryCount}` : '0'})
                </Button>
                <Button variant="ghost" size="sm" onClick={clearError}>
                  إغلاق
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards - Main */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card border-blue-200">
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
              <p className="text-sm text-muted-foreground font-medium">إجمالي اللاعبين</p>
              <p className="text-xs text-blue-600">مسجلين في النظام</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-green-200">
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{stats.totalProgress}</div>
              <p className="text-sm text-muted-foreground font-medium">سجلات التقدم</p>
              <p className="text-xs text-green-600">تقدم اللاعبين</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-purple-200">
            <CardContent className="p-4 text-center">
              <Trophy className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">{stats.totalGames}</div>
              <p className="text-sm text-muted-foreground font-medium">ألعاب المطابقة</p>
              <p className="text-xs text-purple-600">متاحة للعب</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-orange-200">
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-600">{stats.totalSessions}</div>
              <p className="text-sm text-muted-foreground font-medium">جلسات اللعب</p>
              <p className="text-xs text-orange-600">جلسات مكتملة</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card border-cyan-200">
            <CardContent className="p-4 text-center">
              <Database className="h-8 w-8 text-cyan-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-cyan-600">{stats.totalResults}</div>
              <p className="text-sm text-muted-foreground font-medium">النتائج المسجلة</p>
              <p className="text-xs text-cyan-600">نتائج الجلسات</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-emerald-200">
            <CardContent className="p-4 text-center">
              <RefreshCw className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-emerald-600">{stats.activeUsers || 0}</div>
              <p className="text-sm text-muted-foreground font-medium">نشط اليوم</p>
              <p className="text-xs text-emerald-600">آخر 24 ساعة</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-rose-200">
            <CardContent className="p-4 text-center">
              <Star className="h-8 w-8 text-rose-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-rose-600">{stats.completionRate || 0}%</div>
              <p className="text-sm text-muted-foreground font-medium">معدل الإكمال</p>
              <p className="text-xs text-rose-600">الأسبوع الماضي</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-violet-200">
            <CardContent className="p-4 text-center">
              <Shield className="h-8 w-8 text-violet-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-violet-600">{stats.averageScore || 0}%</div>
              <p className="text-sm text-muted-foreground font-medium">متوسط النقاط</p>
              <p className="text-xs text-violet-600">الأداء العام</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="user" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="user">تصفير مستخدم واحد</TabsTrigger>
            <TabsTrigger value="lesson">تصفير درس محدد</TabsTrigger>
            <TabsTrigger value="all">تصفير جميع البيانات</TabsTrigger>
          </TabsList>

          {/* Reset User Data */}
          <TabsContent value="user">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  تصفير بيانات مستخدم واحد
                </CardTitle>
                <CardDescription>
                  سيتم حذف جميع بيانات الألعاب الخاصة بالمستخدم المحدد
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userId">معرف المستخدم (User ID)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="userId"
                      placeholder="أدخل معرف المستخدم..."
                      value={searchUserId}
                      onChange={(e) => setSearchUserId(e.target.value)}
                      disabled={loading}
                    />
                    <Button 
                      onClick={handleResetUserData}
                      disabled={loading || !searchUserId.trim()}
                      variant={confirmationStep === 'user' ? 'destructive' : 'default'}
                    >
                      <Search className="h-4 w-4 ml-1" />
                      {confirmationStep === 'user' ? 'تأكيد التصفير' : 'تصفير البيانات'}
                    </Button>
                  </div>
                </div>
                
                {confirmationStep === 'user' && (
                  <Alert className="border-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="flex justify-between items-center">
                      <span>هل أنت متأكد من تصفير بيانات هذا المستخدم؟ هذا الإجراء لا يمكن التراجع عنه.</span>
                      <Button variant="outline" size="sm" onClick={cancelConfirmation}>
                        إلغاء
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reset Lesson Data */}
          <TabsContent value="lesson">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  تصفير بيانات درس محدد
                </CardTitle>
                <CardDescription>
                  سيتم حذف جميع بيانات التقدم والإنجازات المرتبطة بالدرس المحدد
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lessonId">معرف الدرس (Lesson ID)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="lessonId"
                      placeholder="أدخل معرف الدرس..."
                      value={searchLessonId}
                      onChange={(e) => setSearchLessonId(e.target.value)}
                      disabled={loading}
                    />
                    <Button 
                      onClick={handleResetLessonData}
                      disabled={loading || !searchLessonId.trim()}
                      variant={confirmationStep === 'lesson' ? 'destructive' : 'default'}
                    >
                      <BarChart3 className="h-4 w-4 ml-1" />
                      {confirmationStep === 'lesson' ? 'تأكيد التصفير' : 'تصفير البيانات'}
                    </Button>
                  </div>
                </div>
                
                {confirmationStep === 'lesson' && (
                  <Alert className="border-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="flex justify-between items-center">
                      <span>هل أنت متأكد من تصفير بيانات هذا الدرس؟ هذا الإجراء لا يمكن التراجع عنه.</span>
                      <Button variant="outline" size="sm" onClick={cancelConfirmation}>
                        إلغاء
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reset All Data */}
          <TabsContent value="all">
            <Card className="glass-card border-destructive/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  تصفير جميع بيانات الألعاب
                </CardTitle>
                <CardDescription>
                  ⚠️ تحذير: سيتم حذف جميع بيانات الألعاب في النظام بالكامل
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-destructive">
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>عملية خطيرة:</strong> هذا الإجراء سيحذف:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>جميع سجلات تقدم اللاعبين ({stats.totalProgress})</li>
                      <li>جميع جلسات ألعاب المطابقة ({stats.totalSessions})</li>
                      <li>جميع نتائج الألعاب ({stats.totalResults})</li>
                      <li>جميع إحصائيات الأداء والنقاط</li>
                      <li>حالة إلغاء قفل الألعاب للاعبين</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                {confirmationStep === 'all' && (
                  <Alert className="border-destructive bg-destructive/5">
                    <Clock className="h-4 w-4" />
                    <AlertDescription className="space-y-3">
                      <p><strong>تأكيد نهائي:</strong> هل أنت متأكد تماماً من حذف جميع بيانات الألعاب؟</p>
                      <div className="flex gap-2">
                        <Button 
                          variant="destructive" 
                          onClick={handleResetAllData}
                          disabled={loading}
                        >
                          {loading ? 'جاري التصفير...' : 'نعم، احذف جميع البيانات'}
                        </Button>
                        <Button variant="outline" onClick={cancelConfirmation}>
                          إلغاء
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {confirmationStep !== 'all' && (
                  <Button 
                    variant="destructive" 
                    onClick={handleResetAllData}
                    disabled={loading}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 ml-1" />
                    تصفير جميع البيانات
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Refresh Stats */}
        <div className="text-center">
          <Button variant="outline" onClick={loadStats} disabled={loading}>
            <RefreshCw className="h-4 w-4 ml-1" />
            تحديث الإحصائيات
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GameDataManagement;