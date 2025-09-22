import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface ProjectComment {
  id: string;
  project_id: string;
  created_by: string;
  comment: string;
  comment_type: string;
  is_read: boolean | null;
  created_at: string;
  // معلومات المستخدم من الـ profiles
  author?: {
    id: string;
    full_name: string;
    role: string;
    avatar_url?: string;
  };
}

interface UseProjectCommentsOptions {
  projectId: string;
  enabled?: boolean;
}

export const useProjectComments = ({ projectId, enabled = true }: UseProjectCommentsOptions) => {
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // جلب التعليقات مع معلومات المؤلفين
  const fetchComments = async () => {
    if (!enabled || !projectId) return;
    
    try {
      setIsLoading(true);
      setError(null);

      // جلب التعليقات أولاً
      const { data: commentsData, error: fetchError } = await supabase
        .from('grade12_project_comments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (fetchError) {
        console.error('Error fetching comments:', fetchError);
        setError('فشل في تحميل التعليقات');
        return;
      }

      // جلب معلومات المؤلفين
      const authorIds = [...new Set(commentsData?.map(c => c.created_by) || [])];
      
      const { data: authorsData } = await supabase
        .from('profiles')
        .select('user_id, full_name, role, avatar_url')
        .in('user_id', authorIds);

      // دمج البيانات مع التأكد من وجود البيانات
      const authorsMap = new Map();
      if (authorsData) {
        authorsData.forEach(author => {
          if (author.user_id) {
            authorsMap.set(author.user_id, author);
          }
        });
      }
      
      const commentsWithAuthor = (commentsData || []).map(comment => {
        const authorData = authorsMap.get(comment.created_by);
        
        return {
          ...comment,
          author: authorData ? {
            id: comment.created_by,
            full_name: authorData.full_name || 'مستخدم غير معروف',
            role: authorData.role || 'student',  
            avatar_url: authorData.avatar_url
          } : {
            id: comment.created_by,
            full_name: 'مستخدم غير معروف',
            role: 'student',
            avatar_url: null
          }
        };
      });

      setComments(commentsWithAuthor);
      
      // حساب التعليقات غير المقروءة للمستخدم الحالي
      const unread = commentsWithAuthor.filter(
        comment => !comment.is_read && comment.created_by !== user?.id
      ).length;
      setUnreadCount(unread);

    } catch (err) {
      console.error('Error in fetchComments:', err);
      setError('حدث خطأ في تحميل التعليقات');
    } finally {
      setIsLoading(false);
    }
  };

  // إضافة تعليق جديد
  const addComment = async (
    commentText: string, 
    commentType: 'comment' | 'feedback' | 'grade' = 'comment'
  ) => {
    if (!user || !projectId || !commentText.trim()) {
      console.log('❌ addComment: Missing required data', { 
        hasUser: !!user, 
        userId: user?.id,
        projectId, 
        hasCommentText: !!commentText,
        commentLength: commentText?.length 
      });
      return false;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // طباعة معلومات تفصيلية للتشخيص
      console.log('🔄 Starting comment addition process...');
      console.log('📊 Current user data:', {
        userId: user.id,
        userEmail: user.email,
        hasUserProfile: !!user,
        authRole: 'authenticated'
      });

      // التحقق من الجلسة الحالية
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      console.log('🔐 Current session:', {
        hasSession: !!session.session,
        sessionUserId: session.session?.user?.id,
        sessionError: sessionError?.message
      });

      // التحقق من المستخدم الحالي
      const { data: currentUser, error: userError } = await supabase.auth.getUser();
      console.log('👤 Current user:', {
        hasUser: !!currentUser.user,
        currentUserId: currentUser.user?.id,
        userError: userError?.message
      });

      console.log('📋 Project and comment data:', {
        projectId: projectId,
        commentText: commentText.trim(),
        commentType: commentType,
        commentLength: commentText.trim().length
      });

      console.log('📝 Data to insert:', {
        project_id: projectId,
        created_by: user.id,
        comment: commentText.trim(),
        comment_type: commentType,
        is_read: false
      });

      // محاولة إدراج التعليق مع معالجة تفصيلية للأخطاء
      console.log('🚀 Attempting database insert...');
      const { data, error: insertError } = await supabase
        .from('grade12_project_comments')
        .insert({
          project_id: projectId,
          created_by: user.id,
          comment: commentText.trim(),
          comment_type: commentType,
          is_read: false
        })
        .select('*')
        .single();

      if (insertError) {
        console.error('❌ Insert error details:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code,
          fullError: insertError
        });
        
        // معالجة أخطاء RLS المحددة
        if (insertError.code === '42501' || insertError.message?.includes('policy')) {
          console.error('🔒 RLS Policy Error detected');
          setError('لا يمكنك إضافة تعليق على هذا المشروع. تأكد من صلاحياتك.');
        } else if (insertError.code === '23505') {
          console.error('🔄 Duplicate entry error');
          setError('التعليق موجود بالفعل');
        } else if (insertError.message?.includes('authentication')) {
          console.error('🔐 Authentication error');
          setError('خطأ في المصادقة. يرجى تسجيل الدخول مرة أخرى.');
        } else {
          setError(`فشل في إضافة التعليق: ${insertError.message}`);
        }
        
        toast({
          title: "خطأ",
          description: `فشل في إضافة التعليق: ${insertError.message}`,
          variant: "destructive",
        });
        return false;
      }

      console.log('✅ Comment inserted successfully:', data);

      // جلب معلومات المؤلف
      console.log('📲 Fetching author data...');
      const { data: authorData, error: authorError } = await supabase
        .from('profiles')
        .select('user_id, full_name, role, avatar_url')
        .eq('user_id', user.id)
        .single();

      if (authorError) {
        console.error('⚠️ Author fetch error (non-critical):', authorError);
      } else {
        console.log('👤 Author data fetched:', authorData);
      }

      // إضافة التعليق الجديد للقائمة محلياً
      if (data) {
        const newComment = {
          ...data,
          author: authorData ? {
            id: user.id,
            full_name: authorData.full_name || 'مستخدم غير معروف',
            role: authorData.role || 'student',
            avatar_url: authorData.avatar_url
          } : undefined
        };
        
        console.log('📝 Adding comment to local state:', newComment);
        setComments(prev => [...prev, newComment]);
      }

      toast({
        title: "تم بنجاح",
        description: "تم إضافة التعليق بنجاح",
      });

      console.log('🎉 Comment addition process completed successfully');
      return true;
      
    } catch (err: any) {
      console.error('❌ Complete error object:', {
        error: err,
        message: err?.message,
        stack: err?.stack,
        name: err?.name
      });
      
      setError('حدث خطأ في إضافة التعليق');
      toast({
        title: "خطأ",
        description: "حدث خطأ غير متوقع",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // تحديد التعليق كمقروء
  const markAsRead = async (commentId: string) => {
    if (!user) return;

    try {
      const { error: updateError } = await supabase
        .from('grade12_project_comments')
        .update({ is_read: true })
        .eq('id', commentId)
        .neq('created_by', user.id); // لا نحدث التعليقات الخاصة بالمستخدم نفسه

      if (updateError) {
        console.error('Error marking comment as read:', updateError);
        return;
      }

      // تحديث الحالة محلياً
      setComments(prev => prev.map(comment => 
        comment.id === commentId ? { ...comment, is_read: true } : comment
      ));
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error in markAsRead:', err);
    }
  };

  // تحديد جميع التعليقات كمقروءة
  const markAllAsRead = async () => {
    if (!user || !projectId) return;

    try {
      const { error: updateError } = await supabase
        .from('grade12_project_comments')
        .update({ is_read: true })
        .eq('project_id', projectId)
        .neq('created_by', user.id)
        .eq('is_read', false);

      if (updateError) {
        console.error('Error marking all comments as read:', updateError);
        return;
      }

      // تحديث الحالة محلياً
      setComments(prev => prev.map(comment => ({
        ...comment,
        is_read: comment.created_by === user.id ? comment.is_read : true
      })));
      
      setUnreadCount(0);
    } catch (err) {
      console.error('Error in markAllAsRead:', err);
    }
  };

  // إعداد real-time subscription للتعليقات
  useEffect(() => {
    if (!enabled || !projectId) return;

    fetchComments();

    // إعداد real-time subscription
    const channel = supabase
      .channel(`project_comments_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'grade12_project_comments',
          filter: `project_id=eq.${projectId}`
        },
        async (payload) => {
          // جلب التعليق الجديد
          const { data: newComment } = await supabase
            .from('grade12_project_comments')
            .select('*')
            .eq('id', payload.new.id)
            .single();

          if (newComment) {
            // جلب معلومات المؤلف للتعليق الجديد
            const { data: authorData } = await supabase
              .from('profiles')
              .select('user_id, full_name, role, avatar_url')
              .eq('user_id', newComment.created_by)
              .maybeSingle();

            const commentWithAuthor = {
              ...newComment,
              author: authorData ? {
                id: newComment.created_by,
                full_name: authorData.full_name || 'مستخدم غير معروف',
                role: authorData.role || 'student',
                avatar_url: authorData.avatar_url
              } : {
                id: newComment.created_by,
                full_name: 'مستخدم غير معروف',
                role: 'student',
                avatar_url: null
              }
            };

            setComments(prev => {
              // تجنب التكرار
              const exists = prev.find(c => c.id === commentWithAuthor.id);
              if (exists) return prev;
              return [...prev, commentWithAuthor];
            });

            // زيادة عدد التعليقات غير المقروءة إذا لم يكن من المستخدم الحالي
            if (newComment.created_by !== user?.id) {
              setUnreadCount(prev => prev + 1);
              
              // إشعار بصري للتعليق الجديد
              toast({
                title: "تعليق جديد",
                description: `${commentWithAuthor.author?.full_name || 'شخص ما'} أضاف تعليقاً جديداً`,
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'grade12_project_comments',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          setComments(prev => prev.map(comment => 
            comment.id === payload.new.id 
              ? { ...comment, ...payload.new }
              : comment
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, projectId, user?.id]);

  return {
    comments,
    isLoading,
    isSubmitting,
    error,
    unreadCount,
    addComment,
    markAsRead,
    markAllAsRead,
    refetch: fetchComments
  };
};