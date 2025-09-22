import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2, 
  Search, 
  AlertTriangle, 
  Users, 
  BookOpen,
  Database,
  Shield,
  RefreshCw
} from 'lucide-react';

interface Game {
  id: string;
  name: string;
  grade_level: string;
  subject: string;
  is_active: boolean;
}

interface GameActionsPanelProps {
  game: Game | null;
  onResetUserData: (gameId: string | null, userId: string) => Promise<void>;
  onResetLessonData: (gameId: string | null, lessonId: string) => Promise<void>;
  onResetGameData: (gameId: string | null) => Promise<void>;
  loading: boolean;
}

type ConfirmationType = 'none' | 'user' | 'lesson' | 'game';

export const GameActionsPanel = ({ 
  game, 
  onResetUserData, 
  onResetLessonData, 
  onResetGameData, 
  loading 
}: GameActionsPanelProps) => {
  const [searchUserId, setSearchUserId] = useState('');
  const [searchLessonId, setSearchLessonId] = useState('');
  const [confirmationStep, setConfirmationStep] = useState<ConfirmationType>('none');

  const handleResetUser = async () => {
    if (!searchUserId.trim()) return;
    
    if (confirmationStep !== 'user') {
      setConfirmationStep('user');
      return;
    }

    await onResetUserData(game?.id || null, searchUserId.trim());
    setSearchUserId('');
    setConfirmationStep('none');
  };

  const handleResetLesson = async () => {
    if (!searchLessonId.trim()) return;
    
    if (confirmationStep !== 'lesson') {
      setConfirmationStep('lesson');
      return;
    }

    await onResetLessonData(game?.id || null, searchLessonId.trim());
    setSearchLessonId('');
    setConfirmationStep('none');
  };

  const handleResetGame = async () => {
    if (confirmationStep !== 'game') {
      setConfirmationStep('game');
      return;
    }

    await onResetGameData(game?.id || null);
    setConfirmationStep('none');
  };

  const cancelConfirmation = () => {
    setConfirmationStep('none');
  };

  const getGameTitle = () => {
    if (!game) return 'جميع الألعاب';
    return `${game.name} (صف ${game.grade_level})`;
  };

  const getGameIcon = () => {
    if (!game) return '🎮';
    switch (game.subject.toLowerCase()) {
      case 'networks': return '🌐';
      case 'programming': return '💻';
      case 'security': return '🔒';
      case 'databases': return '🗄️';
      default: return '📖';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Enhanced Game Context Header */}
      <Card className="glass-card border-primary/20 hover-scale transition-all duration-300 shadow-elegant">
        <CardContent className="p-6 bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                <span className="text-3xl animate-float">{getGameIcon()}</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gradient bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {getGameTitle()}
                </h3>
                <p className="text-muted-foreground font-medium">
                  {game ? `📚 موضوع: ${game.subject}` : '🎮 عمليات شاملة على جميع الألعاب'}
                </p>
              </div>
            </div>
            {game && (
              <Badge variant="default" className="bg-gradient-to-r from-primary to-accent text-white px-4 py-2 text-base font-semibold shadow-lg">
                🎓 صف {game.grade_level}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Reset User Data */}
      <Card className="glass-card hover-scale transition-all duration-300 border-blue-500/20">
        <CardHeader className="bg-gradient-to-r from-blue-500/5 to-blue-600/5">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <span className="text-gradient bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
              تصفير بيانات مستخدم محدد
            </span>
          </CardTitle>
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
                onClick={handleResetUser}
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
                <span>
                  هل أنت متأكد من تصفير بيانات هذا المستخدم في {getGameTitle()}؟
                </span>
                <Button variant="outline" size="sm" onClick={cancelConfirmation}>
                  إلغاء
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Reset Lesson Data */}
      <Card className="glass-card hover-scale transition-all duration-300 border-green-500/20">
        <CardHeader className="bg-gradient-to-r from-green-500/5 to-green-600/5">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-green-500/10">
              <BookOpen className="h-6 w-6 text-green-500" />
            </div>
            <span className="text-gradient bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
              تصفير بيانات درس محدد
            </span>
          </CardTitle>
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
                onClick={handleResetLesson}
                disabled={loading || !searchLessonId.trim()}
                variant={confirmationStep === 'lesson' ? 'destructive' : 'default'}
              >
                <BookOpen className="h-4 w-4 ml-1" />
                {confirmationStep === 'lesson' ? 'تأكيد التصفير' : 'تصفير البيانات'}
              </Button>
            </div>
          </div>
          
          {confirmationStep === 'lesson' && (
            <Alert className="border-destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex justify-between items-center">
                <span>
                  هل أنت متأكد من تصفير بيانات هذا الدرس في {getGameTitle()}؟
                </span>
                <Button variant="outline" size="sm" onClick={cancelConfirmation}>
                  إلغاء
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Reset Game Data */}
      <Card className="glass-card hover-scale transition-all duration-300 border-destructive/30 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-destructive/5 to-red-600/5">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive animate-pulse" />
            </div>
            <span className="text-gradient bg-gradient-to-r from-destructive to-red-600 bg-clip-text text-transparent">
              {game ? `تصفير جميع بيانات ${game.name}` : 'تصفير جميع بيانات الألعاب'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-destructive">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>عملية خطيرة:</strong> سيتم حذف جميع البيانات المرتبطة بـ {getGameTitle()}:
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>جميع سجلات تقدم المستخدمين</li>
                <li>جميع الإنجازات المكتسبة</li>
                <li>جميع سجلات التحليلات</li>
                <li>جميع الأسئلة المولدة</li>
                <li>جميع ملفات اللاعبين والعملات</li>
                <li>جميع جلسات الألعاب</li>
              </ul>
            </AlertDescription>
          </Alert>

          {confirmationStep === 'game' && (
            <Alert className="border-destructive bg-destructive/5">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="space-y-3">
                <p><strong>تأكيد نهائي:</strong> هل أنت متأكد من حذف جميع بيانات {getGameTitle()}؟</p>
                <div className="flex gap-2">
                  <Button 
                    variant="destructive" 
                    onClick={handleResetGame}
                    disabled={loading}
                  >
                    <Database className="h-4 w-4 ml-1" />
                    {loading ? 'جاري التصفير...' : 'نعم، احذف جميع البيانات'}
                  </Button>
                  <Button variant="outline" onClick={cancelConfirmation}>
                    إلغاء
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {confirmationStep !== 'game' && (
            <Button 
              variant="destructive" 
              onClick={handleResetGame}
              disabled={loading}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 ml-1" />
              {game ? `تصفير جميع بيانات ${game.name}` : 'تصفير جميع بيانات الألعاب'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};