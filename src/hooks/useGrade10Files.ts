import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface Grade10Document {
  id: string;
  title: string;
  description?: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
  category: string;
  grade_level: string;
  owner_user_id: string;
  school_id?: string;
  is_visible: boolean;
  allowed_roles: string[];
  is_active: boolean;
  order_index: number;
  published_at: string;
  created_at: string;
  updated_at: string;
}

interface Grade10Video {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  duration?: string;
  source_type: 'youtube' | 'vimeo' | 'direct';
  category?: string;
  grade_level: string;
  owner_user_id: string;
  school_id?: string;
  created_at: string;
  updated_at: string;
}

export const useGrade10Files = () => {
  const [documents, setDocuments] = useState<Grade10Document[]>([]);
  const [videos, setVideos] = useState<Grade10Video[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('grade10_documents')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments((data || []) as Grade10Document[]);
    } catch (error) {
      logger.error('Error fetching Grade 10 documents', error as Error);
      toast.error('فشل في تحميل المستندات');
    }
  };

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('grade10_videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos((data || []) as Grade10Video[]);
    } catch (error) {
      logger.error('Error fetching Grade 10 videos', error as Error);
      toast.error('فشل في تحميل الفيديوهات');
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchDocuments(), fetchVideos()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const addDocument = async (documentData: Omit<Grade10Document, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('grade10_documents')
        .insert(documentData)
        .select()
        .single();

      if (error) throw error;
      
      setDocuments(prev => [data as Grade10Document, ...prev]);
      toast.success('تم إضافة المستند بنجاح');
      return data;
    } catch (error) {
      logger.error('Error adding document', error as Error);
      toast.error('فشل في إضافة المستند');
      throw error;
    }
  };

  const addDocuments = async (documentsData: Omit<Grade10Document, 'id' | 'created_at' | 'updated_at'>[]) => {
    try {
      const { data, error } = await supabase
        .from('grade10_documents')
        .insert(documentsData)
        .select();

      if (error) throw error;
      
      setDocuments(prev => [...(data as Grade10Document[]), ...prev]);
      toast.success(`تم إضافة ${data.length} مستند بنجاح`);
      return data;
    } catch (error) {
      logger.error('Error adding documents', error as Error);
      toast.error('فشل في إضافة المستندات');
      throw error;
    }
  };

  const uploadFile = async (file: File, bucketPath: string) => {
    try {
      logger.debug('Uploading file', {
        fileName: file.name,
        bucketPath,
        fileSize: file.size,
        fileType: file.type
      });

      const { data, error } = await supabase.storage
        .from('grade10-documents')
        .upload(bucketPath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        logger.error('Storage upload error', error, {
          bucketPath,
          fileName: file.name
        });
        
        if (error.message?.includes('Invalid key') || error.message?.includes('key')) {
          throw new Error(`اسم الملف يحتوي على أحرف غير مدعومة. الاسم: ${file.name}`);
        }
        
        throw error;
      }

      logger.info('File uploaded successfully', { path: data.path });
      return data;
    } catch (error) {
      logger.error('Error uploading file', error as Error, {
        fileName: file.name,
        bucketPath
      });
      throw error;
    }
  };

  const getFileUrl = (path: string) => {
    const { data } = supabase.storage
      .from('grade10-documents')
      .getPublicUrl(path);
    return data.publicUrl;
  };

  const addVideo = async (videoData: Omit<Grade10Video, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('grade10_videos')
        .insert(videoData)
        .select()
        .single();

      if (error) throw error;
      
      setVideos(prev => [data as Grade10Video, ...prev]);
      toast.success('تم إضافة الفيديو بنجاح');
      return data;
    } catch (error) {
      logger.error('Error adding video', error as Error);
      toast.error('فشل في إضافة الفيديو');
      throw error;
    }
  };

  const updateDocument = async (id: string, updates: Partial<Grade10Document>) => {
    try {
      const { data, error } = await supabase
        .from('grade10_documents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setDocuments(prev => prev.map(doc => doc.id === id ? data as Grade10Document : doc));
      toast.success('تم تحديث المستند بنجاح');
      return data;
    } catch (error) {
      logger.error('Error updating document', error as Error);
      toast.error('فشل في تحديث المستند');
      throw error;
    }
  };

  const updateVideo = async (id: string, updates: Partial<Grade10Video>) => {
    try {
      const { data, error } = await supabase
        .from('grade10_videos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setVideos(prev => prev.map(video => video.id === id ? data as Grade10Video : video));
      toast.success('تم تحديث الفيديو بنجاح');
      return data;
    } catch (error) {
      logger.error('Error updating video', error as Error);
      toast.error('فشل في تحديث الفيديو');
      throw error;
    }
  };

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

  return {
    documents,
    videos,
    loading,
    addDocument,
    addDocuments,
    addVideo,
    updateDocument,
    updateVideo,
    deleteDocument,
    deleteVideo,
    uploadFile,
    getFileUrl,
    refetch: fetchAll
  };
};