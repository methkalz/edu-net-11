import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, GraduationCap, TrendingUp, Clock } from 'lucide-react';
import { formatNumber } from '@/utils/dateFormatting';

interface SchoolStats {
  school_id: string;
  school_name: string;
  city: string;
  total_students: number;
  total_teachers: number;
}

interface ActivityTrend {
  date: string;
  total_active_students: number;
  total_active_teachers: number;
  school_name: string;
}

interface Props {
  schools: SchoolStats[];
  trends: ActivityTrend[];
}

export const ActivityStats = ({ schools, trends }: Props) => {
  const activityStats = useMemo(() => {
    // حساب نشاط آخر 7 أيام
    const last7Days = trends.filter(t => {
      const date = new Date(t.date);
      const now = new Date();
      const diff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    });

    // حساب نشاط آخر 30 يوم
    const last30Days = trends.filter(t => {
      const date = new Date(t.date);
      const now = new Date();
      const diff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 30;
    });

    // مجموع الطلاب النشطين في آخر 7 أيام
    const activeStudents7d = last7Days.reduce((sum, t) => sum + t.total_active_students, 0);
    // مجموع المعلمين النشطين في آخر 7 أيام
    const activeTeachers7d = last7Days.reduce((sum, t) => sum + (t.total_active_teachers || 0), 0);
    
    // مجموع الطلاب النشطين في آخر 30 يوم
    const activeStudents30d = last30Days.reduce((sum, t) => sum + t.total_active_students, 0);
    // مجموع المعلمين النشطين في آخر 30 يوم
    const activeTeachers30d = last30Days.reduce((sum, t) => sum + (t.total_active_teachers || 0), 0);

    // متوسط النشاط اليومي
    const avgDaily7d = last7Days.length > 0 ? Math.round(activeStudents7d / last7Days.length) : 0;
    const avgDaily30d = last30Days.length > 0 ? Math.round(activeStudents30d / last30Days.length) : 0;
    
    const avgTeachers7d = last7Days.length > 0 ? Math.round(activeTeachers7d / last7Days.length) : 0;
    const avgTeachers30d = last30Days.length > 0 ? Math.round(activeTeachers30d / last30Days.length) : 0;

    // المدارس النشطة
    const activeSchools = new Set(last7Days.map(t => t.school_name)).size;

    return {
      activeStudents7d,
      activeStudents30d,
      activeTeachers7d,
      activeTeachers30d,
      avgDaily7d,
      avgDaily30d,
      avgTeachers7d,
      avgTeachers30d,
      activeSchools,
      totalSchools: schools.length,
    };
  }, [schools, trends]);

  return (
    <div className="space-y-6">
      {/* بطاقات النشاط */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">نشاط الطلاب - 7 أيام</p>
                <h3 className="text-2xl font-bold">{formatNumber(activityStats.activeStudents7d)}</h3>
                <p className="text-xs text-muted-foreground">
                  متوسط {formatNumber(activityStats.avgDaily7d)} طالب/يوم
                </p>
              </div>
              <div className="rounded-full p-3 bg-gradient-to-br from-blue-500 to-cyan-500">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">نشاط المعلمين - 7 أيام</p>
                <h3 className="text-2xl font-bold">{formatNumber(activityStats.activeTeachers7d)}</h3>
                <p className="text-xs text-muted-foreground">
                  متوسط {formatNumber(activityStats.avgTeachers7d)} معلم/يوم
                </p>
              </div>
              <div className="rounded-full p-3 bg-gradient-to-br from-green-500 to-emerald-500">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">نشاط الطلاب - 30 يوم</p>
                <h3 className="text-2xl font-bold">{formatNumber(activityStats.activeStudents30d)}</h3>
                <p className="text-xs text-muted-foreground">
                  متوسط {formatNumber(activityStats.avgDaily30d)} طالب/يوم
                </p>
              </div>
              <div className="rounded-full p-3 bg-gradient-to-br from-purple-500 to-pink-500">
                <Users className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">المدارس النشطة</p>
                <h3 className="text-2xl font-bold">{formatNumber(activityStats.activeSchools)}</h3>
                <p className="text-xs text-muted-foreground">
                  من أصل {formatNumber(activityStats.totalSchools)} مدرسة
                </p>
              </div>
              <div className="rounded-full p-3 bg-gradient-to-br from-orange-500 to-red-500">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* أكثر المدارس نشاطاً */}
      <Card>
        <CardHeader>
          <CardTitle>أكثر المدارس نشاطاً (آخر 7 أيام)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(
              trends
                .filter(t => {
                  const date = new Date(t.date);
                  const now = new Date();
                  const diff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
                  return diff <= 7;
                })
                .reduce((acc, t) => {
                  if (!acc[t.school_name]) {
                    acc[t.school_name] = 0;
                  }
                  acc[t.school_name] += t.total_active_students;
                  return acc;
                }, {} as Record<string, number>)
            )
              .sort(([, a], [, b]) => b - a)
              .slice(0, 10)
              .map(([schoolName, count], index) => (
                <div key={schoolName} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <span className="font-medium">{schoolName}</span>
                  </div>
                  <div className="text-left">
                    <p className="font-bold">{formatNumber(count)}</p>
                    <p className="text-xs text-muted-foreground">طالب نشط</p>
                  </div>
                </div>
              ))}
            {trends.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                لا توجد بيانات نشاط متاحة
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
