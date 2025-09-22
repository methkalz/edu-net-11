import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Trophy, 
  BarChart3, 
  Database, 
  RefreshCw, 
  Shield, 
  Clock,
  TrendingUp,
  Target,
  Activity
} from 'lucide-react';

interface GameSpecificStats {
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

interface Game {
  id: string;
  name: string;
  grade_level: string;
  subject: string;
  is_active: boolean;
}

interface GameStatsCardProps {
  game: Game;
  stats: GameSpecificStats;
  loading?: boolean;
}

export const GameStatsCard = ({ game, stats, loading }: GameStatsCardProps) => {
  const getGradeColor = (gradeLevel: string) => {
    switch (gradeLevel) {
      case '10': return 'text-green-500';
      case '11': return 'text-blue-500';
      case '12': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };

  const getSubjectIcon = (subject: string) => {
    switch (subject.toLowerCase()) {
      case 'networks': return '🌐';
      case 'programming': return '💻';
      case 'security': return '🔒';
      case 'databases': return '🗄️';
      default: return '📖';
    }
  };

  const statsItems = [
    {
      icon: Users,
      value: stats.totalUsers,
      label: 'المستخدمين النشطين',
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      icon: BarChart3,
      value: stats.totalProgress,
      label: 'سجلات التقدم',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      icon: Trophy,
      value: stats.totalGames,
      label: 'ألعاب المطابقة',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10'
    },
    {
      icon: Database,
      value: stats.totalSessions,
      label: 'جلسات اللعب',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      icon: RefreshCw,
      value: stats.totalResults,
      label: 'النتائج المسجلة',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      icon: Shield,
      value: stats.playersThisWeek || 0,
      label: 'لاعبين هذا الأسبوع',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    }
  ];

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getSubjectIcon(game.subject)}</span>
            <span>{game.name}</span>
          </div>
          <div className="flex gap-2">
            <Badge variant="default" className={getGradeColor(game.grade_level)}>
              صف {game.grade_level}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {game.subject}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {statsItems.map((item, index) => (
            <div 
              key={index}
              className={`p-3 rounded-lg border ${item.bgColor} border-current/20`}
            >
              <div className="flex items-center justify-between">
                <item.icon className={`h-4 w-4 ${item.color}`} />
                <div className={`text-xl font-bold ${item.color}`}>
                  {item.value.toLocaleString()}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-tight">
                {item.label}
              </p>
            </div>
          ))}
        </div>

        {/* Additional Metrics */}
        {(stats.activeUsers !== undefined || stats.completionRate !== undefined || stats.averageScore !== undefined) && (
          <div className="border-t pt-3 mt-3">
            <div className="grid grid-cols-3 gap-3">
              {stats.activeUsers !== undefined && (
                <div className="text-center p-2 bg-muted/20 rounded">
                  <Activity className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
                  <div className="text-sm font-semibold text-emerald-500">
                    {stats.activeUsers}
                  </div>
                  <p className="text-xs text-muted-foreground">نشطين اليوم</p>
                </div>
              )}
              
              {stats.completionRate !== undefined && (
                <div className="text-center p-2 bg-muted/20 rounded">
                  <Target className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                  <div className="text-sm font-semibold text-blue-500">
                    {stats.completionRate}%
                  </div>
                  <p className="text-xs text-muted-foreground">معدل الإكمال</p>
                </div>
              )}
              
              {stats.averageScore !== undefined && (
                <div className="text-center p-2 bg-muted/20 rounded">
                  <TrendingUp className="h-4 w-4 text-violet-500 mx-auto mb-1" />
                  <div className="text-sm font-semibold text-violet-500">
                    {stats.averageScore}
                  </div>
                  <p className="text-xs text-muted-foreground">متوسط النقاط</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="text-center pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            إجمالي البيانات المخزنة: {' '}
            <span className="font-semibold text-foreground">
              {Object.values(stats).reduce((sum, val) => 
                typeof val === 'number' ? sum + val : sum, 0
              ).toLocaleString()}
            </span>
            {' '} سجل
          </p>
        </div>
      </CardContent>
    </Card>
  );
};