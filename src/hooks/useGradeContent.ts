import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export const useGradeContent = () => {
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // حالة البيانات
  const [lessons, setLessons] = useState([]);
  const [videos, setVideos] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);

  // جلب الكورسات
  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      logger.error('Error fetching courses', error as Error);
      toast({
        title: "خطأ في جلب البيانات",
        description: "فشل في جلب الكورسات",
        variant: "destructive",
      });
    }
  };

  // جلب الدروس
  const fetchLessons = async (courseId?: string) => {
    try {
      let query = supabase
        .from('lessons')
        .select('*')
        .order('order_index', { ascending: true });

      if (courseId) {
        query = query.eq('course_id', courseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      logger.error('Error fetching lessons', error as Error);
      toast({
        title: "خطأ في جلب البيانات",
        description: "فشل في جلب الدروس",
        variant: "destructive",
      });
    }
  };

  // جلب المشاريع
  const fetchProjects = async (courseId?: string) => {
    try {
      let query = supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (courseId) {
        query = query.eq('course_id', courseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      logger.error('Error fetching projects', error as Error);
      toast({
        title: "خطأ في جلب البيانات",
        description: "فشل في جلب المشاريع",
        variant: "destructive",
      });
    }
  };

  // جلب الامتحانات
  const fetchExams = async (courseId?: string) => {
    try {
      let query = supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });

      if (courseId) {
        query = query.eq('course_id', courseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setExams(data || []);
    } catch (error) {
      logger.error('Error fetching exams', error as Error);
      toast({
        title: "خطأ في جلب البيانات",
        description: "فشل في جلب الامتحانات",
        variant: "destructive",
      });
    }
  };

  // جلب الملفات (فيديوهات ومستندات)
  const fetchFiles = async (kind?: 'video' | 'document', courseId?: string) => {
    try {
      let query = supabase
        .from('files')
        .select('*')
        .order('created_at', { ascending: false });

      if (kind) {
        query = query.eq('kind', kind);
      }

      const { data, error } = await query;
      if (error) throw error;

      const filesData = data || [];
      
      if (kind === 'video') {
        setVideos(filesData);
      } else if (kind === 'document') {
        setDocuments(filesData);
      }

      return filesData;
    } catch (error) {
      logger.error('Error fetching files', error as Error);
      toast({
        title: "خطأ في جلب البيانات",
        description: "فشل في جلب الملفات",
        variant: "destructive",
      });
      return [];
    }
  };

  // إضافة درس جديد
  const addLesson = async (lessonData: any) => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .insert([lessonData])
        .select()
        .single();

      if (error) throw error;

      setLessons(prev => [data, ...prev]);
      toast({
        title: "تم بنجاح",
        description: "تم إضافة الدرس بنجاح",
      });

      return data;
    } catch (error) {
      logger.error('Error adding lesson', error as Error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة الدرس",
        variant: "destructive",
      });
      throw error;
    }
  };

  // إضافة مشروع جديد
  const addProject = async (projectData: any) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([projectData])
        .select()
        .single();

      if (error) throw error;

      setProjects(prev => [data, ...prev]);
      toast({
        title: "تم بنجاح",
        description: "تم إضافة المشروع بنجاح",
      });

      return data;
    } catch (error) {
      logger.error('Error adding project', error as Error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة المشروع",
        variant: "destructive",
      });
      throw error;
    }
  };

  // إضافة امتحان جديد
  const addExam = async (examData: any) => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .insert([examData])
        .select()
        .single();

      if (error) throw error;

      setExams(prev => [data, ...prev]);
      toast({
        title: "تم بنجاح",
        description: "تم إضافة الامتحان بنجاح",
      });

      return data;
    } catch (error) {
      logger.error('Error adding exam', error as Error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة الامتحان",
        variant: "destructive",
      });
      throw error;
    }
  };

  // إضافة ملف جديد
  const addFile = async (fileData: any) => {
    try {
      // تحضير البيانات بالحقول الصحيحة فقط
      const correctFileData = {
        kind: fileData.kind, // 'video' أو 'document'
        file_name: fileData.title || fileData.file_name,
        file_path: fileData.video_url || fileData.file_path,
        owner_user_id: fileData.owner_user_id,
        school_id: fileData.school_id,
        lesson_id: fileData.lesson_id || null,
        project_id: fileData.project_id || null,
        file_size: fileData.file_size || null,
        is_public: fileData.is_public || false,
        metadata: {
          ...fileData.metadata,
          title: fileData.title,
          description: fileData.description,
          video_url: fileData.video_url,
          duration: fileData.duration,
          source_type: fileData.source_type
        }
      };

      const { data, error } = await supabase
        .from('files')
        .insert([correctFileData])
        .select()
        .single();

      if (error) throw error;

      if (fileData.kind === 'video') {
        setVideos(prev => [data, ...prev]);
      } else if (fileData.kind === 'document') {
        setDocuments(prev => [data, ...prev]);
      }

      toast({
        title: "تم بنجاح",
        description: "تم إضافة الملف بنجاح",
      });

      return data;
    } catch (error) {
      logger.error('Error adding file', error as Error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة الملف",
        variant: "destructive",
      });
      throw error;
    }
  };

  // تحديث درس
  const updateLesson = async (id: string, lessonData: any) => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .update(lessonData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setLessons(prev => prev.map(lesson => 
        lesson.id === id ? data : lesson
      ));

      toast({
        title: "تم بنجاح",
        description: "تم تحديث الدرس بنجاح",
      });

      return data;
    } catch (error) {
      logger.error('Error updating lesson', error as Error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث الدرس",
        variant: "destructive",
      });
      throw error;
    }
  };

  // حذف درس
  const deleteLesson = async (id: string) => {
    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setLessons(prev => prev.filter(item => item.id !== id));
      toast({
        title: "تم بنجاح",
        description: "تم حذف الدرس بنجاح",
      });
    } catch (error) {
      logger.error('Error deleting lesson', error as Error);
      toast({
        title: "خطأ",
        description: "فشل في حذف الدرس",
        variant: "destructive",
      });
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

      setProjects(prev => prev.filter(item => item.id !== id));
      toast({
        title: "تم بنجاح",
        description: "تم حذف المشروع بنجاح",
      });
    } catch (error) {
      logger.error('Error deleting project', error as Error);
      toast({
        title: "خطأ",
        description: "فشل في حذف المشروع",
        variant: "destructive",
      });
      throw error;
    }
  };

  // حذف امتحان
  const deleteExam = async (id: string) => {
    try {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setExams(prev => prev.filter(item => item.id !== id));
      toast({
        title: "تم بنجاح",
        description: "تم حذف الامتحان بنجاح",
      });
    } catch (error) {
      logger.error('Error deleting exam', error as Error);
      toast({
        title: "خطأ",
        description: "فشل في حذف الامتحان",
        variant: "destructive",
      });
      throw error;
    }
  };

  // حذف ملف
  const deleteFile = async (id: string, kind: 'video' | 'document') => {
    try {
      const { error } = await supabase
        .from('files')
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (kind === 'video') {
        setVideos(prev => prev.filter(item => item.id !== id));
      } else {
        setDocuments(prev => prev.filter(item => item.id !== id));
      }

      toast({
        title: "تم بنجاح",
        description: "تم حذف الملف بنجاح",
      });
    } catch (error) {
      logger.error('Error deleting file', error as Error);
      toast({
        title: "خطأ",
        description: "فشل في حذف الملف",
        variant: "destructive",
      });
      throw error;
    }
  };

  // تحميل البيانات الأولية
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchCourses(),
          fetchLessons(),
          fetchProjects(),
          fetchExams(),
          fetchFiles('video'),
          fetchFiles('document')
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  return {
    // البيانات
    lessons,
    videos,
    documents,
    projects,
    exams,
    courses,
    loading,

    // الدوال
    fetchLessons,
    fetchProjects,
    fetchExams,
    fetchFiles,
    fetchCourses,
    addLesson,
    addProject,
    addExam,
    addFile,
    updateLesson,
    deleteLesson,
    deleteProject,
    deleteExam,
    deleteFile,
  };
};