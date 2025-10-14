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
  ArrowRight
} from 'lucide-react';
import { useTeacherProjects } from '@/hooks/useTeacherProjects';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

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

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* العنوان */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary/10 to-secondary/20 flex items-center justify-center">
              <FileText className="h-6 w-6 text-secondary" />
            </div>
            مشاريع الصف الثاني عشر
          </h1>
          <p className="text-text-soft mt-2">إدارة ومتابعة مشاريع التخرج لطلاب الصف الثاني عشر</p>
        </div>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 border-blue-100/50 bg-gradient-to-br from-blue-50/30 to-blue-50/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-soft font-medium mb-1">إجمالي المشاريع</p>
                <p className="text-3xl font-bold text-foreground">{grade12ProjectsCount}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-100/40 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600/70" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-emerald-100/50 bg-gradient-to-br from-emerald-50/30 to-emerald-50/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-soft font-medium mb-1">مشاريع مكتملة</p>
                <p className="text-3xl font-bold text-foreground">{quickStats.completedProjects}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100/40 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-emerald-600/70" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-100/50 bg-gradient-to-br from-orange-50/30 to-orange-50/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-soft font-medium mb-1">تعليقات جديدة</p>
                <p className="text-3xl font-bold text-foreground">{quickStats.unreadCommentsTotal}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-orange-100/40 flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-orange-600/70" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-violet-100/50 bg-gradient-to-br from-violet-50/30 to-violet-50/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-soft font-medium mb-1">متوسط الإنجاز</p>
                <p className="text-3xl font-bold text-foreground">{quickStats.averageCompletion}%</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-violet-100/40 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-violet-600/70" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* البحث والفلترة */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-soft" />
              <Input
                placeholder="ابحث عن مشروع أو طالب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full md:w-auto">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">الكل</TabsTrigger>
                <TabsTrigger value="in_progress">قيد التنفيذ</TabsTrigger>
                <TabsTrigger value="completed">مكتملة</TabsTrigger>
                <TabsTrigger value="draft">مسودات</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* قائمة المشاريع */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            المشاريع ({filteredProjects.length})
          </CardTitle>
          <CardDescription>
            قائمة شاملة بجميع مشاريع طلاب الصف الثاني عشر
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-secondary/10 flex items-center justify-center">
                <FileText className="h-10 w-10 text-secondary/40" />
              </div>
              <h3 className="font-medium text-foreground mb-2">لا توجد مشاريع</h3>
              <p className="text-sm text-text-soft">
                {searchQuery || statusFilter !== 'all' 
                  ? 'لا توجد مشاريع تطابق معايير البحث'
                  : 'لم يتم إنشاء أي مشاريع بعد'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="p-5 border-2 border-divider/50 rounded-2xl hover:bg-surface-hover hover:border-secondary/30 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-4">
                      {/* العنوان والحالة */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-surface-light flex items-center justify-center">
                          {getStatusIcon(project.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">
                            {project.title}
                          </h3>
                          <p className="text-sm text-text-soft">
                            {project.description?.substring(0, 100)}
                            {project.description && project.description.length > 100 && '...'}
                          </p>
                        </div>
                        <Badge className={getStatusColor(project.status)}>
                          {getStatusText(project.status)}
                        </Badge>
                      </div>

                      {/* معلومات الطالب والتاريخ */}
                      <div className="flex items-center gap-4 text-sm text-text-soft flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          {project.student_name}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          {formatDistanceToNow(new Date(project.updated_at), { 
                            addSuffix: true, 
                            locale: ar 
                          })}
                        </span>
                        {project.completed_tasks_count !== undefined && project.total_tasks_count !== undefined && (
                          <span className="flex items-center gap-1.5 text-secondary font-medium">
                            <BarChart3 className="h-4 w-4" />
                            {project.completed_tasks_count} من {project.total_tasks_count} مهمة
                          </span>
                        )}
                      </div>

                      {/* المهمة الحالية */}
                      {project.current_task && (
                        <div className="flex items-center gap-2 text-sm bg-secondary/5 px-3 py-2 rounded-lg">
                          <Clock className="h-4 w-4 text-secondary" />
                          <span className="text-text-soft">المهمة الحالية:</span>
                          <span className="text-secondary font-medium">{project.current_task}</span>
                        </div>
                      )}

                      {/* شريط التقدم */}
                      <div className="flex items-center gap-3">
                        <Progress 
                          value={project.completion_percentage} 
                          className="flex-1 h-2.5 bg-surface-light"
                        />
                        <span className="text-sm text-text-soft font-bold min-w-[45px] text-left">
                          {project.completion_percentage}%
                        </span>
                      </div>

                      {/* التعليقات */}
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1.5 text-text-soft">
                          <MessageSquare className="h-4 w-4" />
                          {project.total_comments_count} تعليق
                        </span>
                        {project.unread_comments_count > 0 && (
                          <Badge variant="destructive" className="bg-red-50 text-red-600 border-red-200">
                            {project.unread_comments_count} جديد
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* زر العرض */}
                    <Button
                      onClick={() => navigate(`/grade12-project-editor/${project.id}`)}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      عرض
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
  );
};

export default Grade12ProjectsManagement;
