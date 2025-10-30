import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useStudentAssignedGrade } from './useStudentAssignedGrade';
import { logger } from '@/lib/logger';
import { QUERY_KEYS, CACHE_TIMES } from '@/lib/query-keys';

export interface StudentContentItem {
  id: string;
  title: string;
  description?: string;
  content_type: 'video' | 'document' | 'project' | 'lesson';
  grade_level: string;
  category?: string;
  video_category?: string;
  file_path?: string;
  video_url?: string;
  thumbnail_url?: string;
  duration?: string;
  is_visible: boolean;
  is_active: boolean;
  order_index: number;
  created_at: string;
  content?: string; // For lessons
  topic?: any; // For grade 11 lessons
  media?: any[]; // For grade 11 lesson media
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

const mapToContentItem = (item: any, contentType: 'video' | 'document' | 'project' | 'lesson', grade: string): StudentContentItem => {
  return {
    id: String(item.id),
    title: String(item.title || ''),
    description: String(item.description || ''),
    content_type: contentType,
    grade_level: grade,
    category: String(item.category || ''),
    video_category: String(item.video_category || ''), // This will be empty for Grade 12
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

// ⚡ Parallel fetching for Grade 11 (optimized)
const fetchGrade11ContentParallel = async (userId?: string) => {
  const [videosResult, docsResult, lessonsResult] = await Promise.all([
    supabase
      .from('grade11_videos')
      .select('id, title, description, video_url, thumbnail_url, duration, category, is_visible, is_active, order_index, created_at')
      .eq('is_active', true)
      .eq('is_visible', true)
      .order('order_index', { ascending: true }),
    
    supabase
      .from('grade11_documents')
      .select('id, title, description, file_path, category, is_visible, is_active, order_index, created_at')
      .eq('is_active', true)
      .eq('is_visible', true)
      .eq('grade_level', '11')
      .order('order_index', { ascending: true }),
    
    supabase
      .from('grade11_lessons')
      .select(`
        id, title, content, is_active, order_index, created_at,
        topic:grade11_topics(
          id, title,
          section:grade11_sections(id, title)
        ),
        media:grade11_lesson_media(
          id, media_type, file_path, file_name, order_index
        )
      `)
      .eq('is_active', true)
      .order('order_index', { ascending: true })
  ]);

  const videos = videosResult.data?.map(item => mapToContentItem(item, 'video', '11')) || [];
  const documents = docsResult.data?.map(item => mapToContentItem(item, 'document', '11')) || [];
  const lessons = lessonsResult.data?.map((item: any) => {
    const mapped = mapToContentItem(item, 'lesson', '11');
    mapped.content = item.content || '';
    mapped.topic = item.topic;
    mapped.media = item.media || [];
    return mapped;
  }) || [];

  // Get progress data if userId exists
  if (userId) {
    const allItems = [...videos, ...documents, ...lessons];
    const allContentIds = allItems.map(item => item.id);

    if (allContentIds.length > 0) {
      try {
        const { data: progressData } = await supabase
          .from('student_progress')
          .select('content_id, content_type, progress_percentage, completed_at, points_earned, time_spent_minutes')
          .eq('student_id', userId)
          .in('content_id', allContentIds);

        if (progressData) {
          const progressMap = new Map();
          progressData.forEach((p: any) => {
            progressMap.set(`${p.content_id}-${p.content_type}`, {
              progress_percentage: p.progress_percentage,
              completed_at: p.completed_at,
              points_earned: p.points_earned,
              time_spent_minutes: p.time_spent_minutes
            });
          });

          [videos, documents, lessons].forEach(itemArray => {
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
  }

  logger.info(`Grade 11 parallel fetch: ${videos.length} videos, ${documents.length} documents, ${lessons.length} lessons`);
  
  return { videos, documents, lessons };
};

const fetchContentForGrade = async (grade: string, userId?: string): Promise<GradeContent> => {
  // ⚡ Use parallel fetching for Grade 11
  if (grade === '11') {
    const { videos, documents, lessons } = await fetchGrade11ContentParallel(userId);
    return { grade: '11', videos, documents, projects: [], lessons };
  }

  // Original sequential logic for other grades
  let videos: StudentContentItem[] = [];
  let documents: StudentContentItem[] = [];
  let projects: StudentContentItem[] = [];
  let lessons: StudentContentItem[] = [];

  try {
    const videoTable = grade === '10' ? 'grade10_videos' : 'grade12_videos';
    
    console.log(`[DEBUG] Fetching videos for grade ${grade} from table: ${videoTable}`);
    
    let videoQuery = (supabase as any)
      .from(videoTable)
      .select(`
        id, title, description, video_url, thumbnail_url, duration, category, 
        ${grade === '10' ? 'video_category,' : ''} 
        is_visible, is_active, order_index, created_at
      `)
      .eq('is_active', true)
      .eq('is_visible', true)
      .order('order_index', { ascending: true });

    if (grade === '10') {
      videoQuery = videoQuery.eq('grade_level', grade);
    }
    
    const { data: videoData, error: videoError } = await videoQuery;
    
    console.log(`[DEBUG] Grade ${grade} videos from DB:`, videoData);
    console.log(`[DEBUG] Videos error:`, videoError);
    
    if (!videoError && videoData) {
      videos = videoData.map((item: any) => mapToContentItem(item, 'video', grade));
      console.log(`[DEBUG] Mapped videos for grade ${grade}:`, videos);
    }
    
    if (videoError) {
      logger.error(`Error fetching ${videoTable}:`, videoError);
    } else {
      logger.info(`Found ${videos.length} videos for grade ${grade}`);
    }
  } catch (err) {
    logger.warn('Could not fetch videos', { error: err });
  }

  try {
    if (grade === '10') {
      const { data: docData, error: docError } = await (supabase as any)
        .from('grade10_documents')
        .select('id, title, description, file_path, category, is_visible, is_active, order_index, created_at')
        .eq('is_active', true)
        .eq('is_visible', true)
        .eq('grade_level', grade)
        .order('order_index', { ascending: true });
      
      if (!docError && docData) {
        documents = docData.map((item: any) => mapToContentItem(item, 'document', grade));
      }
    }
    
    logger.info(`Found ${documents.length} documents for grade ${grade}`);
  } catch (err) {
    logger.warn('Could not fetch documents', { error: err });
  }

  try {
    if (grade === '10' && userId) {
      const { data: projectData, error: projectError } = await (supabase as any)
        .from('grade10_mini_projects')
        .select('id, title, description, created_at')
        .eq('student_id', userId)
        .order('created_at', { ascending: false });

      if (!projectError && projectData) {
        projects = projectData.map((item: any) => mapToContentItem(item, 'project', grade));
      }
    }
  } catch (err) {
    logger.warn('Could not fetch projects', { error: err });
  }

  try {
    if (grade === '10') {
      const { data: lessonData, error: lessonError } = await (supabase as any)
        .from('grade10_lessons')
        .select(`
          id, title, content, is_active, order_index, created_at,
          topic:grade10_topics(
            id, title,
            section:grade10_sections(id, title)
          ),
          media:grade10_lesson_media(
            id, media_type, file_path, file_name, order_index
          )
        `)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (!lessonError && lessonData) {
        lessons = lessonData.map((item: any) => {
          const mappedItem = mapToContentItem(item, 'lesson', grade);
          mappedItem.content = item.content || '';
          mappedItem.topic = item.topic;
          mappedItem.media = item.media || [];
          return mappedItem;
        });
      }

      if (lessonError) {
        logger.error('Error fetching grade 10 lessons:', lessonError);
      } else {
        logger.info(`Found ${lessons.length} lessons for grade ${grade}`);
      }
    }
    
    logger.info(`Found ${lessons.length} lessons for grade ${grade}`);
  } catch (err) {
    logger.warn('Could not fetch lessons', { error: err });
  }

  // Get progress data
  const allItems = [...videos, ...documents, ...projects, ...lessons];
  const allContentIds = allItems.map(item => item.id);

  if (allContentIds.length > 0 && userId) {
    try {
      const { data: progressData, error: progressError } = await (supabase as any)
        .from('student_progress')
        .select('content_id, content_type, progress_percentage, completed_at, points_earned, time_spent_minutes')
        .eq('student_id', userId)
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

export const useStudentContent = () => {
  const { user, userProfile } = useAuth();
  const { assignedGrade, loading: gradeLoading } = useStudentAssignedGrade();

  console.log(`[DEBUG] useStudentContent - User ID: ${user?.id}, Grade: ${assignedGrade}, Role: ${userProfile?.role}`);

  const {
    data: gradeContent = null,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: QUERY_KEYS.STUDENT.CONTENT(user?.id || '', assignedGrade || ''),
    queryFn: () => fetchContentForGrade(assignedGrade!, user?.id),
    enabled: Boolean(user && userProfile?.role === 'student' && assignedGrade && !gradeLoading),
    staleTime: CACHE_TIMES.LONG, // ⚡ 1 hour cache
    gcTime: CACHE_TIMES.VERY_LONG, // ⚡ 2 hours
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) return false;
      return failureCount < 2;
    },
  });

  console.log(`[DEBUG] useStudentContent result - Content:`, gradeContent, 'Loading:', isLoading, 'Error:', error);

  const loading = isLoading || gradeLoading;

  const getAllContentItems = (): StudentContentItem[] => {
    if (!gradeContent) return [];
    
    // للصف العاشر، لا نحسب documents في معدل التقدم
    // لأن المحتوى المطلوب هو فقط: الفيديوهات + الدروس + الألعاب
    const includeDocuments = assignedGrade !== '10';
    
    return [
      ...gradeContent.videos,
      ...(includeDocuments ? gradeContent.documents : []),
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

  return {
    gradeContent,
    assignedGrade,
    loading,
    error: error?.message || null,
    getAllContentItems,
    getCompletedContentCount,
    getTotalContentCount,
    getProgressPercentage,
    refetch: () => {
      console.log('[DEBUG] Manually refetching student content...');
      return refetch();
    }
  };
};