import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Grade10MiniProject, Grade10ProjectTask, Grade10ProjectComment, Grade10ProjectFile, ProjectFormData, TaskFormData, CommentFormData } from '@/types/grade10-projects';

export const useGrade10MiniProjects = () => {
  const [projects, setProjects] = useState<Grade10MiniProject[]>([]);
  const [currentProject, setCurrentProject] = useState<Grade10MiniProject | null>(null);
  const [tasks, setTasks] = useState<Grade10ProjectTask[]>([]);
  const [comments, setComments] = useState<Grade10ProjectComment[]>([]);
  const [files, setFiles] = useState<Grade10ProjectFile[]>([]);
  const [loading, setLoading] = useState(false);
  const { userProfile } = useAuth();

  // جلب جميع المشاريع
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('grade10_mini_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects((data || []) as Grade10MiniProject[]);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('حدث خطأ في جلب المشاريع');
    } finally {
      setLoading(false);
    }
  };

  // جلب مشروع محدد
  const fetchProject = async (projectId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('grade10_mini_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setCurrentProject(data as Grade10MiniProject);
      
      // جلب المهام والتعليقات والملفات المرتبطة
      await Promise.all([
        fetchTasks(projectId),
        fetchComments(projectId),
        fetchFiles(projectId)
      ]);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('حدث خطأ في جلب المشروع');
    } finally {
      setLoading(false);
    }
  };

  // إنشاء المهام الافتراضية الثابتة
  const createDefaultTasks = async (projectId: string) => {
    console.log('Creating default tasks for project:', projectId);
    
    if (!userProfile?.user_id) {
      throw new Error('User profile is required to create tasks');
    }

    const defaultTasks = [
      { title: 'إنشاء صفحة البداية', order_index: 1 },
      { title: 'اختيار موضوع والشرح عنه', order_index: 2 },
      { title: 'اشرح عن الشركة التي اخترتها', order_index: 3 },
      { title: 'ارفق صور من الشاشة', order_index: 4 },
      { title: 'تغذية مرتدة', order_index: 5 }
    ];

    const tasksToInsert = defaultTasks.map(task => ({
      project_id: projectId,
      title: task.title,
      description: '',
      order_index: task.order_index,
      created_by: userProfile.user_id,
      is_completed: false
    }));

    console.log('Inserting tasks:', tasksToInsert);

    const { data, error } = await supabase
      .from('grade10_project_tasks')
      .insert(tasksToInsert)
      .select();

    if (error) {
      console.error('Error creating default tasks:', error);
      throw error;
    }

    console.log('Default tasks created successfully:', data);
    return data;
  };

  // إنشاء مشروع جديد
  const createProject = async (projectData: ProjectFormData) => {
    console.log('Creating project with data:', projectData);
    console.log('User profile:', userProfile);
    
    try {
      if (!userProfile?.user_id || !userProfile?.school_id) {
        console.error('Missing user profile data:', { userProfile });
        toast.error('يجب تسجيل الدخول أولاً');
        return;
      }

      // إنشاء المشروع
      const projectPayload = {
        ...projectData,
        student_id: userProfile.user_id,
        school_id: userProfile.school_id,
        status: 'draft' as const,
        content: '',
        progress_percentage: 0
      };

      console.log('Creating project with payload:', projectPayload);

      const { data: newProject, error: projectError } = await supabase
        .from('grade10_mini_projects')
        .insert(projectPayload)
        .select()
        .single();

      if (projectError) {
        console.error('Error creating project:', projectError);
        throw projectError;
      }

      console.log('Project created successfully:', newProject);

      // إنشاء المهام الافتراضية للمشروع الجديد
      try {
        await createDefaultTasks(newProject.id);
        console.log('Default tasks created successfully for project:', newProject.id);
      } catch (tasksError) {
        console.error('Error creating default tasks, will try to delete project:', tasksError);
        
        // إذا فشل إنشاء المهام، حذف المشروع لتجنب البيانات غير المكتملة
        try {
          await supabase
            .from('grade10_mini_projects')
            .delete()
            .eq('id', newProject.id);
          console.log('Project deleted due to tasks creation failure');
        } catch (deleteError) {
          console.error('Error deleting project after tasks failure:', deleteError);
        }
        
        throw new Error('فشل في إنشاء المهام الافتراضية للمشروع');
      }
      
      setProjects(prev => [(newProject as Grade10MiniProject), ...prev]);
      toast.success('تم إنشاء المشروع بنجاح');
      return newProject;
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('حدث خطأ في إنشاء المشروع');
      throw error;
    }
  };

  // تحديث محتوى المشروع
  const updateProjectContent = async (projectId: string, content: string) => {
    try {
      const { error } = await supabase
        .from('grade10_mini_projects')
        .update({ content })
        .eq('id', projectId);

      if (error) throw error;
      
      if (currentProject && currentProject.id === projectId) {
        setCurrentProject(prev => prev ? { ...prev, content } : null);
      }
      
      toast.success('تم حفظ المحتوى');
    } catch (error) {
      console.error('Error updating content:', error);
      toast.error('حدث خطأ في حفظ المحتوى');
    }
  };

  // تحديث حالة المشروع
  const updateProjectStatus = async (projectId: string, status: Grade10MiniProject['status']) => {
    try {
      const updateData: any = { status };
      
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
        updateData.progress_percentage = 100;
      }

      const { error } = await supabase
        .from('grade10_mini_projects')
        .update(updateData)
        .eq('id', projectId);

      if (error) throw error;
      
      setProjects(prev => 
        prev.map(p => 
          p.id === projectId 
            ? { ...p, ...updateData } 
            : p
        )
      );
      
      if (currentProject && currentProject.id === projectId) {
        setCurrentProject(prev => prev ? { ...prev, ...updateData } : null);
      }
      
      toast.success('تم تحديث حالة المشروع');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('حدث خطأ في تحديث الحالة');
    }
  };

  // جلب المهام
  const fetchTasks = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('grade10_project_tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setTasks((data || []) as Grade10ProjectTask[]);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  // إضافة مهمة جديدة
  const addTask = async (projectId: string, taskData: TaskFormData) => {
    try {
      if (!userProfile?.user_id) return;

      const { data, error } = await supabase
        .from('grade10_project_tasks')
        .insert({
          ...taskData,
          project_id: projectId,
          created_by: userProfile.user_id,
          order_index: taskData.order_index ?? tasks.length
        })
        .select()
        .single();

      if (error) throw error;
      
      setTasks(prev => [...prev, data as Grade10ProjectTask]);
      toast.success('تم إضافة المهمة');
      return data;
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('حدث خطأ في إضافة المهمة');
    }
  };

  // تحديث حالة المهمة
  const toggleTaskCompletion = async (taskId: string, isCompleted: boolean) => {
    try {
      const updateData: any = { is_completed: isCompleted };
      if (isCompleted) {
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_at = null;
      }

      const { error } = await supabase
        .from('grade10_project_tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;
      
      setTasks(prev => 
        prev.map(task => 
          task.id === taskId 
            ? { ...task, ...updateData } 
            : task
        )
      );

      // حساب نسبة التقدم (على أساس 5 مهام ثابتة)
      const updatedTasks = tasks.map(task => 
        task.id === taskId ? { ...task, ...updateData } : task
      );
      const completedCount = updatedTasks.filter(task => task.is_completed).length;
      const progressPercentage = Math.round((completedCount / 5) * 100);

      // تحديث نسبة التقدم في المشروع
      if (currentProject) {
        await supabase
          .from('grade10_mini_projects')
          .update({ progress_percentage: progressPercentage })
          .eq('id', currentProject.id);

        setCurrentProject(prev => 
          prev ? { ...prev, progress_percentage: progressPercentage } : null
        );
      }

    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('حدث خطأ في تحديث المهمة');
    }
  };

  // جلب التعليقات
  const fetchComments = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('grade10_project_comments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments((data || []) as Grade10ProjectComment[]);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  // إضافة تعليق
  const addComment = async (projectId: string, commentData: CommentFormData) => {
    try {
      if (!userProfile?.user_id) return;

      const { data, error } = await supabase
        .from('grade10_project_comments')
        .insert({
          ...commentData,
          project_id: projectId,
          user_id: userProfile.user_id
        })
        .select()
        .single();

      if (error) throw error;
      
      setComments(prev => [...prev, data as Grade10ProjectComment]);
      toast.success('تم إضافة التعليق');
      return data;
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('حدث خطأ في إضافة التعليق');
    }
  };

  // جلب الملفات
  const fetchFiles = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('grade10_project_files')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles((data || []) as Grade10ProjectFile[]);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  // رفع ملف
  const uploadFile = async (projectId: string, file: File) => {
    try {
      if (!userProfile?.user_id) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `grade10-projects/${projectId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('grade10-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from('grade10_project_files')
        .insert({
          project_id: projectId,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: userProfile.user_id,
          is_image: file.type.startsWith('image/')
        })
        .select()
        .single();

      if (error) throw error;
      
      setFiles(prev => [data as Grade10ProjectFile, ...prev]);
      toast.success('تم رفع الملف بنجاح');
      return data;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('حدث خطأ في رفع الملف');
    }
  };

  // حذف مشروع
  const deleteProject = async (projectId: string) => {
    try {
      if (!userProfile?.user_id) {
        toast.error('يجب تسجيل الدخول أولاً');
        return false;
      }

      // حذف الملفات من التخزين أولاً
      const { data: projectFiles } = await supabase
        .from('grade10_project_files')
        .select('file_path')
        .eq('project_id', projectId);

      if (projectFiles && projectFiles.length > 0) {
        const filePaths = projectFiles.map(file => file.file_path);
        await supabase.storage
          .from('grade10-documents')
          .remove(filePaths);
      }

      // حذف الملفات من قاعدة البيانات
      await supabase
        .from('grade10_project_files')
        .delete()
        .eq('project_id', projectId);

      // حذف التعليقات
      await supabase
        .from('grade10_project_comments')
        .delete()
        .eq('project_id', projectId);

      // حذف المهام
      await supabase
        .from('grade10_project_tasks')
        .delete()
        .eq('project_id', projectId);

      // حذف المشروع
      const { error } = await supabase
        .from('grade10_mini_projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      // تحديث القائمة المحلية
      setProjects(prev => prev.filter(p => p.id !== projectId));
      
      if (currentProject?.id === projectId) {
        setCurrentProject(null);
      }

      toast.success('تم حذف المشروع بنجاح');
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('حدث خطأ في حذف المشروع');
      return false;
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return {
    projects,
    currentProject,
    tasks,
    comments,
    files,
    loading,
    fetchProjects,
    fetchProject,
    createProject,
    updateProjectContent,
    updateProjectStatus,
    deleteProject,
    fetchTasks,
    addTask,
    toggleTaskCompletion,
    fetchComments,
    addComment,
    fetchFiles,
    uploadFile,
    setCurrentProject
  };
};