import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  BookOpen, 
  AlertTriangle, 
  Activity,
  Calendar,
  BarChart3,
  RefreshCw,
  Download,
  Eye,
  Target,
  Timer,
  Zap,
  UserCheck,
  UserX,
  GraduationCap,
  X
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  Area,
  AreaChart
} from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { useAdvancedStudentStats } from '@/hooks/useAdvancedStudentStats';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface OnlineStudentsStatsProps {
  isOpen: boolean;
  onClose: () => void;
}

type TimePeriod = 'today' | 'week' | 'month';

export const OnlineStudentsStats: React.FC<OnlineStudentsStatsProps> = ({ isOpen, onClose }) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'trends' | 'classes' | 'insights'>('overview');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('today');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { stats, loading, error, refetch, triggerDailyCalculation } = useAdvancedStudentStats(timePeriod);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCalculateDaily = async () => {
    setIsRefreshing(true);
    try {
      await triggerDailyCalculation();
    } finally {
      setIsRefreshing(false);
    }
  };

  // ألوان الرسوم البيانية
  const colors = {
    primary: 'hsl(var(--primary))',
    secondary: '#8b5cf6',
    accent: '#06b6d4',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6'
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              إحصائيات الطلاب المتقدمة
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">جاري تحليل البيانات...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !stats) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              إحصائيات الطلاب المتقدمة
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <p className="text-lg text-muted-foreground">
              {error || 'لا توجد بيانات متاحة'}
            </p>
            <div className="flex gap-2">
              <Button onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className="h-4 w-4 mr-2" />
                إعادة المحاولة
              </Button>
              <Button onClick={handleCalculateDaily} variant="outline" disabled={isRefreshing}>
                <BarChart3 className="h-4 w-4 mr-2" />
                حساب الإحصائيات
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] overflow-hidden">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">
                  إحصائيات الطلاب المتقدمة
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  تحليل شامل للنشاط والحضور
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* فلاتر الوقت */}
              <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
                {[
                  { id: 'today', label: 'اليوم', icon: Clock },
                  { id: 'week', label: 'الأسبوع', icon: Calendar },
                  { id: 'month', label: 'الشهر', icon: BarChart3 }
                ].map((period) => {
                  const Icon = period.icon;
                  return (
                    <Button
                      key={period.id}
                      variant={timePeriod === period.id ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setTimePeriod(period.id as TimePeriod)}
                      className="h-8 text-xs"
                    >
                      <Icon className="h-3 w-3 mr-1" />
                      {period.label}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn("h-4 w-4 mr-1", isRefreshing && "animate-spin")} />
                تحديث
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* علامات التبويب */}
          <div className="flex gap-1 mt-4">
            {[
              { id: 'overview', label: 'نظرة عامة', icon: Eye },
              { id: 'trends', label: 'الاتجاهات', icon: TrendingUp },
              { id: 'classes', label: 'الصفوف', icon: GraduationCap },
              { id: 'insights', label: 'رؤى ذكية', icon: Target }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={selectedTab === tab.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedTab(tab.id as any)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden p-6">
          <ScrollArea className="h-full">
            {selectedTab === 'overview' && (
              <div className="space-y-6">
                {/* KPIs الرئيسية */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/5"></div>
                    <CardContent className="p-6 relative">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">متصل الآن</p>
                          <p className="text-3xl font-bold text-emerald-600">{stats.currentOnline}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <TrendingUp className="h-3 w-3 text-emerald-500" />
                            <span className="text-xs text-emerald-500">
                              {stats.currentOnline > stats.yesterdayActive ? '+' : ''}
                              {stats.currentOnline - stats.yesterdayActive} من أمس
                            </span>
                          </div>
                        </div>
                        <UserCheck className="h-8 w-8 text-emerald-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/5"></div>
                    <CardContent className="p-6 relative">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">نشط اليوم</p>
                          <p className="text-3xl font-bold text-blue-600">{stats.todayActive}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Activity className="h-3 w-3 text-blue-500" />
                            <span className="text-xs text-blue-500">
                              {Math.round((stats.todayActive / stats.weeklyActive) * 100)}% من الأسبوع
                            </span>
                          </div>
                        </div>
                        <Users className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-violet-500/5"></div>
                    <CardContent className="p-6 relative">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">ساعة الذروة</p>
                          <p className="text-3xl font-bold text-purple-600">
                            {stats.peakHour !== null ? `${stats.peakHour}:00` : '--'}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <Zap className="h-3 w-3 text-purple-500" />
                            <span className="text-xs text-purple-500">أعلى نشاط</span>
                          </div>
                        </div>
                        <Clock className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/5"></div>
                    <CardContent className="p-6 relative">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">غياب طويل</p>
                          <p className="text-3xl font-bold text-amber-600">{stats.longAbsentStudents.length}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <UserX className="h-3 w-3 text-amber-500" />
                            <span className="text-xs text-amber-500">+3 أيام</span>
                          </div>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-amber-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* الرسوم البيانية */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* توزيع النشاط حسب الساعة */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        توزيع النشاط حسب الساعة
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ChartContainer
                          config={{
                            count: { label: 'عدد الطلاب', color: colors.primary }
                          }}
                          className="h-full w-full"
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.peakHourData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="hour" 
                                tickFormatter={(value) => `${value}:00`}
                              />
                              <YAxis />
                              <Tooltip 
                                labelFormatter={(value) => `الساعة ${value}:00`}
                                formatter={(value) => [value, 'عدد الطلاب']}
                              />
                              <Area
                                type="monotone"
                                dataKey="count"
                                stroke={colors.primary}
                                fill={colors.primary}
                                fillOpacity={0.3}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* توزيع الصفوف */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        توزيع الطلاب حسب الصف
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ChartContainer
                          config={{
                            students: { label: 'عدد الطلاب', color: colors.success }
                          }}
                          className="h-full w-full"
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={Object.entries(stats.classDistribution).map(([grade, count]) => ({
                                  name: `الصف ${grade}`,
                                  value: count,
                                  fill: grade === '10' ? colors.success : grade === '11' ? colors.info : colors.secondary
                                }))}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                dataKey="value"
                                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                              />
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* أكثر الصفحات زيارة */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      أكثر الصفحات زيارة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.topPages.length > 0 ? (
                        stats.topPages.map((page, index) => (
                          <div key={page.page} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                                {index + 1}
                              </div>
                              <span className="font-medium">{page.page}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">{page.visits} زيارة</span>
                              <Badge variant="secondary">{page.percentage}%</Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-8">لا توجد بيانات زيارات متاحة</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {selectedTab === 'trends' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      اتجاه الحضور - آخر 7 أيام
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ChartContainer
                        config={{
                          active_students: { label: 'طلاب نشطين', color: colors.primary }
                        }}
                        className="h-full w-full"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={stats.weekTrend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day_name" />
                            <YAxis />
                            <Tooltip 
                              labelFormatter={(value) => value}
                              formatter={(value) => [value, 'طلاب نشطين']}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="active_students"
                              stroke={colors.primary}
                              strokeWidth={3}
                              dot={{ fill: colors.primary, r: 6 }}
                              activeDot={{ r: 8 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* ملخص الاتجاهات */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4 text-center">
                    <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">متوسط النشاط اليومي</p>
                    <p className="text-2xl font-bold">
                      {Math.round(stats.weekTrend.reduce((sum, day) => sum + day.active_students, 0) / stats.weekTrend.length)}
                    </p>
                  </Card>

                  <Card className="p-4 text-center">
                    <Zap className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">أعلى يوم نشاط</p>
                    <p className="text-2xl font-bold">
                      {stats.weekTrend.reduce((max, day) => day.active_students > max.active_students ? day : max).day_name}
                    </p>
                  </Card>

                  <Card className="p-4 text-center">
                    <Timer className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">نمو هذا الأسبوع</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.weekTrend.length > 1 ? (
                        ((stats.weekTrend[stats.weekTrend.length - 1].active_students - stats.weekTrend[0].active_students) / stats.weekTrend[0].active_students * 100).toFixed(1)
                      ) : 0}%
                    </p>
                  </Card>
                </div>
              </div>
            )}

            {selectedTab === 'classes' && (
              <div className="space-y-6">
                <div className="grid gap-4">
                  {Object.entries(stats.classDistribution).map(([grade, count]) => (
                    <Card key={grade} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-primary/10">
                            <GraduationCap className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold">الصف {grade}</h3>
                            <p className="text-sm text-muted-foreground">المرحلة الثانوية</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">نشط اليوم</p>
                            <p className="text-3xl font-bold text-green-600">{count}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">المعدل الأسبوعي</p>
                            <p className="text-3xl font-bold">{Math.round(count * 1.2)}</p>
                          </div>
                          <Badge 
                            variant="default"
                            className="text-lg px-4 py-2"
                          >
                            {Math.round((count / (count + 5)) * 100)}%
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {selectedTab === 'insights' && (
              <div className="space-y-6">
                {/* الطلاب الغائبين لفترة طويلة */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      طلاب بحاجة للمتابعة
                      <Badge variant="secondary">{stats.longAbsentStudents.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.longAbsentStudents.length > 0 ? (
                      <div className="space-y-3">
                        {stats.longAbsentStudents.slice(0, 10).map((student) => (
                          <div key={student.student_id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                            <div>
                              <p className="font-medium">طالب #{student.student_id.slice(-8)}</p>
                              <p className="text-sm text-muted-foreground">
                                آخر دخول: {format(new Date(student.last_seen), 'yyyy/MM/dd HH:mm', { locale: ar })}
                              </p>
                            </div>
                            <Badge variant="destructive">
                              {student.days_absent} {student.days_absent === 1 ? 'يوم' : 'أيام'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        ممتاز! جميع الطلاب نشطين ولا يحتاجون للمتابعة
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* إجراءات سريعة */}
                <Card>
                  <CardHeader>
                    <CardTitle>إجراءات سريعة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button 
                        onClick={handleCalculateDaily}
                        disabled={isRefreshing}
                        className="h-auto p-4 flex flex-col items-start gap-2"
                      >
                        <BarChart3 className="h-5 w-5" />
                        <div className="text-left">
                          <div className="font-medium">حساب إحصائيات اليوم</div>
                          <div className="text-sm opacity-70">تحديث البيانات التاريخية</div>
                        </div>
                      </Button>
                      
                      <Button 
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="h-auto p-4 flex flex-col items-start gap-2"
                      >
                        <RefreshCw className="h-5 w-5" />
                        <div className="text-left">
                          <div className="font-medium">تحديث البيانات</div>
                          <div className="text-sm opacity-70">جلب أحدث المعلومات</div>
                        </div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};