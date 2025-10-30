import { FC, useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { TeacherPresenceData } from '@/hooks/useTeacherPresence';
import { formatRelativeTime, formatDuration } from '@/lib/dateUtils';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TeacherActivityTableProps {
  teachers: TeacherPresenceData[];
}

type SortField = 'full_name' | 'last_seen_at' | 'total_time_minutes' | 'login_count';
type SortDirection = 'asc' | 'desc';

export const TeacherActivityTable: FC<TeacherActivityTableProps> = ({ teachers }) => {
  const [sortField, setSortField] = useState<SortField>('last_seen_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortButton: FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-auto p-0 hover:bg-transparent"
    >
      {children}
      <ArrowUpDown className="mr-2 h-4 w-4" />
    </Button>
  );

  if (teachers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">لا توجد بيانات لعرضها</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">المعلم</TableHead>
            <TableHead className="text-right">الدور</TableHead>
            <TableHead className="text-right">الحالة</TableHead>
            <TableHead className="text-right">
              <SortButton field="last_seen_at">آخر تواجد</SortButton>
            </TableHead>
            <TableHead className="text-right">
              <SortButton field="total_time_minutes">إجمالي الوقت</SortButton>
            </TableHead>
            <TableHead className="text-right">
              <SortButton field="login_count">عدد التسجيلات</SortButton>
            </TableHead>
            <TableHead className="text-right">آخر صفحة</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTeachers.map((teacher) => (
            <TableRow key={teacher.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {teacher.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{teacher.full_name}</p>
                    <p className="text-sm text-muted-foreground">{teacher.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={teacher.role === 'school_admin' ? 'default' : 'secondary'}>
                  {teacher.role === 'teacher' ? 'معلم' : 'مدير مدرسة'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${teacher.is_online ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-sm">
                    {teacher.is_online ? 'متصل' : 'غير متصل'}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {formatRelativeTime(teacher.last_seen_at)}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm font-medium">
                  {formatDuration(teacher.total_time_minutes)}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm">{teacher.login_count} مرة</span>
              </TableCell>
              <TableCell>
                <span className="text-xs text-muted-foreground">
                  {teacher.current_page || '-'}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
