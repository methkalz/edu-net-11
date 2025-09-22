import React from 'react';
import { MapPin, Lock, CheckCircle, Star, Book, Calculator, Atom, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface GameMapProps {
  player: any;
  gameState: any;
  onAreaSelect: (area: string) => void;
  onStartQuest: (questId: string) => void;
}

const AREAS = [
  {
    id: 'basics',
    title: 'أساسيات الرياضيات',
    icon: Calculator,
    description: 'ابدأ رحلتك مع الأساسيات',
    unlockLevel: 1,
    color: 'from-blue-400 to-blue-600',
    quests: [
      { id: 'algebra1', title: 'الجبر المبسط', xp: 50, difficulty: 'سهل' },
      { id: 'geometry1', title: 'الهندسة الأساسية', xp: 75, difficulty: 'متوسط' }
    ]
  },
  {
    id: 'physics',
    title: 'عالم الفيزياء',
    icon: Atom,
    description: 'اكتشف قوانين الطبيعة',
    unlockLevel: 3,
    color: 'from-green-400 to-green-600',
    quests: [
      { id: 'mechanics1', title: 'الحركة والقوة', xp: 100, difficulty: 'متوسط' },
      { id: 'energy1', title: 'الطاقة والشغل', xp: 125, difficulty: 'صعب' }
    ]
  },
  {
    id: 'chemistry',
    title: 'مختبر الكيمياء',
    icon: Star,
    description: 'تفاعلات وتجارب مثيرة',
    unlockLevel: 5,
    color: 'from-purple-400 to-purple-600',
    quests: [
      { id: 'atoms1', title: 'تركيب الذرة', xp: 150, difficulty: 'متوسط' },
      { id: 'reactions1', title: 'التفاعلات الكيميائية', xp: 175, difficulty: 'صعب' }
    ]
  },
  {
    id: 'geography',
    title: 'رحلة حول العالم',
    icon: Globe,
    description: 'استكشف قارات وثقافات',
    unlockLevel: 7,
    color: 'from-orange-400 to-orange-600',
    quests: [
      { id: 'continents1', title: 'القارات والمحيطات', xp: 125, difficulty: 'سهل' },
      { id: 'climate1', title: 'المناخ والطقس', xp: 150, difficulty: 'متوسط' }
    ]
  },
  {
    id: 'literature',
    title: 'عالم الأدب',
    icon: Book,
    description: 'نصوص وشعر وإبداع',
    unlockLevel: 4,
    color: 'from-pink-400 to-pink-600',
    quests: [
      { id: 'poetry1', title: 'الشعر العربي', xp: 100, difficulty: 'متوسط' },
      { id: 'prose1', title: 'النثر والقصة', xp: 125, difficulty: 'متوسط' }
    ]
  },
  {
    id: 'advanced',
    title: 'التحديات المتقدمة',
    icon: Star,
    description: 'للمتميزين فقط!',
    unlockLevel: 10,
    color: 'from-red-400 to-red-600',
    quests: [
      { id: 'mixed1', title: 'تحدي شامل', xp: 300, difficulty: 'خبير' },
      { id: 'genius1', title: 'مسائل العباقرة', xp: 500, difficulty: 'عبقري' }
    ]
  }
];

const DIFFICULTY_COLORS = {
  'سهل': 'bg-green-500',
  'متوسط': 'bg-yellow-500',
  'صعب': 'bg-orange-500',
  'خبير': 'bg-red-500',
  'عبقري': 'bg-purple-500'
};

const GameMap: React.FC<GameMapProps> = ({ player, gameState, onAreaSelect, onStartQuest }) => {
  const isAreaUnlocked = (area: any) => {
    return player.level >= area.unlockLevel || player.unlockedAreas.includes(area.id);
  };

  const getAreaProgress = (area: any) => {
    const completedQuests = area.quests.filter((quest: any) => 
      player.completedQuests > 0 // This would need proper quest tracking
    ).length;
    return (completedQuests / area.quests.length) * 100;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">خريطة المغامرة</h2>
        <p className="text-muted-foreground">
          اختر منطقة للاستكشاف وابدأ مغامرتك التعليمية
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {AREAS.map((area) => {
          const unlocked = isAreaUnlocked(area);
          const selected = gameState.currentArea === area.id;
          const progress = getAreaProgress(area);
          const AreaIcon = area.icon;

          return (
            <Card 
              key={area.id}
              className={`
                relative overflow-hidden transition-all duration-300 cursor-pointer
                ${unlocked ? 'hover:scale-105 hover:shadow-lg' : 'opacity-50'}
                ${selected ? 'ring-2 ring-primary shadow-lg' : ''}
              `}
              onClick={() => unlocked && onAreaSelect(area.id)}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${area.color} opacity-10`} />
              
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={`
                    w-12 h-12 rounded-full bg-gradient-to-br ${area.color} 
                    flex items-center justify-center
                  `}>
                    {unlocked ? (
                      <AreaIcon className="h-6 w-6 text-white" />
                    ) : (
                      <Lock className="h-6 w-6 text-white" />
                    )}
                  </div>
                  
                  {unlocked && progress > 0 && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {Math.round(progress)}%
                    </Badge>
                  )}
                </div>

                <h3 className="font-bold text-lg mb-2">{area.title}</h3>
                <p className="text-muted-foreground text-sm mb-4">{area.description}</p>

                {!unlocked && (
                  <Badge variant="outline" className="mb-4">
                    يفتح في المستوى {area.unlockLevel}
                  </Badge>
                )}

                {unlocked && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">المهام المتاحة:</h4>
                    {area.quests.map((quest) => (
                      <div 
                        key={quest.id}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">{quest.title}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              className={`text-white text-xs ${DIFFICULTY_COLORS[quest.difficulty as keyof typeof DIFFICULTY_COLORS]}`}
                            >
                              {quest.difficulty}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {quest.xp} نقطة خبرة
                            </span>
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartQuest(quest.id);
                          }}
                        >
                          ابدأ
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {selected && unlocked && (
                  <div className="absolute top-2 right-2">
                    <MapPin className="h-5 w-5 text-primary animate-bounce" />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default GameMap;