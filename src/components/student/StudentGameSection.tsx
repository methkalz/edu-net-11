import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Gamepad2, 
  Trophy, 
  Star, 
  Target, 
  Zap,
  Play,
  Crown,
  Award,
  Brain,
  Puzzle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const StudentGameSection: React.FC = () => {
  const navigate = useNavigate();

  const games = [
    {
      id: 'pair-matching',
      title: 'لعبة المطابقة',
      description: 'اطبق المصطلحات مع تعريفاتها واجمع النقاط',
      icon: Puzzle,
      difficulty: 'سهل',
      points: '5-15 نقطة',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50',
      path: '/pair-matching',
      category: 'شبكات'
    },
    {
      id: 'quiz-challenge',
      title: 'تحدي الأسئلة',
      description: 'اختبر معلوماتك في أسئلة متنوعة',
      icon: Brain,
      difficulty: 'متوسط',
      points: '10-25 نقطة',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-50 to-emerald-50',
      path: '/quiz-challenge',
      category: 'عام'
    },
    {
      id: 'knowledge-adventure',
      title: 'مغامرة المعرفة',
      description: 'استكشف عالم التقنية في رحلة تعليمية ممتعة',
      icon: Crown,
      difficulty: 'صعب',
      points: '20-50 نقطة',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-50 to-pink-50',
      path: '/knowledge-adventure',
      category: 'تفاعلي'
    }
  ];

  const achievements = [
    { name: 'نجم الألعاب', description: 'أكمل 10 ألعاب', icon: Star, earned: true },
    { name: 'بطل المطابقة', description: 'احصل على نقاط كاملة في المطابقة', icon: Trophy, earned: true },
    { name: 'عبقري الأسئلة', description: 'أجب على 50 سؤال بشكل صحيح', icon: Brain, earned: false },
    { name: 'مستكشف المعرفة', description: 'أكمل مغامرة المعرفة', icon: Crown, earned: false }
  ];

  const leaderboard = [
    { rank: 1, name: 'أحمد محمد', points: 1250, avatar: '👑' },
    { rank: 2, name: 'فاطمة علي', points: 1180, avatar: '🥈' },
    { rank: 3, name: 'يوسف أحمد', points: 1050, avatar: '🥉' },
    { rank: 4, name: 'أنت', points: 890, avatar: '⭐', isCurrentUser: true },
    { rank: 5, name: 'نور الدين', points: 820, avatar: '🎯' }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'سهل': return 'text-green-600 bg-green-100';
      case 'متوسط': return 'text-yellow-600 bg-yellow-100';
      case 'صعب': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white border-0 overflow-hidden relative">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full animate-float"></div>
          <div className="absolute bottom-4 left-4 w-16 h-16 bg-yellow-400/20 rounded-full animate-bounce-slow"></div>
          <div className="absolute top-1/2 left-1/2 w-12 h-12 bg-pink-400/20 rounded-full animate-wiggle"></div>
        </div>
        
        <CardContent className="p-8 relative">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4">
              <Gamepad2 className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold">مركز الألعاب التعليمية</h2>
            <p className="text-xl opacity-90">تعلم واستمتع واجمع النقاط!</p>
            <div className="flex justify-center gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold">890</div>
                <div className="text-sm opacity-80">نقاطك</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">24</div>
                <div className="text-sm opacity-80">ألعاب مكتملة</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">4</div>
                <div className="text-sm opacity-80">ترتيبك</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => {
          const IconComponent = game.icon;
          
          return (
            <Card 
              key={game.id}
              className={`bg-gradient-to-br ${game.bgColor} border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer overflow-hidden relative`}
              onClick={() => navigate(game.path)}
            >
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                <div className={`w-full h-full rounded-full bg-gradient-to-br ${game.color} transform translate-x-12 -translate-y-12`}></div>
              </div>
              
              <CardHeader className="relative">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${game.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <Badge className={getDifficultyColor(game.difficulty)}>
                    {game.difficulty}
                  </Badge>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {game.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4 relative">
                <p className="text-muted-foreground">
                  {game.description}
                </p>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-yellow-600">
                    <Star className="w-4 h-4" />
                    <span>{game.points}</span>
                  </div>
                  <Badge variant="outline">
                    {game.category}
                  </Badge>
                </div>
                
                <Button className="w-full group-hover:scale-105 transition-transform duration-200">
                  <Play className="w-4 h-4 mr-2" />
                  ابدأ اللعب
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-600" />
              الإنجازات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {achievements.map((achievement, index) => {
              const IconComponent = achievement.icon;
              
              return (
                <div 
                  key={achievement.name}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                    achievement.earned 
                      ? 'bg-yellow-50 border-yellow-200' 
                      : 'bg-gray-50 border-gray-200 opacity-70'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    achievement.earned 
                      ? 'bg-yellow-100 text-yellow-600' 
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{achievement.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {achievement.description}
                    </p>
                  </div>
                  {achievement.earned && (
                    <Badge className="bg-yellow-100 text-yellow-700">
                      مكتمل
                    </Badge>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-600" />
              لوحة المتصدرين
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {leaderboard.map((player) => (
              <div 
                key={player.rank}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                  player.isCurrentUser 
                    ? 'bg-primary/10 border-primary/20 ring-2 ring-primary/20' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="text-2xl">{player.avatar}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{player.name}</span>
                    {player.isCurrentUser && (
                      <Badge variant="outline" className="text-xs">
                        أنت
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {player.points.toLocaleString()} نقطة
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">
                    #{player.rank}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};