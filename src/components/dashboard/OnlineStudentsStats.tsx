import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Wifi, 
  WifiOff, 
  Clock, 
  Users, 
  TrendingUp, 
  Activity,
  X,
  Timer,
  BookOpen,
  GraduationCap,
  BarChart3,
  Eye
} from 'lucide-react';
import { useStudentPresence } from '@/hooks/useStudentPresence';
import { cn } from '@/lib/utils';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface OnlineStudentsStatsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnlineStudentsStats: React.FC<OnlineStudentsStatsProps> = ({
  isOpen,
  onClose
}) => {
  const {
    onlineStudents,
    recentlyLeftStudents,
    allVisibleStudents,
    actualOnlineCount,
    totalVisibleCount,
    classes,
    loading,
    refreshing,
    lastUpdated
  } = useStudentPresence();

  const [selectedTab, setSelectedTab] = useState<'overview' | 'classes' | 'activity'>('overview');

  // إحصائيات العرض الرئيسي
  const stats = useMemo(() => {
    const classDistribution = classes.map(cls => {
      const studentsInClass = allVisibleStudents.filter(s => 
        s.class_info?.class_name === cls.name
      );
      const onlineInClass = studentsInClass.filter(s => s.is_online);
      
      return {
        name: cls.name,
        grade: cls.grade_level,
        total: studentsInClass.length,
        online: onlineInClass.length,
        offline: studentsInClass.length - onlineInClass.length,
        percentage: studentsInClass.length > 0 ? Math.round((onlineInClass.length / studentsInClass.length) * 100) : 0
      };
    }).filter(cls => cls.total > 0);

    const totalActiveStudents = actualOnlineCount + recentlyLeftStudents.length;
    const onlinePercentage = totalActiveStudents > 0 ? Math.round((actualOnlineCount / totalActiveStudents) * 100) : 0;

    // بيانات اتجاه النشاط (مُحاكاة - يمكن ربطها ببيانات حقيقية)
    const activityTrend = Array.from({ length: 7 }, (_, i) => ({
      day: format(new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000), 'EEE', { locale: ar }),
      online: Math.floor(Math.random() * actualOnlineCount * 1.5) + actualOnlineCount * 0.5,
      total: Math.floor(Math.random() * totalVisibleCount * 1.2) + totalVisibleCount * 0.8
    }));

    return {
      classDistribution,
      onlinePercentage,
      activityTrend,
      avgResponseTime: '2.3', // مُحاكاة
      peakHour: '10:30 ص' // مُحاكاة
    };
  }, [actualOnlineCount, recentlyLeftStudents.length, allVisibleStudents, classes, totalVisibleCount]);

  const statusColors = {
    online: '#10b981',
    offline: '#ef4444',
    recent: '#f59e0b'
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
        <Card className="w-full max-w-4xl mx-4 shadow-2xl animate-scale-in">
          <CardContent className="p-8">
            <div className="flex items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="mr-3 text-muted-foreground">جاري التحميل...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-6xl mx-4 h-[85vh] shadow-2xl animate-scale-in backdrop-blur-xl bg-white/95 dark:bg-black/95 border border-white/20">
        <CardHeader className="border-b bg-gradient-to-r from-emerald-50/50 to-blue-50/50 dark:from-emerald-950/50 dark:to-blue-950/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 backdrop-blur-sm">
                <Activity className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  إحصائيات الطلاب المتواجدين
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  آخر تحديث: {lastUpdated ? format(lastUpdated, 'HH:mm:ss', { locale: ar }) : 'غير متوفر'}
                  {refreshing && (
                    <span className="mr-2 inline-flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-xs">يتم التحديث...</span>
                    </span>
                  )}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full hover:bg-red-500/10 hover:text-red-500"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* علامات التبويب */}
          <div className="flex gap-1 mt-4">
            {[
              { id: 'overview', label: 'نظرة عامة', icon: Eye },
              { id: 'classes', label: 'الصفوف', icon: GraduationCap },
              { id: 'activity', label: 'النشاط', icon: BarChart3 }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={selectedTab === tab.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 transition-all duration-200",
                    selectedTab === tab.id && "bg-primary/10 text-primary border-primary/20"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </Button>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="p-6 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            {selectedTab === 'overview' && (
              <div className="space-y-6">
                {/* البطاقات الرئيسية */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="p-4 bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">متصل الآن</p>
                        <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{actualOnlineCount}</p>
                      </div>
                      <Wifi className="h-8 w-8 text-emerald-600" />
                    </div>
                  </Card>

                  <Card className="p-4 bg-gradient-to-br from-amber-50/50 to-amber-100/30 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">غادر حديثاً</p>
                        <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">{recentlyLeftStudents.length}</p>
                      </div>
                      <Timer className="h-8 w-8 text-amber-600" />
                    </div>
                  </Card>

                  <Card className="p-4 bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">إجمالي نشط</p>
                        <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{totalVisibleCount}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                  </Card>

                  <Card className="p-4 bg-gradient-to-br from-purple-50/50 to-purple-100/30 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">نسبة الحضور</p>
                        <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{stats.onlinePercentage}%</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-purple-600" />
                    </div>
                  </Card>
                </div>

                {/* الرسم البياني الدائري */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      توزيع الحالات
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'متصل', value: actualOnlineCount, fill: statusColors.online },
                              { name: 'غادر حديثاً', value: recentlyLeftStudents.length, fill: statusColors.recent }
                            ]}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {[
                              { fill: statusColors.online },
                              { fill: statusColors.recent }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      اتجاه النشاط الأسبوعي
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats.activityTrend}>
                          <XAxis dataKey="day" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line 
                            type="monotone" 
                            dataKey="online" 
                            stroke={statusColors.online} 
                            strokeWidth={3}
                            dot={{ fill: statusColors.online, r: 4 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="total" 
                            stroke={statusColors.recent} 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {selectedTab === 'classes' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  توزيع الطلاب حسب الصفوف
                </h3>
                
                <div className="h-80 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.classDistribution}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="online" fill={statusColors.online} name="متصل" />
                      <Bar dataKey="offline" fill={statusColors.recent} name="غير متصل" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid gap-4">
                  {stats.classDistribution.map((cls) => (
                    <Card key={cls.name} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <BookOpen className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{cls.name}</h4>
                            <p className="text-sm text-muted-foreground">{cls.grade}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">متصل</p>
                            <p className="text-xl font-bold text-emerald-600">{cls.online}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">الإجمالي</p>
                            <p className="text-xl font-bold">{cls.total}</p>
                          </div>
                          <Badge 
                            variant={cls.percentage > 70 ? 'default' : cls.percentage > 40 ? 'secondary' : 'destructive'}
                            className="text-xs"
                          >
                            {cls.percentage}%
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {selectedTab === 'activity' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  تحليل النشاط
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4 text-center bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/30 dark:to-blue-900/20">
                    <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">متوسط وقت الاستجابة</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.avgResponseTime}s</p>
                  </Card>

                  <Card className="p-4 text-center bg-gradient-to-br from-purple-50/50 to-purple-100/30 dark:from-purple-950/30 dark:to-purple-900/20">
                    <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">ذروة النشاط</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.peakHour}</p>
                  </Card>

                  <Card className="p-4 text-center bg-gradient-to-br from-green-50/50 to-green-100/30 dark:from-green-950/30 dark:to-green-900/20">
                    <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">معدل التفاعل</p>
                    <p className="text-2xl font-bold text-green-600">94%</p>
                  </Card>
                </div>

                {/* الطلاب المتواجدون حالياً */}
                {allVisibleStudents.length > 0 && (
                  <Card className="p-4">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      الطلاب النشطون ({allVisibleStudents.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                      {allVisibleStudents.slice(0, 12).map((student) => (
                        <div key={student.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border">
                          <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-bold text-primary">
                                {student.student.full_name.charAt(0)}
                              </span>
                            </div>
                            <div className={cn(
                              "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background",
                              student.is_online ? "bg-emerald-500" : "bg-amber-500"
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{student.student.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {student.class_info?.class_name || 'غير محدد'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};