import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export const useGrade12Content = () => {
  const [videos, setVideos] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // جلب الفيديوهات
  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('grade12_videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      logger.error('Error fetching grade 12 videos', error as Error);
      toast.error('فشل في جلب فيديوهات الصف الثاني عشر');
    }
  };

  // جلب المستندات
  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('grade12_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      logger.error('Error fetching grade 12 documents', error as Error);
      toast.error('فشل في جلب مستندات الصف الثاني عشر');
    }
  };

  // جلب المشاريع من الجدول الموجود
  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      logger.error('Error fetching projects', error as Error);
      toast.error('فشل في جلب المشاريع');
    }
  };

  // إضافة فيديو جديد
  const addVideo = async (videoData: any) => {
    try {
      logger.debug('Adding video with data', { videoData });
      
      const user = await supabase.auth.getUser();
      
      if (!user.data.user?.id) {
        logger.error('User not authenticated');
        throw new Error('المستخدم غير مصادق عليه');
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('school_id, role')
        .eq('user_id', user.data.user.id)
        .single();

      if (profileError) {
        logger.error('Profile error', profileError);
      }

      // المشرف العام يمكنه إضافة المحتوى بدون school_id
      if (profileError || (!userProfile?.school_id && userProfile?.role !== 'superadmin')) {
        logger.error('Profile not found or missing school_id for non-superadmin');
        throw new Error('لا يمكن العثور على ملف تعريف المستخدم أو معرف المدرسة');
      }

      const insertData = {
        title: videoData.title,
        description: videoData.description,
        video_url: videoData.video_url,
        duration: videoData.duration,
        source_type: videoData.source_type || 'youtube',
        thumbnail_url: videoData.thumbnail_url,
        category: videoData.category || 'general',
        allowed_roles: videoData.allowed_roles || ['all'],
        is_visible: videoData.is_visible ?? true,
        is_active: videoData.is_active ?? true,
        order_index: videoData.order_index || 0,
        owner_user_id: user.data.user.id,
        school_id: userProfile.school_id || null // يمكن أن يكون null للمشرف العام
      };

      logger.debug('Insert data', { insertData });

      const { data, error } = await supabase
        .from('grade12_videos')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        logger.error('Database insert error', error);
        throw error;
      }
      
      setVideos(prev => [data, ...prev]);
      toast.success('تم إضافة الفيديو بنجاح');
      return data;
    } catch (error) {
      logger.error('Error adding video', error as Error);
      toast.error('فشل في إضافة الفيديو');
      throw error;
    }
  };

  // إضافة مستند جديد
  const addDocument = async (documentData: any) => {
    try {
      const user = await supabase.auth.getUser();
      
      if (!user.data.user?.id) {
        throw new Error('المستخدم غير مصادق عليه');
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('school_id, role')
        .eq('user_id', user.data.user.id)
        .single();

      // المشرف العام يمكنه إضافة المحتوى بدون school_id
      if (profileError || (!userProfile?.school_id && userProfile?.role !== 'superadmin')) {
        throw new Error('لا يمكن العثور على ملف تعريف المستخدم أو معرف المدرسة');
      }

      const { data, error } = await supabase
        .from('grade12_documents')
        .insert([{
          title: documentData.title,
          description: documentData.description,
          file_path: documentData.file_path,
          file_type: documentData.file_type,
          file_size: documentData.file_size,
          owner_user_id: user.data.user.id,
          school_id: userProfile.school_id || null // يمكن أن يكون null للمشرف العام
        }])
        .select()
        .single();

      if (error) throw error;
      
      setDocuments(prev => [data, ...prev]);
      toast.success('تم إضافة المستند بنجاح');
      return data;
    } catch (error) {
      logger.error('Error adding document', error as Error);
      toast.error('فشل في إضافة المستند');
      throw error;
    }
  };

  // إضافة مشروع جديد (يستخدم الجدول الموجود)
  const addProject = async (projectData: any) => {
    try {
      const user = await supabase.auth.getUser();
      
      if (!user.data.user?.id) {
        throw new Error('المستخدم غير مصادق عليه');
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('school_id, role')
        .eq('user_id', user.data.user.id)
        .single();

      // المشرف العام يمكنه إضافة المحتوى بدون school_id
      if (profileError || (!userProfile?.school_id && userProfile?.role !== 'superadmin')) {
        throw new Error('لا يمكن العثور على ملف تعريف المستخدم أو معرف المدرسة');
      }

      // البحث عن كورس افتراضي للصف الثاني عشر أو إنشاؤه
      let { data: courseData } = await supabase
        .from('courses')
        .select('id')
        .eq('title', 'الصف الثاني عشر')
        .eq('school_id', userProfile.school_id || null) // للمشرف العام قد يكون null
        .maybeSingle();

      if (!courseData) {
        const { data: newCourseData, error: courseError } = await supabase
          .from('courses')
          .insert([{
            title: 'الصف الثاني عشر',
            description: 'مشاريع الصف الثاني عشر',
            grade_level: '12',
            school_id: userProfile.school_id || null, // للمشرف العام قد يكون null
            created_by: user.data.user.id
          }])
          .select('id')
          .single();
          
        if (courseError) {
          throw new Error('فشل في إنشاء كورس الصف الثاني عشر');
        }
        courseData = newCourseData;
      }

      const { data, error } = await supabase
        .from('projects')
        .insert([{
          title: projectData.title,
          description: projectData.description,
          due_at: projectData.due_date,
          max_score: projectData.max_score || 100,
          course_id: courseData.id,
          created_by: user.data.user.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      setProjects(prev => [data, ...prev]);
      toast.success('تم إضافة المشروع بنجاح');
      return data;
    } catch (error) {
      logger.error('Error adding project', error as Error);
      toast.error('فشل في إضافة المشروع');
      throw error;
    }
  };

  // حذف فيديو
  const deleteVideo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('grade12_videos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setVideos(prev => prev.filter(video => video.id !== id));
      toast.success('تم حذف الفيديو بنجاح');
    } catch (error) {
      logger.error('Error deleting video', error as Error);
      toast.error('فشل في حذف الفيديو');
      throw error;
    }
  };

  // حذف مستند
  const deleteDocument = async (id: string) => {
    try {
      const { error } = await supabase
        .from('grade12_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      toast.success('تم حذف المستند بنجاح');
    } catch (error) {
      logger.error('Error deleting document', error as Error);
      toast.error('فشل في حذف المستند');
      throw error;
    }
  };

  // حذف مشروع
  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setProjects(prev => prev.filter(project => project.id !== id));
      toast.success('تم حذف المشروع بنجاح');
    } catch (error) {
      logger.error('Error deleting project', error as Error);
      toast.error('فشل في حذف المشروع');
      throw error;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchVideos(), fetchDocuments(), fetchProjects()]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    videos,
    documents,
    projects,
    loading,
    addVideo,
    addDocument,
    addProject,
    deleteVideo,
    deleteDocument,
    deleteProject,
    updateVideo: addVideo, // Add updateVideo method
    fetchVideos, // Add fetchVideos method
    refetch: async () => {
      setLoading(true);
      await Promise.all([fetchVideos(), fetchDocuments(), fetchProjects()]);
      setLoading(false);
    }
  };
};