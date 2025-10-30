import { FC, useMemo } from 'react';
import { School, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { TeacherPresenceData } from '@/hooks/useTeacherPresence';

interface SchoolActivityStatsProps {
  teachers: TeacherPresenceData[];
}

interface SchoolStats {
  schoolId: string;
  schoolName: string;
  totalTeachers: number;
  onlineTeachers: number;
  totalMinutes: number;
  averageMinutesPerTeacher: number;
}

export const SchoolActivityStats: FC<SchoolActivityStatsProps> = ({ teachers }) => {
  const schoolStats = useMemo(() => {
    const statsMap = new Map<string, SchoolStats>();

    teachers.forEach(teacher => {
      const existing = statsMap.get(teacher.school_id);
      
      if (existing) {
        existing.totalTeachers++;
        if (teacher.is_online) existing.onlineTeachers++;
        existing.totalMinutes += teacher.total_time_minutes;
        existing.averageMinutesPerTeacher = existing.totalMinutes / existing.totalTeachers;
      } else {
        statsMap.set(teacher.school_id, {
          schoolId: teacher.school_id,
          schoolName: teacher.school_name,
          totalTeachers: 1,
          onlineTeachers: teacher.is_online ? 1 : 0,
          totalMinutes: teacher.total_time_minutes,
          averageMinutesPerTeacher: teacher.total_time_minutes,
        });
      }
    });

    return Array.from(statsMap.values());
  }, [teachers]);

  // أكثر المدارس نشاطاً (حسب متوسط الوقت لكل معلم)
  const mostActiveSchools = useMemo(() => {
    return [...schoolStats]
      .sort((a, b) => b.averageMinutesPerTeacher - a.averageMinutesPerTeacher)
      .slice(0, 3);
  }, [schoolStats]);

  // أقل المدارس نشاطاً
  const leastActiveSchools = useMemo(() => {
    return [...schoolStats]
      .sort((a, b) => a.averageMinutesPerTeacher - b.averageMinutesPerTeacher)
      .slice(0, 3);
  }, [schoolStats]);

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)} دقيقة`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours} ساعة و ${mins} دقيقة`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      {/* أكثر المدارس نشاطاً */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold text-lg">أكثر المدارس نشاطاً</h3>
        </div>
        <div className="space-y-3">
          {mostActiveSchools.length > 0 ? (
            mostActiveSchools.map((school, index) => (
              <div key={school.schoolId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-gray-100 text-gray-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{school.schoolName}</p>
                    <p className="text-xs text-muted-foreground">
                      {school.totalTeachers} معلم ({school.onlineTeachers} متصل الآن)
                    </p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-green-600">
                    {formatMinutes(school.averageMinutesPerTeacher)}
                  </p>
                  <p className="text-xs text-muted-foreground">متوسط/معلم</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات</p>
          )}
        </div>
      </Card>

      {/* أقل المدارس نشاطاً */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="h-5 w-5 text-orange-600" />
          <h3 className="font-semibold text-lg">أقل المدارس نشاطاً</h3>
        </div>
        <div className="space-y-3">
          {leastActiveSchools.length > 0 ? (
            leastActiveSchools.map((school, index) => (
              <div key={school.schoolId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{school.schoolName}</p>
                    <p className="text-xs text-muted-foreground">
                      {school.totalTeachers} معلم ({school.onlineTeachers} متصل الآن)
                    </p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-orange-600">
                    {formatMinutes(school.averageMinutesPerTeacher)}
                  </p>
                  <p className="text-xs text-muted-foreground">متوسط/معلم</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات</p>
          )}
        </div>
      </Card>
    </div>
  );
};
