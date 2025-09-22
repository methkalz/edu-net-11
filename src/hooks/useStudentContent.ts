import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useStudentAssignedGrade } from './useStudentAssignedGrade';
import { logger } from '@/lib/logger';

export interface StudentContentItem {
  id: string;
  title: string;
  description?: string;
  content_type: 'video' | 'document' | 'project' | 'lesson';
  grade_level: string;
  category?: string;
  file_path?: string;
  video_url?: string;
  thumbnail_url?: string;
  duration?: string;
  is_visible: boolean;
  is_active: boolean;
  order_index: number;
  created_at: string;
  progress?: {
    progress_percentage: number;
    completed_at?: string;
    points_earned: number;
    time_spent_minutes: number;
  };
}

export interface GradeContent {
  grade: string;
  videos: StudentContentItem[];
  documents: StudentContentItem[];
  projects: StudentContentItem[];
  lessons: StudentContentItem[];
}

export const useStudentContent = () => {
  const { user, userProfile } = useAuth();
  const { assignedGrade, loading: gradeLoading } = useStudentAssignedGrade();
  const [gradeContent, setGradeContent] = useState<GradeContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapToContentItem = (item: any, contentType: 'video' | 'document' | 'project' | 'lesson', grade: string): StudentContentItem => {
    return {
      id: String(item.id),
      title: String(item.title || ''),
      description: String(item.description || ''),
      content_type: contentType,
      grade_level: grade,
      category: String(item.category || ''),
      file_path: String(item.file_path || ''),
      video_url: String(item.video_url || ''),
      thumbnail_url: String(item.thumbnail_url || ''),
      duration: String(item.duration || ''),
      is_visible: Boolean(item.is_visible),
      is_active: Boolean(item.is_active),
      order_index: Number(item.order_index) || 0,
      created_at: String(item.created_at || '')
    };
  };

  const fetchContentForGrade = async (grade: string): Promise<GradeContent> => {
    let videos: StudentContentItem[] = [];
    let documents: StudentContentItem[] = [];
    let projects: StudentContentItem[] = [];
    let lessons: StudentContentItem[] = [];

    try {
      // Fetch videos using specific table based on grade
      const videoTable = grade === '10' ? 'grade10_videos' : 
                        grade === '11' ? 'grade11_videos' : 'grade12_videos';
      
      let videoQuery = (supabase as any)
        .from(videoTable)
        .select('id, title, description, video_url, thumbnail_url, duration, category, is_visible, is_active, order_index, created_at')
        .eq('is_active', true)
        .eq('is_visible', true)
        .order('order_index', { ascending: true });

      // Only add grade_level filter for grade10 and grade11 videos (grade12_videos doesn't have this column)
      if (grade === '10' || grade === '11') {
        videoQuery = videoQuery.eq('grade_level', grade);
      }
      
      const { data: videoData, error: videoError } = await videoQuery;
      
      if (!videoError && videoData) {
        videos = videoData.map((item: any) => mapToContentItem(item, 'video', grade));
      }
      
      logger.info(`Found ${videos.length} videos for grade ${grade}`);
    } catch (err) {
      logger.warn('Could not fetch videos', { error: err });
    }

    try {
      // Fetch documents for grades 10 and 11
      if (grade === '10' || grade === '11') {
        const docTable = grade === '10' ? 'grade10_documents' : 'grade11_documents';
        
        let docQuery = (supabase as any)
          .from(docTable)
          .select('id, title, description, file_path, category, is_visible, is_active, order_index, created_at')
          .eq('is_active', true)
          .eq('is_visible', true)
          .order('order_index', { ascending: true });

        // Add grade_level filter for documents (they have this column)
        docQuery = docQuery.eq('grade_level', grade);
        
        const { data: docData, error: docError } = await docQuery;
        
        if (!docError && docData) {
          documents = docData.map((item: any) => mapToContentItem(item, 'document', grade));
        }
      }
      
      logger.info(`Found ${documents.length} documents for grade ${grade}`);
    } catch (err) {
      logger.warn('Could not fetch documents', { error: err });
    }

    try {
      // Fetch projects for grade 10
      if (grade === '10' && user) {
        const { data: projectData, error: projectError } = await (supabase as any)
          .from('grade10_mini_projects')
          .select('id, title, description, created_at')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false });

        if (!projectError && projectData) {
          projects = projectData.map((item: any) => mapToContentItem(item, 'project', grade));
        }
      }
    } catch (err) {
      logger.warn('Could not fetch projects', { error: err });
    }

    try {
      // Fetch lessons for grade 11
      if (grade === '11') {
        const { data: lessonData, error: lessonError } = await (supabase as any)
          .from('grade11_lessons')
          .select('id, title, description, is_active, order_index, created_at')
          .eq('grade_level', grade)
          .eq('is_active', true)
          .order('order_index', { ascending: true });

        if (!lessonError && lessonData) {
          lessons = lessonData.map((item: any) => mapToContentItem(item, 'lesson', grade));
        }
      }
      
      logger.info(`Found ${lessons.length} lessons for grade ${grade}`);
    } catch (err) {
      logger.warn('Could not fetch lessons', { error: err });
    }

    // Get progress data
    const allItems = [...videos, ...documents, ...projects, ...lessons];
    const allContentIds = allItems.map(item => item.id);

    if (allContentIds.length > 0 && user) {
      try {
        const { data: progressData, error: progressError } = await (supabase as any)
          .from('student_progress')
          .select('content_id, content_type, progress_percentage, completed_at, points_earned, time_spent_minutes')
          .eq('student_id', user.id)
          .in('content_id', allContentIds);

        if (!progressError && progressData) {
          const progressMap = new Map();
          progressData.forEach((p: any) => {
            progressMap.set(`${p.content_id}-${p.content_type}`, {
              progress_percentage: p.progress_percentage,
              completed_at: p.completed_at,
              points_earned: p.points_earned,
              time_spent_minutes: p.time_spent_minutes
            });
          });

          // Add progress to items
          [videos, documents, projects, lessons].forEach(itemArray => {
            itemArray.forEach(item => {
              const progressKey = `${item.id}-${item.content_type}`;
              if (progressMap.has(progressKey)) {
                item.progress = progressMap.get(progressKey);
              }
            });
          });
        }
      } catch (err) {
        logger.warn('Could not fetch progress data', { error: err });
      }
    }

    return {
      grade,
      videos,
      documents,
      projects,
      lessons
    };
  };

  const fetchAssignedGradeContent = async () => {
    if (!user || userProfile?.role !== 'student' || !assignedGrade || gradeLoading) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const content = await fetchContentForGrade(assignedGrade);
      setGradeContent(content);

      logger.info('Student content loaded successfully', { 
        grade: assignedGrade,
        contentCount: content.videos.length + content.documents.length + 
                     content.projects.length + content.lessons.length
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في تحميل المحتوى التعليمي';
      setError(errorMessage);
      logger.error('Error fetching student content', err as Error);
    } finally {
      setLoading(false);
    }
  };

  const getAllContentItems = (): StudentContentItem[] => {
    if (!gradeContent) return [];
    
    return [
      ...gradeContent.videos,
      ...gradeContent.documents,
      ...gradeContent.projects,
      ...gradeContent.lessons
    ];
  };

  const getCompletedContentCount = (): number => {
    return getAllContentItems().filter(item => 
      item.progress?.progress_percentage === 100
    ).length;
  };

  const getTotalContentCount = (): number => {
    return getAllContentItems().length;
  };

  const getProgressPercentage = (): number => {
    const total = getTotalContentCount();
    const completed = getCompletedContentCount();
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  useEffect(() => {
    if (!gradeLoading && assignedGrade) {
      fetchAssignedGradeContent();
    }
  }, [user, userProfile, assignedGrade, gradeLoading]);

  return {
    gradeContent,
    assignedGrade,
    loading: loading || gradeLoading,
    error,
    getAllContentItems,
    getCompletedContentCount,
    getTotalContentCount,
    getProgressPercentage,
    refetch: fetchAssignedGradeContent
  };
};