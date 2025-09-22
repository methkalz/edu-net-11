import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

// Types للمهام الافتراضية
interface Grade12DefaultTask {
  id: string;
  phase_number: number;
  phase_title: string;
  task_title: string;
  task_description?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Grade12StudentTaskProgress {
  id: string;
  student_id: string;
  default_task_id: string;
  is_completed: boolean;
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface TaskPhase {
  phase_number: number;
  phase_title: string;
  tasks: (Grade12DefaultTask & { progress?: Grade12StudentTaskProgress })[];
  completed_count: number;
  total_count: number;
  completion_percentage: number;
}

export const useGrade12DefaultTasks = () => {
  const { userProfile } = useAuth();
  const [phases, setPhases] = useState<TaskPhase[]>([]);
  const [loading, setLoading] = useState(true);
  const [allTasks, setAllTasks] = useState<Grade12DefaultTask[]>([]);
  const [studentProgress, setStudentProgress] = useState<Grade12StudentTaskProgress[]>([]);

  // جلب المهام الافتراضية
  const fetchDefaultTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('grade12_default_tasks')
        .select('*')
        .eq('is_active', true)
        .order('phase_number', { ascending: true })
        .order('order_index', { ascending: true });

      if (error) throw error;
      setAllTasks(data || []);
      return data || [];
    } catch (error) {
      logger.error('Error fetching default tasks', error as Error);
      toast.error('خطأ في جلب المهام الافتراضية');
      return [];
    }
  };

  // جلب تقدم الطالب
  const fetchStudentProgress = async () => {
    try {
      if (!userProfile?.user_id) return [];

      const { data, error } = await supabase
        .from('grade12_student_task_progress')
        .select('*')
        .eq('student_id', userProfile.user_id);

      if (error) throw error;
      setStudentProgress(data || []);
      return data || [];
    } catch (error) {
      logger.error('Error fetching student progress', error as Error, { userId: userProfile?.user_id });
      toast.error('خطأ في جلب تقدم الطالب');
      return [];
    }
  };

  // تنظيم المهام حسب المراحل
  const organizeTasksByPhases = (tasks: Grade12DefaultTask[], progress: Grade12StudentTaskProgress[]): TaskPhase[] => {
    const phaseMap = new Map<number, TaskPhase>();

    tasks.forEach(task => {
      if (!phaseMap.has(task.phase_number)) {
        phaseMap.set(task.phase_number, {
          phase_number: task.phase_number,
          phase_title: task.phase_title,
          tasks: [],
          completed_count: 0,
          total_count: 0,
          completion_percentage: 0
        });
      }

      const phase = phaseMap.get(task.phase_number)!;
      const taskProgress = progress.find(p => p.default_task_id === task.id);
      
      phase.tasks.push({
        ...task,
        progress: taskProgress
      });
      
      phase.total_count++;
      if (taskProgress?.is_completed) {
        phase.completed_count++;
      }
    });

    // حساب نسبة الإنجاز لكل مرحلة
    const phasesArray = Array.from(phaseMap.values());
    phasesArray.forEach(phase => {
      phase.completion_percentage = phase.total_count > 0 
        ? Math.round((phase.completed_count / phase.total_count) * 100) 
        : 0;
    });

    return phasesArray.sort((a, b) => a.phase_number - b.phase_number);
  };

  // تحديث حالة إنجاز المهمة
  const updateTaskCompletion = async (taskId: string, isCompleted: boolean, notes?: string) => {
    try {
      logger.debug('updateTaskCompletion initiated', {
        taskId,
        isCompleted,
        notes,
        userProfile: userProfile ? {
          user_id: userProfile.user_id,
          role: userProfile.role,
          email: userProfile.email
        } : null
      });

      if (!userProfile?.user_id) {
        const errorMsg = 'المستخدم غير مصادق عليه';
        logger.error('Auth error - user not authenticated', new Error(errorMsg));
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }

      const updateData = {
        student_id: userProfile.user_id,
        default_task_id: taskId,
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
        notes: notes || null,
      };

      logger.debug('Preparing to upsert task data', updateData);

      const { data, error } = await supabase
        .from('grade12_student_task_progress')
        .upsert(updateData, {
          onConflict: 'student_id,default_task_id'
        })
        .select()
        .single();

      logger.debug('Supabase response received', { data, error });

      if (error) {
        logger.error('Supabase error during task update', error);
        toast.error(`خطأ في قاعدة البيانات: ${error.message}`);
        throw error;
      }

      // تحديث الحالة المحلية
      setStudentProgress(prev => {
        const filtered = prev.filter(p => p.default_task_id !== taskId);
        const newProgress = [...filtered, data];
        logger.debug('Updated local progress after task change', { taskId, newProgressCount: newProgress.length });
        return newProgress;
      });

      const successMsg = isCompleted ? 'تم إنجاز المهمة' : 'تم إلغاء إنجاز المهمة';
      logger.info('Task update completed successfully', { taskId, isCompleted, successMsg });
      toast.success(successMsg);
      return data;
    } catch (error) {
      logger.error('Error updating task completion', error as Error, { taskId, isCompleted });
      
      // تحسين رسالة الخطأ حسب نوع الخطأ
      let errorMessage = 'خطأ في تحديث حالة المهمة';
      if (error instanceof Error) {
        if (error.message.includes('permission denied') || error.message.includes('policy')) {
          errorMessage = 'ليس لديك صلاحية لتحديث هذه المهمة';
        } else if (error.message.includes('network')) {
          errorMessage = 'خطأ في الاتصال بقاعدة البيانات';
        } else {
          errorMessage = `خطأ: ${error.message}`;
        }
      }
      
      toast.error(errorMessage);
      throw error;
    }
  };

  // حساب التقدم الإجمالي
  const getOverallProgress = (): { completed: number; total: number; percentage: number } => {
    const total = allTasks.length;
    const completed = studentProgress.filter(p => p.is_completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
  };

  // جلب البيانات عند التحميل
  const loadData = async () => {
    try {
      setLoading(true);
      const [tasks, progress] = await Promise.all([
        fetchDefaultTasks(),
        fetchStudentProgress()
      ]);
      
      const organizedPhases = organizeTasksByPhases(tasks, progress);
      setPhases(organizedPhases);
    } catch (error) {
      logger.error('Error loading default tasks and progress data', error as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile) {
      loadData();
    }
  }, [userProfile]);

  // إعادة تنظيم المراحل عند تغيير التقدم
  useEffect(() => {
    if (allTasks.length > 0) {
      const organizedPhases = organizeTasksByPhases(allTasks, studentProgress);
      setPhases(organizedPhases);
    }
  }, [allTasks, studentProgress]);

  return {
    phases,
    loading,
    allTasks,
    studentProgress,
    updateTaskCompletion,
    getOverallProgress,
    refetch: loadData,
  };
};