import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useTeacherContentAccess } from './useTeacherContentAccess';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

// Types للمشاريع النهائية
interface Grade12FinalProject {
  id: string;
  student_id: string;
  title: string;
  description?: string;
  content?: string;
  project_content?: string; // إضافة الحقل الجديد
  status: string;
  grade?: number;
  teacher_feedback?: string;
  due_date?: string;
  submitted_at?: string;
  school_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface Grade12ProjectTask {
  id: string;
  project_id: string;
  parent_task_id?: string;
  title: string;
  description?: string;
  is_completed: boolean;
  due_date?: string;
  completed_at?: string;
  order_index: number;
  task_type: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  subtasks?: Grade12ProjectTask[];
}

interface Grade12ProjectComment {
  id: string;
  project_id: string;
  comment: string;
  comment_type: string;
  created_by: string;
  created_at: string;
}

interface Grade12ProjectRevision {
  id: string;
  project_id: string;
  content_snapshot: string;
  revision_note?: string;
  created_by: string;
  created_at: string;
}

export const useGrade12Projects = () => {
  const { userProfile } = useAuth();
  const { canAccessGrade, loading: accessLoading } = useTeacherContentAccess();
  const [projects, setProjects] = useState<Grade12FinalProject[]>([]);
  const [currentProject, setCurrentProject] = useState<Grade12FinalProject | null>(null);
  const [tasks, setTasks] = useState<Grade12ProjectTask[]>([]);
  const [comments, setComments] = useState<Grade12ProjectComment[]>([]);
  const [revisions, setRevisions] = useState<Grade12ProjectRevision[]>([]);
  const [loading, setLoading] = useState(true);

  // جلب المشاريع
  const fetchProjects = async () => {
    try {
      setLoading(true);
      logger.debug('Starting to fetch Grade 12 projects');
      
      // إذا كان المستخدم معلم، التحقق من الصلاحيات أولاً
      if (userProfile?.role === 'teacher') {
        if (!canAccessGrade('12')) {
          logger.info('Teacher does not have access to Grade 12 projects');
          setProjects([]);
          return;
        }
      }
      
      let query = supabase
        .from('grade12_final_projects')
        .select('*');

      // إذا كان المستخدم معلم، فلترة المشاريع حسب الطلاب المسؤول عنهم
      if (userProfile?.role === 'teacher') {
        // جلب المشاريع للطلاب المسؤول عنهم المعلم فقط
        const { data: authorizedStudents, error: authError } = await supabase
          .rpc('get_teacher_assigned_projects', { 
            teacher_user_id: userProfile.user_id, 
            project_grade: '12' 
          });

        if (authError) {
          logger.error('Error checking teacher authorization', authError);
          throw authError;
        }

        // فلترة الطلاب المصرح لهم
        const authorizedStudentIds = authorizedStudents
          ?.filter(s => s.is_authorized)
          ?.map(s => s.student_id) || [];

        if (authorizedStudentIds.length === 0) {
          logger.info('Teacher has no authorized students for Grade 12');
          setProjects([]);
          return;
        }

        query = query.in('student_id', authorizedStudentIds);
      }

      const { data: projectsData, error: projectsError } = await query.order('created_at', { ascending: false });

      if (projectsError) {
        logger.error('Error fetching projects', projectsError);
        throw projectsError;
      }

      if (!projectsData || projectsData.length === 0) {
        setProjects([]);
        return;
      }

      // Get unique student IDs
      const studentIds = [...new Set(projectsData.map(p => p.student_id))];
      
      // Fetch student profiles separately
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', studentIds);

      if (studentsError) {
        logger.warn('Error fetching student profiles, using projects without names', studentsError as any);
      }

      // Combine data
      const projectsWithStudents = projectsData.map(project => ({
        ...project,
        student_profile: studentsData?.find(student => student.user_id === project.student_id) || null
      }));

      logger.debug('Projects fetched successfully', { 
        projectsCount: projectsData.length,
        studentsCount: studentsData?.length || 0,
        userRole: userProfile?.role
      });
      
      setProjects(projectsWithStudents);
    } catch (error) {
      logger.error('Error fetching projects', error as Error);
      toast.error('خطأ في جلب المشاريع');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  // جلب المهام
  const fetchTasks = async (projectId?: string) => {
    try {
      let query = supabase
        .from('grade12_project_tasks')
        .select('*')
        .order('order_index', { ascending: true });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // تنظيم المهام الهرمية
      const organizedTasks = organizeTasks(data || []);
      setTasks(organizedTasks);
    } catch (error) {
      logger.error('Error fetching tasks', error as Error);
      toast.error('خطأ في جلب المهام');
    }
  };

  // تنظيم المهام في هيكل هرمي
  const organizeTasks = (tasksData: Grade12ProjectTask[]): Grade12ProjectTask[] => {
    const taskMap = new Map<string, Grade12ProjectTask>();
    const mainTasks: Grade12ProjectTask[] = [];

    // إنشاء خريطة للمهام
    tasksData.forEach(task => {
      taskMap.set(task.id, { ...task, subtasks: [] });
    });

    // تنظيم المهام الهرمية
    tasksData.forEach(task => {
      const taskWithSubtasks = taskMap.get(task.id)!;
      
      if (task.parent_task_id) {
        const parentTask = taskMap.get(task.parent_task_id);
        if (parentTask) {
          parentTask.subtasks!.push(taskWithSubtasks);
        }
      } else {
        mainTasks.push(taskWithSubtasks);
      }
    });

    return mainTasks;
  };

  // إنشاء مشروع جديد
  const createProject = async (projectData: Partial<Grade12FinalProject>) => {
    try {
      if (!userProfile?.user_id) {
        logger.error('User not authenticated');
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      // التحقق من البيانات المطلوبة
      if (!projectData.title?.trim()) {
        throw new Error('عنوان المشروع مطلوب');
      }

      logger.debug('Creating project with data', {
        title: projectData.title,
        description: projectData.description,
        status: projectData.status,
        due_date: projectData.due_date,
        student_id: userProfile.user_id,
        school_id: userProfile.school_id
      });

      const insertData = {
        title: projectData.title.trim(),
        description: projectData.description?.trim() || '',
        status: projectData.status || 'draft',
        due_date: projectData.due_date || null,
        student_id: userProfile.user_id,
        // school_id مؤقتاً اختياري حتى يتم إصلاح بيانات المستخدمين
        school_id: userProfile.school_id || null,
        created_by: userProfile.user_id,
      };

      const { data, error } = await supabase
        .from('grade12_final_projects')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        logger.error('Supabase error creating project', error);
        if (error.code === '42501') {
          throw new Error('ليس لديك صلاحية لإنشاء مشروع. تحقق من تسجيل الدخول.');
        } else if (error.code === '23503') {
          throw new Error('خطأ في ربط البيانات. تحقق من معلومات المدرسة.');
        } else {
          throw new Error(`فشل في إنشاء المشروع: ${error.message}`);
        }
      }

      logger.info('Project created successfully', { project: data });
      setProjects(prev => [data, ...prev]);
      toast.success('تم إنشاء المشروع بنجاح');
      
      return data;
    } catch (error: any) {
      logger.error('Error in createProject', error);
      toast.error(error.message || 'خطأ في إنشاء المشروع');
      throw error;
    }
  };

  // تحديث المشروع
  const updateProject = async (projectId: string, updates: Partial<Grade12FinalProject>) => {
    try {
      const { data, error } = await supabase
        .from('grade12_final_projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;

      setProjects(prev => prev.map(p => p.id === projectId ? data : p));
      toast.success('تم تحديث المشروع بنجاح');
      
      return data;
    } catch (error) {
      logger.error('Error updating project', error as Error);
      toast.error('خطأ في تحديث المشروع');
      throw error;
    }
  };

  // حفظ مراجعة تلقائية للمشروع
  const saveRevision = async (projectId: string, content: string, note?: string) => {
    try {
      const { data, error } = await supabase
        .from('grade12_project_revisions')
        .insert([{
          project_id: projectId,
          content_snapshot: content,
          revision_note: note,
          created_by: userProfile?.user_id,
        }])
        .select()
        .single();

      if (error) throw error;
      
      setRevisions(prev => [data, ...prev]);
      return data;
    } catch (error) {
      logger.error('Error saving revision', error as Error);
      throw error;
    }
  };

  // إضافة مهمة جديدة
  const addTask = async (taskData: Partial<Grade12ProjectTask>) => {
    try {
      const insertData = {
        project_id: taskData.project_id!,
        parent_task_id: taskData.parent_task_id,
        title: taskData.title!,
        description: taskData.description,
        order_index: taskData.order_index || 0,
        task_type: taskData.task_type || 'main',
        created_by: userProfile?.user_id!,
      };

      const { data, error } = await supabase
        .from('grade12_project_tasks')
        .insert(insertData) // Use single object, not array
        .select()
        .single();

      if (error) throw error;
      
      await fetchTasks(taskData.project_id);
      toast.success('تم إضافة المهمة بنجاح');
      
      return data;
    } catch (error) {
      logger.error('Error adding task', error as Error);
      toast.error('خطأ في إضافة المهمة');
      throw error;
    }
  };

  // تحديث حالة المهمة
  const updateTaskStatus = async (taskId: string, isCompleted: boolean) => {
    try {
      const { data, error } = await supabase
        .from('grade12_project_tasks')
        .update({
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      setTasks(prev => updateTaskInHierarchy(prev, taskId, { is_completed: isCompleted, completed_at: data.completed_at }));
      toast.success(isCompleted ? 'تم إنجاز المهمة' : 'تم إلغاء إنجاز المهمة');
      
      return data;
    } catch (error) {
      logger.error('Error updating task status', error as Error);
      toast.error('خطأ في تحديث حالة المهمة');
      throw error;
    }
  };

  // تحديث المهمة في الهيكل الهرمي
  const updateTaskInHierarchy = (tasks: Grade12ProjectTask[], taskId: string, updates: Partial<Grade12ProjectTask>): Grade12ProjectTask[] => {
    return tasks.map(task => {
      if (task.id === taskId) {
        return { ...task, ...updates };
      }
      if (task.subtasks && task.subtasks.length > 0) {
        return {
          ...task,
          subtasks: updateTaskInHierarchy(task.subtasks, taskId, updates)
        };
      }
      return task;
    });
  };

  // حذف مهمة
  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('grade12_project_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => removeTaskFromHierarchy(prev, taskId));
      toast.success('تم حذف المهمة بنجاح');
    } catch (error) {
      logger.error('Error deleting task', error as Error);
      toast.error('خطأ في حذف المهمة');
      throw error;
    }
  };

  // حذف المهمة من الهيكل الهرمي
  const removeTaskFromHierarchy = (tasks: Grade12ProjectTask[], taskId: string): Grade12ProjectTask[] => {
    return tasks.filter(task => {
      if (task.id === taskId) {
        return false;
      }
      if (task.subtasks && task.subtasks.length > 0) {
        task.subtasks = removeTaskFromHierarchy(task.subtasks, taskId);
      }
      return true;
    });
  };

  // إضافة تعليق
  const addComment = async (commentData: Partial<Grade12ProjectComment>) => {
    try {
      const insertData = {
        project_id: commentData.project_id!,
        comment: commentData.comment!,
        comment_type: commentData.comment_type || 'feedback',
        created_by: userProfile?.user_id!,
      };

      const { data, error } = await supabase
        .from('grade12_project_comments')
        .insert(insertData) // Use single object, not array
        .select()
        .single();

      if (error) throw error;
      
      setComments(prev => [data, ...prev]);
      toast.success('تم إضافة التعليق بنجاح');
      
      return data;
    } catch (error) {
      logger.error('Error adding comment', error as Error);
      toast.error('خطأ في إضافة التعليق');
      throw error;
    }
  };

  // جلب التعليقات
  const fetchComments = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('grade12_project_comments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      logger.error('Error fetching comments', error as Error);
      toast.error('خطأ في جلب التعليقات');
    }
  };

  // جلب المراجعات
  const fetchRevisions = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('grade12_project_revisions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRevisions(data || []);
    } catch (error) {
      logger.error('Error fetching revisions', error as Error);
      toast.error('خطأ في جلب المراجعات');
    }
  };

  useEffect(() => {
    if (userProfile && !accessLoading) {
      fetchProjects();
    }
  }, [userProfile, accessLoading, canAccessGrade]);

  return {
    projects,
    currentProject,
    setCurrentProject,
    tasks,
    comments,
    revisions,
    loading,
    fetchProjects,
    fetchTasks,
    fetchComments,
    fetchRevisions,
    createProject,
    updateProject,
    saveRevision,
    addTask,
    updateTaskStatus,
    deleteTask,
    addComment,
  };
};