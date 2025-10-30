import { FC } from 'react';
import { Users, Clock, TrendingUp, Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { TeacherPresenceData } from '@/hooks/useTeacherPresence';
import { isWithinLast24Hours, isWithinLast30Days, calculateAverageTime, formatDuration } from '@/lib/dateUtils';

interface TeacherActivityStatsProps {
  teachers: TeacherPresenceData[];
}

export const TeacherActivityStats: FC<TeacherActivityStatsProps> = ({ teachers }) => {
  console.log('📊 TeacherActivityStats - Total teachers:', teachers.length);
  
  // المتواجدين الآن فقط
  const onlineNow = teachers.filter(t => t.is_online).length;
  console.log('✅ Online now:', onlineNow);
  
  // آخر 24 ساعة: يجب أن يكون لديهم last_login_at خلال آخر 24 ساعة
  const last24Hours = teachers.filter(t => {
    // نستخدم last_login_at بدلاً من last_seen_at للدقة
    const loginDate = t.last_login_at;
    if (!loginDate) return false; // لم يسجل دخول أبداً
    return isWithinLast24Hours(loginDate);
  }).length;
  console.log('🕐 Last 24 hours (based on login):', last24Hours);
  
  // آخر 30 يوم: يجب أن يكون لديهم last_login_at خلال آخر 30 يوم
  const last30Days = teachers.filter(t => {
    // نستخدم last_login_at بدلاً من last_seen_at للدقة
    const loginDate = t.last_login_at;
    if (!loginDate) return false; // لم يسجل دخول أبداً
    return isWithinLast30Days(loginDate);
  }).length;
  console.log('📅 Last 30 days (based on login):', last30Days);
  
  // متوسط الوقت فقط للمعلمين النشطين (الذين لديهم login_count > 0)
  const activeTeachers = teachers.filter(t => t.login_count > 0);
  const avgTime = calculateAverageTime(activeTeachers.map(t => t.total_time_minutes));
  console.log('⏱️ Average time (active teachers only):', avgTime, 'minutes');
  
  const totalTeachers = teachers.length;
  const onlinePercentage = totalTeachers > 0 ? Math.round((onlineNow / totalTeachers) * 100) : 0;
  const last24HoursPercentage = totalTeachers > 0 ? Math.round((last24Hours / totalTeachers) * 100) : 0;
  const last30DaysPercentage = totalTeachers > 0 ? Math.round((last30Days / totalTeachers) * 100) : 0;

  const stats = [
    {
      title: 'المتواجدين الآن',
      value: onlineNow,
      percentage: onlinePercentage,
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'نشطين آخر 24 ساعة',
      value: last24Hours,
      percentage: last24HoursPercentage,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'نشطين آخر 30 يوم',
      value: last30Days,
      percentage: last30DaysPercentage,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'متوسط الوقت اليومي',
      value: formatDuration(avgTime),
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <Card key={index} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
              <p className="text-2xl font-bold">
                {typeof stat.value === 'number' ? stat.value : stat.value}
              </p>
              {stat.percentage !== undefined && (
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.percentage}% من الإجمالي
                </p>
              )}
            </div>
            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
