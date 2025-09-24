import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

// Types للإدارة
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

interface TaskFormData {
  phase_number: number;
  phase_title: string;
  task_title: string;
  task_description?: string;
  order_index: number;
  is_active: boolean;
}

interface PhaseInfo {
  phase_number: number;
  phase_title: string;
  task_count: number;
}

export const useGrade12DefaultTasksAdmin = () => {
  const { userProfile } = useAuth();
  const [tasks, setTasks] = useState<Grade12DefaultTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [phases, setPhases] = useState<PhaseInfo[]>([]);

  // التحقق من صلاحيات السوبر آدمن
  const isSuperAdmin = userProfile?.role === 'superadmin';

  // جلب جميع المهام
  const fetchAllTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('grade12_default_tasks')
        .select('*')
        .order('phase_number', { ascending: true })
        .order('order_index', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
      
      // استخراج معلومات المراحل
      const phaseMap = new Map<number, PhaseInfo>();
      (data || []).forEach(task => {
        if (!phaseMap.has(task.phase_number)) {
          phaseMap.set(task.phase_number, {
            phase_number: task.phase_number,
            phase_title: task.phase_title,
            task_count: 0
          });
        }
        phaseMap.get(task.phase_number)!.task_count++;
      });
      
      const phasesArray = Array.from(phaseMap.values())
        .sort((a, b) => a.phase_number - b.phase_number);
      setPhases(phasesArray);
      
      return data || [];
    } catch (error) {
      logger.error('Error fetching all tasks', error as Error);
      toast.error('خطأ في جلب المهام');
      return [];
    }
  };

  // إضافة مهمة جديدة
  const addTask = async (taskData: Omit<TaskFormData, 'order_index'>) => {
    try {
      if (!isSuperAdmin) {
        toast.error('ليس لديك صلاحية لإضافة المهام');
        return null;
      }

      // حساب الترتيب التلقائي
      const existingTasks = tasks.filter(t => t.phase_number === taskData.phase_number);
      const maxOrderIndex = existingTasks.length > 0 
        ? Math.max(...existingTasks.map(t => t.order_index)) 
        : 0;

      const newTaskData = {
        ...taskData,
        order_index: maxOrderIndex + 1
      };

      const { data, error } = await supabase
        .from('grade12_default_tasks')
        .insert([newTaskData])
        .select()
        .single();

      if (error) throw error;

      await fetchAllTasks(); // إعادة جلب البيانات
      toast.success('تم إضافة المهمة بنجاح');
      return data;
    } catch (error) {
      logger.error('Error adding task', error as Error);
      toast.error('خطأ في إضافة المهمة');
      return null;
    }
  };

  // تحديث مهمة
  const updateTask = async (taskId: string, taskData: Partial<TaskFormData>) => {
    try {
      if (!isSuperAdmin) {
        toast.error('ليس لديك صلاحية لتحديث المهام');
        return null;
      }

      const { data, error } = await supabase
        .from('grade12_default_tasks')
        .update(taskData)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      await fetchAllTasks(); // إعادة جلب البيانات
      toast.success('تم تحديث المهمة بنجاح');
      return data;
    } catch (error) {
      logger.error('Error updating task', error as Error);
      toast.error('خطأ في تحديث المهمة');
      return null;
    }
  };

  // حذف مهمة
  const deleteTask = async (taskId: string) => {
    try {
      if (!isSuperAdmin) {
        toast.error('ليس لديك صلاحية لحذف المهام');
        return false;
      }

      // التحقق من وجود تقدم للطلاب على هذه المهمة
      const { data: progressData, error: progressError } = await supabase
        .from('grade12_student_task_progress')
        .select('id')
        .eq('default_task_id', taskId);

      if (progressError) throw progressError;

      if (progressData && progressData.length > 0) {
        toast.error(`لا يمكن حذف هذه المهمة لأن ${progressData.length} طالب لديهم تقدم فيها`);
        return false;
      }

      const { error } = await supabase
        .from('grade12_default_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      await fetchAllTasks(); // إعادة جلب البيانات
      toast.success('تم حذف المهمة بنجاح');
      return true;
    } catch (error) {
      logger.error('Error deleting task', error as Error);
      toast.error('خطأ في حذف المهمة');
      return false;
    }
  };

  // إعادة ترتيب المهام
  const reorderTasks = async (reorderedTasks: Grade12DefaultTask[]) => {
    try {
      if (!isSuperAdmin) {
        toast.error('ليس لديك صلاحية لإعادة ترتيب المهام');
        return false;
      }

      // تحديث ترتيب المهام
      const updates = reorderedTasks.map((task, index) => ({
        id: task.id,
        order_index: index + 1,
        phase_number: task.phase_number
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('grade12_default_tasks')
          .update({ 
            order_index: update.order_index,
            phase_number: update.phase_number
          })
          .eq('id', update.id);

        if (error) throw error;
      }

      await fetchAllTasks(); // إعادة جلب البيانات
      toast.success('تم إعادة ترتيب المهام بنجاح');
      return true;
    } catch (error) {
      logger.error('Error reordering tasks', error as Error);
      toast.error('خطأ في إعادة ترتيب المهام');
      return false;
    }
  };

  // إضافة مرحلة جديدة
  const addPhase = async (phaseTitle: string) => {
    try {
      if (!isSuperAdmin) {
        toast.error('ليس لديك صلاحية لإضافة المراحل');
        return null;
      }

      // حساب رقم المرحلة الجديدة
      const maxPhaseNumber = phases.length > 0 
        ? Math.max(...phases.map(p => p.phase_number)) 
        : 0;

      const newPhaseData = {
        phase_number: maxPhaseNumber + 1,
        phase_title: phaseTitle,
        task_title: 'مهمة افتراضية',
        task_description: 'وصف المهمة',
        order_index: 1,
        is_active: true
      };

      const { data, error } = await supabase
        .from('grade12_default_tasks')
        .insert([newPhaseData])
        .select()
        .single();

      if (error) throw error;

      await fetchAllTasks(); // إعادة جلب البيانات
      toast.success('تم إضافة المرحلة بنجاح');
      return data;
    } catch (error) {
      logger.error('Error adding phase', error as Error);
      toast.error('خطأ في إضافة المرحلة');
      return null;
    }
  };

  // حذف مرحلة كاملة
  const deletePhase = async (phaseNumber: number) => {
    try {
      if (!isSuperAdmin) {
        toast.error('ليس لديك صلاحية لحذف المراحل');
        return false;
      }

      // التحقق من وجود تقدم للطلاب في هذه المرحلة
      const phaseTasks = tasks.filter(t => t.phase_number === phaseNumber);
      const taskIds = phaseTasks.map(t => t.id);

      if (taskIds.length > 0) {
        const { data: progressData, error: progressError } = await supabase
          .from('grade12_student_task_progress')
          .select('id')
          .in('default_task_id', taskIds);

        if (progressError) throw progressError;

        if (progressData && progressData.length > 0) {
          toast.error(`لا يمكن حذف هذه المرحلة لأن ${progressData.length} طالب لديهم تقدم فيها`);
          return false;
        }
      }

      const { error } = await supabase
        .from('grade12_default_tasks')
        .delete()
        .eq('phase_number', phaseNumber);

      if (error) throw error;

      await fetchAllTasks(); // إعادة جلب البيانات
      toast.success('تم حذف المرحلة بنجاح');
      return true;
    } catch (error) {
      logger.error('Error deleting phase', error as Error);
      toast.error('خطأ في حذف المرحلة');
      return false;
    }
  };

  // تحديث عنوان المرحلة
  const updatePhaseTitle = async (phaseNumber: number, newTitle: string) => {
    try {
      if (!isSuperAdmin) {
        toast.error('ليس لديك صلاحية لتحديث المراحل');
        return false;
      }

      const { error } = await supabase
        .from('grade12_default_tasks')
        .update({ phase_title: newTitle })
        .eq('phase_number', phaseNumber);

      if (error) throw error;

      await fetchAllTasks(); // إعادة جلب البيانات
      toast.success('تم تحديث عنوان المرحلة بنجاح');
      return true;
    } catch (error) {
      logger.error('Error updating phase title', error as Error);
      toast.error('خطأ في تحديث عنوان المرحلة');
      return false;
    }
  };

  // تأثير المهام على الطلاب
  const getTaskImpact = async (taskId: string) => {
    try {
      const { data, error } = await supabase
        .from('grade12_student_task_progress')
        .select('*')
        .eq('default_task_id', taskId);

      if (error) throw error;

      const completed = data?.filter(p => p.is_completed).length || 0;
      const inProgress = data?.filter(p => !p.is_completed).length || 0;

      return {
        total_students: data?.length || 0,
        completed_students: completed,
        in_progress_students: inProgress
      };
    } catch (error) {
      logger.error('Error getting task impact', error as Error);
      return {
        total_students: 0,
        completed_students: 0,
        in_progress_students: 0
      };
    }
  };

  // جلب البيانات عند التحميل
  useEffect(() => {
    if (userProfile && isSuperAdmin) {
      fetchAllTasks();
    }
  }, [userProfile, isSuperAdmin]);

  return {
    tasks,
    phases,
    loading,
    isSuperAdmin,
    // CRUD operations
    addTask,
    updateTask,
    deleteTask,
    reorderTasks,
    // Phase operations
    addPhase,
    deletePhase,
    updatePhaseTitle,
    // Utility functions
    getTaskImpact,
    refetch: fetchAllTasks,
  };
};