import { FC, useState, useMemo } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TeacherPresenceData } from '@/hooks/useTeacherPresence';
import { formatRelativeTime, formatDuration } from '@/lib/dateUtils';
import { ArrowUpDown, Wifi, WifiOff, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TeacherActivityTableProps {
  teachers: TeacherPresenceData[];
}

type SortField = 'full_name' | 'last_seen_at' | 'total_time_minutes' | 'login_count';
type SortDirection = 'asc' | 'desc';

export const TeacherActivityTable: FC<TeacherActivityTableProps> = ({ teachers }) => {
  const [sortField, setSortField] = useState<SortField>('last_seen_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedTeachers = useMemo(() => {
    const sorted = [...teachers].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'last_seen_at') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [teachers, sortField, sortDirection]);

  const SortButton: FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-8 hover:bg-background/50 rounded-xl"
    >
      {children}
      <ArrowUpDown className="h-3 w-3 mr-2" />
    </Button>
  );

  if (teachers.length === 0) {
    return (
      <Card className="backdrop-blur-xl bg-background/50 border border-border/50 rounded-2xl p-12 text-center">
        <User className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground">لا توجد بيانات لعرضها</p>
      </Card>
    );
  }

  return (
    <Card className="backdrop-blur-xl bg-background/50 border border-border/50 rounded-2xl overflow-hidden">
      <ScrollArea className="h-[500px]">
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground">
            <div className="col-span-4">
              <SortButton field="full_name">المعلم</SortButton>
            </div>
            <div className="col-span-2 text-center">الحالة</div>
            <div className="col-span-2 text-center">
              <SortButton field="last_seen_at">آخر تواجد</SortButton>
            </div>
            <div className="col-span-2 text-center">
              <SortButton field="total_time_minutes">الوقت الكلي</SortButton>
            </div>
            <div className="col-span-2 text-center">
              <SortButton field="login_count">التسجيلات</SortButton>
            </div>
          </div>

          {/* Rows */}
          {sortedTeachers.map((teacher) => (
            <div
              key={teacher.id}
              className="grid grid-cols-12 gap-4 items-center p-4 rounded-2xl backdrop-blur-sm bg-background/30 border border-border/30 hover:border-border/50 hover:bg-background/50 transition-all duration-300"
            >
              {/* المعلم */}
              <div className="col-span-4 flex items-center gap-3">
                <Avatar className="h-10 w-10 backdrop-blur-sm bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                  <AvatarFallback className="text-sm font-semibold">
                    {teacher.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{teacher.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{teacher.email}</p>
                  <p className="text-xs text-muted-foreground/70 truncate">{teacher.school_name}</p>
                </div>
              </div>

              {/* الحالة */}
              <div className="col-span-2 flex justify-center">
                {teacher.is_online ? (
                  <Badge className="backdrop-blur-sm bg-emerald-500/20 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/30 rounded-xl">
                    <Wifi className="h-3 w-3 ml-1" />
                    متصل
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="backdrop-blur-sm bg-muted/30 border-muted/30 rounded-xl">
                    <WifiOff className="h-3 w-3 ml-1" />
                    غير متصل
                  </Badge>
                )}
              </div>

              {/* آخر تواجد */}
              <div className="col-span-2 text-center">
                <p className="text-sm">{formatRelativeTime(teacher.last_seen_at)}</p>
              </div>

              {/* الوقت الكلي */}
              <div className="col-span-2 text-center">
                <Badge variant="outline" className="backdrop-blur-sm bg-background/30 border-border/30 rounded-xl">
                  {formatDuration(teacher.total_time_minutes)}
                </Badge>
              </div>

              {/* التسجيلات */}
              <div className="col-span-2 text-center">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl backdrop-blur-sm bg-primary/10 border border-primary/20 font-bold text-sm">
                  {teacher.login_count}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};
