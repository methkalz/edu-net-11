import React, { useState, useEffect } from 'react';
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
  Activity,
  Zap
} from 'lucide-react';
import { useGrade10Projects } from '@/hooks/useGrade10Projects';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow, format } from 'date-fns';
import { ar } from 'date-fns/locale';
import ModernHeader from '@/components/shared/ModernHeader';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Area, AreaChart } from 'recharts';

const Grade10ProjectsManagement: React.FC = () => {
  const navigate = useNavigate();
  const { projects, loading } = useGrade10Projects();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectsWithProgress, setProjectsWithProgress] = useState<any[]>([]);

  // جلب المهام وحساب التقدم لكل مشروع
  useEffect(() => {
    const fetchTasksAndCalculateProgress = async () => {
      if (projects.length === 0) return;

      const projectsData = await Promise.all(
        projects.map(async (project) => {
          try {
            const { data: tasks, error } = await supabase
              .from('grade10_project_tasks')
              .select('*')
              .eq('project_id', project.id);

            if (error) throw error;

            const completedTasks = tasks?.filter(task => task.is_completed).length || 0;
            const totalTasks = tasks?.length || 0;
            const calculatedProgress = totalTasks > 0 
              ? Math.round((completedTasks / totalTasks) * 100) 
              : 0;

            return {
              ...project,
              calculated_progress: calculatedProgress,
              completed_tasks_count: completedTasks,
              total_tasks_count: totalTasks,
              student_name: project.student_profile?.full_name || 'طالب',
              unread_comments_count: 0,
              total_comments_count: 0
            };
          } catch (error) {
            console.error('Error fetching tasks for project:', project.id, error);
            return {
              ...project,
              calculated_progress: 0,
              completed_tasks_count: 0,
              total_tasks_count: 0,
              student_name: project.student_profile?.full_name || 'طالب',
              unread_comments_count: 0,
              total_comments_count: 0
            };
          }
        })
      );

      setProjectsWithProgress(projectsData);
    };

    fetchTasksAndCalculateProgress();
  }, [projects]);

  // Calculate quick stats
  const quickStats = {
    totalProjects: projectsWithProgress.length,
    completedProjects: projectsWithProgress.filter(p => p.status === 'completed').length,
    inProgressProjects: projectsWithProgress.filter(p => p.status === 'in_progress').length,
    averageCompletion: projectsWithProgress.length > 0 
      ? Math.round(projectsWithProgress.reduce((acc, p) => acc + (p.calculated_progress || 0), 0) / projectsWithProgress.length)
      : 0,
    unreadCommentsTotal: 0
  };

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
  const filteredProjects = projectsWithProgress.filter(project => {
    const matchesSearch = 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.student_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // إحصائيات حالات المشاريع للرسم البياني
  const statusDistribution = [
    { name: 'قيد التنفيذ', value: projectsWithProgress.filter(p => p.status === 'in_progress').length, color: '#3b82f6' },
    { name: 'مكتملة', value: projectsWithProgress.filter(p => p.status === 'completed').length, color: '#10b981' },
    { name: 'مسودة', value: projectsWithProgress.filter(p => p.status === 'draft').length, color: '#6b7280' },
  ].filter(item => item.value > 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <ModernHeader title="مشاريع الصف العاشر المصغرة" />
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
      <ModernHeader title="مشاريع الصف العاشر المصغرة" />
      
      <div className="container mx-auto p-6 space-y-6">

        {/* الإحصائيات الرئيسية */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium">إجمالي المشاريع</p>
                  <p className="text-4xl font-bold text-foreground">{quickStats.totalProjects}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Zap className="h-3 w-3" />
                    <span>المشاريع المصغرة</span>
                  </div>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center ring-1 ring-blue-500/20">
                  <Zap className="h-7 w-7 text-blue-600" />
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
                    <span>{quickStats.completedProjects > 0 ? `${((quickStats.completedProjects / quickStats.totalProjects) * 100).toFixed(0)}% من الإجمالي` : 'لا توجد مشاريع مكتملة'}</span>
                  </div>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-500/20">
                  <CheckCircle className="h-7 w-7 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium">قيد التنفيذ</p>
                  <p className="text-4xl font-bold text-foreground">{quickStats.inProgressProjects}</p>
                  <div className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                    <Clock className="h-3 w-3" />
                    <span>مشاريع نشطة</span>
                  </div>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center ring-1 ring-amber-500/20">
                  <Clock className="h-7 w-7 text-amber-600" />
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

          {/* نشاطات المشاريع الأخيرة */}
          <Card className="lg:col-span-2 border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-primary" />
                آخر النشاطات على المشاريع
              </CardTitle>
              <CardDescription>
                آخر التحديثات والتعديلات على المشاريع المصغرة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* خط الـ Timeline */}
                <div className="absolute right-[19px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 via-primary/30 to-transparent"></div>
                
                <div className="space-y-6">
                  {projectsWithProgress
                    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                    .slice(0, 6)
                    .map((project, index) => {
                      const isRecent = new Date(project.updated_at).getTime() > Date.now() - 24 * 60 * 60 * 1000;
                      const statusColors = {
                        completed: 'from-emerald-500/20 to-emerald-500/5',
                        in_progress: 'from-blue-500/20 to-blue-500/5',
                        draft: 'from-purple-500/20 to-purple-500/5'
                      };
                      
                      return (
                        <div key={project.id} className="relative flex items-start gap-4 group">
                          {/* نقطة Timeline */}
                          <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${statusColors[project.status as keyof typeof statusColors] || 'from-gray-500/20 to-gray-500/5'} flex items-center justify-center border-2 border-background shadow-lg ring-2 ring-primary/20`}>
                            {getStatusIcon(project.status)}
                            {isRecent && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-background animate-pulse"></div>
                            )}
                          </div>
                          
                          {/* محتوى النشاط */}
                          <div className="flex-1 min-w-0 pb-6">
                            <div className={`p-4 rounded-2xl bg-gradient-to-br ${statusColors[project.status as keyof typeof statusColors] || 'from-gray-500/20 to-gray-500/5'} border border-border/50 hover:border-primary/30 transition-all duration-200 group-hover:shadow-md`}>
                              <div className="flex items-center gap-2 mb-3 text-xs">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="font-semibold text-foreground">
                                  {format(new Date(project.updated_at), 'dd/MM/yyyy')}
                                </span>
                                <span className="text-muted-foreground">•</span>
                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="font-semibold text-foreground">
                                  {format(new Date(project.updated_at), 'HH:mm')}
                                </span>
                                <span className="text-muted-foreground mr-auto">
                                  ({formatDistanceToNow(new Date(project.updated_at), { 
                                    addSuffix: true, 
                                    locale: ar 
                                  })})
                                </span>
                              </div>
                              
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <h4 className="font-bold text-base text-foreground">
                                  {project.title}
                                </h4>
                                <Badge variant="outline" className={getStatusColor(project.status)}>
                                  {getStatusText(project.status)}
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                                قام الطالب {project.student_name} بتحديث المشروع
                              </p>
                              
                              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/30 flex-wrap">
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-muted-foreground">نسبة الإنجاز:</span>
                                  <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-300"
                                      style={{ width: `${project.calculated_progress}%` }}
                                    />
                                  </div>
                                  <span className="font-bold text-primary">{project.calculated_progress}%</span>
                                </div>
                                
                                {project.completed_tasks_count !== undefined && project.total_tasks_count !== undefined && (
                                  <div className="flex items-center gap-1.5 text-xs">
                                    <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-muted-foreground">المهام:</span>
                                    <span className="font-semibold text-foreground">
                                      {project.completed_tasks_count} من {project.total_tasks_count}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
                
                {projectsWithProgress.length === 0 && (
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">لا توجد نشاطات حديثة</p>
                  </div>
                )}
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
                  <TabsTrigger value="all">الكل ({projectsWithProgress.length})</TabsTrigger>
                  <TabsTrigger value="in_progress">
                    قيد التنفيذ ({projectsWithProgress.filter(p => p.status === 'in_progress').length})
                  </TabsTrigger>
                  <TabsTrigger value="completed">
                    مكتملة ({projectsWithProgress.filter(p => p.status === 'completed').length})
                  </TabsTrigger>
                  <TabsTrigger value="draft">
                    مسودات ({projectsWithProgress.filter(p => p.status === 'draft').length})
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
                  <Zap className="h-5 w-5 text-primary" />
                  المشاريع المصغرة ({filteredProjects.length})
                </CardTitle>
                <CardDescription className="mt-1">
                  قائمة شاملة بجميع مشاريع طلاب الصف العاشر المصغرة
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredProjects.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-4 rounded-3xl bg-primary/5 flex items-center justify-center ring-1 ring-primary/10">
                  <Zap className="h-12 w-12 text-primary/40" />
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="group relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-card/50 via-card/30 to-transparent border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl backdrop-blur-sm"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="relative flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-4">
                        {/* العنوان والحالة */}
                        <div className="flex items-start gap-3">
                          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${
                            project.status === 'completed' ? 'from-emerald-500/15 via-emerald-500/10 to-transparent' :
                            project.status === 'in_progress' ? 'from-blue-500/15 via-blue-500/10 to-transparent' :
                            'from-purple-500/15 via-purple-500/10 to-transparent'
                          } flex items-center justify-center shrink-0 ring-2 ring-primary/10 group-hover:ring-primary/20 transition-all duration-300`}>
                            <div className="group-hover:scale-110 transition-transform duration-300">
                              {getStatusIcon(project.status)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-bold text-lg text-foreground truncate group-hover:text-primary transition-colors duration-200">
                                {project.title}
                              </h3>
                              <Badge className={getStatusColor(project.status)}>
                                {getStatusText(project.status)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                              {project.description || 'لا يوجد وصف للمشروع'}
                            </p>
                          </div>
                        </div>

                        {/* معلومات الطالب والتاريخ */}
                        <div className="flex items-center gap-3 text-sm flex-wrap">
                          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20">
                            <Users className="h-4 w-4 text-blue-600" />
                            <span className="font-semibold text-foreground">{project.student_name}</span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-br from-muted/50 to-transparent border border-border/30">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground font-medium">
                              {formatDistanceToNow(new Date(project.updated_at), { 
                                addSuffix: true, 
                                locale: ar 
                              })}
                            </span>
                          </div>
                          {project.completed_tasks_count !== undefined && project.total_tasks_count !== undefined && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
                              <BarChart3 className="h-4 w-4 text-primary" />
                              <span className="text-primary font-bold">
                                {project.completed_tasks_count} من {project.total_tasks_count} مهمة
                              </span>
                            </div>
                          )}
                        </div>

                        {/* شريط التقدم */}
                        <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-muted/30 to-transparent border border-border/30">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-primary" />
                              <span className="text-muted-foreground font-semibold">نسبة الإنجاز</span>
                            </div>
                            <span className="text-foreground font-bold text-lg">
                              {project.calculated_progress}%
                            </span>
                          </div>
                          <div className="relative">
                            <Progress 
                              value={project.calculated_progress} 
                              className="h-3 bg-muted/50"
                            />
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-transparent pointer-events-none"></div>
                          </div>
                        </div>
                      </div>

                      {/* زر العرض */}
                      <Button
                        onClick={() => navigate(`/grade10-project-editor/${project.id}`)}
                        className="gap-2 px-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                        size="lg"
                      >
                        <Eye className="h-4 w-4" />
                        عرض المشروع
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
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

export default Grade10ProjectsManagement;
