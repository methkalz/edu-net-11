import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Play, Clock, Target, Trophy, AlertCircle, RefreshCw, Zap, Star, ArrowLeft, Lock, Volume2, VolumeX, Settings, X, CheckCircle } from 'lucide-react';
import { MatchingCard } from './MatchingCard';
import { ModernGameSelection } from './ModernGameSelection';
import { usePairMatching } from '@/hooks/usePairMatching';
import { useWinningSound } from '@/hooks/useWinningSound';
import { useTribalWinSound } from '@/hooks/useTribalWinSound';
import { cn } from '@/lib/utils';
import './CelebrationEffects.css';
interface PairMatchingGameProps {
  gameId?: string;
}
export const PairMatchingGame: React.FC<PairMatchingGameProps> = ({
  gameId
}) => {
  const {
    games,
    currentGame,
    shuffledPairs,
    matchedPairs,
    score,
    mistakes,
    timeRemaining,
    isGameActive,
    loading,
    selectedLeft,
    selectedRight,
    nextUnlockedGame,
    nextCardGame,
    isNewLevelUnlocked,
    startNewSession,
    attemptMatch,
    setSelectedLeft,
    setSelectedRight,
    isMatched,
    canMatch,
    gameAudio
  } = usePairMatching(gameId);

  const { playWinningSound, stopWinningSound, cleanup: cleanupWinningSound } = useWinningSound();
  const { playTribalWinSound, stopTribalWinSound, cleanup: cleanupTribalWinSound } = useTribalWinSound();

  // حالة السحب والإفلات
  const [draggedItem, setDraggedItem] = React.useState<{
    id: string;
    content: string;
  } | null>(null);
  const [dragOverTarget, setDragOverTarget] = React.useState<string | null>(null);
  const [showAudioSettings, setShowAudioSettings] = React.useState(false);
  const [showCompletionScreen, setShowCompletionScreen] = React.useState(false);
  const [showGameSelection, setShowGameSelection] = React.useState(!gameId);

  // اختيار لعبة
  const handleGameSelect = (game: any) => {
    if (game.isLocked) return;
    setShowGameSelection(false);
    startNewSession(game.id);
  };

  // العودة إلى قائمة الألعاب
  const handleBackToGameSelection = () => {
    setShowGameSelection(true);
    setShowCompletionScreen(false);
  };

  // اختيار لعبة افتراضية إذا لم يتم تحديد معرف
  const targetGame = currentGame || (games.length > 0 ? games[0] : null);

  // التحكم في عرض شاشة التهنئة بعد تأخير
  React.useEffect(() => {
    const isGameComplete = !isGameActive && matchedPairs.length === shuffledPairs.leftItems.length && shuffledPairs.leftItems.length > 0;
    if (isGameComplete && !showCompletionScreen) {
      // إظهار شاشة التهنئة بعد 3 ثوان
      const timer = setTimeout(() => {
        setShowCompletionScreen(true);
        // تشغيل الصوت المناسب حسب نوع الإنجاز
        if (isNewLevelUnlocked) {
          // صوت فتح مستوى جديد
          playWinningSound();
        } else {
          // صوت إكمال بطاقة عادية (فتح بطاقة جديدة في نفس المستوى)
          playTribalWinSound();
        }
      }, 3000);
      return () => clearTimeout(timer);
    } else if (!isGameComplete) {
      // إعادة تعيين الحالة عند بدء لعبة جديدة
      setShowCompletionScreen(false);
      stopWinningSound(); // إيقاف صوت الفوز عند بدء لعبة جديدة
      stopTribalWinSound(); // إيقاف صوت الفوز القبلي عند بدء لعبة جديدة
    }
  }, [isGameActive, matchedPairs.length, shuffledPairs.leftItems.length, showCompletionScreen, nextUnlockedGame, playWinningSound, stopWinningSound, playTribalWinSound, stopTribalWinSound]);

  // تنظيف الأصوات عند إلغاء تحميل المكون
  React.useEffect(() => {
    return () => {
      cleanupWinningSound();
      cleanupTribalWinSound();
    };
  }, [cleanupWinningSound, cleanupTribalWinSound]);

  // معالجة السحب والإفلات
  const handleDragStart = (cardId: string, content: string) => {
    if (!isGameActive || isMatched(cardId)) return;
    setDraggedItem({
      id: cardId,
      content
    });
  };
  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedItem && !isMatched(targetId)) {
      setDragOverTarget(targetId);
    }
  };
  const handleDragLeave = () => {
    setDragOverTarget(null);
  };
  const handleDrop = (targetId: string) => {
    if (draggedItem && canMatch(draggedItem.id, targetId)) {
      attemptMatch(draggedItem.id, targetId);
    }
    setDraggedItem(null);
    setDragOverTarget(null);
  };

  // معالجة النقر على الكارد (للأجهزة اللوحية)
  const handleCardClick = (cardId: string, side: 'left' | 'right') => {
    if (!isGameActive || isMatched(cardId)) return;
    if (side === 'left') {
      if (selectedLeft === cardId) {
        setSelectedLeft(null);
      } else {
        setSelectedLeft(cardId);
        if (selectedRight && canMatch(cardId, selectedRight)) {
          attemptMatch(cardId, selectedRight);
        }
      }
    } else {
      if (selectedRight === cardId) {
        setSelectedRight(null);
      } else {
        setSelectedRight(cardId);
        if (selectedLeft && canMatch(selectedLeft, cardId)) {
          attemptMatch(selectedLeft, cardId);
        }
      }
    }
  };

  // تنسيق الوقت
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // حساب نسبة التقدم
  const progress = shuffledPairs.leftItems.length > 0 ? matchedPairs.length / shuffledPairs.leftItems.length * 100 : 0;
  if (loading) {
    return <Card className="w-full max-w-6xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">جاري تحميل الألعاب...</p>
        </CardContent>
      </Card>;
  }
  if (games.length === 0) {
    return <Card className="w-full max-w-6xl mx-auto">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">لا توجد ألعاب مطابقة متاحة</p>
        </CardContent>
      </Card>;
  }

  // عرض قائمة الألعاب إذا لم يتم اختيار لعبة أو عند العودة للقائمة
  if (showGameSelection || !targetGame) {
    return <div className="w-full max-w-7xl mx-auto space-y-4 overflow-hidden">
        <div className="mb-8">
          {/* شريط إعدادات الصوت */}
          <div className="flex justify-end mb-6">
            <button onClick={() => setShowAudioSettings(!showAudioSettings)} className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">
              <Volume2 className="w-5 h-5" />
              إعدادات الصوت
            </button>
          </div>

          {showAudioSettings && <div className="mb-6 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">إعدادات الصوت</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={!gameAudio.settings.isMuted} onChange={e => gameAudio.toggleMute()} />
                  تفعيل الأصوات
                </label>
                <div className="flex items-center gap-2">
                  <span>مستوى الصوت:</span>
                  <input type="range" min="0" max="100" step="5" value={Math.round(gameAudio.settings.volume * 100)} onChange={e => gameAudio.setVolume(parseInt(e.target.value))} className="flex-1" />
                  <span>{Math.round(gameAudio.settings.volume * 100)}%</span>
                </div>
              </div>
            </div>}

          {/* عرض الألعاب الحديث */}
          <ModernGameSelection games={games} onGameSelect={handleGameSelect} />
        </div>
      </div>;
  }
  return <div className="w-full max-w-7xl mx-auto space-y-4 overflow-hidden">
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <span className="text-gradient bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-bold">
                  {targetGame.title}
                </span>
                <p className="text-sm text-muted-foreground mt-1">{targetGame.description}</p>
              </div>
            </CardTitle>
            
            <div className="flex items-center gap-3">
              {/* إعدادات الصوت */}
              <div className="flex items-center gap-2">
                {showAudioSettings && <div className="flex items-center gap-3 p-2 bg-background/80 rounded-lg border border-border/50 backdrop-blur-sm">
                    <Slider value={[gameAudio.settings.volume]} onValueChange={value => gameAudio.setVolume(value[0])} max={100} step={5} className="w-20" />
                    <span className="text-xs text-muted-foreground min-w-[30px]">
                      {gameAudio.settings.volume}%
                    </span>
                    <Button variant="ghost" size="sm" onClick={gameAudio.testSound} className="h-8 w-8 p-0">
                      <Play className="h-3 w-3" />
                    </Button>
                  </div>}
                
                <Button variant="ghost" size="sm" onClick={() => setShowAudioSettings(!showAudioSettings)} className="h-8 w-8 p-0">
                  <Settings className="h-4 w-4" />
                </Button>
                
                <Button variant="ghost" size="sm" onClick={gameAudio.toggleMute} className="h-8 w-8 p-0">
                  {gameAudio.settings.isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              </div>
              
              <Badge variant="outline" className="border-primary/30">
                <Star className="h-4 w-4 ml-1" />
                {targetGame.difficulty_level}
              </Badge>
              <Badge variant="default" className="bg-gradient-to-r from-primary to-accent">
                صف {targetGame.grade_level}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Game Stats */}
      {isGameActive && <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{formatTime(timeRemaining)}</p>
                <p className="text-xs text-muted-foreground">الوقت المتبقي</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-emerald/10">
                <Trophy className="h-5 w-5 text-green-emerald" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-emerald">{score}</p>
                <p className="text-xs text-muted-foreground">النقاط</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-electric/10">
                <Zap className="h-5 w-5 text-blue-electric" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-electric">{matchedPairs.length}</p>
                <p className="text-xs text-muted-foreground">مطابقات صحيحة</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{mistakes}</p>
                <p className="text-xs text-muted-foreground">أخطاء</p>
              </div>
            </div>
          </Card>
        </div>}

      {/* Progress Bar */}
      {isGameActive && <Card className="p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">التقدم</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="text-xs text-center text-muted-foreground">
              {matchedPairs.length} من {shuffledPairs.leftItems.length} مطابقات
            </div>
          </div>
        </Card>}

      {/* Game Area */}
      {!isGameActive && !(matchedPairs.length === shuffledPairs.leftItems.length && shuffledPairs.leftItems.length > 0) ? <Card className="p-8 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="p-4 rounded-full bg-primary/10 w-20 h-20 mx-auto flex items-center justify-center">
              <Play className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold">جاهز للبدء؟</h3>
            <p className="text-muted-foreground">
              اطابق المصطلحات مع تعريفاتها في أقل وقت ممكن!
            </p>
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span>{shuffledPairs.leftItems.length} كلمات للمطابقة</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>{Math.floor(targetGame.time_limit_seconds / 60)} دقائق</span>
              </div>
            </div>
            <Button onClick={() => startNewSession(targetGame.id)} className="w-full bg-gradient-to-r from-primary to-accent hover:shadow-lg transition-all duration-300" size="lg">
              <Play className="h-5 w-5 ml-2" />
              بدء اللعبة
            </Button>
          </div>
        </Card> : showCompletionScreen ? null : <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
          {/* تأثير الربط البصري */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-border to-transparent transform -translate-x-1/2" />
          
          {/* Left Column - المصطلحات */}
          <Card className="p-6 bg-gradient-to-br from-blue-50/50 to-cyan-50/30 border-blue-200/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 rounded-full -translate-y-16 translate-x-16" />
            
            <div className="space-y-4 relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full shadow-sm" />
                <h3 className="font-bold text-lg bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  المصطلحات
                </h3>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  اسحب للمطابقة
                </Badge>
              </div>
              
              {shuffledPairs.leftItems.map(item => <MatchingCard key={item.id} id={item.id} content={item.content} type={item.type} side="left" isSelected={selectedLeft === item.id} isMatched={isMatched(item.id)} isCorrect={matchedPairs.find(match => match.leftId === item.id || match.rightId === item.id)?.isCorrect} matchNumber={matchedPairs.find(match => match.leftId === item.id || match.rightId === item.id)?.matchNumber} matchColor={matchedPairs.find(match => match.leftId === item.id || match.rightId === item.id)?.matchColor} onClick={id => handleCardClick(id, 'left')} onDragStart={handleDragStart} />)}
            </div>
          </Card>

          {/* Right Column - التعريفات */}
          <Card className="p-6 bg-gradient-to-br from-orange-50/50 to-red-50/30 border-orange-200/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-red-500/5 rounded-full -translate-y-16 -translate-x-16" />
            
            <div className="space-y-4 relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-4 h-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-full shadow-sm" />
                <h3 className="font-bold text-lg bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  التعريفات
                </h3>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  منطقة الإفلات
                </Badge>
              </div>
              
              {shuffledPairs.rightItems.map(item => <MatchingCard key={item.id} id={item.id} content={item.content} type={item.type} side="right" isSelected={selectedRight === item.id} isMatched={isMatched(item.id)} isCorrect={matchedPairs.find(match => match.leftId === item.id || match.rightId === item.id)?.isCorrect} matchNumber={matchedPairs.find(match => match.leftId === item.id || match.rightId === item.id)?.matchNumber} matchColor={matchedPairs.find(match => match.leftId === item.id || match.rightId === item.id)?.matchColor} onClick={id => handleCardClick(id, 'right')} onDragOver={e => handleDragOver(e, item.id)} onDrop={handleDrop} isDragOver={dragOverTarget === item.id} />)}
            </div>
          </Card>
        </div>}

      {/* Game Complete Screen */}
      {showCompletionScreen && <div className="animate-fade-in">
          <Card className={cn("relative overflow-hidden shadow-2xl", nextUnlockedGame ? "bg-gradient-to-br from-amber-400/10 via-background to-yellow-400/10 border-yellow-500/30 level-unlock-glow" : "bg-gradient-to-br from-green-500/5 via-background to-green-600/5 border-green-500/20")}>
            {/* Celebration Effects */}
            
            {/* Confetti Animation */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* Snow-like Particles */}
              {Array.from({
            length: nextUnlockedGame ? 25 : 15
          }, (_, i) => <div key={`confetti-${i}`} className={cn("absolute w-1 h-1 animate-pulse opacity-40 rounded-full", nextUnlockedGame ? [i % 4 === 0 && "bg-yellow-500/60 celebration-sparkles", i % 4 === 1 && "bg-amber-500/60", i % 4 === 2 && "bg-orange-400/60", i % 4 === 3 && "bg-yellow-400/60 celebration-sparkles"] : [i % 3 === 0 && "bg-green-500/50", i % 3 === 1 && "bg-yellow-500/50", i % 3 === 2 && "bg-green-400/50"])} style={{
            left: `${Math.random() * 100}%`,
            top: `-10px`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${8 + Math.random() * 6}s`,
            animationIterationCount: 'infinite',
            animation: `snow-fall ${8 + Math.random() * 6}s infinite linear`
          }} />)}
            </div>

            {/* Random Safe Zone Stars */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({
            length: 6
          }, (_, i) => {
            // تحديد المناطق الآمنة: الحواف العلوية والسفلية والجانبية
            const safeZones = [{
              x: [5, 25],
              y: [5, 15]
            },
            // أعلى يسار
            {
              x: [75, 95],
              y: [5, 15]
            },
            // أعلى يمين
            {
              x: [5, 25],
              y: [85, 95]
            },
            // أسفل يسار
            {
              x: [75, 95],
              y: [85, 95]
            },
            // أسفل يمين
            {
              x: [45, 55],
              y: [5, 10]
            },
            // أعلى وسط
            {
              x: [45, 55],
              y: [90, 95]
            } // أسفل وسط
            ];
            const zone = safeZones[i % safeZones.length];
            const randomX = zone.x[0] + Math.random() * (zone.x[1] - zone.x[0]);
            const randomY = zone.y[0] + Math.random() * (zone.y[1] - zone.y[0]);

            // سرعات متنوعة للنجوم
            const speeds = [2, 2.5, 3, 3.5, 4, 5];
            const speed = speeds[i % speeds.length];
            return <div key={`safe-star-${i}`} className="absolute text-yellow-400/60 animate-bounce" style={{
              left: `${randomX}%`,
              top: `${randomY}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${speed}s`,
              fontSize: `${0.7 + Math.random() * 0.9}rem`,
              animationTimingFunction: 'ease-in-out'
            }}>
                    ⭐
                  </div>;
          })}
            </div>

            
            <div className="relative z-10 p-8 text-center">
              <div className="max-w-md mx-auto space-y-6">
                {/* Success Icon with Animation */}
                <div className="animate-scale-in delay-300 flex justify-center">
                  <div className="relative">
                    {nextUnlockedGame ? <>
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/30 to-amber-600/30 rounded-full blur-xl animate-pulse"></div>
                        <div className="relative p-6 rounded-full bg-gradient-to-br from-yellow-400/20 to-amber-500/20 w-24 h-24 mx-auto flex items-center justify-center border-2 border-yellow-500/30 shadow-lg level-unlock-glow">
                          <Trophy className="h-12 w-12 text-yellow-600 animate-pulse mx-auto" />
                        </div>
                        {/* Golden sparkles around icon */}
                        <div className="absolute -top-2 -right-2 text-yellow-400 text-lg celebration-sparkles">✨</div>
                        <div className="absolute -bottom-2 -left-2 text-amber-400 text-lg celebration-sparkles" style={{
                    animationDelay: '0.5s'
                  }}>⭐</div>
                      </> : <>
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-full blur-xl animate-pulse"></div>
                        <div className="relative p-6 rounded-full bg-gradient-to-br from-green-500/10 to-green-600/10 w-24 h-24 mx-auto flex items-center justify-center border-2 border-green-500/20 shadow-lg">
                          <Trophy className="h-12 w-12 text-green-600 animate-pulse mx-auto" />
                        </div>
                      </>}
                  </div>
                </div>

                {/* Congratulations Message */}
                <div className="animate-fade-in delay-500 space-y-2 text-center">
                  {nextUnlockedGame ? <>
                      <h3 className="text-3xl font-bold text-yellow-600 mx-auto text-center level-up-entrance">مبروك.. مستوى جديد</h3>
                      <p className="text-lg text-yellow-700/80 text-center mx-auto font-medium">
                        لقد فتحت لعبة جديدة مثيرة! 🔓✨
                      </p>
                    </> : <>
                      <h3 className="text-3xl font-bold text-green-600 mx-auto text-center">يا سلام عليك</h3>
                      <p className="text-lg text-muted-foreground text-center mx-auto">
                        {mistakes === 0 ? "أداء مثالي! لم ترتكب أي خطأ! 🌟" : mistakes <= 2 ? "أداء ممتاز! عدد قليل من الأخطاء! 👏" : mistakes <= 5 ? "أداء جيد! يمكنك التحسن أكثر! 💪" : "لقد أكملت اللعبة! استمر في التدريب! 📚"}
                      </p>
                    </>}
                </div>
                
                {/* Performance Stats */}
                <div className="animate-slide-in-right delay-700">
                  <div className="grid grid-cols-3 gap-4 p-6 bg-background/80 backdrop-blur-sm rounded-xl border border-green-500/10 shadow-inner">
                    <div className="text-center space-y-1 flex flex-col items-center">
                      <div className="p-3 rounded-lg bg-green-500/10 mx-auto w-fit flex items-center justify-center">
                        <Trophy className="h-5 w-5 text-green-600 mx-auto" />
                      </div>
                      <p className="text-2xl font-bold text-green-600 text-center">{score}</p>
                      <p className="text-xs text-muted-foreground text-center">النقاط</p>
                    </div>
                    <div className="text-center space-y-1 flex flex-col items-center">
                      <div className="p-3 rounded-lg bg-red-500/10 mx-auto w-fit flex items-center justify-center">
                        <X className="h-5 w-5 text-red-500 mx-auto" />
                      </div>
                      <p className="text-2xl font-bold text-red-500 text-center">{mistakes}</p>
                      <p className="text-xs text-muted-foreground text-center">الأخطاء</p>
                    </div>
                    <div className="text-center space-y-1 flex flex-col items-center">
                      <div className="p-3 rounded-lg bg-green-500/10 mx-auto w-fit flex items-center justify-center">
                        <Target className="h-5 w-5 text-green-600 mx-auto" />
                      </div>
                      <p className="text-2xl font-bold text-green-600 text-center">
                        {Math.round(((currentGame?.max_pairs || 1) - mistakes) / (currentGame?.max_pairs || 1) * 100)}%
                      </p>
                      <p className="text-xs text-muted-foreground text-center">الدقة</p>
                    </div>
                  </div>
                </div>

                {/* Next Game Preview */}
                {nextUnlockedGame && <div className="animate-fade-in delay-1000">
                    <div className="p-6 bg-gradient-to-r from-yellow-400/15 via-amber-400/10 to-yellow-400/15 rounded-xl border border-yellow-500/30 space-y-4 shadow-lg text-center level-unlock-glow">
                      <div className="flex items-center justify-center gap-2 text-yellow-600 font-bold text-lg">
                        <span className="text-xl celebration-sparkles">🔓</span>
                        <span>لعبة جديدة مفتوحة!</span>
                        <span className="text-xl celebration-sparkles" style={{
                    animationDelay: '1s'
                  }}>✨</span>
                      </div>
                      <div className="space-y-2 text-center">
                        <h4 className="text-lg font-bold text-yellow-700 text-center mx-auto">{nextUnlockedGame.title}</h4>
                        <p className="text-sm text-yellow-600/80 text-center mx-auto">{nextUnlockedGame.description}</p>
                      </div>
                      <div className="flex items-center justify-center gap-3">
                        <Badge variant="secondary" className="bg-yellow-500/15 text-yellow-700 border-yellow-500/30">
                          {nextUnlockedGame.difficulty_level}
                        </Badge>
                        <Badge variant="secondary" className="bg-yellow-500/15 text-yellow-700 border-yellow-500/30">
                          {nextUnlockedGame.max_pairs} كلمات
                        </Badge>
                      </div>
                    </div>
                  </div>}

                {/* Action Buttons */}
                <div className="animate-fade-in delay-1200 space-y-3 flex flex-col items-center">
                  {/* زر البطاقة/المستوى التالي */}
                  {nextUnlockedGame && (
                    <Button 
                      onClick={() => startNewSession(nextUnlockedGame.id)} 
                      className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center level-unlock-glow" 
                      size="lg"
                    >
                      <ArrowLeft className="h-5 w-5 ml-2" />
                      🚀 ابدأ اللعبة الجديدة
                    </Button>
                  )}
                  
                  {nextCardGame && !nextUnlockedGame && (
                    <Button 
                      onClick={() => startNewSession(nextCardGame.id)} 
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center" 
                      size="lg"
                    >
                      <ArrowLeft className="h-5 w-5 ml-2" />
                      انتقل للبطاقة التالية
                    </Button>
                  )}
                  
                  {/* زر إعادة اللعب */}
                  <Button 
                    onClick={() => startNewSession(currentGame?.id || '')} 
                    variant="outline" 
                    className="w-full border-green-500/30 hover:bg-green-500/10 hover:border-green-500/50 transform hover:scale-105 transition-all duration-300 flex items-center justify-center text-green-600" 
                    size="lg"
                  >
                    <RefreshCw className="h-5 w-5 ml-2" />
                    العب هذه المرحلة مرة أخرى
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>}
    </div>;
};