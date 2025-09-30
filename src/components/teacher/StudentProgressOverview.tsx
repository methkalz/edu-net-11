/**
 * Student Progress Overview Component
 * عرض قائمة الطلاب مع معلومات التقدم
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeacherStudentTracking } from '@/hooks/useTeacherStudentTracking';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  Users,
  TrendingUp,
  Award,
  RefreshCw,
  Eye,
  CircleDot,
  Clock,
  Trophy,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const StudentProgressOverview: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('');
  const [onlineOnly, setOnlineOnly] = useState(false);

  const { students, loading, quickStats, refetch } = useTeacherStudentTracking({
    searchQuery,
    gradeLevel: gradeFilter,
    onlineOnly
  });

  const handleViewDetails = (studentId: string) => {
    navigate(`/student-detail/${studentId}`);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <span className="mr-3 text-lg">جاري تحميل بيانات الطلاب...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* إحصائيات سريعة */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الطلاب</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickStats.totalStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متصل الآن</CardTitle>
            <CircleDot className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {quickStats.onlineStudents}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نشط اليوم</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {quickStats.activeToday}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط الإنجاز</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {quickStats.averageCompletion}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي النقاط</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {quickStats.totalPoints.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* فلاتر وبحث */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            قائمة الطلاب
          </CardTitle>
          <CardDescription>
            تتبع تقدم الطلاب المخصصين لك بالتفصيل
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-wrap gap-4">
            {/* بحث */}
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث بالاسم أو اسم المستخدم أو البريد..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>

            {/* فلتر الصف */}
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="كل الصفوف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">كل الصفوف</SelectItem>
                <SelectItem value="عاشر">الصف العاشر</SelectItem>
                <SelectItem value="حادي عشر">الصف الحادي عشر</SelectItem>
                <SelectItem value="ثاني عشر">الصف الثاني عشر</SelectItem>
              </SelectContent>
            </Select>

            {/* فلتر المتصلين */}
            <Button
              variant={onlineOnly ? 'default' : 'outline'}
              onClick={() => setOnlineOnly(!onlineOnly)}
              className="gap-2"
            >
              <CircleDot className="h-4 w-4" />
              المتصلون فقط
            </Button>

            {/* تحديث */}
            <Button variant="outline" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              تحديث
            </Button>
          </div>

          {/* جدول الطلاب */}
          {students.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">لا يوجد طلاب مطابقين للفلاتر المحددة</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الطالب</TableHead>
                    <TableHead className="text-right">الصف</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">النقاط</TableHead>
                    <TableHead className="text-right">نسبة الإنجاز</TableHead>
                    <TableHead className="text-right">الأنشطة</TableHead>
                    <TableHead className="text-right">آخر نشاط</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map(student => (
                    <TableRow key={student.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <div className="font-medium">{student.full_name}</div>
                          <div className="text-sm text-muted-foreground">
                            @{student.username}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{student.grade_level}</div>
                          <div className="text-xs text-muted-foreground">
                            {student.class_name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.is_online ? (
                          <Badge variant="default" className="gap-1">
                            <CircleDot className="h-3 w-3" />
                            متصل
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <CircleDot className="h-3 w-3" />
                            غير متصل
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Trophy className="h-4 w-4 text-yellow-500" />
                          <span className="font-semibold">
                            {student.total_points.toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{student.completion_percentage}%</span>
                          </div>
                          <Progress
                            value={student.completion_percentage}
                            className="h-2"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-1">
                            📹 {student.progress_summary.videos_watched}
                            <span className="text-muted-foreground">فيديو</span>
                          </div>
                          <div className="flex items-center gap-1">
                            📄 {student.progress_summary.documents_read}
                            <span className="text-muted-foreground">مستند</span>
                          </div>
                          <div className="flex items-center gap-1">
                            🎮 {student.progress_summary.games_played}
                            <span className="text-muted-foreground">لعبة</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.last_activity_at ? (
                          <div className="text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {format(new Date(student.last_activity_at), 'PPp', {
                                locale: ar
                              })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            لا يوجد نشاط
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(student.id)}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          التفاصيل
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentProgressOverview;
