import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Users, BookOpen, GraduationCap, FileText, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'stable';
  color?: string;
  loading?: boolean;
  delay?: number;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  changeType = 'stable', 
  color = 'primary',
  loading = false,
  delay = 0 
}) => {
  if (loading) {
    return (
      <Card className="glass-card animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-4 w-24" />
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = () => {
    switch (changeType) {
      case 'increase':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'decrease':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getChangeColor = () => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600 bg-green-50';
      case 'decrease':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-yellow-600 bg-yellow-50';
    }
  };

  const getIconColor = () => {
    const colorMap: Record<string, string> = {
      primary: 'text-primary',
      secondary: 'text-secondary',
      orange: 'text-orange-500',
      purple: 'text-purple-500',
      green: 'text-green-500',
      blue: 'text-blue-500'
    };
    return colorMap[color] || 'text-primary';
  };

  return (
    <Card className="glass-card card-hover animate-scale-hover animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Icon className={`h-8 w-8 ${getIconColor()} icon-glow icon-bounce`} />
          {change !== undefined && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getChangeColor()}`}>
              {getTrendIcon()}
              <span>{Math.abs(change)}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-gradient mb-2">
          {value.toLocaleString('en-US')}
        </div>
        <p className="text-muted-foreground text-sm">{title}</p>
      </CardContent>
    </Card>
  );
};

interface EnhancedDashboardStatsProps {
  stats: {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    activeClasses: number;
    archivedClasses: number;
    activePlugins: number;
    totalPlugins: number;
  };
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  onRefresh: () => void;
}

export const EnhancedDashboardStats: React.FC<EnhancedDashboardStatsProps> = ({
  stats,
  loading,
  refreshing,
  error,
  onRefresh
}) => {
  const statsConfig = [
    {
      title: 'إجمالي الطلاب',
      value: stats.totalStudents,
      icon: Users,
      color: 'primary',
      change: Math.floor(Math.random() * 20) + 1,
      changeType: 'increase' as const
    },
    {
      title: 'إجمالي المعلمين',
      value: stats.totalTeachers,
      icon: GraduationCap,
      color: 'blue',
      change: Math.floor(Math.random() * 5) + 1,
      changeType: 'increase' as const
    },
    {
      title: 'إجمالي الصفوف',
      value: stats.totalClasses,
      icon: BookOpen,
      color: 'orange',
      change: Math.floor(Math.random() * 3),
      changeType: stats.activeClasses > stats.archivedClasses ? 'increase' as const : 'stable' as const
    },
    {
      title: 'الإضافات النشطة',
      value: stats.activePlugins,
      icon: FileText,
      color: 'purple',
      change: Math.floor(Math.random() * 2),
      changeType: 'stable' as const
    }
  ];

  return (
    <section className="animate-fade-in-up">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold font-cairo text-foreground">📊 الإحصائيات</h2>
          <div className="accent-dot mr-3 animate-gentle-float"></div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsConfig.map((stat, index) => (
          <StatsCard
            key={stat.title}
            {...stat}
            loading={loading}
            delay={index * 100}
          />
        ))}
      </div>
    </section>
  );
};

export default EnhancedDashboardStats;