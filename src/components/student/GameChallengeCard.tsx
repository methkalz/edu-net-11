import React, { useState, lazy, Suspense } from 'react';
import { Gamepad2, Lock, Trophy, ChevronLeft, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useLessonGames, GameState } from '@/hooks/useLessonGame';

const PairMatchingGame = lazy(() => 
  import('@/components/games/PairMatchingGame').then(m => ({ default: m.PairMatchingGame }))
);

interface GameChallengeCardProps {
  topicId: string;
}

const SingleGameCard: React.FC<{ state: GameState; onPlay: (id: string) => void }> = ({ state, onPlay }) => {
  const { game, isLocked, isCompleted, bestScore, remainingPrereqs } = state;

  const handleClick = () => {
    if (isLocked) return;
    onPlay(game.id);
  };

  const cardStyles = isLocked
    ? 'from-slate-50/50 to-slate-100/30 border-slate-200/60 opacity-75'
    : isCompleted
    ? 'from-amber-50/50 to-green-50/30 border-amber-200/60'
    : 'from-orange-50/50 to-amber-50/30 border-orange-200/60';

  const iconBg = isLocked
    ? 'from-slate-400 to-slate-500'
    : isCompleted
    ? 'from-amber-500 to-yellow-500'
    : 'from-orange-500 to-amber-500';

  const Icon = isLocked ? Lock : isCompleted ? Trophy : Gamepad2;

  const subtitle = isLocked
    ? `أكمل ${remainingPrereqs} بطاقة سابقة لفتح التحدي`
    : isCompleted
    ? `أحسنت! أفضل نتيجة: ${bestScore}%`
    : 'اختبر فهمك لهذا الموضوع!';

  const buttonText = isLocked ? 'عرض البطاقات' : isCompleted ? 'العب مجدداً' : 'ابدأ التحدي';

  return (
    <div
      className={`flex items-center justify-between p-5 bg-gradient-to-br ${cardStyles} rounded-2xl border ${isLocked ? 'cursor-not-allowed' : 'hover:shadow-md cursor-pointer'} transition-all group`}
      onClick={handleClick}
    >
      <div className="flex items-center gap-5">
        <div className={`w-10 h-10 bg-gradient-to-r ${iconBg} rounded-xl flex items-center justify-center shadow-sm`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h5 className="font-medium text-slate-700 group-hover:text-orange-700 transition-colors flex items-center gap-2">
            🎮 تحدي: {game.title}
          </h5>
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge 
          variant="secondary" 
          className={`text-xs px-3 py-1 ${
            isLocked 
              ? 'bg-slate-100/60 text-slate-500 border-slate-200' 
              : isCompleted
              ? 'bg-amber-100/60 text-amber-600 border-amber-200'
              : 'bg-orange-100/60 text-orange-600 border-orange-200'
          }`}
        >
          {buttonText}
        </Badge>
        <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-orange-600 transition-colors" />
      </div>
    </div>
  );
};

const GameChallengeCard: React.FC<GameChallengeCardProps> = ({ topicId }) => {
  const { games, loading } = useLessonGames(topicId);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);

  if (loading || games.length === 0) return null;

  return (
    <>
      {/* Separator */}
      <div className="flex items-center gap-3 pt-2">
        <div className="flex-1 h-px bg-gradient-to-l from-orange-200 to-transparent" />
        <span className="text-xs text-orange-500 font-medium flex items-center gap-1">
          🎮 تحديات الموضوع
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-orange-200 to-transparent" />
      </div>

      {/* Game cards */}
      {games.map(state => (
        <SingleGameCard 
          key={state.game.id} 
          state={state} 
          onPlay={setActiveGameId} 
        />
      ))}

      {/* Game Dialog */}
      <Dialog open={!!activeGameId} onOpenChange={(open) => !open && setActiveGameId(null)}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto p-0 sm:p-6">
          <Suspense fallback={
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              <span className="mr-3 text-slate-600">جاري تحميل اللعبة...</span>
            </div>
          }>
            {activeGameId && <PairMatchingGame gameId={activeGameId} />}
          </Suspense>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default React.memo(GameChallengeCard);
