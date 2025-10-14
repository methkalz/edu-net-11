import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Search, 
  Users, 
  CheckCircle, 
  Clock,
  AlertCircle,
  Eye,
  MessageSquare,
  Calendar,
  BarChart3,
  TrendingUp,
  MessageCircle,
  ArrowRight,
  RefreshCw,
  Target,
  Activity
} from 'lucide-react';
import { useTeacherProjects } from '@/hooks/useTeacherProjects';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import ModernHeader from '@/components/shared/ModernHeader';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const Grade12ProjectsManagement: React.FC = () => {
  const navigate = useNavigate();
  const { projects, quickStats, loading, grade12ProjectsCount } = useTeacherProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'draft':
        return <FileText className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'مكتمل';
      case 'in_progress':
        return 'قيد التنفيذ';
      case 'draft':
        return 'مسودة';
      default:
        return 'غير محدد';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'in_progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'draft':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    }
  };

  // فلترة المشاريع
  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.student_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // إحصائيات حالات المشاريع للرسم البياني
  const statusDistribution = [
    { name: 'قيد التنفيذ', value: projects.filter(p => p.status === 'in_progress').length, color: '#3b82f6' },
    { name: 'مكتملة', value: projects.filter(p => p.status === 'completed').length, color: '#10b981' },
    { name: 'مسودة', value: projects.filter(p => p.status === 'draft').length, color: '#6b7280' },
  ].filter(item => item.value > 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <ModernHeader title="مشاريع الصف الثاني عشر" />
        <div className="container mx-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-muted rounded-2xl"></div>
            <div className="h-64 bg-muted rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader title="مشاريع الصف الثاني عشر" />
      
      <div className="container mx-auto p-6 space-y-6">

        {/* الإحصائيات الرئيسية */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium">إجمالي المشاريع</p>
                  <p className="text-4xl font-bold text-foreground">{grade12ProjectsCount}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    <span>مشاريع التخرج</span>
                  </div>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center ring-1 ring-blue-500/20">
                  <FileText className="h-7 w-7 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium">مشاريع مكتملة</p>
                  <p className="text-4xl font-bold text-foreground">{quickStats.completedProjects}</p>
                  <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <CheckCircle className="h-3 w-3" />
                    <span>{quickStats.completedProjects > 0 ? `${((quickStats.completedProjects / grade12ProjectsCount) * 100).toFixed(0)}% من الإجمالي` : 'لا توجد مشاريع مكتملة'}</span>
                  </div>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-500/20">
                  <CheckCircle className="h-7 w-7 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium">تعليقات جديدة</p>
                  <p className="text-4xl font-bold text-foreground">{quickStats.unreadCommentsTotal}</p>
                  <div className="flex items-center gap-1 text-xs text-orange-600 font-medium">
                    <MessageCircle className="h-3 w-3" />
                    <span>{quickStats.unreadCommentsTotal > 0 ? 'تحتاج للمراجعة' : 'لا توجد تعليقات جديدة'}</span>
                  </div>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center ring-1 ring-orange-500/20">
                  <MessageCircle className="h-7 w-7 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium">متوسط الإنجاز</p>
                  <p className="text-4xl font-bold text-foreground">{quickStats.averageCompletion}%</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Progress value={quickStats.averageCompletion} className="h-1.5 flex-1" />
                  </div>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center ring-1 ring-violet-500/20">
                  <Target className="h-7 w-7 text-violet-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* الرسوم البيانية والتحليلات */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* توزيع حالات المشاريع */}
          <Card className="lg:col-span-1 border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-primary" />
                توزيع حالات المشاريع
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  لا توجد بيانات
                </div>
              )}
              <div className="mt-4 space-y-2">
                {statusDistribution.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* إحصائيات إضافية */}
          <Card className="lg:col-span-2 border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-primary" />
                نظرة عامة على الأداء
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>قيد التنفيذ</span>
                  </div>
                  <p className="text-3xl font-bold">{projects.filter(p => p.status === 'in_progress').length}</p>
                  <Progress 
                    value={(projects.filter(p => p.status === 'in_progress').length / grade12ProjectsCount) * 100} 
                    className="h-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>مسودات</span>
                  </div>
                  <p className="text-3xl font-bold">{projects.filter(p => p.status === 'draft').length}</p>
                  <Progress 
                    value={(projects.filter(p => p.status === 'draft').length / grade12ProjectsCount) * 100} 
                    className="h-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    <span>إجمالي التعليقات</span>
                  </div>
                  <p className="text-3xl font-bold">{projects.reduce((sum, p) => sum + (p.total_comments_count || 0), 0)}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>الطلاب النشطون</span>
                  </div>
                  <p className="text-3xl font-bold">{new Set(projects.map(p => p.student_id)).size}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* البحث والفلترة */}
        <Card className="border-0 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث عن مشروع أو طالب..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 border-0 bg-muted/50"
                />
              </div>
              <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full md:w-auto">
                <TabsList className="grid w-full grid-cols-4 bg-muted/50">
                  <TabsTrigger value="all">الكل ({projects.length})</TabsTrigger>
                  <TabsTrigger value="in_progress">
                    قيد التنفيذ ({projects.filter(p => p.status === 'in_progress').length})
                  </TabsTrigger>
                  <TabsTrigger value="completed">
                    مكتملة ({projects.filter(p => p.status === 'completed').length})
                  </TabsTrigger>
                  <TabsTrigger value="draft">
                    مسودات ({projects.filter(p => p.status === 'draft').length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* قائمة المشاريع */}
        <Card className="border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <FileText className="h-5 w-5 text-primary" />
                  المشاريع ({filteredProjects.length})
                </CardTitle>
                <CardDescription className="mt-1">
                  قائمة شاملة بجميع مشاريع طلاب الصف الثاني عشر
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                تحديث
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filteredProjects.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-4 rounded-3xl bg-primary/5 flex items-center justify-center ring-1 ring-primary/10">
                  <FileText className="h-12 w-12 text-primary/40" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد مشاريع</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'لا توجد مشاريع تطابق معايير البحث الحالية. جرب تعديل الفلاتر أو البحث.'
                    : 'لم يتم إنشاء أي مشاريع بعد. سيظهر هنا جميع مشاريع الطلاب عند إنشائها.'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="p-6 border border-border/50 rounded-2xl bg-card/30 hover:bg-card/60 hover:border-primary/30 transition-all duration-200 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-4">
                        {/* العنوان والحالة */}
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center shrink-0 ring-1 ring-primary/10">
                            {getStatusIcon(project.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-lg text-foreground truncate">
                                {project.title}
                              </h3>
                              <Badge className={getStatusColor(project.status)}>
                                {getStatusText(project.status)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {project.description || 'لا يوجد وصف للمشروع'}
                            </p>
                          </div>
                        </div>

                        {/* معلومات الطالب والتاريخ */}
                        <div className="flex items-center gap-4 text-sm flex-wrap">
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50">
                            <Users className="h-4 w-4 text-primary" />
                            <span className="font-medium">{project.student_name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {formatDistanceToNow(new Date(project.updated_at), { 
                                addSuffix: true, 
                                locale: ar 
                              })}
                            </span>
                          </div>
                          {project.completed_tasks_count !== undefined && project.total_tasks_count !== undefined && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/5">
                              <BarChart3 className="h-4 w-4 text-primary" />
                              <span className="text-primary font-semibold">
                                {project.completed_tasks_count} من {project.total_tasks_count} مهمة
                              </span>
                            </div>
                          )}
                        </div>

                        {/* المهمة الحالية */}
                        {project.current_task && (
                          <div className="flex items-center gap-2 text-sm bg-blue-500/5 border border-blue-500/20 px-4 py-2.5 rounded-xl">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <span className="text-muted-foreground font-medium">المهمة الحالية:</span>
                            <span className="text-blue-600 font-semibold">{project.current_task}</span>
                          </div>
                        )}

                        {/* شريط التقدم */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground font-medium">نسبة الإنجاز</span>
                            <span className="text-foreground font-bold text-base">
                              {project.completion_percentage}%
                            </span>
                          </div>
                          <Progress 
                            value={project.completion_percentage} 
                            className="h-3"
                          />
                        </div>

                        {/* التعليقات */}
                        <div className="flex items-center gap-3 pt-2">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MessageSquare className="h-4 w-4" />
                            <span>{project.total_comments_count} تعليق</span>
                          </div>
                          {project.unread_comments_count > 0 && (
                            <Badge className="bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20">
                              {project.unread_comments_count} جديد
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* زر العرض */}
                      <Button
                        onClick={() => navigate(`/grade12-project-editor/${project.id}`)}
                        className="gap-2 px-6"
                        size="lg"
                      >
                        <Eye className="h-4 w-4" />
                        عرض المشروع
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Grade12ProjectsManagement;
