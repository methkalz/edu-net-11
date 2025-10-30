import { FC, useMemo } from 'react';
import { Users, Clock, TrendingUp, Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { TeacherPresenceData } from '@/hooks/useTeacherPresence';
import { isWithinLast24Hours, isWithinLast30Days, calculateAverageTime, formatDuration } from '@/lib/dateUtils';

interface TeacherActivityStatsProps {
  teachers: TeacherPresenceData[];
}

export const TeacherActivityStats: FC<TeacherActivityStatsProps> = ({ teachers }) => {
  const stats = useMemo(() => {
    const onlineNow = teachers.filter(t => t.is_online).length;
    const last24Hours = teachers.filter(t => {
      const loginDate = t.last_login_at;
      if (!loginDate) return false;
      return isWithinLast24Hours(loginDate);
    }).length;
    const last30Days = teachers.filter(t => {
      const loginDate = t.last_login_at;
      if (!loginDate) return false;
      return isWithinLast30Days(loginDate);
    }).length;
    const activeTeachers = teachers.filter(t => t.login_count > 0);
    const avgTime = calculateAverageTime(activeTeachers.map(t => t.total_time_minutes));
    
    const totalTeachers = teachers.length;
    const onlinePercentage = totalTeachers > 0 ? Math.round((onlineNow / totalTeachers) * 100) : 0;
    const last24HoursPercentage = totalTeachers > 0 ? Math.round((last24Hours / totalTeachers) * 100) : 0;
    const last30DaysPercentage = totalTeachers > 0 ? Math.round((last30Days / totalTeachers) * 100) : 0;

    return [
      {
        title: 'المتواجدين الآن',
        value: onlineNow,
        percentage: onlinePercentage,
        icon: Activity,
        gradient: 'from-emerald-500/20 to-emerald-500/5',
        iconColor: 'text-emerald-600',
        textColor: 'text-emerald-600',
      },
      {
        title: 'نشطين آخر 24 ساعة',
        value: last24Hours,
        percentage: last24HoursPercentage,
        icon: Clock,
        gradient: 'from-blue-500/20 to-blue-500/5',
        iconColor: 'text-blue-600',
        textColor: 'text-blue-600',
      },
      {
        title: 'نشطين آخر 30 يوم',
        value: last30Days,
        percentage: last30DaysPercentage,
        icon: TrendingUp,
        gradient: 'from-purple-500/20 to-purple-500/5',
        iconColor: 'text-purple-600',
        textColor: 'text-purple-600',
      },
      {
        title: 'متوسط الوقت اليومي',
        value: formatDuration(avgTime),
        icon: Users,
        gradient: 'from-orange-500/20 to-orange-500/5',
        iconColor: 'text-orange-600',
        textColor: 'text-orange-600',
      },
    ];
  }, [teachers]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card 
          key={index} 
          className="group relative overflow-hidden backdrop-blur-xl bg-background/50 border border-border/50 hover:border-border hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 rounded-2xl p-5"
        >
          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground/80 mb-2 font-medium">{stat.title}</p>
              <p className="text-3xl font-bold mb-1">
                {stat.value}
              </p>
              {stat.percentage !== undefined && (
                <div className="flex items-center gap-2 mt-2">
                  <div className={`h-1.5 flex-1 bg-muted/30 rounded-full overflow-hidden`}>
                    <div 
                      className={`h-full bg-gradient-to-r ${stat.gradient} transition-all duration-500`}
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>
                  <span className={`text-xs font-bold ${stat.textColor}`}>
                    {stat.percentage}%
                  </span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-2xl backdrop-blur-sm bg-gradient-to-br ${stat.gradient} border border-border/30 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
            </div>
          </div>
          
          {/* Gradient overlay */}
          <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
        </Card>
      ))}
    </div>
  );
};
