import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export const useGrade10Content = () => {
  const [videos, setVideos] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // جلب الفيديوهات
  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('grade10_videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      logger.error('Error fetching grade 10 videos', error as Error);
      toast.error('فشل في جلب فيديوهات الصف العاشر');
    }
  };

  // جلب المستندات
  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('grade10_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      logger.error('Error fetching grade 10 documents', error as Error);
      toast.error('فشل في جلب مستندات الصف العاشر');
    }
  };

  // إضافة فيديو جديد
  const addVideo = async (videoData: any) => {
    try {
      // إضافة الحقول المطلوبة إذا لم تكن موجودة
      const videoWithDefaults = {
        ...videoData,
        is_active: videoData.is_active ?? true,
        is_visible: videoData.is_visible ?? true,
        allowed_roles: videoData.allowed_roles || ['all'],
        order_index: videoData.order_index || 0,
        category: videoData.category || 'general',
        grade_level: '10',
        published_at: videoData.published_at || new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('grade10_videos')
        .insert(videoWithDefaults)
        .select()
        .single();

      if (error) {
        logger.error('Error adding video', error);
        toast.error('فشل في إضافة الفيديو');
        throw error;
      }

      setVideos(prev => [data, ...prev]);
      toast.success('تم إضافة الفيديو بنجاح');
      return data;
    } catch (error) {
      logger.error('Error in addVideo', error as Error);
      throw error;
    }
  };

  // إضافة مستند جديد
  const addDocument = async (documentData: any) => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user?.id) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      // Get user's school_id if available, but don't require it for system-wide content
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('user_id', user.data.user.id)
        .maybeSingle();

      const { data, error } = await supabase
        .from('grade10_documents')
        .insert([{
          title: documentData.title,
          description: documentData.description,
          file_path: documentData.file_path,
          file_type: documentData.file_type,
          file_size: documentData.file_size,
          owner_user_id: user.data.user.id,
          school_id: userProfile?.school_id || null // Allow null for system-wide content
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

  // حذف فيديو
  const deleteVideo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('grade10_videos')
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
        .from('grade10_documents')
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

  // تحديث فيديو
  const updateVideo = async (id: string, videoData: any) => {
    try {
      const updateData = {
        title: videoData.title,
        description: videoData.description,
        video_url: videoData.video_url,
        duration: videoData.duration,
        source_type: videoData.source_type,
        thumbnail_url: videoData.thumbnail_url,
        category: videoData.category,
        is_visible: videoData.is_visible,
        allowed_roles: videoData.allowed_roles,
        order_index: videoData.order_index,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('grade10_videos')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setVideos(prev => prev.map(video => video.id === id ? data : video));
      toast.success('تم تحديث الفيديو بنجاح');
      return data;
    } catch (error) {
      logger.error('Error updating video', error as Error);
      toast.error('فشل في تحديث الفيديو');
      throw error;
    }
  };

  // تحديث مستند
  const updateDocument = async (id: string, documentData: any) => {
    try {
      const { data, error } = await supabase
        .from('grade10_documents')
        .update({
          title: documentData.title,
          description: documentData.description,
          file_path: documentData.file_path,
          file_type: documentData.file_type,
          file_size: documentData.file_size
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setDocuments(prev => prev.map(doc => doc.id === id ? data : doc));
      toast.success('تم تحديث المستند بنجاح');
      return data;
    } catch (error) {
      logger.error('Error updating document', error as Error);
      toast.error('فشل في تحديث المستند');
      throw error;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchVideos(), fetchDocuments()]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    videos,
    documents,
    loading,
    addVideo,
    addDocument,
    deleteVideo,
    deleteDocument,
    updateVideo,
    updateDocument,
    refetch: async () => {
      setLoading(true);
      await Promise.all([fetchVideos(), fetchDocuments()]);
      setLoading(false);
    }
  };
};