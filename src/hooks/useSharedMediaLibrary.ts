import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export interface SharedMediaFile {
  id: string;
  file_name: string;
  file_path: string;
  media_type: 'video' | 'image' | 'lottie' | 'code';
  metadata?: any;
  created_at: string;
  updated_at: string;
  lesson_id?: string;
  section_id?: string;
  topic_id?: string;
  usage_count?: number;
}

export interface MediaLibraryFilters {
  mediaType?: 'video' | 'image' | 'lottie' | 'code';
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const useSharedMediaLibrary = () => {
  const [mediaFiles, setMediaFiles] = useState<SharedMediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // جلب جميع ملفات الوسائط المشتركة
  const fetchSharedMedia = async (filters?: MediaLibraryFilters) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('grade11_lesson_media')
        .select(`
          id,
          file_name,
          file_path,
          media_type,
          metadata,
          created_at,
          order_index,
          lesson_id,
          grade11_lessons!inner(
            title,
            topic_id,
            grade11_topics!inner(
              title,
              section_id,
              grade11_sections!inner(
                title
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      // تطبيق الفلاتر
      if (filters?.mediaType) {
        query = query.eq('media_type', filters.mediaType);
      }

      if (filters?.search) {
        query = query.ilike('file_name', `%${filters.search}%`);
      }

      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      // حساب عدد الاستخدامات لكل ملف
      const mediaWithUsage = await Promise.all(
        (data || []).map(async (file) => {
          const { count } = await supabase
            .from('grade11_lesson_media')
            .select('id', { count: 'exact' })
            .eq('file_path', file.file_path);

          return {
            id: file.id,
            file_name: file.file_name,
            file_path: file.file_path,
            media_type: file.media_type,
            metadata: file.metadata,
            created_at: file.created_at,
            updated_at: file.created_at, // Use created_at as fallback
            lesson_id: file.lesson_id,
            section_id: file.grade11_lessons?.grade11_topics?.grade11_sections?.title || '',
            topic_id: file.grade11_lessons?.topic_id || '',
            usage_count: count || 1
          };
        })
      );

      setMediaFiles(mediaWithUsage);
      
    } catch (error) {
      logger.error('Error fetching shared media', error as Error);
      setError('فشل في تحميل ملفات الوسائط');
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل ملفات الوسائط المشتركة',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // البحث في الملفات
  const searchMedia = async (searchTerm: string, mediaType?: string) => {
    const filters: MediaLibraryFilters = {
      search: searchTerm
    };

    if (mediaType && mediaType !== 'all') {
      filters.mediaType = mediaType as any;
    }

    await fetchSharedMedia(filters);
  };

  // الحصول على الملفات حسب النوع
  const getMediaByType = (type: 'video' | 'image' | 'lottie' | 'code') => {
    return mediaFiles.filter(file => file.media_type === type);
  };

  // الحصول على الملفات الأكثر استخداماً
  const getMostUsedMedia = (limit: number = 10) => {
    return mediaFiles
      .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
      .slice(0, limit);
  };

  // الحصول على الملفات الأحدث
  const getRecentMedia = (limit: number = 10) => {
    return mediaFiles
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  };

  // إضافة ملف إلى درس (نسخ مرجع)
  const addMediaToLesson = async (mediaFile: SharedMediaFile, lessonId: string) => {
    try {
      const { error } = await supabase
        .from('grade11_lesson_media')
        .insert({
          lesson_id: lessonId,
          file_name: mediaFile.file_name,
          file_path: mediaFile.file_path,
          media_type: mediaFile.media_type,
          metadata: mediaFile.metadata,
          order_index: 0
        });

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم إضافة الملف للدرس بنجاح'
      });

      // تحديث عداد الاستخدام
      await fetchSharedMedia();

      return true;
    } catch (error) {
      logger.error('Error adding media to lesson', error as Error);
      toast({
        title: 'خطأ',
        description: 'فشل في إضافة الملف للدرس',
        variant: 'destructive'
      });
      return false;
    }
  };

  // حذف جميع مراجع ملف معين
  const deleteSharedMedia = async (filePath: string) => {
    try {
      const { error } = await supabase
        .from('grade11_lesson_media')
        .delete()
        .eq('file_path', filePath);

      if (error) throw error;

      toast({
        title: 'تم الحذف',
        description: 'تم حذف الملف من جميع الدروس'
      });

      await fetchSharedMedia();
      return true;
    } catch (error) {
      logger.error('Error deleting shared media', error as Error);
      toast({
        title: 'خطأ',
        description: 'فشل في حذف الملف',
        variant: 'destructive'
      });
      return false;
    }
  };

  // الحصول على معلومات استخدام ملف
  const getMediaUsageInfo = async (filePath: string) => {
    try {
      const { data, error } = await supabase
        .from('grade11_lesson_media')
        .select(`
          lesson_id,
          grade11_lessons!inner(
            title,
            topic_id,
            grade11_topics!inner(
              title,
              section_id,
              grade11_sections!inner(
                title
              )
            )
          )
        `)
        .eq('file_path', filePath);

      if (error) throw error;

      return data?.map(item => ({
        lessonId: item.lesson_id,
        lessonTitle: item.grade11_lessons?.title || 'درس غير محدد',
        topicTitle: item.grade11_lessons?.grade11_topics?.title || 'موضوع غير محدد',
        sectionTitle: item.grade11_lessons?.grade11_topics?.grade11_sections?.title || 'قسم غير محدد'
      })) || [];
    } catch (error) {
      logger.error('Error getting media usage info', error as Error);
      return [];
    }
  };

  useEffect(() => {
    fetchSharedMedia();
  }, []);

  return {
    mediaFiles,
    loading,
    error,
    fetchSharedMedia,
    searchMedia,
    getMediaByType,
    getMostUsedMedia,
    getRecentMedia,
    addMediaToLesson,
    deleteSharedMedia,
    getMediaUsageInfo
  };
};