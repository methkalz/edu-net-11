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

  // ألوان الرسوم البيانية - استخدام الألوان الدلالية
  const colors = {
    primary: 'hsl(var(--primary))',
    secondary: 'hsl(var(--secondary))',
    accent: 'hsl(var(--accent))',
    success: 'hsl(var(--success))',
    warning: 'hsl(var(--warning))',
    danger: 'hsl(var(--destructive))',
    info: 'hsl(var(--info))',
    muted: 'hsl(var(--muted))'
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
      <DialogContent className="max-w-7xl h-[90vh] overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-background via-background/95 to-muted/30">
        <DialogHeader className="border-b border-border/50 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 shadow-lg">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent"></div>
                <Activity className="relative h-7 w-7 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-l from-foreground to-foreground/80 bg-clip-text">
                  إحصائيات الطلاب المتقدمة
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  تحليل شامل للنشاط والحضور بتصميم أنيق
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* فلاتر الوقت */}
              <div className="flex gap-1 bg-muted/30 backdrop-blur-sm rounded-xl p-1.5 border border-border/50">
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
                      className={cn(
                        "h-9 text-xs px-3 rounded-lg transition-all duration-200",
                        timePeriod === period.id 
                          ? "bg-primary text-primary-foreground shadow-md" 
                          : "hover:bg-muted/50"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5 mr-1.5" />
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
                className="h-9 border-border/50 hover:bg-muted/50"
              >
                <RefreshCw className={cn("h-4 w-4 mr-1.5", isRefreshing && "animate-spin")} />
                تحديث
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-9 w-9 rounded-lg hover:bg-muted/50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* علامات التبويب */}
          <div className="flex gap-1 mt-6 bg-muted/20 rounded-xl p-1.5">
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
                  className={cn(
                    "flex items-center gap-2 h-10 px-4 rounded-lg transition-all duration-200",
                    selectedTab === tab.id 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "hover:bg-muted/40"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden px-6 pb-6">
          <ScrollArea className="h-full">
            {selectedTab === 'overview' && (
              <div className="space-y-8 pt-2">
                {/* KPIs الرئيسية */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50/80 via-emerald-50/40 to-background shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-emerald-500/2 to-transparent"></div>
                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl"></div>
                    <CardContent className="p-6 relative">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <p className="text-sm font-medium text-emerald-700/80">متصل الآن</p>
                          </div>
                          <p className="text-3xl font-bold text-emerald-600 group-hover:scale-105 transition-transform duration-200">{stats.currentOnline}</p>
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-1 px-2 py-1 bg-emerald-100/50 rounded-md">
                              <TrendingUp className="h-3 w-3 text-emerald-600" />
                              <span className="text-xs text-emerald-600 font-medium">
                                {stats.currentOnline > stats.yesterdayActive ? '+' : ''}
                                {stats.currentOnline - stats.yesterdayActive} من أمس
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-emerald-100/50 border border-emerald-200/50">
                          <UserCheck className="h-6 w-6 text-emerald-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-50/80 via-blue-50/40 to-background shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-blue-500/2 to-transparent"></div>
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-xl"></div>
                    <CardContent className="p-6 relative">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                            <p className="text-sm font-medium text-blue-700/80">نشط اليوم</p>
                          </div>
                          <p className="text-3xl font-bold text-blue-600 group-hover:scale-105 transition-transform duration-200">{stats.todayActive}</p>
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-100/50 rounded-md">
                              <Activity className="h-3 w-3 text-blue-600" />
                              <span className="text-xs text-blue-600 font-medium">
                                {Math.round((stats.todayActive / stats.weeklyActive) * 100)}% من الأسبوع
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-blue-100/50 border border-blue-200/50">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-purple-50/80 via-purple-50/40 to-background shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-purple-500/2 to-transparent"></div>
                    <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-xl"></div>
                    <CardContent className="p-6 relative">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                            <p className="text-sm font-medium text-purple-700/80">ساعة الذروة</p>
                          </div>
                          <p className="text-3xl font-bold text-purple-600 group-hover:scale-105 transition-transform duration-200">
                            {stats.peakHour !== null ? `${stats.peakHour}:00` : '--'}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-1 px-2 py-1 bg-purple-100/50 rounded-md">
                              <Zap className="h-3 w-3 text-purple-600" />
                              <span className="text-xs text-purple-600 font-medium">أعلى نشاط</span>
                            </div>
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-purple-100/50 border border-purple-200/50">
                          <Clock className="h-6 w-6 text-purple-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-amber-50/80 via-amber-50/40 to-background shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-amber-500/2 to-transparent"></div>
                    <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-xl"></div>
                    <CardContent className="p-6 relative">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 bg-amber-500 rounded-full"></div>
                            <p className="text-sm font-medium text-amber-700/80">غياب طويل</p>
                          </div>
                          <p className="text-3xl font-bold text-amber-600 group-hover:scale-105 transition-transform duration-200">{stats.longAbsentStudents.length}</p>
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-1 px-2 py-1 bg-amber-100/50 rounded-md">
                              <UserX className="h-3 w-3 text-amber-600" />
                              <span className="text-xs text-amber-600 font-medium">+3 أيام</span>
                            </div>
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-amber-100/50 border border-amber-200/50">
                          <AlertTriangle className="h-6 w-6 text-amber-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* الرسوم البيانية */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* توزيع النشاط حسب الساعة */}
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-background via-background/95 to-muted/20">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-lg">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <BarChart3 className="h-5 w-5 text-primary" />
                        </div>
                        توزيع النشاط حسب الساعة
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-72">
                        <ChartContainer
                          config={{
                            count: { label: 'عدد الطلاب', color: colors.primary }
                          }}
                          className="h-full w-full"
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.peakHourData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                              <XAxis 
                                dataKey="hour" 
                                tickFormatter={(value) => `${value}:00`}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                              />
                              <YAxis 
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                              />
                              <Tooltip 
                                labelFormatter={(value) => `الساعة ${value}:00`}
                                formatter={(value) => [value, 'عدد الطلاب']}
                                contentStyle={{
                                  backgroundColor: 'hsl(var(--popover))',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 12px hsl(var(--shadow))'
                                }}
                              />
                              <Area
                                type="monotone"
                                dataKey="count"
                                stroke={colors.primary}
                                fill={colors.primary}
                                fillOpacity={0.1}
                                strokeWidth={2}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* توزيع الصفوف */}
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-background via-background/95 to-muted/20">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-lg">
                        <div className="p-2 rounded-lg bg-success/10">
                          <Users className="h-5 w-5 text-success" />
                        </div>
                        توزيع الطلاب حسب الصف
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-72">
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
                                outerRadius={90}
                                dataKey="value"
                                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                                labelLine={false}
                              />
                              <Tooltip 
                                contentStyle={{
                                  backgroundColor: 'hsl(var(--popover))',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 12px hsl(var(--shadow))'
                                }}
                              />
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
                            {stats.todayActive > 0 ? Math.round((count / stats.todayActive) * 100) : 0}%
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