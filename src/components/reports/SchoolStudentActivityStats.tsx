import { FC, useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StudentPresenceReportData } from '@/hooks/useStudentPresenceForReports';

interface SchoolStudentActivityStatsProps {
  students: StudentPresenceReportData[];
}

interface SchoolStats {
  schoolId: string;
  schoolName: string;
  totalStudents: number;
  onlineStudents: number;
  last24hStudents: number;
  activityRate: number;
}

export const SchoolStudentActivityStats: FC<SchoolStudentActivityStatsProps> = ({ students }) => {
  const schoolStats = useMemo(() => {
    const statsMap = new Map<string, SchoolStats>();
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    students.forEach(student => {
      const existing = statsMap.get(student.school_id);
      const lastSeenTime = new Date(student.last_seen_at).getTime();
      const isLast24h = (now - lastSeenTime) < twentyFourHours;
      
      if (existing) {
        existing.totalStudents++;
        if (student.is_online) existing.onlineStudents++;
        if (isLast24h) existing.last24hStudents++;
      } else {
        statsMap.set(student.school_id, {
          schoolId: student.school_id,
          schoolName: student.school_name,
          totalStudents: 1,
          onlineStudents: student.is_online ? 1 : 0,
          last24hStudents: isLast24h ? 1 : 0,
          activityRate: 0,
        });
      }
    });

    // حساب معدل النشاط
    statsMap.forEach(school => {
      school.activityRate = school.totalStudents > 0 
        ? (school.last24hStudents / school.totalStudents) * 100 
        : 0;
    });

    return Array.from(statsMap.values());
  }, [students]);

  // أكثر المدارس نشاطاً
  const mostActiveSchools = useMemo(() => {
    return [...schoolStats]
      .sort((a, b) => b.activityRate - a.activityRate)
      .slice(0, 3);
  }, [schoolStats]);

  // أقل المدارس نشاطاً
  const leastActiveSchools = useMemo(() => {
    return [...schoolStats]
      .sort((a, b) => a.activityRate - b.activityRate)
      .slice(0, 3);
  }, [schoolStats]);

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
                    <div className="w-8 h-8 rounded-xl backdrop-blur-sm bg-muted/30 border border-border/30 flex items-center justify-center font-bold text-sm text-muted-foreground">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{school.schoolName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs backdrop-blur-sm bg-muted text-muted-foreground border-border/30 rounded-lg">
                          {school.totalStudents} طالب
                        </Badge>
                        {school.onlineStudents > 0 && (
                          <Badge className="text-xs backdrop-blur-sm bg-emerald-500/20 text-emerald-700 border-emerald-500/30 rounded-lg">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
                            {school.onlineStudents}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-bold text-emerald-600">
                      {school.activityRate.toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground">معدل النشاط</p>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-3 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${school.activityRate}%` }}
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
                          {school.totalStudents} طالب
                        </Badge>
                        {school.onlineStudents > 0 && (
                          <Badge className="text-xs backdrop-blur-sm bg-emerald-500/20 text-emerald-700 border-emerald-500/30 rounded-lg">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
                            {school.onlineStudents}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-bold text-orange-600">
                      {school.activityRate.toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground">معدل النشاط</p>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-3 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-500"
                    style={{ width: `${school.activityRate}%` }}
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
