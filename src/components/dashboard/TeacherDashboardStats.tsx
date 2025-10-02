import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, Users, BookOpen, Calendar, TrendingUp, TrendingDown, Minus, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';
interface TeacherStats {
  totalClasses: number;
  totalStudents: number;
  availableContents: number;
  upcomingEvents: number;
  onlineStudents?: number;
}
interface TeacherStatsCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  color: string;
  loading?: boolean;
  delay?: number;
  isClickable?: boolean;
  hasChart?: boolean;
  onCardClick?: () => void;
}
const TeacherStatsCard: React.FC<TeacherStatsCardProps> = ({
  title,
  value,
  icon: Icon,
  change,
  color,
  loading = false,
  delay = 0,
  isClickable = false,
  hasChart = false,
  onCardClick
}) => {
  if (loading) {
    return <Card className="modern-card glass-card hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-muted animate-pulse rounded"></div>
              <div className="h-8 bg-muted animate-pulse rounded w-16"></div>
            </div>
            <div className="h-12 w-12 bg-muted animate-pulse rounded-xl"></div>
          </div>
        </CardContent>
      </Card>;
  }
  const getChangeIcon = () => {
    if (!change) return null;
    switch (change.type) {
      case 'increase':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'decrease':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };
  const getChangeColor = () => {
    if (!change) return '';
    switch (change.type) {
      case 'increase':
        return 'text-green-600';
      case 'decrease':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };
  return <Card className={cn("modern-card glass-card card-hover group relative overflow-hidden", "animate-fade-in-up transition-all duration-300 hover:shadow-xl", isClickable && "cursor-pointer hover:scale-[1.02]")} style={{
    animationDelay: `${delay}ms`
  }} onClick={isClickable ? onCardClick : undefined}>
      <div className={cn("absolute inset-0 opacity-5 bg-gradient-to-br", color)} />
      
      <CardContent className="p-6 relative">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-muted-foreground">
                {title}
              </p>
              {isClickable && <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <div className="w-1 h-1 rounded-full bg-amber-500"></div>
                  <div className="w-0.5 h-0.5 rounded-full bg-muted-foreground/50"></div>
                </div>}
            </div>
            <div className="space-y-1">
              <p className={cn("text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent", color)}>
                {value}
              </p>
              {change && <div className="flex items-center gap-1 text-xs">
                  {getChangeIcon()}
                  <span className={getChangeColor()}>
                    {change.value > 0 ? '+' : ''}{change.value}
                  </span>
                </div>}
              {hasChart}
            </div>
          </div>
          
          <div className={cn("p-3 rounded-xl shadow-lg icon-glow", "bg-gradient-to-br transition-transform group-hover:scale-110", color.replace('text-', 'from-').replace('-600', '-500'), color.replace('text-', 'to-').replace('-600', '-600'))}>
            <Icon className="h-6 w-6 text-white icon-bounce" />
          </div>
        </div>
        
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 rounded-full bg-primary/20 accent-dot"></div>
        </div>
        
        {isClickable && <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="text-xs text-muted-foreground/70 flex items-center gap-1">
              <span>انقر للتفاصيل</span>
              <div className="w-1 h-1 rounded-full bg-primary/60"></div>
            </div>
          </div>}
      </CardContent>
    </Card>;
};
interface TeacherDashboardStatsProps {
  stats: TeacherStats;
  loading?: boolean;
  refreshing?: boolean;
  error?: string;
  onRefresh?: () => void;
  onOnlineStudentsClick?: () => void;
}
export const TeacherDashboardStats: React.FC<TeacherDashboardStatsProps> = ({
  stats,
  loading = false,
  refreshing = false,
  error,
  onRefresh,
  onOnlineStudentsClick
}) => {
  const statsCards = [{
    title: 'صفوفي الدراسية',
    value: stats.totalClasses.toString(),
    icon: GraduationCap,
    color: 'from-blue-500 to-blue-600 text-blue-600',
    change: undefined
  }, {
    title: 'إجمالي الطلاب',
    value: stats.totalStudents.toString(),
    icon: Users,
    color: 'from-green-500 to-green-600 text-green-600',
    change: undefined
  }, {
    title: 'المتواجدون الآن',
    value: (stats.onlineStudents || 0).toString(),
    icon: Wifi,
    color: 'from-emerald-500 to-emerald-600 text-emerald-600',
    change: stats.onlineStudents && stats.onlineStudents > 0 ? {
      value: stats.onlineStudents,
      type: 'increase' as const
    } : undefined,
    isClickable: true,
    hasChart: true
  }, {
    title: 'المضامين المتاحة',
    value: stats.availableContents.toString(),
    icon: BookOpen,
    color: 'from-purple-500 to-purple-600 text-purple-600',
    change: undefined
  }, {
    title: 'الأحداث القادمة',
    value: stats.upcomingEvents.toString(),
    icon: Calendar,
    color: 'from-orange-500 to-orange-600 text-orange-600',
    change: undefined
  }];
  if (error) {
    return <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium text-destructive">خطأ في تحميل الإحصائيات</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            {onRefresh && <button onClick={onRefresh} className="text-sm text-primary hover:underline" disabled={refreshing}>
                {refreshing ? 'جاري التحديث...' : 'إعادة المحاولة'}
              </button>}
          </div>
        </CardContent>
      </Card>;
  }
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {statsCards.map((stat, index) => <TeacherStatsCard key={stat.title} title={stat.title} value={stat.value} icon={stat.icon} change={stat.change} color={stat.color} loading={loading} delay={index * 100} isClickable={stat.isClickable} hasChart={stat.hasChart} onCardClick={stat.title === 'المتواجدون الآن' ? onOnlineStudentsClick : undefined} />)}
    </div>;
};
export default TeacherDashboardStats;