import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTeacherContentAccess } from '@/hooks/useTeacherContentAccess';
import { toast } from '@/hooks/use-toast';

export interface TeacherProject {
  id: string;
  title: string;
  description?: string;
  status: string;
  grade?: number;
  updated_at: string;
  created_at: string;
  student_id: string;
  student_name: string;
  school_id?: string;
  unread_comments_count: number;
  total_comments_count: number;
  completion_percentage: number;
  current_task?: string;
  current_phase?: string;
  completed_tasks_count?: number;
  total_tasks_count?: number;
}

export interface ProjectComment {
  id: string;
  project_id: string;
  user_id: string;
  comment_text: string;
  comment_type: string;
  created_at: string;
  is_read: boolean;
  user_name: string;
  user_role: string;
}

export const useTeacherProjects = () => {
  const { userProfile } = useAuth();
  const { allowedGrades, loading: accessLoading } = useTeacherContentAccess();
  const [projects, setProjects] = useState<TeacherProject[]>([]);
  const [recentComments, setRecentComments] = useState<ProjectComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalProjectsCount, setTotalProjectsCount] = useState(0);
  const [grade12ProjectsCount, setGrade12ProjectsCount] = useState(0);

  // جلب مشاريع طلاب المعلم
  const fetchTeacherProjects = async () => {
    if (!userProfile?.school_id || accessLoading) return;

    try {
      setLoading(true);
      setError(null);

      // التحقق من الصفوف المسموح بها
      if (allowedGrades.length === 0) {
        console.log('Teacher has no allowed grades');
        setProjects([]);
        return;
      }

      // جلب المشاريع مع فلترة حسب الصفوف المسموح بها
      let allProjects: TeacherProject[] = [];

      // جلب مشاريع كل صف مسموح به
      for (const grade of allowedGrades) {
        let query;
        
        if (grade === '12') {
          // فلترة المشاريع حسب الطلاب المسؤول عنهم أولاً
          const { data: authorizedStudents } = await supabase
            .rpc('get_teacher_assigned_projects', { 
              teacher_user_id: userProfile.user_id, 
              project_grade: '12' 
            });

          const authorizedStudentIds = authorizedStudents
            ?.filter(s => s.is_authorized)
            ?.map(s => s.student_id) || [];

          if (authorizedStudentIds.length > 0) {
            // جلب مشاريع الصف الثاني عشر للطلاب المصرح لهم
            const { data: grade12Projects, error } = await supabase
              .from('grade12_final_projects')
              .select(`
                id,
                title,
                description,
                status,
                updated_at,
                created_at,
                student_id
              `)
              .in('student_id', authorizedStudentIds)
              .eq('school_id', userProfile.school_id);

            if (!error && grade12Projects) {
              // جلب أسماء الطلاب من جدول profiles
              const studentIds = grade12Projects.map(p => p.student_id);
              const { data: studentsProfiles } = await supabase
                .from('profiles')
                .select('user_id, full_name')
                .in('user_id', studentIds);

              const studentNamesMap = new Map(
                studentsProfiles?.map(p => [p.user_id, p.full_name]) || []
              );

              // جلب إجمالي المهام الافتراضية
              const { count: totalDefaultTasks } = await supabase
                .from('grade12_default_tasks')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);

              console.log('📊 إجمالي المهام الافتراضية:', totalDefaultTasks);

              // جلب تقدم الطلاب في المهام
              const { data: studentProgress } = await supabase
                .from('grade12_student_task_progress')
                .select(`
                  student_id,
                  is_completed,
                  grade12_default_tasks!inner (
                    task_title,
                    phase_title,
                    order_index
                  )
                `)
                .in('student_id', studentIds);

              console.log('📈 تقدم الطلاب:', studentProgress?.length, 'سجل');

              // حساب المهام المكتملة لكل طالب
              const studentTasksMap = new Map<string, { completed: number; currentTask: any | null }>();
              
              if (studentProgress) {
                for (const task of studentProgress) {
                  const studentId = task.student_id;
                  
                  if (!studentTasksMap.has(studentId)) {
                    studentTasksMap.set(studentId, {
                      completed: 0,
                      currentTask: null
                    });
                  }
                  
                  const studentData = studentTasksMap.get(studentId)!;
                  
                  if (task.is_completed) {
                    studentData.completed++;
                  }
                  
                  // أول مهمة غير مكتملة حسب الترتيب
                  const currentTask = task.grade12_default_tasks;
                  if (!task.is_completed && currentTask) {
                    if (!studentData.currentTask || currentTask.order_index < studentData.currentTask.order_index) {
                      studentData.currentTask = {
                        task_title: currentTask.task_title,
                        phase_title: currentTask.phase_title,
                        order_index: currentTask.order_index
                      };
                    }
                  }
                }
              }

              // طباعة التقدم لكل طالب
              console.log('🎯 تقدم كل طالب:');
              studentTasksMap.forEach((data, studentId) => {
                const studentName = studentNamesMap.get(studentId);
                console.log(`  - ${studentName}: ${data.completed} مهمة مكتملة`);
              });

              const formattedGrade12Projects = grade12Projects.map(project => {
                const taskData = studentTasksMap.get(project.student_id);
                const completedCount = taskData?.completed || 0;
                const totalCount = totalDefaultTasks || 39;
                const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                return {
                  ...project,
                  grade: 12,
                  student_name: studentNamesMap.get(project.student_id) || 'غير محدد',
                  unread_comments_count: 0,
                  total_comments_count: 0,
                  completion_percentage: completionPercentage,
                  completed_tasks_count: completedCount,
                  total_tasks_count: totalCount,
                  current_task: taskData?.currentTask?.task_title,
                  current_phase: taskData?.currentTask?.phase_title
                };
              });

              allProjects.push(...formattedGrade12Projects);
            }
          }
        }

        if (grade === '10') {
          // جلب مشاريع الصف العاشر 
          const { data: authorizedStudents } = await supabase
            .rpc('get_teacher_assigned_projects', { 
              teacher_user_id: userProfile.user_id, 
              project_grade: '10' 
            });

          const authorizedStudentIds = authorizedStudents
            ?.filter(s => s.is_authorized)
            ?.map(s => s.student_id) || [];

          if (authorizedStudentIds.length > 0) {
            const { data: grade10Projects, error } = await supabase
              .from('grade10_mini_projects')
              .select(`
                id,
                title,
                description,
                status,
                progress_percentage,
                updated_at,
                created_at,
                student_id
              `)
              .in('student_id', authorizedStudentIds)
              .eq('school_id', userProfile.school_id);

            if (!error && grade10Projects) {
              // جلب أسماء الطلاب من جدول profiles
              const studentIds = grade10Projects.map(p => p.student_id);
              const { data: studentsProfiles } = await supabase
                .from('profiles')
                .select('user_id, full_name')
                .in('user_id', studentIds);

              const studentNamesMap = new Map(
                studentsProfiles?.map(p => [p.user_id, p.full_name]) || []
              );

              // تحويل مشاريع الصف العاشر لنفس التنسيق
              const formattedGrade10Projects = grade10Projects.map(project => ({
                ...project,
                grade: 10,
                student_name: studentNamesMap.get(project.student_id) || 'غير محدد',
                unread_comments_count: 0,
                total_comments_count: 0,
                completion_percentage: project.progress_percentage || 0
              }));

              allProjects.push(...formattedGrade10Projects);
            }
          }
        }
      }

      // ترتيب المشاريع حسب تاريخ التحديث
      allProjects.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

      // حفظ العدد الكلي قبل التحديد
      setTotalProjectsCount(allProjects.length);
      
      // حساب عدد مشاريع الصف 12 فقط
      const grade12Count = allProjects.filter(p => p.grade === 12).length;
      setGrade12ProjectsCount(grade12Count);

      // تحديد البيانات إلى أول 10 مشاريع
      const limitedProjects = allProjects.slice(0, 10);

      setProjects(limitedProjects);
    } catch (error: any) {
      console.error('Error fetching teacher projects:', error);
      setError(error.message);
      toast({
        title: 'خطأ في جلب المشاريع',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // جلب التعليقات الحديثة مع فلترة حسب الصفوف المسؤول عنها
  const fetchRecentComments = async () => {
    if (!userProfile?.school_id || accessLoading) return;

    try {
      // التحقق من الصفوف المسموح بها
      if (allowedGrades.length === 0) {
        console.log('Teacher has no allowed grades - no comments');
        setRecentComments([]);
        return;
      }

      let allComments: ProjectComment[] = [];

      // جلب التعليقات من كل صف مسموح به
      for (const grade of allowedGrades) {
        if (grade === '12') {
          // جلب تعليقات مشاريع الصف الثاني عشر
          const { data: grade12Comments, error: commentsError } = await supabase
            .from('grade12_project_comments')
            .select(`
              id,
              project_id,
              created_by,
              comment,
              comment_type,
              created_at,
              is_read
            `)
            .neq('created_by', userProfile.user_id) // تعليقات من الطلاب فقط
            .order('created_at', { ascending: false })
            .limit(20);

          if (!commentsError && grade12Comments) {
            // تحويل البيانات مع جلب معلومات إضافية
            const formattedGrade12Comments = await Promise.all(
              grade12Comments.map(async (comment) => {
                // جلب معلومات المشروع
                const { data: projectData } = await supabase
                  .from('grade12_final_projects')
                  .select('title, student_id, school_id')
                  .eq('id', comment.project_id)
                  .single();

                // تحقق من أن المعلم مصرح له بالوصول لهذا المشروع
                if (!projectData || projectData.school_id !== userProfile.school_id) {
                  return null;
                }

                // التحقق من صلاحية الوصول للمشروع
                const { data: accessCheck } = await supabase
                  .rpc('can_teacher_access_project', {
                    teacher_user_id: userProfile.user_id,
                    project_student_id: projectData.student_id,
                    project_type: 'grade12'
                  });

                if (!accessCheck) {
                  return null;
                }

                // جلب معلومات صاحب التعليق
                const { data: commenterProfile } = await supabase
                  .from('profiles')
                  .select('full_name, role')
                  .eq('user_id', comment.created_by)
                  .single();

                return {
                  id: comment.id,
                  project_id: comment.project_id,
                  user_id: comment.created_by,
                  comment_text: comment.comment,
                  comment_type: comment.comment_type,
                  created_at: comment.created_at,
                  is_read: comment.is_read,
                  user_name: commenterProfile?.full_name || 'اسم غير محدد',
                  user_role: commenterProfile?.role || 'student'
                };
              })
            );

            const validGrade12Comments = formattedGrade12Comments.filter(comment => comment !== null);
            allComments.push(...validGrade12Comments);
          }
        }

        if (grade === '10') {
          // جلب تعليقات مشاريع الصف العاشر
          const { data: grade10Comments, error: commentsError } = await supabase
            .from('grade10_project_comments')
            .select(`
              id,
              project_id,
              user_id,
              comment_text,
              comment_type,
              created_at
            `)
            .neq('user_id', userProfile.user_id) // تعليقات من الطلاب فقط
            .order('created_at', { ascending: false })
            .limit(20);

          if (!commentsError && grade10Comments) {
            // تحويل البيانات مع جلب معلومات إضافية
            const formattedGrade10Comments = await Promise.all(
              grade10Comments.map(async (comment) => {
                // جلب معلومات المشروع
                const { data: projectData } = await supabase
                  .from('grade10_mini_projects')
                  .select('title, student_id, school_id')
                  .eq('id', comment.project_id)
                  .single();

                // تحقق من أن المعلم مصرح له بالوصول لهذا المشروع
                if (!projectData || projectData.school_id !== userProfile.school_id) {
                  return null;
                }

                // التحقق من صلاحية الوصول للمشروع
                const { data: accessCheck } = await supabase
                  .rpc('can_teacher_access_project', {
                    teacher_user_id: userProfile.user_id,
                    project_student_id: projectData.student_id,
                    project_type: 'grade10'
                  });

                if (!accessCheck) {
                  return null;
                }

                // جلب معلومات صاحب التعليق
                const { data: commenterProfile } = await supabase
                  .from('profiles')
                  .select('full_name, role')
                  .eq('user_id', comment.user_id)
                  .single();

                return {
                  id: comment.id,
                  project_id: comment.project_id,
                  user_id: comment.user_id,
                  comment_text: comment.comment_text,
                  comment_type: comment.comment_type,
                  created_at: comment.created_at,
                  is_read: false, // Grade 10 comments don't have is_read field
                  user_name: commenterProfile?.full_name || 'اسم غير محدد',
                  user_role: commenterProfile?.role || 'student'
                };
              })
            );

            const validGrade10Comments = formattedGrade10Comments.filter(comment => comment !== null);
            allComments.push(...validGrade10Comments);
          }
        }
      }

      // ترتيب التعليقات حسب التاريخ وتحديد العدد
      allComments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const limitedComments = allComments.slice(0, 20);

      setRecentComments(limitedComments);
    } catch (error: any) {
      console.error('Error fetching recent comments:', error);
      toast({
        title: 'خطأ في جلب التعليقات',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  // تحديد التعليق كمقروء
  const markCommentAsRead = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('grade12_project_comments')
        .update({ is_read: true })
        .eq('id', commentId);

      if (error) throw error;

      // تحديث الحالة المحلية
      setRecentComments(prev => 
        prev.map(comment => 
          comment.id === commentId 
            ? { ...comment, is_read: true }
            : comment
        )
      );

      // تحديث عدد التعليقات غير المقروءة في المشاريع
      await fetchTeacherProjects();

    } catch (error: any) {
      console.error('Error marking comment as read:', error);
      toast({
        title: 'خطأ في تحديث حالة التعليق',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  // إضافة تعليق جديد
  const addComment = async (projectId: string, commentText: string, commentType: string = 'comment') => {
    if (!userProfile?.user_id) return false;

    try {
      const { error } = await supabase
        .from('grade12_project_comments')
        .insert({
          project_id: projectId,
          created_by: userProfile.user_id,
          comment: commentText,
          comment_type: commentType,
          is_read: true // المعلم يقرأ تعليقه مباشرة
        });

      if (error) throw error;

      toast({
        title: 'تم إضافة التعليق',
        description: 'تم إضافة التعليق بنجاح'
      });

      // تحديث البيانات
      await fetchRecentComments();
      await fetchTeacherProjects();
      
      return true;
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast({
        title: 'خطأ في إضافة التعليق',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }
  };

  // إحصائيات سريعة
  const getQuickStats = () => {
    const totalProjects = totalProjectsCount; // استخدام العدد الكلي الحقيقي
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const inProgressProjects = projects.filter(p => p.status === 'in_progress').length;
    const unreadCommentsTotal = projects.reduce((sum, p) => sum + p.unread_comments_count, 0);
    const averageCompletion = projects.length > 0 
      ? Math.round(projects.reduce((sum, p) => sum + p.completion_percentage, 0) / projects.length)
      : 0;

    return {
      totalProjects,
      completedProjects,
      inProgressProjects,
      unreadCommentsTotal,
      averageCompletion
    };
  };

  useEffect(() => {
    if (userProfile?.user_id && userProfile?.role === 'teacher' && !accessLoading) {
      fetchTeacherProjects();
      fetchRecentComments();
    }
  }, [userProfile?.user_id, userProfile?.role, accessLoading]); // تجنب allowedGrades في dependency array

  // إعداد real-time subscription للتعليقات الجديدة
  useEffect(() => {
    if (!userProfile?.school_id) return;

    const channel = supabase
      .channel('teacher-project-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'grade12_project_comments'
        },
        () => {
          fetchRecentComments();
          fetchTeacherProjects();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'grade12_final_projects'
        },
        () => {
          fetchTeacherProjects();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile?.school_id]);

  return {
    projects,
    recentComments,
    loading,
    error,
    quickStats: getQuickStats(),
    grade12ProjectsCount, // إضافة عدد مشاريع الصف 12
    fetchTeacherProjects,
    fetchRecentComments,
    markCommentAsRead,
    addComment,
    refetch: () => {
      fetchTeacherProjects();
      fetchRecentComments();
    }
  };
};