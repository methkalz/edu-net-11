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

  // جلب مشاريع طلاب المعلم
  const fetchTeacherProjects = async () => {
    if (!userProfile?.school_id || accessLoading) return;

    try {
      setLoading(true);
      setError(null);

      // تسجيل مفصل للتشخيص
      console.log('🔍 fetchTeacherProjects - معلومات المعلم:', {
        teacherId: userProfile.user_id,
        teacherName: userProfile.full_name,
        allowedGrades,
        accessLoading
      });

      // التحقق من الصفوف المسموح بها
      if (allowedGrades.length === 0) {
        console.log('❌ المعلم ليس لديه صفوف مخولة');
        setProjects([]);
        return;
      }

      // جلب المشاريع مع فلترة حسب الصفوف المسموح بها
      let allProjects: TeacherProject[] = [];

      // جلب مشاريع كل صف مسموح به
      for (const grade of allowedGrades) {
        console.log(`🔎 معالجة الصف: ${grade} من الصفوف المخولة:`, allowedGrades);
        
        // التحقق الإضافي من أن الصف مخول فعلاً
        if (!allowedGrades.includes(grade)) {
          console.log(`❌ الصف ${grade} غير مخول - تم تجاهله`);
          continue;
        }
        let query;
        
        if (grade === '12') {
          console.log('📚 معالجة مشاريع الصف الثاني عشر...');
          
          // فلترة المشاريع حسب الطلاب المسؤول عنهم أولاً
          const { data: authorizedStudents, error: authError } = await supabase
            .rpc('get_teacher_assigned_projects', { 
              teacher_user_id: userProfile.user_id, 
              project_grade: '12' 
            });

          if (authError) {
            console.error('❌ خطأ في جلب الطلاب المخولين للصف 12:', authError);
            continue;
          }

          console.log('👥 الطلاب المخولين للصف 12:', authorizedStudents);

          const authorizedStudentIds = authorizedStudents
            ?.filter(s => s.is_authorized)
            ?.map(s => s.student_id) || [];

          console.log('📋 معرفات الطلاب المخولين للصف 12:', authorizedStudentIds);

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
              console.log(`✅ تم جلب ${grade12Projects.length} مشروع من الصف 12`);
              
              const formattedGrade12Projects = grade12Projects.map(project => ({
                ...project,
                grade: 12,
                student_name: 'جاري تحميل...',
                unread_comments_count: 0,
                total_comments_count: 0,
                completion_percentage: 0
              }));

              allProjects.push(...formattedGrade12Projects);
            } else if (error) {
              console.error('❌ خطأ في جلب مشاريع الصف 12:', error);
            }
          } else {
            console.log('⚠️ لا يوجد طلاب مخولين للصف 12');
          }
        }

        if (grade === '10') {
          console.log('📚 معالجة مشاريع الصف العاشر...');
          
          // جلب مشاريع الصف العاشر 
          const { data: authorizedStudents, error: authError } = await supabase
            .rpc('get_teacher_assigned_projects', { 
              teacher_user_id: userProfile.user_id, 
              project_grade: '10' 
            });

          if (authError) {
            console.error('❌ خطأ في جلب الطلاب المخولين للصف 10:', authError);
            continue;
          }

          console.log('👥 الطلاب المخولين للصف 10:', authorizedStudents);

          const authorizedStudentIds = authorizedStudents
            ?.filter(s => s.is_authorized)
            ?.map(s => s.student_id) || [];

          console.log('📋 معرفات الطلاب المخولين للصف 10:', authorizedStudentIds);

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
              console.log(`✅ تم جلب ${grade10Projects.length} مشروع من الصف 10`);
              
              // تحويل مشاريع الصف العاشر لنفس التنسيق
              const formattedGrade10Projects = grade10Projects.map(project => ({
                ...project,
                grade: 10,
                student_name: 'جاري تحميل...',
                unread_comments_count: 0,
                total_comments_count: 0,
                completion_percentage: project.progress_percentage || 0
              }));

              allProjects.push(...formattedGrade10Projects);
            } else if (error) {
              console.error('❌ خطأ في جلب مشاريع الصف 10:', error);
            }
          } else {
            console.log('⚠️ لا يوجد طلاب مخولين للصف 10');
          }
        } else {
          console.log(`⚠️ صف غير مدعوم: ${grade} - تم تجاهله`);
        }
      }

      // ترتيب المشاريع حسب تاريخ التحديث
      allProjects.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

      // تحديد البيانات إلى أول 10 مشاريع
      const limitedProjects = allProjects.slice(0, 10);

      console.log(`📊 إجمالي المشاريع المجمعة: ${allProjects.length}، المعروضة: ${limitedProjects.length}`);
      console.log('📋 تفاصيل المشاريع المعروضة:', limitedProjects.map(p => ({ id: p.id, title: p.title, grade: p.grade })));

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
        console.log('❌ المعلم ليس لديه صفوف مخولة - لا توجد تعليقات');
        setRecentComments([]);
        return;
      }

      console.log('🔍 جلب التعليقات للصفوف المخولة:', allowedGrades);

      let allComments: ProjectComment[] = [];

      // جلب التعليقات من كل صف مسموح به
      for (const grade of allowedGrades) {
        console.log(`💬 جلب تعليقات الصف: ${grade}`);
        
        // التحقق الإضافي من أن الصف مخول
        if (!allowedGrades.includes(grade)) {
          console.log(`❌ الصف ${grade} غير مخول للتعليقات - تم تجاهله`);
          continue;
        }
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
    const totalProjects = projects.length;
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
  }, [userProfile, allowedGrades, accessLoading]);

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