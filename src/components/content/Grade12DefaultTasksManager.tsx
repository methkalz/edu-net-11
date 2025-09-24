import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useGrade12DefaultTasksAdmin } from '@/hooks/useGrade12DefaultTasksAdmin';
import {
  Plus,
  Edit3,
  Trash2,
  Settings,
  Move,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Target,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Save,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface TaskFormData {
  phase_number: number;
  phase_title: string;
  task_title: string;
  task_description?: string;
  is_active: boolean;
}

const Grade12DefaultTasksManager: React.FC = () => {
  const {
    tasks,
    phases,
    loading,
    isSuperAdmin,
    addTask,
    updateTask,
    deleteTask,
    reorderTasks,
    addPhase,
    deletePhase,
    updatePhaseTitle,
    getTaskImpact,
  } = useGrade12DefaultTasksAdmin();

  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showPhaseDialog, setShowPhaseDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [editingPhase, setEditingPhase] = useState<any>(null);
  const [newPhaseTitle, setNewPhaseTitle] = useState('');
  const [selectedPhaseForNewTask, setSelectedPhaseForNewTask] = useState<number | null>(null);
  const [taskForm, setTaskForm] = useState<TaskFormData>({
    phase_number: 1,
    phase_title: '',
    task_title: '',
    task_description: '',
    is_active: true
  });

  if (!isSuperAdmin) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">غير مصرح</h3>
            <p className="text-muted-foreground">هذه الصفحة متاحة فقط للسوبر آدمن</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // تعامل مع إضافة/تحديث المهمة
  const handleTaskSubmit = async () => {
    if (!taskForm.task_title.trim()) {
      toast.error('يرجى إدخال عنوان المهمة');
      return;
    }

    if (editingTask) {
      const success = await updateTask(editingTask.id, taskForm);
      if (success) {
        setShowTaskDialog(false);
        setEditingTask(null);
      }
    } else {
      const success = await addTask(taskForm);
      if (success) {
        setShowTaskDialog(false);
      }
    }

    // إعادة تعيين النموذج
    setTaskForm({
      phase_number: 1,
      phase_title: '',
      task_title: '',
      task_description: '',
      is_active: true
    });
    setSelectedPhaseForNewTask(null);
  };

  // إضافة مهمة جديدة في مرحلة محددة
  const handleAddTaskToPhase = (phase: any) => {
    setSelectedPhaseForNewTask(phase.phase_number);
    setTaskForm({
      phase_number: phase.phase_number,
      phase_title: phase.phase_title,
      task_title: '',
      task_description: '',
      is_active: true
    });
    setEditingTask(null);
    setShowTaskDialog(true);
  };

  // إضافة تاسك فرعي (مهمة جديدة في نفس المرحلة)
  const handleAddSubTask = (existingTask: any) => {
    setSelectedPhaseForNewTask(existingTask.phase_number);
    setTaskForm({
      phase_number: existingTask.phase_number,
      phase_title: existingTask.phase_title,
      task_title: '',
      task_description: '',
      is_active: true
    });
    setEditingTask(null);
    setShowTaskDialog(true);
  };

  // تعامل مع تحرير المهمة
  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setTaskForm({
      phase_number: task.phase_number,
      phase_title: task.phase_title,
      task_title: task.task_title,
      task_description: task.task_description || '',
      is_active: task.is_active
    });
    setShowTaskDialog(true);
  };

  // تعامل مع حذف المهمة
  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
  };

  // تعامل مع إضافة مرحلة جديدة
  const handleAddPhase = async () => {
    if (!newPhaseTitle.trim()) {
      toast.error('يرجى إدخال عنوان المرحلة');
      return;
    }

    const success = await addPhase(newPhaseTitle);
    if (success) {
      setNewPhaseTitle('');
      setShowPhaseDialog(false);
    }
  };

  // تعامل مع تحديث عنوان المرحلة
  const handleUpdatePhaseTitle = async (phaseNumber: number, newTitle: string) => {
    const success = await updatePhaseTitle(phaseNumber, newTitle);
    if (success) {
      setEditingPhase(null);
    }
  };

  // تعامل مع السحب والإفلات - بديل بسيط
  const moveTaskUp = async (taskId: string, currentIndex: number) => {
    if (currentIndex === 0) return;
    
    const newTasks = [...tasks];
    const taskIndex = newTasks.findIndex(t => t.id === taskId);
    const targetIndex = taskIndex - 1;
    
    // تبديل المهام
    [newTasks[taskIndex], newTasks[targetIndex]] = [newTasks[targetIndex], newTasks[taskIndex]];
    
    await reorderTasks(newTasks);
  };

  const moveTaskDown = async (taskId: string, currentIndex: number, totalTasks: number) => {
    if (currentIndex === totalTasks - 1) return;
    
    const newTasks = [...tasks];
    const taskIndex = newTasks.findIndex(t => t.id === taskId);
    const targetIndex = taskIndex + 1;
    
    // تبديل المهام
    [newTasks[taskIndex], newTasks[targetIndex]] = [newTasks[targetIndex], newTasks[taskIndex]];
    
    await reorderTasks(newTasks);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header مع أزرار التحكم */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Settings className="h-6 w-6 text-purple-600" />
                إدارة المهام الافتراضية
              </CardTitle>
              <CardDescription>
                تحكم شامل في المهام والمراحل للصف الثاني عشر
              </CardDescription>
            </div>
            
            <div className="flex gap-2">
              <Dialog open={showPhaseDialog} onOpenChange={setShowPhaseDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    إضافة مرحلة
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>إضافة مرحلة جديدة</DialogTitle>
                    <DialogDescription>
                      إضافة مرحلة جديدة مع مهمة افتراضية
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="phaseTitle">عنوان المرحلة</Label>
                      <Input
                        id="phaseTitle"
                        value={newPhaseTitle}
                        onChange={(e) => setNewPhaseTitle(e.target.value)}
                        placeholder="مثال: التخطيط والتحليل"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowPhaseDialog(false)}>
                      إلغاء
                    </Button>
                    <Button onClick={handleAddPhase}>
                      <Plus className="h-4 w-4 mr-2" />
                      إضافة
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    إضافة مهمة
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingTask ? 'تحرير المهمة' : 'إضافة مهمة جديدة'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="phaseNumber">رقم المرحلة</Label>
                      <Input
                        id="phaseNumber"
                        type="number"
                        min="1"
                        value={taskForm.phase_number}
                        onChange={(e) => setTaskForm(prev => ({
                          ...prev,
                          phase_number: parseInt(e.target.value) || 1
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phaseTitle">عنوان المرحلة</Label>
                      <Input
                        id="phaseTitle"
                        value={taskForm.phase_title}
                        onChange={(e) => setTaskForm(prev => ({
                          ...prev,
                          phase_title: e.target.value
                        }))}
                        placeholder="عنوان المرحلة"
                      />
                    </div>
                    <div>
                      <Label htmlFor="taskTitle">عنوان المهمة</Label>
                      <Input
                        id="taskTitle"
                        value={taskForm.task_title}
                        onChange={(e) => setTaskForm(prev => ({
                          ...prev,
                          task_title: e.target.value
                        }))}
                        placeholder="عنوان المهمة"
                      />
                    </div>
                    <div>
                      <Label htmlFor="taskDescription">وصف المهمة</Label>
                      <Textarea
                        id="taskDescription"
                        value={taskForm.task_description}
                        onChange={(e) => setTaskForm(prev => ({
                          ...prev,
                          task_description: e.target.value
                        }))}
                        placeholder="وصف تفصيلي للمهمة"
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={taskForm.is_active}
                        onCheckedChange={(checked) => setTaskForm(prev => ({
                          ...prev,
                          is_active: checked
                        }))}
                      />
                      <Label htmlFor="isActive">مهمة نشطة</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowTaskDialog(false)}>
                      إلغاء
                    </Button>
                    <Button onClick={handleTaskSubmit}>
                      <Save className="h-4 w-4 mr-2" />
                      {editingTask ? 'تحديث' : 'إضافة'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{phases.length}</p>
              <p className="text-sm text-muted-foreground">المراحل</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="bg-green-100 p-2 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{tasks.length}</p>
              <p className="text-sm text-muted-foreground">إجمالي المهام</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{tasks.filter(t => t.is_active).length}</p>
              <p className="text-sm text-muted-foreground">المهام النشطة</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="bg-amber-100 p-2 rounded-lg">
              <Users className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{tasks.filter(t => !t.is_active).length}</p>
              <p className="text-sm text-muted-foreground">المهام المعطلة</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* قائمة المراحل والمهام */}
      <div className="space-y-4">
        {phases.map((phase) => {
          const phaseTasks = tasks.filter(t => t.phase_number === phase.phase_number);
          
          return (
            <Card key={phase.phase_number}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">المرحلة {phase.phase_number}</Badge>
                    {editingPhase === phase.phase_number ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={phase.phase_title}
                          onChange={(e) => {
                            // Update local state for immediate feedback
                          }}
                          className="h-8"
                        />
                        <Button size="sm" onClick={() => handleUpdatePhaseTitle(phase.phase_number, phase.phase_title)}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingPhase(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{phase.phase_title}</CardTitle>
                        <Button size="sm" variant="ghost" onClick={() => setEditingPhase(phase.phase_number)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{phase.task_count} مهام</Badge>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>حذف المرحلة</AlertDialogTitle>
                          <AlertDialogDescription>
                            هل أنت متأكد من حذف المرحلة "{phase.phase_title}" وجميع مهامها؟
                            هذا الإجراء لا يمكن التراجع عنه.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deletePhase(phase.phase_number)}>
                            حذف
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* زر إضافة مهمة جديدة للمرحلة */}
                <div className="mb-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleAddTaskToPhase(phase)}
                    className="w-full border-dashed gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    إضافة مهمة جديدة للمرحلة
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {phaseTasks.map((task, index) => (
                    <div
                      key={task.id}
                      className={`p-4 border rounded-lg ${
                        task.is_active ? 'bg-background' : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Badge variant={task.is_active ? "default" : "secondary"} className="text-xs">
                              {phase.phase_number}.{task.order_index}
                            </Badge>
                            {!task.is_active && (
                              <Badge variant="destructive" className="text-xs">معطل</Badge>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{task.task_title}</p>
                            {task.task_description && (
                              <p className="text-sm text-muted-foreground">
                                {task.task_description}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveTaskUp(task.id, index)}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveTaskDown(task.id, index, phaseTasks.length)}
                            disabled={index === phaseTasks.length - 1}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleAddSubTask(task)}
                            title="إضافة مهمة فرعية"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditTask(task)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>حذف المهمة</AlertDialogTitle>
                                <AlertDialogDescription>
                                  هل أنت متأكد من حذف المهمة "{task.task_title}"؟
                                  سيتم التحقق من وجود تقدم للطلاب قبل الحذف.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteTask(task.id)}>
                                  حذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* رسالة إذا لم توجد مهام */}
      {phases.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد مهام</h3>
              <p className="text-muted-foreground mb-4">ابدأ بإضافة مرحلة ومهام جديدة</p>
              <Button onClick={() => setShowPhaseDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                إضافة مرحلة
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Grade12DefaultTasksManager;