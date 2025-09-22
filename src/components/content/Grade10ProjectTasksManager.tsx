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
import { useGrade10Projects } from '@/hooks/useGrade10Projects';
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

interface Grade10ProjectTasksManagerProps {
  projectId: string;
  isTeacher: boolean;
  isStudent: boolean;
}

const Grade10ProjectTasksManager: React.FC<Grade10ProjectTasksManagerProps> = ({
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
  } = useGrade10Projects();

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
      // جلب المهام الافتراضية للصف العاشر
      const { data: defaultTasksData, error: defaultTasksError } = await (supabase as any)
        .from('grade10_default_tasks')
        .select('*')
        .eq('is_active', true)
        .order('phase_number', { ascending: true })
        .order('order_index', { ascending: true });

      if (defaultTasksError) throw defaultTasksError;

      // جلب تقدم الطالب في المهام الافتراضية
      const { data: progressData, error: progressError } = await (supabase as any)
        .from('grade10_student_task_progress')
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
      .channel(`grade10_project_tasks_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'grade10_project_tasks',
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
      .channel(`grade10_student_tasks_progress_${studentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'grade10_student_task_progress',
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

  // رندر المهام الافتراضية للمعلم (المهام الخمس)
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
                          {isCompleted ? 'مكتملة ✓' : 'قيد الإنجاز'}
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

  // رندر المهام الإضافية للمعلم
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
          <div className="mt-3 space-y-2">
            {renderTasksForStudent(task.subtasks, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  // جلب المهام الرئيسية فقط (للاستخدام في اختيار المهمة الأب)
  const getMainTasks = (taskList: any[]): any[] => {
    return taskList.filter(task => !task.parent_task_id);
  };

  const progressData = calculateOverallProgress();

  return (
    <div className="space-y-6">
      {/* إحصائيات شاملة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-green-50 to-green-25 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-700">{progressData.defaultCompleted}</p>
                <p className="text-sm text-green-600">مهام افتراضية مكتملة</p>
              </div>
              <div className="text-green-600">
                <BookOpen className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-2">
              <Progress value={progressData.defaultTasksProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-25 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-700">{progressData.additionalCompleted}</p>
                <p className="text-sm text-blue-600">مهام إضافية مكتملة</p>
              </div>
              <div className="text-blue-600">
                <Layers className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-2">
              <Progress value={progressData.additionalTasksProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-25 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-700">{progressData.overallProgress}%</p>
                <p className="text-sm text-purple-600">التقدم الشامل</p>
              </div>
              <div className="text-purple-600">
                <Target className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-2">
              <Progress value={progressData.overallProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-25 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-700">
                  {progressData.defaultTotal + progressData.additionalTotal}
                </p>
                <p className="text-sm text-orange-600">إجمالي المهام</p>
              </div>
              <div className="text-orange-600">
                <Activity className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* المهام الافتراضية (للمعلم فقط) */}
      {isTeacher && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              المهام الأساسية للمشروع الصغير
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              تقدم الطالب في المهام الخمس الأساسية للصف العاشر
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              renderDefaultTasksForTeacher()
            )}
          </CardContent>
        </Card>
      )}

      {/* المهام الإضافية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-secondary" />
            المهام الإضافية
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {isTeacher ? 'إدارة المهام الإضافية للمشروع الصغير' : 'المهام الإضافية المطلوبة من المعلم'}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* نموذج إضافة مهمة جديدة (للمعلم فقط) */}
          {isTeacher && (
            <Card className="bg-muted/20">
              <CardHeader>
                <CardTitle className="text-lg">إضافة مهمة جديدة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="taskTitle">عنوان المهمة *</Label>
                    <Input
                      id="taskTitle"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="أدخل عنوان المهمة..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="parentTask">مهمة رئيسية (اختياري)</Label>
                    <select
                      id="parentTask"
                      value={selectedParentTask}
                      onChange={(e) => setSelectedParentTask(e.target.value)}
                      className="w-full p-2 border border-input bg-background rounded-md"
                    >
                      <option value="">مهمة رئيسية</option>
                      {getMainTasks(tasks).map((task) => (
                        <option key={task.id} value={task.id}>
                          {task.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="taskDescription">وصف المهمة</Label>
                  <Textarea
                    id="taskDescription"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="أدخل وصف المهمة..."
                    rows={3}
                  />
                </div>
                
                <Button onClick={handleAddTask} className="gap-2">
                  <Plus className="h-4 w-4" />
                  إضافة المهمة
                </Button>
              </CardContent>
            </Card>
          )}

          {/* قائمة المهام */}
          <div>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4 pr-4">
                {tasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>لا توجد مهام إضافية بعد</p>
                    {isTeacher && <p className="text-sm">أضف مهمة جديدة باستخدام النموذج أعلاه</p>}
                  </div>
                ) : (
                  <>
                    {isTeacher && renderTasksForTeacher(tasks)}
                    {isStudent && renderTasksForStudent(tasks)}
                  </>
                )}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Grade10ProjectTasksManager;