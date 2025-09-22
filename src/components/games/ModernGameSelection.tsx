import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, Target, Trophy, Star, Lock, CheckCircle, Sparkles, Zap, Crown, ChevronDown, Award, Flame, Shield, Gem, Gamepad2, TrendingUp, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
interface GameData {
  id: string;
  title: string;
  description?: string;
  level_number: number;
  stage_number: number;
  difficulty_level: string;
  time_limit_seconds: number;
  isLocked: boolean;
  isCompleted: boolean;
  progress?: {
    best_score: number;
  };
}
interface ModernGameSelectionProps {
  games: GameData[];
  onGameSelect: (game: GameData) => void;
}
export const ModernGameSelection: React.FC<ModernGameSelectionProps> = ({
  games,
  onGameSelect
}) => {
  const [visibleCards, setVisibleCards] = useState<Set<string>>(new Set());
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [animationPhase, setAnimationPhase] = useState<'entering' | 'ready'>('entering');

  // تجميع الألعاب حسب المستوى مع حسابات إحصائية محسّنة
  const gamesByLevel = useMemo(() => {
    return games.reduce((acc, game) => {
      const level = game.level_number;
      if (!acc[level]) acc[level] = [];
      acc[level].push(game);
      return acc;
    }, {} as Record<number, GameData[]>);
  }, [games]);

  // حساب إحصائيات شاملة
  const gameStats = useMemo(() => {
    const totalGames = games.length;
    const completedGames = games.filter(g => g.isCompleted).length;
    const availableGames = games.filter(g => !g.isLocked).length;
    const progressPercent = totalGames > 0 ? completedGames / totalGames * 100 : 0;
    return {
      totalGames,
      completedGames,
      availableGames,
      progressPercent,
      totalLevels: Object.keys(gamesByLevel).length
    };
  }, [games, gamesByLevel]);

  // تسلسل انتقالي محسّن للبطاقات
  useEffect(() => {
    setAnimationPhase('entering');
    const masterTimer = setTimeout(() => {
      games.forEach((game, index) => {
        setTimeout(() => {
          setVisibleCards(prev => new Set([...prev, game.id]));
        }, index * 80 + Math.random() * 40); // إضافة عشوائية طفيفة للحيوية
      });
      setTimeout(() => {
        setAnimationPhase('ready');
      }, games.length * 120);
    }, 500);
    return () => clearTimeout(masterTimer);
  }, [games]);

  // فتح أول مستوى متاح تلقائياً مع تأخير جميل
  useEffect(() => {
    if (Object.keys(gamesByLevel).length > 0) {
      const firstAvailableLevel = Object.entries(gamesByLevel).sort(([a], [b]) => parseInt(a) - parseInt(b)).find(([_, levelGames]) => levelGames.some(g => !g.isLocked));
      if (firstAvailableLevel) {
        setTimeout(() => {
          setExpandedLevel(parseInt(firstAvailableLevel[0]));
        }, 1200);
      }
    }
  }, [gamesByLevel]);
  const getDifficultyTheme = (difficulty: string, isLocked: boolean, isCompleted: boolean) => {
    if (isLocked) {
      return {
        card: 'bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-slate-800/30 border-slate-200/60 dark:border-slate-700/40',
        glow: 'shadow-sm',
        accent: 'text-slate-500 dark:text-slate-400'
      };
    }
    if (isCompleted) {
      return {
        card: 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/20 border-emerald-200/60 dark:border-emerald-700/40',
        glow: 'shadow-lg shadow-emerald-100/50 dark:shadow-emerald-900/20',
        accent: 'text-emerald-700 dark:text-emerald-300'
      };
    }
    const themes = {
      easy: {
        card: 'bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/15 border-cyan-200/50 dark:border-cyan-700/30',
        glow: 'shadow-md shadow-cyan-100/40 dark:shadow-cyan-900/10',
        accent: 'text-cyan-700 dark:text-cyan-300'
      },
      medium: {
        card: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/15 border-amber-200/50 dark:border-amber-700/30',
        glow: 'shadow-md shadow-amber-100/40 dark:shadow-amber-900/10',
        accent: 'text-amber-700 dark:text-amber-300'
      },
      hard: {
        card: 'bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/15 border-rose-200/50 dark:border-rose-700/30',
        glow: 'shadow-md shadow-rose-100/40 dark:shadow-rose-900/10',
        accent: 'text-rose-700 dark:text-rose-300'
      }
    };
    return themes[difficulty as keyof typeof themes] || {
      card: 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/15 border-indigo-200/50 dark:border-indigo-700/30',
      glow: 'shadow-md shadow-indigo-100/40 dark:shadow-indigo-900/10',
      accent: 'text-indigo-700 dark:text-indigo-300'
    };
  };
  const getDifficultyConfig = (difficulty: string) => {
    const configs = {
      easy: {
        icon: Sparkles,
        label: 'سهل',
        color: 'text-cyan-600 dark:text-cyan-400',
        bgColor: 'bg-cyan-100/80 dark:bg-cyan-900/30 border-cyan-300/50 dark:border-cyan-600/30',
        particle: '✨'
      },
      medium: {
        icon: Zap,
        label: 'متوسط',
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-100/80 dark:bg-amber-900/30 border-amber-300/50 dark:border-amber-600/30',
        particle: '⚡'
      },
      hard: {
        icon: Crown,
        label: 'صعب',
        color: 'text-rose-600 dark:text-rose-400',
        bgColor: 'bg-rose-100/80 dark:bg-rose-900/30 border-rose-300/50 dark:border-rose-600/30',
        particle: '👑'
      }
    };
    return configs[difficulty as keyof typeof configs] || {
      icon: Star,
      label: 'عادي',
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-100/80 dark:bg-indigo-900/30 border-indigo-300/50 dark:border-indigo-600/30',
      particle: '⭐'
    };
  };
  const getGameStatusDisplay = (game: GameData) => {
    if (game.isLocked) {
      return <div className="relative group/status">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 shadow-sm">
            <Lock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          </div>
        </div>;
    }
    if (game.isCompleted) {
      return <div className="relative group/status">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-600 shadow-sm">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-background"></div>
        </div>;
    }
    return <div className="relative group/status">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 shadow-sm">
          <Play className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        </div>
      </div>;
  };
  const getGameButtonStyle = (game: GameData) => {
    if (game.isLocked) {
      return {
        className: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed border border-slate-300 dark:border-slate-600 shadow-sm",
        content: {
          icon: Lock,
          text: "مغلق"
        }
      };
    }
    if (game.isCompleted) {
      return {
        className: "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 border-0",
        content: {
          icon: Trophy,
          text: "العب مجدداً"
        }
      };
    }
    const difficultyStyles = {
      easy: {
        className: "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 border-0",
        content: {
          icon: Play,
          text: "ابدأ اللعب"
        }
      },
      medium: {
        className: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 border-0",
        content: {
          icon: Zap,
          text: "تحدي متوسط"
        }
      },
      hard: {
        className: "bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 border-0",
        content: {
          icon: Crown,
          text: "تحدي الخبراء"
        }
      }
    };
    return difficultyStyles[game.difficulty_level as keyof typeof difficultyStyles] || {
      className: "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 border-0",
      content: {
        icon: Play,
        text: "ابدأ اللعب"
      }
    };
  };
  return <div className="w-full max-w-7xl mx-auto space-y-6 p-4">
      {/* Header مع إحصائيات اللعبة */}
      <div className="relative">
        <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-2xl p-6 shadow-lg">
          <div className="text-center space-y-6">
            {/* العنوان الرئيسي */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">ألعاب مطابقة الكلمات</h1>
              
            </div>

            {/* شريط الإحصائيات المبسط */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 text-center">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-700/30 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Trophy className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">مكتملة</span>
                </div>
                <div className="text-xl font-bold text-emerald-800 dark:text-emerald-200 text-center">
                  {gameStats.completedGames}
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-700/30 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Play className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">متاحة</span>
                </div>
                <div className="text-xl font-bold text-blue-800 dark:text-blue-200 text-center">
                  {gameStats.availableGames}
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200/50 dark:border-purple-700/30 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Star className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">مستويات</span>
                </div>
                <div className="text-xl font-bold text-purple-800 dark:text-purple-200 text-center">
                  {gameStats.totalLevels}
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-700/30 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-300">التقدم</span>
                </div>
                <div className="text-xl font-bold text-amber-800 dark:text-amber-200 text-center">
                  {Math.round(gameStats.progressPercent)}%
                </div>
              </div>
            </div>

            {/* شريط التقدم العام */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                <span>التقدم الإجمالي</span>
                <span>{gameStats.completedGames} من {gameStats.totalGames}</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all duration-1000 ease-out" style={{
                width: `${gameStats.progressPercent}%`
              }} />
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-center leading-relaxed">
              اختر مستواك المفضل وابدأ رحلة التعلم التفاعلي من خلال مطابقة المصطلحات مع تعريفاتها
            </p>
          </div>
        </div>
      </div>

      {/* منطقة المستويات مع تحسينات بصرية */}
      <div className="space-y-4">
        {Object.entries(gamesByLevel).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([level, levelGames]) => {
        const levelNum = parseInt(level);
        const isExpanded = expandedLevel === levelNum;
        const completedCount = levelGames.filter(g => g.isCompleted).length;
        const totalCount = levelGames.length;
        const progressPercent = completedCount / totalCount * 100;
        const hasAvailableGames = levelGames.some(g => !g.isLocked);
        return <div key={level} className={cn("relative transition-all duration-700", visibleCards.size > 0 ? "opacity-100 transform-none" : "opacity-0 translate-y-8")}>
                {/* رأس المستوى */}
                <div className={cn("relative group cursor-pointer transition-all duration-300", "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-xl p-4 border shadow-sm", isExpanded ? "border-blue-300 dark:border-blue-600 shadow-md" : "border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-md")} onClick={() => setExpandedLevel(isExpanded ? null : levelNum)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* أيقونة المستوى */}
                      <div className="relative">
                        <div className={cn("flex items-center justify-center w-12 h-12 rounded-lg font-bold text-lg transition-all duration-300", isExpanded ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300" : hasAvailableGames ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500")}>
                          {levelNum}
                        </div>
                        
                        {/* مؤشر التقدم */}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white dark:bg-slate-900 rounded-full border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center">
                          <div className={cn("w-2 h-2 rounded-full", completedCount === totalCount ? "bg-emerald-500" : completedCount > 0 ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-600")} />
                        </div>
                      </div>
                      
                      <div>
                        <h2 className={cn("text-lg font-bold transition-colors duration-300", isExpanded ? "text-blue-700 dark:text-blue-300" : "text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400")}>
                          المستوى {levelNum}
                        </h2>
                        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            {totalCount} مرحلة
                          </span>
                          {completedCount > 0 && <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle className="w-3 h-3" />
                              {completedCount} مكتملة
                            </span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* شريط التقدم */}
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all duration-700" style={{
                      width: `${progressPercent}%`
                    }} />
                        </div>
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400 min-w-[45px]">
                          {completedCount}/{totalCount}
                        </span>
                      </div>
                      
                      {/* زر التوسع */}
                      <div className={cn("w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center transition-all duration-300", isExpanded ? "rotate-180" : "group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30")}>
                        <ChevronDown className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      </div>
                    </div>
                  </div>

                </div>

                {/* بطاقات المراحل */}
                <div className={cn("grid gap-6 transition-all duration-500 mt-6 p-2", isExpanded ? "md:grid-cols-2 lg:grid-cols-3 opacity-100 max-h-[2000px]" : "grid-cols-1 opacity-0 max-h-0")}>
                  {levelGames.sort((a, b) => a.stage_number - b.stage_number).map((game, index) => {
              const difficultyConfig = getDifficultyConfig(game.difficulty_level);
              const themeConfig = getDifficultyTheme(game.difficulty_level, game.isLocked, game.isCompleted);
              const buttonConfig = getGameButtonStyle(game);
              const isHovered = hoveredCard === game.id;
              return <Card key={game.id} className={cn("group cursor-pointer border transition-all duration-300 transform-gpu origin-center", themeConfig.card, themeConfig.glow, game.isLocked ? "opacity-70 cursor-not-allowed" : "hover:scale-105 hover:-translate-y-1 hover:shadow-xl active:scale-[0.98]", game.isCompleted && "ring-1 ring-emerald-300 dark:ring-emerald-600", visibleCards.has(game.id) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")} style={{
                transitionDelay: isExpanded ? `${index * 80}ms` : '0ms'
              }} onClick={() => !game.isLocked && onGameSelect(game)} onMouseEnter={() => setHoveredCard(game.id)} onMouseLeave={() => setHoveredCard(null)}>
                          <CardContent className="p-5 relative">
                            {/* أيقونة الحالة */}
                            <div className="absolute top-3 right-3 z-10">
                              {getGameStatusDisplay(game)}
                            </div>

                            {/* معرض الصعوبة */}
                            <div className="absolute top-3 left-3 z-10">
                              <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shadow-sm border transition-all duration-200", difficultyConfig.bgColor, difficultyConfig.color)}>
                                <difficultyConfig.icon className="h-3 w-3" />
                                <span>{difficultyConfig.label}</span>
                              </div>
                            </div>
                        
                            <div className="space-y-4 pt-10">
                              {/* عنوان المرحلة */}
                              <div className="space-y-2">
                                <h3 className={cn("font-bold text-lg leading-tight transition-colors duration-200", game.isLocked ? "text-slate-500 dark:text-slate-400" : "text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400")}>
                                  {game.title}
                                </h3>
                                {game.description && <p className={cn("text-sm leading-relaxed line-clamp-2 transition-colors duration-200", game.isLocked ? "text-slate-400 dark:text-slate-500" : "text-slate-600 dark:text-slate-400")}>
                                    {game.description}
                                  </p>}
                              </div>
                          
                              {/* معلومات اللعبة */}
                              <div className="grid grid-cols-2 gap-2">
                                <div className={cn("flex items-center gap-2 p-2.5 rounded-lg border transition-colors duration-200", game.isLocked ? "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400" : "bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300")}>
                                  <Timer className="w-3.5 h-3.5 flex-shrink-0" />
                                  <div>
                                    <div className="text-xs opacity-75">المدة</div>
                                    <div className="text-sm font-semibold">
                                      {Math.floor(game.time_limit_seconds / 60)} د
                                    </div>
                                  </div>
                                </div>

                                <div className={cn("flex items-center gap-2 p-2.5 rounded-lg border transition-colors duration-200", game.isLocked ? "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400" : "bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300")}>
                                  <Target className="w-3.5 h-3.5 flex-shrink-0" />
                                  <div>
                                    <div className="text-xs opacity-75">المرحلة</div>
                                    <div className="text-sm font-semibold">
                                      #{game.stage_number}
                                    </div>
                                  </div>
                                </div>
                              </div>
                          
                              {/* منطقة الإنجازات */}
                              {game.progress && game.progress.best_score > 0 && <div className={cn("flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-dashed transition-colors duration-200", game.isCompleted ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300" : "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-300")}>
                                  <Trophy className="w-4 h-4" />
                                  <div className="text-center">
                                    <div className="text-xs opacity-75">أفضل نتيجة</div>
                                    <div className="text-sm font-bold">
                                      {game.progress.best_score} نقطة
                                    </div>
                                  </div>
                                </div>}
                          
                              {/* زر اللعب */}
                              <Button size="default" disabled={game.isLocked} className={cn("w-full font-semibold transition-all duration-200 relative overflow-hidden", "disabled:opacity-50 disabled:cursor-not-allowed", "group-hover:scale-[1.02] active:scale-[0.98]", buttonConfig.className)}>
                                <div className="flex items-center justify-center gap-2">
                                  <buttonConfig.content.icon className="w-4 h-4" />
                                  <span>{buttonConfig.content.text}</span>
                                </div>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>;
            })}
                </div>
              </div>;
      })}
      </div>
    </div>;
};