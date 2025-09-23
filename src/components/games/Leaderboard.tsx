import React, { useState } from 'react';
import { Crown, Medal, Trophy, Star, Zap, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PlayerAvatar from './PlayerAvatar';
import { useRealLeaderboard } from '@/hooks/useRealLeaderboard';

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
  const { leaderboard, getPlayersByStreak, getPlayersByActivities, loading, error } = useRealLeaderboard();

  // Convert real data to match expected format
  const allPlayers = leaderboard.players.map(player => ({
    id: player.id,
    name: player.name,
    level: Math.floor(player.points / 100) + 1, // Simple level calculation
    totalXP: player.points,
    coins: Math.floor(player.points / 10), // Simple coins calculation
    streakDays: player.streakDays,
    completedQuests: player.completedActivities,
    avatarId: player.avatar || 'student1',
    achievements: Array(player.achievementsCount).fill('achievement')
  }));

  const sortedByXP = allPlayers;
  const sortedByStreak = getPlayersByStreak().map(player => ({
    id: player.id,
    name: player.name,
    level: Math.floor(player.points / 100) + 1,
    totalXP: player.points,
    coins: Math.floor(player.points / 10),
    streakDays: player.streakDays,
    completedQuests: player.completedActivities,
    avatarId: player.avatar || 'student1',
    achievements: Array(player.achievementsCount).fill('achievement')
  }));
  const sortedByQuests = getPlayersByActivities().map(player => ({
    id: player.id,
    name: player.name,
    level: Math.floor(player.points / 100) + 1,
    totalXP: player.points,
    coins: Math.floor(player.points / 10),
    streakDays: player.streakDays,
    completedQuests: player.completedActivities,
    avatarId: player.avatar || 'student1',
    achievements: Array(player.achievementsCount).fill('achievement')
  }));

  const renderLeaderboard = (players: any[], metric: 'xp' | 'streak' | 'quests') => {
    const currentPlayerData = players.find(p => leaderboard.players.find(rp => rp.id === p.id)?.isCurrentUser);
    const currentPlayerRank = currentPlayerData ? players.findIndex(p => p.id === currentPlayerData.id) + 1 : 0;

    if (loading) {
      return <div className="text-center text-muted-foreground">جاري تحميل البيانات...</div>;
    }

    if (error) {
      return <div className="text-center text-red-500">خطأ في تحميل البيانات: {error}</div>;
    }

    return (
      <div className="space-y-4">
        {/* Current Player Stats */}
        {currentPlayerData && (
          <Card className="border-primary bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold text-primary">#{currentPlayerRank}</div>
                  <PlayerAvatar avatarId={currentPlayerData.avatarId} size="sm" />
                  <div>
                    <div className="font-medium">{currentPlayerData.name} (أنت)</div>
                    <div className="text-sm text-muted-foreground">
                      {metric === 'xp' && `${currentPlayerData.totalXP} نقطة خبرة`}
                      {metric === 'streak' && `${currentPlayerData.streakDays} يوم متتالي`}
                      {metric === 'quests' && `${currentPlayerData.completedQuests} مهمة مكتملة`}
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
            const isCurrentPlayer = leaderboard.players.find(rp => rp.id === player.id)?.isCurrentUser || false;
            
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
                {leaderboard.totalPoints.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">إجمالي النقاط</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-500">
                {leaderboard.players.reduce((sum, p) => sum + p.completedActivities, 0)}
              </div>
              <div className="text-sm text-muted-foreground">الأنشطة المكتملة</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-500">
                {Math.max(...leaderboard.players.map(p => p.streakDays), 0)}
              </div>
              <div className="text-sm text-muted-foreground">أطول سلسلة</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-500">
                {leaderboard.totalPlayers}
              </div>
              <div className="text-sm text-muted-foreground">الطلاب النشطين</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Leaderboard;