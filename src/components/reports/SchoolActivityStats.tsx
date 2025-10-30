import { FC, useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

  // أكثر المدارس نشاطاً
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
    return `${hours}س ${mins}د`;
  };

  const getMedalEmoji = (index: number) => {
    return ['🥇', '🥈', '🥉'][index] || '🏅';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* أكثر المدارس نشاطاً */}
      <Card className="backdrop-blur-xl bg-background/50 border border-border/50 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl backdrop-blur-sm bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
          <h3 className="font-bold text-lg">أكثر المدارس نشاطاً</h3>
        </div>
        <div className="space-y-3">
          {mostActiveSchools.length > 0 ? (
            mostActiveSchools.map((school, index) => (
              <div 
                key={school.schoolId} 
                className="group relative overflow-hidden p-4 rounded-2xl backdrop-blur-sm bg-background/30 border border-border/30 hover:border-border/50 hover:bg-background/50 transition-all duration-300"
              >
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-8 h-8 rounded-xl backdrop-blur-sm flex items-center justify-center font-bold text-sm border ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                      index === 1 ? 'bg-gray-100 text-gray-700 border-gray-300' :
                      'bg-orange-100 text-orange-700 border-orange-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{school.schoolName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs backdrop-blur-sm bg-muted text-muted-foreground border-border/30 rounded-lg">
                          {school.totalTeachers} معلم
                        </Badge>
                        {school.onlineTeachers > 0 && (
                          <Badge className="text-xs backdrop-blur-sm bg-emerald-500/20 text-emerald-700 border-emerald-500/30 rounded-lg">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
                            {school.onlineTeachers}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-bold text-emerald-600">
                      {formatMinutes(school.averageMinutesPerTeacher)}
                    </p>
                    <p className="text-xs text-muted-foreground">متوسط/معلم</p>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-3 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                    style={{ 
                      width: `${Math.min((school.averageMinutesPerTeacher / Math.max(...mostActiveSchools.map(s => s.averageMinutesPerTeacher))) * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">لا توجد بيانات</p>
          )}
        </div>
      </Card>

      {/* أقل المدارس نشاطاً */}
      <Card className="backdrop-blur-xl bg-background/50 border border-border/50 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl backdrop-blur-sm bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/20">
            <TrendingDown className="h-5 w-5 text-orange-600" />
          </div>
          <h3 className="font-bold text-lg">أقل المدارس نشاطاً</h3>
        </div>
        <div className="space-y-3">
          {leastActiveSchools.length > 0 ? (
            leastActiveSchools.map((school, index) => (
              <div 
                key={school.schoolId} 
                className="group relative overflow-hidden p-4 rounded-2xl backdrop-blur-sm bg-background/30 border border-border/30 hover:border-border/50 hover:bg-background/50 transition-all duration-300"
              >
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-xl backdrop-blur-sm bg-muted/30 border border-border/30 flex items-center justify-center font-bold text-sm text-muted-foreground">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{school.schoolName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs backdrop-blur-sm bg-muted text-muted-foreground border-border/30 rounded-lg">
                          {school.totalTeachers} معلم
                        </Badge>
                        {school.onlineTeachers > 0 && (
                          <Badge className="text-xs backdrop-blur-sm bg-emerald-500/20 text-emerald-700 border-emerald-500/30 rounded-lg">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
                            {school.onlineTeachers}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-bold text-orange-600">
                      {formatMinutes(school.averageMinutesPerTeacher)}
                    </p>
                    <p className="text-xs text-muted-foreground">متوسط/معلم</p>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-3 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-500"
                    style={{ 
                      width: `${Math.min((school.averageMinutesPerTeacher / Math.max(...leastActiveSchools.map(s => s.averageMinutesPerTeacher))) * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">لا توجد بيانات</p>
          )}
        </div>
      </Card>
    </div>
  );
};
