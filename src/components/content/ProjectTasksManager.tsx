import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGrade12Projects } from '@/hooks/useGrade12Projects';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Plus,
  Target,
  Trash2,
  Calendar,
  CheckCircle,
  Circle,
  Clock,
  User,
  Eye,
  Activity,
  BookOpen,
  Layers
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ProjectTasksManagerProps {
  projectId: string;
  isTeacher: boolean;
  isStudent: boolean;
}

const ProjectTasksManager: React.FC<ProjectTasksManagerProps> = ({
  projectId,
  isTeacher,
  isStudent
}) => {
  const { userProfile } = useAuth();
  const {
    tasks,
    fetchTasks,
    addTask,
    updateTaskStatus,
    deleteTask,
    projects
  } = useGrade12Projects();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [selectedParentTask, setSelectedParentTask] = useState<string>('');
  const [defaultTasksProgress, setDefaultTasksProgress] = useState<any[]>([]);
  const [defaultTasks, setDefaultTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // جلب المشروع الحالي
  const currentProject = projects.find(p => p.id === projectId);
  const studentId = currentProject?.student_id;

  // جلب المهام الافتراضية وتقدم الطالب (للمعلم فقط)
  const fetchDefaultTasksProgress = async () => {
    if (!studentId || !isTeacher) return;
    
    setLoading(true);
    try {
      // جلب المهام الافتراضية
      const { data: defaultTasksData, error: defaultTasksError } = await supabase
        .from('grade12_default_tasks')
        .select('*')
        .eq('is_active', true)
        .order('phase', { ascending: true })
        .order('order_index', { ascending: true });

      if (defaultTasksError) throw defaultTasksError;

      // جلب تقدم الطالب في المهام الافتراضية
      const { data: progressData, error: progressError } = await supabase
        .from('grade12_student_task_progress')
        .select('*')
        .eq('student_id', studentId);

      if (progressError) throw progressError;

      setDefaultTasks(defaultTasksData || []);
      setDefaultTasksProgress(progressData || []);
    } catch (error) {
      console.error('Error fetching default tasks progress:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchTasks(projectId);
    }
  }, [projectId, fetchTasks]);

  useEffect(() => {
    if (studentId && isTeacher) {
      fetchDefaultTasksProgress();
    }
  }, [studentId, isTeacher]);

  // إضافة real-time updates للمهام الإضافية
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`project_tasks_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'grade12_project_tasks',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          // إعادة تحميل المهام عند حدوث تغيير
          fetchTasks(projectId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, fetchTasks]);

  // إضافة real-time updates للمهام الافتراضية (للمعلم فقط)
  useEffect(() => {
    if (!studentId || !isTeacher) return;

    const channel = supabase
      .channel(`student_tasks_progress_${studentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'grade12_student_task_progress',
          filter: `student_id=eq.${studentId}`,
        },
        () => {
          // إعادة تحميل تقدم المهام عند حدوث تغيير
          fetchDefaultTasksProgress();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId, isTeacher]);

  // حساب التقدم الشامل (المهام الافتراضية + الإضافية)
  const calculateOverallProgress = (): { 
    defaultTasksProgress: number; 
    additionalTasksProgress: number; 
    overallProgress: number;
    defaultCompleted: number;
    defaultTotal: number;
    additionalCompleted: number;
    additionalTotal: number;
  } => {
    // المهام الافتراضية
    const defaultCompleted = defaultTasksProgress.filter(p => p.is_completed).length;
    const defaultTotal = defaultTasks.length;
    const defaultTasksProgressPerc = defaultTotal > 0 ? Math.round((defaultCompleted / defaultTotal) * 100) : 0;

    // المهام الإضافية
    const allAdditionalTasks = getAllTasks(tasks);
    const additionalCompleted = allAdditionalTasks.filter(task => task.is_completed).length;
    const additionalTotal = allAdditionalTasks.length;
    const additionalTasksProgressPerc = additionalTotal > 0 ? Math.round((additionalCompleted / additionalTotal) * 100) : 0;

    // التقدم الشامل
    const totalCompleted = defaultCompleted + additionalCompleted;
    const totalTasks = defaultTotal + additionalTotal;
    const overallProgress = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

    return {
      defaultTasksProgress: defaultTasksProgressPerc,
      additionalTasksProgress: additionalTasksProgressPerc,
      overallProgress,
      defaultCompleted,
      defaultTotal,
      additionalCompleted,
      additionalTotal
    };
  };

  // جلب جميع المهام (الرئيسية والفرعية)
  const getAllTasks = (taskList: any[]): any[] => {
    let allTasks: any[] = [];
    taskList.forEach(task => {
      allTasks.push(task);
      if (task.subtasks && task.subtasks.length > 0) {
        allTasks = allTasks.concat(getAllTasks(task.subtasks));
      }
    });
    return allTasks;
  };

  // إضافة مهمة جديدة
  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) {
      toast({
        title: "خطأ",
        description: "عنوان المهمة مطلوب",
        variant: "destructive",
      });
      return;
    }

    try {
      await addTask({
        project_id: projectId,
        title: newTaskTitle,
        description: newTaskDescription,
        parent_task_id: selectedParentTask || null,
        task_type: selectedParentTask ? 'sub' : 'main',
        order_index: tasks.length,
      });
      
      setNewTaskTitle('');
      setNewTaskDescription('');
      setSelectedParentTask('');
      
      toast({
        title: "نجح",
        description: "تم إضافة المهمة بنجاح",
      });
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  // تحديث حالة المهمة
  const handleToggleTask = async (taskId: string, isCompleted: boolean) => {
    try {
      await updateTaskStatus(taskId, isCompleted);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // حذف مهمة
  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      toast({
        title: "نجح",
        description: "تم حذف المهمة بنجاح",
      });
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // رندر المهام الافتراضية للمعلم
  const renderDefaultTasksForTeacher = () => {
    if (!isTeacher || defaultTasks.length === 0) return null;

    const organizedByPhase = defaultTasks.reduce((acc, task) => {
      if (!acc[task.phase_title]) acc[task.phase_title] = [];
      acc[task.phase_title].push(task);
      return acc;
    }, {} as any);

    return (
      <div className="space-y-4">
        {Object.entries(organizedByPhase).map(([phase, phaseTasks]: [string, any[]]) => {
          const phaseProgress = defaultTasksProgress.filter(p => 
            phaseTasks.some(t => t.id === p.default_task_id) && p.is_completed
          );
          const phaseCompletionRate = phaseTasks.length > 0 
            ? Math.round((phaseProgress.length / phaseTasks.length) * 100) 
            : 0;

          return (
            <Card key={phase} className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    {phase}
                  </CardTitle>
                  <Badge variant="outline" className="bg-primary/10">
                    {phaseProgress.length} / {phaseTasks.length}
                  </Badge>
                </div>
                <Progress value={phaseCompletionRate} className="h-2" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {phaseTasks.map((task) => {
                    const progress = defaultTasksProgress.find(p => p.default_task_id === task.id);
                    const isCompleted = progress?.is_completed || false;

                    return (
                      <div key={task.id} className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 ${
                        isCompleted 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-muted/30 border-border'
                      }`}>
                        <div className="mt-1">
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            isCompleted ? 'text-green-700' : 'text-foreground'
                          }`}>
                            {task.task_title}
                          </p>
                          {task.task_description && (
                            <p className="text-xs text-muted-foreground mt-1">{task.task_description}</p>
                          )}
                          {progress?.completed_at && (
                            <p className="text-xs text-green-600 mt-1">
                              اكتمل: {format(new Date(progress.completed_at), 'dd MMM yyyy - HH:mm', { locale: ar })}
                            </p>
                          )}
                        </div>

                        <Badge 
                          variant={isCompleted ? "default" : "secondary"} 
                          className={`text-xs ${
                            isCompleted 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {isCompleted ? 'مكتمل ✓' : 'قيد الإنجاز'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };
  const renderTasksForTeacher = (taskList: any[], level: number = 0) => {
    return taskList.map((task) => (
      <div key={task.id} className={`space-y-2 ${level > 0 ? 'mr-4 border-r-2 border-muted pr-4' : ''}`}>
        <div className={`p-4 border rounded-lg transition-all duration-200 ${
          task.is_completed 
            ? 'bg-green-50 border-green-200 hover:bg-green-100/50' 
            : 'bg-card border-border hover:bg-accent/10 hover:border-primary/20'
        }`}>
          <div className="flex items-start gap-3">
            <div className="mt-1">
              {task.is_completed ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-medium text-base ${task.is_completed ? 'text-green-700' : 'text-foreground'}`}>
                      {task.title}
                    </span>
                    {task.task_type === 'sub' && (
                      <Badge variant="outline" className="text-xs">مهمة فرعية</Badge>
                    )}
                  </div>
                  
                  {task.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{task.description}</p>
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteTask(task.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* معلومات التقدم والتوقيت */}
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>أُضيفت: {format(new Date(task.created_at), 'dd MMM yyyy - HH:mm', { locale: ar })}</span>
                </div>
                
                {task.is_completed && task.completed_at && (
                  <div className="flex items-center gap-1 text-green-600 font-medium">
                    <CheckCircle className="h-3 w-3" />
                    <span>اكتملت: {format(new Date(task.completed_at), 'dd MMM yyyy - HH:mm', { locale: ar })}</span>
                  </div>
                )}

                <Badge 
                  variant={task.is_completed ? "default" : "secondary"} 
                  className={`text-xs ${
                    task.is_completed 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                  }`}
                >
                  {task.is_completed ? 'مكتملة ✓' : 'في انتظار الإنجاز'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        
        {/* رندر المهام الفرعية */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="mt-3 space-y-2">
            {renderTasksForTeacher(task.subtasks, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  // رندر المهام للطالب (مبسط للتفاعل)
  const renderTasksForStudent = (taskList: any[], level: number = 0) => {
    return taskList.map((task) => (
      <div key={task.id} className={`space-y-2 ${level > 0 ? 'mr-4 border-r border-border pr-3' : ''}`}>
        <div className="flex items-start gap-3 p-3 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
          <div className="mt-1">
            {task.is_completed ? (
              <CheckCircle 
                className="h-5 w-5 text-green-500 cursor-pointer hover:text-green-600" 
                onClick={() => handleToggleTask(task.id, false)}
              />
            ) : (
              <Circle 
                className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" 
                onClick={() => handleToggleTask(task.id, true)}
              />
            )}
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className={`font-medium ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                {task.title}
              </span>
              {task.task_type === 'sub' && (
                <Badge variant="outline" className="text-xs">فرعية</Badge>
              )}
              {task.is_completed && (
                <Badge variant="default" className="text-xs bg-green-100 text-green-700">مكتملة</Badge>
              )}
            </div>
            
            {task.description && (
              <p className="text-sm text-muted-foreground">{task.description}</p>
            )}
            
            {task.completed_at && (
              <div className="text-xs text-green-600">
                اكتملت في: {format(new Date(task.completed_at), 'dd MMM yyyy', { locale: ar })}
              </div>
            )}
          </div>
        </div>
        
        {/* رندر المهام الفرعية */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="mt-2">
            {renderTasksForStudent(task.subtasks, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  // الحصول على المهام الرئيسية لقائمة الاختيار
  const getMainTasks = (taskList: any[]): any[] => {
    return taskList.filter(task => task.task_type === 'main' || !task.parent_task_id);
  };

  const progressStats = calculateOverallProgress();
  
  if (loading && isTeacher) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل تقدم المهام...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6">
      {/* إحصائيات التقدم المحسنة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">المهام الأساسية</p>
                <p className="text-2xl font-bold text-blue-600">{progressStats.defaultCompleted}/{progressStats.defaultTotal}</p>
                <p className="text-xs text-blue-500">{progressStats.defaultTasksProgress}%</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-500/60" />
            </div>
            <Progress value={progressStats.defaultTasksProgress} className="h-2 mt-2 bg-blue-100" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-secondary/10 to-secondary/5 border-secondary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">المهام الإضافية</p>
                <p className="text-2xl font-bold text-secondary">{progressStats.additionalCompleted}/{progressStats.additionalTotal}</p>
                <p className="text-xs text-secondary">{progressStats.additionalTasksProgress}%</p>
              </div>
              <Layers className="h-8 w-8 text-secondary/60" />
            </div>
            <Progress value={progressStats.additionalTasksProgress} className="h-2 mt-2 bg-secondary/20" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المكتملة</p>
                <p className="text-2xl font-bold text-primary">{progressStats.defaultCompleted + progressStats.additionalCompleted}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">نسبة الإنجاز الشاملة</p>
                <p className="text-2xl font-bold text-green-600">{progressStats.overallProgress}%</p>
              </div>
              <Activity className="h-8 w-8 text-green-500/60" />
            </div>
            <Progress value={progressStats.overallProgress} className="h-2 mt-2 bg-green-100" />
          </CardContent>
        </Card>
      </div>

      {isTeacher ? (
        /* واجهة المعلم الشاملة */
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            {/* المهام الأساسية (الافتراضية) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  المهام الأساسية للمشروع النهائي
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  تقدم الطالب في المهام الأساسية المطلوبة
                </p>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="pr-2">
                    {renderDefaultTasksForTeacher()}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* المهام الإضافية من المعلم */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-secondary" />
                  المهام الإضافية من المعلم
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  مهام مخصصة أضافها المعلم لهذا المشروع
                </p>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4 pr-2">
                    {tasks.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Target className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="text-base mb-2">لا توجد مهام إضافية حتى الآن</p>
                        <p className="text-sm">يمكنك إضافة مهام مخصصة من القائمة الجانبية</p>
                      </div>
                    ) : (
                      renderTasksForTeacher(tasks)
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* نموذج إضافة مهمة جديدة - محسن للمعلم */}
          <Card className="h-fit">
            <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-secondary/5">
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                إضافة مهمة جديدة
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                إضافة مهام مخصصة لهذا المشروع
              </p>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div>
                <Label htmlFor="task-title" className="text-sm font-medium">عنوان المهمة *</Label>
                <Input
                  id="task-title"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="أدخل عنوان المهمة"
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="task-description" className="text-sm font-medium">الوصف التفصيلي</Label>
                <Textarea
                  id="task-description"
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="اكتب وصفاً مفصلاً للمهمة وما هو مطلوب من الطالب..."
                  rows={4}
                  className="mt-2"
                />
              </div>

              {getMainTasks(tasks).length > 0 && (
                <div>
                  <Label htmlFor="parent-task" className="text-sm font-medium">ربط بمهمة رئيسية (اختياري)</Label>
                  <select
                    id="parent-task"
                    value={selectedParentTask}
                    onChange={(e) => setSelectedParentTask(e.target.value)}
                    className="w-full mt-2 px-3 py-2 border border-input bg-background rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">إنشاء كمهمة رئيسية</option>
                    {getMainTasks(tasks).map((task) => (
                      <option key={task.id} value={task.id}>
                        إضافة كمهمة فرعية لـ: {task.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <Button 
                onClick={handleAddTask} 
                className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                disabled={!newTaskTitle.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                إضافة المهمة للطالب
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* واجهة الطالب المحسنة */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              مهامي الإضافية
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              مهام خاصة أضافها المعلم لمشروعك
            </p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-3 pr-2">
                {tasks.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Target className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg mb-2">لا توجد مهام إضافية حتى الآن</p>
                    <p className="text-sm">انتظر حتى يضيف المعلم مهاماً مخصصة لمشروعك</p>
                  </div>
                ) : (
                  <>
                    {renderTasksForStudent(tasks)}
                    <Card className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                      <CardContent className="p-4">
                        <h4 className="font-medium text-blue-900 mb-2">💡 نصائح مهمة:</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• انقر على الدائرة لوضع علامة على المهمة كمكتملة</li>
                          <li>• يمكنك إلغاء وضع علامة مكتملة بالنقر مرة أخرى</li>
                          <li>• تقدمك يظهر في الإحصائيات العلوية</li>
                          <li>• المهام الفرعية تظهر تحت المهام الرئيسية</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProjectTasksManager;