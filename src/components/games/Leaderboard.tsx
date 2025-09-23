import React, { useState } from 'react';
import { Crown, Medal, Trophy, Star, Zap, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PlayerAvatar from './PlayerAvatar';

interface LeaderboardProps {
  currentPlayer: any;
}

// Mock data - في التطبيق الحقيقي، هذه البيانات ستأتي من الخادم
const MOCK_PLAYERS = [
  {
    id: 'p1',
    name: 'أحمد محمد',
    level: 12,
    totalXP: 3200,
    coins: 850,
    streakDays: 15,
    completedQuests: 45,
    avatarId: 'student1',
    achievements: ['perfect_score', 'streak_master', 'level_10']
  },
  {
    id: 'p2',
    name: 'فاطمة علي',
    level: 11,
    totalXP: 2950,
    coins: 720,
    streakDays: 12,
    completedQuests: 38,
    avatarId: 'student2',
    achievements: ['daily_warrior', 'level_10']
  },
  {
    id: 'p3',
    name: 'محمد حسن',
    level: 10,
    totalXP: 2500,
    coins: 650,
    streakDays: 8,
    completedQuests: 32,
    avatarId: 'student3',
    achievements: ['streak_master', 'level_10']
  },
  {
    id: 'p4',
    name: 'نور الهدى',
    level: 9,
    totalXP: 2200,
    coins: 580,
    streakDays: 20,
    completedQuests: 28,
    avatarId: 'student4',
    achievements: ['streak_master', 'daily_warrior']
  },
  {
    id: 'p5',
    name: 'علي أحمد',
    level: 8,
    totalXP: 1950,
    coins: 520,
    streakDays: 5,
    completedQuests: 25,
    avatarId: 'student5',
    achievements: ['first_steps', 'level_5']
  }
];

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="h-6 w-6 text-yellow-500" />;
    case 2:
      return <Medal className="h-6 w-6 text-gray-400" />;
    case 3:
      return <Trophy className="h-6 w-6 text-amber-600" />;
    default:
      return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  }
};

const getRankBadge = (rank: number) => {
  switch (rank) {
    case 1:
      return <Badge className="bg-yellow-500 text-white">الأول</Badge>;
    case 2:
      return <Badge className="bg-gray-500 text-white">الثاني</Badge>;
    case 3:
      return <Badge className="bg-amber-600 text-white">الثالث</Badge>;
    default:
      return null;
  }
};

const Leaderboard: React.FC<LeaderboardProps> = ({ currentPlayer }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'alltime'>('weekly');

  // Add current player to the list and sort
  const allPlayers = [...MOCK_PLAYERS];
  if (currentPlayer.name && !allPlayers.find(p => p.id === currentPlayer.id)) {
    allPlayers.push(currentPlayer);
  }

  const sortedByXP = [...allPlayers].sort((a, b) => b.totalXP - a.totalXP);
  const sortedByStreak = [...allPlayers].sort((a, b) => b.streakDays - a.streakDays);
  const sortedByQuests = [...allPlayers].sort((a, b) => b.completedQuests - a.completedQuests);

  const renderLeaderboard = (players: any[], metric: 'xp' | 'streak' | 'quests') => {
    const currentPlayerRank = players.findIndex(p => p.id === currentPlayer.id) + 1;

    return (
      <div className="space-y-4">
        {/* Current Player Stats */}
        {currentPlayer.name && (
          <Card className="border-primary bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold text-primary">#{currentPlayerRank}</div>
                  <PlayerAvatar avatarId={currentPlayer.avatarId} size="sm" />
                  <div>
                    <div className="font-medium">{currentPlayer.name} (أنت)</div>
                    <div className="text-sm text-muted-foreground">
                      {metric === 'xp' && `${currentPlayer.totalXP} نقطة خبرة`}
                      {metric === 'streak' && `${currentPlayer.streakDays} يوم متتالي`}
                      {metric === 'quests' && `${currentPlayer.completedQuests} مهمة مكتملة`}
                    </div>
                  </div>
                </div>
                <Badge variant="outline">مستواك</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Players */}
        <div className="space-y-3">
          {players.slice(0, 10).map((player, index) => {
            const rank = index + 1;
            const isCurrentPlayer = player.id === currentPlayer.id;
            
            return (
              <Card 
                key={player.id}
                className={`transition-all hover:shadow-md ${
                  isCurrentPlayer ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-8 flex justify-center">
                        {getRankIcon(rank)}
                      </div>
                      
                      <PlayerAvatar 
                        avatarId={player.avatarId} 
                        size="sm" 
                        showBadge={rank <= 3}
                        level={player.level}
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {player.name}
                            {isCurrentPlayer && ' (أنت)'}
                          </span>
                          {getRankBadge(rank)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          المستوى {player.level} • {player.achievements.length} إنجاز
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold">
                        {metric === 'xp' && `${player.totalXP.toLocaleString()}`}
                        {metric === 'streak' && `${player.streakDays}`}
                        {metric === 'quests' && `${player.completedQuests}`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {metric === 'xp' && 'نقطة خبرة'}
                        {metric === 'streak' && 'يوم متتالي'}
                        {metric === 'quests' && 'مهمة'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
          <Users className="h-8 w-8 text-primary" />
          لوحة المتصدرين
        </h2>
        <p className="text-muted-foreground">
          تنافس مع الطلاب الآخرين وتصدر القوائم
        </p>
      </div>

      <Tabs defaultValue="xp" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
          <TabsTrigger value="xp" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            الخبرة
          </TabsTrigger>
          <TabsTrigger value="streak" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            المواظبة
          </TabsTrigger>
          <TabsTrigger value="quests" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            المهام
          </TabsTrigger>
        </TabsList>

        <TabsContent value="xp">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                الأعلى في نقاط الخبرة
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderLeaderboard(sortedByXP, 'xp')}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="streak">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-500" />
                الأطول في المواظبة
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderLeaderboard(sortedByStreak, 'streak')}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quests">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-green-500" />
                الأكثر إنجازاً للمهام
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderLeaderboard(sortedByQuests, 'quests')}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Fun Stats */}
      <Card>
        <CardHeader>
          <CardTitle>إحصائيات مثيرة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-500">
                {allPlayers.reduce((sum, p) => sum + p.totalXP, 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">إجمالي الخبرة</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-500">
                {allPlayers.reduce((sum, p) => sum + p.completedQuests, 0)}
              </div>
              <div className="text-sm text-muted-foreground">المهام المكتملة</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-500">
                {Math.max(...allPlayers.map(p => p.streakDays))}
              </div>
              <div className="text-sm text-muted-foreground">أطول سلسلة</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-500">
                {allPlayers.length}
              </div>
              <div className="text-sm text-muted-foreground">اللاعبين النشطين</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Leaderboard;