import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useGrade12DefaultTasks } from '@/hooks/useGrade12DefaultTasks';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  CheckCircle,
  Circle,
  ChevronDown,
  ChevronRight,
  Target,
  Trophy,
  Clock,
  User,
  BookOpen,
  FileText,
  MessageSquare,
  TrendingUp,
  Award,
  List
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const Grade12DefaultTasks: React.FC = () => {
  const { userProfile } = useAuth();
  const {
    phases,
    loading,
    updateTaskCompletion,
    getOverallProgress,
  } = useGrade12DefaultTasks();

  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set([1])); // توسيع المرحلة الأولى افتراضياً
  const [taskNotes, setTaskNotes] = useState<Record<string, string>>({});

  const isStudent = userProfile?.role === 'student';
  const isTeacher = userProfile?.role === 'teacher' || userProfile?.role === 'school_admin' || userProfile?.role === 'superadmin';
  const overallProgress = getOverallProgress();

  // تبديل توسيع المرحلة
  const togglePhaseExpansion = (phaseNumber: number) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseNumber)) {
      newExpanded.delete(phaseNumber);
    } else {
      newExpanded.add(phaseNumber);
    }
    setExpandedPhases(newExpanded);
  };

  // تحديث حالة المهمة
  const handleTaskToggle = async (taskId: string, isCompleted: boolean) => {
    logger.debug('Task toggle initiated', {
      taskId,
      isCompleted,
      userProfile: userProfile ? {
        user_id: userProfile.user_id,
        role: userProfile.role,
        email: userProfile.email
      } : null,
      isStudent,
      isTeacher
    });

    if (!isStudent) {
      logger.warn('Non-student user trying to toggle task', { 
        userRole: userProfile?.role,
        userId: userProfile?.user_id 
      });
      toast.error('فقط الطلاب يمكنهم تحديث حالة المهام');
      return;
    }

    try {
      const notes = taskNotes[taskId] || '';
      logger.debug('Task notes prepared for submission', { taskId, notes });
      
      await updateTaskCompletion(taskId, isCompleted, notes);
      
      // مسح الملاحظات المحلية بعد الحفظ
      if (isCompleted) {
        setTaskNotes(prev => {
          const newNotes = { ...prev };
          delete newNotes[taskId];
          return newNotes;
        });
      }
    } catch (error) {
      logger.error('Error in task toggle', error as Error, { taskId, isCompleted });
      // الخطأ سيتم عرضه بواسطة updateTaskCompletion
    }
  };

  // الحصول على لون البادج حسب نسبة الإنجاز
  const getProgressBadgeColor = (percentage: number): string => {
    if (percentage === 100) return 'bg-green-100 text-green-700 border-green-200';
    if (percentage >= 75) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (percentage >= 50) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (percentage >= 25) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-4 bg-muted rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header مع التقدم الإجمالي */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Trophy className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">جدول مهام المشروع النهائي</CardTitle>
                <CardDescription>
                  {isStudent ? 'تتبع تقدمك في إنجاز مشروعك النهائي خطوة بخطوة' : 'مراقبة تقدم الطلاب في المشروع النهائي'}
                </CardDescription>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {overallProgress.percentage}%
              </div>
              <div className="text-sm text-muted-foreground">
                {overallProgress.completed} من {overallProgress.total} مهمة
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>التقدم الإجمالي</span>
              <span className="font-medium">{overallProgress.percentage}%</span>
            </div>
            <Progress value={overallProgress.percentage} className="h-3" />
          </div>
        </CardHeader>
      </Card>

      {/* إحصائيات المراحل */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="bg-green-100 p-2 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{phases.filter(p => p.completion_percentage === 100).length}</p>
              <p className="text-sm text-muted-foreground">مراحل مكتملة</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{phases.filter(p => p.completion_percentage > 0 && p.completion_percentage < 100).length}</p>
              <p className="text-sm text-muted-foreground">مراحل قيد التنفيذ</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="bg-gray-100 p-2 rounded-lg">
              <Circle className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{phases.filter(p => p.completion_percentage === 0).length}</p>
              <p className="text-sm text-muted-foreground">مراحل لم تبدأ</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Target className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{phases.length}</p>
              <p className="text-sm text-muted-foreground">إجمالي المراحل</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* قائمة المراحل */}
      <div className="space-y-4">
        {phases.map((phase) => {
          const isExpanded = expandedPhases.has(phase.phase_number);
          
          return (
            <Card key={phase.phase_number} className="overflow-hidden">
              <Collapsible open={isExpanded} onOpenChange={() => togglePhaseExpansion(phase.phase_number)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                          <Badge variant="outline" className="text-sm">
                            المرحلة {phase.phase_number}
                          </Badge>
                        </div>
                        
                        <div>
                          <CardTitle className="text-lg">{phase.phase_title}</CardTitle>
                          <CardDescription>
                            {phase.completed_count} من {phase.total_count} مهام مكتملة
                          </CardDescription>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge className={getProgressBadgeColor(phase.completion_percentage)}>
                          {phase.completion_percentage}%
                        </Badge>
                        
                        <div className="w-24">
                          <Progress value={phase.completion_percentage} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {phase.tasks.map((task, index) => {
                        const isCompleted = task.progress?.is_completed || false;
                        const taskId = task.id;
                        
                        return (
                          <div 
                            key={task.id}
                            className={`p-4 border rounded-lg transition-all ${
                              isCompleted 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-background border-border hover:bg-muted/50'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-sm text-muted-foreground font-mono">
                                  {phase.phase_number}.{index + 1}
                                </span>
                                
                                {isStudent && (
                                  <Checkbox
                                    checked={isCompleted}
                                    onCheckedChange={(checked) => handleTaskToggle(taskId, checked === true)}
                                    className="mt-1"
                                  />
                                )}
                                
                                {!isStudent && (
                                  <div className={`p-1 rounded-full ${
                                    isCompleted ? 'bg-green-100' : 'bg-gray-100'
                                  }`}>
                                    {isCompleted ? (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <Circle className="h-4 w-4 text-gray-400" />
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <p className={`font-medium ${
                                  isCompleted ? 'line-through text-muted-foreground' : ''
                                }`}>
                                  {task.task_title}
                                </p>
                                
                                {task.task_description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {task.task_description}
                                  </p>
                                )}
                                
                                {isCompleted && task.progress?.completed_at && (
                                  <div className="flex items-center gap-2 mt-2 text-xs text-green-600">
                                    <CheckCircle className="h-3 w-3" />
                                    <span>
                                      تم الإنجاز في {format(new Date(task.progress.completed_at), 'dd MMM yyyy', { locale: ar })}
                                    </span>
                                  </div>
                                )}
                                
                                {task.progress?.notes && (
                                  <div className="mt-2 p-2 bg-muted rounded text-sm">
                                    <strong>ملاحظات:</strong> {task.progress.notes}
                                  </div>
                                )}
                                
                                {/* إضافة ملاحظات للطلاب */}
                                {isStudent && !isCompleted && (
                                  <div className="mt-3">
                                    <Textarea
                                      placeholder="إضافة ملاحظات (اختياري)..."
                                      value={taskNotes[taskId] || ''}
                                      onChange={(e) => setTaskNotes(prev => ({
                                        ...prev,
                                        [taskId]: e.target.value
                                      }))}
                                      rows={2}
                                      className="text-sm"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* رسالة تشجيعية */}
      {overallProgress.percentage === 100 && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="bg-green-100 p-3 rounded-full">
              <Award className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-green-800">
                🎉 مبروك! لقد أنجزت جميع المهام
              </h3>
              <p className="text-green-700">
                لقد أكملت جميع مراحل المشروع النهائي. يمكنك الآن المتابعة لتقديم مشروعك النهائي.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Grade12DefaultTasks;